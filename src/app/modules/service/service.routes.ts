import { Router } from 'express';
import upload from '../../utils/uploadImage';
import parseFormData from '../../middleware/parsedData';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import validateRequest from '../../middleware/validation';
import { ServiceValidation } from './service.validation';
import { ServiceController } from './service.controller';

const router = Router();

router
  .post(
    '/create',
    upload.single('icon'),
    parseFormData,
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    validateRequest(ServiceValidation.createServiceValidationSchema),
    ServiceController.createService,
  )
  .get(
    '/:categoryId',
    auth(
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    ServiceController.getServices,
  )
  .get(
    '/confirm_service/:serviceId',
    auth(USER_ROLE.customer),
    ServiceController.getConfirmServices,
  )
  .patch(
    '/edit/:serviceId',
    upload.single('icon'),
    parseFormData,
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    // validateRequest(ServiceValidation.createServiceValidationSchema),
    ServiceController.editService,
  )
  .delete(
    '/delete/:serviceId',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    ServiceController.deleteService,
  );

export const ServiceRoutes = router;
