from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import db

from backend.app.controllers import auth, profile, recordings, results
from backend.app.controllers import evaluation_controller

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Handing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    """Initialize database and load ML model on startup"""
    db.connect()
    
    # Load ML model
    try:
        from backend.app.models.prediction_model import prediction_model
        print("Loading ML model...")
        prediction_model.load_model()
        print("[OK] ML model loaded successfully!")
    except Exception as e:
        print(f"[WARNING] Could not load ML model: {e}")
        print("   Please train the model: python -m ml_training.dataset.train")

@app.on_event("shutdown")
async def shutdown_db_client():
    db.close()

@app.get("/")
async def root():
    return {"message": "Voice Health Detection API is running"}

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])
app.include_router(recordings.router, prefix="/api/recordings", tags=["Recordings"])
app.include_router(results.router, prefix="/api", tags=["Results"]) # /api/history and /api/results
app.include_router(evaluation_controller.router, prefix="/api/evaluation", tags=["Evaluation"])

