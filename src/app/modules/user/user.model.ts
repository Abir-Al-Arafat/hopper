/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcrypt';
import mongoose, { Schema } from 'mongoose';
import { USER_ROLE, USER_STATUS } from '../../constant';
import { TServiceCategory, TUser, UserModel } from './user.interface';

const serviceCategorySchema = new Schema<TServiceCategory>({
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
});

export const userSchema = new mongoose.Schema<TUser, UserModel>(
  {
    uid: {
      type: String,
      required: [true, 'UID is required'],
      unique: true,
      trim: true,
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters long'],
      select: 0,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        USER_ROLE.admin,
        USER_ROLE.driver,
        USER_ROLE.customer,
        USER_ROLE.dispatcher,
        USER_ROLE.company,
        USER_ROLE.hopperCompany,
      ],
      default: USER_ROLE.customer,
    },
    status: {
      type: String,
      enum: [USER_STATUS.active, USER_STATUS.blocked],
      default: USER_STATUS.active,
    },
    isSubscribed: {
      type: Boolean,
      default: false,
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
    distanceRedius: {
      type: Number,
    },

    isCompanyAssigned: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
    },
    isSocialLogin: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isAutoDispatch: {
      type: Boolean,
      default: false,
    },
    myCompany: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    dispatcherCompany: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    ratings: {
      type: Number,
      default: 0,
    },
    activity: {
      type: String,
      enum: ['available', 'offline', 'on-job'],
      default: 'offline',
    },
    assignedCompany: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
    },
    serviceCategory: {
      type: [serviceCategorySchema],
    },
  },
  {
    timestamps: true,
  },
);

// query middlewares
userSchema.pre('find', async function (next) {
  const query = this as any;

  if (query.options.bypassMiddleware) {
    return next(); // Skip middleware if the flag is set
  }
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('findOne', async function (next) {
  const query = this as any;

  if (query.options.bypassMiddleware) {
    return next(); // Skip middleware if the flag is set
  }
  this.findOne({ isDeleted: { $ne: true } });
  next();
});

// userSchema.pre('aggregate', async function (next) {
//   this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
//   next();
// });

userSchema.statics.findLastUser = async function () {
  return await this.findOne({}, null, { bypassMiddleware: true })
    .select('uid')
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();
};

userSchema.statics.isUserExist = async function (id: string) {
  return await User.findOne({ _id: id }).select('+password');
};

userSchema.pre('save', async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this; // doc
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }

  next();
});

userSchema.statics.isMatchedPassword = async function (password, hashPassword) {
  return await bcrypt.compare(password, hashPassword);
};

userSchema.index({ location: '2dsphere' });

const User = mongoose.model<TUser, UserModel>('User', userSchema);

export default User;
