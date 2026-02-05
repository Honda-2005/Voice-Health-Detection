/**
 * Enhanced Authentication Middleware
 * - JWT verification
 * - Token blacklisting support
 * - WebSocket authentication
 * - Role-based access control
 */

import jwt from 'jsonwebtoken';
import { getConfig } from '../utils/configValidator.js';

const config = getConfig();

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set();

/**
 * Blacklist a token (for logout)
 */
export function blacklistToken(token) {
  tokenBlacklist.add(token);
  // Auto-remove after expiration
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, config.jwt.expirationMinutes * 60 * 1000);
}

/**
 * Check if token is blacklisted
 */
export function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

/**
 * Main authentication middleware for HTTP requests
 */
export const authMiddleware = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
        code: 'TOKEN_REVOKED'
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm]
      });

      // Attach user data to request
      req.userId = decoded.userId;
      req.user = decoded;
      req.token = token;

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please refresh or login again.',
          code: 'TOKEN_EXPIRED',
          expiredAt: jwtError.expiredAt
        });
      }

      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Authentication failed.',
          code: 'INVALID_TOKEN'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication service error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without auth
    }

    const token = authHeader.split(' ')[1];

    if (isTokenBlacklisted(token)) {
      return next(); // Blacklisted, treat as no auth
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm]
      });

      req.userId = decoded.userId;
      req.user = decoded;
      req.token = token;
    } catch (jwtError) {
      // Token invalid/expired, continue without auth
    }

    next();
  } catch (error) {
    next(); // On error, continue without auth
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NO_AUTH'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Admin-only middleware (backward compatibility)
 */
export const adminMiddleware = requireRole('admin');

/**
 * WebSocket authentication middleware
 */
export const socketAuthMiddleware = (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Check blacklist
    if (isTokenBlacklisted(token)) {
      return next(new Error('Token revoked'));
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: [config.jwt.algorithm]
      });

      // Attach user data to socket
      socket.userId = decoded.userId;
      socket.user = decoded;
      socket.token = token;

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

export default {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware,
  requireRole,
  socketAuthMiddleware,
  blacklistToken,
  isTokenBlacklisted
};
