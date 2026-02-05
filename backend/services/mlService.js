/**
 * ML Service Client
 * Centralizes all ML service communication
 * Provides retry logic, timeout handling, and error normalization
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { getConfig } from '../utils/configValidator.js';

const config = getConfig();
const ML_SERVICE_URL = config.ml.serviceUrl;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

/**
 * Call ML service with retry logic
 */
async function callMLService(endpoint, data, retries = MAX_RETRIES) {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, data, {
            timeout: REQUEST_TIMEOUT,
            headers: data instanceof FormData ? data.getHeaders() : { 'Content-Type': 'application/json' }
        });

        return response.data;
    } catch (error) {
        // Handle specific error cases
        if (error.response) {
            // Server responded with error
            if (error.response.status === 503) {
                throw new Error('ML_SERVICE_UNAVAILABLE');
            }

            const errorData = error.response.data;
            if (errorData.error === 'MODEL_UNAVAILABLE') {
                throw new Error('MODEL_NOT_LOADED');
            }

            throw new Error(errorData.message || 'ML service error');
        }

        if (error.code === 'ECONNREFUSED') {
            throw new Error('ML_SERVICE_OFFLINE');
        }

        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            if (retries > 0) {
                console.log(`ML service timeout, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                return callMLService(endpoint, data, retries - 1);
            }
            throw new Error('ML_SERVICE_TIMEOUT');
        }

        throw error;
    }
}

/**
 * Analyze audio file and get prediction
 */
export async function analyzeFeedAudio(audioFilePath, userId) {
    try {
        // Validate file exists
        if (!fs.existsSync(audioFilePath)) {
            throw new Error('Audio file not found');
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioFilePath));
        formData.append('userId', userId);

        // Call ML service
        const result = await callMLService('/ml/analyze', formData);

        if (!result.success) {
            throw new Error(result.error || 'ML analysis failed');
        }

        return {
            prediction: result.prediction,
            features: result.features,
            confidence: result.prediction.confidence,
            condition: result.prediction.condition,
            severity: result.prediction.severity
        };
    } catch (error) {
        console.error('ML analysis error:', error.message);

        // Normalize error messages for frontend
        if (error.message === 'MODEL_NOT_LOADED') {
            throw new Error('Our AI model is currently updating. Please try again in a moment.');
        }

        if (error.message === 'ML_SERVICE_OFFLINE') {
            throw new Error('AI analysis service is temporarily unavailable. Please try again later.');
        }

        if (error.message === 'ML_SERVICE_TIMEOUT') {
            throw new Error('Analysis is taking too long. Please try with a shorter audio file.');
        }

        if (error.message.includes('Audio validation failed') || error.message.includes('too short') || error.message.includes('silent')) {
            throw error; // Pass validation errors as-is
        }

        throw new Error('AI analysis failed. Please try again.');
    }
}

/**
 * Extract features from audio
 */
export async function extractFeatures(audioFilePath) {
    try {
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioFilePath));

        const result = await callMLService('/ml/features', formData);

        if (!result.success) {
            throw new Error(result.error || 'Feature extraction failed');
        }

        return result.features;
    } catch (error) {
        console.error('Feature extraction error:', error.message);
        throw error;
    }
}

/**
 * Make prediction from pre-extracted features
 */
export async function predictFromFeatures(features) {
    try {
        const result = await callMLService('/ml/predict', { features });

        if (!result.success) {
            throw new Error(result.error || 'Prediction failed');
        }

        return result.prediction;
    } catch (error) {
        console.error('Prediction error:', error.message);
        throw error;
    }
}

/**
 * Check ML service health
 */
export async function checkMLServiceHealth() {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, {
            timeout: 5000
        });

        return {
            available: true,
            modelLoaded: response.data.model_loaded || false,
            version: response.data.version
        };
    } catch (error) {
        return {
            available: false,
            modelLoaded: false,
            error: error.message
        };
    }
}

/**
 * Train ML model (admin only)
 */
export async function trainModel() {
    try {
        const result = await callMLService('/ml/train', {}, 1); // No retries for training

        if (!result.success) {
            throw new Error(result.error || 'Model training failed');
        }

        return result;
    } catch (error) {
        console.error('Model training error:', error.message);
        throw error;
    }
}

export default {
    analyzeAudio,
    extractFeatures,
    predictFromFeatures,
    checkMLServiceHealth,
    trainModel
};
