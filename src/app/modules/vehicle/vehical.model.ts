import { model, Schema } from 'mongoose';
import { TVehicle } from './vehicle.interface';

const vehicleSchema = new Schema<TVehicle>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleRegistration: { type: String },
    vehicleInsurance: { type: String },
    vehicleImage: { type: String },
    vehicleName: { type: String },
    vehicleColor: { type: String },
    numberPlate: { type: String },
    describe: { type: String },
    socialSecurity: { type: String },
    vinNumber: { type: String },
    vehicleModel: { type: String },
    vehicleModelYear: { type: String },
  },
  {
    timestamps: true,
  },
);

const Vehicle = model<TVehicle>('Vehicle', vehicleSchema);
export default Vehicle;
