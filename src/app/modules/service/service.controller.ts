import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ServiceService } from './service.service';

const createService = catchAsync(async (req, res) => {
  if (req.file) {
    // req.body.icon = await uploadFileWithS3(req.file);
    req.body.icon = req.file.path;
  }

  const result = await ServiceService.createService(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Service created successfully',
    data: result,
  });
});

const getServices = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await ServiceService.getServices(
    categoryId,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Services fetched successfully',
    data: result,
  });
});

const getConfirmServices = catchAsync(async (req, res) => {
  const { serviceId } = req.params;
  const result = await ServiceService.getConfirmServices(
    req.user as TAuthUser,
    serviceId,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Services fetched successfully',
    data: result,
  });
});

const editService = catchAsync(async (req, res) => {
  if (req.file) {
    // req.body.icon = await uploadFileWithS3(req.file);
    req.body.icon = req.file.path;
  }

  const result = await ServiceService.editService(
    req.params.serviceId,
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Services updated successfully',
    data: result,
  });
});

const deleteService = catchAsync(async (req, res) => {
  const result = await ServiceService.deleteService(
    req.params.serviceId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Services deleted successfully',
    data: result,
  });
});

export const ServiceController = {
  createService,
  getServices,
  getConfirmServices,
  editService,
  deleteService,
};
