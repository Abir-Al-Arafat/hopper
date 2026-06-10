import { model, Schema } from 'mongoose';
import { TLeaveRequest } from './leaveRequest.interface';

const leaveRequestSchema = new Schema<TLeaveRequest>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        reason: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    },
);

const LeaveRequest = model<TLeaveRequest>('LeaveRequest', leaveRequestSchema);
export default LeaveRequest;