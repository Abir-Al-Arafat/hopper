import { model, Schema } from 'mongoose';
import { TCompany, TDispatchers, TDriver } from './company.interface';

const driverSchema = new Schema<TDriver>({
  driver: { type: Schema.Types.ObjectId, ref: 'User' },
});

const dispatcherSchema = new Schema<TDispatchers>({
  dispatcher: { type: Schema.Types.ObjectId, ref: 'User' },
});

const companySchema = new Schema<TCompany>(
  {
    companyUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile' },
    drivers: [driverSchema],
    dispatchers: [dispatcherSchema],
    invitationCode: { type: String },
    companyLogo: { type: String },
    companyName: { type: String },
    isAutoDispatch: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const Company = model<TCompany>('Company', companySchema);
export default Company;
