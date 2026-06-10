import { ObjectId } from 'mongoose';

type TType =
  | 'accepted_job'
  | 'job-request'
  | 'job'
  | 'review'
  | 'payment'
  | 'company'
  | 'dispatcher'
  | 'driver'
  | 'approve'
  | 'company_request'
  | 'driver_request'
  | 'accept_driver_request'
  | "rejected_driver_request"
  | 'job_schedule'
  | 'payment_confirm'
  | 'completed_job'
  | "lave_request"
  | "rejected_leave_request"
  | "company_request_approved"
  | "company_request_rejected"


export const NOTIFICATION_TYPE = {
  jobRequest: 'job-request',
  acceptedJob: 'accepted_job',
  job: 'job',
  review: 'review',
  payment: 'payment',
  company: 'company',
  dispatcher: 'dispatcher',
  driver: 'driver',
  approve: 'approve',
  companyRequest: 'company_request',
  driverRequest: 'driver_request',
  jobSchedule: 'job_schedule',
  jobPayment: 'job_payment',
  paymentConfirm: 'payment_confirm',
  completedJob: 'completed_job',
  leaveRequest: 'lave_request',
  rejectedLeaveRequest: 'rejected_leave_request',
  acceptDriverRequest: 'accept_driver_request',
  rejectedDriverRequest: 'rejected_driver_request',
  companyRequestApproved: 'company_request_approved',
  companyRequestRejected: 'company_request_rejected',
} as const;

export type TNotification = {
  senderId: ObjectId;
  receiverId: ObjectId;
  linkId: ObjectId;
  role: string;
  type: TType;
  message: string;
  isRead?: boolean;
};
