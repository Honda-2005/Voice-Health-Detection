"""
ML Model Training and Export Script
Trains Random Forest classifier on Parkinson's Disease dataset and exports for production use.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib
import os


def load_dataset(dataset_path: str) -> pd.DataFrame:
    """Load the Parkinson's disease dataset."""
    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    return df


def prepare_data(df: pd.DataFrame):
    """
    Prepare features and labels for training.
    
    Returns:
        X_train, X_test, y_train, y_test, scaler, label_encoder
    """
    # Drop the 'name' column (patient identifier)
    if 'name' in df.columns:
        df = df.drop('name', axis=1)
    
    # Separate features and target
    # Assuming 'status' column contains the labels (1 = Parkinson's, 0 = Healthy)
    if 'status' in df.columns:
        X = df.drop('status', axis=1)
        y = df['status']
    else:
        raise ValueError("Dataset must contain 'status' column")
    
    print(f"\nFeatures shape: {X.shape}")
    print(f"Target distribution:\n{y.value_counts()}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Label encoding (for consistency, though binary classification doesn't strictly need it)
    label_encoder = LabelEncoder()
    y_train_encoded = label_encoder.fit_transform(y_train)
    y_test_encoded = label_encoder.transform(y_test)
    
    return X_train_scaled, X_test_scaled, y_train_encoded, y_test_encoded, scaler, label_encoder, X.columns.tolist()


def train_random_forest(X_train, y_train, tune_hyperparameters=True):
    """
    Train Random Forest classifier with optional hyperparameter tuning.
    """
    print("\n" + "="*50)
    print("Training Random Forest Classifier")
    print("="*50)
    
    if tune_hyperparameters:
        print("Performing hyperparameter tuning...")
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [None, 10, 20],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2]
        }
        
        rf = RandomForestClassifier(random_state=42)
        grid_search = GridSearchCV(
            rf, param_grid, cv=5, scoring='accuracy', n_jobs=-1, verbose=1
        )
        grid_search.fit(X_train, y_train)
        
        print(f"Best parameters: {grid_search.best_params_}")
        print(f"Best cross-validation score: {grid_search.best_score_:.4f}")
        
        return grid_search.best_estimator_
    else:
        # Use best parameters from notebook (n_estimators=200, max_depth=None)
        print("Training with predefined parameters...")
        rf = RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)
        return rf


def evaluate_model(model, X_test, y_test):
    """Evaluate model performance."""
    print("\n" + "="*50)
    print("Model Evaluation")
    print("="*50)
    
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'roc_auc': roc_auc
    }


def export_model(model, scaler, label_encoder, feature_names, output_dir='models'):
    """Export trained model, scaler, and label encoder."""
    print("\n" + "="*50)
    print("Exporting Model")
    print("="*50)
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Export model
    model_path = os.path.join(output_dir, 'parkinson_rf_model.pkl')
    joblib.dump(model, model_path)
    print(f"[OK] Model saved to: {model_path}")
    
    # Export scaler
    scaler_path = os.path.join(output_dir, 'scaler.pkl')
    joblib.dump(scaler, scaler_path)
    print(f"[OK] Scaler saved to: {scaler_path}")
    
    # Export label encoder
    encoder_path = os.path.join(output_dir, 'label_encoder.pkl')
    joblib.dump(label_encoder, encoder_path)
    print(f"[OK] Label encoder saved to: {encoder_path}")
    
    # Export feature names
    features_path = os.path.join(output_dir, 'feature_names.pkl')
    joblib.dump(feature_names, features_path)
    print(f"[OK] Feature names saved to: {features_path}")
    
    # Export metadata
    metadata = {
        'model_type': 'RandomForestClassifier',
        'n_features': len(feature_names),
        'feature_names': feature_names,
        'classes': label_encoder.classes_.tolist()
    }
    metadata_path = os.path.join(output_dir, 'model_metadata.pkl')
    joblib.dump(metadata, metadata_path)
    print(f"[OK] Metadata saved to: {metadata_path}")


def main():
    """Main training pipeline."""
    # Dataset path - Now in Voice-Health-Detection/datasets
    # Get the directory where this script is located (ml_service)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up one level to Voice-Health-Detection, then into datasets
    dataset_path = os.path.join(current_dir, '..', 'datasets', 'Project 14 Parkinsons Disease Data.csv')
    
    if not os.path.exists(dataset_path):
        print(f"ERROR: Dataset not found at {dataset_path}")
        print("Please ensure the dataset file exists.")
        return
    
    # Load dataset
    df = load_dataset(dataset_path)
    
    # Prepare data
    X_train, X_test, y_train, y_test, scaler, label_encoder, feature_names = prepare_data(df)
    
    # Train model (set tune_hyperparameters=False to use predefined best params)
    model = train_random_forest(X_train, y_train, tune_hyperparameters=False)
    
    # Evaluate model
    metrics = evaluate_model(model, X_test, y_test)
    
    # Export model
    export_model(model, scaler, label_encoder, feature_names)
    
    print("\n" + "="*50)
    print("[OK] Model training and export completed successfully!")
    print("="*50)
    print("\nModel files created in 'models/' directory:")
    print("  - parkinson_rf_model.pkl")
    print("  - scaler.pkl")
    print("  - label_encoder.pkl")
    print("  - feature_names.pkl")
    print("  - model_metadata.pkl")


if __name__ == "__main__":
    main()
