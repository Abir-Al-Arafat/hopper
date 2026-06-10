import { model, Schema } from 'mongoose';
import { TSubscription } from './subscription.interface';

const subscriptionSchema = new Schema<TSubscription>(
  {
    planName: { type: String, required: [true, 'Plan name is required'] },
    price: { type: Number, required: [true, 'Price is required'] },
    numberOfDriver: {
      type: Number,
      required: [true, 'Number of driver is required'],
    },
    timeline: { type: Number, required: [true, 'Timeline is required'] },
    features: { type: [String], required: [true, 'Features is required'] },
  },
  { timestamps: true },
);

const Subscription = model<TSubscription>('Subscription', subscriptionSchema);
export default Subscription;
