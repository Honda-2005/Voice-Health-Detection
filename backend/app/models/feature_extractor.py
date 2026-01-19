"""
Feature Extractor Model
Wrapper class for audio feature extraction
"""

import numpy as np
from typing import Dict, List
from backend.app.services.audio_service import audio_service


class FeatureExtractor:
    """
    Feature extraction wrapper for voice analysis
    Provides a clean interface for extracting features from audio files
    """
    
    def __init__(self):
        """Initialize the feature extractor"""
        self.feature_names = self._get_feature_names()
    
    @staticmethod
    def _get_feature_names() -> List[str]:
        """
        Get the list of feature names in order
        
        Returns:
            List of feature names
        """
        features = []
        
        # MFCC features (26 total: 13 mean + 13 std)
        for i in range(1, 14):
            features.append(f'mfcc_{i}_mean')
        for i in range(1, 14):
            features.append(f'mfcc_{i}_std')
        
        # Pitch features (4)
        features.extend(['pitch_mean', 'pitch_std', 'pitch_min', 'pitch_max'])
        
        # Jitter and Shimmer (2)
        features.extend(['jitter', 'shimmer'])
        
        # Spectral features (2)
        features.extend(['spectral_centroid_mean', 'spectral_centroid_std'])
        
        # Zero crossing rate (2)
        features.extend(['zcr_mean', 'zcr_std'])
        
        # Energy features (2)
        features.extend(['rms_mean', 'rms_std'])
        
        # HNR (1)
        features.append('hnr')
        
        return features
    
    def extract_from_file(self, file_path: str) -> Dict[str, float]:
        """
        Extract features from an audio file
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            Dictionary of extracted features
        """
        return audio_service.extract_features(file_path)
    
    def extract_to_array(self, file_path: str) -> np.ndarray:
        """
        Extract features and return as numpy array for ML model
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            Numpy array of features (1, n_features)
        """
        features = self.extract_from_file(file_path)
        return audio_service.features_to_array(features)
    
    def get_feature_count(self) -> int:
        """
        Get the number of features extracted
        
        Returns:
            Number of features
        """
        return len(self.feature_names)
    
    def format_features_for_display(self, features: Dict[str, float]) -> Dict[str, Dict[str, float]]:
        """
        Format features for frontend display
        Groups features into categories
        
        Args:
            features: Raw feature dictionary
            
        Returns:
            Formatted features grouped by category
        """
        formatted = {
            'pitch': {
                'mean': features.get('pitch_mean', 0),
                'std': features.get('pitch_std', 0),
                'min': features.get('pitch_min', 0),
                'max': features.get('pitch_max', 0)
            },
            'voice_quality': {
                'jitter': features.get('jitter', 0),
                'shimmer': features.get('shimmer', 0),
                'hnr': features.get('hnr', 0)
            },
            'spectral': {
                'centroid_mean': features.get('spectral_centroid_mean', 0),
                'centroid_std': features.get('spectral_centroid_std', 0)
            },
            'energy': {
                'rms_mean': features.get('rms_mean', 0),
                'rms_std': features.get('rms_std', 0)
            },
            'temporal': {
                'zcr_mean': features.get('zcr_mean', 0),
                'zcr_std': features.get('zcr_std', 0)
            }
        }
        
        return formatted


# Singleton instance
feature_extractor = FeatureExtractor()
