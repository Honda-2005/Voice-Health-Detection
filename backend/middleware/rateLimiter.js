/**
 * Rate Limiting Configuration
 * Protects endpoints from brute force and DoS attacks
 */

import rateLimit from 'express-rate-limit';

// Authentication endpoints - strict limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// File upload endpoints - moderate limiting
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many file uploads. Please wait before uploading again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Prediction/analysis endpoints - moderate limiting
export const predictionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 predictions per hour
  message: {
    success: false,
    message: 'Analysis limit exceeded. Please try again later.'
  },
  skipSuccessfulRequests: false
});

// Global API rate limiter - fallback protection
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// IP-based limiting for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Too many failed attempts. Account temporarily locked.'
  },
  skipSuccessfulRequests: true
});

export default {
  authLimiter,
  uploadLimiter,
  predictionLimiter,
  globalLimiter,
  strictLimiter
};
