import { ObjectId } from 'mongoose';

export type TManualJob = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  callerName: string;
  callerPhone: string;
  account: string;
  paymentType: string;
  pro: string;
  classType: string;
  eta: string;
  pickupName: string;
  pickupNumber: string;
  dropoffName: string;
  dropoffNumber: string;
  notes: string;
  jobId: ObjectId;
};
