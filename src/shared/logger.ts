/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
import path from 'path';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
const { combine, timestamp, label, printf } = format;

const logFormat = printf(({ level, message, label, timestamp, meta }: any) => {
  const date = new Date(timestamp as string);
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  let metaDetails = '';

  if (meta) {
    if (meta.ip) {
      metaDetails += ` IP: ${meta.ip}`;
    }
    if (meta.userAgent) {
      metaDetails += ` User-Agent: ${meta.userAgent}`;
    }
  }

  return `${date.toDateString()} ${hour}:${minutes}:${seconds} } [${label}] ${level}: ${message}${metaDetails}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(label({ label: 'DOCKER' }), timestamp(), logFormat),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join(
        process.cwd(),
        'logs',
        'winston',
        'successes',
        'docker-%DATE%-success.log',
      ),
      datePattern: 'YYYY-MM-DD-HH-mm-ss',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

const errorLogger = createLogger({
  level: 'error',
  format: combine(label({ label: 'DOCKER' }), timestamp(), logFormat),
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      filename: path.join(
        process.cwd(),
        'logs',
        'winston',
        'errors',
        'docker-%DATE%-error.log',
      ),
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: false,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export { errorLogger, logger };
