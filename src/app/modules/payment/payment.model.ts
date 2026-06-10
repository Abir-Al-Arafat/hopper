import { model, Schema } from 'mongoose';
import { TPayment } from './payment.interface';

const paymentSchema = new Schema<TPayment>(
  {
    jobRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'JobRequest',
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    },
    /* 
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
    },
    */

    paymentType: {
      type: String,
      required: [true, 'Payment type is required'],
      enum: ['card', 'cash', 'bank', 'paypal'],
      trim: true,
    },
    paymentStatus: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    paymentId: {
      type: String,
      required: [true, 'Payment id is required'],
      trim: true,
    },
    earnFrom: {
      type: String,
      required: [true, 'Earn from is required'],
      enum: ['job', 'subscription'],
      trim: true,
      default: 'job',
    },
  },
  {
    timestamps: true,
  },
);

const Payment = model<TPayment>('Payment', paymentSchema);

export default Payment;
