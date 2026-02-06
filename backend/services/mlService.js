/**
 * ML Service Client (MOCKED)
 * Replaces actual ML service with safe, static responses.
 */

/**
 * Mock analyze audio function
 */
export async function analyzeAudio(audioFilePath, userId) {
    // Return a safe "Healthy" prediction immediately
    return {
        prediction: {
            condition: "Healthy (Mock)",
            severity: "None",
            confidence: 0.99,
            probability: { "healthy": 0.99, "parkinson": 0.01 },
            symptoms: [],
            recommendations: ["System is operating in ML-free mode."]
        },
        features: {
            "mock_feature_1": 0.0,
            "mock_feature_2": 0.0
        },
        confidence: 0.99,
        condition: "Healthy (Mock)",
        severity: "None"
    };
}

/**
 * Mock feature extraction
 */
export async function extractFeatures(audioFilePath) {
    return {
        "mock_feature_1": 0.0,
        "mock_feature_2": 0.0
    };
}

/**
 * Mock prediction from features
 */
export async function predictFromFeatures(features) {
    return {
        condition: "Healthy (Mock)",
        severity: "None",
        confidence: 0.99,
        probability: { "healthy": 0.99, "parkinson": 0.01 },
        symptoms: [],
        recommendations: ["System is operating in ML-free mode."]
    };
}

/**
 * Mock service health check
 */
export async function checkMLServiceHealth() {
    return {
        available: true,
        modelLoaded: true, // Pretend model is loaded
        version: "0.0.0-mock"
    };
}

/**
 * Mock training (should not be called, but safe mock)
 */
export async function trainModel() {
    return {
        success: true,
        message: "Training disabled in ML-free mode"
    };
}

export default {
    analyzeAudio,
    extractFeatures,
    predictFromFeatures,
    checkMLServiceHealth,
    trainModel
};
