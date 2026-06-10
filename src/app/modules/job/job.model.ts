import { model, Schema, Types } from 'mongoose';
import { TJob } from './job.interface';

const jobSchema = new Schema<TJob>(
  {
    customer: {
      type: Types.ObjectId,
      required: [true, 'Customer is required'],
      ref: 'User', // Assuming you have a Customer model
    },
    service: {
      type: Types.ObjectId,
      required: [true, 'Service is required'],
      ref: 'Service', // Assuming you have a Service model
    },
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
    },
    car: {
      type: Types.ObjectId,
      ref: 'Car', // Assuming you have a Car model
    },
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
    },
    mileageFee: {
      type: Number,
    },
    uid: {
      type: String,
      required: [true, 'UID is required'],
    },
    callerName: {
      type: String,
    },
    callerPhone: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    dropOffLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    extraService: {
      type: [Types.ObjectId],
      ref: 'Service',
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
    },
    signature: {
      type: String,
    },
    beforeImage: {
      type: String,
    },
    specialInstruction: {
      type: String,
    },
    houseAddress: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zipCode: {
      type: Number,
    },
    afterImage: {
      type: String,
    },
    isAssigned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

jobSchema.index({ location: '2dsphere' });
jobSchema.index({ dropOffLocation: '2dsphere' });

const Job = model<TJob>('Job', jobSchema);
export default Job;
