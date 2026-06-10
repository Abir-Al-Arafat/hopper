import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import validateRequest from '../../middleware/validation';
import { CompanyValidation } from './company.validation';
import { CompanyController } from './company.controller';

const router = Router();

router
  .post(
    '/add_dispatcher',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.admin),
    validateRequest(CompanyValidation.addDispatcherSchema),
    CompanyController.addDispatcher,
  )
  .post(
    '/invitation_code',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.admin),
    CompanyController.invitationCode,
  )
  .post('/join_company', auth(USER_ROLE.driver), CompanyController.joinCompany)
  .post(
    '/assign_driver',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    CompanyController.assignDriver,
  )
  .post(
    '/assign_company',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    CompanyController.assignCompany,
  )
  .get(
    '/quick_overview',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    CompanyController.quickOverview,
  )
  .get(
    '/others_company_info',
    auth(USER_ROLE.hopperCompany),
    CompanyController.othersCompanyInfo,
  )
  .get(
    '/all_company_list',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    CompanyController.getAllCompanyList,
  )
  .get(
    '/leave_requests',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany),
    CompanyController.getAllLeaveRequests,
  )
  .get(
    '/total_earnings',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.admin),
    CompanyController.totalEarnings,
  )
  .get(
    '/all_dispatchers',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.admin),
    CompanyController.getAllDispatchers,
  )
  .get(
    '/all_drivers',
    auth(
      USER_ROLE.admin,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
    ),
    CompanyController.getAllDrivers,
  )
  .get(
    '/job_status',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    CompanyController.jobStatus,
  )
  .get(
    '/job_status/manual',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
      USER_ROLE.driver,
    ),
    CompanyController.manualJobStatus,
  )
  .patch(
    '/job_status/:jobRequestId',
    validateRequest(CompanyValidation.updateJobStatusSchema),
    CompanyController.updateJobStatus,
  )
  .get(
    '/available_drivers',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    CompanyController.availableDrivers,
  )
  .get(
    '/available_companies',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    CompanyController.availableCompanies,
  )
  .get(
    '/company_overview',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany),
    CompanyController.companyOverview,
  )
  .get(
    '/driver_details/:driverId',
    auth(
      USER_ROLE.admin,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
    ),
    CompanyController.driverDetails,
  )
  .get(
    '/driver_job_details/:driverId',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    CompanyController.driverJobDetails,
  )
  .patch(
    '/accept_leave_request/:requestId',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany),
    CompanyController.acceptLeaveRequest,
  )
  .delete(
    '/remove_company/:companyId',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany),
    CompanyController.removeCompany,
  );

export const CompanyRoutes = router;
