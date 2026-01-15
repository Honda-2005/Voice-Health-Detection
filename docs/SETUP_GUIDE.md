# Setup Guide
Voice Health Detection - Person 1: Authentication & User Management

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - [Download Python](https://www.python.org/downloads/)
- **MongoDB 7.0+** - [Download MongoDB](https://www.mongodb.com/try/download/community) or use Docker
- **Node.js 18+** (optional, for frontend development) - [Download Node.js](https://nodejs.org/)
- **Docker & Docker Compose** (recommended) - [Download Docker](https://www.docker.com/get-started)

## Quick Start with Docker (Recommended)

### 1. Clone the Repository

```bash
cd Voice-Health-Detection
```

### 2. Configure Environment Variables

The `.env` file is already created with default values. For production, update the following:

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=voice_health_detection

# JWT (⚠️ CHANGE THIS IN PRODUCTION)
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### 3. Start Services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- **MongoDB** on port `27017`
- **Backend API** on port `8000`
- **Frontend** on port `3000`

### 4. Verify Installation

- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs
- Frontend: http://localhost:3000/views/homepage.html

### 5. Stop Services

```bash
docker-compose down
```

To remove volumes (⚠️ deletes all data):
```bash
docker-compose down -v
```

---

## Manual Setup (Without Docker)

### 1. Install MongoDB

**Windows:**
- Download and install MongoDB Community Server
- Start MongoDB service

**Linux/Mac:**
```bash
# Install MongoDB
# Follow instructions at: https://docs.mongodb.com/manual/installation/

# Start MongoDB
mongod --dbpath /path/to/data/directory
```

### 2. Setup Python Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Edit `.env` file with your MongoDB connection details.

### 4. Run the Backend

```bash
# From project root
python backend/main.py
```

Or using uvicorn directly:
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

### 5. Serve the Frontend

Option 1 - Python HTTP Server:
```bash
cd frontend
python -m http.server 3000
```

Option 2 - Node.js HTTP Server:
```bash
cd frontend
npx http-server -p 3000
```

The frontend will be available at http://localhost:3000

---

## Running Tests

### Run All Tests

```bash
pytest backend/tests/ -v
```

### Run Specific Test File

```bash
pytest backend/tests/test_auth.py -v
```

### Run with Coverage

```bash
pytest backend/tests/ --cov=backend --cov-report=html
```

View coverage report: `open htmlcov/index.html`

---

## Development Workflow

### 1. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or use your local installation
mongod
```

### 2. Start Backend (Development Mode)

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Run with auto-reload
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start Frontend

```bash
cd frontend
python -m http.server 3000
```

### 4. Access the Application

- Frontend: http://localhost:3000/views/homepage.html
- API Docs: http://localhost:8000/api/docs
- Redoc: http://localhost:8000/api/redoc

---

## Common Issues & Troubleshooting

### MongoDB Connection Failed

**Error:** `ConnectionFailure: Could not connect to MongoDB`

**Solution:**
- Ensure MongoDB is running
- Check `MONGODB_URL` in `.env`
- Verify MongoDB port (default: 27017)

### Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8000 | xargs kill -9
```

### Import Errors

**Error:** `ModuleNotFoundError`

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### CORS Errors

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
- Add frontend URL to `CORS_ORIGINS` in `.env`
- Restart backend server

---

## Production Deployment

### Environment Variables

Create a production `.env` file:

```env
# MongoDB (use production connection string)
MONGODB_URL=mongodb://username:password@host:port/database

# JWT (use strong secret key!)
JWT_SECRET_KEY=<generate-strong-random-key-here>
JWT_EXPIRATION_MINUTES=60

# CORS (set your production domains)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Application
DEBUG=False
```

### Generate Secure JWT Secret

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Docker Deployment

```bash
# Build and run in production mode
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f backend

# Scale services
docker-compose up -d --scale backend=3
```

---

## Next Steps

1. ✅ Complete setup and verify installation
2. 📖 Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
3. 🔧 Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API reference
4. 🧪 Run tests to ensure everything works
5. 🚀 Start building!

---

## Support

For issues or questions:
- Check the documentation in `/docs`
- Review API documentation at `/api/docs`
- Contact: Person 1 - Authentication & User Management Team
