# Voice Health Detection - Startup Guide

## Prerequisites

1. **MongoDB** running on localhost:27017 (or configured in `.env`)
2. **Python 3.8+** installed
3. **Node.js 16+** installed
4. **ffmpeg** installed (required for audio format conversion)

## Installation

### 1. Install Python Dependencies

```powershell
cd "c:\Users\youssef elsayed\OneDrive - Misr International University\Desktop\PROJECT\Voice-Health-Detection\ml_service"
python -m pip install numpy pandas scikit-learn joblib fastapi uvicorn python-multipart praat-parselmouth nolds pydub
```

### 2. Install Node.js Dependencies

```powershell
cd "c:\Users\youssef elsayed\OneDrive - Misr International University\Desktop\PROJECT\Voice-Health-Detection"
npm install
```

### 3. Train ML Model (if not already done)

```powershell
cd ml_service
python train_model.py
```

This will create model files in `ml_service/models/`:
- parkinson_rf_model.pkl
- scaler.pkl
- label_encoder.pkl
- feature_names.pkl
- model_metadata.pkl

## Starting the Services

### Option 1: Manual Startup (Recommended for Development)

#### Terminal 1: Start ML Service
```powershell
cd "c:\Users\youssef elsayed\OneDrive - Misr International University\Desktop\PROJECT\Voice-Health-Detection\ml_service"
python app.py
```

Expected output:
```
============================================================
Starting ML Service...
============================================================
[OK] Model loaded from: models\parkinson_rf_model.pkl
[OK] Scaler loaded from: models\scaler.pkl
[OK] Label encoder loaded from: models\label_encoder.pkl
[OK] Feature names loaded: 22 features
[OK] Metadata loaded

[OK] All model components loaded successfully!

[OK] ML Service ready!

INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5001 (Press CTRL+C to quit)
```

#### Terminal 2: Start Backend Server
```powershell
cd "c:\Users\youssef elsayed\OneDrive - Misr International University\Desktop\PROJECT\Voice-Health-Detection"
npm run dev
# or
node server.js
```

#### Terminal 3: Start Frontend (if applicable)
```powershell
cd "c:\Users\youssef elsayed\OneDrive - Misr International University\Desktop\PROJECT\Voice-Health-Detection\frontend"
npm start
```

### Option 2: PowerShell Startup Script

Create `start_all_services.ps1`:

```powershell
# Start ML Service in background
$mlServicePath = "c:\Users\youssef elsayed\OneDrive - Misr International University\Desktop\PROJECT\Voice-Health-Detection\ml_service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mlServicePath'; python app.py"

# Wait for ML service to start
Start-Sleep -Seconds 5

# Start Backend Server
$backendPath = "c:\Users\youssef elsayed\OneDrive - Misr International University\Desktop\PROJECT\Voice-Health-Detection"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

Write-Host "Services starting..." -ForegroundColor Green
Write-Host "ML Service: http://localhost:5001" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5000" -ForegroundColor Cyan
```

Run with:
```powershell
.\start_all_services.ps1
```

## Testing the Integration

### 1. Test ML Service Health

```powershell
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "version": "1.0.0"
}
```

### 2. Test Feature Extraction

```powershell
curl -X POST http://localhost:5001/extract-features -F "file=@path/to/audio.wav"
```

### 3. Test Complete Analysis

```powershell
curl -X POST http://localhost:5001/analyze -F "file=@path/to/audio.wav"
```

### 4. Test Backend Integration

Use the frontend or API client to:
1. Upload an audio file
2. Submit for analysis
3. Check prediction results

## Environment Variables

Ensure `.env` file contains:

```env
# ML Service Configuration
ML_SERVICE_URL=http://localhost:5001
ML_SERVICE_TIMEOUT=30000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/voice-health-detection

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
```

## Troubleshooting

### ML Service Won't Start

**Issue**: Model files not found
```
ERROR: Dataset not found at...
```

**Solution**: Run `python train_model.py` first

---

**Issue**: Unicode encoding errors
```
UnicodeEncodeError: 'charmap' codec can't encode character...
```

**Solution**: Already fixed - all Unicode characters replaced with ASCII

---

### Backend Can't Connect to ML Service

**Issue**: Connection refused
```
ML service health check failed: connect ECONNREFUSED
```

**Solution**: 
1. Ensure ML service is running on port 5001
2. Check `ML_SERVICE_URL` in `.env`
3. Verify no firewall blocking port 5001

---

### Feature Extraction Fails

**Issue**: ffmpeg not found
```
Audio conversion failed: ffmpeg not found
```

**Solution**: Install ffmpeg
```powershell
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

---

### Dependencies Installation Fails

**Issue**: Windows Long Path error
```
OSError: [Errno 2] No such file or directory...
```

**Solution**: Use `--no-deps` flag
```powershell
python -m pip install --no-deps praat-parselmouth nolds pydub
```

## Service Ports

- **ML Service**: 5001
- **Backend API**: 5000 (or from `.env`)
- **Frontend**: 3000 (if using React dev server)
- **MongoDB**: 27017

## Next Steps

1. ✅ ML Service running
2. ✅ Backend updated to call ML service
3. ⏳ Test end-to-end flow with real audio files
4. ⏳ Verify database storage of predictions
5. ⏳ Test WebSocket notifications
6. ⏳ Deploy to production

## Production Deployment

For production deployment:

1. Use process manager (PM2) for Node.js backend
2. Use systemd or supervisor for Python ML service
3. Set up reverse proxy (nginx) for both services
4. Configure CORS for production domains
5. Use environment-specific `.env` files
6. Enable HTTPS/TLS
7. Set up monitoring and logging
