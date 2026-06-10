import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StaticContentService } from './staticContent.service';
import { TAuthUser } from '../../interface/authUser';

const createStaticContent = catchAsync(async (req, res) => {
  const result = await StaticContentService.createStaticContent(
    req.user as TAuthUser,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Static content created successfully',
    data: result,
  });
});

const getStaticContent = catchAsync(async (req, res) => {
  const result = await StaticContentService.getStaticContent(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Static content fetched successfully',
    data: result,
  });
});

const updateStaticContent = catchAsync(async (req, res) => {
  const result = await StaticContentService.updateStaticContent(
    req.params.id,
    req.user as TAuthUser,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Static content updated successfully',
    data: result,
  });
});

const deleteStaticContent = catchAsync(async (req, res) => {
  const result = await StaticContentService.deleteStaticContent(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Static content deleted successfully',
    data: result,
  });
});

export const StaticContentController = {
  createStaticContent,
  getStaticContent,
  updateStaticContent,
  deleteStaticContent,
};
