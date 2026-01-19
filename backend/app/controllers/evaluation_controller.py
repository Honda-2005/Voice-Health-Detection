"""
Evaluation Controller
Endpoints for model performance metrics
"""

from fastapi import APIRouter, Depends, HTTPException
from backend.app.utils.deps import get_current_user
from backend.app.services.evaluation_service import evaluation_service
from typing import Dict

router = APIRouter()


@router.get("/")
async def get_evaluation_metrics(current_user = Depends(get_current_user)) -> Dict:
    """
    Get model evaluation metrics
    
    Returns model performance metrics including:
    - Accuracy
    - Precision
    - Recall
    - F1 Score
    - Confusion Matrix
    
    Protected endpoint - requires authentication
    """
    try:
        metrics = evaluation_service.get_metrics()
        return metrics
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail="Evaluation metrics not found. Please train the model first."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving metrics: {str(e)}"
        )


@router.get("/status")
async def get_model_status(current_user = Depends(get_current_user)) -> Dict:
    """
    Get model status and information
    
    Returns:
        Model status including whether it's loaded, metrics availability, etc.
    """
    try:
        status = evaluation_service.get_model_status()
        return status
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving model status: {str(e)}"
        )
