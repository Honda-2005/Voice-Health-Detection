from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Any
import os

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "Voice Health Detection"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    PROJECT_NAME: str = "Voice Health Detection API"
    API_V1_STR: str = "/api"
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "voice_health_detection"
    MONGO_INITDB_DATABASE: str = "voice_health_db"
    
    # Security - MUST be set in .env for production
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    )
    JWT_SECRET_KEY: str = Field(default=None) # Allow loading from .env
    
    # Map .env names to class attributes if needed, or just add them
    ALGORITHM: str = "HS256" # Internal name
    JWT_ALGORITHM: str = "HS256" # .env name
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    JWT_EXPIRATION_MINUTES: int = 1440
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["*"]
    
    # ML Model paths
    MODEL_PATH: str = "ml_training/models/parkinson_voice_model.pkl"
    SCALER_PATH: str = "ml_training/models/scaler.pkl"
    
    # Audio upload configuration
    MAX_AUDIO_SIZE_MB: int = 10
    ALLOWED_AUDIO_FORMATS: str = "wav,webm,mp3,ogg"
    MIN_AUDIO_DURATION_SEC: int = 15
    MAX_AUDIO_DURATION_SEC: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
