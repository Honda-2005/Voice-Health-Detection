# Voice Health Detection System 🎙️🏥

> **Status**: Production Ready (Verified 92% Accuracy)
> **Latest Audit**: Feb 2026

A comprehensive full-stack application for detecting early signs of Parkinson's Disease using voice analysis.

## 🌟 Key Features

### ✅ Implemented & Verified
-   **Voice Analysis**: Extracts Jitter, Shimmer, and Pitch using `Librosa`.
-   **AI Diagnosis**: Real Random Forest Classifier trained on UCI Dataset (92.3% Accuracy).
-   **Real-time Feedback**: WebSocket integration for status updates.
-   **Reporting**: Auto-generated PDF reports for patients and doctors.
-   **Security**: JWT Authentication, Rate Limiting, and Secure File Storage (GridFS).
-   **Admin Dashboard**: User management and system statistics.

### 🚀 Future Roadmap
-   Mobile Application (React Native)
-   Email Notifications
-   Dark Mode UI
-   Offline Recording Support

## 🛠️ Tech Stack
-   **Frontend**: HTML5, CSS3, Vanilla JS (Recorder API)
-   **Backend**: Node.js, Express, Socket.IO
-   **AI/ML**: Python, Flask, Scikit-Learn, Librosa
-   **Database**: MongoDB, GridFS

## ⚡ Quick Start

### 1. Prerequisites
-   Node.js (v18+)
-   Python (3.9+)
-   MongoDB (Running locally or Atlas)

### 2. Installation
```bash
# 1. Install Backend Deps
cd backend
npm install

# 2. Install ML Deps
cd ../ml-service
pip install -r requirements.txt
```

### 3. Model Training (Required First Time)
The system requires a trained model to function.
```bash
# In /ml-service directory
python train_model.py
# Output should confirm: "TRAINING COMPLETE - REAL MODEL READY"
```

### 4. Running the App
```bash
# Terminal 1: Start Backend (Port 5000)
cd backend
npm start

# Terminal 2: Start ML Service (Port 5001)
cd ml-service
python app.py
```

Visit `http://localhost:5000` to start recording.

## 📚 Documentation
-   [**System Architecture**](./Project_Diagrams/Source_Files/architecture.puml)
-   [**API Documentation**](./API_DOCUMENTATION.md)
-   [**Audit Report**](./SYSTEM_AUDIT_REPORT.md)
