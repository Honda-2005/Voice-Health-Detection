import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = `
    <h2>Email Verification</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${verificationLink}">Verify Email</a>
    <p>Link expires in 24 hours</p>
  `;

  return sendEmail(email, 'Email Verification - Voice Health Detection', html);
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const html = `
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>Link expires in 1 hour</p>
  `;

  return sendEmail(email, 'Password Reset - Voice Health Detection', html);
};

export const sendPredictionNotification = async (email, username, condition, confidence) => {
  const html = `
    <h2>Analysis Complete</h2>
    <p>Hi ${username},</p>
    <p>Your voice analysis has been completed.</p>
    <p><strong>Result:</strong> ${condition}</p>
    <p><strong>Confidence:</strong> ${(confidence * 100).toFixed(2)}%</p>
    <p><a href="${process.env.FRONTEND_URL}/results">View Full Results</a></p>
  `;

  return sendEmail(email, 'Your Analysis Results - Voice Health Detection', html);
};
