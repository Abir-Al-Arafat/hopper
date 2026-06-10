import nodemailer from 'nodemailer';
import config from '../../config';

type TEmailBody = {
  email: string;
  subject: string;
  html: string;
};

// Create transporter only if credentials are properly configured
const createTransporter = () => {
  if (!config.smtp_username || !config.smtp_password) {
    console.warn(
      '⚠️  SMTP credentials not configured. Emails will be logged to console.',
    );
    return null;
  }

  // Remove any spaces from the app password
  const cleanPassword = config.smtp_password.replace(/\s/g, '');

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: config.smtp_username,
      pass: cleanPassword,
    },
  });
};

const transporter = createTransporter();

// async..await is not allowed in global scope, must use a wrapper
const sendMail = async (emailBody: TEmailBody) => {
  try {
    console.log('\n📧 transporter:', transporter);
    console.log('\n📧 config.NODE_ENV:', config.NODE_ENV);
    console.log('\n📧 !transporter:', !transporter);
    // In development mode or if no transporter, just log the email
    if (!transporter && config.NODE_ENV === 'development') {
      console.log('\n📧 ===== EMAIL (Development Mode) =====');
      console.log('To:', emailBody.email);
      console.log('Subject:', emailBody.subject);
      console.log('HTML Preview:', emailBody.html.substring(0, 200) + '...');
      console.log('======================================\n');
      return { messageId: 'dev-mode-' + Date.now() };
    }

    // Production mode - actually send the email
    const info = await transporter?.sendMail({
      from: config.smtp_username,
      to: emailBody.email,
      subject: emailBody.subject,
      html: emailBody.html,
    });

    console.log('✅ Email sent successfully: %s', info?.messageId);
    return info;
  } catch (error: any) {
    console.error('❌ Email sending failed:', error.message);

    // In development, don't throw error, just log it
    if (config.NODE_ENV === 'development') {
      console.warn(
        '⚠️  Email sending failed in development mode, continuing...',
      );
      return { messageId: 'dev-mode-failed-' + Date.now() };
    }

    // In production, throw the error
    throw error;
  }
};

export default sendMail;
