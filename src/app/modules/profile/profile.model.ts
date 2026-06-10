import { model, Schema } from 'mongoose';
import { TProfile } from './profile.interface';
import { GENDER } from '../../constant';

const profileSchema = new Schema<TProfile>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    image: {
      type: String,
      trim: true,
      default: `public/uploads/images/images.jpeg`,
    },
    address: { type: String },
    addressLineTwo: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    gender: {
      type: String,
      enum: [GENDER.male, GENDER.female, GENDER.others],
    },
    houseAddress: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
  },
  {
    timestamps: true,
  },
);

const Profile = model<TProfile>('Profile', profileSchema);
export default Profile;
