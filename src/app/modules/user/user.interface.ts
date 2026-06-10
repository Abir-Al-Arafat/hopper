/* eslint-disable no-unused-vars */
import { Model, ObjectId } from 'mongoose';

export type TRole =
  | 'admin'
  | 'customer'
  | 'driver'
  | 'dispatcher'
  | 'company'
  | 'hopperCompany';
export type TStatus = 'active' | 'blocked';
export type TActivity = 'available' | 'offline' | 'on-job';

export type TLocation = {
  type: string;
  coordinates: number[];
};

export type TServiceCategory = {
  category: ObjectId;
};

export type TUser = {
  uid: string;
  profile: ObjectId;
  assignedCompany: ObjectId;
  email: string;
  name: string;
  phone: string;
  password: string;
  role: TRole;
  status: TStatus;
  location?: TLocation;
  isCompanyAssigned?: boolean;
  isDeleted: boolean;
  isSocialLogin: boolean;
  isSubscribed: boolean;
  isCompleted: boolean;
  isApproved: boolean;
  isAutoDispatch: boolean;
  myCompany: ObjectId;
  ratings: number;
  distanceRedius?: number;
  serviceCategory: TServiceCategory[];
  activity?: TActivity;
  dispatcherCompany: ObjectId;
  fcmToken?: string;
};

export interface UserModel extends Model<TUser> {
  isUserExist(id: string): Promise<TUser>;
  isMatchedPassword(password: string, hashPassword: string): Promise<boolean>;
  findLastUser(): Promise<TUser>;
}
