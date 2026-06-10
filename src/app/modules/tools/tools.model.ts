import { model, Schema } from 'mongoose';
import { TTools } from './tools.interface';

const toolsSchema = new Schema<TTools>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toolsForCodeReaders: {
      type: String,
      trim: true,
    },
    toolsForDrills: {
      type: String,
      trim: true,
    },
    toolsForFuelDelivery: {
      type: String,
      trim: true,
    },
    toolsForJacks: {
      type: String,
      trim: true,
    },
    toolsForJumpOut: {
      type: String,
      trim: true,
    },
    toolsForLockOut: {
      type: String,

      trim: true,
    },
    toolsForTierChange: {
      type: String,

      trim: true,
    },
    toolsForSocketWrenches: {
      type: String,

      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Tools = model<TTools>('Tools', toolsSchema);
export default Tools;
