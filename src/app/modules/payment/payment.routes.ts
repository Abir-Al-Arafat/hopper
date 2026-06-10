import { Router } from 'express';
import { USER_ROLE } from '../../constant';
import { auth } from '../../middleware/auth';
import validateRequest from '../../middleware/validation';
import { PaymentController } from './payment.controller';
import { PaymentValidation } from './payment.validation';

const router = Router();

router
  .post(
    '/webhook',
    auth(USER_ROLE.customer, USER_ROLE.company),
    validateRequest(PaymentValidation.paymentValidation),
    PaymentController.makePayment,
  )
  .get('/confirm-payment', PaymentController.confirmPayment)
  .get(
    '/earning_statistic',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.admin),
    PaymentController.earningStatistic,
  )
  .get(
    '/payment_list',
    auth(USER_ROLE.company, USER_ROLE.hopperCompany, USER_ROLE.admin),
    PaymentController.paymentList,
  )
  .get('/unpaid-completed-job-requests', auth(USER_ROLE.driver, USER_ROLE.customer), PaymentController.unpaidJobRequestList)
  .patch('/action', auth(USER_ROLE.driver), PaymentController.paymentAction);

export const PaymentRoutes = router;
