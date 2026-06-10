import { ObjectId } from 'mongoose';

export type TJobStatus =
  | 'pending'
  | 'in-progress'
  | 'en-route'
  | 'working'
  | 'completed'
  | 'cancelled'
  | 'just'
  | 'picked-up'
  | 'dropped-off'
  | 'on-scene'
  | 'dispatched'
  | 'rejected';

export const JOB_STATUS = {
  pending: 'pending',
  inProgress: 'in-progress',
  enRoute: 'en-route',
  working: 'working',
  completed: 'completed',
  cancelled: 'cancelled',
  just: 'just',
  pickedUp: 'picked-up',
  droppedOff: 'dropped-off',
  onScene: 'on-scene',
  dispatched: 'dispatched',
  rejected: 'rejected',
} as const;

export type TJobRequest = {
  jobId: ObjectId;
  driver?: ObjectId;
  company?: ObjectId;
  customer?: ObjectId;
  status: TJobStatus;
  assignedAt?: Date;
  dispatchedAt?: Date;
  enRouteAt?: Date;
  onSceneAt?: Date;
  completedAt?: Date;
  isDispatched: boolean;
  driverCommission?: number;
  mileageFeeAmount?: number;
};
