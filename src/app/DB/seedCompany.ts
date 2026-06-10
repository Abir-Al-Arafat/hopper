import config from '../../config';
import { USER_ROLE } from '../constant';
import User from '../modules/user/user.model';
import colors from 'colors';
import generateUID from '../utils/generateUID';
import mongoose from 'mongoose';
import AppError from '../utils/AppError';
import httpStatus from 'http-status';
import Profile from '../modules/profile/profile.model';
import Company from '../modules/company/company.model';

const seedHopperCompany = async () => {
  // if Company is not exist
  const hopperCompany = {
    uid: await generateUID(),
    email: config.company.company_email,
    password: config.company.company_password,
    role: USER_ROLE.hopperCompany,
    isCompleted: true,
    isApproved: true,
  };

  const ishopperCompanyExist = await User.findOne({
    role: USER_ROLE.hopperCompany,
  });

  if (!ishopperCompanyExist) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const user = await User.create([hopperCompany], { session });

      if (!user || user.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User not created');
      }

      const userId = user[0]._id;

      const createProfileData = {
        userId: userId,
      };

      const profile = await Profile.create([createProfileData], { session });

      if (!profile || profile.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Profile not created');
      }

      const company = await Company.create(
        [
          {
            companyUserId: userId,
            profileId: profile[0]._id,
          },
        ],
        { session },
      );

      if (!company) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Company not created');
      }

      const userData = {
        profile: profile[0]._id,
        myCompany: company && company[0]?._id && company[0]._id,
      };

      const updateUser = await User.findOneAndUpdate(
        { _id: user[0]._id },
        userData,
        { session },
      );

      if (!updateUser) {
        throw new AppError(httpStatus.BAD_REQUEST, 'User not updated');
      }

      await session.commitTransaction();
      session.endSession();
      console.log(colors.green(`Company created successfully`).bold);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
};

export default seedHopperCompany;
