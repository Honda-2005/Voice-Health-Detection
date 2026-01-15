"""
Authentication Service - Business logic for user registration and authentication
"""

from datetime import datetime
from typing import Optional
from bson import ObjectId
from backend.models.user_model import UserCreate, UserInDB, UserResponse
from backend.utils.security import hash_password, verify_password, create_access_token
from backend.database.mongodb import get_users_collection
from fastapi import HTTPException, status


class AuthService:
    """Service class for authentication operations"""
    
    @staticmethod
    async def register_user(user_data: UserCreate) -> dict:
        """
        Register a new user
        
        Args:
            user_data: User registration data
            
        Returns:
            Created user data with access token
            
        Raises:
            HTTPException: If user already exists
        """
        users_collection = get_users_collection()
        
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user document
        user_in_db = UserInDB(
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            full_name=user_data.full_name,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Insert user into database
        user_dict = user_in_db.dict(by_alias=True, exclude={"id"})
        result = await users_collection.insert_one(user_dict)
        
        # Get the created user
        created_user = await users_collection.find_one({"_id": result.inserted_id})
        
        # Create access token
        access_token = create_access_token(
            data={"user_id": str(created_user["_id"]), "email": created_user["email"]}
        )
        
        return {
            "user": UserResponse(**{**created_user, "_id": str(created_user["_id"])}),
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> dict:
        """
        Authenticate a user
        
        Args:
            email: User email
            password: User password
            
        Returns:
            User data with access token
            
        Raises:
            HTTPException: If credentials are invalid
        """
        users_collection = get_users_collection()
        
        # Find user by email
        user = await users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Verify password
        if not verify_password(password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Create access token
        access_token = create_access_token(
            data={"user_id": str(user["_id"]), "email": user["email"]}
        )
        
        return {
            "user": UserResponse(**{**user, "_id": str(user["_id"])}),
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[dict]:
        """
        Get user by ID
        
        Args:
            user_id: User ID
            
        Returns:
            User data or None if not found
        """
        users_collection = get_users_collection()
        
        try:
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            return user
        except Exception:
            return None
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[dict]:
        """
        Get user by email
        
        Args:
            email: User email
            
        Returns:
            User data or None if not found
        """
        users_collection = get_users_collection()
        user = await users_collection.find_one({"email": email})
        return user
    
    @staticmethod
    async def update_user(user_id: str, update_data: dict) -> Optional[dict]:
        """
        Update user profile
        
        Args:
            user_id: User ID
            update_data: Data to update
            
        Returns:
            Updated user data or None if not found
        """
        users_collection = get_users_collection()
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Update user
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return None
        
        # Get updated user
        updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        return updated_user
    
    @staticmethod
    async def delete_user(user_id: str) -> bool:
        """
        Delete user account
        
        Args:
            user_id: User ID
            
        Returns:
            True if deleted, False otherwise
        """
        users_collection = get_users_collection()
        
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
