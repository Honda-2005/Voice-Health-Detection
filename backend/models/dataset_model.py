"""
Dataset Model - Pydantic schemas for dataset storage and retrieval
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from bson import ObjectId

class DatasetMetadata(BaseModel):
    """Metadata for a reference dataset"""
    source: str = Field(..., description="Source of the dataset (e.g., 'UCI')")
    dataset_id: str = Field(..., description="Original dataset ID")
    name: str = Field(..., description="Dataset name")
    version: str = Field(default="v1.0", description="Dataset version")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None
    feature_names: List[str] = Field(default_factory=list)
    normalization_method: str = Field(..., description="Method used for normalization (e.g., 'min-max', 'z-score')")
    normalization_params: Dict[str, Dict[str, float]] = Field(default_factory=dict, description="Parameters used for normalization")

class ReferenceVector(BaseModel):
    """A single reference data point (row)"""
    id: Optional[str] = Field(None, alias="_id")
    dataset_source: str
    original_id: Optional[str] = None
    feature_vector: Dict[str, float] = Field(..., description="Raw feature values")
    normalized_vector: Dict[str, float] = Field(..., description="Normalized feature values")
    label: str = Field(..., description="Class label (e.g., 'Health', 'Parkinsons')")
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
