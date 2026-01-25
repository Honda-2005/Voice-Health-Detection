"""
Voice Health Detection - ML Service
Flask-based microservice for audio feature extraction and prediction
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import librosa
import joblib
import logging
import os
import io
from datetime import datetime
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
ML_MODEL_PATH = os.environ.get('ML_MODEL_PATH', './ml-service/models/model.joblib')
SCALER_PATH = os.environ.get('SCALER_PATH', './ml-service/models/scaler.joblib')
SAMPLE_RATE = 44100
MODEL_VERSION = '1.0.0'

# Load models on startup
model = None
scaler = None

def load_models():
    """Load pre-trained ML model and scaler"""
    global model, scaler
    try:
        if os.path.exists(ML_MODEL_PATH):
            model = joblib.load(ML_MODEL_PATH)
            logger.info(f'Model loaded from {ML_MODEL_PATH}')
        else:
            logger.warning(f'Model not found at {ML_MODEL_PATH}, using dummy model')
            model = None
        
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            logger.info(f'Scaler loaded from {SCALER_PATH}')
        else:
            logger.warning(f'Scaler not found at {SCALER_PATH}')
            scaler = None
    except Exception as e:
        logger.error(f'Error loading models: {str(e)}')
        model = None
        scaler = None

def extract_audio_features(audio_data, sr=SAMPLE_RATE):
    """
    Extract audio features using librosa
    
    Features extracted:
    - MFCC (Mel-frequency cepstral coefficients)
    - Pitch
    - Energy
    - Zero Crossing Rate
    - Spectral Centroid
    - Spectral Rolloff
    """
    try:
        # Convert bytes to numpy array if needed
        if isinstance(audio_data, bytes):
            audio_data = np.frombuffer(audio_data, dtype=np.float32)
        
        # Ensure audio is float32 with values between -1 and 1
        if audio_data.dtype != np.float32:
            audio_data = audio_data.astype(np.float32) / 32768.0
        
        # Normalize
        audio_data = audio_data / (np.max(np.abs(audio_data)) + 1e-8)
        
        features = {}
        
        # MFCC (13 coefficients)
        mfcc = librosa.feature.mfcc(y=audio_data, sr=sr, n_mfcc=13)
        features['mfcc'] = np.mean(mfcc, axis=1).tolist()
        features['mfcc_std'] = np.std(mfcc, axis=1).tolist()
        
        # Fundamental frequency (pitch)
        F0 = librosa.yin(audio_data, fmin=50, fmax=400, sr=sr, trough_threshold=0.1)
        pitch = np.nanmean(F0)
        features['pitch'] = float(pitch) if not np.isnan(pitch) else 0.0
        features['pitch_std'] = float(np.nanstd(F0)) if not np.isnan(np.nanstd(F0)) else 0.0
        
        # Energy
        energy = np.sum(audio_data ** 2)
        features['energy'] = float(energy)
        
        # Root Mean Square Energy
        rms = librosa.feature.rms(y=audio_data)
        features['rms'] = float(np.mean(rms))
        features['rms_std'] = float(np.std(rms))
        
        # Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(audio_data)
        features['zcr'] = float(np.mean(zcr))
        features['zcr_std'] = float(np.std(zcr))
        
        # Spectral Centroid
        spec_centroid = librosa.feature.spectral_centroid(y=audio_data, sr=sr)
        features['spectral_centroid'] = float(np.mean(spec_centroid))
        features['spectral_centroid_std'] = float(np.std(spec_centroid))
        
        # Spectral Rolloff
        spec_rolloff = librosa.feature.spectral_rolloff(y=audio_data, sr=sr)
        features['spectral_rolloff'] = float(np.mean(spec_rolloff))
        features['spectral_rolloff_std'] = float(np.std(spec_rolloff))
        
        # Tempogram (rhythm-related features)
        onset_strength = librosa.onset.onset_strength(y=audio_data, sr=sr)
        tempogram = librosa.feature.tempogram(onset_envelope=onset_strength, sr=sr)
        features['tempogram_mean'] = float(np.mean(tempogram))
        features['tempogram_std'] = float(np.std(tempogram))
        
        # Chroma features
        chroma = librosa.feature.chroma_cqt(y=audio_data, sr=sr)
        features['chroma_mean'] = np.mean(chroma, axis=1).tolist()
        features['chroma_std'] = np.std(chroma, axis=1).tolist()
        
        # Mel Spectrogram statistics
        mel_spec = librosa.feature.melspectrogram(y=audio_data, sr=sr, n_mels=128)
        features['mel_spec_mean'] = float(np.mean(mel_spec))
        features['mel_spec_std'] = float(np.std(mel_spec))
        
        # Delta (rate of change) features
        if len(mfcc) > 0:
            mfcc_delta = librosa.feature.delta(mfcc)
            features['mfcc_delta_mean'] = np.mean(mfcc_delta, axis=1).tolist()
        
        return features
    
    except Exception as e:
        logger.error(f'Error extracting features: {str(e)}')
        logger.error(traceback.format_exc())
        raise ValueError(f'Feature extraction failed: {str(e)}')

def prepare_features_for_model(features):
    """Convert extracted features to model input format"""
    try:
        # Create feature vector in consistent order
        feature_vector = [
            features.get('pitch', 0),
            features.get('energy', 0),
            features.get('zcr', 0),
            features.get('spectral_centroid', 0),
            features.get('spectral_rolloff', 0),
            features.get('rms', 0),
            np.mean(features.get('mfcc', [0] * 13)),
            np.std(features.get('mfcc', [0] * 13)),
            features.get('tempogram_mean', 0),
            features.get('mel_spec_mean', 0),
            features.get('mel_spec_std', 0),
        ]
        
        return np.array(feature_vector).reshape(1, -1)
    except Exception as e:
        logger.error(f'Error preparing features: {str(e)}')
        raise ValueError(f'Feature preparation failed: {str(e)}')

def make_prediction(features):
    """Make prediction using trained model"""
    global model, scaler
    
    try:
        if model is None:
            # Return dummy prediction if model not loaded
            return {
                'condition': 'healthy',
                'severity': 'none',
                'confidence': 0.7,
                'probability': {
                    'healthy': 0.7,
                    'parkinsons': 0.2,
                    'other': 0.1,
                },
                'explanation': 'Model not loaded - using default prediction',
            }
        
        # Prepare features
        X = prepare_features_for_model(features)
        
        # Scale features if scaler available
        if scaler is not None:
            X = scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X)[0]
        prediction_proba = model.predict_proba(X)[0] if hasattr(model, 'predict_proba') else None
        
        # Map prediction to condition
        condition_map = {0: 'healthy', 1: 'parkinsons', 2: 'other'}
        severity_map = {0: 'none', 1: 'mild', 2: 'moderate', 3: 'severe'}
        
        condition = condition_map.get(int(prediction), 'unknown')
        
        # Determine severity based on confidence
        if condition == 'parkinsons':
            confidence = float(prediction_proba[1]) if prediction_proba is not None else 0.5
            if confidence > 0.8:
                severity = 'severe'
            elif confidence > 0.6:
                severity = 'moderate'
            else:
                severity = 'mild'
        else:
            confidence = float(max(prediction_proba)) if prediction_proba is not None else 0.5
            severity = 'none'
        
        result = {
            'condition': condition,
            'severity': severity,
            'confidence': float(confidence),
            'probability': {
                'healthy': float(prediction_proba[0]) if prediction_proba is not None else 0.5,
                'parkinsons': float(prediction_proba[1]) if prediction_proba is not None and len(prediction_proba) > 1 else 0.3,
                'other': float(prediction_proba[2]) if prediction_proba is not None and len(prediction_proba) > 2 else 0.2,
            },
        }
        
        return result
    
    except Exception as e:
        logger.error(f'Error making prediction: {str(e)}')
        logger.error(traceback.format_exc())
        raise ValueError(f'Prediction failed: {str(e)}')

# ==================== FLASK ROUTES ====================

@app.route('/ml/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Voice Health Detection ML Service',
        'version': MODEL_VERSION,
        'timestamp': datetime.now().isoformat(),
        'model_loaded': model is not None,
    }), 200

@app.route('/ml/extract-features', methods=['POST'])
def extract_features():
    """Extract features from audio file"""
    try:
        # Get audio data
        if 'audio' in request.files:
            audio_file = request.files['audio']
            audio_bytes = audio_file.read()
        elif 'audio' in request.json:
            import base64
            audio_bytes = base64.b64decode(request.json['audio'])
        else:
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Load audio
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=SAMPLE_RATE)
        
        # Extract features
        features = extract_audio_features(y, sr)
        
        return jsonify({
            'success': True,
            'features': features,
            'sample_rate': sr,
            'duration': len(y) / sr,
        }), 200
    
    except Exception as e:
        logger.error(f'Feature extraction error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e),
        }), 400

@app.route('/ml/predict', methods=['POST'])
def predict():
    """Make prediction from features"""
    try:
        data = request.json
        
        if 'features' not in data:
            return jsonify({'error': 'Features not provided'}), 400
        
        features = data['features']
        result = make_prediction(features)
        
        return jsonify({
            'success': True,
            'prediction': result,
            'model_version': MODEL_VERSION,
        }), 200
    
    except Exception as e:
        logger.error(f'Prediction error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e),
        }), 400

@app.route('/ml/analyze', methods=['POST'])
def analyze():
    """
    Complete analysis: extract features and make prediction
    """
    try:
        # Get audio data
        if 'audio' in request.files:
            audio_file = request.files['audio']
            audio_bytes = audio_file.read()
        elif 'audio' in request.json:
            import base64
            audio_bytes = base64.b64decode(request.json['audio'])
        else:
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Load audio
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=SAMPLE_RATE)
        
        # Extract features
        features = extract_audio_features(y, sr)
        
        # Make prediction
        prediction = make_prediction(features)
        
        return jsonify({
            'success': True,
            'features': features,
            'prediction': prediction,
            'model_version': MODEL_VERSION,
            'duration': len(y) / sr,
        }), 200
    
    except Exception as e:
        logger.error(f'Analysis error: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
        }), 400

@app.route('/ml/train', methods=['POST'])
def train():
    """
    Train/retrain model (admin only)
    Note: This is a placeholder - implement actual training logic
    """
    try:
        return jsonify({
            'success': True,
            'message': 'Model training not implemented yet',
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
        }), 400

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    logger.error(f"404 Not Found: {request.method} {request.url}")
    return jsonify({
        'success': False,
        'error': f'Endpoint not found: {request.method} {request.path}',
    }), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error',
    }), 500

if __name__ == '__main__':
    # Load models
    load_models()
    
    # Run Flask app
    port = int(os.environ.get('ML_SERVICE_PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', False)
    
    logger.info(f'Starting ML Service on port {port}...')
    
    # Print all registered routes for debugging
    print("\n📍 Registered ML Routes:")
    for rule in app.url_map.iter_rules():
        methods = ','.join(rule.methods - {'HEAD', 'OPTIONS'})
        print(f"   {methods} {rule.rule}")
    print("\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
