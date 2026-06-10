import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CompanyService } from './company.service';
import { TAuthUser } from '../../interface/authUser';

const addDispatcher = catchAsync(async (req, res) => {
  const dispatcher = await CompanyService.addDispatcher(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    data: dispatcher,
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Dispatcher added successfully',
  });
});

const invitationCode = catchAsync(async (req, res) => {
  const invitationCode = await CompanyService.invitationCode(
    req.user as TAuthUser,
  );

  sendResponse(res, {
    data: invitationCode,
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Invitation code added successfully',
  });
});

const joinCompany = catchAsync(async (req, res) => {
  const result = await CompanyService.joinCompany(
    req.user as TAuthUser,
    req.body,
  );

  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Company join request sent successfully',
  });
});

const quickOverview = catchAsync(async (req, res) => {
  const result = await CompanyService.quickOverview(req.user as TAuthUser);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'quick overview fetched successfully',
  });
});

const othersCompanyInfo = catchAsync(async (req, res) => {
  const result = await CompanyService.othersCompanyInfo(req.user as TAuthUser);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'others company info fetched successfully',
  });
});

const totalEarnings = catchAsync(async (req, res) => {
  const result = await CompanyService.totalEarnings(req.user as TAuthUser);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'total earnings fetched successfully',
  });
});

const getAllDispatchers = catchAsync(async (req, res) => {
  const result = await CompanyService.getAllDispatchers(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'all dispatchers fetched successfully',
  });
});

const getAllDrivers = catchAsync(async (req, res) => {
  const result = await CompanyService.getAllDrivers(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'all drivers fetched successfully',
  });
});

const driverDetails = catchAsync(async (req, res) => {
  const result = await CompanyService.driverDetails(
    req.params.driverId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver details fetched successfully',
  });
});

const driverJobDetails = catchAsync(async (req, res) => {
  const result = await CompanyService.driverJobDetails(
    req.user as TAuthUser,
    req.params.driverId,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver job details fetched successfully',
  });
});

const jobStatus = catchAsync(async (req, res) => {
  const result = await CompanyService.jobStatus(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'job status fetched successfully',
  });
});

const manualJobStatus = catchAsync(async (req, res) => {
  const result = await CompanyService.manualJobStatus(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'manual job status fetched successfully',
  });
});

const updateJobStatus = catchAsync(async (req, res) => {
  const result = await CompanyService.updateJobStatus(
    req.params.jobRequestId,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'job status updated successfully',
  });
});

const availableDrivers = catchAsync(async (req, res) => {
  const result = await CompanyService.availableDrivers(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'available drivers and companies fetched successfully',
  });
});

const availableCompanies = catchAsync(async (req, res) => {
  const result = await CompanyService.availableCompanies(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'available companies fetched successfully',
  });
});

const assignDriver = catchAsync(async (req, res) => {
  const result = await CompanyService.assignDriver(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver assigned successfully',
  });
});

const assignCompany = catchAsync(async (req, res) => {
  const result = await CompanyService.assignCompany(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company assigned successfully',
  });
});

const companyOverview = catchAsync(async (req, res) => {
  const result = await CompanyService.companyOverview(req.user as TAuthUser);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company overview fetched successfully',
  });
});

const getAllCompanyList = catchAsync(async (req, res) => {
  const result = await CompanyService.getAllCompanyList(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company list fetched successfully',
  });
});

const getAllLeaveRequests = catchAsync(async (req, res) => {
  const result = await CompanyService.getAllLeaveRequests(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'leave requests fetched successfully',
  });
});

const acceptLeaveRequest = catchAsync(async (req, res) => {
  const result = await CompanyService.acceptLeaveRequest(
    req.user as TAuthUser,
    req.params.requestId,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: `leave request ${req?.body?.action}  successfully`,
  });
});

const removeCompany = catchAsync(async (req, res) => {
  const result = await CompanyService.removeCompany(
    req.params.companyId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Company removed successfully',
  });
});

export const CompanyController = {
  jobStatus,
  manualJobStatus,
  updateJobStatus,
  joinCompany,
  assignDriver,
  driverDetails,
  getAllDrivers,
  assignCompany,
  addDispatcher,
  totalEarnings,
  quickOverview,
  invitationCode,
  driverJobDetails,
  othersCompanyInfo,
  getAllDispatchers,
  availableDrivers,
  companyOverview,
  availableCompanies,
  getAllCompanyList,
  getAllLeaveRequests,
  acceptLeaveRequest,
  removeCompany,
};
