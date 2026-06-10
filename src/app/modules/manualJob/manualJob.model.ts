import { model, Schema } from 'mongoose';
import { TManualJob } from './manualJob.interface';

const manualJobSchema = new Schema<TManualJob>(
  {
    customerName: { type: String },
    customerPhone: { type: String },
    customerEmail: { type: String },
    callerName: { type: String },
    callerPhone: { type: String },
    account: { type: String },
    paymentType: { type: String },
    pro: { type: String },
    classType: { type: String },
    eta: { type: String },
    pickupName: { type: String },
    pickupNumber: { type: String },
    dropoffName: { type: String },
    dropoffNumber: { type: String },
    notes: { type: String },
    jobId: { type: Schema.Types.ObjectId, required: true, ref: 'Job' },
  },
  {
    timestamps: true,
  },
);

const ManualJob = model<TManualJob>('ManualJob', manualJobSchema);
export default ManualJob;
