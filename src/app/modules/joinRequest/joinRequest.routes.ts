import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import { JoinRequestController } from './joinRequest.controller';

const router = Router();

// Get all join requests for a company
router.get(
  '/',
  auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.admin),
  JoinRequestController.getAllJoinRequests,
);

// Get my join requests (driver)
router.get(
  '/my_requests',
  auth(USER_ROLE.driver),
  JoinRequestController.getMyJoinRequests,
);

// Get single join request by ID
router.get(
  '/:id',
  auth(
    USER_ROLE.company,
    USER_ROLE.hopperCompany,
    USER_ROLE.admin,
    USER_ROLE.driver,
  ),
  JoinRequestController.getJoinRequestById,
);

// Accept or reject join request (company)
router.patch(
  '/accept/:id',
  auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.admin),
  JoinRequestController.acceptJoinRequest,
);

export const JoinRequestRoutes = router;
