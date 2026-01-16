"""
Dataset Loader Script
Fetches Parkinson's Disease datasets from UCI Machine Learning Repository,
cleans, normalizes, and stores them in MongoDB and JSON files.

Datasets:
1. Parkinson's (ID: 174)
2. Parkinson's Telemonitoring (ID: 189) - Optional/Secondary

Usage:
    python backend/scripts/load_datasets.py
"""

import sys
import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Any

import pandas as pd
import numpy as np
from ucimlrepo import fetch_ucirepo
from sklearn.preprocessing import MinMaxScaler
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.models.dataset_model import ReferenceVector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

DATA_DIR = "backend/data/datasets"
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "voice_health_detection")

async def get_database():
    client = AsyncIOMotorClient(MONGODB_URL)
    return client[DB_NAME]

def process_parkinsons_dataset():
    """
    Fetch and process the primary Parkinson's dataset (ID: 174).
    """
    logger.info("Fetching Parkinson's dataset (ID: 174)...")
    
    try:
        parkinsons = fetch_ucirepo(id=174)
        
        # Get data and targets
        X = parkinsons.data.features
        y = parkinsons.data.targets
        
        # Combine into one dataframe for cleaning
        df = pd.concat([X, y], axis=1)
        
        # 1. Cleaning
        initial_count = len(df)
        df = df.dropna()
        df = df.drop_duplicates()
        cleaned_count = len(df)
        
        logger.info(f"Cleaned dataset: {initial_count} -> {cleaned_count} records")
        
        # 2. Rename columns to be code-friendly if necessary
        # The UCI dataset usually has 'status' as the target (1=Parkinson's, 0=Healthy)
        if 'status' in df.columns:
            df = df.rename(columns={'status': 'label'})
            
        feature_cols = [c for c in df.columns if c != 'name' and c != 'label']
        
        # 3. Save Raw Data
        raw_path = os.path.join(DATA_DIR, "parkinsons_raw.json")
        df.to_json(raw_path, orient="records", indent=2)
        logger.info(f"Saved raw data to {raw_path}")
        
        # 4. Normalization
        scaler = MinMaxScaler()
        df_normalized = df.copy()
        df_normalized[feature_cols] = scaler.fit_transform(df[feature_cols])
        
        # 5. Statistics & Params
        stats = {
            "dataset_name": "parkinsons",
            "version": "v1.0",
            "created_at": datetime.utcnow().isoformat(),
            "feature_names": feature_cols,
            "normalization_method": "min-max",
            "normalization_params": {
                "min": pd.Series(scaler.data_min_, index=feature_cols).to_dict(),
                "max": pd.Series(scaler.data_max_, index=feature_cols).to_dict(),
                "scale": pd.Series(scaler.scale_, index=feature_cols).to_dict(),
                "min_max_raw": { # Store raw min/max for simpler reference
                    col: {
                        "min": float(df[col].min()),
                        "max": float(df[col].max()),
                        "mean": float(df[col].mean()),
                        "std": float(df[col].std())
                    } for col in feature_cols
                }
            },
            "record_count": cleaned_count
        }
        
        stats_path = os.path.join(DATA_DIR, "parkinsons_stats.json")
        with open(stats_path, 'w') as f:
            json.dump(stats, f, indent=2)
        logger.info(f"Saved stats to {stats_path}")
        
        # 6. Save Cleaned (Normalized) Data
        clean_path = os.path.join(DATA_DIR, "parkinsons_clean.json")
        df_normalized.to_json(clean_path, orient="records", indent=2)
        logger.info(f"Saved clean/normalized data to {clean_path}")
        
        return df, df_normalized, stats
        
    except Exception as e:
        logger.error(f"Error processing dataset: {e}")
        raise

async def store_to_mongodb(df_raw, df_norm, stats):
    """
    Store the processed data into MongoDB.
    """
    logger.info("Storing data to MongoDB...")
    db = await get_database()
    collection = db.voice_reference_data
    
    # Optional: Clear existing data for this source to avoid duplicates on re-run
    await collection.delete_many({"dataset_source": "UCI_Parkinsons_174"})
    
    documents = []
    
    # We iterate over the normalized dataframe, but also pull raw values
    # Assuming df_raw and df_norm are aligned (which they are unless re-sorted)
    
    # Ensure indexes align
    df_raw = df_raw.reset_index(drop=True)
    df_norm = df_norm.reset_index(drop=True)
    
    feature_names = stats["feature_names"]
    
    for idx, row in df_norm.iterrows():
        # Construct the document
        
        # Extract features
        norm_vector = row[feature_names].to_dict()
        raw_vector = df_raw.iloc[idx][feature_names].to_dict()
        
        # Determine label (1=Parkinsons, 0=Healthy)
        label_val = row.get('label', 0)
        label_str = "Parkinsons" if label_val == 1 else "Healthy"
        
        doc = ReferenceVector(
            dataset_source="UCI_Parkinsons_174",
            feature_vector=raw_vector,
            normalized_vector=norm_vector,
            label=label_str,
            metadata={
                "original_record_index": int(idx),
                "name": df_raw.iloc[idx].get("name", "unknown")
            }
        )
        
        documents.append(doc.dict(by_alias=True, exclude={"id"}))
    
    if documents:
        result = await collection.insert_many(documents)
        logger.info(f"Inserted {len(result.inserted_ids)} records into MongoDB")
            
        # Create indexes
        await collection.create_index("dataset_source")
        await collection.create_index("label")
    else:
        logger.warning("No documents to insert")

async def main():
    try:
        # Create directory if not exists
        os.makedirs(DATA_DIR, exist_ok=True)
        
        # Process Logic
        df_raw, df_norm, stats = process_parkinsons_dataset()
        
        # Database Storage
        await store_to_mongodb(df_raw, df_norm, stats)
        
        logger.info("Dataset loading completed successfully!")
        
    except Exception as e:
        logger.error(f"Script failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
