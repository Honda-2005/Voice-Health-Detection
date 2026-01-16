"""
Authentication Middleware - JWT token validation and user authentication
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.utils.security import decode_token
from backend.services.auth_service import AuthService
from typing import Optional

# HTTP Bearer security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Dependency to get the current authenticated user from JWT token
    
    Args:
        credentials: HTTP Authorization credentials (Bearer token)
        
    Returns:
        Current user data from database
        
    Raises:
        401: Invalid or expired token
        401: User not found
    """
    token = credentials.credentials
    
    # Decode and verify token
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Get user_id from token
    user_id: str = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Get user from database
    user = await AuthService.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[dict]:
    """
    Dependency to get the current user if authenticated, otherwise None
    
    Useful for endpoints that change behavior based on authentication status
    but don't require authentication.
    
    Args:
        credentials: Optional HTTP Authorization credentials
        
    Returns:
        Current user data or None if not authenticated
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
