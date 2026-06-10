import { ObjectId } from 'mongoose';
import { TJob } from '../job/job.interface';

export type TScheduleJob = {
  jobRequestId?: ObjectId;
  submitDateTime: Date;
};

export interface TScheduleJobCreate extends TScheduleJob {
  jobRequestData: TJob;
  dateTime: string;
}
