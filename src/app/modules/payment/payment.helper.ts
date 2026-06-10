/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import AppError from '../../utils/AppError';
import JobRequest from '../jobRequest/jobRequest.model';
import MySubscription from '../mySubscription/mySubscription.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import User from '../user/user.model';
import Payment from './payment.model';

const handleMySubscriptionAndPayment = async ({
  session,
  mySubscriptionBody,
  subscriptionPaymentBody,
  companyId,
  subscription,
}: any) => {
  const findMySubscription = await MySubscription.findOne({
    userId: companyId,
  });

  const findUser = await User.findOne({
    _id: companyId,
  });

  if (findMySubscription) {
    await MySubscription.findOneAndUpdate(
      { userId: companyId },
      {
        $set: {
          expiryIn: new Date(
            findMySubscription.expiryIn.getTime() +
              subscription.timeline * 24 * 60 * 60 * 1000,
          ),
          remainingDrivers:
            findMySubscription.remainingDrivers + subscription.numberOfDriver,
        },
      },
      { new: true, session },
    );

    findUser!.isSubscribed = true;
    await findUser?.save({ session });
  } else {
    const mySubscription = await MySubscription.create([mySubscriptionBody], {
      session,
    });
    if (!mySubscription)
      throw new AppError(httpStatus.BAD_REQUEST, 'My Subscription not created');
  }

  await Payment.create([subscriptionPaymentBody], { session });
};

// Helper function to create payment body
const createPaymentBody = ({
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
}: any) => {
  return {
    userId,
    driverId,
    jobRequestId,
    subscriptionId,
    companyId,
    amount: earnFrom === 'subscription' ? Number(price) : Number(amount),
    paymentType,
    paymentId:
      paymentIntentId || `pi_${crypto.randomBytes(16).toString('hex')}`,
    paymentDate: new Date(),
    paymentStatus: earnFrom === 'subscription' ? 'completed' : 'pending',
    earnFrom,
  };
};

// Helper function to create subscription body
const createMySubscriptionBody = ({
  companyId,
  subscription,
  subscriptionId,
}: any) => {
  return {
    userId: companyId,
    subscriptionId,
    expiryIn: new Date(
      Date.now() + subscription.timeline * 24 * 60 * 60 * 1000,
    ),
    remainingDrivers: subscription.numberOfDriver,
  };
};

// Helper function to handle non-subscription payment
const handleNonSubscriptionPayment = async ({
  session,
  paymentBody,
  driverId,
  userId,
  amount,
}: any) => {
  const findJobReQuest = await JobRequest.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(paymentBody.jobRequestId)),
      },
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'jobs',
      },
    },
    {
      $unwind: {
        path: '$jobs',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'services',
        localField: 'jobs.service',
        foreignField: '_id',
        as: 'jobs.service',
      },
    },
    {
      $unwind: {
        path: '$jobs.service',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'services',
        localField: 'jobs.extraService',
        foreignField: '_id',
        as: 'jobs.extraService',
        pipeline: [
          {
            $lookup: {
              from: 'services',
              localField: 'service',
              foreignField: '_id',
              as: 'service',
            },
          },
          {
            $unwind: {
              path: '$service',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },
    {
      $project: {
        totalCoset: '$jobs.totalCost',
        jobId: '$jobs._id',
        serviceId: '$jobs.service._id',
        service: '$jobs.service',
        extraService: '$jobs.extraService',
      },
    },
  ]);

  const paymentData = {
    userId: paymentBody.userId,
    driverId: paymentBody.driverId,
    jobRequestId: paymentBody.jobRequestId,
    companyId: paymentBody.companyId,
    amount: paymentBody.amount,
    paymentType: paymentBody.paymentType,
    paymentId: paymentBody.paymentId,
    paymentDate: paymentBody.paymentDate,
    paymentStatus: paymentBody.paymentStatus,
    earnFrom: paymentBody.earnFrom,
    serviceId: findJobReQuest[0]?.serviceId,
    jobId: findJobReQuest[0]?.jobId,
  };

  const payment = await Payment.create([paymentData], { session });
  if (!payment)
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment not created');

  const notificationBody = {
    senderId: userId,
    role: 'customer',
    receiverId: driverId,
    message: `Payment of $${amount} is received`,
    type: NOTIFICATION_TYPE.payment,
    linkId: payment[0]._id as any,
    data: findJobReQuest[0],
  };
  await sendNotification({ userId }, notificationBody);
};

export const PaymentHelper = {
  createPaymentBody,
  createMySubscriptionBody,
  handleNonSubscriptionPayment,
  handleMySubscriptionAndPayment,
};
