# 🚀 How to Run Voice Health Detection

This project requires **two** running services (ML Service & Backend) to function.
To make this easy, a new automated script `start_services.ps1` has been created.

## ✅ Option 1: The Easy Way (Automated Script)

1.  **Open Terminal** (PowerShell).
2.  **Navigate to the project folder:**
    ```powershell
    cd "d:\MIU COLLEG STUDY\2 Secound year\semester 2\WEB DEVOLEBMENT\github project\quickbite\quickbite\Voice-Health-Detection"
    ```
3.  **Run the Start Script:**
    ```powershell
    .\start_services.ps1
    ```
    *This will correctly locate your local Python and Node.js versions and launch both services automatically.*

---

## 🛠️ Option 2: The Manual Way

If you prefer to run services in separate terminals, follow these steps:

### Terminal 1: Application Backend
```powershell
# 1. Navigate to project root
cd "d:\MIU COLLEG STUDY\2 Secound year\semester 2\WEB DEVOLEBMENT\github project\quickbite\quickbite\Voice-Health-Detection"

# 2. Run the server using the local Node executable
& "..\..\..\Backend\gnode.exe" server.js
```

### Terminal 2: ML Service
```powershell
# 1. Navigate to project root
cd "d:\MIU COLLEG STUDY\2 Secound year\semester 2\WEB DEVOLEBMENT\github project\quickbite\quickbite\Voice-Health-Detection"

# 2. Set Environment Variables
$env:ML_MODEL_PATH="./ml-service/models/model.joblib"
$env:SCALER_PATH="./ml-service/models/scaler.joblib"

# 3. Virtual Environment Python to run the app
.\venv\Scripts\python ml-service/app.py
```

---

## ⚠️ Important Note: Database Access

Your **MongoDB Atlas** database connection is currently blocked by an IP Filter.
- **Symptom**: You can view the Login page, but if you try to Register or Login, it will fail (timeout).
- **Fix**: Go to MongoDB Atlas > Network Access > **Add Current IP Address**.
