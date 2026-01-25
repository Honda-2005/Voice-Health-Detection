import fetch from 'node-fetch';
import logger from './logger.js';
import { downloadFromGridFS } from './gridfs.js';

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:5001').replace(/\/$/, '');
const ML_TIMEOUT = parseInt(process.env.ML_TIMEOUT) || 30000; // 30 seconds

/**
 * ML Service Client
 * Handles communication between Node.js backend and Python ML service
 */

/**
 * Check ML service health
 */
export const checkMLServiceHealth = async () => {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/ml/health`, {
            method: 'GET',
            timeout: 5000
        });

        if (!response.ok) {
            throw new Error(`ML service health check failed: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            data
        };
    } catch (error) {
        logger.error('ML service health check failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Extract features from audio file
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Promise<Object>} - Extracted features
 */
export const extractFeatures = async (audioBuffer) => {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/ml/extract-features`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: audioBuffer,
            timeout: ML_TIMEOUT
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Feature extraction failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Feature extraction failed');
        }

        return {
            success: true,
            features: data.features
        };
    } catch (error) {
        logger.error('Feature extraction error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get prediction from ML model
 * @param {Object} features - Extracted audio features
 * @returns {Promise<Object>} - Prediction results
 */
export const getPrediction = async (features) => {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/ml/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ features }),
            timeout: ML_TIMEOUT
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Prediction failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Prediction failed');
        }

        return {
            success: true,
            prediction: data.prediction
        };
    } catch (error) {
        logger.error('Prediction error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Complete analysis: Extract features + Predict
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Object>} - Complete analysis results
 */
export const analyzeAudio = async (fileId) => {
    try {
        logger.info(`Starting ML analysis for file: ${fileId}`);

        // Step 1: Download audio from GridFS
        logger.info('Downloading audio from GridFS...');
        const audioBuffer = await downloadFromGridFS(fileId);

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error('Failed to download audio file');
        }

        logger.info(`Audio downloaded: ${audioBuffer.length} bytes`);

        // Step 2: Extract features
        logger.info('Extracting features...');
        const featuresResult = await extractFeatures(audioBuffer);

        if (!featuresResult.success) {
            throw new Error(`Feature extraction failed: ${featuresResult.error}`);
        }

        logger.info('Features extracted successfully');

        // Step 3: Get prediction
        logger.info('Getting prediction from ML model...');
        const predictionResult = await getPrediction(featuresResult.features);

        if (!predictionResult.success) {
            throw new Error(`Prediction failed: ${predictionResult.error}`);
        }

        logger.info('Prediction completed successfully');

        // Return complete results
        return {
            success: true,
            features: featuresResult.features,
            prediction: predictionResult.prediction
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
 * @param {Buffer} audioBuffer - Audio file buffer
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeAudioDirect = async (audioBuffer) => {
    try {
        const response = await fetch(`${ML_SERVICE_URL}/ml/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: audioBuffer,
            timeout: ML_TIMEOUT
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Analysis failed');
        }

        return {
            success: true,
            features: data.features,
            prediction: data.prediction
        };
    } catch (error) {
        logger.error('Direct analysis error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export default {
    checkMLServiceHealth,
    extractFeatures,
    getPrediction,
    analyzeAudio,
    analyzeAudioDirect
};
