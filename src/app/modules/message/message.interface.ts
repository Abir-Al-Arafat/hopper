import { ObjectId } from 'mongoose';

export type TMessage = {
  conversationId: ObjectId;
  text_message: string;
  image?: string;
  sender: ObjectId;
};
