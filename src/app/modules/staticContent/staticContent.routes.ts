import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { StaticContentController } from './staticContent.controller';
import validateRequest from '../../middleware/validation';
import { StaticContentValidation } from './staticContent.validation';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    validateRequest(StaticContentValidation.staticContentValidation),
    StaticContentController.createStaticContent,
  )
  .get(
    '/',
    auth(
      USER_ROLE.admin,
      USER_ROLE.company,
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
      USER_ROLE.hopperCompany,
    ),
    StaticContentController.getStaticContent,
  )
  .patch(
    '/update/:id',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    validateRequest(StaticContentValidation.updateStaticContentValidation),
    StaticContentController.updateStaticContent,
  )
  .delete(
    '/delete/:id',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    StaticContentController.deleteStaticContent,
  );

export const StaticContentRoutes = router;
