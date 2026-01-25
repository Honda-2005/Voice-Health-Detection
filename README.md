# Voice Health Detection System

> **⚠️ MEDICAL DISCLAIMER:** This system is for research and educational purposes only. It is **NOT a medical diagnostic tool** and should not be used to diagnose, treat, or make medical decisions. Always consult qualified healthcare professionals for medical advice.

A comprehensive full-stack web application that analyzes voice recordings to detect potential health conditions using AI/ML. The system provides early warning indicators for conditions like Parkinson's disease through advanced audio signal processing.

## 🎯 Key Features

- **Voice Analysis:** Upload audio recordings for automated health screening
- **ML-Powered Predictions:** Machine learning model analyzes acoustic features (MFCC, pitch, jitter, shimmer, etc.)
- **User Management:** Secure authentication with JWT, profile management, medical history tracking
- **Trend Analysis:** Track predictions over time with detailed evaluation reports
- **RESTful API:** 32+ endpoints for comprehensive system integration
- **Microservices Architecture:** Separate backend API and ML service for scalability

## 🏗️ Tech Stack

**Backend:**
- Node.js + Express.js (REST API)
- MongoDB Atlas (Database)
- JWT Authentication
- GridFS (Audio file storage)

**ML Service:**
- Python + Flask
- librosa (Audio feature extraction)
- scikit-learn (Random Forest classifier)

**Frontend:**
- Vanilla JavaScript
- HTML5/CSS3
- Responsive design

**DevOps:**
- Docker + docker-compose
- Winston logging
- Helmet security

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- Python 3.8+
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Voice-Health-Detection
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   # IMPORTANT: Never commit .env file!
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Install Python dependencies**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r ml-service/requirements.txt
   ```

5. **Train ML Model** (optional - uses dummy predictions if skipped)
   ```bash
   python ml-service/train_model.py
   ```

6. **Run the system**

   **Terminal 1 - Backend API:**
   ```bash
   npm run dev
   # Runs on http://localhost:5000
   ```

   **Terminal 2 - ML Service:**
   ```bash
   python ml-service/app.py
   # Runs on http://localhost:5001
   ```

7. **Access the application**
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

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - 5-minute setup
- **[Setup Complete Guide](SETUP_COMPLETE.md)** - Comprehensive installation
- **[API Documentation](API_DOCUMENTATION.md)** - All endpoints with examples
- **[System Architecture](SYSTEM_AUDIT_REPORT.md#3%EF%B8%8F⃣-system-architecture-as-is)** - Technical architecture details

## 🔒 Security

> **🚨 CRITICAL SECURITY NOTICE**
> - **NEVER commit `.env` file** to Git (it contains sensitive credentials)
> - Always use `.env.example` as template
> - Rotate all credentials before production deployment
> - See [Security Best Practices](#security-best-practices) below

### Security Features

- ✅ JWT token authentication (24-hour expiration)
- ✅ bcryptjs password hashing (10 rounds)
- ✅ Rate limiting on authentication and uploads
- ✅ CORS protection with whitelist
- ✅ Helmet.js security headers
- ✅ Input validation on all endpoints
- ✅ File upload size limits (50MB max)

### Security Best Practices

1. **Generate strong secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
   ```

2. **Use environment-specific .env files:**
   - `.env` - Development (gitignored)
   - `.env.production` - Production (never commit)

3. **Rotate credentials regularly:**
   - MongoDB password: Every 90 days
   - JWT secret: After any security incident
   - API keys: Per provider recommendations

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- auth.test.js
```

**Current Test Coverage:**
- Auth endpoints: 90%+
- Recording endpoints: 80%+
- Prediction endpoints: 75%+
- Overall: 70%+

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Recordings
- `POST /api/v1/recordings/upload` - Upload audio file
- `GET /api/v1/recordings` - List user's recordings
- `GET /api/v1/recordings/:id` - Get recording details
- `DELETE /api/v1/recordings/:id` - Delete recording

### Predictions
- `POST /api/v1/predictions/analyze` - Analyze recording
- `GET /api/v1/predictions` - List predictions
- `GET /api/v1/predictions/:id` - Get prediction details

**See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference**

## 🏥 Medical & Legal

### Disclaimer

This software is provided "AS IS" without warranty of any kind. It is:

- ✅ A research and educational tool
- ✅ A decision-support system for healthcare professionals
- ✅ An early warning indicator

It is **NOT:**

- ❌ A medical diagnostic device
- ❌ A replacement for professional medical advice
- ❌ FDA approved or clinically validated
- ❌ Intended for treatment decisions

### Compliance

- **Not HIPAA compliant** (do not use with protected health information)
- **Not FDA cleared** (not a medical device)
- For research/educational use only

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

**MongoDB Connection Error:**
```bash
# Check MongoDB Atlas IP whitelist
# Verify credentials in .env
# Test connection: mongosh "your-connection-string"
```

**ML Service Not Found:**
```bash
# Ensure Flask is running on port 5001
# Check: curl http://localhost:5001/ml/health
```

**CORS Errors:**
```bash
# Add your frontend URL to CORS_ORIGINS in .env
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
```

## 📧 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review logs in `logs/` directory

---

**Version:** 2.0.0  
**Last Updated:** January 25, 2026  
**Status:** Beta - Active Development

