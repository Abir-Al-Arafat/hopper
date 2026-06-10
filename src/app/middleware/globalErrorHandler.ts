/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { handleCastError } from '../../Errors/handleCastError';
import { handleDuplicateError } from '../../Errors/handleDuplicateError';
import { handleValidationError } from '../../Errors/handleValidationError';
import handleZodError from '../../Errors/handleZodErorr';
import config from '../../config';
import { TErrorSources } from '../interface/IErrorSources';
import AppError from '../utils/AppError';
import { errorLogger } from '../../shared/logger';
// Make sure this is correctly imported

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  // Extract user IP and user agent (device info)
  const userIp =
    req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  // Error logging - log detailed error
  errorLogger.error(`Error occurred at ${req.originalUrl} - ${error.message}`, {
    meta: {
      stack: error.stack,
      status: statusCode,
      ip: userIp,
      userAgent: userAgent,
    },
  });

  // Handle different error types and map them to a consistent format
  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (error?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (error?.name === 'CastError') {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (error?.code === 11000) {
    const simplifiedError = handleDuplicateError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorSources = [
      {
        path: '',
        message: error?.message,
      },
    ];
  } else if (error instanceof Error) {
    message = error.message;
    errorSources = [
      {
        path: '',
        message: error.message,
      },
    ];
  }

  // Send the response to the client
  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: config.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

export default globalErrorHandler;
