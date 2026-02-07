/**
 * ML Service
 * Business logic for ML operations
 */

import * as mlClient from '../utils/mlClient.js';
import logger from '../utils/logger.js';

/**
 * Analyze audio file and get prediction
 * @param {string} audioFilePath - Path to audio file
 * @param {string} userId - User ID for logging
 */
export async function analyzeAudio(audioFilePath, userId) {
    try {
        logger.info(`Analyzing audio for user ${userId}: ${audioFilePath}`);

        // Call ML service
        const result = await mlClient.analyzeAudio(audioFilePath);

        if (!result.success) {
            throw new Error(result.error || 'ML analysis failed');
        }

        // Transform response to match expected format
        return {
            condition: result.prediction.condition,
            severity: result.prediction.severity,
            confidence: result.prediction.confidence,
            probability: result.prediction.probability,
            symptoms: result.prediction.symptoms || [],
            recommendations: result.prediction.recommendations || [],
            features: result.features
        };
    } catch (error) {
        logger.error(`ML analysis failed for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Extract features from audio file
 * @param {string} audioFilePath - Path to audio file
 */
export async function extractFeatures(audioFilePath) {
    try {
        const result = await mlClient.extractFeatures(audioFilePath);

        if (!result.success) {
            throw new Error(result.error || 'Feature extraction failed');
        }

        return result.features;
    } catch (error) {
        logger.error('Feature extraction failed:', error);
        throw error;
    }
}

/**
 * Get prediction from features
 * @param {Object} features - Feature dictionary
 */
export async function predictFromFeatures(features) {
    try {
        const result = await mlClient.getPrediction(features);

        if (!result.success) {
            throw new Error(result.error || 'Prediction failed');
        }

        return result.prediction;
    } catch (error) {
        logger.error('Prediction failed:', error);
        throw error;
    }
}

/**
 * Check ML service health
 */
export async function checkMLServiceHealth() {
    try {
        const result = await mlClient.checkMLServiceHealth();

        if (!result.success) {
            return {
                available: false,
                modelLoaded: false,
                version: 'unknown',
                error: result.error
            };
        }

        return {
            available: true,
            modelLoaded: result.data.model_loaded,
            version: result.data.version
        };
    } catch (error) {
        logger.error('ML service health check failed:', error);
        return {
            available: false,
            modelLoaded: false,
            version: 'unknown',
            error: error.message
        };
    }
}

/**
 * Mock training (not implemented)
 */
export async function trainModel() {
    return {
        success: false,
        message: 'Training not available via API'
    };
}

export default {
    analyzeAudio,
    extractFeatures,
    predictFromFeatures,
    checkMLServiceHealth,
    trainModel
};
