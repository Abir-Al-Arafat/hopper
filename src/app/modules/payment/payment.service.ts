/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import { USER_ROLE } from '../../constant';
import { months, StatisticHelper } from '../../helper/staticsHelper';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Job from '../job/job.model';
import { TJobRequest } from '../jobRequest/jobRequest.interface';
import JobRequest from '../jobRequest/jobRequest.model';
import { TSubscription } from '../subscription/subscription.interface';
import Subscription from '../subscription/subscription.model';
import { SubscriptionService } from '../subscription/subscription.service';
import User from '../user/user.model';
import { PaymentHelper } from './payment.helper';
import { TPayment } from './payment.interface';
import Payment from './payment.model';
import { createCheckoutSession } from './payment.utils';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import sendNotification from '../../../socket/sendNotification';

const makePayment = async (
  data: Partial<TPayment | TSubscription | any>,
  user: TAuthUser,
) => {
  const { amount, ...payload } = data;

  let paymentData = {} as any;

  const jobRequest = (await JobRequest.findById(
    payload.jobRequestId,
  )) as TJobRequest;

  const findDriver = await User.findById(jobRequest?.driver);

  const findJob = await Job.findOne({ _id: jobRequest?.jobId });

  let subscription;
  if (payload.subscriptionId) {
    subscription = await Subscription.findById(payload.subscriptionId);
    paymentData.subscriptionId = payload.subscriptionId;
    paymentData.price = Number(subscription?.price?.toFixed(2));
    payload.companyId = user.userId as any;
    payload.price = Number(subscription?.price?.toFixed(2));

    if (!subscription)
      throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  } else {
    if (!findJob) throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
    if (!findDriver)
      throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
    if (!jobRequest)
      throw new AppError(httpStatus.NOT_FOUND, 'Job request not found');

    payload.driverId = jobRequest?.driver;
    payload.companyId = findDriver?.assignedCompany;
    payload.userId = user.userId as any;
  }

  paymentData = {
    ...payload,
    amount: Number(amount) || 0,
    paymentDate: new Date(),
  };

  const result = await createCheckoutSession(paymentData as any, user);

  return result;
};

const confirmPayment = async (query: Record<string, unknown>) => {
  const {
    companyId,
    driverId,
    jobRequestId,
    paymentType,
    subscriptionId,
    userId,
    amount,
    price,
    earnFrom,
    paymentIntentId,
  } = query;

  const paymentId = `pi_${crypto.randomBytes(16).toString('hex')}`;
  const session = await mongoose.startSession();
  console.log('Payment confirmation started for paymentId:', userId);
  try {
    session.startTransaction();
    const paymentBody = PaymentHelper.createPaymentBody({
      companyId,
      driverId,
      jobRequestId,
      paymentType,
      userId,
      amount,
      price,
      earnFrom,
      paymentIntentId,
      subscriptionId,
    });

    const subscriptionPaymentBody = {
      paymentType,
      userId: companyId,
      paymentId,
      amount: amount || price,
      earnFrom,
      subscriptionId,
      paymentStatus: 'completed',
      paymentDate: new Date(),
    };

    if (earnFrom === 'subscription' && subscriptionId) {
      const subscription = await SubscriptionService.getSubscription(
        subscriptionId as string,
      );
      const mySubscriptionBody = PaymentHelper.createMySubscriptionBody({
        companyId,
        subscription,
        subscriptionId,
      });

      await PaymentHelper.handleMySubscriptionAndPayment({
        session,
        mySubscriptionBody,
        subscriptionPaymentBody,
        companyId,
        subscription,
      });
      await User.findByIdAndUpdate(
        new mongoose.Types.ObjectId(companyId as string),
        { $set: { isSubscribed: true } },
        { session },
      );
    } else {
      await PaymentHelper.handleNonSubscriptionPayment({
        session,
        paymentBody,
        driverId,
        userId,
        amount,
      });
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error);
  }
};

const earningStatistic = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const { startDate, endDate } = StatisticHelper.statisticHelper(
    query.year as string,
  );

  const hopperCompany = await User.findOne({
    role: USER_ROLE.hopperCompany,
  });

  if (user.role === USER_ROLE.admin) {
    user.myCompany = hopperCompany?.myCompany as any;
  }

  // Aggregation pipeline
  const monthlyCounts = await Payment.aggregate([
    {
      $match: {
        $and: [
          {
            $and: [
              {
                createdAt: { $gte: startDate, $lt: endDate },
              },
              {
                companyId: new mongoose.Types.ObjectId(String(user.myCompany)),
              },
            ],
          },
          { paymentStatus: 'completed' },
        ],
      },
    },
    {
      $project: {
        month: { $month: '$createdAt' },
        amount: 1,
      },
    },
    {
      $group: {
        _id: '$month',
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // eslint-disable-next-line no-unused-vars
  const monthlyData = months.map((month) => ({
    name: month,
    amount: 0,
  }));

  // Assign the aggregated values to the appropriate month
  monthlyCounts.forEach((item: any) => {
    const monthIndex = item._id - 1; // Months are 1-indexed (1 = Jan, 2 = Feb, etc.)
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyData[monthIndex].amount = item.totalAmount;
    }
  });

  return monthlyData;
};

const paymentList = async (user: TAuthUser, query: Record<string, unknown>) => {
  const paymentAggregation = new AggregationQueryBuilder(query);

  let matchStage = {};
  if (user.role !== USER_ROLE.admin) {
    matchStage = {
      $match: {
        companyId: new mongoose.Types.ObjectId(String(user.myCompany)),
      },
    };
  } else {
    matchStage = {
      $match: {},
    };
  }

  const result = await paymentAggregation
    .customPipeline([
      matchStage,
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'profiles',
          localField: 'user.profile',
          foreignField: '_id',
          as: 'profile',
        },
      },

      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: 'jobrequests',
          localField: 'jobRequestId',
          foreignField: '_id',
          as: 'jobRequest',
        },
      },
      {
        $unwind: {
          path: '$jobRequest',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobRequest.jobId',
          foreignField: '_id',
          as: 'job',
        },
      },
      {
        $unwind: {
          path: '$job',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          userId: '$user._id',
          image: '$profile.image',
          date: '$createdAt',
          category: '$job.categoryName',
          serviceName: '$job.serviceName',
          amount: 1,
          transactionId: '$paymentId',
          paymentType: 1,
          paymentStatus: 1,
        },
      },
    ])
    .sort()
    .search(['name'])
    .filter(['paymentStatus'])
    .paginate()
    .execute(Payment);

  const meta = await paymentAggregation.countTotal(Payment);

  return { meta, result };
};

const paymentAction = async (
  user: TAuthUser,
  payload: {
    paymentId: string;
    action: 'completed' | 'failed';
  },
) => {
  const result = (await Payment.findOneAndUpdate(
    { _id: payload.paymentId },
    {
      $set: {
        paymentStatus: payload.action,
      },
    },
    {
      new: true,
    },
  )) as any;

  const detailsData = await Payment.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(payload.paymentId)),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driver',
      },
    },
    {
      $unwind: { path: '$driver', preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: 'profiles',
        localField: 'driver.profile',
        foreignField: '_id',
        as: 'driverProfile',
      },
    },
    { $unwind: { path: '$driverProfile', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        driverName: '$driver.name',
        driverImage: '$driverProfile.image',
      },
    },
  ]);

  const notificationBody = {
    senderId: user.userId,
    role: user.role,
    receiverId: result?.userId as any,
    message: `Your payment has been ${payload.action}`,
    type: NOTIFICATION_TYPE.paymentConfirm,
    linkId: result?._id as any,
    data: { ...result?._doc, detailsData: detailsData[0] },
  };
  await sendNotification(user, notificationBody);

  return result;
};
const unpaidJobRequestList = async (user: TAuthUser) => {
  const matchStage: any = {
    status: 'completed',
  };

  if (user.role === USER_ROLE.driver) {
    matchStage.driver = new mongoose.Types.ObjectId(user.userId);
  } else if (user.role === USER_ROLE.customer) {
    matchStage.customer = new mongoose.Types.ObjectId(user.userId);
  }

  const result = await JobRequest.aggregate([
    {
      $match: matchStage,
    },

    // 🔗 Payment join
    {
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'jobRequestId',
        as: 'payment',
      },
    },

    // ❗ only unpaid (no payment found)
    {
      $match: {
        payment: { $size: 0 },
      },
    },

    // 🔗 populate job
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job',
      },
    },
    { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },

    // 🔗 driver
    {
      $lookup: {
        from: 'users',
        localField: 'driver',
        foreignField: '_id',
        as: 'driver',
      },
    },
    { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },

    // 🔗 customer
    {
      $lookup: {
        from: 'users',
        localField: 'customer',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id: 1,
        jobId: 1,
        job: 1,

        driver: 1,
        customer: 1,

        status: 1,
        completedAt: 1,
        driverCommission: 1,

        // ✅ FIX
        paymentInfo: { $literal: {} },
      },
    },
  ]);

  return result;
};

export const PaymentService = {
  paymentList,
  makePayment,
  confirmPayment,
  earningStatistic,
  paymentAction,
  unpaidJobRequestList,
};
