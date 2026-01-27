# Voice Health Detection: System Reference Manual

**Version:** 2.0.0  
**Last Updated:** January 25, 2026  
**Status:** Active Development

---

## 1. System Architecture

The **Voice Health Detection** system is designed as a **Service-Oriented Architecture (SOA)** with clear separation of concerns between the user-facing interface, the business logic API, and the ML processing pipeline.

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│   Frontend (Vanilla JavaScript SPA)     │
│   • 8 HTML pages                        │
│   • API Client (apiClient.js)           │
│   • Served from Express (port 5000)     │
└──────────────┬──────────────────────────┘
               │ HTTP/JSON (JWT Auth)
               ▼
┌─────────────────────────────────────────┐
│   Backend API (Node.js + Express)       │
│   • Port: 5000                          │
│   • 6 Route modules, 32+ endpoints      │
│   • JWT Authentication                  │
│   • Mongoose (MongoDB ODM)              │
└──────┬──────────────────┬───────────────┘
       │                  │
       │ Mongoose         │ HTTP POST
       ▼                  ▼
┌──────────────┐   ┌──────────────────────┐
│  MongoDB     │   │  ML Service (Flask)  │
│  Atlas       │   │  • Port: 5001        │
│  Cloud DB    │   │  • Feature Extract   │
│              │   │  • Prediction        │
└──────────────┘   └──────────────────────┘
```

### Service Responsibilities

| Service | Technology | Port | Responsibilities |
|---------|-----------|------|------------------|
| **Frontend** | Vanilla JavaScript | 5000 | User interface, form validation, API consumption |
| **Backend API** | Node.js + Express | 5000 | Auth, user management, recording metadata, prediction orchestration |
| **ML Service** | Python + Flask | 5001 | Audio feature extraction, ML prediction |
| **Database** | MongoDB Atlas | 27017 | Data persistence (users, recordings, predictions) |

---

## 2. Database Schema Design (MongoDB)

### Collection: `users`

Primary collection for storing user identity and profile information.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique identifier |
| `email` | String | Yes | Unique email address |
| `password` | String | Yes | bcrypt hashed password (10 rounds) |
| `fullName` | String | Yes | User's full name |
| `phone` | String | No | Contact phone number |
| `dateOfBirth` | Date | No | Birth date |
| `gender` | String | No | 'male', 'female', 'other', 'prefer-not-to-say' |
| `medicalInfo` | Object | No | Height, weight, conditions, medications, allergies |
| `settings` | Object | No | Notifications, privacy, theme preferences |
| `role` | String | Yes | 'user', 'doctor', 'admin' (default: 'user') |
| `isEmailVerified` | Boolean | Yes | Email verification status |
| `isActive` | Boolean | Yes | Account active status |
| `created At` | DateTime | Yes | Account creation timestamp |
| `updatedAt` | DateTime | Yes | Last modification timestamp |

### Collection: `recordings`

Stores audio file metadata and extracted features.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier |
| `userId` | ObjectId | Reference to users collection |
| `audioFile` | Object | Filename, size, duration, format, GridFS ID |
| `metadata` | Object | Sample rate, channels, bitrate |
| `features` | Object | Extracted acoustic features (MFCC, pitch, etc.) |
| `prediction` | Object | Embedded prediction result |
| `status` | String | 'pending', 'processing', 'completed', 'failed' |
| `notes` | String | User notes about the recording |
| `createdAt` | DateTime | Upload timestamp |
| `updatedAt` | DateTime | Last modification |

### Collection: `predictions`

Stores ML prediction results and analysis.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier |
| `userId` | ObjectId | Reference to users |
| `recordingId` | ObjectId | Reference to recordings |
| `condition` | String | 'healthy', 'parkinsons', 'other' |
| `severity` | String | 'none', 'mild', 'moderate', 'severe' |
| `confidence` | Number | Confidence score (0-1) |
| `probability` | Object | Probability distribution for each condition |
| `symptoms` | Array | Detected symptoms |
| `recommendations` | Array | Health recommendations |
| `doctorReview` | Object | Doctor's review (if applicable) |
| `sharedWith` | Array | List of user IDs with access |
| `createdAt` | DateTime | Prediction timestamp |

### Collection: `analyses`

Stores trend analysis and evaluation reports.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier |
| `userId` | ObjectId | Reference to users |
| `recordingIds` | Array | Array of recording ObjectIds |
| `predictionIds` | Array | Array of prediction ObjectIds |
| `metrics` | Object | Totals, averages, distributions |
| `trends` | Object | Progression over time |
| `recommendations` | Array | Personalized recommendations with priority |
| `reportFormat` | String | 'summary', 'detailed', 'medical' |
| `generatedAt` | DateTime | Report generation timestamp |

---

## 3. API Contract & Specification

### Base URL

```
Development: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

### Authentication

All protected endpoints require JWT Bearer token:

```http
Authorization: Bearer <accessToken>
```

Token expiration: 24 hours  
Algorithm: HS256

### API Endpoints Summary

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Authentication** | 7 | Register, login, email verification, password reset |
| **User Management** | 6 | Profile, medical info, settings, stats, account deletion |
| **Recordings** | 6 | Upload, list, get, update, delete, stats |
| **Predictions** | 5 | Analyze, list, get, stats, share |
| **Evaluation** | 3 | Generate report, stats, trends |
| **Admin** | 6 | User management, analytics, health |

**Total:** 33 endpoints

For complete API documentation with request/response examples, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## 4. Machine Learning Implementation

The ML logic is isolated in the `ml-service/` directory to ensure the API remains lightweight and scalable.

### 4.1 ML Service Architecture

**Technology:** Python + Flask  
**Port:** 5001  
**Entry Point:** `ml-service/app.py`

**Endpoints:**
- `GET /ml/health` - Health check
- `POST /ml/extract-features` - Extract audio features
- `POST /ml/predict` - Make prediction from features
- `POST /ml/analyze` - Complete analysis (extract + predict)

### 4.2 Feature Extraction (`ml-service/app.py`)

Uses **librosa** library to extract acoustic features:

**Features Extracted:**
1. **MFCC** (Mel-frequency cepstral coefficients) - 13 coefficients + statistics
2. **Pitch** (F0) - Fundamental frequency using YIN algorithm
3. **Energy** - Total signal energy
4. **RMS** - Root mean square energy
5. **ZCR** - Zero crossing rate (voice quality indicator)
6. **Spectral Centroid** - Brightness of sound
7. **Spectral Rolloff** - High-frequency cutoff
8. **Tempogram** - Rhythm-related features
9. **Chroma** - Pitch class representation
10. **Mel Spectrogram** - Frequency distribution statistics
11. **Delta Features** - Rate of change in MFCCs

### 4.3 ML Model

**Algorithm:** Random Forest Classifier  
**Input Features:** 11 aggregated features  
**Output Classes:** Healthy, Parkinson's, Other  
**Model File:** `ml-service/models/model.joblib`  
**Scaler File:** `ml-service/models/scaler.joblib`

**Training:** See `ml-service/train_model.py`

> **⚠️ IMPORTANT:** The ML model is for research/demonstration purposes only. It is NOT a medical diagnostic tool and predictions should not be used for medical decisions.

---

## 5. Development Guide

### Folder Structure

```
Voice-Health-Detection/
├── backend/                    # Node.js/Express backend
│   ├── controllers/           # Business logic (6 files)
│   ├── middleware/            # Auth, CORS, validation, logging
│   ├── models/                # Mongoose schemas (4 models)
│   ├── routes/                # Express routers (6 files)
│   └── utils/                 # JWT, email, ML client, helpers
├── ml-service/                # Python/Flask ML service
│   ├── app.py                # Flask server
│   ├── train_model.py        # Model training script
│   ├── models/               # Trained ML models
│   └── requirements.txt      # Python dependencies
├── frontend/                  # Frontend UI
│   ├── views/                # 8 HTML pages
│   ├── js/                   # JavaScript modules
│   ├── css/                  # Stylesheets
│   └── assets/               # Images and icons
├── logs/                      # Application logs
├── uploads/                   # Temporary file storage
├── server.js                  # Main Express server entry point
├── package.json              # Node.js dependencies
├── docker-compose.yml        # Docker orchestration
└── .env                      # Environment variables (NOT in Git)
```

### How to Run Locally

**Prerequisites:**
- Node.js v16+
- Python 3.8+
- MongoDB Atlas account

**Steps:**

1. **Install dependencies:**
   ```bash
   npm install
   pip install -r ml-service/requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Train ML model (optional):**
   ```bash
   python ml-service/train_model.py
   ```

4. **Start services:**
   
   **Terminal 1 - Backend:**
   ```bash
   npm run dev
   # Runs on http://localhost:5000
   ```
   
   **Terminal 2 - ML Service:**
   ```bash
   python ml-service/app.py
   # Runs on http://localhost:5001
   ```

5. **Access application:**
   ```
   Open browser: http://localhost:5000
   ```

### Using Docker

```bash
docker-compose up --build

# Access:
# - Frontend: http://localhost:5000
# - Backend API: http://localhost:5000/api
# - ML Service: http://localhost:5001
```

---

## 6. Security & Best Practices

### Authentication

- **Password Hashing:** bcryptjs with 10 salt rounds
- **JWT Tokens:** HS256 algorithm, 24-hour expiration
- **Refresh Tokens:** Stored in localStorage, separate from access tokens
- **Email Verification:** Optional two-step verification

### API Security

- **Rate Limiting:**
  - Auth endpoints: 5 requests / 15 minutes
  - File uploads: 10 uploads / hour
  - API calls: 100 requests / 15 minutes

- **Input Validation:** express-validator on all inputs
- **CORS:** Whitelist configuration (see `backend/middleware/corsConfig.js`)
- **Security Headers:** Helmet.js middleware
- **File Upload Limits:** 50MB maximum

### Data Security

- **Environment Variables:** Secrets in `.env` file (never commit!)
- **Database Connection:** Encrypted connection to MongoDB Atlas
- **Sensitive Data:** Medical information encrypted at rest

### Best Practices

✅ Always use HTTPS in production  
✅ Rotate JWT secret keys regularly  
✅ Implement audit logging for sensitive operations  
✅ Regular security updates for dependencies  
✅ Database backups scheduled daily  
✅ Monitor for suspicious activity

---

## 7. Testing

**Test Framework:** Jest  
**Coverage Tool:** Jest built-in coverage  
**Test Database:** Separate MongoDB database for testing

**Test Suites:**
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests: Manual testing checklist

**Run tests:**
```bash
npm test
npm run test:coverage
```

---

## 8. Deployment

### Production Checklist

- [ ] Rotate all credentials (MongoDB, JWT secrets)
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB cluster
- [ ] Set up monitoring (logs, errors, performance)
- [ ] Configure CDN for static assets
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Perform security audit
- [ ] Load testing

**See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for details.**

---

## 9. Troubleshooting

**Common Issues:**

**MongoDB Connection Error:**
```
✗ Check .env MONGODB_URL
✗ Verify IP whitelist in MongoDB Atlas
✗ Test connection: mongosh "your-connection-string"
```

**ML Service Not Starting:**
```
✗ Check Python dependencies: pip list
✗ Verify port 5001 is not in use
✗ Check ML_SERVICE_PORT in .env
```

**CORS Errors:**
```
✗ Add frontend URL to CORS_ORIGINS in .env
✗ Verify corsConfig.js middleware is applied
```

---

## 10. Additional Resources

- **Quick Start:** [QUICK_START.md](QUICK_START.md)
- **API Reference:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Setup Guide:** [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
- **System Audit:** [SYSTEM_AUDIT_REPORT.md](SYSTEM_AUDIT_REPORT.md)

---

**Document Version:** 2.0.0  
**Architecture:** Node.js + Express + MongoDB + Python ML Service  
**Status:** Production-Ready (with disclaimers)
