import { ObjectId } from 'mongoose';

export type TPayment = {
  jobRequestId?: ObjectId;
  subscriptionId?: ObjectId;
  userId?: ObjectId;
  driverId?: ObjectId;
  companyId?: ObjectId;
  jobId?: ObjectId;
  serviceId?: ObjectId;

  // card, cash, bank, paypal
  paymentType: 'card' | 'cash' | 'bank' | 'paypal';
  paymentStatus: 'pending' | 'completed' | 'failed';
  amount: number;
  paymentDate: Date;
  paymentId: string;
  earnFrom: 'job' | 'subscription';
};
