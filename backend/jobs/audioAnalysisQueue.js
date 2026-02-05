/**
 * Job Queue Configuration using BullMQ
 * Handles async audio analysis to prevent blocking HTTP requests
 */

import { Queue, Worker } from 'bullmq';
import { processPredictionAnalysis } from '../services/predictionService.js';
import { getConfig } from '../utils/configValidator.js';

const config = getConfig();

// Redis connection configuration
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    maxRetriesPerRequest: null,
};

// Create analysis queue
export const analysisQueue = new Queue('audio-analysis', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
});

// Create worker to process analysis jobs
export const analysisWorker = new Worker(
    'audio-analysis',
    async (job) => {
        const { predictionId } = job.data;

        console.log(`Processing analysis job ${job.id} for prediction ${predictionId}`);

        try {
            // Process the prediction using service layer
            const result = await processPredictionAnalysis(predictionId);

            console.log(`✓ Analysis completed for prediction ${predictionId}`);

            return {
                success: true,
                predictionId,
                result: result.result
            };
        } catch (error) {
            console.error(`✗ Analysis failed for prediction ${predictionId}:`, error.message);
            throw error; // Will trigger retry
        }
    },
    {
        connection: redisConnection,
        concurrency: 3, // Process up to 3 jobs concurrently
        limiter: {
            max: 10, // Max 10 jobs
            duration: 60000, // per minute
        },
    }
);

// Worker event handlers
analysisWorker.on('completed', (job, result) => {
    console.log(`✓ Job ${job.id} completed:`, result.predictionId);
});

analysisWorker.on('failed', (job, error) => {
    console.error(`✗ Job ${job.id} failed:`, error.message);
});

analysisWorker.on('error', (error) => {
    console.error('Worker error:', error);
});

// Queue event handlers
analysisQueue.on('error', (error) => {
    console.error('Queue error:', error);
});

/**
 * Add audio analysis job to queue
 */
export async function queueAnalysisJob(predictionId, priority = 0) {
    try {
        const job = await analysisQueue.add(
            'analyze',
            { predictionId },
            {
                priority, // Higher number = higher priority
                jobId: `analysis-${predictionId}`, // Unique job ID prevents duplicates
            }
        );

        console.log(`Queued analysis job ${job.id} for prediction ${predictionId}`);

        return {
            jobId: job.id,
            predictionId,
            status: 'queued'
        };
    } catch (error) {
        console.error('Error queuing analysis job:', error);
        throw error;
    }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId) {
    try {
        const job = await analysisQueue.getJob(jobId);

        if (!job) {
            return { found: false };
        }

        const state = await job.getState();
        const progress = job.progress;

        return {
            found: true,
            jobId: job.id,
            state,
            progress,
            data: job.data,
            returnvalue: job.returnvalue,
            failedReason: job.failedReason,
        };
    } catch (error) {
        console.error('Error getting job status:', error);
        throw error;
    }
}

/**
 * Graceful shutdown
 */
export async function closeQueue() {
    await analysisWorker.close();
    await analysisQueue.close();
    console.log('Analysis queue and worker closed');
}

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing queue...');
    await closeQueue();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, closing queue...');
    await closeQueue();
    process.exit(0);
});

export default {
    analysisQueue,
    analysisWorker,
    queueAnalysisJob,
    getJobStatus,
    closeQueue,
};
