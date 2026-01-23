# Voice Health Detection System - Complete Setup Guide

## Project Overview

The Voice Health Detection System is a comprehensive full-stack application that analyzes voice recordings to detect potential health conditions using artificial intelligence and machine learning.

**Status**: Backend and ML service fully implemented. Frontend integration in progress.

## Architecture

```
Voice-Health-Detection/
├── frontend/                 # Frontend UI (HTML/CSS/JS)
├── backend-nodejs/          # Node.js Express API server
├── ml-service/              # Python Flask ML microservice
├── server.js                # Main Express server
├── package.json             # Node.js dependencies
├── .env                     # Environment configuration
└── docker-compose.yml       # Docker container orchestration
```

### Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB Atlas
- **ML/AI**: Python, Flask, Librosa, Scikit-learn
- **Authentication**: JWT, bcryptjs
- **File Storage**: GridFS
- **Deployment**: Docker, Docker Compose

## Prerequisites

### Required Software

1. **Node.js** (v16+)
   ```bash
   # Download from https://nodejs.org/
   node --version  # Verify installation
   ```

2. **Python** (v3.8+)
   ```bash
   # Download from https://www.python.org/
   python --version  # Verify installation
   ```

3. **MongoDB Atlas Account**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a cluster and get your connection string
   - Already configured in `.env`

4. **Git** (optional, for version control)

## Installation Steps

### 1. Backend Setup

```bash
# Navigate to project root
cd Voice-Health-Detection

# Install Node dependencies
npm install

# Create .env file (already provided, verify configuration)
cat .env
```

### 2. ML Service Setup

```bash
# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r ml-service/requirements.txt

# Train the ML model (generates model files)
python ml-service/train_model.py
```

### 3. Verify Configuration

Edit `.env` file to ensure:

```env
# MongoDB (already configured with Atlas)
MONGODB_URL=mongodb+srv://...
MONGODB_DB_NAME=voice_health_detection

# JWT
JWT_SECRET_KEY=GctABTejTTupHLg6dZPW-98eR5a1l1HC6Y3zjhpgQksugMkxLwhIhi-42IenZDbIJtyPNNPkn3SoA-aABqJ33g
JWT_EXPIRATION_MINUTES=1440

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,http://127.0.0.1:3000,http://127.0.0.1:5000

# Ports
PORT=5000
ML_SERVICE_PORT=5001

# Environment
NODE_ENV=development
```

## Running the Application

### Development Mode (3 Terminals)

**Terminal 1: Backend Server**
```bash
npm run dev
# Or with nodemon watch:
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2: ML Service**
```bash
# Activate Python virtual environment first
python ml-service/app.py
# Service runs on http://localhost:5001
```

**Terminal 3: Frontend (Optional, if serving from Node)**
```bash
# Frontend files are served from http://localhost:5000
# Access at: http://localhost:5000
```

### Production Mode

```bash
# Build for production
npm run build

# Start production server
npm start

# ML service production
python -m gunicorn --workers 4 --bind 0.0.0.0:5001 ml-service.app:app
```

## API Endpoints Reference

### Authentication

```
POST   /api/auth/register           - User registration
POST   /api/auth/login              - User login
POST   /api/auth/refresh-token      - Refresh JWT token
POST   /api/auth/verify-email       - Verify email address
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Reset password
POST   /api/auth/logout             - User logout
```

### User Profile

```
GET    /api/users/profile           - Get user profile
PUT    /api/users/profile           - Update profile
PUT    /api/users/medical-info      - Update medical information
PUT    /api/users/settings          - Update user settings
GET    /api/users/stats             - Get user statistics
DELETE /api/users/account           - Delete account
```

### Recordings

```
POST   /api/recordings/upload       - Upload audio recording
GET    /api/recordings              - List user recordings
GET    /api/recordings/:id          - Get specific recording
PUT    /api/recordings/:id          - Update recording notes
DELETE /api/recordings/:id          - Delete recording
GET    /api/recordings/stats        - Get recording statistics
```

### Predictions

```
POST   /api/predictions/analyze     - Submit recording for analysis
GET    /api/predictions             - List predictions
GET    /api/predictions/:id         - Get prediction details
GET    /api/predictions/stats       - Get prediction statistics
POST   /api/predictions/:id/share   - Share prediction with user
```

### Evaluation & Analysis

```
POST   /api/evaluation/report       - Generate evaluation report
GET    /api/evaluation/stats        - Get evaluation statistics
GET    /api/evaluation/trends       - Get trend analysis
```

### Health Check

```
GET    /api/health                  - API health status
GET    /ml/health                   - ML service health
```

## Database Models

### User Schema

```javascript
{
  email: String (unique),
  password: String (hashed),
  fullName: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  medicalInfo: {
    height: Number,
    weight: Number,
    conditions: [String],
    medications: [String],
    allergies: [String]
  },
  settings: {
    notificationsEnabled: Boolean,
    privacyLevel: String,
    theme: String
  },
  role: String (user|doctor|admin),
  isEmailVerified: Boolean,
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Recording Schema

```javascript
{
  userId: ObjectId (ref: User),
  audioFile: {
    filename: String,
    contentType: String,
    fileId: ObjectId (GridFS),
    size: Number,
    duration: Number
  },
  features: {
    mfcc: [Number],
    pitch: Number,
    energy: Number,
    zeroCrossingRate: Number,
    spectralCentroid: Number,
    spectralRolloff: Number
  },
  prediction: {
    condition: String,
    severity: String,
    confidence: Number,
    label: String
  },
  status: String (pending|processing|completed|failed),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Prediction Schema

```javascript
{
  userId: ObjectId (ref: User),
  recordingId: ObjectId (ref: Recording),
  condition: String (healthy|parkinsons|other),
  severity: String (mild|moderate|severe|none),
  confidence: Number,
  probability: {
    healthy: Number,
    parkinsons: Number,
    other: Number
  },
  symptoms: [
    {
      name: String,
      score: Number,
      description: String
    }
  ],
  recommendations: [String],
  isReviewed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## ML Service Details

### Feature Extraction

The ML service extracts the following features from audio:

1. **MFCC** (Mel-frequency Cepstral Coefficients) - 13 coefficients
2. **Pitch** (Fundamental Frequency)
3. **Energy** (RMS Energy)
4. **Zero Crossing Rate** (ZCR)
5. **Spectral Centroid**
6. **Spectral Rolloff**
7. **Temporal Features** (Tempogram)
8. **Chroma Features**
9. **Mel Spectrogram Statistics**

### Prediction Model

- **Algorithm**: Random Forest Classifier
- **Classes**: Healthy, Parkinsons, Other Conditions
- **Input Features**: 11 core features
- **Output**: Condition, Severity, Confidence Score
- **Model File**: `ml-service/models/model.joblib`
- **Scaler File**: `ml-service/models/scaler.joblib`

### ML API Endpoints

```
GET    /ml/health                   - Service health check
POST   /ml/extract-features         - Extract features from audio
POST   /ml/predict                  - Make prediction from features
POST   /ml/analyze                  - End-to-end analysis
POST   /ml/train                    - Retrain model (admin)
```

## Usage Examples

### 1. Register a New User

```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123',
    fullName: 'John Doe',
    phone: '+1234567890'
  })
});
const data = await response.json();
// Save tokens: data.data.tokens.accessToken
```

### 2. Login

```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123'
  })
});
const data = await response.json();
const token = data.data.tokens.accessToken;
```

### 3. Upload Recording

```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('filename', 'recording.wav');
formData.append('duration', 10);

const response = await fetch('http://localhost:5000/api/recordings/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const data = await response.json();
const recordingId = data.data._id;
```

### 4. Submit for Analysis

```javascript
const response = await fetch('http://localhost:5000/api/predictions/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ recordingId })
});
const data = await response.json();
const predictionId = data.data._id;
```

### 5. Get Prediction Results

```javascript
const response = await fetch(`http://localhost:5000/api/predictions/${predictionId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const prediction = await response.json();
console.log(prediction.data);
// Result: { condition, severity, confidence, probability, recommendations }
```

## Testing

### Unit Tests

```bash
npm test
npm run test:watch
```

### Integration Tests

```bash
npm run test:integration
```

### ML Service Tests

```bash
# Test feature extraction
curl -X POST http://localhost:5001/ml/extract-features \
  -F "audio=@test_audio.wav"

# Test prediction
curl -X POST http://localhost:5001/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"features": {...}}'
```

## Security Considerations

1. **Environment Variables**: Keep `.env` secure, don't commit to git
2. **JWT Tokens**: 24-hour expiration, refresh tokens for extended sessions
3. **Password Hashing**: bcryptjs with 10 salt rounds
4. **HTTPS**: Use in production
5. **CORS**: Configured for allowed origins only
6. **Rate Limiting**: 5 auth attempts per 15 minutes
7. **Input Validation**: All endpoints validate input
8. **Admin Routes**: Protected with role-based access control

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB Atlas cluster status
# Verify IP whitelist includes your IP
# Test connection string in .env

# View logs
cat logs/server-*.log
```

### ML Service Not Starting

```bash
# Check Python installation
python --version

# Install missing dependencies
pip install -r ml-service/requirements.txt

# Verify model files exist
ls -la ml-service/models/

# If models missing, retrain:
python ml-service/train_model.py
```

### Port Already in Use

```bash
# Kill process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Change port in .env
PORT=3000
```

### CORS Errors

Ensure frontend URL is in `CORS_ORIGINS` in `.env`

## Docker Deployment

### Using Docker Compose

```bash
# Build and run all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Files

- `Dockerfile` - Backend container
- `ml-service/Dockerfile` - ML service container (create if needed)
- `docker-compose.yml` - Orchestration

## Performance Optimization

1. **Database Indexes**: Created on frequently queried fields
2. **Connection Pooling**: MongoDB connection pooling enabled
3. **Caching**: Implement Redis for session/prediction caching
4. **CDN**: Serve static frontend assets via CDN
5. **ML Model Optimization**: Use model quantization for faster inference

## Future Enhancements

- [ ] WebSocket for real-time prediction status
- [ ] Email notifications for analysis completion
- [ ] PDF report generation
- [ ] Mobile app (React Native)
- [ ] Admin dashboard
- [ ] Multi-language support (i18n)
- [ ] Dark mode UI
- [ ] Offline recording capability
- [ ] Advanced analytics and insights
- [ ] Integration with healthcare providers

## Support & Documentation

- API Documentation: `docs/API_DOCUMENTATION.md`
- Architecture Guide: `docs/ARCHITECTURE.md`
- User Guide: `docs/USER_GUIDE.md`

## License

MIT License - See LICENSE file for details

## Contributors

- MOHANAD - Project Lead

---

**Last Updated**: 2026-01-23
**Version**: 1.0.0
