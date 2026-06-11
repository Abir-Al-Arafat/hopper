/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { aggregationPipelineHelper } from '../../helper/aggregationPipline';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import Job from '../job/job.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import User from '../user/user.model';
import { JOB_STATUS, TJobStatus } from './jobRequest.interface';
import JobRequest from './jobRequest.model';
import {
  assignJob,
  findJobHistory,
  getDistanceInMiles,
} from './jobRequest.utils';
import PendingPayout from '../pendingPayout/pendingPayout.model';
import { USER_ROLE } from '../../constant';
import pickQuery from '../../utils/pickQuery';
import { paginationHelper } from '../../helper/pagination.helpers';

const acceptJobRequest = async (
  payload: { jobId: string },
  user: TAuthUser,
) => {
  const job = (await Job.findOne({ _id: payload.jobId }).populate(
    'service',
  )) as any;

  const driver = await User.findById(user.userId);
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
  }

  if (job?.isAssigned) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Already this job is assigned');
  }

  const jobLocation = job?.location;
  const driverLocation = driver?.location;

  const mile = getDistanceInMiles(
    jobLocation?.coordinates?.[1] as number,
    jobLocation?.coordinates?.[0] as number,
    driverLocation?.coordinates?.[1] as number,
    driverLocation?.coordinates?.[0] as number,
  );

  const totalMileageFee = Number((mile * job?.service?.milageFee).toFixed(2));

  console.log('mile =>', mile, 'totalMileageFee =>', totalMileageFee);

  const data = {
    jobId: payload.jobId,
    driverId: user.userId,
    companyId: user.assignedCompany,
    senderId: user.userId,
    receiverId: job?.customer,
    senderRole: user.role,
    notificationMessage: `${user.name} has accepted your job request`,
    // mileageFee: 0 Number(totalMileageFee.toFixed(2)),
    mileageFee: Number(totalMileageFee.toFixed(2)) || 0,
    mile,
  } as any;

  const jobRequest = await assignJob(data);
  return jobRequest;
};

const jobRequestAction = async (
  payload: {
    action: Partial<TJobStatus>;
    jobId: string;
    beforeImage?: string;
    afterImage?: string;
    signature?: string;
  },
  user: TAuthUser,
) => {
  const findJob = await Job.findOne({ _id: payload.jobId }).populate('service');
  if (!findJob) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  const jobRequest = await JobRequest.findOne({
    $and: [{ jobId: payload.jobId }, { status: { $ne: JOB_STATUS.cancelled } }],
  });

  if (!jobRequest) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job request not found');
  }
  const driver = await User.findById(jobRequest?.driver);
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
  }

  const statusMessages: Record<any, string> = {
    [JOB_STATUS.completed]: `${user.name} has completed the job`,
    [JOB_STATUS.cancelled]: `${user.name} has cancelled the job`,
    [JOB_STATUS.just]: `${user.name} has just started the job`,
    [JOB_STATUS.pickedUp]: `${user.name} has picked up the job`,
    [JOB_STATUS.droppedOff]: `${user.name} has dropped off the job`,
    [JOB_STATUS.enRoute]: `${user.name} is en route for the job`,
    [JOB_STATUS.working]: `${user.name} is working on the job`,
    [JOB_STATUS.onScene]: `${user.name} is on scene for the job`,
    [JOB_STATUS.dispatched]: `${user.name} has dispatched the job`,
    [JOB_STATUS.rejected]: `${user.name} has rejected the job`,
  };

  // Set default message
  const message = statusMessages[payload.action] || 'Job request updated';

  // Update the job request with the appropriate status and timestamp
  jobRequest.status = payload?.action || jobRequest.status;

  switch (payload?.action) {
    case JOB_STATUS.completed:
      jobRequest.completedAt = new Date();
      driver.activity = 'available';

      await PendingPayout.create({
        jobRequestId: jobRequest._id,
        companyId: jobRequest.company,
        driverId: jobRequest?.driver,
      });

      await driver.save();
      break;
    case JOB_STATUS.enRoute:
      jobRequest.enRouteAt = new Date();
      break;
    case JOB_STATUS.onScene:
      jobRequest.onSceneAt = new Date();
      break;
    case JOB_STATUS.dispatched:
      jobRequest.dispatchedAt = new Date();
      break;
    case JOB_STATUS.cancelled:
      findJob.isAssigned = false;
      jobRequest.status = JOB_STATUS.cancelled;
      break;
    default:
      break;
  }

  if (payload.beforeImage) {
    findJob.beforeImage = payload.beforeImage;
  } else if (payload.afterImage) {
    findJob.afterImage = payload.afterImage;
  } else if (payload.signature) {
    findJob.signature = payload.signature;
  }

  const notificationIds = [
    {
      receiverId: findJob.customer,
    },
    {
      receiverId: jobRequest.company,
    },
  ];

  const notificationSend = notificationIds.map(async (notificationId) => {
    const notificationData = {
      type:
        payload.action === JOB_STATUS.completed
          ? NOTIFICATION_TYPE.completedJob
          : (NOTIFICATION_TYPE.jobRequest as any),
      senderId: user.userId as any,
      receiverId: notificationId.receiverId as any,
      linkId: jobRequest._id as any,
      role: user.role,
      message,
      jobRequest: { jobRequest, jobData: findJob, service: findJob.service },
    };
    return sendNotification(user, notificationData);
  });

  await Promise.all(notificationSend);

  await jobRequest.save();
  await findJob.save();

  const updatedData = await JobRequest.findOne({
    $and: [{ jobId: payload.jobId }, { status: { $ne: JOB_STATUS.cancelled } }],
  })
    .populate('jobId')
    .lean();

  return updatedData;
};

const findDriver = async (jobRequestId: string) => {
  const driverProfileFunction = aggregationPipelineHelper.userProfile('driver');

  const jobRequest = await JobRequest.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(jobRequestId),
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
    {
      $unwind: {
        path: '$driver',
        preserveNullAndEmptyArrays: true,
      },
    },
    ...driverProfileFunction,
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
        from: 'vehicles',
        localField: 'job.car',
        foreignField: '_id',
        as: 'car',
      },
    },
    {
      $unwind: {
        path: '$car',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        driver: {
          _id: '$driver._id',
          name: '$driver.name',
          email: '$driver.email',
          image: '$profile.image',
          assignedCompany: '$driver.assignedCompany',
        },
        Vehicle: {
          vehicleName: '$car.vehicleName',
          vehicleColor: '$car.vehicleColor',
          numberPlate: '$car.numberPlate',
        },
        jobInfo: {
          houseAddress: '$job.houseAddress',
          city: '$job.city',
          state: '$job.state',
          zipCode: '$job.zipCode',
          location: '$job.location',
          dropOffLocation: '$job.dropOffLocation',
        },
      },
    },
  ]);

  return jobRequest;
};

const getJobHistory = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  let userId: Record<string, any>;

  if (user.role === 'customer') {
    userId = { customer: new mongoose.Types.ObjectId(String(user.userId)) };
  } else if (user.role === 'company') {
    userId = { company: new mongoose.Types.ObjectId(String(user.myCompany)) };
  } else if (user.role === 'hopperCompany') {
    userId = { company: new mongoose.Types.ObjectId(String(user.myCompany)) };
  } else {
    userId = { driver: new mongoose.Types.ObjectId(String(user.userId)) };
  }
  // const status = !query.filter
  //   ? { $nin: [JOB_STATUS.cancelled, JOB_STATUS.completed] }
  //   : query.filter;

  const matchStage = {
    $match: {
      ...userId,
      // status: status,
    },
  };

  if (query.filter) {
    matchStage.$match.status = query.filter;
  }

  const result = await findJobHistory(matchStage, query);

  return result;
};

const trackLocation = async (jobRequestId: string) => {
  const driverProfileFunction = aggregationPipelineHelper.userProfile('driver');
  const jobRequest = await JobRequest.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(jobRequestId),
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
    {
      $unwind: {
        path: '$driver',
        preserveNullAndEmptyArrays: true,
      },
    },
    ...driverProfileFunction,

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
        from: 'vehicles',
        localField: 'job.car',
        foreignField: '_id',
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
      $project: {
        job: {
          _id: '$job._id',
          houseAddress: '$job.houseAddress',
          city: '$job.city',
          state: '$job.state',
          zipCode: '$job.zipCode',
          location: '$job.location',
          dropOffLocation: '$job.dropOffLocation',
        },
        driver: {
          _id: '$driver._id',
          name: '$driver.name',
          image: '$profile.image',
          location: '$driver.location',
        },
        vehicle: {
          vehicleName: '$vehicle.vehicleName',
          vehicleColor: '$vehicle.vehicleColor',
          numberPlate: '$vehicle.numberPlate',
        },
      },
    },
  ]);

  return jobRequest;
};

const getAllJobs = async (user: TAuthUser, query: Record<string, unknown>) => {
  let matchStage = {
    $match: {},
  };

  if (
    user.role === USER_ROLE.hopperCompany ||
    user.role === USER_ROLE.company
  ) {
    matchStage = {
      $match: {
        company: new mongoose.Types.ObjectId(String(user.myCompany)),
      },
    };
  }

  const result = await findJobHistory(matchStage, query);

  return result;
};

const fetchAllJobRequests = async (query: Record<string, any>) => {
  const { filters, pagination } = await pickQuery(query);
  const { searchTerm, customer, company, driver, jobId, ...filtersData } =
    filters;

  const pipeline: any[] = [];

  if (customer) filtersData.customer = new mongoose.Types.ObjectId(customer);
  if (company) filtersData.company = new mongoose.Types.ObjectId(company);
  if (driver) filtersData.driver = new mongoose.Types.ObjectId(driver);
  if (jobId) filtersData.jobId = new mongoose.Types.ObjectId(jobId);

  // If searchTerm is provided, add a search condition
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: ['status'].map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: 'i',
          },
        })),
      },
    });
  }

  if (Object.entries(filtersData).length) {
    pipeline.push({
      $match: {
        $and: Object.entries(filtersData).map(([field, value]) => ({
          isDeleted: false,
          [field]: value,
        })),
      },
    });
  }

  const { page, limit, skip, sort } =
    paginationHelper.calculatePagination(pagination);

  if (sort) {
    const sortArray = sort.split(',').map((field) => {
      const trimmedField = field.trim();
      if (trimmedField.startsWith('-')) {
        return { [trimmedField.slice(1)]: -1 };
      }
      return { [trimmedField]: 1 };
    });
    pipeline.push({ $sort: Object.assign({}, ...sortArray) });
  }

  pipeline.push({
    $facet: {
      totalData: [{ $count: 'total' }],
      paginatedData: [
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'customer',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'company',
            foreignField: '_id',
            as: 'company',
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
        {
          $lookup: {
            from: 'jobs',
            localField: 'jobId',
            foreignField: '_id',
            as: 'jobId',
          },
        },
        {
          $addFields: {
            customer: { $arrayElemAt: ['$customer', 0] },
            company: { $arrayElemAt: ['$company', 0] },
            driver: { $arrayElemAt: ['$driver', 0] },
            jobId: { $arrayElemAt: ['$jobId', 0] },
          },
        },
      ],
    },
  });

  const [result] = await User.aggregate(pipeline);

  const total = result?.totalData?.[0]?.total || 0;
  const data = result?.paginatedData || [];

  return {
    meta: { page, limit, total },
    data,
  };
};

export const JobRequestService = {
  findDriver,
  getJobHistory,
  trackLocation,
  acceptJobRequest,
  jobRequestAction,
  getAllJobs,
  fetchAllJobRequests,
};
