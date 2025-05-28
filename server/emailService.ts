import nodemailer from 'nodemailer';

// Create email transporter using Gmail (you can use any SMTP service)
const createTransporter = () => {
  // For development, we'll use a test account
  // In production, you would use your actual email credentials
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

export const sendPasswordResetEmail = async (
  userEmail: string,
  username: string,
  resetToken: string,
  baseUrl: string
) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@titanfitness.com',
      to: userEmail,
      subject: 'Reset Your Titan Fitness Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - Titan Fitness</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">TITAN FITNESS</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Password Reset Request</p>
              </div>
            </div>

            <!-- Content -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 15px;">Hi ${username},</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your Titan Fitness account password. If you made this request, 
                click the button below to create a new password.
              </p>
              
              <!-- Reset Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          text-decoration: none; 
                          padding: 15px 30px; 
                          border-radius: 8px; 
                          display: inline-block; 
                          font-weight: bold;
                          font-size: 16px;">
                  Reset My Password
                </a>
              </div>

              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                This link will expire in <strong>15 minutes</strong> for security purposes.
              </p>

              <p style="color: #666; line-height: 1.6;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">
                ${resetUrl}
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; color: #999; font-size: 12px;">
              <p>
                If you didn't request this password reset, you can safely ignore this email. 
                Your password will remain unchanged.
              </p>
              <p style="margin-top: 15px;">
                Best regards,<br>
                The Titan Fitness Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${username},

        We received a request to reset your Titan Fitness account password.

        To reset your password, click this link:
        ${resetUrl}

        This link will expire in 15 minutes for security purposes.

        If you didn't request this password reset, you can safely ignore this email.

        Best regards,
        The Titan Fitness Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return false;
  }
};

// For development/testing, create a test account
export const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Test email account created:');
    console.log('User:', testAccount.user);
    console.log('Pass:', testAccount.pass);
    return testAccount;
  } catch (error) {
    console.error('Failed to create test account:', error);
    return null;
  }
};