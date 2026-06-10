import { ObjectId } from 'mongoose';
import { TLocation, TServiceCategory } from '../user/user.interface';
export type TGender = 'male' | 'female' | 'others';

export type TProfile = {
  userId: ObjectId;
  image?: string;
  address?: string; // street address
  addressLineTwo?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  gender: TGender;
  facebook?: string;
  instagram?: string;
};

interface IVehicleData {
  vehicleRegistration: string;
  vehicleInsurance: string;
  vehicleImage: string;
  vehicleName: string;
  vehicleColor: string;
  numberPlate: string;
  socialSecurity: string;
  describe: string;
}

export interface ICompleteProfile extends IVehicleData {
  toolsForLockOut: string;
  toolsForJumpOut: string;
  toolsForTierChange: string;
  toolsForFuelDelivery: string;
  toolsForJacks: string;
  toolsForDrills: string;
  toolsForCodeReaders: string;
  toolsForSocketWrenches: string;
  serviceCategory: TServiceCategory[];
  companyName: string;
  companyLogo: string;
  address: string;
  addressLineTwo: string;
  houseAddress: string;
  city: string;
  state: string;
  location: TLocation;
  zipCode: string;
}

export interface TProfileUpdate extends Partial<TProfile> {
  name?: string;
  phone?: string;
  activity: string;
  fcmToken?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  distanceRedius: number;
  vehicleData?: {
    vehicleName: string;
    vehicleColor: string;
    numberPlate: string;
  };
}
