import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TAuthUser } from '../../interface/authUser';
import { ScheduleJobService } from '../scheduleJob/scheduleJob.service';
import { JobService } from './job.service';

const createJob = catchAsync(async (req, res) => {
  const result = await JobService.createJob(req.body, req.user as TAuthUser);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'job created successfully',
    data: result,
  });
});

const scheduleJob = catchAsync(async (req, res) => {
  const result = await ScheduleJobService.scheduleJobCreate(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'job created successfully',
    data: result,
  });
});

const getJobDetails = catchAsync(async (req, res) => {
  const result = await JobService.getJobDetails(req.params.jobRequestId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'job details fetched successfully',
    data: result,
  });
});

const getJobDetailsForCompany = catchAsync(async (req, res) => {
  const result = await JobService.getJobDetailsForCompany(req.params.jobId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'job details fetched successfully',
    data: result,
  });
});

const getJobTimestamps = catchAsync(async (req, res) => {
  const result = await JobService.getJobTimestamps(req.params.jobId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'job timestamps fetched successfully',
    data: result,
  });
});

const manualJobCreation = catchAsync(async (req, res) => {
  const result = await JobService.manualJobCreation(
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Manual job created successfully',
    data: result,
  });
});

const updateManualJob = catchAsync(async (req, res) => {
  const { manualJobId } = req.params;

  const result = await JobService.updateManualJob(
    manualJobId,
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Manual job updated successfully',
    data: result,
  });
});

const getAllActiveJobs = catchAsync(async (req, res) => {
  const result = await JobService.getAllActiveJobs(req.user as TAuthUser);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All active jobs fetched successfully',
    data: result,
  });
});

const getAllScheduleJobs = catchAsync(async (req, res) => {
  const result = await JobService.getAllScheduleJobs(req.user as TAuthUser);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All schedule jobs fetched successfully',
    data: result,
  });
});
const getAllJobs = catchAsync(async (req, res) => {
  const result = await JobService.getAllJobs(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'All jobs fetched successfully',
    data: result,
  });
});

export const JobController = {
  createJob,
  updateManualJob,
  scheduleJob,
  getJobDetails,
  getJobTimestamps,
  manualJobCreation,
  getJobDetailsForCompany,
  getAllActiveJobs,
  getAllScheduleJobs,
  getAllJobs,
};
