import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { PendingPayoutController } from './pendingPayout.controller';

const router = Router();

router
  .get(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.company, USER_ROLE.hopperCompany),
    PendingPayoutController.getPendingPayout,
  )
  .patch(
    '/action',
    auth(USER_ROLE.admin, USER_ROLE.company, USER_ROLE.hopperCompany),
    PendingPayoutController.pendingPayoutAction,
  );
  router.get('/transaction-history', auth( USER_ROLE.company, USER_ROLE.hopperCompany,USER_ROLE.driver), PendingPayoutController.getTransactionHistory);

export const PendingPayoutRoutes = router;
