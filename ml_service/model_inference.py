"""
ML Model Inference Module
Loads trained model and performs predictions on extracted voice features.
"""

import joblib
import numpy as np
import os
from typing import Dict, Tuple, Optional, List


class ParkinsonsModel:
    """Wrapper class for Parkinson's disease prediction model."""
    
    def __init__(self, models_dir='models'):
        """
        Initialize the model loader.
        
        Args:
            models_dir: Directory containing model files
        """
        self.models_dir = models_dir
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.feature_names = None
        self.metadata = None
        self.is_loaded = False
    
    def load_model(self) -> bool:
        """
        Load all model components from disk.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Load model
            model_path = os.path.join(self.models_dir, 'parkinson_rf_model.pkl')
            self.model = joblib.load(model_path)
            print(f"[OK] Model loaded from: {model_path}")
            
            # Load scaler
            scaler_path = os.path.join(self.models_dir, 'scaler.pkl')
            self.scaler = joblib.load(scaler_path)
            print(f"[OK] Scaler loaded from: {scaler_path}")
            
            # Load label encoder
            encoder_path = os.path.join(self.models_dir, 'label_encoder.pkl')
            self.label_encoder = joblib.load(encoder_path)
            print(f"[OK] Label encoder loaded from: {encoder_path}")
            
            # Load feature names
            features_path = os.path.join(self.models_dir, 'feature_names.pkl')
            self.feature_names = joblib.load(features_path)
            print(f"[OK] Feature names loaded: {len(self.feature_names)} features")
            
            # Load metadata
            metadata_path = os.path.join(self.models_dir, 'model_metadata.pkl')
            self.metadata = joblib.load(metadata_path)
            print(f"[OK] Metadata loaded")
            
            self.is_loaded = True
            print("\n[OK] All model components loaded successfully!")
            return True
            
        except Exception as e:
            print(f"[ERROR] Error loading model: {e}")
            self.is_loaded = False
            return False
    
    def prepare_features(self, features: Dict[str, float]) -> Optional[np.ndarray]:
        """
        Prepare features for prediction by ordering and scaling.
        
        Args:
            features: Dictionary of feature name -> value
            
        Returns:
            Scaled feature array ready for prediction, or None if error
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            # Remove 'name' if present
            features = {k: v for k, v in features.items() if k != 'name'}
            
            # Order features according to training order
            feature_values = []
            for feature_name in self.feature_names:
                if feature_name in features:
                    value = features[feature_name]
                    # Handle NaN values
                    if np.isnan(value):
                        value = 0.0  # Replace NaN with 0
                    feature_values.append(value)
                else:
                    raise ValueError(f"Missing required feature: {feature_name}")
            
            # Convert to numpy array and reshape
            feature_array = np.array(feature_values).reshape(1, -1)
            
            # Scale features
            scaled_features = self.scaler.transform(feature_array)
            
            return scaled_features
            
        except Exception as e:
            print(f"Error preparing features: {e}")
            return None
    
    def predict(self, features: Dict[str, float]) -> Optional[Dict]:
        """
        Make prediction from features.
        
        Args:
            features: Dictionary of extracted voice features
            
        Returns:
            Dictionary containing prediction results
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            # Prepare features
            scaled_features = self.prepare_features(features)
            if scaled_features is None:
                return None
            
            # Get prediction
            prediction = self.model.predict(scaled_features)[0]
            probabilities = self.model.predict_proba(scaled_features)[0]
            
            # Decode prediction
            condition = self.label_encoder.inverse_transform([prediction])[0]
            
            # Map to readable labels
            condition_label = "Parkinson" if condition == 1 else "Healthy"
            
            # Calculate confidence
            confidence = float(np.max(probabilities))
            
            # Determine severity (simple heuristic based on confidence)
            severity = self._calculate_severity(condition_label, confidence)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(condition_label, confidence)
            
            # Build result
            result = {
                "condition": condition_label,
                "severity": severity,
                "confidence": confidence,
                "probability": {
                    "healthy": float(probabilities[0]),
                    "parkinson": float(probabilities[1])
                },
                "symptoms": [],  # Can be extended based on feature analysis
                "recommendations": recommendations
            }
            
            return result
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return None
    
    def _calculate_severity(self, condition: str, confidence: float) -> str:
        """
        Calculate severity level based on condition and confidence.
        
        Args:
            condition: Predicted condition
            confidence: Prediction confidence
            
        Returns:
            Severity level string
        """
        if condition == "Healthy":
            return "None"
        
        # For Parkinson's, use confidence to estimate severity
        if confidence >= 0.9:
            return "Severe"
        elif confidence >= 0.75:
            return "Moderate"
        else:
            return "Mild"
    
    def _generate_recommendations(self, condition: str, confidence: float) -> List[str]:
        """
        Generate recommendations based on prediction.
        
        Args:
            condition: Predicted condition
            confidence: Prediction confidence
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        if condition == "Healthy":
            recommendations.append("Voice analysis indicates healthy vocal characteristics.")
            recommendations.append("Continue regular health check-ups.")
            if confidence < 0.8:
                recommendations.append("Consider follow-up analysis if symptoms develop.")
        else:
            recommendations.append("Voice analysis suggests potential Parkinson's indicators.")
            recommendations.append("Consult with a neurologist for professional evaluation.")
            recommendations.append("This is a screening tool, not a diagnostic device.")
            if confidence >= 0.9:
                recommendations.append("High confidence in prediction - seek medical attention promptly.")
        
        return recommendations


# Global model instance (singleton pattern for API)
_model_instance = None


def get_model_instance(models_dir='models') -> ParkinsonsModel:
    """
    Get or create the global model instance.
    
    Args:
        models_dir: Directory containing model files
        
    Returns:
        ParkinsonsModel instance
    """
    global _model_instance
    
    if _model_instance is None:
        _model_instance = ParkinsonsModel(models_dir)
        _model_instance.load_model()
    
    return _model_instance


def predict_from_features(features: Dict[str, float]) -> Optional[Dict]:
    """
    Convenience function for making predictions.
    
    Args:
        features: Dictionary of extracted voice features
        
    Returns:
        Prediction result dictionary
    """
    model = get_model_instance()
    return model.predict(features)


if __name__ == "__main__":
    # Test the model inference
    print("Testing Model Inference Module")
    print("="*50)
    
    # Load model
    model = ParkinsonsModel()
    success = model.load_model()
    
    if success:
        print("\n[OK] Model loaded successfully!")
        print(f"Model type: {model.metadata['model_type']}")
        print(f"Number of features: {model.metadata['n_features']}")
        print(f"Classes: {model.metadata['classes']}")
        
        # Test with sample features (you can replace with actual values)
        print("\nTesting with sample features...")
        sample_features = {name: 0.1 for name in model.feature_names}
        
        result = model.predict(sample_features)
        if result:
            print("\nPrediction Result:")
            print(f"  Condition: {result['condition']}")
            print(f"  Severity: {result['severity']}")
            print(f"  Confidence: {result['confidence']:.2%}")
            print(f"  Probabilities: {result['probability']}")
    else:
        print("\n[ERROR] Failed to load model!")

