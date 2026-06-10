import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import validateRequest from '../../middleware/validation';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionValidation } from './subscription.validation';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    validateRequest(SubscriptionValidation.createSubscriptionValidationSchema),
    SubscriptionController.createSubscription,
  )
  .get(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.company, USER_ROLE.hopperCompany),
    SubscriptionController.getSubscriptions,
  )
  .get(
    '/my_subscription',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany),
    SubscriptionController.getMySubscription,
  )
  .get(
    '/:subscriptionId',
    auth(USER_ROLE.admin, USER_ROLE.company, USER_ROLE.hopperCompany),
    SubscriptionController.getSubscription,
  )
  .delete(
    '/:subscriptionId',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    SubscriptionController.deleteSubscription,
  )
  .patch(
    '/:subscriptionId',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    SubscriptionController.updateSubscription,
  );

export const SubscriptionRoutes = router;
