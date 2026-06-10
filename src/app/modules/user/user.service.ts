/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { deleteCache } from '../../../redis';
import { passwordSend } from '../../../shared/html/passwordSendHtml';
import sendNotification from '../../../socket/sendNotification';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
import { JOB_STATUS, USER_ROLE } from '../../constant';
import { StatisticHelper } from '../../helper/staticsHelper';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import generateUID from '../../utils/generateUID';
import sendMail from '../../utils/sendMail';
import Company from '../company/company.model';
import JobRequest from '../jobRequest/jobRequest.model';
import LeaveRequest from '../leaveRequest/leaveRequest.model';
import JoinRequest from '../joinRequest/joinRequest.model';
import MySubscription from '../mySubscription/mySubscription.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Profile from '../profile/profile.model';
import User from './user.model';
import { isMatchedPassword } from '../../utils/matchPassword';

const updateUserActions = async (
  id: string,
  payload: { action: 'blocked' | 'active' | 'delete' },
  authUser: TAuthUser,
): Promise<any> => {
  const { action } = payload;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.status === action) {
    throw new AppError(httpStatus.BAD_REQUEST, `User already ${action}`);
  }

  const cacheKey = `getAllDrivers-${authUser.userId}`;
  const cacheKey2 = `driverDetails-${authUser.userId}-${id}`;

  switch (action) {
    case 'blocked':
      user.status = 'blocked';
      await user.save();
      break;
    case 'active':
      user.status = 'active';
      await user.save();
      break;
    default:
      break;
  }

  if (action === 'delete') {
    await User.findByIdAndDelete(id);
    await Profile.findOneAndDelete({ userId: id });
  }

  await deleteCache(cacheKey);
  await deleteCache(cacheKey2);

  return user;
};

const updateUserActivity = async (
  id: string,
  payload: { activity: 'available' | 'offline' | 'on-job' },
) => {
  const { activity } = payload;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.activity === activity) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User activity already ${activity}`,
    );
  }

  user.activity = activity;
  await user.save();

  return user;
};

const driverPerformance = async (driverId: string): Promise<any> => {
  const maxAllowedResponseTime = 86400; // 24 hours in seconds

  try {
    // Aggregation pipeline to calculate job counts and response time
    const performance = await JobRequest.aggregate([
      {
        $match: {
          driver: new mongoose.Types.ObjectId(String(driverId)),
        },
      },
      {
        $facet: {
          totalJobs: [{ $count: 'total' }],
          completedJobs: [
            { $match: { status: 'completed' } },
            { $count: 'completed' },
          ],
          canceledJobs: [
            { $match: { status: 'cancelled' } },
            { $count: 'cancelled' },
          ],
          responseTimeStats: [
            {
              $match: {
                status: 'completed',
                assignedAt: { $exists: true, $ne: null },
                completedAt: { $exists: true, $ne: null },
              },
            },
            {
              $project: {
                responseTimeInSeconds: {
                  $cond: {
                    if: { $gte: ['$completedAt', '$assignedAt'] },
                    then: {
                      $divide: [
                        { $subtract: ['$completedAt', '$completedAt'] },
                        1000,
                      ],
                    },
                    else: null,
                  },
                },
              },
            },
            {
              $match: { responseTimeInSeconds: { $ne: null } },
            },
            {
              $group: {
                _id: null,
                avgResponseTime: { $avg: '$responseTimeInSeconds' },
                totalCount: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]).exec();

    // Extract results
    const totalJobs = performance[0]?.totalJobs[0]?.total || 0;
    const completedJobs = performance[0]?.completedJobs[0]?.completed || 0;
    const canceledJobs = performance[0]?.canceledJobs[0]?.cancelled || 0;
    const avgResponseTime =
      performance[0]?.responseTimeStats[0]?.avgResponseTime || 0;

    // Calculate completion rate percentage
    const completionRatePercentage =
      totalJobs === 0 ? 0 : (completedJobs / totalJobs) * 100;

    // Calculate response time efficiency (higher is better: faster response = higher score)
    const responseTimeEfficiency =
      avgResponseTime > 0
        ? Math.max(
            0,
            (maxAllowedResponseTime - avgResponseTime) / maxAllowedResponseTime,
          ) * 100
        : 0;

    // Combine completion rate and response time efficiency (50% weight each)
    const performancePercentage =
      0.5 * completionRatePercentage + 0.5 * responseTimeEfficiency;

    // Calculate cancel rate percentage
    const cancelRatePercentage =
      totalJobs === 0 ? 0 : (canceledJobs / totalJobs) * 100;

    return {
      completionRatePercentage: parseFloat(completionRatePercentage.toFixed(2)),
      cancelRatePercentage: parseFloat(cancelRatePercentage.toFixed(2)),
      performancePercentage: parseFloat(performancePercentage.toFixed(2)),
    };
  } catch (error: any) {
    throw new Error(`Failed to calculate driver performance: ${error.message}`);
  }
};

// const getAllCustomers = async (query: Record<string, unknown>) => {
//   const queryBuilder = new QueryBuilder(
//     User.find({ role: query.role || 'driver' }).populate('profile'),
//     query,
//   );

//   const result = await queryBuilder
//     .search(['name', 'email'])
//     .filter(['role'])
//     .sort()
//     .paginate().queryModel;

//   const meta = await queryBuilder.countTotal();

//   console.log('result:', result);

//   return { meta, result };
// };

const getAllUsers = async (query: Record<string, unknown>) => {
  const baseFilter: Record<string, any> = {
    role: query.role || 'driver',
  };

  const queryModel = User.find(baseFilter).populate('profile');

  // Check if the query parameter 'populateCategory' is explicitly passed as 'true'
  if (query.populateCategory === 'true' || query.populateCategory === true) {
    queryModel.populate({
      path: 'serviceCategory.category',
      model: 'Category',
      populate: {
        path: 'services', // This pulls the service data from the services table
      },
    });
  }
  // If it is false, missing, or anything else, no population happens
  // and the data stays exactly as it is stored in the database.

  const queryBuilder = new QueryBuilder(queryModel, query);

  const result = await queryBuilder
    .search(['name', 'email'])
    .filter(['role'])
    .sort()
    .paginate().queryModel;

  const meta = await queryBuilder.countTotal();

  return { meta, result };
};

const getAllCompany = async (query: Record<string, unknown>) => {
  const companyAggregation = new AggregationQueryBuilder(query);

  const result = await companyAggregation
    .customPipeline([
      {
        $match: {
          role: 'company',
        },
      },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
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
          from: 'payments',
          localField: 'myCompany',
          foreignField: 'companyId',
          as: 'payment',
        },
      },
      {
        $unwind: {
          path: '$payment',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: {
          'payment.paymentStatus': 'completed',
        },
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          activity: { $first: '$activity' },
          totalAmount: { $sum: '$payment.amount' },
        },
      },

      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'companyUserId',
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
          name: 1,
          totalAmount: 1,
          companyId: '$company._id',
          drivers: '$company.drivers',
          dispatchers: '$company.dispatchers',
        },
      },
    ])
    .search(['name'])
    .sort()
    .paginate()
    .execute(User);

  const dispatched = await JobRequest.aggregate([
    {
      $match: {},
    },
    {
      $group: {
        _id: '$company',
        totalDispatched: {
          $sum: { $cond: [{ $eq: ['$isDispatched', true] }, 1, 0] },
        },
      },
    },
  ]);

  const mergeData = result.map((data: any) => {
    const dispatchedData = dispatched.find(
      (item: any) => item._id.toString() === data.companyId.toString(),
    );

    return {
      _id: data._id.toString(),
      name: data.name || 'N/A',
      companyId: data.companyId.toString(),
      totalAmount: data.totalAmount || 0,
      totalDriver: data.drivers.length || 0,
      totalDispatcher: data.dispatchers.length || 0,
      totalDispatched: dispatchedData?.totalDispatched || 0,
    };
  });

  const meta = await companyAggregation.countTotal(User);

  return { meta, result: mergeData };
};

const companyDetails = async (companyId: string) => {
  const result = await JobRequest.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(String(companyId)),
        status: JOB_STATUS.completed,
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
    {
      $unwind: {
        path: '$job',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'jobRequestId',
        as: 'payment',
      },
    },
    {
      $unwind: {
        path: '$payment',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: '$job.categoryName',
        categoryName: { $first: '$job.categoryName' },
        amountOfCategory: { $sum: '$payment.amount' },
      },
    },

    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amountOfCategory' },
        categories: {
          $push: {
            categoryName: '$categoryName',
            amountOfCategory: '$amountOfCategory',
          },
        },
      },
    },

    {
      $project: {
        _id: 0,
        totalAmount: 1,
        name: '$company.name',
        categories: 1,
      },
    },
  ]);

  const user = await Company.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(companyId)),
      },
    },

    {
      $lookup: {
        from: 'users',
        localField: 'companyUserId',
        foreignField: '_id',
        as: 'companyUser',
      },
    },
    {
      $unwind: {
        path: '$companyUser',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: 'profiles',
        localField: 'profileId',
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
      $project: {
        _id: 1,
        name: '$companyUser.name',
        email: '$companyUser.email',
        joiningDate: '$companyUser.createdAt',
        image: '$profile.image',
        totalAmount: result[0]?.totalAmount || 0,
        categories: result[0]?.categories || [],
      },
    },
  ]);

  return user;
};

const companyDispatchedHistory = async (
  companyId: string,
  query: Record<string, unknown>,
) => {
  const historyAggregation = new AggregationQueryBuilder(query);

  const result = await historyAggregation
    .customPipeline([
      {
        $match: {
          company: new mongoose.Types.ObjectId(String(companyId)),
          isDispatched: true,
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
      {
        $unwind: {
          path: '$job',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          jobId: '$job._id',
          serviceName: '$job.serviceName',
          date: '$job.createdAt',
        },
      },
    ])
    .sort()
    .paginate()
    .execute(JobRequest);

  const meta = await historyAggregation.countTotal(JobRequest);

  return { meta, result };
};

const getAllCompanyRequest = async (query: Record<string, unknown>) => {
  const companyQuery = new QueryBuilder(
    User.find({
      role: 'company',
      isCompleted: true,
      isApproved: false,
    }).populate('myCompany'),
    query,
  );

  const result = await companyQuery.search(['name', 'email']).sort().paginate()
    .queryModel;
  const meta = await companyQuery.countTotal();
  return { meta, result };
};

const approveRequest = async (
  user: TAuthUser,
  payload: { userId: string; action: 'accept' | 'cancel' },
) => {
  const { userId, action } = payload;
  let result: any;

  const notificationData = {
    type:
      payload.action === 'accept'
        ? NOTIFICATION_TYPE.companyRequestApproved
        : (NOTIFICATION_TYPE.companyRequestRejected as any),
    senderId: user?.userId as any,
    receiverId: userId as any,
    linkId: result?._id as any,
    role: user?.role,
    message: '',
    data: result,
  };

  switch (action) {
    case 'accept':
      result = await User.findByIdAndUpdate(
        userId,
        { isApproved: true },
        { new: true },
      );
      notificationData.data = result;
      notificationData.message =
        'Your company approval request has been approved';
      break;

    case 'cancel':
      notificationData.data = result;
      notificationData.message =
        'Your company approval request has been rejected';
      break;
    default:
      break;
  }

  await sendNotification(
    { userId: user.userId, role: user.role } as any,
    notificationData,
  );

  return result;
};

const createAdmin = async (payload: { email: string; name: string }) => {
  const { name, email } = payload;
  const session = await mongoose.startSession();
  session.startTransaction();
  const generatePassword = Math.floor(10000000 + Math.random() * 90000000);
  try {
    const createAdmin = await User.create(
      [
        {
          name,
          email,
          password: generatePassword,
          uid: await generateUID(),
          role: USER_ROLE.admin,
        },
      ],
      { session, new: true },
    );

    if (!createAdmin) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Dispatcher not created');
    }
    const profile = await Profile.create(
      [
        {
          userId: createAdmin[0]._id,
        },
      ],
      { session, new: true },
    );

    await User.findOneAndUpdate(
      { _id: createAdmin[0]._id },
      { $set: { profile: profile[0]._id } },
      { session, new: true, upsert: true },
    );

    if (!profile) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Profile not created');
    }

    await sendMail({
      email: payload.email as string,
      subject: 'Change Your Password Please',
      html: passwordSend(generatePassword),
    });

    await session.commitTransaction();
    session.endSession();

    return { user: createAdmin[0], profile: profile[0] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAllAdmin = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(
    User.find({ role: 'admin' }).populate('profile'),
    query,
  );

  const result = await queryBuilder
    .search(['name', 'email'])
    .filter(['name', 'email'])
    .sort()
    .paginate().queryModel;

  const meta = await queryBuilder.countTotal();
  // const result = await User.find({ role: USER_ROLE.admin });
  return { meta, result };
};

const getAllDriverRequest = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const dataQuery = new AggregationQueryBuilder(query);

  const result = await dataQuery
    .customPipeline([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(String(user.myCompany)),
          status: 'pending', // Only show pending requests
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
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
          as: 'profile',
        },
      },
      {
        $unwind: { path: '$profile', preserveNullAndEmptyArrays: true },
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
          uid: '$driver.uid',
          email: '$driver.email',
          name: '$driver.name',
          phone: '$driver.phone',
          role: '$driver.role',
          driverStatus: '$driver.status',
          location: '$driver.location',
          isCompleted: '$driver.isCompleted',
          isApproved: '$driver.isApproved',
          ratings: '$driver.ratings',
          activity: '$driver.activity',
          profileImage: '$profile.image',
        },
      },
    ])
    .search(['name', 'email'])
    .sort()
    .paginate()
    .execute(JoinRequest);

  const meta = await dataQuery.countTotal(JoinRequest);

  return { meta, result };
};

const driverRequestAction = async (
  user: TAuthUser,
  payload: { userId: string; action: 'accept' | 'cancel' },
) => {
  const { userId, action } = payload;

  // Find the join request first
  const joinRequest = await JoinRequest.findOne({
    userId: userId,
    companyId: user.myCompany,
    status: 'pending',
  });

  if (!joinRequest) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No pending join request found for this driver',
    );
  }

  // Check if driver is already assigned to another company (only for accept action)
  if (action === 'accept') {
    const driverUser = await User.findById(userId);
    if (driverUser?.isCompanyAssigned && driverUser?.assignedCompany) {
      // Check if assigned to a different company
      if (
        driverUser.assignedCompany.toString() !== user?.myCompany?.toString()
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'This driver is already assigned to another company',
        );
      }
    }
  }

  // Check subscription limits for company users
  const mySubscriptions = await MySubscription.findOne({ userId: user.userId });
  if (user.role === USER_ROLE.company) {
    if (!mySubscriptions) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Please subscribe first to use this feature',
      );
    }

    if (new Date(mySubscriptions.expiryIn).getTime() < Date.now()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Your subscription has expired',
      );
    }

    if (action === 'accept' && mySubscriptions.remainingDrivers === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have reached your driver limit',
      );
    }
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let result;
    const notificationData = {
      type:
        action === 'accept'
          ? NOTIFICATION_TYPE.acceptDriverRequest
          : (NOTIFICATION_TYPE.rejectedDriverRequest as any),
      senderId: user.userId as any,
      receiverId: userId as any,
      linkId: joinRequest._id as any,
      role: user.role,
      message: '',
    };

    switch (action) {
      case 'accept':
        // Update join request status
        joinRequest.status = 'accept';
        await joinRequest.save({ session });

        // Auto-reject all other pending join requests for this driver
        await JoinRequest.updateMany(
          {
            userId: userId,
            _id: { $ne: joinRequest._id },
            status: 'pending',
          },
          { $set: { status: 'reject' } },
          { session },
        );

        // Update user
        result = await User.findOneAndUpdate(
          { _id: userId },
          {
            isApproved: true,
            isCompanyAssigned: true,
            assignedCompany: user.myCompany,
          },
          { new: true, session },
        );

        // Add driver to company
        await Company.findOneAndUpdate(
          { _id: user.myCompany },
          { $push: { drivers: { driver: userId } } },
          { new: true, session },
        );

        // Decrement remaining drivers for company subscription
        if (user.role === USER_ROLE.company) {
          mySubscriptions!.remainingDrivers -= 1;
          await mySubscriptions!.save({ session });
        }

        notificationData.message = `${user.name} has accepted your driver request`;

        await sendNotification(
          { userId: user.userId, role: user.role } as TAuthUser,
          notificationData,
        );
        break;

      case 'cancel':
        // Update join request status to reject
        joinRequest.status = 'reject';
        await joinRequest.save({ session });

        // User remains unchanged (no assignedCompany, isApproved stays false)
        result = await User.findById(userId).session(session);

        notificationData.message = `${user.name} has rejected your driver request`;

        await sendNotification(
          { userId: user.userId, role: user.role } as TAuthUser,
          notificationData,
        );
        break;

      default:
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid action');
    }

    await session.commitTransaction();
    session.endSession();

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const customerOverview = async (query: Record<string, unknown>) => {
  const { year } = query;
  const { startDate, endDate } = StatisticHelper.statisticHelper(
    year as string,
  );

  const result = await User.aggregate([
    {
      $match: {
        $and: [
          {
            role: USER_ROLE.customer,
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      },
    },

    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          role: '$role',
        },
        count: { $sum: 1 },
      },
    },

    {
      $group: {
        _id: '$_id.month',
        roles: {
          $push: {
            role: '$_id.role',
            count: '$count',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        roles: 1,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  const statuses = ['customer'];

  const formattedResult = StatisticHelper.formattedResult(
    result,
    'roles',
    'role',
    statuses,
  );

  return formattedResult;
};

const getAllDispatcher = async (query: Record<string, unknown>) => {
  const dispatcherQuery = new AggregationQueryBuilder(query);

  const result = await dispatcherQuery
    .customPipeline([
      {
        $match: {
          role: USER_ROLE.dispatcher,
        },
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'profile',
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
          localField: 'dispatcherCompany',
          foreignField: '_id',
          as: 'companyUser',
        },
      },
      {
        $unwind: {
          path: '$companyUser',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          name: 1,
          role: 1,
          status: 1,
          image: '$profile.image',
          email: 1,
          uid: 1,
          companyName: '$companyUser.companyName',
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])
    .search(['name', 'email'])
    .sort()
    .paginate()
    .execute(User);
  const meta = await dispatcherQuery.countTotal(User);
  return { meta, result };
};

const leaveCompany = async (user: TAuthUser, payload: { reason: string }) => {
  // Query user from DB to get current assignedCompany (don't rely on token)
  const currentUser = await User.findById(user.userId);

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!currentUser.assignedCompany) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You are not assigned to any company',
    );
  }

  // Check if user already has a pending leave request
  const existingPendingRequest = await LeaveRequest.findOne({
    userId: user.userId,
    companyId: currentUser.assignedCompany,
    status: 'pending',
  });

  if (existingPendingRequest) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You already have a pending leave request. Please wait for the company to respond.',
    );
  }

  const leaveRequest = await LeaveRequest.create({
    userId: user.userId,
    companyId: currentUser.assignedCompany,
    reason: payload.reason,
  });

  return leaveRequest;
};

const deleteAccount = async (
  user: TAuthUser,
  payload: { password: string },
) => {
  const findUser = await User.findById(user.userId).select('password');

  if (!findUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const matchPassword = await isMatchedPassword(
    findUser.password,
    payload.password,
  );

  if (!matchPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'password not matched');
  }

  await User.findOneAndDelete({ _id: user.userId });
  await Profile.findOneAndDelete({ userId: user.userId });
  return true;
};

const toggleAutoDispatch = async (authUser: TAuthUser) => {
  const { hopperCompany, myCompany } = authUser;

  // Check if user has any company
  if (!hopperCompany && !myCompany) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You do not have any company associated',
    );
  }

  // Collect company IDs to check
  const companyIds = [];
  if (hopperCompany) companyIds.push(hopperCompany);
  if (myCompany) companyIds.push(myCompany);

  // Find companies
  const companies = await Company.find({ _id: { $in: companyIds } });

  if (!companies || companies.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'Company does not exist');
  }

  // Collect all driver IDs from all companies
  const driverIds: any[] = [];
  companies.forEach((company) => {
    if (company.drivers && company.drivers.length > 0) {
      company.drivers.forEach((driverObj: any) => {
        if (driverObj.driver) {
          driverIds.push(driverObj.driver);
        }
      });
    }
  });

  if (driverIds.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No drivers found in the company');
  }

  // Get the current isAutoDispatch value from the first company
  const currentAutoDispatchValue = companies[0].isAutoDispatch || false;
  const newAutoDispatchValue = !currentAutoDispatchValue;

  // Update isAutoDispatch for all companies to the new value
  await Company.updateMany(
    { _id: { $in: companyIds } },
    { $set: { isAutoDispatch: newAutoDispatchValue } },
  );

  // Update isAutoDispatch for all drivers to match the company's new value
  await User.updateMany(
    { _id: { $in: driverIds }, role: 'driver' },
    { $set: { isAutoDispatch: newAutoDispatchValue } },
  );

  // Fetch updated drivers to return
  const updatedDrivers = await User.find(
    { _id: { $in: driverIds } },
    { _id: 1, name: 1, email: 1, isAutoDispatch: 1 },
  );

  // Fetch updated companies to return
  const updatedCompanies = await Company.find(
    { _id: { $in: companyIds } },
    { _id: 1, companyName: 1, isAutoDispatch: 1 },
  );

  return {
    message: 'Auto dispatch toggled for all drivers and companies',
    driversUpdated: updatedDrivers.length,
    drivers: updatedDrivers,
    companiesUpdated: updatedCompanies.length,
    companies: updatedCompanies,
  };
};

const getCompanyForDispatcher = async (user: TAuthUser) => {
  const dispatcher = await User.findById(user.userId)
    .populate({
      path: 'dispatcherCompany',
      select: 'companyUserId companyName companyLogo profileId',
      populate: {
        path: 'profileId',
        select: 'image',
      },
    })
    .lean();

  if (!dispatcher?.dispatcherCompany) {
    return null;
  }

  const company = dispatcher.dispatcherCompany as any;

  return {
    companyUserId: company.companyUserId,
    companyName: company.companyName,
    companyProfilePhoto: company.profileId?.image || null,
  };
};

const getDispatcherForCompany = async (companyId: string) => {
  const company = await Company.findOne({
    companyUserId: companyId,
  })
    .populate({
      path: 'dispatchers.dispatcher',
      select: 'name profile',
      populate: {
        path: 'profile',
        select: 'image',
      },
    })
    .lean();

  if (!company) return [];

  return (company.dispatchers || []).map((item: any) => ({
    dispatcherId: item.dispatcher?._id,
    name: item.dispatcher?.name,
    profile: item.dispatcher?.profile?.image || null,
  }));
};

export const UserService = {
  updateUserActions,
  updateUserActivity,
  driverPerformance,
  createAdmin,
  // getAllCustomers,
  getAllUsers,
  getAllCompany,
  companyDetails,
  companyDispatchedHistory,
  getAllCompanyRequest,
  approveRequest,
  getAllAdmin,
  getAllDriverRequest,
  driverRequestAction,
  customerOverview,
  getAllDispatcher,
  leaveCompany,
  deleteAccount,
  toggleAutoDispatch,
  getCompanyForDispatcher,
  getDispatcherForCompany,
};
