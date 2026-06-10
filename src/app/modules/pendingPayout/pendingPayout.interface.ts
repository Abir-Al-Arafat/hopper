import { ObjectId } from 'mongoose';

export type TPendingPayout = {
  jobRequestId: ObjectId;
  companyId: ObjectId;
  driverId: ObjectId;
  status: 'pending' | 'completed';
};
