"""
Audio Processing Service
Handles audio validation, preprocessing, and feature extraction for voice health analysis
"""

import os
import librosa
import numpy as np
import soundfile as sf
from typing import Dict, Tuple, Optional
from pathlib import Path


class AudioValidationError(Exception):
    """Custom exception for audio validation errors"""
    pass


class AudioService:
    """Service for audio processing and validation"""
    
    # Configuration
    ALLOWED_FORMATS = ['wav', 'webm', 'mp3', 'ogg']
    MAX_FILE_SIZE_MB = 10
    MIN_DURATION_SEC = 15
    MAX_DURATION_SEC = 60
    TARGET_SAMPLE_RATE = 22050  # Standard for speech processing
    
    @staticmethod
    def validate_audio(file_path: str) -> Dict[str, any]:
        """
        Validate audio file format, size, and duration
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            Dict containing validation results and audio metadata
            
        Raises:
            AudioValidationError: If validation fails
        """
        if not os.path.exists(file_path):
            raise AudioValidationError(f"Audio file not found: {file_path}")
        
        # Check file size
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if file_size_mb > AudioService.MAX_FILE_SIZE_MB:
            raise AudioValidationError(
                f"File too large: {file_size_mb:.2f}MB (max: {AudioService.MAX_FILE_SIZE_MB}MB)"
            )
        
        # Check file extension
        file_ext = Path(file_path).suffix.lower().lstrip('.')
        if file_ext not in AudioService.ALLOWED_FORMATS:
            raise AudioValidationError(
                f"Unsupported format: {file_ext}. Allowed: {', '.join(AudioService.ALLOWED_FORMATS)}"
            )
        
        try:
            # Load audio to check duration and validity
            audio, sr = librosa.load(file_path, sr=None)
            duration = librosa.get_duration(y=audio, sr=sr)
            
            if duration < AudioService.MIN_DURATION_SEC:
                raise AudioValidationError(
                    f"Audio too short: {duration:.1f}s (min: {AudioService.MIN_DURATION_SEC}s)"
                )
            
            if duration > AudioService.MAX_DURATION_SEC:
                raise AudioValidationError(
                    f"Audio too long: {duration:.1f}s (max: {AudioService.MAX_DURATION_SEC}s)"
                )
            
            return {
                'valid': True,
                'duration': duration,
                'sample_rate': sr,
                'file_size_mb': file_size_mb,
                'format': file_ext
            }
            
        except Exception as e:
            if isinstance(e, AudioValidationError):
                raise
            raise AudioValidationError(f"Error reading audio file: {str(e)}")
    
    @staticmethod
    def preprocess_audio(file_path: str) -> Tuple[np.ndarray, int]:
        """
        Load and preprocess audio file
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            Tuple of (audio_array, sample_rate)
        """
        # Load and resample to target sample rate
        audio, sr = librosa.load(file_path, sr=AudioService.TARGET_SAMPLE_RATE)
        
        # Normalize audio
        audio = librosa.util.normalize(audio)
        
        # Remove silence from beginning and end
        audio, _ = librosa.effects.trim(audio, top_db=20)
        
        return audio, sr
    
    @staticmethod
    def extract_features(file_path: str) -> Dict[str, float]:
        """
        Extract voice features from audio file
        
        Features extracted:
        - MFCC (Mel-frequency cepstral coefficients) - 13 mean values
        - Pitch (F0 fundamental frequency)
        - Jitter (pitch perturbation)
        - Shimmer (amplitude perturbation)
        - HNR (Harmonics-to-Noise Ratio)
        
        Args:
            file_path: Path to the audio file
            
        Returns:
            Dictionary of extracted features
        """
        # Load and preprocess audio
        audio, sr = AudioService.preprocess_audio(file_path)
        
        features = {}
        
        # Extract MFCCs (13 coefficients)
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)
        for i in range(13):
            features[f'mfcc_{i+1}_mean'] = float(np.mean(mfccs[i]))
            features[f'mfcc_{i+1}_std'] = float(np.std(mfccs[i]))
        
        # Extract pitch (F0)
        pitches, magnitudes = librosa.piptrack(y=audio, sr=sr)
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)
        
        if pitch_values:
            features['pitch_mean'] = float(np.mean(pitch_values))
            features['pitch_std'] = float(np.std(pitch_values))
            features['pitch_min'] = float(np.min(pitch_values))
            features['pitch_max'] = float(np.max(pitch_values))
        else:
            features['pitch_mean'] = 0.0
            features['pitch_std'] = 0.0
            features['pitch_min'] = 0.0
            features['pitch_max'] = 0.0
        
        # Calculate jitter (pitch perturbation)
        if len(pitch_values) > 1:
            pitch_diffs = np.diff(pitch_values)
            features['jitter'] = float(np.mean(np.abs(pitch_diffs)))
        else:
            features['jitter'] = 0.0
        
        # Extract spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
        features['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
        features['spectral_centroid_std'] = float(np.std(spectral_centroids))
        
        # Extract zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(audio)[0]
        features['zcr_mean'] = float(np.mean(zcr))
        features['zcr_std'] = float(np.std(zcr))
        
        # Extract energy features
        rms = librosa.feature.rms(y=audio)[0]
        features['rms_mean'] = float(np.mean(rms))
        features['rms_std'] = float(np.std(rms))
        
        # Calculate shimmer (amplitude perturbation) - using RMS
        if len(rms) > 1:
            rms_diffs = np.diff(rms)
            features['shimmer'] = float(np.mean(np.abs(rms_diffs)))
        else:
            features['shimmer'] = 0.0
        
        # Estimate HNR (Harmonics-to-Noise Ratio)
        # Using spectral flatness as a proxy
        spectral_flatness = librosa.feature.spectral_flatness(y=audio)[0]
        # Convert to HNR-like measure (inverse relationship)
        hnr_estimate = -10 * np.log10(np.mean(spectral_flatness) + 1e-10)
        features['hnr'] = float(hnr_estimate)
        
        return features
    
    @staticmethod
    def features_to_array(features: Dict[str, float]) -> np.ndarray:
        """
        Convert feature dictionary to numpy array for ML model input
        
        Args:
            features: Dictionary of features
            
        Returns:
            Numpy array of feature values in consistent order
        """
        # Define the order of features for the ML model
        feature_order = []
        
        # MFCC features (26 total: 13 mean + 13 std)
        for i in range(1, 14):
            feature_order.append(f'mfcc_{i}_mean')
        for i in range(1, 14):
            feature_order.append(f'mfcc_{i}_std')
        
        # Pitch features (4)
        feature_order.extend(['pitch_mean', 'pitch_std', 'pitch_min', 'pitch_max'])
        
        # Jitter and Shimmer (2)
        feature_order.extend(['jitter', 'shimmer'])
        
        # Spectral features (2)
        feature_order.extend(['spectral_centroid_mean', 'spectral_centroid_std'])
        
        # Zero crossing rate (2)
        feature_order.extend(['zcr_mean', 'zcr_std'])
        
        # Energy features (2)
        feature_order.extend(['rms_mean', 'rms_std'])
        
        # HNR (1)
        feature_order.append('hnr')
        
        # Extract values in order
        feature_values = [features.get(key, 0.0) for key in feature_order]
        
        return np.array(feature_values).reshape(1, -1)


# Singleton instance
audio_service = AudioService()
