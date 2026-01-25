import nodemailer from 'nodemailer';
import logger from './logger.js';

// Email configuration
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create transporter (cached)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransporter(emailConfig);
  }
  return transporter;
};

/**
 * Send verification email
 */
export const sendVerificationEmail = async (email, verificationToken) => {
  // Skip if email verification is disabled
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    logger.info(`Email verification skipped for ${email}`);
    return { success: true, skipped: true };
  }

  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Voice Health Detection" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email - Voice Health Detection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Welcome to Voice Health Detection!</h2>
          <p>Thank you for registering. Please verify your email address to activate your account.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't create an account, please ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
        </div>
      `
    };

    await getTransporter().sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}`);

    return { success: true };
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  // Skip if email is disabled
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    logger.info(`Password reset email skipped for ${email}`);
    return { success: true, skipped: true };
  }

  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Voice Health Detection" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request - Voice Health Detection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed.</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this, please ignore this email. Your password will remain unchanged.
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour.
          </p>
        </div>
      `
    };

    await getTransporter().sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);

    return { success: true };
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, fullName) => {
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    return { success: true, skipped: true };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Voice Health Detection" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Voice Health Detection',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Welcome ${fullName}!</h2>
          <p>Your email has been verified successfully. You can now access all features of Voice Health Detection.</p>
          <p><strong>⚠️ Important Reminder:</strong> This system is for research and educational purposes only. It is NOT a medical diagnostic tool.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `
    };

    await getTransporter().sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}`);

    return { success: true };
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}:`, error);
    // Don't throw - welcome email is non-critical
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
export const testEmailConnection = async () => {
  try {
    await getTransporter().verify();
    logger.info('Email service connection verified');
    return { success: true };
  } catch (error) {
    logger.error('Email service connection failed:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  testEmailConnection
};
