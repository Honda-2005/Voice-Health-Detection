/**
 * ML Service Client
 * Handles communication between Node.js backend and Python ML service
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import logger from './logger.js';

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:5001').replace(/\/$/, '');
const ML_SERVICE_TIMEOUT = parseInt(process.env.ML_SERVICE_TIMEOUT || '30000');

/**
 * Check ML service health
 */
export const checkMLServiceHealth = async () => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, {
            timeout: 5000
        });

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        logger.error('ML service health check failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Extract features from audio file
 * @param {string} audioFilePath - Path to audio file on disk
 */
export const extractFeatures = async (audioFilePath) => {
    try {
        logger.info(`Extracting features from: ${audioFilePath}`);

        // Create form data with audio file
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioFilePath));

        const response = await axios.post(
            `${ML_SERVICE_URL}/extract-features`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: ML_SERVICE_TIMEOUT
            }
        );

        if (response.data.success) {
            logger.info('Feature extraction successful');
            return {
                success: true,
                features: response.data.features
            };
        } else {
            throw new Error(response.data.error || 'Feature extraction failed');
        }
    } catch (error) {
        logger.error('Feature extraction error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get prediction from ML model
 * @param {Object} features - Feature dictionary
 */
export const getPrediction = async (features) => {
    try {
        logger.info('Getting prediction from features');

        const response = await axios.post(
            `${ML_SERVICE_URL}/predict`,
            { features },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: ML_SERVICE_TIMEOUT
            }
        );

        if (response.data.success) {
            logger.info('Prediction successful');
            return {
                success: true,
                prediction: response.data.prediction
            };
        } else {
            throw new Error(response.data.error || 'Prediction failed');
        }
    } catch (error) {
        logger.error('Prediction error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Complete analysis: Extract features + Predict
 * @param {string} audioFilePath - Path to audio file on disk
 */
export const analyzeAudio = async (audioFilePath) => {
    try {
        logger.info(`Starting ML analysis for file: ${audioFilePath}`);

        // Create form data with audio file
        const formData = new FormData();
        formData.append('file', fs.createReadStream(audioFilePath));

        const response = await axios.post(
            `${ML_SERVICE_URL}/analyze`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: ML_SERVICE_TIMEOUT
            }
        );

        if (response.data.success) {
            logger.info('ML analysis successful');
            return {
                success: true,
                features: response.data.features,
                prediction: response.data.prediction
            };
        } else {
            throw new Error(response.data.error || 'Analysis failed');
        }
    } catch (error) {
        logger.error('ML analysis error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Analyze audio with direct endpoint (complete pipeline)
 * Alias for analyzeAudio for backwards compatibility
 */
export const analyzeAudioDirect = analyzeAudio;

export default {
    checkMLServiceHealth,
    extractFeatures,
    getPrediction,
    analyzeAudio,
    analyzeAudioDirect
};
