"""
ML Model Evaluation Script
Evaluate trained model performance on test data
"""

import os
import sys
import pickle
import json
from pathlib import Path
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score, roc_curve
)
import matplotlib.pyplot as plt

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from ml_training.preprocessing import preprocessor


def evaluate_model():
    """
    Load trained model and evaluate on test set
    """
    print("=" * 60)
    print("VOICE HEALTH DETECTION - MODEL EVALUATION")
    print("=" * 60)
    print()
    
    # Define paths
    models_dir = Path(__file__).parent.parent / 'models'
    model_path = models_dir / 'parkinson_voice_model.pkl'
    scaler_path = models_dir / 'scaler.pkl'
    metrics_path = models_dir / 'evaluation_metrics.json'
    
    # Check if model exists
    if not model_path.exists():
        print(f"ERROR: Model not found at {model_path}")
        print("Please run training first: python -m ml_training.dataset.train")
        return
    
    # Load model
    print(f"Loading model from {model_path}...")
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    print(f"Loading scaler from {scaler_path}...")
    preprocessor.load_scaler(str(scaler_path))
    print()
    
    # Load dataset
    print("Loading dataset...")
    X, y = preprocessor.load_parkinsons_dataset()
    print(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")
    print()
    
    # Prepare data
    print("Preparing test data...")
    X_train, X_test, y_train, y_test = preprocessor.prepare_data(X, y)
    print(f"Test set: {X_test.shape[0]} samples")
    print()
    
    # Make predictions
    print("Making predictions...")
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
    print()
    
    # Calculate metrics
    print("Calculating metrics...")
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='binary', zero_division=0)
    recall = recall_score(y_test, y_pred, average='binary', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='binary', zero_division=0)
    
    print("=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    
    if y_pred_proba is not None:
        auc = roc_auc_score(y_test, y_pred_proba)
        print(f"AUC:       {auc:.4f}")
    
    print()
    
    # Confusion Matrix
    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"                Predicted")
    print(f"              Healthy  Parkinson's")
    print(f"Actual Healthy    {cm[0,0]:4d}      {cm[0,1]:4d}")
    print(f"       Parkinson's {cm[1,0]:4d}      {cm[1,1]:4d}")
    print()
    
    # Classification Report
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=['Healthy', 'Parkinson\'s']))
    print()
    
    # Save updated metrics
    metrics = {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1_score': float(f1),
        'confusion_matrix': cm.tolist(),
        'n_test_samples': int(X_test.shape[0]),
        'n_features': int(X_test.shape[1])
    }
    
    if y_pred_proba is not None:
        metrics['auc'] = float(auc)
    
    print(f"Saving metrics to {metrics_path}...")
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print()
    print("=" * 60)
    print("EVALUATION COMPLETE!")
    print("=" * 60)
    print(f"Metrics saved to: {metrics_path}")
    print()
    
    return metrics


if __name__ == '__main__':
    evaluate_model()
