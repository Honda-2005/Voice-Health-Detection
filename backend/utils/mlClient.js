import logger from './logger.js';

/**
 * ML Service Client (MOCKED)
 * Handles communication between Node.js backend and Python ML service
 * REFACTORED: Now completely mocked to remove ML dependency
 */

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:5001').replace(/\/$/, '');

/**
 * Check ML service health
 */
export const checkMLServiceHealth = async () => {
    return {
        success: true,
        data: {
            status: "healthy",
            model_loaded: true,
            version: "0.0.0-mock"
        }
    };
};

/**
 * Extract features from audio file
 */
export const extractFeatures = async (audioBuffer) => {
    logger.info('Mocking feature extraction...');
    return {
        success: true,
        features: {
            "mock_feature_1": 0.001,
            "mock_feature_2": 0.045
        }
    };
};

/**
 * Get prediction from ML model
 */
export const getPrediction = async (features) => {
    logger.info('Mocking prediction...');
    return {
        success: true,
        prediction: {
            condition: "Healthy (Mock)",
            severity: "None",
            confidence: 0.98,
            probability: {
                "healthy": 0.98,
                "parkinson": 0.02
            },
            symptoms: [],
            recommendations: ["Stay healthy!"]
        }
    };
};

/**
 * Complete analysis: Extract features + Predict
 */
export const analyzeAudio = async (fileId) => {
    try {
        logger.info(`Starting Mock ML analysis for file: ${fileId}`);

        // Return mocked success immediately
        return {
            success: true,
            features: {
                "mock_feature_val": 1.23
            },
            prediction: {
                condition: "Healthy (Mock)",
                severity: "None",
                confidence: 0.99,
                probability: { "healthy": 0.99, "parkinson": 0.01 },
                symptoms: [],
                recommendations: ["System Mocked Response"]
            }
        };

    } catch (error) {
        logger.error('ML analysis error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Analyze audio with direct endpoint (complete pipeline)
 */
export const analyzeAudioDirect = async (audioBuffer) => {
    return {
        success: true,
        features: {},
        prediction: {
            condition: "Healthy (Mock)",
            severity: "None",
            confidence: 0.99
        }
    };
};

export default {
    checkMLServiceHealth,
    extractFeatures,
    getPrediction,
    analyzeAudio,
    analyzeAudioDirect
};
