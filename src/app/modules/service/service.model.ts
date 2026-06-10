import { model, Schema } from 'mongoose';
import { TService } from './service.interface';

const serviceSchema = new Schema<TService>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    serviceName: { type: String, required: [true, 'Service name is required'] },
    description: { type: String, required: [true, 'Description is required'] },
    price: { type: Number, required: [true, 'Price is required'] },
    milageFee: { type: Number, required: [true, 'Milage fee is required'] },
    totalFee: { type: Number, required: [true, 'Total fee is required'] },
    icon: { type: String, required: [true, 'Icon is required'] },
  },
  {
    timestamps: true,
  },
);

const Service = model<TService>('Service', serviceSchema);
export default Service;
