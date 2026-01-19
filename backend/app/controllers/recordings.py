from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from backend.app.utils.deps import get_current_user
from backend.app.core.database import db
import shutil
import os
from datetime import datetime
from bson import ObjectId

router = APIRouter()

UPLOAD_DIR = "backend/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/submit")
async def submit_recording(
    audio: UploadFile = File(...),
    timestamp: str = Form(...),
    duration: float = Form(...),
    current_user = Depends(get_current_user)
):
    """
    Submit audio recording for voice health analysis
    
    This endpoint:
    1. Saves the uploaded audio file
    2. Validates audio format and quality
    3. Extracts voice features
    4. Runs ML prediction
    5. Stores results in database
    
    Returns:
        Success response with recording ID
    """
    from backend.app.services.prediction_service import prediction_service
    from backend.app.services.audio_service import AudioValidationError
    from backend.app.models.prediction_model import PredictionModelError
    
    # Secure filename
    safe_filename = f"{current_user['_id']}_{int(datetime.now().timestamp())}_{audio.filename}"
    file_location = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save uploaded file
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
    
    try:
        # Validate audio file
        validation_result = prediction_service.validate_and_process_audio(file_location)
        
        # Generate prediction using real ML model
        prediction_result = prediction_service.generate_prediction(file_location)
        
        # Create recording document
        recording_id = ObjectId()
        recording_doc = {
            "_id": recording_id,
            "user_id": str(current_user["_id"]),
            "filename": safe_filename,
            "path": file_location,
            "original_filename": audio.filename,
            "timestamp": timestamp,
            "duration": duration,
            "content_type": audio.content_type,
            "status": "processed",
            "validation": validation_result,
            "created_at": datetime.utcnow()
        }
        
        await db.get_db().recordings.insert_one(recording_doc)
        
        # Create result document with real prediction
        result_doc = prediction_service.create_result_document(
            prediction_result=prediction_result,
            user_id=str(current_user["_id"]),
            recording_id=str(recording_id),
            timestamp=timestamp,
            duration=duration,
            environment="Quiet Room"  # Could be enhanced to detect from audio
        )
        
        await db.get_db().results.insert_one(result_doc)
        
        return {
            "success": True,
            "recordingId": str(recording_id),
            "message": "Recording analyzed successfully",
            "prediction": {
                "status": prediction_result['status'],
                "healthScore": prediction_result['health_score'],
                "confidence": prediction_result['confidence']
            }
        }
        
    except AudioValidationError as e:
        # Clean up file if validation fails
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=400, detail=str(e))
    
    except PredictionModelError as e:
        # Clean up file if prediction fails
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
    
    except Exception as e:
        # Clean up file if anything fails
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

