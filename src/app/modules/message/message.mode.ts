import { model, Schema } from 'mongoose';
import { TMessage } from './message.interface';

const messageSchema = new Schema<TMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Conversation id is required'],
      ref: 'Conversation',
    },
    text_message: { type: String, required: [true, 'Message is required'] },
    image: { type: String },
    sender: {
      type: Schema.Types.ObjectId,
      required: [true, 'Sender is required'],
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

const Message = model<TMessage>('Message', messageSchema);

export default Message;
