import { ObjectId } from 'mongoose';

export type TTools = {
  userId: ObjectId;
  toolsForLockOut: string;
  toolsForJumpOut: string;
  toolsForTierChange: string;
  toolsForFuelDelivery: string;
  toolsForJacks: string;
  toolsForDrills: string;
  toolsForCodeReaders: string;
  toolsForSocketWrenches: string;
};
