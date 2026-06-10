import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import validateRequest from '../../middleware/validation';
import { JobValidation } from './job.validation';
import { JobController } from './job.controller';

const router = Router();

router
  .post(
    '/create',
    auth(USER_ROLE.customer),
    validateRequest(JobValidation.jobValidationSchema),
    JobController.createJob,
  )
  .post(
    '/schedule_job_request',
    auth(USER_ROLE.customer),
    JobController.scheduleJob,
  )
  .post(
    '/manual_job_creation',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.dispatcher),
    JobController.manualJobCreation,
  )
  .patch(
    '/manual_job_edit/:manualJobId',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.dispatcher),
    JobController.updateManualJob,
  )
  .get(
    '/all_active_jobs',
    auth(
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.dispatcher,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
    ),
    JobController.getAllActiveJobs,
  )
  .get(
    '/all_schedule_jobs',
    auth(USER_ROLE.customer),
    JobController.getAllScheduleJobs,
  )
  .get(
    '/details/:jobRequestId',
    auth(
      USER_ROLE.driver,
      USER_ROLE.customer,
      USER_ROLE.dispatcher,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
    ),
    JobController.getJobDetails,
  )
  .get(
    '/job_details/:jobId',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.dispatcher),
    JobController.getJobDetailsForCompany,
  )
  .get(
    '/job_timestamps/:jobId',
    auth(
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.dispatcher,
      USER_ROLE.admin,
    ),
    JobController.getJobTimestamps,
  )
  .get(
    '/',
    // auth(USER_ROLE.dispatcher),
    JobController.getAllJobs,
  );

export const JobRoutes = router;
