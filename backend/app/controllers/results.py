from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.utils.deps import get_current_user
from backend.app.core.database import db
from bson import ObjectId
from typing import List

router = APIRouter()

@router.get("/history")
async def get_history(
    page: int = 1,
    limit: int = 100,
    status: str = None,
    current_user = Depends(get_current_user)
):
    """
    Get user's recording history with optional filtering and pagination
    
    Args:
        page: Page number (default: 1)
        limit: Results per page (default: 100, max: 100)
        status: Filter by status ('normal', 'warning', 'alert', or None for all)
        
    Returns:
        List of prediction results for the authenticated user
    """
    # Build query
    query = {"user_id": str(current_user["_id"])}
    
    # Add status filter if provided
    if status and status in ['normal', 'warning', 'alert']:
        query["overallResult.status"] = status
    
    # Calculate skip for pagination
    limit = min(limit, 100)  # Cap at 100
    skip = (page - 1) * limit
    
    # Fetch results with pagination
    cursor = db.get_db().results.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    results = await cursor.to_list(length=limit)
    
    # Map to frontend expected format for history
    history_records = []
    for r in results:
        info = r.get("recordingInfo", {})
        
        history_records.append({
            "id": r.get("recording_id") or str(r["_id"]),
            "timestamp": r["timestamp"],
            "status": r["overallResult"]["status"],
            "healthScore": r["healthScore"],
            "confidence": r["confidence"],
            "duration": info.get("duration", 0),
            "environment": info.get("environment", "Unknown"),
            "features": {
                "pitchStability": r.get("metrics", {}).get("pitchStability", {}).get("value"),
                "voiceClarity": r.get("metrics", {}).get("voiceClarity", {}).get("value"),
                "breathControl": r.get("metrics", {}).get("breathControl", {}).get("value"),
                "consistency": r.get("metrics", {}).get("consistency", {}).get("value"),
            }
        })
    
    return history_records

@router.get("/results/{result_id}")
async def get_result(result_id: str, current_user = Depends(get_current_user)):
    # result_id coming from frontend is likely the recording_id or the result _id.
    # In my recordings.py, I returned recordingId. 
    # recorder.js redirects to prediction_result.html?id=rec_... (which is recordingId)
    # So we search by recording_id first.
    
    result = await db.get_db().results.find_one({
        "recording_id": result_id,
        "user_id": str(current_user["_id"])
    })
    
    if not result:
        # Try finding by _id if it's not a recording id
        is_valid_oid = ObjectId.is_valid(result_id)
        if is_valid_oid:
             result = await db.get_db().results.find_one({
                "_id": ObjectId(result_id),
                "user_id": str(current_user["_id"])
            })
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
        
    # Process result for frontend (remove _id to avoid issues if any)
    result["id"] = str(result.pop("_id"))
    return result
