import { Schema } from 'mongoose';

export type TVehicle = {
  userId?: Schema.Types.ObjectId;
  vehicleRegistration?: string;
  vehicleInsurance?: string;
  vehicleImage?: string;
  vehicleName?: string;
  vehicleColor?: string;
  numberPlate?: string;
  describe?: string;
  socialSecurity?: string;
  vinNumber?: string;
  vehicleModel?: string;
  vehicleModelYear?: string;
};
