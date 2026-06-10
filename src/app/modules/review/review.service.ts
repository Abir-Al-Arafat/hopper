/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import User from '../user/user.model';
import { TReview } from './review.interface';
import Review from './review.model';
import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import sendNotification from '../../../socket/sendNotification';

const addReview = async (payload: TReview, user: TAuthUser) => {

  console.log(payload,"review payload...." )
  const ratingData = {
    ...payload,
    userId: user.userId,
  };

  const findDriver = await User.findById(payload.driverId);

  if (!findDriver) {
    throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
  }

  const currentReview = await Review.aggregate([
    {
      $match: {
        driverId: new mongoose.Types.ObjectId(String(payload.driverId)),
      },
    },
    {
      $group: {
        _id: payload.driverId,
        rating: { $avg: '$rating' },
        totalReview: { $count: {} },
      },
    },
    {
      $project: {
        _id: 0,
        rating: 1,
        totalReview: 1,
      },
    },
  ]);

  const currentAvgRating =
    currentReview.length > 0 ? currentReview[0].rating : 0;
  const totalReview =
    currentReview.length > 0 ? currentReview[0].totalReview : 0;

  // return
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const createReview = await Review.create([ratingData], { session });

    if (!createReview || createReview.length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Review not created');
    }

    const notificationBody = {
      senderId: user.userId as any,
      role: user.role,
      receiverId: payload.driverId,
      message: `You got a new review from ${user.name} with rating ${payload.rating} start`,
      type: NOTIFICATION_TYPE.review,
      linkId: createReview[0]._id as any,
    };

    sendNotification(user, notificationBody);

    findDriver.ratings =
      (currentAvgRating * totalReview + payload.rating) /
      (totalReview + 1).toFixed(1);

    await findDriver.save({ session });
    await session.commitTransaction();
    await session.endSession();

    return createReview?.[0];
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error);
  }
};

export const ReviewService = {
  addReview,
};
