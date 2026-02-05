/**
 * Prediction Service
 * Centralizes all prediction business logic
 * Fixes N+1 query problem and extracts async processing logic
 */

import Prediction from '../models/Prediction.js';
import Recording from '../models/Recording.js';
import { analyzeAudio } from './mlService.js';
import { io } from '../../server.js';

/**
 * Get user predictions with optimized queries (fixes N+1 problem)
 */
export async function getUserPredictions(userId, { page = 1, limit = 10, condition = null }) {
    try {
        const skip = (page - 1) * limit;

        // Build query
        const query = { userId };
        if (condition) {
            query['result.condition'] = condition;
        }

        // FIXED: Use aggregation instead of populate to avoid N+1 queries
        const predictions = await Prediction.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'recordings', // MongoDB collection name
                    localField: 'recordingId',
                    foreignField: '_id',
                    as: 'recording'
                }
            },
            {
                $unwind: {
                    path: '$recording',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    result: 1,
                    status: 1,
                    confidence: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'recording._id': 1,
                    'recording.filename': 1,
                    'recording.filesize': 1,
                    'recording.duration': 1,
                    'recording.uploadDate': 1
                }
            }
        ]);

        // Get total count
        const total = await Prediction.countDocuments(query);

        return {
            predictions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error fetching predictions:', error);
        throw error;
    }
}

/**
 * Get single prediction by ID with recording data
 */
export async function getPredictionById(predictionId, userId) {
    try {
        const prediction = await Prediction.findOne({
            _id: predictionId,
            userId
        });

        if (!prediction) {
            throw new Error('PREDICTION_NOT_FOUND');
        }

        // Fetch recording if exists
        if (prediction.recordingId) {
            const recording = await Recording.findById(prediction.recordingId);
            return {
                ...prediction.toObject(),
                recording
            };
        }

        return prediction;
    } catch (error) {
        throw error;
    }
}

/**
 * Create prediction and queue analysis
 * This separates the HTTP request from the async ML processing
 */
export async function createPredictionJob(recordingId, userId) {
    try {
        // Verify recording exists and belongs to user
        const recording = await Recording.findOne({
            _id: recordingId,
            userId
        });

        if (!recording) {
            throw new Error('RECORDING_NOT_FOUND');
        }

        // Create prediction record with 'pending' status
        const prediction = new Prediction({
            userId,
            recordingId: recording._id,
            status: 'pending',
            result: {},
            createdAt: new Date()
        });

        await prediction.save();

        // Return immediately - processing happens async
        return {
            predictionId: prediction._id,
            status: 'pending',
            message: 'Analysis queued successfully'
        };
    } catch (error) {
        throw error;
    }
}

/**
 * Process prediction analysis (async worker function)
 * This should be called by a job queue in production
 */
export async function processPredictionAnalysis(predictionId) {
    try {
        // Get prediction
        const prediction = await Prediction.findById(predictionId);

        if (!prediction) {
            throw new Error('PREDICTION_NOT_FOUND');
        }

        // Update status to processing
        prediction.status = 'processing';
        await prediction.save();

        // Emit status update via WebSocket
        emitPredictionUpdate(prediction.userId, predictionId, 'processing');

        // Get recording
        const recording = await Recording.findById(prediction.recordingId);

        if (!recording) {
            throw new Error('RECORDING_NOT_FOUND');
        }

        // Analyze audio using ML service
        try {
            const analysisResult = await analyzeAudio(recording.filePath, prediction.userId);

            // Update prediction with results
            prediction.status = 'completed';
            prediction.result = {
                condition: analysisResult.condition,
                severity: analysisResult.severity,
                confidence: analysisResult.confidence,
                features: analysisResult.features
            };
            prediction.confidence = analysisResult.confidence;
            prediction.completedAt = new Date();

            await prediction.save();

            // Emit success via WebSocket
            emitPredictionUpdate(prediction.userId, predictionId, 'completed', {
                result: prediction.result
            });

            return prediction;
        } catch (analysisError) {
            // ML analysis failed
            prediction.status = 'failed';
            prediction.error = analysisError.message;
            prediction.completedAt = new Date();

            await prediction.save();

            // Emit failure via WebSocket
            emitPredictionUpdate(prediction.userId, predictionId, 'failed', {
                error: analysisError.message
            });

            throw analysisError;
        }
    } catch (error) {
        console.error('Prediction analysis error:', error);
        throw error;
    }
}

/**
 * Get prediction statistics for user
 */
export async function getUserPredictionStats(userId) {
    try {
        const stats = await Prediction.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: '$result.condition',
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence' }
                }
            }
        ]);

        // Get total count
        const total = await Prediction.countDocuments({ userId });

        // Format stats
        const formattedStats = {
            total,
            byCondition: {},
            latestPrediction: null
        };

        stats.forEach(stat => {
            formattedStats.byCondition[stat._id || 'unknown'] = {
                count: stat.count,
                avgConfidence: stat.avgConfidence
            };
        });

        // Get latest prediction
        const latest = await Prediction.findOne({ userId })
            .sort({ createdAt: -1 })
            .limit(1);

        if (latest) {
            formattedStats.latestPrediction = latest;
        }

        return formattedStats;
    } catch (error) {
        console.error('Error fetching prediction stats:', error);
        throw error;
    }
}

/**
 * Helper: Emit WebSocket update for prediction
 */
function emitPredictionUpdate(userId, predictionId, status, data = {}) {
    try {
        io.to(`user:${userId}`).emit('prediction:update', {
            predictionId,
            status,
            timestamp: new Date().toISOString(),
            ...data
        });
    } catch (error) {
        console.error('WebSocket emission error:', error);
    }
}

export default {
    getUserPredictions,
    getPredictionById,
    createPredictionJob,
    processPredictionAnalysis,
    getUserPredictionStats
};
