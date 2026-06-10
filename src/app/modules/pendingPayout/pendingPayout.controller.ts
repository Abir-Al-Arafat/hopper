import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PendingPayoutService } from './pendingPayout.service';
import { TAuthUser } from '../../interface/authUser';

const getPendingPayout = catchAsync(async (req, res) => {
  const result = await PendingPayoutService.getPendingPayout(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Pending payout fetched successfully',
    data: result,
  });
});
const getTransactionHistory = catchAsync(async (req, res) => {
  const result = await PendingPayoutService.getTransactionHistory(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Transaction history fetched successfully',
    data: result,
  });
});



const pendingPayoutAction = catchAsync(async (req, res) => {
  const result = await PendingPayoutService.pendingPayoutAction(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Pending payout action successfully',
    data: result,
  });
});

export const PendingPayoutController = {
  getPendingPayout,
  pendingPayoutAction,
  getTransactionHistory
};
