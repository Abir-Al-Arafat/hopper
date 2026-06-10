import { ObjectId } from 'mongoose';

export type TReview = {
  userId: ObjectId;
  driverId: ObjectId;
  serviceId?: ObjectId;
  jobId?: ObjectId;
  rating: number;
};
