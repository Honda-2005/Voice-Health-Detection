from fastapi import APIRouter, HTTPException, Depends, status, Body
from backend.app.models.user import UserCreate, UserLogin, Token
from backend.app.core.database import db
from backend.app.utils.security import get_password_hash, verify_password, create_access_token
from backend.app.core.config import settings
from backend.app.utils.deps import get_current_user
from datetime import datetime

router = APIRouter()

@router.post("/register", response_model=dict)
async def register(user: UserCreate):
    existing_user = await db.get_db().users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    user_dict = user.dict(by_alias=True)
    user_dict["password_hash"] = get_password_hash(user_dict.pop("password"))
    
    new_user = await db.get_db().users.insert_one(user_dict)
    
    return {
        "success": True,
        "message": "Registration successful",
        "userId": str(new_user.inserted_id)
    }

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    user = await db.get_db().users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(subject=str(user["_id"]))
    
    user_response = {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["fullName"],
        "role": user.get("role", "user"),
        "age": user.get("age"),
        "gender": user.get("gender")
    }
    
    return {
        "token": access_token,
        "expiresIn": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000, 
        "user": user_response
    }

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}

@router.get("/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "name": current_user["fullName"],
        "role": current_user.get("role", "user"),
        "age": current_user.get("age"),
        "gender": current_user.get("gender")
    }
