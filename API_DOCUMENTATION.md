# API Documentation - Voice Health Detection System

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.voice-health-detection.com/api
```

## Authentication

### JWT Token
All protected endpoints require Authorization header:
```
Authorization: Bearer <accessToken>
```

### Token Refresh
Access tokens expire after 24 hours. Use refresh token to get new access token:
```
POST /auth/refresh-token
Body: { "refreshToken": "..." }
```

---

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe",
  "phone": "+1234567890" (optional)
}

Response (201):
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "fullName": "John Doe"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response (200):
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

#### Verify Email
```http
POST /auth/verify-email
Content-Type: application/json

{
  "token": "email-verification-token"
}

Response (200):
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "password-reset-token",
  "password": "NewPassword123"
}

Response (200):
{
  "success": true,
  "message": "Password reset successful"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Profile

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "dateOfBirth": "1980-01-15",
    "gender": "male",
    "medicalInfo": {
      "height": 180,
      "weight": 75,
      "conditions": [],
      "medications": []
    },
    "settings": { ... }
  }
}
```

#### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Updated",
  "phone": "+1111111111",
  "dateOfBirth": "1980-01-15",
  "gender": "male"
}

Response (200):
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

#### Update Medical Info
```http
PUT /users/medical-info
Authorization: Bearer <token>
Content-Type: application/json

{
  "height": 180,
  "weight": 75,
  "conditions": ["asthma"],
  "medications": ["albuterol"],
  "allergies": ["penicillin"]
}

Response (200):
{
  "success": true,
  "message": "Medical information updated"
}
```

#### Get User Statistics
```http
GET /users/stats
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "totalRecordings": 5,
    "totalPredictions": 5,
    "recentRecordings": [ ... ],
    "conditionDistribution": [ ... ]
  }
}
```

---

### Recordings

#### Upload Recording
```http
POST /recordings/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- audio: <audio file> (required, audio/* MIME type)
- filename: string (optional)
- duration: number (optional, in seconds)

Response (201):
{
  "success": true,
  "message": "Recording uploaded successfully",
  "data": {
    "_id": "recording-id",
    "userId": "user-id",
    "status": "pending",
    "audioFile": { ... }
  }
}
```

#### List Recordings
```http
GET /recordings?page=1&limit=10&status=completed
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- status: string (pending|processing|completed|failed, optional)

Response (200):
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### Get Recording Details
```http
GET /recordings/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "_id": "recording-id",
    "userId": "user-id",
    "audioFile": { ... },
    "features": { ... },
    "prediction": { ... },
    "status": "completed"
  }
}
```

#### Update Recording
```http
PUT /recordings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Updated notes about recording"
}

Response (200):
{
  "success": true,
  "message": "Recording updated"
}
```

#### Delete Recording
```http
DELETE /recordings/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Recording deleted"
}
```

#### Recording Statistics
```http
GET /recordings/stats
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "totalRecordings": 10,
    "totalDuration": 150,
    "statusDistribution": [ ... ]
  }
}
```

---

### Predictions

#### Submit for Analysis
```http
POST /predictions/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "recordingId": "recording-id"
}

Response (201):
{
  "success": true,
  "message": "Recording submitted for analysis",
  "data": {
    "_id": "prediction-id",
    "status": "pending"
  }
}
```

#### List Predictions
```http
GET /predictions?page=1&limit=10&condition=parkinsons
Authorization: Bearer <token>

Query Parameters:
- page: number
- limit: number
- condition: string (optional)

Response (200):
{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

#### Get Prediction Details
```http
GET /predictions/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "_id": "prediction-id",
    "condition": "healthy",
    "severity": "none",
    "confidence": 0.92,
    "probability": {
      "healthy": 0.92,
      "parkinsons": 0.06,
      "other": 0.02
    },
    "symptoms": [ ... ],
    "recommendations": [ ... ]
  }
}
```

#### Prediction Statistics
```http
GET /predictions/stats
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "totalPredictions": 10,
    "conditionDistribution": [ ... ],
    "severityDistribution": { ... },
    "averageConfidence": 0.85
  }
}
```

#### Share Prediction
```http
POST /predictions/:id/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "recipient-user-id"
}

Response (200):
{
  "success": true,
  "message": "Prediction shared successfully"
}
```

---

### Evaluation & Analysis

#### Generate Report
```http
POST /evaluation/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "reportFormat": "detailed" (summary|detailed|medical)
}

Response (201):
{
  "success": true,
  "message": "Evaluation report generated",
  "data": {
    "_id": "analysis-id",
    "metrics": { ... },
    "trends": { ... },
    "recommendations": [ ... ]
  }
}
```

#### Get Evaluation Statistics
```http
GET /evaluation/stats?period=7d
Authorization: Bearer <token>

Query Parameters:
- period: string (7d|30d|90d, default: 7d)

Response (200):
{
  "success": true,
  "data": {
    "totalAnalyses": 5,
    "averageConfidence": 0.88,
    "mostCommonCondition": "healthy",
    "conditionCounts": { ... },
    "severityCounts": { ... },
    "dailyTrend": [ ... ]
  }
}
```

#### Get Trend Analysis
```http
GET /evaluation/trends
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "conditionTrend": { ... },
    "severityProgression": [ ... ],
    "confidenceProgression": [ ... ]
  }
}
```

---

### Health & Status

#### API Health Check
```http
GET /health

Response (200):
{
  "status": "healthy",
  "timestamp": "2026-01-23T10:30:00Z",
  "environment": "development",
  "mongodb": "connected"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid email format",
  "errors": [ { "msg": "..." } ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Recording not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many authentication attempts"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limits

- **Authentication**: 5 attempts per 15 minutes
- **API Calls**: 100 requests per 15 minutes
- **File Upload**: 50 uploads per hour
- **File Size**: 50MB maximum

---

## Data Types & Formats

### Condition
Values: `healthy`, `parkinsons`, `other`

### Severity
Values: `none`, `mild`, `moderate`, `severe`

### Status
Values: `pending`, `processing`, `completed`, `failed`

### Gender
Values: `male`, `female`, `other`, `prefer-not-to-say`

### Role
Values: `user`, `doctor`, `admin`

---

## Code Examples

### JavaScript/Fetch
```javascript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const data = await response.json();
const token = data.data.tokens.accessToken;

// Upload recording
const formData = new FormData();
formData.append('audio', audioFile);

const uploadResponse = await fetch('http://localhost:5000/api/recordings/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Upload recording
curl -X POST http://localhost:5000/api/recordings/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "audio=@recording.wav"

# Get predictions
curl http://localhost:5000/api/predictions \
  -H "Authorization: Bearer TOKEN"
```

---

## Webhooks (Future)

Post-analysis webhooks will notify external systems of completion:
```
POST https://your-webhook-url/api/voice-health/prediction-complete
Body: { predictionId, condition, confidence, timestamp }
```

---

**Last Updated**: 2026-01-23
**API Version**: 1.0.0
