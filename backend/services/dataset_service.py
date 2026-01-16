"""
Dataset Service - Manages retrieval of reference datasets
Intended for internal use by Person 2's components.
NO ML Logic here.
"""

from typing import List, Optional, Dict
from backend.database.mongodb import MongoDB
from backend.models.dataset_model import ReferenceVector, DatasetMetadata
import json
import os

class DatasetService:
    """
    Service to access reference datasets.
    """

    @staticmethod
    def get_collection():
        """Get the voice_reference_data collection"""
        return MongoDB.get_collection("voice_reference_data")

    @staticmethod
    async def get_reference_vectors(
        source: str = "UCI", 
        limit: int = 1000,
        label: Optional[str] = None
    ) -> List[ReferenceVector]:
        """
        Retrieve reference vectors from the database.
        
        Args:
            source: Dataset source filter
            limit: Maximum number of records to return
            label: Optional filter by class label
            
        Returns:
            List of ReferenceVector objects
        """
        collection = DatasetService.get_collection()
        
        query = {"dataset_source": source}
        if label:
            query["label"] = label
            
        cursor = collection.find(query).limit(limit)
        
        vectors = []
        async for doc in cursor:
            # Convert ObjectId to str for Pydantic
            doc["_id"] = str(doc["_id"])
            vectors.append(ReferenceVector(**doc))
            
        return vectors

    @staticmethod
    async def get_normalization_params(dataset_name: str = "parkinsons_raw") -> Dict:
        """
        Retrieve normalization parameters from the stored JSON stats.
        
        Args:
            dataset_name: Name of the dataset file (without extension)
            
        Returns:
            Dictionary containing normalization parameters (mean/std or min/max)
        """
        # This assumes stats are stored in a predictable location
        # In a production system, these might be in a separate collection
        stats_path = f"backend/data/datasets/{dataset_name.replace('_raw', '')}_stats.json"
        
        if not os.path.exists(stats_path):
            # Fallback or error
            raise FileNotFoundError(f"Statistics file not found at {stats_path}")
            
        with open(stats_path, 'r') as f:
            stats = json.load(f)
            
        return stats.get("normalization_params", {})

    @staticmethod
    def get_feature_schema(dataset_name: str = "parkinsons_raw") -> List[str]:
        """
        Get the list of features expected in the dataset.
        """
        stats_path = f"backend/data/datasets/{dataset_name.replace('_raw', '')}_stats.json"
        
        if not os.path.exists(stats_path):
             raise FileNotFoundError(f"Statistics file not found at {stats_path}")
            
        with open(stats_path, 'r') as f:
            stats = json.load(f)
            
        return stats.get("feature_names", [])
