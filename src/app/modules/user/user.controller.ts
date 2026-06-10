import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';
import { TAuthUser } from '../../interface/authUser';

const updateUserActions = catchAsync(async (req, res) => {
  const result = await UserService.updateUserActions(
    req.params.id,
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `User ${req.body.action} successfully`,
    data: result,
  });
});

const updateUserActivity = catchAsync(async (req, res) => {
  const result = await UserService.updateUserActivity(req.params.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User activity updated successfully',
    data: result,
  });
});

const driverPerformance = catchAsync(async (req, res) => {
  const result = await UserService.driverPerformance(req.params.driverId);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver performance fetched successfully',
  });
});

// const getAllCustomers = catchAsync(async (req, res) => {
//   const result = await UserService.getAllCustomers(req.query);
//   sendResponse(res, {
//     data: result,
//     success: true,
//     statusCode: httpStatus.OK,
//     message: 'customers fetched successfully',
//   });
// });

const getAllUsers = catchAsync(async (req, res) => {
  const result = await UserService.getAllUsers(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'users fetched successfully',
  });
});

const getAllCompany = catchAsync(async (req, res) => {
  const result = await UserService.getAllCompany(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company fetched successfully',
  });
});

const companyDetails = catchAsync(async (req, res) => {
  const result = await UserService.companyDetails(req.params.companyId);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company details fetched successfully',
  });
});

const companyDispatchedHistory = catchAsync(async (req, res) => {
  const result = await UserService.companyDispatchedHistory(
    req.params.companyId,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company dispatched history fetched successfully',
  });
});

const getAllCompanyRequest = catchAsync(async (req, res) => {
  const result = await UserService.getAllCompanyRequest(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company request fetched successfully',
  });
});

const approveRequest = catchAsync(async (req, res) => {
  const result = await UserService.approveRequest(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'company request updated successfully',
  });
});

const createAdmin = catchAsync(async (req, res) => {
  const result = await UserService.createAdmin(req.body);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'admin created successfully',
  });
});

const getAllAdmin = catchAsync(async (req, res) => {
  const result = await UserService.getAllAdmin(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'admin fetched successfully',
  });
});

const getAllDriverRequest = catchAsync(async (req, res) => {
  const result = await UserService.getAllDriverRequest(
    req.user as TAuthUser,
    req.query,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver request fetched successfully',
  });
});

const driverRequestAction = catchAsync(async (req, res) => {
  const result = await UserService.driverRequestAction(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'driver request action updated successfully',
  });
});

const customerOverview = catchAsync(async (req, res) => {
  const result = await UserService.customerOverview(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'customer overview fetched successfully',
  });
});

const getAllDispatcher = catchAsync(async (req, res) => {
  const result = await UserService.getAllDispatcher(req.query);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'dispatcher fetched successfully',
  });
});

const leaveCompany = catchAsync(async (req, res) => {
  const result = await UserService.leaveCompany(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'You leave request sent successfully',
  });
});

const deleteAccount = catchAsync(async (req, res) => {
  const result = await UserService.deleteAccount(
    req.user as TAuthUser,
    req.body,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Account delete successfull',
  });
});

const toggleAutoDispatch = catchAsync(async (req, res) => {
  const result = await UserService.toggleAutoDispatch(req.user as TAuthUser);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Auto dispatch toggled successfully',
    data: result,
  });
});
const getCompanyForDispatcher = catchAsync(async (req, res) => {
  const result = await UserService.getCompanyForDispatcher(
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Company details fetched successfully',
    data: result,
  });
});
const getDispatcherForCompany = catchAsync(async (req, res) => {
  const result = await UserService.getDispatcherForCompany(
    req.user.userId as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Dispatcher details fetched successfully',
    data: result,
  });
});

export const UserController = {
  updateUserActions,
  updateUserActivity,
  createAdmin,
  driverPerformance,
  // getAllCustomers,
  getAllUsers,
  getAllCompany,
  companyDetails,
  companyDispatchedHistory,
  getAllCompanyRequest,
  approveRequest,
  getAllAdmin,
  getAllDriverRequest,
  driverRequestAction,
  customerOverview,
  getAllDispatcher,
  leaveCompany,
  deleteAccount,
  toggleAutoDispatch,
  getCompanyForDispatcher,
  getDispatcherForCompany,
};
