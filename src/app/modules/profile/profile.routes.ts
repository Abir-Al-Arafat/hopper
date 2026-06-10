import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import parseFormData from '../../middleware/parsedData';
import validateRequest from '../../middleware/validation';
import { ProfileController } from './profile.controller';
import { ProfileValidation } from './profile.validation';
import upload from '../../utils/uploadImage';

const router = Router();

router
  .get(
    '/my_profile',
    auth(
      USER_ROLE.admin,
      USER_ROLE.company,
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
      USER_ROLE.hopperCompany,
    ),
    ProfileController.getMyProfile,
  )
  .get(
    '/admin_overview',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    ProfileController.adminOverview,
  )
  .patch(
    '/update_profile',
    auth(
      USER_ROLE.admin,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
    ),
    upload.single('profileImage'),
    parseFormData,
    validateRequest(ProfileValidation.updateProfileSchema),
    ProfileController.updateProfile,
  )
  .patch(
    '/complete_profile',
    auth(
      USER_ROLE.driver,
      USER_ROLE.customer,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
    ),
    upload.fields([
      { name: 'vehicleRegistration', maxCount: 2 },
      { name: 'vehicleInsurance', maxCount: 2 },
      { name: 'vehicleImage', maxCount: 2 },
      { name: 'toolsForLockOut', maxCount: 2 },
      { name: 'toolsForJumpOut', maxCount: 2 },
      { name: 'toolsForTierChange', maxCount: 2 },
      { name: 'toolsForFuelDelivery', maxCount: 2 },
      { name: 'ToolsForSocketWrenches', maxCount: 2 },
      { name: 'toolsForJacks', maxCount: 2 },
      { name: 'toolsForDrills', maxCount: 2 },
      { name: 'toolsForCodeReaders', maxCount: 2 },
      { name: 'companyLogo', maxCount: 2 },
    ]),
    parseFormData,
    ProfileController.completeProfile,
  );

export const ProfileRoutes = router;
