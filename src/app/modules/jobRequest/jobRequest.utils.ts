/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { ObjectId } from 'mongoose';
import sendNotification from '../../../socket/sendNotification';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import Job from '../job/job.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import { ServiceService } from '../service/service.service';
import User from '../user/user.model';
import Vehicle from '../vehicle/vehical.model';
import { JOB_STATUS } from './jobRequest.interface';
import JobRequest from './jobRequest.model';

export const findJobHistory = async (
  matchStage: any,
  query: Record<string, unknown>,
) => {
  const customPipeline = [
    matchStage,

    // Job
    {
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'job',
      },
    },
    { $unwind: { path: '$job', preserveNullAndEmptyArrays: true } },

    // Driver
    {
      $lookup: {
        from: 'users',
        localField: 'driver',
        foreignField: '_id',
        as: 'driver',
      },
    },
    { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },

    // Customer
    {
      $lookup: {
        from: 'users',
        localField: 'customer',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },

    // Vehicle (optional: if multiple vehicle thake, ekhaneo duplicate hote pare)
    {
      $lookup: {
        from: 'vehicles',
        let: { driverId: '$driver._id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$userId', '$$driverId'] },
            },
          },
          { $limit: 1 }, // ensure single vehicle
        ],
        as: 'car',
      },
    },
    { $unwind: { path: '$car', preserveNullAndEmptyArrays: true } },

    // Service
    {
      $lookup: {
        from: 'services',
        localField: 'job.service',
        foreignField: '_id',
        as: 'service',
      },
    },
    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

    // Manual Job
    {
      $lookup: {
        from: 'manualjobs',
        localField: 'job._id',
        foreignField: 'jobId',
        as: 'manualJob',
      },
    },
    { $unwind: { path: '$manualJob', preserveNullAndEmptyArrays: true } },

    // ✅ Payment (FIXED: latest only)
    {
      $lookup: {
        from: 'payments',
        let: { jobRequestId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$jobRequestId', '$$jobRequestId'] },
            },
          },
          { $sort: { createdAt: -1 } }, // latest first
          { $limit: 1 },
        ],
        as: 'payment',
      },
    },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },

    // Projection
    {
      $project: {
        driver: {
          _id: '$driver._id',
          name: '$driver.name',
          email: '$driver.email',
          location: '$driver.location',
          phone: '$driver.phone',
        },

        customer: {
          _id: '$customer._id',
          name: '$customer.name',
          email: '$customer.email',
          location: '$customer.location',
          phone: '$customer.phone',
        },

        Vehicle: {
          vehicleName: '$car.vehicleName',
          vehicleColor: '$car.vehicleColor',
          numberPlate: '$car.numberPlate',
        },

        jobInfo: {
          houseAddress: '$job.houseAddress',
          serviceName: '$service.serviceName',
          categoryName: '$job.categoryName',
          specialInstruction: '$job.specialInstruction',
          extraService: '$job.extraService',
          city: '$job.city',
          uid: '$job.uid',
          totalCost: '$job.totalCost',
          driverCommission: '$driverCommission',
          state: '$job.state',
          zipCode: '$job.zipCode',
          location: '$job.location',
          dropOffLocation: '$job.dropOffLocation',
          isAssigned: '$job.isAssigned',
          icon: '$service.icon',
          jobId: '$job._id',
          afterImage: '$job.afterImage',
          beforeImage: '$job.beforeImage',
          signature: '$job.signature',
        },

        manualJobInfo: {
          customerName: '$manualJob.customerName',
          customerPhone: '$manualJob.customerPhone',
          customerEmail: '$manualJob.customerEmail',
          callerName: '$manualJob.callerName',
          callerPhone: '$manualJob.callerPhone',
          account: '$manualJob.account',
          paymentType: '$manualJob.paymentType',
          pro: '$manualJob.pro',
          classType: '$manualJob.classType',
          eta: '$manualJob.eta',
          pickupName: '$manualJob.pickupName',
          pickupNumber: '$manualJob.pickupNumber',
          dropoffName: '$manualJob.dropoffName',
          dropoffNumber: '$manualJob.dropoffNumber',
          notes: '$manualJob.notes',
          manualJobId: '$manualJob._id',
        },

        jobRequest: {
          jobRequestId: '$_id',
          assignedAt: '$assignedAt',
          dispatchedAt: '$dispatchedAt',
          enRouteAt: '$enRouteAt',
          onSceneAt: '$onSceneAt',
          completedAt: '$completedAt',
          status: '$status',
        },

        paymentInfo: {
          paymentId: '$payment.paymentId',
          amount: '$payment.amount',
          paymentStatus: '$payment.paymentStatus',
          paymentType: '$payment.paymentType',
          paymentDate: '$payment.paymentDate',
          earnFrom: '$payment.earnFrom',
        },

        service: 1,
        completedAt: '$completedAt',
      },
    },
  ];

  const aggregationBuilder = new AggregationQueryBuilder(query);

  const result = await aggregationBuilder
    .customPipeline(customPipeline)
    .search([
      'jobInfo.serviceName',
      'jobInfo.categoryName',
      'driver.name',
      'customer.name',
    ])
    .filter(['jobRequest.status'])
    .sort()
    .paginate()
    .execute(JobRequest);

  const pagination = await aggregationBuilder.countTotal(JobRequest);

  return { meta: pagination, result };
};

export const findManualJobHistory = async (
  matchStage: any,
  query: Record<string, unknown>,
) => {
  const customPipeline = [
    matchStage,
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
    {
      $lookup: {
        from: 'users',
        localField: 'customer',
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
        from: 'vehicles',
        localField: 'driver._id',
        foreignField: 'userId',
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
      $lookup: {
        from: 'services',
        localField: 'job.service',
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
        from: 'manualjobs',
        localField: 'job._id',
        foreignField: 'jobId',
        as: 'manualJob',
      },
    },
    {
      $unwind: {
        path: '$manualJob',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: {
        driver: {
          _id: '$driver._id',
          name: '$driver.name',
          email: '$driver.email',
          location: '$driver.location',
          phone: '$driver.phone',
        },
        customer: {
          _id: '$customer._id',
          name: '$customer.name',
          email: '$customer.email',
          location: '$customer.location',
          phone: '$customer.phone',
        },
        Vehicle: {
          vehicleName: '$car.vehicleName',
          vehicleColor: '$car.vehicleColor',
          numberPlate: '$car.numberPlate',
        },
        jobInfo: {
          houseAddress: '$job.houseAddress',
          serviceName: '$service.serviceName',
          categoryName: '$job.categoryName',
          specialInstruction: '$job.specialInstruction',
          extraService: '$job.extraService',
          city: '$job.city',
          uid: '$job.uid',
          totalCost: '$job.totalCost',
          state: '$job.state',
          zipCode: '$job.zipCode',
          location: '$job.location',
          dropOffLocation: '$job.dropOffLocation',
          isAssigned: '$job.isAssigned',
          icon: '$service.icon',
          jobId: '$job._id',
          afterImage: '$job.afterImage',
          beforeImage: '$job.beforeImage',
          signature: '$job.signature',
        },
        manualJobInfo: {
          customerName: '$manualJob.customerName',
          customerPhone: '$manualJob.customerPhone',
          customerEmail: '$manualJob.customerEmail',
          callerName: '$manualJob.callerName',
          callerPhone: '$manualJob.callerPhone',
          account: '$manualJob.account',
          paymentType: '$manualJob.paymentType',
          pro: '$manualJob.pro',
          classType: '$manualJob.classType',
          eta: '$manualJob.eta',
          pickupName: '$manualJob.pickupName',
          pickupNumber: '$manualJob.pickupNumber',
          dropoffName: '$manualJob.dropoffName',
          dropoffNumber: '$manualJob.dropoffNumber',
          notes: '$manualJob.notes',
          manualJobId: '$manualJob._id',
        },
        jobRequest: {
          jobRequestId: '$_id',
          assignedAt: '$assignedAt',
          dispatchedAt: '$dispatchedAt',
          enRouteAt: '$enRouteAt',
          onSceneAt: '$onSceneAt',
          completedAt: '$completedAt',
          status: '$status',
        },
        service: 1,
        completedAt: '$completedAt',
      },
    },
  ];

  const aggregationBuilder = new AggregationQueryBuilder(query);
  const result = await aggregationBuilder
    .customPipeline(customPipeline)
    .search([
      'jobInfo.serviceName',
      'jobInfo.categoryName',
      'driver.name',
      'customer.name',
      'manualJobInfo.customerName',
      'manualJobInfo.callerName',
      'manualJobInfo.pickupName',
      'manualJobInfo.dropoffName',
    ])
    .filter(['jobRequest.status'])
    .sort()
    .paginate()
    .execute(JobRequest);

  const pagination = await aggregationBuilder.countTotal(JobRequest);

  return { meta: pagination, result };
};

type AssignJobOptions = {
  jobId: ObjectId | string | undefined;
  driverId: ObjectId | string | undefined;
  companyId: ObjectId | string | undefined;
  senderId: ObjectId | string | undefined;
  receiverId: ObjectId | string | undefined;
  senderRole: string;
  notificationMessage: string;
  isDispatched: boolean;
  mileageFee: number;
  mile: number;
};

export const assignJob = async ({
  jobId,
  driverId,
  companyId,
  senderId,
  receiverId,
  senderRole,
  notificationMessage,
  isDispatched,
  mileageFee,
  mile,
}: AssignJobOptions) => {
  const findJob = await Job.findOne({ _id: jobId });
  console.log('findJob =>', findJob);
  if (!findJob) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  const findService = (await ServiceService.getServiceById(
    findJob.service as any,
  )) as any;

  if (!findService) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }

  console.log(mileageFee, 'mileageFee');

  // ✅ FIX: Calculate final total cost FIRST (including mileage fee)
  const finalTotalCost = Number(findJob?.totalCost) + Number(mileageFee);

  // ✅ FIX: Calculate driver commission on FINAL total cost
  const driverPercentage =
    (finalTotalCost / 100) * (100 - Number(findService?.category?.parentage));

  // Log payout calculation for audit trail
  console.log('Payout Calculation:', {
    originalCost: findJob?.totalCost,
    mileageFee: mileageFee,
    finalTotalCost: finalTotalCost,
    driverPercentage: findService?.category?.parentage,
    driverCommission: driverPercentage,
    companyCommission: finalTotalCost - driverPercentage,
  });

  const driver = await User.findById(driverId).populate('profile');
  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
  }

  const jobRequestFind = await JobRequest.findOne({
    jobId,
  });

  if (jobRequestFind && jobRequestFind?.status !== JOB_STATUS.cancelled) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Job has been already done, please create another job and try again',
    );
  }

  const jobRequest = await JobRequest.create({
    jobId,
    driver: driver._id,
    customer: findJob.customer,
    company: companyId,
    assignedAt: new Date(),
    status: JOB_STATUS.inProgress,
    isDispatched,
    driverCommission: driverPercentage, // ✅ Now calculated on final cost
    mileageFeeAmount: mileageFee, // ✅ Store mileage fee in job request
  });

  driver.activity = 'on-job';
  const vehicle = await Vehicle.findOne({ userId: driver._id });

  const driverInfo = {
    driver,
    vehicle,
  };

  if (jobRequest._id) {
    const notificationData = {
      type: NOTIFICATION_TYPE.acceptedJob as any,
      senderId: senderId as any,
      receiverId: receiverId as any,
      linkId: jobRequest._id as any,
      role: senderRole,
      message: notificationMessage,
      distance: mile,
      data: driverInfo,
    };

    await sendNotification(
      { userId: senderId, role: senderRole } as TAuthUser,
      notificationData,
    );
  }

  findJob.isAssigned = true;
  findJob.totalCost = finalTotalCost; // ✅ Use pre-calculated final cost
  await findJob.save();
  await driver.save();
  return {
    ...jobRequest.toObject(),
    mile,
    mileageFee,
  };
};

// Haversine formula in miles
export function getDistanceInMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
