import { model, Schema } from 'mongoose';
import { TJoinRequest } from './joinRequest.interface';

const joinRequestSchema = new Schema<TJoinRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    invitationCode: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accept', 'reject', 'cancel', 'left'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

// Index to prevent duplicate pending requests
joinRequestSchema.index({ userId: 1, companyId: 1, status: 1 });

const JoinRequest = model<TJoinRequest>('JoinRequest', joinRequestSchema);
export default JoinRequest;
