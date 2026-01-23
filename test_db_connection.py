"""
Test MongoDB Database Connection
Quick script to verify MongoDB Atlas connection is working
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

async def test_database_connection():
    """Test MongoDB connection"""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        
        mongo_url = os.getenv('MONGODB_URL')
        db_name = os.getenv('MONGODB_DB_NAME', 'voice_health_detection')
        
        print("=" * 60)
        print("TESTING MONGODB CONNECTION")
        print("=" * 60)
        print(f"\nMongoDB URL: {mongo_url[:50]}..." if len(mongo_url) > 50 else f"\nMongoDB URL: {mongo_url}")
        print(f"Database Name: {db_name}")
        print("\nConnecting...")
        
        # Create client
        client = AsyncIOMotorClient(mongo_url)
        
        # Get database
        db = client[db_name]
        
        # Test connection with ping
        await db.command('ping')
        
        print("✅ SUCCESS: Connected to MongoDB!")
        
        # List collections
        collections = await db.list_collection_names()
        print(f"\nExisting collections: {collections if collections else 'None (database is empty)'}")
        
        # Close connection
        client.close()
        print("\n✅ Connection test passed!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to connect to MongoDB")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("\nPossible issues:")
        print("1. Check MongoDB Atlas cluster is not paused")
        print("2. Verify IP address is whitelisted (or use 0.0.0.0/0 for testing)")
        print("3. Check username and password are correct")
        print("4. Ensure network connection is stable")
        print("=" * 60)
        return False

if __name__ == "__main__":
    result = asyncio.run(test_database_connection())
    sys.exit(0 if result else 1)
