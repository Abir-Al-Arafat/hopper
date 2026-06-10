import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { JoinRequestService } from './joinRequest.service';
import { TAuthUser } from '../../interface/authUser';

const getAllJoinRequests = catchAsync(async (req, res) => {
  const result = await JoinRequestService.getAllJoinRequests(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Join requests retrieved successfully',
    data: result,
  });
});

const getJoinRequestById = catchAsync(async (req, res) => {
  const result = await JoinRequestService.getJoinRequestById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Join request retrieved successfully',
    data: result,
  });
});

const getMyJoinRequests = catchAsync(async (req, res) => {
  const result = await JoinRequestService.getMyJoinRequests(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your join requests retrieved successfully',
    data: result,
  });
});

const acceptJoinRequest = catchAsync(async (req, res) => {
  const result = await JoinRequestService.acceptJoinRequest(
    req.user as TAuthUser,
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Join request ${req.body.action}ed successfully`,
    data: result,
  });
});

export const JoinRequestController = {
  getAllJoinRequests,
  getJoinRequestById,
  getMyJoinRequests,
  acceptJoinRequest,
};
