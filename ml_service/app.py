"""
FastAPI ML Service for Voice Health Detection
Provides REST API endpoints for voice feature extraction and Parkinson's disease prediction.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import os
import tempfile
import uvicorn

from feature_extraction import extract_voice_features
from model_inference import get_model_instance, predict_from_features


# Initialize FastAPI app
app = FastAPI(
    title="Voice Health Detection ML Service",
    description="ML service for extracting voice features and predicting Parkinson's disease",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
model_instance = None


@app.on_event("startup")
async def startup_event():
    """Load ML model on service startup."""
    global model_instance
    print("\n" + "="*60)
    print("Starting ML Service...")
    print("="*60)
    
    try:
        model_instance = get_model_instance()
        print("\n[OK] ML Service ready!")
    except Exception as e:
        print(f"\n[ERROR] Failed to load model: {e}")
        print("Service will start but predictions will fail.")


# Pydantic models for request/response
class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
    message: Optional[str] = None


class FeaturesResponse(BaseModel):
    success: bool
    features: Optional[Dict[str, float]] = None
    error: Optional[str] = None


class PredictionRequest(BaseModel):
    features: Dict[str, float]


class PredictionResponse(BaseModel):
    success: bool
    prediction: Optional[Dict] = None
    error: Optional[str] = None


class AnalysisResponse(BaseModel):
    success: bool
    features: Optional[Dict[str, float]] = None
    prediction: Optional[Dict] = None
    error: Optional[str] = None


# API Endpoints

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - returns service info."""
    return {
        "status": "online",
        "model_loaded": model_instance is not None and model_instance.is_loaded,
        "version": "1.0.0",
        "message": "Voice Health Detection ML Service"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    is_healthy = model_instance is not None and model_instance.is_loaded
    
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "model_loaded": is_healthy,
        "version": "1.0.0",
        "message": "Model loaded and ready" if is_healthy else "Model not loaded"
    }


@app.post("/extract-features", response_model=FeaturesResponse)
async def extract_features(file: UploadFile = File(...)):
    """
    Extract voice features from uploaded audio file.
    
    Accepts: wav, mp3, m4a, flac, ogg
    Returns: 22 acoustic features
    """
    temp_file_path = None
    
    try:
        # Validate file extension
        allowed_extensions = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save uploaded file to temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Extract features
        features = extract_voice_features(temp_file_path)
        
        if features is None:
            raise HTTPException(
                status_code=500,
                detail="Feature extraction failed. Audio file may be corrupted or invalid."
            )
        
        return {
            "success": True,
            "features": features
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Make prediction from extracted features.
    
    Expects: Dictionary of 22 voice features
    Returns: Prediction result with condition, confidence, severity, recommendations
    """
    try:
        if model_instance is None or not model_instance.is_loaded:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Service unavailable."
            )
        
        # Make prediction
        prediction = predict_from_features(request.features)
        
        if prediction is None:
            raise HTTPException(
                status_code=500,
                detail="Prediction failed. Invalid features or model error."
            )
        
        return {
            "success": True,
            "prediction": prediction
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_audio(file: UploadFile = File(...)):
    """
    Complete analysis pipeline: Extract features + Make prediction.
    
    Accepts: Audio file (wav, mp3, m4a, flac, ogg)
    Returns: Both features and prediction result
    """
    temp_file_path = None
    
    try:
        # Validate file extension
        allowed_extensions = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check model status
        if model_instance is None or not model_instance.is_loaded:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Service unavailable."
            )
        
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Step 1: Extract features
        features = extract_voice_features(temp_file_path)
        
        if features is None:
            raise HTTPException(
                status_code=500,
                detail="Feature extraction failed"
            )
        
        # Step 2: Make prediction
        prediction = predict_from_features(features)
        
        if prediction is None:
            raise HTTPException(
                status_code=500,
                detail="Prediction failed"
            )
        
        return {
            "success": True,
            "features": features,
            "prediction": prediction
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass


if __name__ == "__main__":
    # Run the service
    print("\n" + "="*60)
    print("Starting Voice Health Detection ML Service")
    print("="*60)
    print("\nEndpoints:")
    print("  GET  /         - Service info")
    print("  GET  /health   - Health check")
    print("  POST /extract-features - Extract voice features from audio")
    print("  POST /predict  - Predict from features")
    print("  POST /analyze  - Complete analysis (features + prediction)")
    print("\n" + "="*60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5001,
        log_level="info"
    )

