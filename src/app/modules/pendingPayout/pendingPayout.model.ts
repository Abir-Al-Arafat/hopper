import { model, Schema } from 'mongoose';
import { TPendingPayout } from './pendingPayout.interface';

const pendingPayoutSchema = new Schema<TPendingPayout>(
  {
    jobRequestId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Job request id is required'],
      ref: 'JobRequest',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Company id is required'],
      ref: 'Company',
    },
    driverId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Driver id is required'],
      ref: 'User',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

const PendingPayout = model<TPendingPayout>(
  'PendingPayout',
  pendingPayoutSchema,
);
export default PendingPayout;
