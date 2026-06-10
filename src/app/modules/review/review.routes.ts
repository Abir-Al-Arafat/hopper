import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { USER_ROLE } from '../../constant';
import validateRequest from '../../middleware/validation';
import { ReviewValidation } from './review.validation';
import { ReviewController } from './review.controller';

const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.customer),
  validateRequest(ReviewValidation.reviewValidationSchema),
  ReviewController.addReview,
);

export const ReviewRoutes = router;
