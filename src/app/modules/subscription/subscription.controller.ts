import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SubscriptionService } from './subscription.service';
import { TAuthUser } from '../../interface/authUser';

const createSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.createSubscription(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Subscription created successfully',
    data: result,
  });
});

const getSubscriptions = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getSubscriptions();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Subscriptions fetched successfully',
    data: result,
  });
});

const getSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getSubscription(
    req.params.subscriptionId,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Subscription fetched successfully',
    data: result,
  });
});

const deleteSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.deleteSubscription(
    req.params.subscriptionId,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Subscription deleted successfully',
    data: result,
  });
});

const updateSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.updateSubscription(
    req.params.subscriptionId,
    req.body,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Subscription updated successfully',
    data: result,
  });
});

const getMySubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getMySubscription(
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Subscription fetched successfully',
    data: result,
  });
});

export const SubscriptionController = {
  createSubscription,
  getSubscription,
  getSubscriptions,
  deleteSubscription,
  updateSubscription,
  getMySubscription,
};
