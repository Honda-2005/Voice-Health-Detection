"""
Prediction Model Wrapper
ML model wrapper for inference in production
"""

import os
import pickle
import numpy as np
from pathlib import Path
from typing import Dict, Tuple, Optional


class PredictionModelError(Exception):
    """Custom exception for prediction model errors"""
    pass


class PredictionModel:
    """Wrapper for ML model inference"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_loaded = False
        self.model_path = None
        self.scaler_path = None
    
    def load_model(self, model_path: Optional[str] = None, scaler_path: Optional[str] = None):
        """
        Load trained model and scaler from disk
        
        Args:
            model_path: Path to saved model file (optional, uses default if not provided)
            scaler_path: Path to saved scaler file (optional, uses default if not provided)
            
        Raises:
            PredictionModelError: If model files not found or loading fails
        """
        # Use default paths if not provided
        if model_path is None:
            # Try environment variable first
            model_path = os.getenv('MODEL_PATH')
            if model_path is None:
                # Default path
                base_dir = Path(__file__).parent.parent.parent.parent
                model_path = base_dir / 'ml_training' / 'models' / 'parkinson_voice_model.pkl'
        
        if scaler_path is None:
            # Try environment variable first
            scaler_path = os.getenv('SCALER_PATH')
            if scaler_path is None:
                # Default path
                base_dir = Path(__file__).parent.parent.parent.parent
                scaler_path = base_dir / 'ml_training' / 'models' / 'scaler.pkl'
        
        # Convert to Path objects
        self.model_path = Path(model_path)
        self.scaler_path = Path(scaler_path)
        
        # Check if files exist
        if not self.model_path.exists():
            raise PredictionModelError(
                f"Model file not found: {self.model_path}\n"
                "Please train the model first: python -m ml_training.dataset.train"
            )
        
        if not self.scaler_path.exists():
            raise PredictionModelError(
                f"Scaler file not found: {self.scaler_path}\n"
                "Please train the model first: python -m ml_training.dataset.train"
            )
        
        try:
            # Load model
            print(f"Loading model from {self.model_path}...")
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            # Load scaler
            print(f"Loading scaler from {self.scaler_path}...")
            with open(self.scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            
            self.is_loaded = True
            print("Model and scaler loaded successfully!")
            
        except Exception as e:
            raise PredictionModelError(f"Error loading model: {str(e)}")
    
    def predict(self, features: np.ndarray) -> Tuple[int, float]:
        """
        Make prediction on features
        
        Args:
            features: Feature array (1, n_features) or (n_features,)
            
        Returns:
            Tuple of (prediction, probability)
            prediction: 0 for healthy, 1 for Parkinson's
            probability: Probability of Parkinson's (0-1)
            
        Raises:
            PredictionModelError: If model not loaded or prediction fails
        """
        if not self.is_loaded:
            raise PredictionModelError("Model not loaded. Call load_model() first.")
        
        try:
            # Ensure features are 2D
            if features.ndim == 1:
                features = features.reshape(1, -1)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Make prediction
            prediction = int(self.model.predict(features_scaled)[0])
            
            # Get probability
            if hasattr(self.model, 'predict_proba'):
                probability = float(self.model.predict_proba(features_scaled)[0, 1])
            else:
                # For models without predict_proba, use decision function or default
                if hasattr(self.model, 'decision_function'):
                    decision = self.model.decision_function(features_scaled)[0]
                    # Convert to probability using sigmoid
                    probability = float(1 / (1 + np.exp(-decision)))
                else:
                    probability = float(prediction)
            
            return prediction, probability
            
        except Exception as e:
            raise PredictionModelError(f"Error making prediction: {str(e)}")
    
    def calculate_risk_level(self, probability: float) -> str:
        """
        Calculate risk level from probability
        
        Args:
            probability: Probability of Parkinson's (0-1)
            
        Returns:
            Risk level: 'low', 'medium', or 'high'
        """
        if probability < 0.3:
            return 'low'
        elif probability < 0.7:
            return 'medium'
        else:
            return 'high'
    
    def calculate_confidence(self, probability: float) -> int:
        """
        Calculate confidence score from probability
        
        Args:
            probability: Probability of Parkinson's (0-1)
            
        Returns:
            Confidence score (0-100)
        """
        # Confidence is based on how far the probability is from 0.5 (uncertain)
        distance_from_uncertain = abs(probability - 0.5)
        confidence = int((distance_from_uncertain * 2) * 100)
        # Ensure minimum confidence of 50% for any prediction
        confidence = max(50, min(100, confidence))
        return confidence
    
    def calculate_health_score(self, probability: float) -> int:
        """
        Calculate health score from probability
        
        Args:
            probability: Probability of Parkinson's (0-1)
            
        Returns:
            Health score (0-100), where 100 is healthiest
        """
        # Invert probability (1-p gives health score)
        health_score = int((1 - probability) * 100)
        return max(0, min(100, health_score))
    
    def map_to_status(self, risk_level: str) -> str:
        """
        Map risk level to status for frontend
        
        Args:
            risk_level: 'low', 'medium', or 'high'
            
        Returns:
            Status: 'normal', 'warning', or 'alert'
        """
        mapping = {
            'low': 'normal',
            'medium': 'warning',
            'high': 'alert'
        }
        return mapping.get(risk_level, 'normal')


# Singleton instance
prediction_model = PredictionModel()
