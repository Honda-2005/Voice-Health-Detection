"""
Authentication Controller - API endpoints for user authentication
"""

from fastapi import APIRouter, HTTPException, status, Depends
from backend.models.user_model import UserCreate, UserLogin, UserResponse, Token
from backend.services.auth_service import AuthService
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user
    
    Args:
        user_data: User registration data (email, password, full_name)
        
    Returns:
        User data with access token
        
    Raises:
        400: Email already registered
        422: Validation error
    """
    try:
        result = await AuthService.register_user(user_data)
        return {
            "message": "User registered successfully",
            "user": result["user"],
            "access_token": result["access_token"],
            "token_type": result["token_type"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=dict)
async def login(credentials: UserLogin):
    """
    User login
    
    Args:
        credentials: User login credentials (email, password)
        
    Returns:
        User data with access token
        
    Raises:
        401: Invalid credentials
    """
    try:
        result = await AuthService.authenticate_user(
            credentials.email,
            credentials.password
        )
        return {
            "message": "Login successful",
            "user": result["user"],
            "access_token": result["access_token"],
            "token_type": result["token_type"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    User logout
    
    Note: With JWT, logout is handled client-side by removing the token.
    This endpoint is provided for consistency and can be used to invalidate
    tokens in a token blacklist system if implemented in the future.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    return {
        "message": "Logout successful. Please remove the token from client storage."
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information
    
    Requires authentication via Bearer token.
    
    Args:
        current_user: Current authenticated user (injected by dependency)
        
    Returns:
        Current user data
        
    Raises:
        401: Unauthorized - Invalid or missing token
    """
    return UserResponse(**{**current_user, "_id": str(current_user["_id"])})
