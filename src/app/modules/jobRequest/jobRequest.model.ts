import { model, Schema } from 'mongoose';
import { TJobRequest } from './jobRequest.interface';

const jobRequestSchema = new Schema<TJobRequest>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Job is required'],
      ref: 'Job',
    },
    driver: { type: Schema.Types.ObjectId, ref: 'User' },
    company: { type: Schema.Types.ObjectId, ref: 'User' },
    customer: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: [
        'pending',
        'in-progress',
        'en-route',
        'working',
        'completed', 
        'cancelled',
        'just',
        'picked-up',
        'dropped-off',
        'on-scene',
        'dispatched',
        'rejected',
      ],
      required: [true, 'Status is required'],
      default: 'pending',
    },

    assignedAt: { type: Date },
    dispatchedAt: { type: Date },
    enRouteAt: { type: Date },
    onSceneAt: { type: Date },
    completedAt: { type: Date },
    isDispatched: { type: Boolean, default: false },
    driverCommission: { type: Number, default: 0 },
    mileageFeeAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const JobRequest = model<TJobRequest>('JobRequest', jobRequestSchema);
export default JobRequest;
