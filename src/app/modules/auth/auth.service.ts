/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload, Secret } from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../../../config';
import { emailVerifyHtml } from '../../../shared/html/emailVerifyHtml';
import { forgotPasswordHtml } from '../../../shared/html/forgotPasswordHtml';
import { USER_ROLE, USER_STATUS } from '../../constant';
import AppError from '../../utils/AppError';
import { decodeToken } from '../../utils/decodeToken';
import generateToken from '../../utils/generateToken';
import generateUID from '../../utils/generateUID';
import { hashPassword } from '../../utils/hashPassword';
import { isMatchedPassword } from '../../utils/matchPassword';
import Company from '../company/company.model';
import { OtpService } from '../otp/otp.service';
import Profile from '../profile/profile.model';
import { TUser } from '../user/user.interface';
import User from '../user/user.model';
import { TRegister } from './auth.interface';
import { walletService } from '../Wallet/wallet.service';

const registerUser = async (payload: TRegister) => {
  const isUserExist = await User.findOne({ email: payload.email });
  if (isUserExist) {
    throw new AppError(httpStatus.CONFLICT, 'User already exist');
  }

  const signUpData = {
    email: payload.email,
    password: payload.password,
    role: payload.role,
  };

  const signUpToken = generateToken(
    signUpData,
    config.jwt.sing_up_token as Secret,
    config.jwt.sing_up_expires_in as string,
  );

  const checkOtp = await OtpService.checkOtpByEmail(payload.email);

  if (checkOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Otp already exist');
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  const emailBody = {
    email: payload.email,
    html: emailVerifyHtml('Email Verification', otp),
  };
  const otpExpiryTime = parseInt(config.otp_expire_in as string) || 3;
  console.log('otpExpiryTime', otpExpiryTime);
  const otpService = await OtpService.sendOTP(
    emailBody,
    otpExpiryTime,
    'email',
    'email-verification',
    otp,
  );
  console.log('otpService', otpService);
  return { signUpToken };
};

const verifyEmail = async (token: string, otp: { otp: number }) => {
  // Step 1: Decode token
  const decodedUser = decodeToken(
    token,
    config.jwt.sing_up_token as Secret,
  ) as JwtPayload;

  if (!decodedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  // Step 2: Check OTP
  const existingOtp = await OtpService.checkOtpByEmail(decodedUser.email);
  if (!existingOtp) {
    throw new AppError(httpStatus.NOT_FOUND, "OTP doesn't exist");
  }

  const isOtpValid = await OtpService.verifyOTP(
    otp.otp,
    existingOtp._id.toString(),
  );

  if (!isOtpValid) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP not matched');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Step 3: Create user
    const [uid] = await Promise.all([generateUID()]);

    const userToCreate = {
      uid,
      email: decodedUser.email,
      password: decodedUser.password,
      role: decodedUser.role,
    };

    const createdUsers = await User.create([userToCreate], { session });
    walletService.walletCreate(createdUsers[0]._id.toString())
    const user = createdUsers?.[0];
    if (!user) {
      throw new AppError(httpStatus.BAD_REQUEST, 'User not created');
    }

    // Step 4: Create profile
    const createdProfiles = await Profile.create([{ userId: user._id }], {
      session,
    });
    const profile = createdProfiles?.[0];
    if (!profile) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Profile not created');
    }

    // Step 5: Conditionally create company (for company role only)
    let companyId: string | undefined | any;
    if (decodedUser.role === 'company') {
      const createdCompanies = await Company.create(
        [
          {
            companyUserId: user._id,
            profileId: profile._id,
          },
        ],
        { session },
      );
      companyId = createdCompanies?.[0]?._id;
    }

    // Step 6: Update user with profile and company info
    const updateUser = await User.findByIdAndUpdate(
      user._id,
      {
        profile: profile._id,
        myCompany: companyId,
      },
      { session },
    );

    if (!updateUser) {
      throw new AppError(httpStatus.BAD_REQUEST, 'User not updated');
    }

    await session.commitTransaction();
    session.endSession();

    // Step 7: Cleanup OTP
    await OtpService.deleteOtpById(existingOtp._id.toString());

    // Step 8: Generate access token
    const accessTokenPayload = {
      email: user.email,
      userId: user._id,
      uid: user.uid,
      profileId: profile._id,
      assignedCompany: user.assignedCompany,
      myCompany: companyId ?? user.myCompany,
      dispatcherCompany: user.dispatcherCompany,
      name: user.name,
      role: user.role,
    };

    const accessToken = generateToken(
      accessTokenPayload,
      config.jwt.access_token as Secret,
      config.jwt.access_expires_in as string,
    );

    return {
      user,
      profile,
      accessToken,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const loginUser = async (payload: Pick<TUser, 'email' | 'password'>) => {
  const { email, password } = payload;

  // Step 1: Find user with password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
  }

  // Step 2: Validate user status
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted!');
  }

  if (user.status === USER_STATUS.blocked) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked!');
  }

  // Step 3: Check password
  const isPasswordValid = await isMatchedPassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(httpStatus.FORBIDDEN, 'Password not matched!');
  }

  // Step 5: Run parallel async tasks
  const [hopperCompany, loginData, companyInfo] = await Promise.all([
    User.findOne({ role: USER_ROLE.hopperCompany }),
    User.findOne({ email }).populate('profile assignedCompany') as any,
    Company.findOne({ _id: user?.assignedCompany }),
  ]);

  // Step 4: Prepare JWT payload
  const userData: Record<string, unknown> = {
    email: user.email,
    userId: user._id,
    uid: user.uid,
    profileId: user.profile,
    assignedCompany: user.assignedCompany,
    myCompany: user.myCompany,

    dispatcherCompany: user.dispatcherCompany,
    name: user.name,
    role: user.role,
  };

  // Add hopperCompany ID if available
  if (hopperCompany) {
    userData.hopperCompany = hopperCompany.myCompany;
  }

  // Step 6: Generate tokens
  const [accessToken, refreshToken] = await Promise.all([
    generateToken(
      userData,
      config.jwt.access_token as Secret,
      config.jwt.access_expires_in as string,
    ),
    generateToken(
      userData,
      config.jwt.refresh_token as Secret,
      config.jwt.refresh_expires_in as string,
    ),
  ]);

  return {
    accessToken,
    refreshToken,
    user: {
      ...loginData?._doc,
      ...(companyInfo ? { companyUserId: companyInfo.companyUserId } : {}),
    },
  };
};

const logOutUser = async () => {
  return {};
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  const tokenGenerate = generateToken(
    { user },
    config.jwt.forgot_password_token as Secret,
    config.jwt.forgot_password_expires_in as string,
  );

  const checkOtpExist = await OtpService.checkOtpByEmail(email);
  if (checkOtpExist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Otp already exist');
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  const emailBody = {
    email: email,
    html: forgotPasswordHtml('Forgot Password', otp),
  };

  const otpExpiryTime = parseInt(config.otp_expire_in as string) || 1;

  await OtpService.sendOTP(
    emailBody,
    otpExpiryTime,
    'email',
    'forget-password',
    otp,
  );
  return { forgotPasswordToken: tokenGenerate };
};

const verifyOtp = async (token: string, otp: { otp: number }) => {
  const decodedUser = decodeToken(
    token,
    config.jwt.forgot_password_token as Secret,
  ) as JwtPayload;

  if (!decodedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  const checkOtpExist = await OtpService.checkOtpByEmail(
    decodedUser.user.email,
  );

  if (!checkOtpExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Otp doesn't exist");
  }

  const otpVerify = await OtpService.verifyOTP(
    otp.otp,
    checkOtpExist?._id.toString(),
  );

  if (!otpVerify) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Otp not matched');
  }

  await OtpService.deleteOtpById(checkOtpExist?._id.toString());
  const tokenGenerate = generateToken(
    decodedUser.user,
    config.jwt.reset_password_token as Secret,
    config.jwt.reset_password_expires_in as string,
  );
  return { resetPasswordToken: tokenGenerate };
};

const resetPassword = async (
  token: string,
  payload: { confirmPassword: string; password: string },
) => {
  const decodedUser = decodeToken(
    token,
    config.jwt.reset_password_token as Secret,
  ) as any;

  if (!decodedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  const user = await User.findOne({ email: decodedUser?.email }).select(
    '+password',
  );
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const newhashPassword = await hashPassword(payload.password, 10);
  if (!hashPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'password not hashed');
  }

  await User.findByIdAndUpdate(user._id, { password: newhashPassword });
  return true;
};

const changePassword = async (
  token: string,
  payload: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  },
) => {
  const decodedUser = decodeToken(
    token,
    config.jwt.access_token as Secret,
  ) as JwtPayload;

  if (!decodedUser) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }

  const user = await User.findOne({ email: decodedUser.email }).select(
    '+password',
  );
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const matchPassword = await isMatchedPassword(
    payload.oldPassword,
    user?.password,
  );

  if (!matchPassword) {
    throw new AppError(httpStatus.FORBIDDEN, 'password not matched');
  }

  const newhashPassword = await hashPassword(payload.newPassword, 10);
  if (!hashPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'password not hashed');
  }

  await User.findByIdAndUpdate(user._id, { password: newhashPassword });
  return true;
};

const resendOtp = async (
  token: string,
  payload: { email?: string; purpose: string },
) => {
  const decodedUser = decodeToken(
    token,
    payload.purpose === 'email-verification'
      ? (config.jwt.sing_up_token as Secret)
      : (config.jwt.forgot_password_token as Secret),
  ) as JwtPayload;

  const otp = Math.floor(100000 + Math.random() * 900000);

  const emailBody = {
    email:
      payload.purpose === 'email-verification'
        ? decodedUser.email
        : decodedUser.user.email,
    html:
      payload.purpose === 'email-verification'
        ? emailVerifyHtml('Email Verification', otp)
        : forgotPasswordHtml('Forget Password', otp),
  };

  const otpExpiryTime = parseInt(config.otp_expire_in as string) || 3;

  await OtpService.sendOTP(
    emailBody,
    otpExpiryTime,
    'email',
    payload.purpose,
    otp,
  );
};

const socialLogin = async (payload: any) => {
  let user;
  user = await User.findOne({ email: payload.email });

  const [uid] = await Promise.all([generateUID()]);

  if (!user) {
    user = await User.create({ ...payload, uid, isSocialLogin: true });
    const createProfileData = {
      userId: user._id,
      image: (user as any)?.image,
    };

    const profile = await Profile.create(createProfileData);
    if (!profile) {
      throw new AppError(httpStatus.BAD_REQUEST, '');
    }
    await User.findByIdAndUpdate(
      user._id,
      { profile: profile._id },
      { new: true },
    );
  }

  // Step 1: Validate user status (same as loginUser)
  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted!');
  }

  if (user.status === USER_STATUS.blocked) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked!');
  }

  // Step 2: Run parallel async tasks (same as loginUser)
  const [hopperCompany, loginData, companyInfo] = await Promise.all([
    User.findOne({ role: USER_ROLE.hopperCompany }),
    User.findOne({ email: user.email }).populate('profile') as any,
    Company.findOne({ _id: user?.assignedCompany }),
  ]);

  // Step 3: Prepare JWT payload (same structure as loginUser)
  const userData: Record<string, unknown> = {
    email: user.email,
    userId: user._id,
    uid: user.uid,
    profileId: user.profile,
    assignedCompany: user.assignedCompany,
    myCompany: user.myCompany,
    dispatcherCompany: user.dispatcherCompany,
    name: user.name,
    role: user.role,
  };

  // Add hopperCompany ID if available
  if (hopperCompany) {
    userData.hopperCompany = hopperCompany.myCompany;
  }

  // Step 4: Generate tokens (same as loginUser)
  const [accessToken, refreshToken] = await Promise.all([
    generateToken(
      userData,
      config.jwt.access_token as Secret,
      config.jwt.access_expires_in as string,
    ),
    generateToken(
      userData,
      config.jwt.refresh_token as Secret,
      config.jwt.refresh_expires_in as string,
    ),
  ]);

  return {
    accessToken,
    refreshToken,
    user: {
      ...loginData?._doc,
      ...(companyInfo ? { companyUserId: companyInfo.companyUserId } : {}),
    },
  };
};

const assignRestaurant = async (
  userId: string,
  payload: { myRestaurant: string },
) => {
  return await User.findByIdAndUpdate(
    userId,
    { ...payload, isSocialLogin: false },
    { new: true },
  );
};

export const AuthService = {
  resendOtp,
  loginUser,
  verifyOtp,
  logOutUser,
  verifyEmail,
  socialLogin,
  registerUser,
  resetPassword,
  forgotPassword,
  changePassword,
  assignRestaurant,
};
