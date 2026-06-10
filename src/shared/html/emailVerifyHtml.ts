import { style } from '../style/style';

export const emailVerifyHtml = (
  title: string,
  otp: number,
  expiresIn: string = '3 minutes',
) => {
  return `<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style type="text/css">
       ${style}
    </style>
</head>

<body>
    <div class="preheader">
        Verify your email address to complete your registration.
    </div>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <img src="https://hopperroadside.com/public/images/logo.svg" alt="" />

        </div>
        <!-- Content -->
        <div class="email-content">
            <h1>Email Verification</h1>
            <h2>Hello!</h2>
            <p>
                Thank you for signing up with The Local Margin. Please verify your
                email address by using the One Time Password (OTP) below:
            </p>
            <span class="otp-code">${otp}</span>
            <p>
                This OTP is valid for <strong>${expiresIn}</strong>. If you did not
                request this, please ignore this email or contact our support.
            </p>
            <p style="text-align: center">
                <a href="mailto:support@thelocalmargin.com" class="btn">Contact Support</a>
            </p>
            <p>Best regards,<br />The Hopper-Roadside Team</p>
        </div>
        <!-- Footer -->
        <div class="email-footer">
            &copy; ${new Date().getFullYear()} The Local Margin. All rights
            reserved.
        </div>
    </div>
</body>

</html>
`;
};
