/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { cacheData, getCachedData } from '../../../redis';
import { passwordSend } from '../../../shared/html/passwordSendHtml';
import sendNotification from '../../../socket/sendNotification';
import { JOB_STATUS, USER_ROLE, USER_STATUS } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import AppError from '../../utils/AppError';
import generateUID from '../../utils/generateUID';
import { jobUidCreate } from '../../utils/jobUid';
import { minuteToSecond } from '../../utils/minitToSecond';
import sendMail from '../../utils/sendMail';
import JobRequest from '../jobRequest/jobRequest.model';
import ManualJob from '../manualJob/manualJob.model';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import Profile from '../profile/profile.model';
import ScheduleJob from '../scheduleJob/scheduleJob.model';
import Service from '../service/service.model';
import { ServiceService } from '../service/service.service';
import User from '../user/user.model';
import Vehicle from '../vehicle/vehical.model';
import { TJob } from './job.interface';
import Job from './job.model';
import { calculateDistance } from './job.utils';
import pickQuery from '../../utils/pickQuery';
import { paginationHelper } from '../../helper/pagination.helpers';
import Payment from '../payment/payment.model';

const createJob = async (payload: Partial<TJob> | any, user: TAuthUser) => {
  const jobPayload = {
    ...payload,
    customer: user.userId,
    uid: await jobUidCreate(),
  };
  console.log(payload, 'payload in service pre===>');
  if (payload?.extraService) {
    const totalPrice = await Promise.all(
      payload?.extraService?.map(async (id: string) => {
        const service = await Service.findById(id);
        if (!service) {
          throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
        }
        const price = service.price;
        // const price = service.price + service.milageFee + service.totalFee;
        return price;
      }),
    );

    let sumPrice = 0;
    for (let i = 0; i < totalPrice.length; i++) {
      sumPrice += totalPrice[i];
    }
    console.log(sumPrice, 'sumPrice===>');
    jobPayload.totalCost += sumPrice;
  }
  console.log(jobPayload, 'jobPayload ============>');
  const job = await Job.create(jobPayload);
  if (!job) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Job not created');
  }
  const service = await Service.findById(payload?.service).populate('category');

  console.log(service, 'service details in job service===>');
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  }
  const driverCommissionPercentage =
    100 - Number((service.category as any).parentage);
  jobPayload.totalCost =
    (driverCommissionPercentage / 100) * jobPayload.totalCost;
  const pipeline: any = [];

  pipeline.push(
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [
            payload?.location?.coordinates[0], // Job location longitude
            payload?.location?.coordinates[1], // Job location latitude
          ],
        },
        distanceField: 'distance', // Store the calculated distance in the 'distance' field
        spherical: true, // Use spherical calculations for the distance
        maxDistance: 100000000, // Max distance to consider, adjust as necessary
        // maxDistance: 100000, // Max distance to consider, adjust as necessary
        query: {
          role: { $in: [USER_ROLE.company, USER_ROLE.hopperCompany] },
          isDeleted: false,
        },
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
      $unwind: '$company',
    },
    {
      $project: {
        drivers: '$company.drivers',
        distance: 1, // Include the distance from the $geoNear stage
      },
    },
    {
      $unwind: '$drivers', // Unwind the drivers array
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
      $unwind: '$driver',
    },
    {
      $match: {
        'driver.activity': {
          $in: ['available', 'on-job'],
        },
        'driver.status': USER_STATUS.active,
        'driver.isDeleted': false,
        'driver.isAutoDispatch': true,
      },
    },

    {
      $group: {
        _id: '$_id',
        driver: { $push: '$driver' },
        distance: { $first: '$distance' }, // Capture the first distance value
      },
    },
    {
      $project: {
        'driver._id': 1,
        'driver.email': 1,
        'driver.location': 1,
        distance: 1, // Include the distance field in the output
        company: 1,
      },
    },
  );

  const findCompanyDriver = await User.aggregate(pipeline);
  if (findCompanyDriver?.length === 0) {
    // throw new AppError(httpStatus.NOT_FOUND, 'No driver found');
    console.error('No driver found for the job location');
  }
  findCompanyDriver.forEach((item) => {
    item.driver.forEach(
      (driver: {
        _id: string;
        email: string;
        location?: { type: string; coordinates: number[] };
      }) => {
        if (driver.location) {
          // If driver location exists, calculate the distance
          const driverCoordinates = driver.location.coordinates as [
            number,
            number,
          ];
          const jobCoordinates = payload?.location?.coordinates;

          const distanceInMeters = calculateDistance(
            driverCoordinates,
            jobCoordinates,
          );
          const formattedDistance = (distanceInMeters / 1000).toFixed(2); // Convert meters to kilometers
          // dis in mile
          const distanceInMiles = distanceInMeters / 1609.34;

          const notificationBody = {
            senderId: user.userId as any,
            role: user.role,
            receiverId: driver._id as any,
            message: `New job created near you (${formattedDistance} km away)`,
            type: NOTIFICATION_TYPE.job,
            linkId: job._id as any,
            distance: formattedDistance,
            distanceInMiles: Number(distanceInMiles.toFixed(2)),
            milageFee: Number(service.milageFee.toFixed(2)),
            jobInfo: { _id: job._id, ...jobPayload },
          };
          console.log(notificationBody, 'notificationBody in job service===>');
          sendNotification(user, notificationBody);
        }
      },
    );
  });

  await job.save();
  return job;
};

const getJobDetails = async (jobRequestId: string) => {
  console.log(jobRequestId, 'jobRequestId in service===>');
  const pipeline = [];

  pipeline.push(
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(jobRequestId)),
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
        from: 'users',
        localField: 'job.customer',
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
        assignedAt: 1,
        enRouteAt: 1,
        onSceneAt: 1,
        driverCommission: 1,
        dispatchedAt: 1,
        status: 1,
        job: {
          jobId: '$job._id',
          location: '$job.location',
          serviceName: '$job.serviceName',
          dropOffLocation: '$job.dropOffLocation',
          categoryName: '$job.categoryName',
          houseAddress: '$job.houseAddress',
          isAssigned: '$job.isAssigned',
          city: '$job.city',
          state: '$job.state',
          zipCode: '$job.zipCode',
          signature: '$job.signature',
          afterImage: '$job.afterImage',
          beforeImage: '$job.beforeImage',
          specialInstruction: '$job.specialInstruction',
          mileageFee: '$job.mileageFee',
          totalCost: '$job.totalCost',
          callerName: '$job.callerName',
          callerPhone: '$job.callerPhone',
          createdAt: '$job.createdAt',
        },

        customer: {
          _id: '$customer._id',
          name: '$customer.name',
          phone: '$customer.phone',
          email: '$customer.email',
        },
        vehicle: {
          _id: '$car._id',
          vehicleName: '$car.vehicleName',
          numberPlate: '$car.numberPlate',
          vehicleColor: '$car.vehicleColor',
        },
        driver: {
          _id: '$driver._id',
          name: '$driver.name',
          phone: '$driver.phone',
          email: '$driver.email',
          location: '$driver.location',
        },
      },
    },
  );

  const job = await JobRequest.aggregate(pipeline);
  if (job[0]) {
    const payment = await Payment.findOne({
      jobRequestId: new mongoose.Types.ObjectId(jobRequestId),
    });

    return {
      ...job[0],
      paymentInfo: payment || {},
    };
  }
  return null;
};

const getJobDetailsForCompany = async (jobId: string) => {
  const pipeline = [];

  pipeline.push(
    {
      $match: {
        _id: new mongoose.Types.ObjectId(String(jobId)),
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
        from: 'vehicles',
        localField: 'car',
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
        location: 1,
        serviceName: 1,
        dropOffLocation: 1,
        categoryName: 1,
        houseAddress: 1,
        isAssigned: 1,
        city: 1,
        state: 1,
        zipCode: 1,
        customer: {
          _id: '$customer._id',
          name: '$customer.name',
          phone: '$customer.phone',
          email: '$customer.email',
        },
        driver: {
          _id: '$driver._id',
          name: '$driver.name',
          phone: '$driver.phone',
          email: '$driver.email',
        },
        vehicle: {
          _id: '$car._id',
          vehicleName: '$car.vehicleName',
          numberPlate: '$car.numberPlate',
          vehicleColor: '$car.vehicleColor',
        },
      },
    },
  );

  const job = await Job.aggregate(pipeline);
  return job[0] || null;
};

const getJobTimestamps = async (jobId: string) => {
  const result = await JobRequest.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(jobId),
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

    // Lookup main service
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

    // Lookup extra services
    {
      $lookup: {
        from: 'services',
        localField: 'job.extraService',
        foreignField: '_id',
        as: 'extraServices',
      },
    },

    // Calculate totals
    {
      $addFields: {
        // Main service totals
        mainServicePrice: {
          $cond: {
            if: { $ne: ['$service', null] },
            then: {
              $add: [
                '$service.price',
                '$service.milageFee',
                '$service.totalFee',
              ],
            },
            else: 0,
          },
        },
        mainMileageFee: {
          $cond: {
            if: { $ne: ['$service', null] },
            then: '$service.milageFee',
            else: 0,
          },
        },
        mainTotalFee: {
          $cond: {
            if: { $ne: ['$service', null] },
            then: '$service.totalFee',
            else: 0,
          },
        },
        mainBasePrice: {
          $cond: {
            if: { $ne: ['$service', null] },
            then: '$service.price',
            else: 0,
          },
        },

        // Extra services totals
        extraServicePrice: {
          $cond: {
            if: { $gt: [{ $size: '$extraServices' }, 0] },
            then: {
              $sum: {
                $map: {
                  input: '$extraServices',
                  as: 'es',
                  in: {
                    $add: ['$$es.price', '$$es.milageFee', '$$es.totalFee'],
                  },
                },
              },
            },
            else: 0,
          },
        },
        extraMileageFee: {
          $cond: {
            if: { $gt: [{ $size: '$extraServices' }, 0] },
            then: { $sum: '$extraServices.milageFee' },
            else: 0,
          },
        },
        extraTotalFee: {
          $cond: {
            if: { $gt: [{ $size: '$extraServices' }, 0] },
            then: { $sum: '$extraServices.totalFee' },
            else: 0,
          },
        },
        extraBasePrice: {
          $cond: {
            if: { $gt: [{ $size: '$extraServices' }, 0] },
            then: { $sum: '$extraServices.price' },
            else: 0,
          },
        },
      },
    },

    // Final combined totals
    {
      $addFields: {
        totalPrice: { $add: ['$mainServicePrice', '$extraServicePrice'] },
        totalMileageFee: { $add: ['$mainMileageFee', '$extraMileageFee'] },
        totalServiceFee: { $add: ['$mainTotalFee', '$extraTotalFee'] },
        totalBasePrice: { $add: ['$mainBasePrice', '$extraBasePrice'] },
      },
    },

    // Projection
    {
      $project: {
        service: {
          _id: '$service._id',
          price: '$service.price',
          totalFee: '$service.totalFee',
          milageFee: '$service.milageFee',
          serviceName: '$service.serviceName',
        },
        extraServices: {
          _id: 1,
          price: 1,
          milageFee: 1,
          totalFee: 1,
          serviceName: 1,
        },
        mainServicePrice: 1,
        extraServicePrice: 1,
        totalPrice: 1,
        totalMileageFee: 1,
        totalServiceFee: 1,
        totalBasePrice: 1,
        createdAt: 1,
        assignedAt: 1,
        enRouteAt: 1,
        onSceneAt: 1,
        dispatchedAt: 1,
        completedAt: 1,
      },
    },
  ]);

  return result[0] || null;
};

const manualJobCreation = async (payload: any, authUser: TAuthUser) => {
  const session = await mongoose.startSession();

  // console.log(payload, 'payload');
  session.startTransaction();
  const generatePassword = Math.floor(10000000 + Math.random() * 90000000);
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      callerName,
      callerPhone,
      account,
      paymentType,
      pro,
      serviceId,
      driverId,
      classType,
      eta,
      location,
      pickupName,
      pickupNumber,
      dropOffLocation,
      dropoffName,
      dropoffNumber,
      vehicleName,
      vehicleModel,
      vehicleModelYear,
      vehicleColor,
      numberPlate,
      vinNumber,
      notes,
    } = payload;

    let user: any = await User.findOne({ email: customerEmail }).session(
      session,
    );
    console.log('userExist', user);
    if (!user) {
      user = await User.create(
        {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          password: generatePassword,
          uid: await generateUID(),
        },

        { session },
      );
      await Profile.create([{ userId: user._id }], { session });
      await sendMail({
        email: customerEmail as string,
        subject: 'Change Your Password Please',
        html: passwordSend(generatePassword),
      });
    }
    const userId = user._id;
    // Create customer vehicle
    await Vehicle.create(
      [
        {
          userId,
          vehicleName,
          vehicleColor,
          numberPlate,
          vinNumber,
          vehicleModel,
          vehicleModelYear,
        },
      ],
      { session },
    );
    // Fetch service info
    const service = (await ServiceService.getServiceById(serviceId)) as any;
    if (!service) throw new Error('Service not found');

    // Create job
    const job = await Job.create(
      [
        {
          customer: userId,
          service: serviceId,
          categoryName: service?.category?.categoryName,
          serviceName: service?.serviceName,
          location,
          dropOffLocation,
          totalCost: service?.price + service?.milageFee + service?.totalFee,
          isAssigned: true,
          uid: await jobUidCreate(),
        },
      ],
      { session },
    );

    const jobId = job[0]._id;

    // Create manual job
    const manualJob = await ManualJob.create(
      [
        {
          userId,
          jobId,
          callerName,
          callerPhone,
          account,
          paymentType,
          pro,
          classType,
          eta,
          pickupName,
          pickupNumber,
          dropoffName,
          dropoffNumber,
          notes,
        },
      ],
      { session },
    );

    console.log('manualJob in service===>', manualJob);

    // Assign driver to job
    const driver = await User.findById(driverId).session(session);
    if (!driver) throw new Error('Driver not found');

    const jobRequest = await JobRequest.create(
      [
        {
          jobId,
          driver: driverId,
          customer: userId,
          company: driver.assignedCompany,
          assignedAt: new Date(),
          status: JOB_STATUS.in_progress,
        },
      ],
      { session },
    );

    if (jobRequest[0]._id) {
      const notificationData = {
        type: NOTIFICATION_TYPE.jobRequest as any,
        senderId: authUser.userId as any,
        receiverId: driverId as any,
        linkId: jobRequest[0]._id as any,
        role: authUser.role,
        message: `You have a new job request from ${customerName}`,
      };
      await sendNotification(
        { userId: authUser.userId, role: authUser.role } as TAuthUser,
        notificationData,
      );
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return manualJob[0];
  } catch (error: any) {
    // Rollback transaction
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const updateManualJob = async (
  manualJobId: string,
  payload: any,
  authUser: TAuthUser,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const manualJob = await ManualJob.findById(manualJobId).session(session);

    if (!manualJob) {
      throw new AppError(httpStatus.NOT_FOUND, 'Manual job not found');
    }

    const job = await Job.findById(manualJob.jobId).session(session);

    if (!job) {
      throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
    }

    const jobRequest = await JobRequest.findOne({
      jobId: job._id,
    }).session(session);

    const {
      customerName,
      customerPhone,
      customerEmail,

      callerName,
      callerPhone,

      account,
      paymentType,
      pro,

      classType,
      eta,

      pickupName,
      pickupNumber,

      dropoffName,
      dropoffNumber,

      notes,

      location,
      dropOffLocation,

      serviceId,
      driverId,

      vehicleName,
      vehicleModel,
      vehicleModelYear,
      vehicleColor,
      numberPlate,
      vinNumber,
    } = payload;

    /**
     * Update customer
     */
    const customer = await User.findById(job.customer).session(session);

    if (customer) {
      if (customerName) customer.name = customerName;
      if (customerPhone) customer.phone = customerPhone;
      if (customerEmail) customer.email = customerEmail;

      await customer.save({ session });
    }

    /**
     * Update vehicle
     */
    const vehicle = await Vehicle.findOne({
      userId: job.customer,
    }).session(session);

    if (vehicle) {
      if (vehicleName) vehicle.vehicleName = vehicleName;
      if (vehicleModel) vehicle.vehicleModel = vehicleModel;
      if (vehicleModelYear) vehicle.vehicleModelYear = vehicleModelYear;
      if (vehicleColor) vehicle.vehicleColor = vehicleColor;
      if (numberPlate) vehicle.numberPlate = numberPlate;
      if (vinNumber) vehicle.vinNumber = vinNumber;

      await vehicle.save({ session });
    }

    /**
     * Update service
     */
    if (serviceId) {
      const service = await ServiceService.getServiceById(serviceId);

      if (!service) {
        throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
      }

      job.service = serviceId;
      job.categoryName = (service as any)?.category?.categoryName;
      job.serviceName = (service as any)?.serviceName;
      job.totalCost =
        (service as any)?.price +
        (service as any)?.milageFee +
        (service as any)?.totalFee;
    }

    /**
     * Update locations
     */
    if (location) {
      job.location = location;
    }

    if (dropOffLocation) {
      job.dropOffLocation = dropOffLocation;
    }

    await job.save({ session });

    /**
     * Update manual job
     */
    Object.assign(manualJob, {
      ...(callerName && { callerName }),
      ...(callerPhone && { callerPhone }),
      ...(account && { account }),
      ...(paymentType && { paymentType }),
      ...(pro && { pro }),
      ...(classType && { classType }),
      ...(eta && { eta }),
      ...(pickupName && { pickupName }),
      ...(pickupNumber && { pickupNumber }),
      ...(dropoffName && { dropoffName }),
      ...(dropoffNumber && { dropoffNumber }),
      ...(notes && { notes }),
    });

    await manualJob.save({ session });

    /**
     * Driver reassignment
     */
    if (
      driverId &&
      jobRequest &&
      String(jobRequest.driver) !== String(driverId)
    ) {
      const newDriver = await User.findById(driverId).session(session);

      if (!newDriver) {
        throw new AppError(httpStatus.NOT_FOUND, 'Driver not found');
      }

      const oldDriver = await User.findById(jobRequest.driver).session(session);

      if (oldDriver) {
        oldDriver.activity = 'available';
        await oldDriver.save({ session });
      }

      newDriver.activity = 'on-job';
      await newDriver.save({ session });

      jobRequest.driver = driverId;
      jobRequest.company = newDriver.assignedCompany;

      await jobRequest.save({ session });

      await sendNotification(
        {
          userId: authUser.userId,
          role: authUser.role,
        },
        {
          type: NOTIFICATION_TYPE.jobRequest as any,
          senderId: authUser.userId as any,
          receiverId: driverId as any,
          linkId: jobRequest._id as any,
          role: authUser.role,
          message: `A job has been reassigned to you`,
        },
      );
    }

    await session.commitTransaction();

    return await ManualJob.findById(manualJobId);
  } catch (error: any) {
    await session.abortTransaction();

    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  } finally {
    session.endSession();
  }
};

const getAllActiveJobs = async (user: TAuthUser) => {
  const cacheKey = `jobs::${user.userId}`;
  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ result: TJob[] }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    // return cached;
  }

  let matchStage = {};

  if (user.role === USER_ROLE.customer) {
    matchStage = {
      customer: new mongoose.Types.ObjectId(String(user.userId)),
    };
  } else {
    matchStage = {
      driver: new mongoose.Types.ObjectId(String(user.userId)),
    };
  }

  const result = await JobRequest.aggregate([
    {
      $match: {
        ...matchStage,
        status: { $ne: JOB_STATUS.completed },
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
      $project: {
        assignedAt: 1,
        driverCommission: 1,
        createdAt: 1,
        job: {
          _id: 1,
          serviceName: 1,
          categoryName: 1,
          location: 1,
          totalCost: 1,
          dropOffLocation: 1,
        },
        service: {
          _id: 1,
          serviceName: 1,
          categoryName: '$job.categoryName',
          icon: 1,
        },
        driver: {
          _id: 1,
          uid: 1,
          name: 1,
          email: 1,
          phone: 1,
          location: 1,
        },
      },
    },
  ]);

  const time = minuteToSecond(5);
  await cacheData(cacheKey, result, time);

  return result;
};

const getAllScheduleJobs = async (user: TAuthUser) => {
  const result = await ScheduleJob.aggregate([
    {
      $match: {
        company: new mongoose.Types.ObjectId(String(user.userId)),
      },
    },
  ]);
  return result;
};

const getAllJobs = async (query: Record<string, any>) => {
  const { filters, pagination } = await pickQuery(query);
  const {
    searchTerm,
    service: serviceFilter,
    company,
    includeUnassignedJob,
    driver,
    ...filtersData
  } = filters;
  const isServiceToggle =
    String(serviceFilter).toLowerCase() === 'true' ||
    String(serviceFilter).toLowerCase() === 'false' ||
    typeof serviceFilter === 'boolean';
  const includeServiceData =
    String(serviceFilter).toLowerCase() === 'true' || serviceFilter === true;
  const shouldIncludeDriver =
    String(driver).toLowerCase() === 'true' || driver === true;
  const normalizedFiltersData = isServiceToggle
    ? filtersData
    : {
        ...filtersData,
        ...(serviceFilter ? { service: serviceFilter } : {}),
      };
  console.log('getAllJobs');
  const pipeline: any[] = [];

  pipeline.push(
    {
      $lookup: {
        from: 'manualjobs',
        localField: '_id',
        foreignField: 'jobId',
        as: 'manualJob',
      },
    },
    {
      $unwind: {
        path: '$manualJob',
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
        from: 'jobrequests',
        let: { jobId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$jobId', '$$jobId'],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: 'jobRequest',
      },
    },
    {
      $unwind: {
        path: '$jobRequest',
        preserveNullAndEmptyArrays: true,
      },
    },
  );

  if (shouldIncludeDriver) {
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'jobRequest.driver',
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
    );
  }

  // If searchTerm is provided, add a search condition
  if (searchTerm) {
    pipeline.push({
      $match: {
        $or: [
          { uid: { $regex: searchTerm, $options: 'i' } },
          { serviceName: { $regex: searchTerm, $options: 'i' } },
          { categoryName: { $regex: searchTerm, $options: 'i' } },
          { houseAddress: { $regex: searchTerm, $options: 'i' } },
          { city: { $regex: searchTerm, $options: 'i' } },
          { state: { $regex: searchTerm, $options: 'i' } },
          { 'customer.name': { $regex: searchTerm, $options: 'i' } },
          { 'customer.email': { $regex: searchTerm, $options: 'i' } },
          { 'customer.phone': { $regex: searchTerm, $options: 'i' } },
          { 'manualJob.customerName': { $regex: searchTerm, $options: 'i' } },
          { 'manualJob.customerEmail': { $regex: searchTerm, $options: 'i' } },
          { 'manualJob.customerPhone': { $regex: searchTerm, $options: 'i' } },
          { 'manualJob.callerName': { $regex: searchTerm, $options: 'i' } },
          { 'manualJob.callerPhone': { $regex: searchTerm, $options: 'i' } },
          { 'manualJob.pickupName': { $regex: searchTerm, $options: 'i' } },
          { 'manualJob.dropoffName': { $regex: searchTerm, $options: 'i' } },
          { 'jobRequest.status': { $regex: searchTerm, $options: 'i' } },
        ],
      },
    });
  }

  if (company) {
    const companyObjectId = new mongoose.Types.ObjectId(company);

    const shouldIncludeUnassignedJob =
      String(includeUnassignedJob).toLowerCase() === 'true';

    pipeline.push({
      $match: shouldIncludeUnassignedJob
        ? {
            $or: [
              {
                'jobRequest.company': companyObjectId,
              },
              {
                jobRequest: null,
              },
            ],
          }
        : {
            'jobRequest.company': companyObjectId,
          },
    });
  }

  if (Object.entries(normalizedFiltersData).length) {
    pipeline.push({
      $match: normalizedFiltersData,
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

  if (includeServiceData) {
    pipeline.push(
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
    );
  }

  pipeline.push(
    {
      $project: {
        _id: 1,
        uid: 1,
        customer: {
          _id: '$customer._id',
          name: '$customer.name',
          email: '$customer.email',
          phone: '$customer.phone',
        },
        ...(includeServiceData
          ? {
              service: {
                _id: '$service._id',
                serviceName: '$service.serviceName',
                price: '$service.price',
                milageFee: '$service.milageFee',
                totalFee: '$service.totalFee',
                icon: '$service.icon',
              },
            }
          : {}),
        serviceName: 1,
        categoryName: 1,
        location: 1,
        dropOffLocation: 1,
        totalCost: 1,
        isAssigned: 1,
        manualJob: 1,
        jobRequest: {
          _id: '$jobRequest._id',
          driver: shouldIncludeDriver
            ? {
                _id: '$driver._id',
                name: '$driver.name',
                email: '$driver.email',
                phone: '$driver.phone',
                activity: '$driver.activity',
                location: '$driver.location',
              }
            : '$jobRequest.driver',
          company: '$jobRequest.company',
          status: '$jobRequest.status',
          assignedAt: '$jobRequest.assignedAt',
          dispatchedAt: '$jobRequest.dispatchedAt',
          enRouteAt: '$jobRequest.enRouteAt',
          onSceneAt: '$jobRequest.onSceneAt',
          completedAt: '$jobRequest.completedAt',
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $facet: {
        totalData: [{ $count: 'total' }],
        paginatedData: [{ $skip: skip }, { $limit: limit }],
      },
    },
  );

  const [result] = await Job.aggregate(pipeline);

  const total = result?.totalData?.[0]?.total || 0;
  const data = result?.paginatedData || [];

  return {
    meta: { page, limit, total },
    data,
  };
};

export const JobService = {
  createJob,
  getJobDetails,
  getJobTimestamps,
  manualJobCreation,
  updateManualJob,
  getJobDetailsForCompany,
  getAllActiveJobs,
  getAllScheduleJobs,
  getAllJobs,
};
