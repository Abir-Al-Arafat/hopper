/* eslint-disable @typescript-eslint/no-explicit-any */
// import mongoose from 'mongoose';
import mongoose from 'mongoose';
import { TAuthUser } from '../../interface/authUser';
import AggregationQueryBuilder from '../../QueryBuilder/aggregationBuilder';
import AppError from '../../utils/AppError';
import { stripe } from '../stripe/stripe.utils';
import Wallet from '../Wallet/wallet.model';
import PendingPayout from './pendingPayout.model';
import QueryBuilder from '../../QueryBuilder/queryBuilder';
// import httpStatus from 'http-status';
// import { USER_ROLE } from '../../constant';

// old code
// const getPendingPayout = async (
//   user: TAuthUser,
//   query: Record<string, unknown>,
// ) => {
//   const pendingPayoutAggregation = new AggregationQueryBuilder(query);

//   // let matchStage = {};
//   // if (
//   //   user.role === USER_ROLE.company ||
//   //   user.role === USER_ROLE.hopperCompany
//   // ) {
//   //   matchStage = {
//   //     $match: {
//   //       $and: [
//   //         { company: new mongoose.Types.ObjectId(String(user.myCompany)) },
//   //         { status: 'completed' },
//   //       ],
//   //     },
//   //   };
//   // } else {
//   //   matchStage = {
//   //     $match: {
//   //       $and: [
//   //         { company: new mongoose.Types.ObjectId(String(user.hopperCompany)) },
//   //       ],
//   //     },
//   //   };
//   // }

//   const result = await pendingPayoutAggregation
//     .customPipeline([
//       {
//         $match: {},
//       },
//       {
//         $lookup: {
//           from: 'jobrequests',
//           localField: 'jobRequestId',
//           // pipeline: [
//           //   {
//           //     ...matchStage,
//           //   },
//           // ],
//           foreignField: '_id',
//           as: 'jobRequest',
//         },
//       },
//       {
//         $unwind: {
//           path: '$jobRequest',
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: 'jobs',
//           localField: 'jobRequest.jobId',
//           foreignField: '_id',
//           as: 'job',
//         },
//       },
//       {
//         $unwind: {
//           path: '$job',
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'jobRequest.driver',
//           foreignField: '_id',
//           as: 'driver',
//         },
//       },
//       {
//         $unwind: {
//           path: '$driver',
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: 'companies',
//           localField: 'driver.assignedCompany',
//           foreignField: '_id',
//           as: 'company',
//         },
//       },
//       {
//         $unwind: {
//           path: '$company',
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $project: {
//           paymentStatus: '$status',
//           driver: {
//             name: '$driver.name',
//             email: '$driver.email',
//             uid: '$driver.uid',
//             driverCompany: '$company.companyName',
//             _id: '$driver._id',
//           },
//           driverCommission: '$jobRequest.driverCommission',
//           companyReceived: {
//             $subtract: ['$job.totalCost', '$jobRequest.driverCommission'],
//           },
//           total: '$job.totalCost',
//           completedDate: '$jobRequest.completedAt',
//         },
//       },
//     ])
//     .sort()
//     .search(['driver.name', 'driver.email'])
//     .paginate()
//     .execute(PendingPayout);

//   const meta = await pendingPayoutAggregation.countTotal(PendingPayout);

//   // Calculate sum of total and count of pending payments
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const sumTotal = result.reduce(
//     (acc: any, item: { total: any }) => acc + (item.total || 0),
//     0,
//   );

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const pendingCount = result.filter(
//     (item: any) => item.paymentStatus === 'pending',
//   ).length;

//   return { meta, result, sumTotal, pendingCount };
// };
const getPendingPayout = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {
  const pendingPayoutAggregation = new AggregationQueryBuilder(query);

  const result = await pendingPayoutAggregation
    .customPipeline([
      // ✅ Only valid payouts
      {
        $match: {
          jobRequestId: { $exists: true, $ne: null },

        },
      },

      // ✅ Job Request
      {
        $lookup: {
          from: 'jobrequests',
          localField: 'jobRequestId',
          foreignField: '_id',
          as: 'jobRequest',
        },
      },
      { $unwind: '$jobRequest' },

      // ✅ Only completed jobs (optional but recommended)
      {
        $match: {
          'jobRequest.status': 'completed',
        },
      },

      // ✅ Job
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobRequest.jobId',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },

      // ✅ Driver (User)
      {
        $lookup: {
          from: 'users',
          localField: 'jobRequest.driver',
          foreignField: '_id',
          as: 'driver',
        },
      },
      { $unwind: '$driver' },

      // ✅ Company (assignedCompany from driver)
      {
        $lookup: {
          from: 'companies',
          localField: 'driver.assignedCompany',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },

      // ✅ Company User
      {
        $lookup: {
          from: 'users',
          localField: 'company.companyUserId',
          foreignField: '_id',
          as: 'companyUser',
        },
      },
      { $unwind: '$companyUser' },

      // ✅ Company Profile
      {
        $lookup: {
          from: 'profiles',
          localField: 'companyUser.profile',
          foreignField: '_id',
          as: 'companyProfile',
        },
      },
      { $unwind: '$companyProfile' },

      // ✅ Final filter to avoid null math issues
      {
        $match: {
          'job.totalCost': { $exists: true, $ne: null },
          'jobRequest.driverCommission': { $exists: true, $ne: null },
        },
      },

      // ✅ Projection
      {
        $project: {
          paymentStatus: '$status',

          driver: {
            _id: '$driver._id',
            name: '$driver.name',
            email: '$driver.email',
            uid: '$driver.uid',
            driverCompany: '$company.companyName',
          },

          driverCommission: '$jobRequest.driverCommission',

          companyReceived: {
            $subtract: ['$job.totalCost', '$jobRequest.driverCommission'],
          },

          total: '$job.totalCost',
          completedDate: '$jobRequest.completedAt',

          // ✅ Company full data
          company: {
            userId: '$companyUser._id',
            email: '$companyUser.email',
            name: '$company.companyName',
            image: '$companyProfile.image',
          },
        },
      },
    ])
    .sort()
    .search(['driver.name', 'driver.email'])
    .paginate()
    .execute(PendingPayout);

  const meta = await pendingPayoutAggregation.countTotal(PendingPayout);

  // ✅ Safe sum (no null issue)
  const sumTotal = result.reduce(
    (acc: number, item: any) => acc + (item.total || 0),
    0,
  );

  // ✅ Pending count
  const pendingCount = result.filter(
    (item: any) => item.paymentStatus === 'pending',
  ).length;

  return { meta, result, sumTotal, pendingCount };
};
const getTransactionHistory = async (
  user: TAuthUser,
  query: Record<string, unknown>,
) => {

  // Role-based condition
  // If user is driver → filter by driverId
  // Otherwise → filter by companyId
  const condition: any = {};

  if (user.role === 'driver') {
    condition.driverId = new mongoose.Types.ObjectId(String(user.userId));;
  } else {
    condition.companyId = new mongoose.Types.ObjectId(String(user.userId));;
  }
  const pendingPayoutAggregation = new AggregationQueryBuilder(query);
console.log(condition, 'conditon ==>');
  const result = await pendingPayoutAggregation
    .customPipeline([
      // ✅ Only valid payouts
      {
        $match: {
          ...condition,
        },
      },

      // ✅ Job Request
      {
        $lookup: {
          from: 'jobrequests',
          localField: 'jobRequestId',
          foreignField: '_id',
          as: 'jobRequest',
        },
      },
      { $unwind: '$jobRequest' },

      // ✅ Only completed jobs (optional but recommended)
      {
        $match: {
          'jobRequest.status': 'completed',
        },
      },

      // ✅ Job
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobRequest.jobId',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },

      // ✅ Driver (User)
      {
        $lookup: {
          from: 'users',
          localField: 'jobRequest.driver',
          foreignField: '_id',
          as: 'driver',
        },
      },
      { $unwind: '$driver' },

      // ✅ Company (assignedCompany from driver)
      {
        $lookup: {
          from: 'companies',
          localField: 'driver.assignedCompany',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },

      // ✅ Company User
      {
        $lookup: {
          from: 'users',
          localField: 'company.companyUserId',
          foreignField: '_id',
          as: 'companyUser',
        },
      },
      { $unwind: '$companyUser' },

      // ✅ Company Profile
      {
        $lookup: {
          from: 'profiles',
          localField: 'companyUser.profile',
          foreignField: '_id',
          as: 'companyProfile',
        },
      },
      { $unwind: '$companyProfile' },

      // ✅ Final filter to avoid null math issues
      {
        $match: {
          'job.totalCost': { $exists: true, $ne: null },
          'jobRequest.driverCommission': { $exists: true, $ne: null },
        },
      },

      // ✅ Projection
      {
        $project: {
          paymentStatus: '$status',

          driver: {
            _id: '$driver._id',
            name: '$driver.name',
            email: '$driver.email',
            uid: '$driver.uid',
            driverCompany: '$company.companyName',
          },

          driverCommission: '$jobRequest.driverCommission',

          companyReceived: {
            $subtract: ['$job.totalCost', '$jobRequest.driverCommission'],
          },

          total: '$job.totalCost',
          completedDate: '$jobRequest.completedAt',

          // ✅ Company full data
          company: {
            userId: '$companyUser._id',
            email: '$companyUser.email',
            name: '$company.companyName',
            image: '$companyProfile.image',
          },
        },
      },
    ])
    .sort()
    .search(['driver.name', 'driver.email'])
    .paginate()
    .execute(PendingPayout);

  const meta = await pendingPayoutAggregation.countTotal(PendingPayout);





  return { meta, result };
};
const pendingPayoutAction = async (payload: {
  action: 'completed';
  pendingPayoutId: string;
  companyAmount: number;
  driverAmount: number;
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 👉 1. Stripe balance check
    const balance = await stripe.balance.retrieve();
    const adminAvailable = balance.available[0]?.amount || 0;

    const totalPayout =
      (payload.companyAmount + payload.driverAmount) * 100;

    if (adminAvailable < totalPayout) {
      throw new AppError(400, 'Insufficient Stripe balance');
    }

    // 👉 2. Get payout data
    const payout = await PendingPayout.findById(payload.pendingPayoutId)
      .populate('companyId')
      .session(session);
    console.log('Payout found:', payout);

    if (!payout) throw new AppError(404, 'Pending payout not found');
    if (payout.status === 'completed') {
      throw new AppError(400, 'Already completed');
    }

    const driver = await Wallet.findOne({ userId: payout.driverId, onboardingCompleted: true }).session(session);
    const company = await Wallet.findOne({ userId: (payout.companyId as any).companyUserId, onboardingCompleted: true }).session(session);

    if (!driver?.stripeAccountId) {
      throw new AppError(400, 'Driver Stripe account missing');
    }

    if (!company?.stripeAccountId) {
      throw new AppError(400, 'Company Stripe account missing');
    }

    // 👉 3. Stripe transfer (REAL MONEY MOVE)
    if (payload.driverAmount > 0) {
      await stripe.transfers.create({
        amount: payload.driverAmount * 100,
        currency: 'usd',
        destination: driver.stripeAccountId,
      });
    }

    if (payload.companyAmount > 0) {
      await stripe.transfers.create({
        amount: payload.companyAmount * 100,
        currency: 'usd',
        destination: company.stripeAccountId,
      });
    }

    // 👉 4. Update DB (only status + log)
    payout.status = 'completed';
    await payout.save({ session });



    await session.commitTransaction();
    session.endSession();

    return { message: 'Payout completed via Stripe' };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};



export const PendingPayoutService = {
  getPendingPayout,
  pendingPayoutAction,
  getTransactionHistory
};
