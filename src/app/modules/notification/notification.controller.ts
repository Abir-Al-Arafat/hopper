import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { NotificationService } from './notification.service';
import { TAuthUser } from '../../interface/authUser';

const getNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.getNotifications(
    req.user as TAuthUser,
    req.query,
  );

  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notifications fetched successfully',
  });
});

const getNotificationCount = catchAsync(async (req, res) => {
  const result = await NotificationService.getNotificationCount(
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Notification count fetched successfully',
    data: result,
  });
});

const notificationAction = catchAsync(async (req, res) => {
  const result = await NotificationService.notificationAction(
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Notification count fetched successfully',
    data: result,
  });
});

const singleNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.singleNotification(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification fetched successfully',
    data: result,
  });
});

export const NotificationController = {
  getNotifications,
  getNotificationCount,
  notificationAction,
  singleNotification,
};
