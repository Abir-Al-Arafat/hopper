import { model, Schema } from 'mongoose';
import { TReview } from './review.interface';

const reviewSchema = new Schema<TReview>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    driverId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    serviceId: { type: Schema.Types.ObjectId, required: true, ref: 'Service' },
    jobId: { type: Schema.Types.ObjectId, required: true, ref: 'Job' },
    rating: { type: Number, required: [true, 'Rating is required'] },
  },
  {
    timestamps: true,
  },
);

const Review = model<TReview>('Review', reviewSchema);

export default Review;
