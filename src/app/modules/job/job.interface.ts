import { ObjectId } from 'mongoose';
import { TLocation } from '../user/user.interface';

export type sourceType = 'directBook' | 'partnerBook' | 'manualBook';

export type TJob = {
  customer: ObjectId;
  service: ObjectId;
  uid: string;
  car: ObjectId;
  serviceName: string;
  categoryName: string;
  location: TLocation; // as pickup and confirm location
  dropOffLocation?: TLocation;
  extraService?: ObjectId[];
  mileageFee: number;
  totalCost: number;
  signature?: string;
  beforeImage?: string;
  specialInstruction?: string;
  houseAddress: string;
  city: string;
  state: string;
  zipCode: number;
  afterImage?: string;
  isAssigned: boolean;
  callerName: string;
  callerPhone: string;
  source: sourceType;
};
