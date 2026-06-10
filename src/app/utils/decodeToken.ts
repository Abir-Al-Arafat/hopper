/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { Secret } from 'jsonwebtoken';
import AppError from './AppError';
import httpStatus from 'http-status';

export const decodeToken = (token: string, secretKey: Secret) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error: any) {
    throw new AppError(httpStatus.UNAUTHORIZED, error.message);
  }
};
