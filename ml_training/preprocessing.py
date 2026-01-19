"""
ML Data Preprocessing
Utilities for preparing voice dataset for training
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Optional
import pickle
import os


class DataPreprocessor:
    """Data preprocessing utilities for ML training"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_names = None
    
    def load_parkinsons_dataset(self) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Load Parkinson's dataset from UCI repository or local file
        
        Returns:
            Tuple of (features_df, labels_series)
        """
        try:
            # Try to load from backend's dataset service first
            from backend.services.dataset_service import dataset_service
            
            # Get data from MongoDB or cached JSON
            data = dataset_service.get_all_records()
            
            if data and len(data) > 0:
                df = pd.DataFrame(data)
                
                # Separate features and labels
                # Assuming 'status' column indicates Parkinson's (1) or healthy (0)
                if 'status' in df.columns:
                    y = df['status']
                    X = df.drop(columns=['status', '_id'], errors='ignore')
                else:
                    # If no status column, try 'class' or create dummy
                    y = df.get('class', pd.Series([0] * len(df)))
                    X = df.drop(columns=['class', '_id'], errors='ignore')
                
                return X, y
                
        except Exception as e:
            print(f"Could not load from dataset service: {e}")

        # Fallback: Load from local file
        # PROJECT_ROOT/dataset/parkinsons/parkinsons.data
        from pathlib import Path
        project_root = Path(__file__).parent.parent
        local_path = project_root / "dataset" / "parkinsons" / "parkinsons.data"
        
        if local_path.exists():
            print(f"Loading from local dataset: {local_path}")
            try:
                df = pd.read_csv(local_path)
                y = df['status']
                X = df.drop(columns=['status', 'name'], errors='ignore')
                return X, y
            except Exception as e:
                print(f"Failed to load local file: {e}")
        
        # Fallback: Load from UCI repository
        try:
            from ucimlrepo import fetch_ucirepo
            
            # Fetch dataset (ID 174 is Parkinsons)
            parkinsons = fetch_ucirepo(id=174)
            
            X = parkinsons.data.features
            y = parkinsons.data.targets
            
            # Convert to binary if needed
            if y.ndim > 1:
                y = y.iloc[:, 0]
            
            return X, y
            
        except Exception as e:
            print(f"Could not fetch from UCI: {e}")
            
            # Generate synthetic data for testing
            print("WARNING: Generating synthetic data for testing purposes")
            return self._generate_synthetic_data()
    
    def _generate_synthetic_data(self, n_samples: int = 200) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Generate synthetic Parkinson's-like dataset for testing
        
        Args:
            n_samples: Number of samples to generate
            
        Returns:
            Tuple of (features_df, labels_series)
        """
        np.random.seed(42)
        
        # Generate 39 features (matching typical feature count)
        n_features = 39
        
        # Generate data with different distributions for healthy vs Parkinson's
        n_healthy = n_samples // 2
        n_parkinsons = n_samples - n_healthy
        
        # Healthy individuals (lower variance, different means)
        healthy_data = np.random.randn(n_healthy, n_features) * 0.5 + 0.5
        
        # Parkinson's patients (higher variance, different means)
        parkinsons_data = np.random.randn(n_parkinsons, n_features) * 1.0 + 1.5
        
        # Combine
        X = np.vstack([healthy_data, parkinsons_data])
        y = np.array([0] * n_healthy + [1] * n_parkinsons)
        
        # Shuffle
        indices = np.random.permutation(n_samples)
        X = X[indices]
        y = y[indices]
        
        # Convert to DataFrame
        feature_names = [f'feature_{i}' for i in range(n_features)]
        X_df = pd.DataFrame(X, columns=feature_names)
        y_series = pd.Series(y, name='status')
        
        return X_df, y_series
    
    def prepare_data(
        self, 
        X: pd.DataFrame, 
        y: pd.Series,
        test_size: float = 0.2,
        random_state: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepare data for training: split and normalize
        
        Args:
            X: Feature DataFrame
            y: Labels Series
            test_size: Proportion of test set
            random_state: Random seed for reproducibility
            
        Returns:
            Tuple of (X_train, X_test, y_train, y_test) - all normalized
        """
        # Store feature names
        self.feature_names = X.columns.tolist()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        # Fit scaler on training data
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        return X_train_scaled, X_test_scaled, y_train.values, y_test.values
    
    def save_scaler(self, file_path: str):
        """
        Save the fitted scaler to disk
        
        Args:
            file_path: Path to save the scaler
        """
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        print(f"Scaler saved to {file_path}")
    
    def load_scaler(self, file_path: str):
        """
        Load a fitted scaler from disk
        
        Args:
            file_path: Path to the saved scaler
        """
        with open(file_path, 'rb') as f:
            self.scaler = pickle.load(f)
        print(f"Scaler loaded from {file_path}")
    
    def transform_features(self, X: np.ndarray) -> np.ndarray:
        """
        Transform features using the fitted scaler
        
        Args:
            X: Feature array
            
        Returns:
            Scaled features
        """
        return self.scaler.transform(X)


# Singleton instance
preprocessor = DataPreprocessor()
