/**
 * Authentication Service
 * Centralizes all authentication business logic
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getConfig } from '../utils/configValidator.js';

const config = getConfig();

/**
 * Register a new user
 * Fixes race condition vulnerability by using findOneAndUpdate with upsert
 */
export async function registerUser({ email, password, fullName, age, gender, phone }) {
    try {
        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);

        // Use findOneAndUpdate with upsert to prevent race condition
        // This creates the user atomically only if email doesn't exist
        const user = await User.findOneAndUpdate(
            { email: normalizedEmail },
            {
                $setOnInsert: {
                    email: normalizedEmail,
                    password: hashedPassword,
                    profile: { fullName, age, gender, phone },
                    isVerified: false,
                    role: 'user',
                    createdAt: new Date()
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        // If user already existed, the timestamps won't match
        if (user.createdAt < new Date(Date.now() - 1000)) {
            throw new Error('EMAIL_EXISTS');
        }

        return {
            userId: user._id,
            email: user.email,
            fullName: user.profile.fullName
        };
    } catch (error) {
        if (error.message === 'EMAIL_EXISTS') {
            throw error;
        }
        if (error.code === 11000) {
            // Duplicate key error
            throw new Error('EMAIL_EXISTS');
        }
        throw error;
    }
}

/**
 * Authenticate user login
 */
export async function loginUser({ email, password }) {
    try {
        const normalizedEmail = email.toLowerCase();

        // Find user by email
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }

        // Check if account is active
        if (user.status === 'suspended') {
            throw new Error('ACCOUNT_SUSPENDED');
        }

        if (user.status === 'deleted') {
            throw new Error('ACCOUNT_DELETED');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('INVALID_CREDENTIALS');
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return {
            user: {
                id: user._id,
                email: user.email,
                fullName: user.profile.fullName,
                role: user.role,
                isVerified: user.isVerified
            },
            accessToken,
            refreshToken
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(user) {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        type: 'access'
    };

    return jwt.sign(payload, config.jwt.secret, {
        algorithm: config.jwt.algorithm,
        expiresIn: `${config.jwt.expirationMinutes}m`
    });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(user) {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        type: 'refresh'
    };

    return jwt.sign(payload, config.jwt.secret, {
        algorithm: config.jwt.algorithm,
        expiresIn: '30d'
    });
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.jwt.secret, {
            algorithms: [config.jwt.algorithm]
        });

        if (decoded.type !== 'refresh') {
            throw new Error('INVALID_TOKEN_TYPE');
        }

        // Get user
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user);

        return {
            accessToken: newAccessToken
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email) {
    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Don't reveal if email exists
            return { success: true };
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id, type: 'reset' },
            config.jwt.secret,
            { expiresIn: '1h' }
        );

        // Check if email service is configured
        if (!process.env.SENDGRID_API_KEY && !process.env.AWS_SES_ACCESS_KEY && !process.env.EMAIL_USER) {
            // Email service not configured - return token for development/testing only
            if (process.env.NODE_ENV === 'development') {
                console.warn('[DEV ONLY] Password reset token:', resetToken);
                return { success: true, resetToken, warning: 'Email service not configured - token logged to console' };
            }
            // In production, fail if email not configured
            throw new Error('Email service not configured. Please contact administrator.');
        }

        // TODO: Integrate SendGrid, AWS SES, or your preferred email service
        // Example implementation:
        // await sendPasswordResetEmail(user.email, resetToken);

        console.log(`Password reset requested for ${email}. Email service integration pending.`);
        return { success: true, message: 'Password reset email would be sent here' };
    } catch (error) {
        throw error;
    }
}

/**
 * Reset password with token
 */
export async function resetPassword(resetToken, newPassword) {
    try {
        // Verify reset token
        const decoded = jwt.verify(resetToken, config.jwt.secret);

        if (decoded.type !== 'reset') {
            throw new Error('INVALID_TOKEN_TYPE');
        }

        // Get user
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, config.security.bcryptRounds);
        await user.save();

        return { success: true };
    } catch (error) {
        throw error;
    }
}

/**
 * Verify user email
 */
export async function verifyEmail(verificationToken) {
    try {
        const decoded = jwt.verify(verificationToken, config.jwt.secret);

        if (decoded.type !== 'verification') {
            throw new Error('INVALID_TOKEN_TYPE');
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        user.isVerified = true;
        await user.save();

        return { success: true };
    } catch (error) {
        throw error;
    }
}

export default {
    registerUser,
    loginUser,
    generateAccessToken,
    generateRefreshToken,
    refreshAccessToken,
    requestPasswordReset,
    resetPassword,
    verifyEmail
};
