import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewService } from './review.service';
import { TAuthUser } from '../../interface/authUser';

const addReview = catchAsync(async (req, res) => {
  const result = await ReviewService.addReview(req.body, req.user as TAuthUser);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Review added successfully',
    data: result,
  });
});

export const ReviewController = {
  addReview,
};
