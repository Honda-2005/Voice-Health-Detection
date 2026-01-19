"""
ML Model Training Script
Train a classifier for Parkinson's Disease detection from voice features
"""

import os
import sys
import pickle
import json
from pathlib import Path
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ml_training.preprocessing import preprocessor


def train_model(model_type='random_forest'):
    """
    Train a machine learning model for Parkinson's detection
    
    Args:
        model_type: Type of model to train ('random_forest' or 'logistic_regression')
    """
    print("=" * 60)
    print("VOICE HEALTH DETECTION - MODEL TRAINING")
    print("=" * 60)
    print()
    
    # Load dataset
    print("Loading dataset...")
    X, y = preprocessor.load_parkinsons_dataset()
    print(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"Class distribution: {dict(y.value_counts())}")
    print()
    
    # Prepare data (split and normalize)
    print("Preparing data (split and normalization)...")
    X_train, X_test, y_train, y_test = preprocessor.prepare_data(X, y)
    print(f"Training set: {X_train.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    print()
    
    # Initialize model
    print(f"Initializing {model_type} model...")
    if model_type == 'random_forest':
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
    elif model_type == 'logistic_regression':
        model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            solver='lbfgs'
        )
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    # Train model
    print("Training model...")
    model.fit(X_train, y_train)
    print("Training complete!")
    print()
    
    # Evaluate on training set
    print("Evaluating on training set...")
    y_train_pred = model.predict(X_train)
    train_accuracy = accuracy_score(y_train, y_train_pred)
    print(f"Training Accuracy: {train_accuracy:.4f}")
    print()
    
    # Evaluate on test set
    print("Evaluating on test set...")
    y_test_pred = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    test_precision = precision_score(y_test, y_test_pred, average='binary', zero_division=0)
    test_recall = recall_score(y_test, y_test_pred, average='binary', zero_division=0)
    test_f1 = f1_score(y_test, y_test_pred, average='binary', zero_division=0)
    
    print(f"Test Accuracy:  {test_accuracy:.4f}")
    print(f"Test Precision: {test_precision:.4f}")
    print(f"Test Recall:    {test_recall:.4f}")
    print(f"Test F1 Score:  {test_f1:.4f}")
    print()
    
    print("Classification Report:")
    print(classification_report(y_test, y_test_pred, target_names=['Healthy', 'Parkinson\'s']))
    print()
    
    # Save model
    models_dir = Path(__file__).parent.parent / 'models'
    models_dir.mkdir(exist_ok=True)
    
    model_path = models_dir / 'parkinson_voice_model.pkl'
    scaler_path = models_dir / 'scaler.pkl'
    metrics_path = models_dir / 'evaluation_metrics.json'
    
    print(f"Saving model to {model_path}...")
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Saving scaler to {scaler_path}...")
    preprocessor.save_scaler(str(scaler_path))
    
    # Save metrics
    metrics = {
        'model_type': model_type,
        'accuracy': float(test_accuracy),
        'precision': float(test_precision),
        'recall': float(test_recall),
        'f1_score': float(test_f1),
        'train_accuracy': float(train_accuracy),
        'n_train_samples': int(X_train.shape[0]),
        'n_test_samples': int(X_test.shape[0]),
        'n_features': int(X_train.shape[1])
    }
    
    print(f"Saving metrics to {metrics_path}...")
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print()
    print("=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    print(f"Model saved to: {model_path}")
    print(f"Scaler saved to: {scaler_path}")
    print(f"Metrics saved to: {metrics_path}")
    print()
    
    return model, preprocessor.scaler, metrics


if __name__ == '__main__':
    # Train Random Forest model (default)
    model_type = sys.argv[1] if len(sys.argv) > 1 else 'random_forest'
    train_model(model_type)
