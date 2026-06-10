/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Company from '../company/company.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Payment from '../payment/payment.model';
import Tools from '../tools/tools.model';
import User from '../user/user.model';
import Vehicle from '../vehicle/vehical.model';
import { ICompleteProfile, TProfileUpdate } from './profile.interface';
import Profile from './profile.model';

const getMyProfile = async (user: TAuthUser) => {
  const result = await User.findOne({
    _id: user.userId,
  }).populate([
    {path: 'profile'},
    {path: 'assignedCompany', select: 'companyName companyLogo isAutoDispatch '},
  ]);
  //  if(user.role === USER_ROLE.driver){
    const vehicle = await Vehicle.findOne({ userId: user.userId });
    return { ...result?.toObject(), vehicle: vehicle || null};
  //  }
  // return result;
};

const updateProfile = async (
  user: TAuthUser,
  payload: Partial<TProfileUpdate>,
  res: Response,
) => {
  if (payload.vehicleData) {
    const data = await Vehicle.findOneAndUpdate(
      { userId: user.userId },
      payload.vehicleData,
      { new: true, upsert: true },
    );

    if (data) {
      res.json({
        success: true,
        statusCode: httpStatus.OK,
        message: 'Vehicle updated successfully',
        data,
      });
    }
    return data;
  }

  const findProfile = await Profile.findOne({ _id: user.profileId });
  const findUser = await User.findOne({ _id: user.userId });
  if (!findProfile) {
    throw new Error('Profile not found');
  }

  const userUpdatedData = {
    name: payload.name || findUser?.name,
    phone: payload.phone || findUser?.phone,
    activity: payload.activity || findUser?.activity,
    location: payload.location
      ? {
        type: 'Point',
        coordinates: payload.location.coordinates,
      }
      : findUser?.location,
    distanceRedius: payload.distanceRedius || findUser?.distanceRedius,
    fcmToken: payload.fcmToken,
  };

  const profileUpdatedData = {
    image: payload.image || findProfile?.image,
    address: payload.address || findProfile?.address,
    addressLineTwo: payload.addressLineTwo || findProfile?.addressLineTwo,
    houseAddress: payload.houseAddress || findProfile?.houseAddress,
    city: payload.city || findProfile?.city,
    state: payload.state || findProfile?.state,
    zipCode: payload.zipCode || findProfile?.zipCode,
    gender: payload.gender || findProfile?.gender,
    facebook: payload.facebook || findProfile?.facebook,
    instagram: payload.instagram || findProfile?.instagram,
  };

  const result = await Profile.findOneAndUpdate(
    { _id: user.profileId },
    profileUpdatedData,
    {
      new: true,
    },
  );

  if (!result) {
    throw new Error('Profile not updated');
  }

  const userUpdate = await User.findOneAndUpdate(
    { _id: user.userId },
    userUpdatedData,
    { new: true },
  );

  if (!userUpdate) {
    throw new Error('User not updated');
  }
  return { profile: result, user: userUpdate };
};

const completeProfile = async (
  user: TAuthUser,
  payload: Partial<ICompleteProfile>,
) => {
  const findUser = await User.findOne({ _id: user.userId });
  if (findUser?.isCompleted) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Profile already completed');
  }

  const vehicleData = {
    userId: user.userId,
    vehicleRegistration: payload?.vehicleRegistration,
    vehicleInsurance: payload?.vehicleInsurance,
    vehicleImage: payload?.vehicleImage,
    socialSecurity: payload?.socialSecurity,
    describe: payload?.describe,
  };

  const toolsData = {
    userId: user.userId,
    toolsForLockOut: payload?.toolsForLockOut,
    toolsForJumpOut: payload?.toolsForJumpOut,
    toolsForTierChange: payload?.toolsForTierChange,
    toolsForFuelDelivery: payload?.toolsForFuelDelivery,
    toolsForJacks: payload?.toolsForJacks,
    toolsForDrills: payload?.toolsForDrills,
    toolsForCodeReaders: payload?.toolsForCodeReaders,
    toolsForSocketWrenches: payload?.toolsForSocketWrenches,
  };

  const profileData = {
    userId: user.userId,
    address: payload?.address,
    addressLineTwo: payload?.addressLineTwo,
    city: payload?.city,
    state: payload?.state,
    zipCode: payload?.zipCode,
  };


  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const createVehicle = await Vehicle.create([vehicleData], { session });
    if (!createVehicle) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Vehicle not created');
    }

    if (user.role === USER_ROLE.driver) {
      const createTools = await Tools.create([toolsData], { session });
      if (!createTools) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Tools not created');
      }

      const updateProfile = await Profile.findOneAndUpdate(
        { _id: user.profileId },
        profileData,
        { session },
      );

      if (!updateProfile) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Profile not updated');
      }

      const updateUser = await User.findOneAndUpdate(
        { _id: user.userId },
        {
          $set: {
            serviceCategory: payload?.serviceCategory,
            isCompleted: true,
            location: payload?.location,
          },
        },
        { session },
      );

      if (!updateUser) {
        throw new AppError(httpStatus.BAD_REQUEST, 'user not updated');
      }
    }

    if (
      user.role === USER_ROLE.company ||
      user.role === USER_ROLE.hopperCompany
    ) {
      const findAdmin = await User.findOne({
        role: USER_ROLE.admin,
      });

      const findCompany = await Company.findOne({
        companyUserId: user.userId,
      });

      if (!findCompany) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Company not found');
      }

      const companyUpdate = await Company.findOneAndUpdate(
        { companyUserId: user.userId },
        {
          $set: {
            companyLogo: payload?.companyLogo,
            companyName: payload?.companyName,
          },
        },
        { session },
      );

      if (!companyUpdate) {
        throw new AppError(httpStatus.BAD_REQUEST, 'company not updated');
      }

      const updateUser = await User.findOneAndUpdate(
        { _id: user.userId },
        {
          $set: {
            isCompleted: true,
          },
        },
        { session },
      );

      if (!updateUser) {
        throw new AppError(httpStatus.BAD_REQUEST, 'user not updated');
      }

      const notificationData = {
        type: NOTIFICATION_TYPE.companyRequest as any,
        senderId: findCompany._id as any,
        receiverId: findAdmin?._id as any,
        linkId: updateUser._id as any,
        role: user.role,
        message: `${payload?.companyName} has completed their profile please check`,
      };

      await sendNotification(
        { userId: findAdmin?._id, role: findAdmin?.role } as any,
        notificationData,
      );
    }

    await session.commitTransaction();
    await session.endSession();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(error);
  }
};

const adminOverview = async () => {
  const hopperCompany = await User.findOne({
    role: USER_ROLE.hopperCompany,
  });
  const companyCount = await User.countDocuments({ role: USER_ROLE.company });
  const customerCount = await User.countDocuments({ role: USER_ROLE.customer });

  const earnFromSubscription = await Payment.aggregate([
    {
      $match: {
        earnFrom: 'subscription',
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        totalAmount: 1,
      },
    },
  ]);

  const totalEarning = await Payment.aggregate([
    {
      $match: {
        $and: [
          {
            companyId: new mongoose.Types.ObjectId(
              String(hopperCompany?.myCompany),
            ),
          },
          {
            earnFrom: 'job',
          },
        ],
      },
    },

    {
      $group: {
        _id: '$paymentStatus',
        amount: { $sum: '$amount' },
      },
    },
  ]);

  return {
    earnFromSubscription: earnFromSubscription[0]?.totalAmount || 0,
    companyCount,
    customerCount,
    totalEarning,
  };
};

export const ProfileService = {
  updateProfile,
  getMyProfile,
  adminOverview,
  completeProfile,
};
