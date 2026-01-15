"""
Profile Controller - API endpoints for user profile management
"""

from fastapi import APIRouter, HTTPException, status, Depends
from backend.models.user_model import UserUpdate, UserResponse
from backend.services.auth_service import AuthService
from backend.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])


@router.get("", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get user profile
    
    Requires authentication via Bearer token.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User profile data
    """
    return UserResponse(**{**current_user, "_id": str(current_user["_id"])})


@router.put("", response_model=UserResponse)
async def update_profile(
    profile_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile
    
    Requires authentication via Bearer token.
    Only updates provided fields (partial update supported).
    
    Args:
        profile_data: Profile data to update
        current_user: Current authenticated user
        
    Returns:
        Updated user profile
        
    Raises:
        500: Update failed
    """
    try:
        # Get only the fields that were provided
        update_data = profile_data.dict(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided for update"
            )
        
        # Update user
        updated_user = await AuthService.update_user(
            str(current_user["_id"]),
            update_data
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        return UserResponse(**{**updated_user, "_id": str(updated_user["_id"])})
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )


@router.delete("")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    Delete user account
    
    Requires authentication via Bearer token.
    This action is permanent and cannot be undone.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Success message
        
    Raises:
        500: Deletion failed
    """
    try:
        deleted = await AuthService.delete_user(str(current_user["_id"]))
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete account"
            )
        
        return {
            "message": "Account deleted successfully"
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account deletion failed: {str(e)}"
        )
