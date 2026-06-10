import { Schema } from 'mongoose';

export type TDriver = {
  driver: Schema.Types.ObjectId;
};

export type TDispatchers = {
  dispatcher: Schema.Types.ObjectId;
};

export type TCompany = {
  companyUserId: Schema.Types.ObjectId;
  profileId: Schema.Types.ObjectId;
  drivers: TDriver[];
  dispatchers: TDispatchers[];
  invitationCode: string;
  companyLogo: string;
  companyName: string;
  isAutoDispatch: boolean;
};
