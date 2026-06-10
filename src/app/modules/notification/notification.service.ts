/* eslint-disable @typescript-eslint/no-explicit-any */
import admin, { ServiceAccount } from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import serviceAccount from '../../../../hopperroadside.json';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import JobRequest from '../jobRequest/jobRequest.model';
import Payment from '../payment/payment.model';
import User from '../user/user.model';
import { NOTIFICATION_TYPE, TNotification } from './notification.interface';
import Notification from './notification.model';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createNotification = async (payload: Partial<TNotification>) => {
  const findUser = await User.findOne({ _id: payload.receiverId });

  console.log(findUser, 'findUser ==============>');
  if (findUser && findUser.fcmToken && findUser.fcmToken.trim() !== '') {
    const receivedToken = findUser.fcmToken;

    const message = {
      notification: {
        title: payload.message,
        // body: payload.message,
      },
      token: receivedToken,
    };

    getMessaging()
      .send(message)
      .then((response) => {
        console.log(
          'Successfully sent message >>>>>>>>>>>>>>>>>>>>>>>>>',
          response,
        );
      })
      .catch((error) => {
        console.log(
          'Error sending message: >>>>>>>>>>>>>>>>>>>>>>>>>>>',
          error,
        );
      });
  }

  console.log(payload, "notifiaction payload ====================>");

  const notification = new Notification(payload);
  await notification.save();
  return notification;
};

const getNotifications = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const notificationQuery = new AggregationQueryBuilder(query);

  const result = await notificationQuery
    .customPipeline([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(String(user.userId)),
        },
      },
    ])
    .paginate()
    .sort()
    .execute(Notification);

  const meta = await notificationQuery.countTotal(Notification);
  return { meta, result };
};

const getNotificationCount = async (user: TAuthUser) => {
  const result = await Notification.countDocuments({
    receiverId: user.userId,
    isRead: false,
  }).countDocuments();
  return result;
};

const notificationAction = async (user: TAuthUser) => {
  const findNotification = await Notification.find({
    receiverId: user.userId,
    isRead: false,
  });

  if (findNotification.length > 0) {
    Promise.all(
      findNotification.map(async (notification) => {
        notification.isRead = true;
        await notification.save();
      }),
    );
  }
};

const singleNotification = async (notificationId: string) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (notification?.type === NOTIFICATION_TYPE.acceptedJob) {
    const acceptedJob = await JobRequest.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(String(notification.linkId)),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'driver',
          foreignField: '_id',
          as: 'driver',
        },
      },
      { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'profiles',
          localField: 'driver.profile',
          foreignField: '_id',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'vehicles',
          localField: 'driver._id',
          foreignField: 'userId',
          as: 'vehicle',
        },
      },
      { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          driver: {
            _id: '$driver._id',
            name: '$driver.name',
            email: '$driver.email',
            phone: '$driver.phone',
            role: '$driver.role',
            isVerified: '$driver.isVerified',
            isActive: '$driver.isActive',
            createdAt: '$driver.createdAt',
            updatedAt: '$driver.updatedAt',
            location: '$driver.location',
            fcmToken: '$driver.fcmToken',
            profile: '$profile',
          },
          vehicle: 1,
        },
      },
    ]);

    return {
      ...notification.toObject(),
      data: acceptedJob[0],
    };
  }

  if (notification?.type === NOTIFICATION_TYPE.payment) {
    const data = await Payment.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(String(notification?.linkId)),
        },
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          totalCoset: '$job.totalCost',
          jobId: '$job._id',
          serviceId: '$job.service',
        },
      },
    ]);

    return {
      ...notification.toObject(),
      data: data[0],
    };
  }

  if (notification?.type === NOTIFICATION_TYPE.paymentConfirm) {
    const data = await Payment.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(String(notification?.linkId)),
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
          jobRequestId: 1,
          subscriptionId: 1,
          userId: 1,
          driverId: 1,
          companyId: 1,
          jobId: 1,
          serviceId: 1,
          paymentType: 1,
          paymentStatus: 1,
          amount: 1,
          createdAt: 1,
          updatedAt: 1,
          paymentId: 1,
          earnFrom: 1,
          detailsData: {
            driverName: '$driver.name',
            driverImage: '$driverProfile.image',
          },
        },
      },
    ]);

    return {
      ...notification.toObject(),
      data: data[0],
    };
  }

  if (
    notification?.type === NOTIFICATION_TYPE.jobRequest ||
    NOTIFICATION_TYPE.completedJob
  ) {
    const data = await JobRequest.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(String(notification?.linkId)),
        },
      },
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'jobData',
        },
      },
      { $unwind: { path: '$jobData', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'services',
          localField: 'jobData.service',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          jobRequest: {
            _id: '$_id',
            jobId: '$jobData._id',
            driver: '$driver',
            company: '$company',
            customer: '$customer',
            driverCommission: '$driverCommission',
            isDispatched: '$isDispatched',
            assignedAt: '$assignedAt',
            completedAt: '$completedAt',
            status: '$status',
          },
          jobData: 1,
          service: 1,
        },
      },
    ]);
    return {
      ...notification.toObject(),
      jobRequest: data[0],
    };
  }
};

export const NotificationService = {
  createNotification,
  getNotifications,
  getNotificationCount,
  notificationAction,
  singleNotification,
};
