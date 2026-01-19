# Voice Health Detection Backend

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

**Important**: Change the `SECRET_KEY` in production!

### 3. Start MongoDB

```bash
# Using Docker
docker-compose up -d mongodb

# Or local MongoDB
mongod --dbpath /path/to/data
```

### 4. Train ML Model

Before running the API, train the machine learning model:

```bash
cd "path/to/Voice-Health-Detection"
python -m ml_training.dataset.train
```

This will:
- Load or generate Parkinson's dataset
- Train a Random Forest classifier
- Save model to `ml_training/models/parkinson_voice_model.pkl`
- Save scaler to `ml_training/models/scaler.pkl`
- Save metrics to `ml_training/models/evaluation_metrics.json`

Expected output:
```
============================================================
VOICE HEALTH DETECTION - MODEL TRAINING
============================================================

Loading dataset...
Dataset loaded: 200 samples, 39 features
Training model...
Test Accuracy: 0.XXXX
...
Model saved to: ml_training/models/parkinson_voice_model.pkl
```

### 5. Run the API

```bash
# Using uvicorn directly
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Or from project root
uvicorn backend.app.main:app --reload --port 8000
```

### 6. Verify Setup

Open http://localhost:8000/api/docs to see the API documentation.

Test the health endpoint:
```bash
curl http://localhost:8000/api/health
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `DELETE /api/profile` - Delete account

### Voice Analysis
- `POST /api/recordings/submit` - Upload audio for analysis
  - Validates audio (format, duration, quality)
  - Extracts voice features (MFCC, pitch, jitter, shimmer, HNR)
  - Runs ML prediction
  - Returns health score, risk level, confidence

### Results & History
- `GET /api/results/{id}` - Get specific prediction result
- `GET /api/history` - Get user's prediction history
  - Supports pagination: `?page=1&limit=20`
  - Filter by status: `?status=normal|warning|alert`

### Evaluation
- `GET /api/evaluation/` - Get model performance metrics
- `GET /api/evaluation/status` - Get model status

## Project Structure

```
backend/
├── app/
│   ├── controllers/       # API endpoints
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── recordings.py  # Audio upload & prediction
│   │   ├── results.py     # Results & history
│   │   └── evaluation_controller.py
│   ├── models/
│   │   ├── feature_extractor.py  # Feature extraction wrapper
│   │   ├── prediction_model.py   # ML model wrapper
│   │   └── user.py
│   ├── services/
│   │   ├── audio_service.py       # Audio processing & feature extraction
│   │   ├── prediction_service.py  # Prediction business logic
│   │   └── evaluation_service.py  # Metrics service
│   ├── core/
│   │   ├── config.py      # Configuration
│   │   └── database.py    # MongoDB connection
│   ├── utils/
│   │   ├── deps.py        # JWT authentication
│   │   └── security.py    # Password hashing
│   └── main.py            # FastAPI app
├── tests/                 # Test suite
└── requirements.txt

ml_training/
├── dataset/
│   ├── train.py          # Model training script
│   └── evaluate.py       # Model evaluation script
├── models/               # Trained models (generated)
│   ├── parkinson_voice_model.pkl
│   ├── scaler.pkl
│   └── evaluation_metrics.json
└── preprocessing.py      # Data preprocessing utilities
```

## Running Tests

```bash
cd backend
pytest tests/ -v
```

Test categories:
- `test_audio_service.py` - Audio validation & feature extraction
- `test_prediction.py` - ML prediction logic
- `test_auth.py` - Authentication integration

## Development

### Adding New Features

1. Define feature in appropriate service (`backend/app/services/`)
2. Create controller endpoint (`backend/app/controllers/`)
3. Register router in `backend/app/main.py`
4. Add tests in `backend/tests/`

### Retraining the Model

```bash
python -m ml_training.dataset.train random_forest  # Random Forest (default)
python -m ml_training.dataset.train logistic_regression  # Logistic Regression
```

### Evaluating the Model

```bash
python -m ml_training.dataset.evaluate
```

## Deployment

### Using Docker

```bash
docker-compose up -d
```

### Manual Deployment

1. Set environment variables
2. Install production dependencies
3. Train ML model
4. Start with Gunicorn:

```bash
gunicorn backend.app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Troubleshooting

**Model not found error:**
```
PredictionModelError: Model file not found
```
Solution: Run `python -m ml_training.dataset.train`

**Import errors:**
Solution: Ensure you're running from project root or add to PYTHONPATH

**MongoDB connection error:**
Solution: Check `MONGODB_URL` in `.env` and ensure MongoDB is running

## Security Notes

⚠️ **Important for Production:**
- Change `SECRET_KEY` in `.env`
- Set `DEBUG=False`
- Configure CORS to specific origins
- Use HTTPS
- Add rate limiting
- Enable MongoDB authentication

## License

This is a decision-support tool for early disease risk screening. **NOT a diagnostic tool.**
