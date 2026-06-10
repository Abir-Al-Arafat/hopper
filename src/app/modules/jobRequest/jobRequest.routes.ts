import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import { JobRequestController } from './jobRequest.controller';
import upload from '../../utils/uploadImage';
import parseFormData from '../../middleware/parsedData';

const router = Router();

router
  .post(
    '/accept',
    auth(USER_ROLE.driver),
    JobRequestController.acceptJobRequest,
  )
  .patch(
    '/action',
    auth(USER_ROLE.driver),
    upload.fields([
      { name: 'beforeImage', maxCount: 2 },
      { name: 'signature', maxCount: 2 },
      { name: 'afterImage', maxCount: 2 },
    ]),
    parseFormData,
    JobRequestController.jobRequestAction,
  )
  .get(
    '/history',
    auth(
      USER_ROLE.customer,
      USER_ROLE.driver,
      USER_ROLE.admin,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
    ),
    JobRequestController.getJobHistory,
  )
  .get(
    '/all_jobs',
    auth(USER_ROLE.admin, USER_ROLE.hopperCompany, USER_ROLE.company),
    JobRequestController.getAllJobs,
  )
  .get(
    '/find_driver/:jobRequestId',
    auth(USER_ROLE.customer),
    JobRequestController.findDriver,
  )
  .get(
    '/track_location/:jobRequestId',
    auth(
      USER_ROLE.customer,
      USER_ROLE.dispatcher,
      USER_ROLE.company,
      USER_ROLE.hopperCompany,
      USER_ROLE.driver,
    ),
    JobRequestController.trackLocation,
  ).get("/", auth(USER_ROLE.dispatcher), JobRequestController.fetchAllJobRequests);

export const JobRequestRoutes = router;
