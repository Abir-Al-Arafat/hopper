import { model, Schema } from 'mongoose';
import { TScheduleJob } from './scheduleJob.interface';

const scheduleJobSchema = new Schema<TScheduleJob>(
  {
    jobRequestId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Job request id is required'],
      ref: 'JobRequest',
    },
    submitDateTime: {
      type: Date,
      required: [true, 'Submit date time is required'],
    },
  },
  {
    timestamps: true,
  },
);

const ScheduleJob = model<TScheduleJob>('ScheduleJob', scheduleJobSchema);
export default ScheduleJob;
