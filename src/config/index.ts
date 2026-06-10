import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,

  salt_round: process.env.SALT_ROUND,
  socket_port: process.env.SOCKET_PORT,
  ip: process.env.IP,

  admin: {
    admin_email: process.env.ADMIN_EMAIL,
    admin_password: process.env.ADMIN_PASSWORD,
  },

  company: {
    company_email: process.env.HOPPER_COMPANY_EMAIL,
    company_password: process.env.HOPPER_COMPANY_PASSWORD,
  },

  monitor_usernames: process.env.MONITOR_USERNAMES,
  monitor_passwords: process.env.MONITOR_PASSWORDS,
  project_name: process.env.PROJECT_NAME,

  jwt: {
    access_token: process.env.ACCESS_KEY,
    access_expires_in: process.env.ACCESS_EXPIRE_IN,
    sing_up_token: process.env.SIGNUP_KEY,
    sing_up_expires_in: process.env.SIGNUP_EXPIRE_IN,
    forgot_password_token: process.env.FORGOT_PASSWORD_KEY,
    forgot_password_expires_in: process.env.FORGOT_PASSWORD_EXPIRE_IN,
    refresh_token: process.env.REFRESH_KEY,
    refresh_expires_in: process.env.REFRESH_EXPIRE_IN,
    reset_password_token: process.env.RESET_PASSWORD_KEY,
    reset_password_expires_in: process.env.RESET_PASSWORD_EXPIRE_IN,
  },

  dispatcher_default_password: process.env.DISPATCHER_DEFAULT_PASSWORD,
  customer_default_password: process.env.CUSTOMER_DEFAULT_PASSWORD,
  otp_expire_in: process.env.OTP_EXPIRE_IN,
  smtp_username: process.env.SMTP_USERNAME,
  smtp_password: process.env.SMTP_PASSWORD,
  // stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  base_url: process.env.BASE_URL,
  logger_username: process.env.LOGGER_USERNAME,
  logger_password: process.env.LOGGER_PASSWORD,
  admin_password: process.env.ADMIN_PASSWORD,

  aws: {
    access_key_id: process.env.AWS_ACCESS_KEY_ID,
    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket_name: process.env.AWS_BUCKET_NAME,
  },
  stripe: {
    // Support both legacy and current env var names.
    stripe_api_secret:
      process.env.STRIPE_API_SECRET || process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_ONBOARDING_SECRET: process.env.STRIPE_ONBOARDING_SECRET,
  },
};
