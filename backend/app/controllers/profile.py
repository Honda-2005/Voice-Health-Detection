from fastapi import APIRouter, Depends, HTTPException, Body
from backend.app.utils.deps import get_current_user
from backend.app.core.database import db
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    occupation: Optional[str] = None
    healthConditions: Optional[str] = None

@router.get("/")
async def get_profile(current_user = Depends(get_current_user)):
    # Structure matches what profile.js expects in fetchUserData (roughly)
    # but strictly following the current_user object
    
    # Mock stats for now as we don't have aggregation yet
    stats = {
        "totalRecordings": await db.get_db().recordings.count_documents({"user_id": str(current_user["_id"])}),
        "daysActive": 0, # To be implemented with date logic
        "joinDate": current_user.get("createdAt", "")[:10] if current_user.get("createdAt") else ""
    }
    
    return {
        "id": str(current_user["_id"]),
        "fullName": current_user["fullName"],
        "email": current_user["email"],
        "phone": current_user.get("phone"),
        "age": current_user.get("age"),
        "gender": current_user.get("gender"),
        "location": current_user.get("location"),
        "occupation": current_user.get("occupation"),
        "healthConditions": current_user.get("healthConditions"),
        "stats": stats,
        "settings": current_user.get("settings", {
            "notifications": True,
            "theme": "light",
            "language": "en"
        })
    }

@router.put("/")
async def update_profile(
    profile_data: ProfileUpdate,
    current_user = Depends(get_current_user)
):
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    
    if update_data:
        await db.get_db().users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
    
    # Return updated profile data (simulated by just returning input + existing)
    return {**update_data}

@router.delete("/")
async def delete_account(current_user = Depends(get_current_user)):
    await db.get_db().users.delete_one({"_id": current_user["_id"]})
    return {"message": "Account deleted"}
