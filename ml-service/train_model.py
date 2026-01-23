"""
ML Model Training Script
Trains Random Forest classifier for voice health detection
"""

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MODEL_PATH = './ml-service/models/model.joblib'
SCALER_PATH = './ml-service/models/scaler.joblib'
TEST_SIZE = 0.2
RANDOM_STATE = 42

def generate_synthetic_data(n_samples=1000):
    """
    Generate synthetic training data for demonstration
    In production, use real labeled voice data
    """
    logger.info(f'Generating {n_samples} synthetic samples...')
    
    # Feature dimensions (11 features based on our extraction)
    n_features = 11
    
    # Generate features
    X = np.random.randn(n_samples, n_features)
    
    # Generate labels with some patterns
    y = np.zeros(n_samples, dtype=int)
    
    # Healthy samples (class 0)
    healthy_idx = np.arange(0, n_samples // 3)
    X[healthy_idx, 0] = np.abs(X[healthy_idx, 0])  # Higher pitch
    X[healthy_idx, 1] = np.abs(X[healthy_idx, 1])  # Higher energy
    
    # Parkinsons samples (class 1)
    parkinsons_idx = np.arange(n_samples // 3, 2 * n_samples // 3)
    y[parkinsons_idx] = 1
    X[parkinsons_idx, 0] = X[parkinsons_idx, 0] - 1  # Lower pitch
    X[parkinsons_idx, 2] = np.abs(X[parkinsons_idx, 2])  # Higher tremor (ZCR)
    
    # Other conditions (class 2)
    other_idx = np.arange(2 * n_samples // 3, n_samples)
    y[other_idx] = 2
    X[other_idx, 3] = np.abs(X[other_idx, 3])  # Different spectral centroid
    
    return X, y

def train_model():
    """Train and save the model"""
    try:
        # Create models directory if it doesn't exist
        os.makedirs('./ml-service/models', exist_ok=True)
        
        # Generate synthetic data
        X, y = generate_synthetic_data(n_samples=2000)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        logger.info('Training Random Forest model...')
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
        
        model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        logger.info(f'Model Accuracy: {accuracy:.4f}')
        logger.info('\nClassification Report:')
        logger.info(classification_report(y_test, y_pred, 
                                         target_names=['Healthy', 'Parkinsons', 'Other']))
        logger.info('\nConfusion Matrix:')
        logger.info(confusion_matrix(y_test, y_pred))
        
        # Save model
        joblib.dump(model, MODEL_PATH)
        logger.info(f'Model saved to {MODEL_PATH}')
        
        # Save scaler
        joblib.dump(scaler, SCALER_PATH)
        logger.info(f'Scaler saved to {SCALER_PATH}')
        
        return model, scaler
    
    except Exception as e:
        logger.error(f'Model training failed: {str(e)}')
        raise

if __name__ == '__main__':
    train_model()
