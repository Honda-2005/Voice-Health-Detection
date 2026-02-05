import User from '../models/User.js';
import * as authService from '../services/authService.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

export const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Use service layer which has atomic race condition fix
    const result = await authService.registerUser({
      email,
      password,
      fullName,
      phone
    });

    // Fetch created user for complete data
    const user = await User.findById(result.userId);

    // Generate email verification token if email service configured
    if (process.env.EMAIL_USER) {
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = emailVerificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(user.email, emailVerificationToken);
    }

    // Generate tokens using service
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    // Handle specific errors from service
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use service layer for authentication
    const result = await authService.loginUser({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      },
    });
  } catch (error) {
    // Handle specific errors from service
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (error.message === 'ACCOUNT_SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended',
      });
    }

    if (error.message === 'ACCOUNT_DELETED') {
      return res.status(403).json({
        success: false,
        message: 'Account has been deleted',
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Use service layer for token refresh
    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        tokens: {
          accessToken: result.accessToken,
          refreshToken: refreshToken, // Return same refresh token
        },
      },
    });
  } catch (error) {
    if (error.message === 'INVALID_TOKEN_TYPE' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.json({
        success: true,
        message: 'If email exists, password reset link will be sent',
      });
    }

    const resetToken = generatePasswordResetToken();
    const hashedToken = hashToken(resetToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'Password reset link sent to email',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  // Logout is typically client-side (removing token)
  // But we can implement token blacklisting if needed
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};
