/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { cacheData, getCachedData, deleteCache } from '../../../redis';
import sendNotification from '../../../socket/sendNotification';
import { JOB_STATUS, USER_ROLE, USER_STATUS } from '../../constant';
import { aggregationPipelineHelper } from '../../helper/aggregationPipline';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import generateUID from '../../utils/generateUID';
import { minuteToSecond } from '../../utils/minitToSecond';
import sendMail from '../../utils/sendMail';
import { TMeta } from '../../utils/sendResponse';
import Job from '../job/job.model';
import JobRequest from '../jobRequest/jobRequest.model';
import {
  assignJob,
  findJobHistory,
  findManualJobHistory,
} from '../jobRequest/jobRequest.utils';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Payment from '../payment/payment.model';
import Profile from '../profile/profile.model';
import Review from '../review/review.model';
import User from '../user/user.model';
import Company from './company.model';
import { driverInfoFinding } from './company.utils';
import { passwordSend } from '../../../shared/html/passwordSendHtml';
import LeaveRequest from '../leaveRequest/leaveRequest.model';
import JoinRequest from '../joinRequest/joinRequest.model';

const addDispatcher = async (
  payload: { name: string; email: string },
  user: TAuthUser,
) => {
  const { name, email } = payload;
  const session = await mongoose.startSession();
  session.startTransaction();

  const findHopper = await User.findOne({
    role: USER_ROLE.hopperCompany,
  });
  const generatePassword = Math.floor(10000000 + Math.random() * 90000000);

  try {
    const createDispatcher = await User.create(
      [
        {
          name,
          email,
          password: generatePassword,
          uid: await generateUID(),
          role: USER_ROLE.dispatcher,
          // dispatcherCompany: user.myCompany,
          dispatcherCompany:
            user.role === USER_ROLE.admin
              ? findHopper?.myCompany
              : user.myCompany,
        },
      ],
      { session, new: true },
    );

    if (!createDispatcher) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Dispatcher not created');
    }
    const profile = await Profile.create(
      [
        {
          userId: createDispatcher[0]._id,
        },
      ],
      { session, new: true },
    );

    await User.findOneAndUpdate(
      { _id: createDispatcher[0]._id },
      { $set: { profile: profile[0]._id } },
      { session, new: true, upsert: true },
    );

    if (!profile) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Profile not created');
    }

    const companyUserId =
      user.role === USER_ROLE.admin ? findHopper?._id : user.userId;

    const update = await Company.findOneAndUpdate(
      // { companyUserId: new mongoose.Types.ObjectId(user.userId) },
      {
        companyUserId: new mongoose.Types.ObjectId(String(companyUserId)),
      },
      { $push: { dispatchers: { dispatcher: createDispatcher[0]._id } } },
      { session, new: true },
    );

    if (!update) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Company not updated');
    }

    await sendMail({
      email: payload.email as string,
      subject: 'Change Your Password Please',
      html: passwordSend(generatePassword),
    });

    await session.commitTransaction();
    session.endSession();

    return { user: createDispatcher[0], profile: profile[0] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const invitationCode = async (user: TAuthUser) => {
  // Give preference to user.userId if both exist
  let checkInvitationCode;
  if (user.userId) {
    checkInvitationCode = await Company.findOne({
      companyUserId: new mongoose.Types.ObjectId(String(user.userId)),
    });
  }

  // Only check hopperCompany if userId didn't find a company
  if (!checkInvitationCode && user.hopperCompany) {
    checkInvitationCode = await Company.findOne({
      _id: new mongoose.Types.ObjectId(String(user.hopperCompany)),
    });
  }

  if (checkInvitationCode && checkInvitationCode.invitationCode) {
    return {
      invitationCode: checkInvitationCode.invitationCode,
    };
  }

  // Generate random 8-character alphanumeric code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let invitationCode = '';
  const randomValues = crypto.getRandomValues(new Uint8Array(8));

  for (let i = 0; i < 8; i++) {
    invitationCode += characters.charAt(randomValues[i] % characters.length);
  }

  const createInvitationCode = await Company.findOneAndUpdate(
    { companyUserId: new mongoose.Types.ObjectId(user.userId) },
    { $set: { invitationCode: invitationCode } },
    { new: true },
  );

  if (!createInvitationCode) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invitation code not created');
  }

  return { invitationCode: createInvitationCode?.invitationCode };
};

const joinCompany = async (
  user: TAuthUser,
  payload: { invitationCode: string },
) => {
  const findUser = await User.findOne({
    _id: user.userId,
  });

  if (!findUser?.isCompleted) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please complete your profile');
  }

  const companyIsExist = await Company.findOne({
    invitationCode: payload.invitationCode,
  });

  if (!companyIsExist) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Company not found with this invitation code',
    );
  }

  // 🚫 Check if driver already exists
  // const alreadyJoined = companyIsExist.drivers.some(
  //   (d: any) => d.driver.toString() === user.userId.toString(),
  // );

  // if (alreadyJoined) {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     'You have already joined this company',
  //   );
  // }

  // Check if there's already a join request
  const existingRequest: any = await JoinRequest.findOne({
    userId: user.userId,
    companyId: companyIsExist._id,
  });

  // Block if request is pending (waiting for company approval)
  if (existingRequest && existingRequest.status === 'pending') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You already have a pending join request for this company',
    );
  }
  console.log('existingRequest', existingRequest);
  // Block if request is already accepted (driver is in the company)
  if (existingRequest && existingRequest.status === 'accept') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You have already joined this company',
    );
  }

  // Allow if: no existing request, status is 'reject', or status is 'left'

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create or update join request record
    let joinRequest;
    if (
      existingRequest &&
      (existingRequest.status === 'reject' || existingRequest.status === 'left')
    ) {
      // Update existing rejected/left request to pending
      joinRequest = await JoinRequest.findOneAndUpdate(
        { userId: user.userId, companyId: companyIsExist._id },
        {
          $set: {
            status: 'pending',
            invitationCode: payload.invitationCode,
            updatedAt: new Date(),
          },
        },
        { session, new: true },
      );
    } else {
      // Create new join request
      const newRequest = await JoinRequest.create(
        [
          {
            userId: user.userId,
            companyId: companyIsExist._id,
            invitationCode: payload.invitationCode,
            status: 'pending',
          },
        ],
        { session },
      );
      joinRequest = newRequest[0];
    }

    if (!joinRequest) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to create join request',
      );
    }

    // Send notification to company about the join request
    const notificationData = {
      type: NOTIFICATION_TYPE.driverRequest as any,
      senderId: user.userId as any,
      receiverId: companyIsExist.companyUserId as any,
      linkId: joinRequest._id as any,
      role: user.role,
      message: `${user.name} has requested to join your company`,
    };

    await sendNotification(
      { userId: user.userId, role: user.role } as TAuthUser,
      notificationData,
    );

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  return {
    message: 'Join request sent successfully. Waiting for company approval.',
    companyName: companyIsExist.companyName,
    companyId: companyIsExist._id,
    status: 'pending',
  };
};

const quickOverview = async (user: TAuthUser) => {
  const cacheKey = `quickOverview-${user.userId}`;
  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ meta: any; result: any }>(cacheKey);

  await deleteCache(cacheKey);
  // if (cached) {
  //   console.log('🚀 Serving from Redis cache');
  //   return cached;
  // }

  let myCompany = null;
  if (user.role === USER_ROLE.dispatcher) {
    myCompany = await Company.findById(user.dispatcherCompany);
  } else if (user.role === USER_ROLE.admin && user.hopperCompany) {
    myCompany = await Company.findById(user.hopperCompany);
  }

  const userId = myCompany ? myCompany.companyUserId : user.userId;

  const findUser = await Company.findOne({
    companyUserId: new mongoose.Types.ObjectId(String(userId)),
  });
  if (!findUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Company not found');
  }
  const matchStage = {
    $match: {
      company: new mongoose.Types.ObjectId(String(findUser?._id)),
    },
  };

  // Aggregate job request statuses
  const jobRequest = await JobRequest.aggregate([
    matchStage,
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        status: { $push: { k: '$_id', v: '$count' } },
      },
    },
    {
      $project: {
        _id: 0,
        status: { $arrayToObject: '$status' },
        total: 1,
      },
    },
  ]);

  // Aggregate driver activity statuses
  const aggregateDriverStatus = await User.aggregate([
    {
      $match: {
        assignedCompany: new mongoose.Types.ObjectId(String(findUser?._id)),
        role: USER_ROLE.driver,
        status: USER_STATUS.active,
      },
    },
    {
      $group: {
        _id: '$activity',
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        activity: { $push: { k: '$_id', v: '$count' } },
      },
    },
    {
      $project: {
        _id: 0,
        activity: { $arrayToObject: '$activity' },
        total: 1,
      },
    },
  ]);

  // Define all expected keys for jobRequest statuses
  const expectedJobStatusKeys = [
    'pending',
    'en-route',
    'dispatched',
    'completed',
    'in-progress',
    'on-scene',
  ];

  // Fill missing keys in jobRequest status with 0
  const overviewStatus = jobRequest?.[0]?.status || {};
  expectedJobStatusKeys.forEach((key) => {
    if (!(key in overviewStatus)) {
      overviewStatus[key] = 0;
    }
  });
  // Calculate activeJobs (excluding completed)
  const activeJobs = expectedJobStatusKeys.reduce((total, key) => {
    if (key !== 'completed') {
      return total + overviewStatus[key];
    }
    return total;
  }, 0);

  // Optional: add activeJobs to the object
  overviewStatus.activeJobs = activeJobs;

  // Define all expected keys for driver activities
  const expectedDriverActivityKeys = ['on-job', 'available', 'offline'];

  // Fill missing keys in driver activity with 0
  const driverActivity = aggregateDriverStatus?.[0]?.activity || {};
  expectedDriverActivityKeys.forEach((key) => {
    if (!(key in driverActivity)) {
      driverActivity[key] = 0;
    }
  });
  const dataToCache = {
    overview: {
      total: jobRequest?.[0]?.total || 0,
      status: overviewStatus,
    },
    driverStatus: {
      total: aggregateDriverStatus?.[0]?.total || 0,
      activity: driverActivity,
    },
    isAutoDispatch: findUser?.isAutoDispatch || false,
  };

  const time = minuteToSecond(5);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, dataToCache, time);

  return dataToCache;
};

const othersCompanyInfo = async (user: TAuthUser) => {
  const cacheKey = `othersCompanyInfo-${user.userId}`;
  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ meta: any; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    return cached;
  }

  const userInfo = await User.aggregate([
    {
      $match: {
        role: USER_ROLE.company,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        company: { $push: { id: '$_id' } },
      },
    },
    {
      $project: {
        _id: 0,
        company: '$company',
        total: 1,
      },
    },
  ]);

  const jobRequest = await JobRequest.aggregate([
    {
      $match: {
        $and: [
          {
            company: {
              $ne: user.userId,
            },
          },
          {
            status: {
              $in: [JOB_STATUS.pending, JOB_STATUS.in_progress],
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        currentJob: '$total',
      },
    },
  ]);

  const result = {
    companies: userInfo[0]?.total,
    currentJob: jobRequest[0]?.currentJob || jobRequest,
  };

  const time = minuteToSecond(5);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, result, time);

  return result;
};

const totalEarnings = async (user: TAuthUser) => {
  const cacheKey = `totalEarnings-${user.userId}`;
  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    return cached;
  }

  const result = await Company.aggregate([
    {
      $match: {
        companyUserId: new mongoose.Types.ObjectId(String(user.userId)),
      },
    },
    {
      $lookup: {
        from: 'payments',
        localField: '_id',
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
        'payment.earnFrom': 'job',
      },
    },
    {
      $addFields: {
        paymentMonth: { $month: '$payment.paymentDate' },
        paymentYear: { $year: '$payment.paymentDate' },
      },
    },
    {
      $facet: {
        currentMonth: [
          {
            $match: {
              paymentMonth: new Date().getMonth() + 1,
              paymentYear: new Date().getFullYear(),
            },
          },
          {
            $group: {
              _id: null,
              currentMonthTotal: { $sum: '$payment.amount' },
            },
          },
        ],
        previousMonth: [
          {
            $match: {
              paymentMonth: new Date().getMonth(),
              paymentYear: new Date().getFullYear(),
            },
          },
          {
            $group: {
              _id: null,
              previousMonthTotal: { $sum: '$payment.amount' },
            },
          },
        ],
      },
    },
    {
      $project: {
        currentMonthTotal: {
          $ifNull: [
            { $arrayElemAt: ['$currentMonth.currentMonthTotal', 0] },
            0,
          ],
        },
        // previousMonthTotal: {
        //   $ifNull: [{ $arrayElemAt: ['$previousMonth.previousMonthTotal', 0] }, 0],
        // },
      },
    },
    {
      $addFields: {
        percentageIncrease: {
          $cond: {
            if: { $gt: ['$previousMonthTotal', 0] },
            then: {
              $multiply: [
                {
                  $divide: [
                    {
                      $subtract: ['$currentMonthTotal', '$previousMonthTotal'],
                    },
                    '$previousMonthTotal',
                  ],
                },
                100,
              ],
            },
            else: 0,
          },
        },
      },
    },
  ]);

  const time = minuteToSecond(5);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, result[0], time);

  return result[0];
};

const getAllDispatchers = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const findHopper = await User.findOne({
    role: USER_ROLE.hopperCompany,
  });

  const userId = user.role === USER_ROLE.admin ? findHopper?._id : user.userId;
  const cacheKey = `getAllDispatchers-${userId}-${JSON.stringify(query)}`;

  const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    // return cached;
  }

  const dispatcherAggregation = new AggregationQueryBuilder(query);

  const result = await dispatcherAggregation
    .customPipeline([
      {
        $match: {
          companyUserId: new mongoose.Types.ObjectId(String(userId)),
        },
      },
      {
        $unwind: {
          path: '$dispatchers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'dispatchers.dispatcher',
          foreignField: '_id',
          as: 'dispatcher',
        },
      },
      {
        $unwind: {
          path: '$dispatcher',
          // preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'profiles',
          localField: 'dispatcher.profile',
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
          _id: 0,
          createdAt: '$dispatcher.createdAt',
          dispatcherId: '$dispatcher._id',
          dispatcherName: '$dispatcher.name',
          dispatcherEmail: '$dispatcher.email',
          companyName: 1,
          profileImage: '$profile.image',
        },
      },
    ])
    .search(['dispatcherName'])
    .sort()
    .paginate()
    .execute(Company);

  const meta = await dispatcherAggregation.countTotal(Company);

  const time = minuteToSecond(5);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, { meta, result }, time);

  const resultData = { meta, result };
  return resultData;
};

const getAllDrivers = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const driverProfileFunction = aggregationPipelineHelper.userProfile('driver');

  let matchStage;

  if (user.role === USER_ROLE.dispatcher) {
    const findCompany = await Company.findOne({
      _id: user.dispatcherCompany,
    });

    matchStage = {
      $match: {
        companyUserId: new mongoose.Types.ObjectId(
          String(findCompany?.companyUserId),
        ),
      },
    };
  } else if (user.role === USER_ROLE.admin) {
    matchStage = {
      $match: {
        _id: new mongoose.Types.ObjectId(
          String(query?.companyUserId || user.hopperCompany),
        ),
      },
    };
  } else {
    matchStage = {
      $match: {
        companyUserId: new mongoose.Types.ObjectId(String(user.userId)),
      },
    };
  }

  try {
    const cacheKey = `getAllDrivers-${user.userId}-${query.filter}`;

    const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
    if (cached) {
      console.log('🚀 Serving from Redis cache');
      // return cached;
    }

    const pipeline = [
      matchStage,
      {
        $unwind: {
          path: '$drivers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'drivers.driver',
          foreignField: '_id',
          as: 'driver',
        },
      },
      {
        $unwind: {
          path: '$driver',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Filter to only show approved drivers with valid data
      {
        $match: {
          'driver._id': { $exists: true, $ne: null },
          'driver.isApproved': true,
          'driver.isCompanyAssigned': true,
        },
      },
      ...driverProfileFunction,

      {
        $project: {
          _id: 0,
          id: '$driver._id',
          name: '$driver.name',
          email: '$driver.email',
          gender: '$driver.gender',
          location: '$driver.location',
          activity: '$driver.activity',
          phone: '$driver.phone',
          ratings: '$driver.ratings',
          companyName: 1,
          profileImage: '$profile.image',
          status: '$driver.status',
        },
      },
    ];
    const aggregateQuery = new AggregationQueryBuilder(query);

    const result = await aggregateQuery
      .customPipeline(pipeline)
      .search(['name'])
      .filter(['activity'])
      .sort()
      .paginate()
      .execute(Company);

    const pagination = await aggregateQuery.countTotal(Company);

    // Use Promise.all to handle async operations for each driver
    const driversWithAverageTime = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.map(async (item: any) => {
        if (item.id) {
          const average = await driverInfoFinding(item?.id);
          return {
            ...item,
            averageTime: average?.averageTime, // Format the average time
          };
        }
        return item; // Return the item even if no id (don't return undefined)
      }),
    );

    const finalResult = {
      meta: pagination,
      result: driversWithAverageTime.filter((item) => item?.id), // Filter out any items without id
    };

    const time = minuteToSecond(5);
    // Cache result for 60 seconds (you can change the TTL)
    await cacheData(cacheKey, finalResult, time);

    return finalResult;
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Error in getAllDrivers:', error);
    throw new Error(error);
  }
};

const driverDetails = async (id: string, user: TAuthUser) => {
  const cacheKey = `driverDetails-${user.userId}-${id}`;
  // Try to fetch from Redis cache first
  // const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
  // if (cached) {
  //   console.log('🚀 Serving from Redis cache');
  //   return cached;
  // }

  const driverExist = await User.findOne({
    _id: new mongoose.Types.ObjectId(String(id)),
    role: USER_ROLE.driver,
  });

  if (!driverExist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Driver not found');
  }

  const driver = await User.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(String(id)) },
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
        from: 'vehicles',
        localField: '_id',
        foreignField: 'userId',
        as: 'vehicle',
      },
    },

    {
      $unwind: {
        path: '$vehicle',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: 'tools',
        localField: '_id',
        foreignField: 'userId',
        as: 'tool',
      },
    },

    {
      $unwind: {
        path: '$tool',
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: 'companies',
        let: { companyId: { $toObjectId: user.myCompany } }, // convert string to ObjectId
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$companyId'] }, // compare with company _id
            },
          },
        ],
        as: 'company',
      },
    },
    {
      $unwind: { path: '$company', preserveNullAndEmptyArrays: true },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        activity: 1,
        phone: 1,
        ratings: 1,
        status: 1,
        companyName: '$company.companyName',
        profileImage: '$profile.image',
        vehicle: '$vehicle',
        tool: '$tool',
      },
    },
  ]);

  const average = await driverInfoFinding(id);

  const finalResult = {
    ...driver[0],
    averageTime: average?.averageTime,
    completedJob: average?.completedJob,
    weeklyJobCount: average?.weeklyJobCount,
  };

  const time = minuteToSecond(5);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, finalResult, time);

  return finalResult;
};

const driverJobDetails = async (
  user: TAuthUser,
  id: string,
  query: Record<string, unknown>,
) => {
  const aggregateQuery = new AggregationQueryBuilder(query);

  const cacheKey = `driverJobDetails-${user.userId}-${id}-${JSON.stringify(query)}`;

  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    return cached;
  }

  const result = await aggregateQuery
    .customPipeline([
      {
        $match: {
          driverId: new mongoose.Types.ObjectId(String(id)),
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
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
      {
        $lookup: {
          from: 'categories',
          localField: 'service.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true,
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
          serviceName: '$service.serviceName',
          serviceDescription: '$service.description',
          icon: '$service.icon',
          categoryName: '$category.categoryName',
          rating: 1,
          createdAt: 1,
          location: '$job.location',
          dropOffLocation: '$job.dropOffLocation',
        },
      },
    ])
    .sort()
    .paginate()
    .execute(Review);

  const pagination = await aggregateQuery.countTotal(Review);

  const finalResult = { meta: pagination, result };

  const time = minuteToSecond(5);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, finalResult, time);

  return finalResult;
};

const jobStatus = async (user: TAuthUser, query: Record<string, unknown>) => {
  let matchStage;

  const { status } = query;
  const newStatus =
    status === 'active' ? { status: { $ne: JOB_STATUS.completed } } : {};

  if (
    user.role === USER_ROLE.company ||
    user.role === USER_ROLE.hopperCompany
  ) {
    const findCompany = await Company.findOne({
      companyUserId: user.userId,
    });

    if (!findCompany) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Company not found');
    }

    matchStage = {
      $match: {
        company: new mongoose.Types.ObjectId(String(findCompany._id)),
        ...newStatus,
      },
    };
  } else if (user.role === USER_ROLE.admin) {
    const findCompany = await Company.findOne({
      _id: user.hopperCompany,
    });

    if (!findCompany) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Company not found');
    }

    matchStage = {
      $match: {
        company: new mongoose.Types.ObjectId(String(findCompany._id)),
        ...newStatus,
      },
    };
  } else {
    matchStage = {
      $match: {
        company: new mongoose.Types.ObjectId(String(user.dispatcherCompany)),
        ...newStatus,
      },
    };
  }

  const cacheKey = `jobStatus-${user.userId}-${JSON.stringify(query)}`;

  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    // return cached;
  }

  const result = await findJobHistory(matchStage, query);

  const time = minuteToSecond(1);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, result, time);
  return result;
};

const manualJobStatus = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  let matchStage;
  const { status } = query;
  const newStatus =
    status === 'active' ? { status: { $ne: JOB_STATUS.completed } } : {};

  if (
    user.role === USER_ROLE.company ||
    user.role === USER_ROLE.hopperCompany
  ) {
    const findCompany = await Company.findOne({
      companyUserId: user.userId,
    });

    if (!findCompany) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Company not found');
    }

    matchStage = {
      $match: {
        company: new mongoose.Types.ObjectId(String(findCompany._id)),
        ...newStatus,
      },
    };
  } else if (user.role === USER_ROLE.admin) {
    const findCompany = await Company.findOne({
      _id: user.hopperCompany,
    });

    if (!findCompany) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Company not found');
    }

    matchStage = {
      $match: {
        company: new mongoose.Types.ObjectId(String(findCompany._id)),
        ...newStatus,
      },
    };
  } else if (user.role === USER_ROLE.driver) {
    const findCompany = await Company.findOne({
      _id: user.assignedCompany,
    });

    if (!findCompany) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Company not found');
    }

    matchStage = {
      $match: {
        company: new mongoose.Types.ObjectId(String(findCompany._id)),
        ...newStatus,
      },
    };
  } else {
    matchStage = {
      $match: {
        company: new mongoose.Types.ObjectId(String(user.dispatcherCompany)),
        ...newStatus,
      },
    };
  }

  const cacheKey = `manualJobStatus-${user.userId}-${JSON.stringify(query)}`;

  const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    // return cached;
  }

  const result = await findManualJobHistory(matchStage, query);

  const time = minuteToSecond(1);
  await cacheData(cacheKey, result, time);

  return result;
};

const updateJobStatus = async (
  jobRequestId: string,
  payload: { status: string },
) => {
  const jobRequest = await JobRequest.findById(jobRequestId);

  if (!jobRequest) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job request not found');
  }

  if (jobRequest.status === payload.status) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Job already in ${payload.status} status`,
    );
  }

  jobRequest.status = payload.status as any;

  if (payload.status === JOB_STATUS.en_route) {
    jobRequest.enRouteAt = new Date();
  } else if (payload.status === 'on-scene') {
    jobRequest.onSceneAt = new Date();
  } else if (payload.status === JOB_STATUS.dispatched) {
    jobRequest.dispatchedAt = new Date();
  } else if (payload.status === JOB_STATUS.completed) {
    jobRequest.completedAt = new Date();
    await User.findByIdAndUpdate(jobRequest.driver, { activity: 'available' });
  } else if (payload.status === JOB_STATUS.cancelled) {
    await Job.findByIdAndUpdate(jobRequest.jobId, { isAssigned: false });
  }

  await jobRequest.save();

  return jobRequest;
};

const availableDrivers = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  // Validate query parameters
  const longitude = Number(query.longitude);
  const latitude = Number(query.latitude);
  if (isNaN(longitude) || isNaN(latitude)) {
    throw new Error('Invalid longitude or latitude');
  }

  const cacheKey = `availableDrivers-${user.userId}-${JSON.stringify(query)}`;

  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    return cached;
  }

  let companyId;
  if (user.role === USER_ROLE.dispatcher) {
    const findCompany = await Company.findOne({
      _id: user.dispatcherCompany,
    });
    companyId = findCompany?.companyUserId;
  } else {
    companyId = user.userId;
  }

  const aggregateQuery = new AggregationQueryBuilder(query);

  const result = await aggregateQuery
    .customPipeline([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distance', // Adds distance in meters to output
          spherical: true,
          maxDistance: 100000, // 100 km
          query: {
            _id: new mongoose.Types.ObjectId(String(companyId)), // Ensure the user is a company user
          },
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
        $unwind: {
          path: '$company.drivers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'company.drivers.driver',
          foreignField: '_id',
          as: 'driver',
        },
      },
      {
        $unwind: {
          path: '$driver',
          preserveNullAndEmptyArrays: true,
        },
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
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Add a match stage to filter drivers by their location
      {
        $match: {
          'driver.role': 'driver',
          'driver.activity': 'available',
          'driver.location': {
            $geoWithin: {
              $centerSphere: [
                [longitude, latitude],
                100000 / 6378137, // 100 km radius (converted to radians)
              ],
            },
          },
        },
      },
      // Optional: Project only the fields you need
      {
        $project: {
          _id: 0,
          distanceRedius: 1,
          driver: {
            _id: 1,
            name: 1,
            activity: 1,
            ratings: 1,
            image: '$profile.image',
          },
        },
      },
    ])
    .search(['driver.name'])
    .sort()
    .paginate()
    .execute(User);
  const pagination = await aggregateQuery.countTotal(User);

  const finalResult = { meta: pagination, availableDrivers: result };

  const time = minuteToSecond(2);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, finalResult, time);

  return finalResult;
};

const availableCompanies = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const aggregateQuery = new AggregationQueryBuilder(query);

  let companyId;
  if (user.role === USER_ROLE.dispatcher) {
    const findCompany = await Company.findOne({
      _id: user.dispatcherCompany,
    });
    companyId = findCompany?.companyUserId;
  } else {
    companyId = user.userId;
  }

  const cacheKey = `availableCompanies-${user.userId}-${JSON.stringify(query)}`;

  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    return cached;
  }

  const result = await aggregateQuery
    .customPipeline([
      {
        $match: {
          $and: [
            {
              $or: [
                { role: USER_ROLE.company },
                { role: USER_ROLE.hopperCompany },
              ],
            },
            { _id: { $ne: new mongoose.Types.ObjectId(String(companyId)) } },
          ],
        },
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'myCompany',
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
        $project: {
          _id: 1,
          companyId: '$company._id',
          companyLogo: '$company.companyLogo',
          companyName: '$company.companyName',
        },
      },
    ])
    .search(['companyName'])
    .sort()
    .paginate()
    .execute(User);

  const pagination = await aggregateQuery.countTotal(User);

  const finalResult = { meta: pagination, availableCompanies: result };

  const time = minuteToSecond(2);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, finalResult, time);

  return finalResult;
};

const assignDriver = async (
  user: TAuthUser,
  payload: { jobId: string; driverId: string },
) => {
  const data = {
    jobId: payload.jobId,
    driverId: payload.driverId,
    companyId: user.myCompany,
    senderId: user.userId,
    receiverId: payload.driverId,
    senderRole: user.role,
    isDispatched: true,
    notificationMessage: `${user.name} has assigned you to a job`,
  };
  await assignJob(data as any);
};

const assignCompany = async (
  user: TAuthUser,
  payload: { jobId: string; companyId: string },
) => {
  // const jobFind = await Job.findById(payload.jobId);
  const jobFind = await Job.findByIdAndUpdate(
    payload.jobId,
    { source: 'partnerBook' },
    { new: true },
  );
  if (!jobFind) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  const data = {
    jobId: payload.jobId,
    company: payload.companyId,
    customer: jobFind.customer,
    status: JOB_STATUS.pending,
    assignedAt: new Date(),
    isDispatched: true,
  };

  const result = await JobRequest.create(data);

  if (result._id) {
    const notificationData = {
      type: NOTIFICATION_TYPE.jobRequest as any,
      senderId: user.userId as any,
      receiverId: payload.companyId as any,
      linkId: result._id as any,
      role: user.role,
      message: `${user.name} has assigned you to a job`,
    };

    await sendNotification(
      { userId: user.userId, role: user.role } as TAuthUser,
      notificationData,
    );
  }

  return result;
};

const companyOverview = async (user: TAuthUser) => {
  const result = await JobRequest.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(String(user.myCompany)),
        status: { $nin: [JOB_STATUS.completed, JOB_STATUS.cancelled] },
      },
    },
    {
      $group: {
        _id: null,
        activeJobs: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        activeJobs: 1,
      },
    },
  ]);

  const totalEarnings = await Payment.aggregate([
    {
      $match: {
        $and: [
          {
            companyId: new mongoose.Types.ObjectId(String(user.myCompany)),
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

  const totalDriver = await User.aggregate([
    {
      $match: {
        role: USER_ROLE.driver,
        assignedCompany: new mongoose.Types.ObjectId(String(user.myCompany)),
      },
    },
    {
      $group: {
        _id: '$assignedCompany',
        totalDriver: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalDriver: 1,
      },
    },
  ]);

  const cacheKey = `companyOverview-${user.userId}`;

  // Try to fetch from Redis cache first
  const cached = await getCachedData<{
    activeJobs: number;
    totalEarnings: number;
    totalDriver: number;
  }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    return cached;
  }

  const finalResult = {
    activeJobs: result[0]?.activeJobs || 0,
    totalEarnings,
    totalDriver: totalDriver[0]?.totalDriver || 0,
  };

  const time = minuteToSecond(2);
  // Cache result for 60 seconds (you can change the TTL)
  await cacheData(cacheKey, finalResult, time);

  return finalResult;
};

const getAllCompanyList = async (query: any) => {
  const listAggregation = new AggregationQueryBuilder(query);

  const cacheKey = `getAllCompanyList-${JSON.stringify(query)}`;

  const cached = await getCachedData<{ meta: TMeta; result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    // return cached;
  }

  const result = await listAggregation
    .customPipeline([
      {
        $match: {},
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id', // assuming this is the company _id
          foreignField: 'companyId',
          pipeline: [
            {
              $group: {
                _id: '$companyId',
                totalAmount: { $sum: '$amount' },
              },
            },
          ],
          as: 'paymentInfo',
        },
      },

      {
        $addFields: {
          totalPaymentAmount: {
            $ifNull: [{ $arrayElemAt: ['$paymentInfo.totalAmount', 0] }, 0],
          },
        },
      },
      {
        $lookup: {
          from: 'jobrequests',
          localField: '_id',
          foreignField: 'company',
          pipeline: [
            {
              $match: {
                status: 'completed',
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
              $group: {
                _id: '$job.categoryName',
                totalEarnings: { $sum: '$job.totalCost' },
                totalJobs: { $sum: 1 },
                serviceName: { $first: '$job.serviceName' },
                date: { $first: '$createdAt' },
                company: { $first: '$company' },
              },
            },
          ],
          as: 'jobInfo',
        },
      },

      {
        $addFields: {
          totalJobs: {
            $sum: '$jobInfo.totalJobs',
          },
        },
      },

      {
        $project: {
          dispatchers: { $size: '$dispatchers' },
          totalDrivers: { $size: '$drivers' },
          totalJobs: 1,
          totalPaymentAmount: 1,
          companyUserId: 1,
          companyLogo: 1,
          companyName: 1,
          invitationCode: 1,
          jobInfo: 1,
          drivers: 1,
        },
      },
      {
        $unwind: {
          path: '$drivers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'drivers.driver',
          foreignField: '_id',
          as: 'driverInfo',
        },
      },
      {
        $unwind: {
          path: '$driverInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          dispatchers: { $first: '$dispatchers' },
          totalDrivers: { $first: '$totalDrivers' },
          totalJobs: { $first: '$totalJobs' },
          totalPaymentAmount: { $first: '$totalPaymentAmount' },
          companyUserId: { $first: '$companyUserId' },
          companyLogo: { $first: '$companyLogo' },
          companyName: { $first: '$companyName' },
          invitationCode: { $first: '$invitationCode' },
          jobInfo: { $first: '$jobInfo' },
          drivers: {
            $push: {
              name: '$driverInfo.name',
              uid: '$driverInfo.uid',
              createdAt: '$driverInfo.createdAt',
            },
          },
        },
      },

      {
        $lookup: {
          from: 'users',
          localField: 'companyUserId',
          foreignField: '_id',
          as: 'companyInfo',
        },
      },
      {
        $unwind: {
          path: '$companyInfo',
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          dispatchers: 1,
          totalDrivers: 1,
          totalJobs: 1,
          totalPaymentAmount: 1,
          companyUserId: 1,
          companyLogo: 1,
          companyName: 1,
          invitationCode: 1,
          jobInfo: 1,
          drivers: 1,
          status: '$companyInfo.status',
        },
      },
    ])
    .search(['companyName'])
    .sort()
    .paginate()
    .execute(Company);

  const meta = await listAggregation.countTotal(Company);

  const time = minuteToSecond(5);
  await cacheData(cacheKey, { meta, result }, time);

  return { meta, result };
};

const getAllLeaveRequests = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const leaveAggregation = new AggregationQueryBuilder(query);

  const result = await leaveAggregation
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
        $project: {
          _id: 1,
          userId: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
          },
          companyId: 1,
          reason: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])
    .sort()
    .paginate()
    .execute(LeaveRequest);

  const meta = await leaveAggregation.countTotal(LeaveRequest);

  return { meta, result };
};

const acceptLeaveRequest = async (
  user: TAuthUser,
  id: string,
  payload: { action: string; userId: string },
) => {
  const leaveRequest = await LeaveRequest.findOne({
    _id: id,
    companyId: user.myCompany,
  });

  if (!leaveRequest) {
    throw new AppError(httpStatus.NOT_FOUND, 'Leave request not found');
  }

  // Determine action outcome
  const isAccepted = payload.action === 'approved';
  if (!isAccepted && payload.action !== 'rejected') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid action');
  }

  // Update leave request status
  leaveRequest.status = isAccepted ? 'approved' : 'rejected';
  await leaveRequest.save();

  // Construct notification message
  const message = `Your leave request has been ${leaveRequest.status === 'approved' ? 'accepted' : 'rejected'} by ${user.name}`;

  // Send notification to the user about the action
  await sendNotification(
    { userId: user.userId, role: user.role } as TAuthUser,
    {
      type:
        payload.action === 'approved'
          ? NOTIFICATION_TYPE.leaveRequest
          : (NOTIFICATION_TYPE.rejectedLeaveRequest as any),
      senderId: user.userId as any,
      receiverId: payload.userId as any,
      linkId: leaveRequest._id as any,
      role: user.role,
      message,
    },
  );

  // If the action is 'approved', update associated user and company data
  if (isAccepted) {
    const companyId = new mongoose.Types.ObjectId(
      String(leaveRequest.companyId),
    );
    const driverId = new mongoose.Types.ObjectId(String(payload.userId));

    // Remove driver from company and reset user assignments
    const [updatedCompany, updatedUser, updatedJoinRequest] = await Promise.all(
      [
        Company.findOneAndUpdate(
          { _id: companyId },
          { $pull: { drivers: { driver: driverId } } },
          { new: true },
        ),
        User.findOneAndUpdate(
          { _id: driverId },
          {
            assignedCompany: null,
            isApproved: false,
            isCompanyAssigned: false,
            activity: '',
          },
          { new: true },
        ),
        // Update JoinRequest status to 'left' so driver can rejoin in the future
        JoinRequest.findOneAndUpdate(
          { userId: driverId, companyId },
          { $set: { status: 'left' } },
          { new: true },
        ),
      ],
    );
    const findjr = await JoinRequest.findOne({
      userId: driverId,
      companyId,
    });

    const user = await User.findById({ _id: driverId });
  }

  return leaveRequest;
};

const removeCompany = async (companyId: string, user: TAuthUser) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, 'Company not found');
    }

    // Only admin and hopperCompany can remove companies
    if (
      user.role !== USER_ROLE.admin &&
      user.role !== USER_ROLE.hopperCompany
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You are not authorized to remove companies',
      );
    }

    // Remove the company user account
    await User.findByIdAndDelete(company.companyUserId, { session });

    // Remove all drivers' assigned company reference
    if (company.drivers && company.drivers.length > 0) {
      const driverIds = company.drivers.map((d: any) => d.driver);
      await User.updateMany(
        { _id: { $in: driverIds } },
        { $unset: { assignedCompany: '' } },
        { session },
      );
    }

    // Remove all dispatchers
    if (company.dispatchers && company.dispatchers.length > 0) {
      const dispatcherIds = company.dispatchers.map((d: any) => d.dispatcher);
      await User.deleteMany({ _id: { $in: dispatcherIds } }, { session });
    }

    // Remove company profile if exists
    if (company.profileId) {
      await Profile.findByIdAndDelete(company.profileId, { session });
    }

    // Remove the company itself
    await Company.findByIdAndDelete(companyId, { session });

    // Clear related caches
    await deleteCache(`quickOverview-${company.companyUserId}`);
    await deleteCache(`companyOverview-${company.companyUserId}`);
    await deleteCache(`getAllCompanyList-*`);

    await session.commitTransaction();
    session.endSession();

    return { message: 'Company removed successfully' };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const CompanyService = {
  jobStatus,
  manualJobStatus,
  updateJobStatus,
  joinCompany,
  assignDriver,
  driverDetails,
  getAllDrivers,
  assignCompany,
  addDispatcher,
  totalEarnings,
  quickOverview,
  invitationCode,
  companyOverview,
  availableDrivers,
  driverJobDetails,
  othersCompanyInfo,
  getAllDispatchers,
  availableCompanies,
  getAllCompanyList,
  getAllLeaveRequests,
  acceptLeaveRequest,
  removeCompany,
};
