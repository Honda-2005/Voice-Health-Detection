"""
MongoDB Database Connection Manager
Handles async MongoDB connection using Motor driver
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

class MongoDB:
    """MongoDB connection manager"""
    
    client: AsyncIOMotorClient = None
    database: AsyncIOMotorDatabase = None

    @classmethod
    async def connect_to_database(cls):
        """Establish connection to MongoDB"""
        try:
            mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            db_name = os.getenv("MONGODB_DB_NAME", "voice_health_detection")
            
            cls.client = AsyncIOMotorClient(mongodb_url)
            cls.database = cls.client[db_name]
            
            # Test connection
            await cls.client.admin.command('ping')
            print(f"✅ Successfully connected to MongoDB: {db_name}")
            
        except ConnectionFailure as e:
            print(f"❌ Could not connect to MongoDB: {e}")
            raise e

    @classmethod
    async def close_database_connection(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("✅ MongoDB connection closed")

    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if cls.database is None:
            raise Exception("Database not connected. Call connect_to_database first.")
        return cls.database

    @classmethod
    def get_collection(cls, collection_name: str):
        """Get a specific collection from the database"""
        db = cls.get_database()
        return db[collection_name]


# Convenience functions
async def get_db() -> AsyncIOMotorDatabase:
    """Dependency to get database instance"""
    return MongoDB.get_database()


def get_users_collection():
    """Get users collection"""
    return MongoDB.get_collection("users")


def get_predictions_collection():
    """Get predictions collection"""
    return MongoDB.get_collection("predictions")


def get_history_collection():
    """Get history collection"""
    return MongoDB.get_collection("history")
