import { model, Schema } from 'mongoose';
import { TNotification } from './notification.interface';

const notificationSchema = new Schema<TNotification>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Sender id is required'],
      ref: 'User',
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Receiver id is required'],
      ref: 'User',
    },
    linkId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Link id is required'],
    },
    role: { type: String, required: [true, 'Role is required'] },
    type: { type: String, required: [true, 'Type is required'] },
    message: { type: String, required: [true, 'Message is required'] },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const Notification = model<TNotification>('Notification', notificationSchema);
export default Notification;
