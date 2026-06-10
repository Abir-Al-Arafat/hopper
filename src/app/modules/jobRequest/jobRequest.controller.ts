import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { JobRequestService } from './jobRequest.service';
import { MulterFiles } from '../profile/profile.controller'; 

const acceptJobRequest = catchAsync(async (req, res) => {
  const result = await JobRequestService.acceptJobRequest(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Job request accepted successfully',
    data: result,
  });
});

const jobRequestAction = catchAsync(async (req, res) => {
  console.log('check image =>')
  const fields = ['beforeImage', 'signature', 'afterImage'];

  // Type req.files as MulterFiles
  // Type req.files as MulterFiles
  const files = req.files as MulterFiles | undefined;
  console.log(files, 'files in controller');
  if (files && !Array.isArray(files) && typeof files === 'object') {
    await Promise.all(
      fields.map(async (field) => {
        const fileArray = files[field];
        if (fileArray && fileArray.length > 0) {
          // const s3Url = await uploadFileWithS3(fileArray[0]);
          req.body[field] = fileArray[0]?.path;
        }
      }),
    );
  }

  const result = await JobRequestService.jobRequestAction(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Job request accepted successfully',
    data: result,
  });
});

const findDriver = catchAsync(async (req, res) => {
  const result = await JobRequestService.findDriver(req.params.jobRequestId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Driver found successfully',
    data: result,
  });
});

const getJobHistory = catchAsync(async (req, res) => {
  const result = await JobRequestService.getJobHistory(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Job history retrieved successfully',
    data: result,
  });
});

const trackLocation = catchAsync(async (req, res) => {
  const result = await JobRequestService.trackLocation(req.params.jobRequestId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Driver found successfully',
    data: result,
  });
});

const getAllJobs = catchAsync(async (req, res) => {
  const result = await JobRequestService.getAllJobs(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Job history retrieved successfully',
    data: result,
  });
});


const fetchAllJobRequests = catchAsync(async (req, res) => {
  const result = await JobRequestService.fetchAllJobRequests(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All jobs fetched successfully',
    data: result,
  });
});
export const JobRequestController = {
  findDriver,
  getJobHistory,
  trackLocation,
  acceptJobRequest,
  jobRequestAction,
  getAllJobs,fetchAllJobRequests
};
