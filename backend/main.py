"""
FastAPI Main Application
Voice Health Detection - Authentication & User Management System
Person 1 Implementation
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database
from backend.database.mongodb import MongoDB

# Import controllers
from backend.controllers.auth_controller import router as auth_router
from backend.controllers.profile_controller import router as profile_router

# Import middleware
from backend.middleware.cors import setup_cors
from backend.middleware.error_handler import add_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    print("🚀 Starting Voice Health Detection API...")
    await MongoDB.connect_to_database()
    print("✅ Application startup complete")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Voice Health Detection API...")
    await MongoDB.close_database_connection()
    print("✅ Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Voice Health Detection API",
    description="Authentication & User Management System - Person 1 Implementation",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Setup CORS
setup_cors(app)

# Add exception handlers
add_exception_handlers(app)

# Register routers
app.include_router(auth_router)
app.include_router(profile_router)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Voice Health Detection API",
        "version": "1.0.0",
        "status": "online",
        "person": "Person 1 - Authentication & User Management"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db = MongoDB.get_database()
        await db.command('ping')
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "timestamp": os.getenv("APP_VERSION", "1.0.0")
    }


if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    # Run the application
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
