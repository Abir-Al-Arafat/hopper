import { ObjectId } from 'mongoose';

export type TService = {
  category: ObjectId;
  serviceName: string;
  description: string;
  price: number;
  milageFee: number;
  totalFee: number;
  icon: string;
};
