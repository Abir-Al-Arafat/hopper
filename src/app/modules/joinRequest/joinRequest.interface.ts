import { Types } from 'mongoose';

export type TJoinRequest = {
  userId: Types.ObjectId;
  companyId: Types.ObjectId;
  invitationCode: string;
  status: 'pending' | 'accept' | 'reject' | 'cancel' | 'left';
  createdAt?: Date;
  updatedAt?: Date;
};