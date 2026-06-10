/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import { TMeta } from '../../utils/sendResponse';
import Company from '../company/company.model';
import User from '../user/user.model';
import JoinRequest from './joinRequest.model';

const getAllJoinRequests = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const joinRequestAggregation = new AggregationQueryBuilder(query);

  const result = await joinRequestAggregation
    .customPipeline([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(String(user.myCompany)),
        },
      },
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
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      {
        $unwind: {
          path: '$company',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          companyId: 1,
          invitationCode: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          userPhone: '$user.phone',
          userImage: '$profile.image',
          companyName: '$company.companyName',
        },
      },
    ])
    .filter(['status'])
    .search(['userName', 'userEmail'])
    .sort()
    .paginate()
    .execute(JoinRequest);

  const meta = await joinRequestAggregation.countTotal(JoinRequest);

  return { meta, result };
};

const getJoinRequestById = async (id: string) => {
  const result = await JoinRequest.findById(id)
    .populate({
      path: 'userId',
      select: 'name email phone',
      populate: {
        path: 'profile',
        select: 'image',
      },
    })
    .populate({
      path: 'companyId',
      select: 'companyName companyLogo',
    });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Join request not found');
  }

  return result;
};

const getMyJoinRequests = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const joinRequestAggregation = new AggregationQueryBuilder(query);

  // Build match condition with status filter if provided
  const matchCondition: any = {
    userId: new mongoose.Types.ObjectId(String(user.userId)),
  };

  if (query.status) {
    matchCondition.status = query.status;
  }

  const result = await joinRequestAggregation
    .customPipeline([
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      {
        $unwind: {
          path: '$company',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          companyId: 1,
          invitationCode: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          companyName: '$company.companyName',
          companyLogo: '$company.companyLogo',
        },
      },
    ])
    .sort()
    .paginate()
    .execute(JoinRequest);

  const meta = await joinRequestAggregation.countTotal(JoinRequest);

  return { meta, result };
};

const acceptJoinRequest = async (
  user: TAuthUser,
  id: string,
  payload: { action: string; userId: string },
) => {
  const joinRequest = await JoinRequest.findOne({
    _id: id,
    companyId: user.myCompany,
  });

  if (!joinRequest) {
    throw new AppError(httpStatus.NOT_FOUND, 'Join request not found');
  }

  if (joinRequest.status !== 'pending') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `This request has already been ${joinRequest.status}`,
    );
  }

  // Determine action outcome
  const isAccepted = payload.action === 'accept';
  if (!isAccepted && payload.action !== 'reject') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid action. Use "accept" or "reject"',
    );
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Update join request status
    joinRequest.status = isAccepted ? 'accept' : 'reject';
    await joinRequest.save({ session });

    // If accepted, add driver to company and assign company to user
    if (isAccepted) {
      await Promise.all([
        Company.findOneAndUpdate(
          { _id: user.myCompany },
          { $push: { drivers: { driver: payload.userId } } },
          { new: true, session },
        ),
        User.findOneAndUpdate(
          { _id: payload.userId },
          {
            $set: {
              assignedCompany: user.myCompany,
              isApproved: true,
              isCompanyAssigned: true,
            },
          },
          { new: true, session },
        ),
      ]);
    }

    // Construct notification message
    const message = isAccepted
      ? `Your request to join the company has been accepted by ${user.name}`
      : `Your request to join the company has been rejected by ${user.name}`;

    // Send notification to the driver about the action
    await sendNotification(
      { userId: user.userId, role: user.role } as TAuthUser,
      {
        type: isAccepted
          ? (NOTIFICATION_TYPE.driverRequest as any)
          : (NOTIFICATION_TYPE.rejectedLeaveRequest as any),
        senderId: user.userId as any,
        receiverId: payload.userId as any,
        linkId: joinRequest._id as any,
        role: user.role,
        message,
      },
    );

    await session.commitTransaction();
    session.endSession();

    return joinRequest;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const JoinRequestService = {
  getAllJoinRequests,
  getJoinRequestById,
  getMyJoinRequests,
  acceptJoinRequest,
};
