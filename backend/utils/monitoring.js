/**
 * Monitoring and Error Tracking Configuration
 * Sentry integration for production error tracking
 */

import * as Sentry from '@sentry/node';
import * as SentryTracing from '@sentry/tracing';

// Initialize Sentry (only in production)
export function initMonitoring(app) {
    if (process.env.NODE_ENV !== 'production') {
        console.log('Monitoring: Development mode - Sentry disabled');
        return;
    }

    if (!process.env.SENTRY_DSN) {
        console.warn('Monitoring: SENTRY_DSN not configured');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'production',
        release: process.env.APP_VERSION || '2.0.0',

        // Performance monitoring
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,

        // Integrations
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new SentryTracing.Integrations.Express({ app }),
            new SentryTracing.Integrations.Mongo({
                useMongoose: true,
            }),
        ],

        // Filter sensitive data
        beforeSend(event) {
            // Remove sensitive request data
            if (event.request) {
                delete event.request.cookies;
                delete event.request.headers?.authorization;
            }

            // Remove sensitive user data
            if (event.user) {
                delete event.user.password;
                delete event.user.email;
            }

            return event;
        },

        // Ignore certain errors
        ignoreErrors: [
            'Network request failed',
            'Failed to fetch',
            'ECONNRESET',
            'ETIMEDOUT',
        ],
    });

    // Request handler (must be first middleware)
    app.use(Sentry.Handlers.requestHandler());

    // Tracing handler
    app.use(Sentry.Handlers.tracingHandler());

    console.log('✓ Sentry monitoring initialized');
}

/**
 * Error handler middleware (must be last)
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
        // Only send 5xx errors to Sentry
        return error.status >= 500;
    },
});

/**
 * Log critical errors
 */
export function logCriticalError(error, context = {}) {
    console.error('CRITICAL ERROR:', error);

    if (process.env.NODE_ENV === 'production') {
        Sentry.captureException(error, {
            level: 'fatal',
            tags: { critical: true },
            extra: context,
        });
    }
}

/**
 * Log ML service failures
 */
export function logMLFailure(error, audioMetadata = {}) {
    console.error('ML Service Failure:', error);

    if (process.env.NODE_ENV === 'production') {
        Sentry.captureException(error, {
            level: 'error',
            tags: {
                service: 'ml',
                category: 'prediction_failure',
            },
            extra: {
                audioMetadata,
                timestamp: new Date().toISOString(),
            },
        });
    }
}

/**
 * Log security events
 */
export function logSecurityEvent(eventType, details = {}) {
    console.warn(`Security Event [${eventType}]:`, details);

    if (process.env.NODE_ENV === 'production') {
        Sentry.captureMessage(`Security: ${eventType}`, {
            level: 'warning',
            tags: {
                security: true,
                event_type: eventType,
            },
            extra: details,
        });
    }
}

/**
 * Add request tracing ID
 */
export function addTracingMiddleware(req, res, next) {
    req.traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Trace-ID', req.traceId);
    next();
}

/**
 * Performance monitoring
 */
export function trackPerformance(operationName, duration, metadata = {}) {
    if (process.env.NODE_ENV === 'production') {
        Sentry.addBreadcrumb({
            category: 'performance',
            message: `${operationName} completed`,
            level: 'info',
            data: {
                duration,
                ...metadata,
            },
        });
    }

    // Log slow operations
    if (duration > 5000) {
        console.warn(`Slow operation detected: ${operationName} took ${duration}ms`);
    }
}

export default {
    initMonitoring,
    sentryErrorHandler,
    logCriticalError,
    logMLFailure,
    logSecurityEvent,
    addTracingMiddleware,
    trackPerformance,
};
