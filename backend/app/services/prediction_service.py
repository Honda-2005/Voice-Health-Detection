"""
Prediction Service
Core business logic for voice health predictions
"""

from typing import Dict
from datetime import datetime
from backend.app.services.audio_service import audio_service, AudioValidationError
from backend.app.models.feature_extractor import feature_extractor
from backend.app.models.prediction_model import prediction_model, PredictionModelError


class PredictionService:
    """Service for voice health predictions"""
    
    @staticmethod
    def validate_and_process_audio(file_path: str) -> Dict:
        """
        Validate audio file and extract metadata
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Validation results with metadata
            
        Raises:
            AudioValidationError: If validation fails
        """
        return audio_service.validate_audio(file_path)
    
    @staticmethod
    def extract_features(file_path: str) -> Dict[str, float]:
        """
        Extract voice features from audio file
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Dictionary of extracted features
        """
        return feature_extractor.extract_from_file(file_path)
    
    @staticmethod
    def generate_prediction(file_path: str) -> Dict:
        """
        Generate complete prediction from audio file
        
        Args:
            file_path: Path to audio file
            
        Returns:
            Complete prediction results
            
        Raises:
            AudioValidationError: If audio validation fails
            PredictionModelError: If prediction fails
        """
        # Extract features
        features_dict = feature_extractor.extract_from_file(file_path)
        features_array = audio_service.features_to_array(features_dict)
        
        # Make prediction
        prediction, probability = prediction_model.predict(features_array)
        
        # Calculate derived metrics
        risk_level = prediction_model.calculate_risk_level(probability)
        confidence = prediction_model.calculate_confidence(probability)
        health_score = prediction_model.calculate_health_score(probability)
        status = prediction_model.map_to_status(risk_level)
        
        # Format features for frontend display
        formatted_features = feature_extractor.format_features_for_display(features_dict)
        
        # Calculate vocal metrics for frontend
        vocal_metrics = PredictionService._calculate_vocal_metrics(
            features_dict, 
            health_score
        )
        
        return {
            'prediction': prediction,
            'probability': probability,
            'risk_level': risk_level,
            'status': status,
            'confidence': confidence,
            'health_score': health_score,
            'features': formatted_features,
            'vocal_metrics': vocal_metrics
        }
    
    @staticmethod
    def _calculate_vocal_metrics(features: Dict[str, float], health_score: int) -> Dict:
        """
        Calculate vocal metrics for frontend display
        
        Args:
            features: Raw feature dictionary
            health_score: Overall health score
            
        Returns:
            Vocal metrics formatted for frontend
        """
        # Extract key features
        pitch_std = features.get('pitch_std', 0)
        jitter = features.get('jitter', 0)
        shimmer = features.get('shimmer', 0)
        hnr = features.get('hnr', 0)
        
        # Normalize to 0-100 scale (lower variation is better for most metrics)
        # These are heuristic mappings - could be refined with domain knowledge
        
        # Pitch Stability (lower std is more stable)
        pitch_stability = max(0, min(100, 100 - (pitch_std * 10)))
        
        # Voice Clarity (higher HNR is clearer)
        voice_clarity = max(0, min(100, hnr * 5))
        
        # Breath Control (lower shimmer is better)
        breath_control = max(0, min(100, 100 - (shimmer * 1000)))
        
        # Consistency (lower jitter is more consistent)
        consistency = max(0, min(100, 100 - (jitter * 10)))
        
        # Calculate trends (simulated - would need historical data in production)
        # For now, slight random variation based on health score
        import random
        random.seed(int(health_score))
        
        return {
            'pitchStability': {
                'value': int(pitch_stability),
                'trend': random.randint(-2, 2)
            },
            'voiceClarity': {
                'value': int(voice_clarity),
                'trend': random.randint(-2, 2)
            },
            'breathControl': {
                'value': int(breath_control),
                'trend': random.randint(-2, 2)
            },
            'consistency': {
                'value': int(consistency),
                'trend': random.randint(-2, 2)
            }
        }
    
    @staticmethod
    def create_result_document(
        prediction_result: Dict,
        user_id: str,
        recording_id: str,
        timestamp: str,
        duration: float,
        environment: str = "Unknown"
    ) -> Dict:
        """
        Create result document for database storage
        
        Args:
            prediction_result: Prediction results from generate_prediction()
            user_id: User ID
            recording_id: Recording ID
            timestamp: Recording timestamp (ISO format)
            duration: Recording duration in seconds
            environment: Recording environment
            
        Returns:
            Result document ready for MongoDB insertion
        """
        status = prediction_result['status']
        
        # Map status to labels and descriptions
        labels = {
            'normal': 'Healthy Voice Patterns',
            'warning': 'Attention Recommended',
            'alert': 'Consultation Advised'
        }
        
        descriptions = {
            'normal': 'Your voice analysis shows patterns within normal ranges. No significant anomalies detected.',
            'warning': 'Some voice patterns require attention. Consider implementing the recommendations below.',
            'alert': 'Significant voice pattern deviations detected. Consult a healthcare professional for further evaluation.'
        }
        
        result_doc = {
            'recording_id': recording_id,
            'user_id': user_id,
            'timestamp': timestamp,
            'healthScore': prediction_result['health_score'],
            'overallResult': {
                'status': status,
                'label': labels.get(status, 'Analysis Complete'),
                'description': descriptions.get(status, 'Voice analysis completed successfully.')
            },
            'confidence': prediction_result['confidence'],
            'severity': prediction_result['risk_level'],
            'metrics': prediction_result['vocal_metrics'],
            'recordingInfo': {
                'id': recording_id,
                'timestamp': timestamp,
                'duration': duration,
                'environment': environment
            },
            'charts': {
                'pattern': {
                    'data': PredictionService._calculate_pattern_data(prediction_result)
                },
                'trend': {
                    'labels': [],  # Would need historical data
                    'data': []  # Would need historical data
                }
            },
            'raw_features': prediction_result['features'],
            'ml_prediction': {
                'prediction_class': prediction_result['prediction'],
                'probability': prediction_result['probability']
            },
            'created_at': datetime.utcnow()
        }
        
        return result_doc
    
    @staticmethod
    def _calculate_pattern_data(prediction_result: Dict) -> list:
        """
        Calculate pattern distribution for chart
        
        Args:
            prediction_result: Prediction results
            
        Returns:
            List of [normal, attention, alert] percentages
        """
        health_score = prediction_result['health_score']
        
        # Map health score to pattern distribution
        if health_score >= 80:
            return [80, 15, 5]
        elif health_score >= 60:
            return [60, 30, 10]
        else:
            return [40, 35, 25]


# Singleton instance
prediction_service = PredictionService()
