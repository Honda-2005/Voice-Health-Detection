# Quick Start Guide - Voice Health Detection System

## 5-Minute Setup

### Prerequisites
- Node.js v16+
- Python 3.8+
- MongoDB Atlas account (already configured)

### Step 1: Install Dependencies

```bash
# Install Node dependencies
npm install

# Create Python environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install Python dependencies
pip install -r ml-service/requirements.txt
```

### Step 2: Train ML Model

```bash
python ml-service/train_model.py
# Creates: ml-service/models/model.joblib and scaler.joblib
```

### Step 3: Start Services (3 Terminals)

**Terminal 1 - Backend:**
```bash
npm run dev
# Server: http://localhost:5000
```

**Terminal 2 - ML Service:**
```bash
python ml-service/app.py
# Service: http://localhost:5001
```

**Terminal 3 - Frontend:**
```bash
# Open browser: http://localhost:5000
```

## Testing the System

### 1. Create Account

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "fullName": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Save the `accessToken` from response.

### 3. Upload Audio

```bash
curl -X POST http://localhost:5000/api/recordings/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "audio=@sample.wav" \
  -F "filename=test_recording" \
  -F "duration=10"
```

### 4. Analyze Recording

```bash
curl -X POST http://localhost:5000/api/predictions/analyze \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"recordingId": "RECORDING_ID_HERE"}'
```

### 5. Get Results

```bash
curl http://localhost:5000/api/predictions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Using Docker

```bash
# Build and run all services
docker-compose up --build

# Access:
# - Frontend: http://localhost:5000
# - Backend: http://localhost:5000/api
# - ML Service: http://localhost:5001
```

## File Structure

```
Voice-Health-Detection/
├── backend-nodejs/           # Node.js/Express backend
│   ├── models/              # MongoDB schemas
│   ├── controllers/         # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Auth, validation, CORS
│   ├── services/            # Utilities
│   └── utils/               # Helpers
├── ml-service/              # Python/Flask ML service
│   ├── app.py              # Flask server
│   ├── train_model.py      # Model training
│   ├── models/             # Trained models
│   └── requirements.txt    # Python dependencies
├── frontend/               # Frontend UI
│   ├── views/             # HTML pages
│   ├── js/                # JavaScript modules
│   └── css/               # Stylesheets
├── server.js              # Main Express server
├── package.json           # Node dependencies
├── .env                   # Configuration
└── docker-compose.yml     # Docker setup
```

## Key Features Implemented

✅ **Authentication**
- Register, Login, JWT tokens
- Email verification
- Password reset

✅ **User Management**
- Profile management
- Medical information
- Settings and preferences

✅ **Audio Recording**
- File upload with validation
- Audio metadata storage
- Processing status tracking

✅ **ML Analysis**
- Feature extraction (MFCC, pitch, energy, etc.)
- Prediction with confidence scores
- Severity assessment

✅ **Evaluation & Reports**
- Trend analysis
- Statistical reports
- Recommendations

✅ **Admin**
- User management
- System analytics
- Health monitoring

## Common Commands

```bash
# Development
npm run dev              # Start backend with auto-reload
npm test               # Run tests
npm run lint           # Check code quality

# Database
npm run seed           # Populate with sample data
mongo                  # MongoDB shell

# ML Service
python ml-service/app.py    # Start service
python ml-service/train_model.py  # Train model

# Docker
docker-compose up      # Start all services
docker-compose down    # Stop all services
docker-compose logs    # View logs

# Health checks
curl http://localhost:5000/api/health     # Backend
curl http://localhost:5001/ml/health      # ML Service
```

## Troubleshooting

**MongoDB Connection Error**
```bash
# Verify MongoDB Atlas credentials in .env
# Check IP whitelist in MongoDB Atlas dashboard
```

**ML Service Not Found**
```bash
# Make sure Flask is running on port 5001
# Check: python ml-service/app.py
```

**CORS Errors**
```bash
# Ensure frontend URL is in CORS_ORIGINS in .env
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

**Port Already in Use**
```bash
# Change PORT in .env or kill the process
PORT=3000
```

## Next Steps

1. **Frontend Integration**: Update HTML to use real API calls
2. **Add More Tests**: Unit and integration tests
3. **Improve ML Model**: Train on real data
4. **Deploy**: Docker, Kubernetes, or cloud platform
5. **Monitoring**: Add logging and analytics
6. **Documentation**: API docs, user manual

## Support

- API Docs: See `SETUP_COMPLETE.md`
- Architecture: See `docs/ARCHITECTURE.md`
- Issues: Check `logs/` directory

---

**For detailed setup**, see [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
