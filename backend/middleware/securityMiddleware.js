/**
 * Security Middleware
 * - NoSQL injection protection
 * - Input sanitization
 * - XSS protection
 */

import mongoSanitize from 'express-mongo-sanitize';

/**
 * NoSQL injection protection middleware
 * Removes $ and . characters from request data
 */
export const sanitizeInput = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`⚠️ Potential NoSQL injection attempt detected in ${key}`);
    }
});

/**
 * Additional XSS protection middleware
 * Sanitizes string inputs to prevent XSS
 */
export const xssProtection = (req, res, next) => {
    const sanitizeString = (value) => {
        if (typeof value === 'string') {
            // Remove potentially dangerous characters
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
        }
        return value;
    };

    const sanitizeObject = (obj) => {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeString(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    sanitizeObject(obj[key]);
                }
            }
        }
    };

    // Sanitize request body, query, and params
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

/**
 * Content Security Policy headers
 */
export const cspHeaders = (req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' ws: wss:;"
    );
    next();
};

export default {
    sanitizeInput,
    xssProtection,
    cspHeaders
};
