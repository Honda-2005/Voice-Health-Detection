/**
 * Redis Caching Utility
 * Provides caching for predictions and frequently accessed data
 */

import Redis from 'ioredis';

const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});

// Redis connection events
redisClient.on('connect', () => {
    console.log('✓ Redis connected');
});

redisClient.on('error', (error) => {
    console.error('✗ Redis error:', error.message);
});

redisClient.on('ready', () => {
    console.log('✓ Redis ready');
});

/**
 * Generate cache key from audio file hash
 */
export function generateCacheKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
}

/**
 * Cache prediction result by audio hash
 */
export async function cachePrediction(audioHash, prediction, ttl = 3600) {
    try {
        const key = generateCacheKey('prediction', audioHash);
        await redisClient.setex(key, ttl, JSON.stringify(prediction));
        console.log(`Cached prediction: ${key}`);
        return true;
    } catch (error) {
        console.error('Cache write error:', error);
        return false;
    }
}

/**
 * Get cached prediction
 */
export async function getCachedPrediction(audioHash) {
    try {
        const key = generateCacheKey('prediction', audioHash);
        const cached = await redisClient.get(key);

        if (cached) {
            console.log(`Cache hit: ${key}`);
            return JSON.parse(cached);
        }

        console.log(`Cache miss: ${key}`);
        return null;
    } catch (error) {
        console.error('Cache read error:', error);
        return null;
    }
}

/**
 * Cache user session data
 */
export async function cacheUserSession(userId, sessionData, ttl = 1800) {
    try {
        const key = generateCacheKey('session', userId);
        await redisClient.setex(key, ttl, JSON.stringify(sessionData));
        return true;
    } catch (error) {
        console.error('Session cache error:', error);
        return false;
    }
}

/**
 * Get cached user session
 */
export async function getCachedUserSession(userId) {
    try {
        const key = generateCacheKey('session', userId);
        const cached = await redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error('Session read error:', error);
        return null;
    }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern) {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
            console.log(`Invalidated ${keys.length} cache entries matching: ${pattern}`);
        }
        return keys.length;
    } catch (error) {
        console.error('Cache invalidation error:', error);
        return 0;
    }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(key) {
    try {
        const exists = await redisClient.exists(key);
        return exists === 1;
    } catch (error) {
        console.error('Cache exists check error:', error);
        return false;
    }
}

/**
 * Set cache with automatic expiration
 */
export async function setCache(key, value, ttl = 3600) {
    try {
        await redisClient.setex(key, ttl, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Cache set error:', error);
        return false;
    }
}

/**
 * Get cache value
 */
export async function getCache(key) {
    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}

/**
 * Delete cache entry
 */
export async function deleteCache(key) {
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('Cache delete error:', error);
        return false;
    }
}

/**
 * Increment counter (for rate limiting, stats, etc.)
 */
export async function incrementCounter(key, ttl = null) {
    try {
        const value = await redisClient.incr(key);
        if (ttl && value === 1) {
            await redisClient.expire(key, ttl);
        }
        return value;
    } catch (error) {
        console.error('Counter increment error:', error);
        return 0;
    }
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
    await redisClient.quit();
    console.log('Redis connection closed');
}

export { redisClient };

export default {
    cachePrediction,
    getCachedPrediction,
    cacheUserSession,
    getCachedUserSession,
    invalidateCache,
    cacheExists,
    setCache,
    getCache,
    deleteCache,
    incrementCounter,
    generateCacheKey,
    closeRedis,
    redisClient,
};
