"""
Quick Start Server Script
Starts the FastAPI backend server with proper configuration
"""

import uvicorn
import sys
from pathlib import Path

# Add backend/app to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

if __name__ == "__main__":
    print("=" * 60)
    print("STARTING VOICE HEALTH DETECTION API SERVER")
    print("=" * 60)
    print("\nServer will start on: http://localhost:8000")
    print("API Documentation: http://localhost:8000/api/docs")
    print("Health Check: http://localhost:8000/api/health")
    print("\nPress CTRL+C to stop the server")
    print("=" * 60)
    print()
    
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
