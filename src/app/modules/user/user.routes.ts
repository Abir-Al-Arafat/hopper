import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { UserController } from './user.controller';
import validateRequest from '../../middleware/validation';
import { UserValidation } from './user.validation';

const router = Router();

router
  .post(
    '/create_admin',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    UserController.createAdmin,
  )
  .get(
    '/',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    UserController.getAllUsers,
  )
  .get('/company', auth(USER_ROLE.admin), UserController.getAllCompany)
  .get(
    '/dispatcher-get-company',
    auth(USER_ROLE.dispatcher),
    UserController.getCompanyForDispatcher,
  )
  .get(
    '/company-get-dispatcher',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany),
    UserController.getDispatcherForCompany,
  )
  .get(
    '/company_request',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    UserController.getAllCompanyRequest,
  )
  .get(
    '/driver_request',
    auth(USER_ROLE.hopperCompany, USER_ROLE.company),
    UserController.getAllDriverRequest,
  )
  .get(
    '/all_admin',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    UserController.getAllAdmin,
  )
  .get(
    '/customer_overview',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    UserController.customerOverview,
  )
  .get(
    '/all_dispatcher',
    auth(USER_ROLE.admin),
    UserController.getAllDispatcher,
  )
  .patch(
    '/driver_request/action',
    auth(USER_ROLE.hopperCompany, USER_ROLE.company),
    UserController.driverRequestAction,
  )
  .patch(
    '/approve_request/action',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    UserController.approveRequest,
  )
  .post(
    '/leave_company',
    auth(USER_ROLE.driver, USER_ROLE.dispatcher),
    UserController.leaveCompany,
  )
  .get(
    '/company/:companyId',
    auth(USER_ROLE.admin),
    UserController.companyDetails,
  )
  .get(
    '/company_dispatched_history/:companyId',
    auth(USER_ROLE.admin),
    UserController.companyDispatchedHistory,
  )
  .patch(
    '/actions/:id',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.admin,
      USER_ROLE.driver,
      USER_ROLE.customer,
    ),
    UserController.updateUserActions,
  )
  .patch(
    '/activity/:id',
    // auth(USER_ROLE.admin),
    validateRequest(UserValidation.updateUserActivityValidation),
    UserController.updateUserActivity,
  )
  .get(
    '/driver_performance/:driverId',
    auth(USER_ROLE.admin, USER_ROLE.company, USER_ROLE.hopperCompany),
    UserController.driverPerformance,
  )
  .delete(
    '/delete_account',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.admin,
      USER_ROLE.driver,
      USER_ROLE.customer,
    ),
    UserController.deleteAccount,
  )
  .patch(
    '/toggle_auto_dispatch',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany, USER_ROLE.company),
    UserController.toggleAutoDispatch,
  );

export const UserRoutes = router;
