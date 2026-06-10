import { ObjectId } from 'mongoose';

export type TLeaveRequest = {
  userId: ObjectId;
  companyId: ObjectId;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
};
