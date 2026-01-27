import fetch from 'node-fetch';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

export const callMLService = async (endpoint, data, method = 'POST') => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`ML Service error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ML Service call error:', error);
    throw error;
  }
};

export const extractFeatures = async (audioBuffer) => {
  return callMLService('ml/extract-features', {
    audio: audioBuffer.toString('base64'),
  });
};

export const makePrediction = async (features) => {
  return callMLService('ml/predict', { features });
};

export const healthCheck = async () => {
  try {
    return await callMLService('ml/health', {}, 'GET');
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
};
