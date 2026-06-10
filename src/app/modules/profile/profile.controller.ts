/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { TAuthUser } from '../../interface/authUser';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProfileService } from './profile.service';

const getMyProfile = catchAsync(async (req, res) => {
  const result = await ProfileService.getMyProfile(req.user as TAuthUser);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile fetched successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const file = req?.file;
  if (file) {
    // req.body.image = await uploadFileWithS3(file);
    req.body.image = req?.file?.path;
  }

  const result = await ProfileService.updateProfile(
    req.user as TAuthUser,
    req.body,
    res,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Profile updated successfully',
    data: result,
  });
});

export interface MulterFiles {
  [fieldname: string]: any[];
}
const completeProfile = catchAsync(async (req, res) => {
  const fields = [
    'vehicleRegistration',
    'vehicleInsurance',
    'vehicleImage',
    'toolsForLockOut',
    'toolsForJumpOut',
    'toolsForTierChange',
    'toolsForFuelDelivery',
    'ToolsForSocketWrenches',
    'toolsForJacks',
    'toolsForDrills',
    'toolsForCodeReaders',
    'companyLogo',
  ];

  // Type req.files as MulterFiles
  const files = req.files as MulterFiles | undefined;

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

  const result = await ProfileService.completeProfile(
    req.user as TAuthUser,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Profile completed successfully',
    data: result,
  });
});

const adminOverview = catchAsync(async (req, res) => {
  const result = await ProfileService.adminOverview();
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: httpStatus.OK,
    message: 'admin overview fetched successfully',
  });
});

export const ProfileController = {
  getMyProfile,
  updateProfile,
  adminOverview,
  completeProfile,
};
