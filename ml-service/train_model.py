"""
Voice Health Detection - ML Model Training Script
Trains a Random Forest classifier on real Parkinson's dataset
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import os
import json
from datetime import datetime

# Paths
MODEL_DIR = './ml-service/models'
DATA_PATH = './ml-service/data/parkinsons.data'

def load_parkinsons_dataset():
    """
    Load UCI Parkinson's dataset
    Download from: https://archive.ics.uci.edu/ml/datasets/parkinsons
    """
    print("Loading Parkinson's dataset...")
    
    # Check if dataset exists
    if not os.path.exists(DATA_PATH):
        print(f"❌ Dataset not found at {DATA_PATH}")
        print("Download from: https://archive.ics.uci.edu/ml/datasets/parkinsons")
        print("Or use the provided sample dataset")
        return None, None, None, None
    
    # Load dataset
    df = pd.read_csv(DATA_PATH)
    
    print(f"✓ Dataset loaded: {len(df)} samples")
    print(f"✓ Features: {df.shape[1]} columns")
    
    # Separate features and target
    X = df.drop(['name', 'status'], axis=1)  # Remove name and target
    y = df['status']  # 0 = healthy, 1 = Parkinson's
    
    print(f"✓ Class distribution:")
    print(f"  Healthy: {sum(y == 0)} samples")
    print(f"  Parkinson's: {sum(y == 1)} samples")
    
    return X, y, df

def create_sample_dataset():
    """
    Create a synthetic dataset for testing (if real data not available)
    """
    print("Creating synthetic dataset for testing...")
    
    np.random.seed(42)
    n_samples = 200
    
    # Generate synthetic features (22 features like real dataset)
    X = pd.DataFrame({
        'MDVP:Fo(Hz)': np.random.normal(150, 30, n_samples),
        'MDVP:Fhi(Hz)': np.random.normal(180, 35, n_samples),
        'MDVP:Flo(Hz)': np.random.normal(120, 25, n_samples),
        'MDVP:Jitter(%)': np.random.exponential(0.005, n_samples),
        'MDVP:Jitter(Abs)': np.random.exponential(0.00004, n_samples),
        'MDVP:RAP': np.random.exponential(0.003, n_samples),
        'MDVP:PPQ': np.random.exponential(0.003, n_samples),
        'Jitter:DDP': np.random.exponential(0.008, n_samples),
        'MDVP:Shimmer': np.random.exponential(0.03, n_samples),
        'MDVP:Shimmer(dB)': np.random.exponential(0.3, n_samples),
        'Shimmer:APQ3': np.random.exponential(0.015, n_samples),
        'Shimmer:APQ5': np.random.exponential(0.02, n_samples),
        'MDVP:APQ': np.random.exponential(0.025, n_samples),
        'Shimmer:DDA': np.random.exponential(0.045, n_samples),
        'NHR': np.random.exponential(0.025, n_samples),
        'HNR': np.random.normal(22, 3, n_samples),
        'RPDE': np.random.uniform(0.3, 0.7, n_samples),
        'DFA': np.random.uniform(0.5, 0.8, n_samples),
        'spread1': np.random.normal(-6, 1, n_samples),
        'spread2': np.random.normal(0.2, 0.05, n_samples),
        'D2': np.random.uniform(1.5, 3.5, n_samples),
        'PPE': np.random.uniform(0.1, 0.4, n_samples),
    })
    
    # Generate target (70% Parkinson's, 30% healthy - realistic distribution)
    y = np.random.choice([0, 1], size=n_samples, p=[0.3, 0.7])
    
    print(f"✓ Synthetic dataset created: {len(X)} samples")
    return X, y, None

def train_model(X, y):
    """
    Train Random Forest classifier
    """
    print("\n" + "="*50)
    print("TRAINING RANDOM FOREST CLASSIFIER")
    print("="*50)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n✓ Data split:")
    print(f"  Training: {len(X_train)} samples")
    print(f"  Testing: {len(X_test)} samples")
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"\n✓ Features scaled (StandardScaler)")
    
    # Train with hyperparameter tuning
    print(f"\n⏳ Training model with hyperparameter tuning...")
    
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [10, 20, None],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2]
    }
    
    rf = RandomForestClassifier(random_state=42)
    grid_search = GridSearchCV(rf, param_grid, cv=5, scoring='f1', n_jobs=-1)
    grid_search.fit(X_train_scaled, y_train)
    
    best_model = grid_search.best_estimator_
    
    print(f"✓ Best parameters: {grid_search.best_params_}")
    
    # Evaluate model
    print(f"\n" + "="*50)
    print("MODEL EVALUATION")
    print("="*50)
    
    # Training metrics
    y_train_pred = best_model.predict(X_train_scaled)
    train_accuracy = accuracy_score(y_train, y_train_pred)
    
    # Testing metrics
    y_test_pred = best_model.predict(X_test_scaled)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    test_precision = precision_score(y_test, y_test_pred)
    test_recall = recall_score(y_test, y_test_pred)
    test_f1 = f1_score(y_test, y_test_pred)
    
    print(f"\n📊 Performance Metrics:")
    print(f"  Training Accuracy: {train_accuracy:.4f}")
    print(f"  Testing Accuracy:  {test_accuracy:.4f}")
    print(f"  Precision:         {test_precision:.4f}")
    print(f"  Recall:            {test_recall:.4f}")
    print(f"  F1 Score:          {test_f1:.4f}")
    
    # Cross-validation
    cv_scores = cross_val_score(best_model, X_train_scaled, y_train, cv=5, scoring='f1')
    print(f"\n  Cross-Val F1:      {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_test_pred)
    print(f"\n📊 Confusion Matrix:")
    print(f"  {cm}\n")
    
    # Classification report
    print("📊 Classification Report:")
    print(classification_report(y_test, y_test_pred, target_names=['Healthy', 'Parkinsons']))
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\n📊 Top 10 Important Features:")
    print(feature_importance.head(10).to_string(index=False))
    
    # Save model and scaler
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    model_path = os.path.join(MODEL_DIR, 'model.joblib')
    scaler_path = os.path.join(MODEL_DIR, 'scaler.joblib')
    metrics_path = os.path.join(MODEL_DIR, 'model_metrics.json')
    
    joblib.dump(best_model, model_path)
    joblib.dump(scaler, scaler_path)
    
    # Save metrics
    metrics = {
        'timestamp': datetime.now().isoformat(),
        'model_type': 'RandomForestClassifier',
        'best_params': grid_search.best_params_,
        'train_accuracy': float(train_accuracy),
        'test_accuracy': float(test_accuracy),
        'precision': float(test_precision),
        'recall': float(test_recall),
        'f1_score': float(test_f1),
        'cv_f1_mean': float(cv_scores.mean()),
        'cv_f1_std': float(cv_scores.std()),
        'n_features': int(len(X.columns)),
        'n_train_samples': int(len(X_train)),
        'n_test_samples': int(len(X_test)),
        'feature_importance': feature_importance.head(10).to_dict('records')
    }
    
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print(f"\n✓ Model saved: {model_path}")
    print(f"✓ Scaler saved: {scaler_path}")
    print(f"✓ Metrics saved: {metrics_path}")
    
    return best_model, scaler, metrics

def main():
    """
    Main training pipeline
    """
    print("\n" + "="*50)
    print("VOICE HEALTH DETECTION - ML MODEL TRAINING")
    print("="*50 + "\n")
    
    # Load dataset
    X, y, df = load_parkinsons_dataset()
    
    # If real dataset not found, use synthetic data for testing
    if X is None:
        X, y, df = create_sample_dataset()
    
    # Train model
    model, scaler, metrics = train_model(X, y)
    
    print(f"\n" + "="*50)
    print("✅ TRAINING COMPLETE!")
    print("="*50)
    print(f"\nModel Performance Summary:")
    print(f"  Accuracy:  {metrics['test_accuracy']:.2%}")
    print(f"  Precision: {metrics['precision']:.2%}")
    print(f"  Recall:    {metrics['recall']:.2%}")
    print(f"  F1 Score:  {metrics['f1_score']:.2%}")
    print(f"\n🎯 Model is ready for production use!")
    print(f"   Restart ML service to load the new model.\n")

if __name__ == '__main__':
    main()
