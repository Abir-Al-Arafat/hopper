import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CategoryService } from './category.service';
import { TAuthUser } from '../../interface/authUser';

const createCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.createCategory(
    req.body,
    req.user as TAuthUser,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Category created successfully',
    data: result,
  });
});

const getCategories = catchAsync(async (req, res) => {
  const result = await CategoryService.getCategories(req.user as TAuthUser);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Categories fetched successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.updateCategory(
    req.params.categoryId,
    req.body,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category updated successfully',
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.deleteCategory(
    req.params.categoryId,
    req.user as TAuthUser,
  );
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category deleted successfully',
  });
});

export const CategoryController = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
