# Voice Health Detection - Unified Start Script
# 🚀 Automates environment setup and service startup

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Voice Health Detection - Launch System         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# --- COFIGURATION ---
$BackendDir = "..\..\..\Backend"
$NodeExe = "$BackendDir\gnode.exe"
$NpmCli = "$BackendDir\node_modules\npm\bin\npm-cli.js"
$VenvPython = ".\venv\Scripts\python.exe"
$MlApp = "ml-service\app.py"
$ServerJs = "server.js"

# --- 1. VALIDATE ENVIRONMENT ---

Write-Host "`n🔍 Checking Environment..." -ForegroundColor Yellow

# Check Node.js
if (Test-Path $NodeExe) {
    Write-Host "  ✅ Node.js found at: $NodeExe" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js NOT found at $NodeExe" -ForegroundColor Red
    Write-Host "  Attempting to use global 'node'..."
    if (Get-Command "node" -ErrorAction SilentlyContinue) {
        $NodeExe = "node"
    } else {
        Write-Host "  ❌ Critical: No Node.js found." -ForegroundColor Red
        exit 1
    }
}

# Check Python Venv
if (Test-Path $VenvPython) {
    Write-Host "  ✅ Python Venv found at: $VenvPython" -ForegroundColor Green
} else {
    Write-Host "  ❌ Python Venv NOT found at $VenvPython" -ForegroundColor Red
    Write-Host "  Attempting to use global 'python'..."
    if (Get-Command "python" -ErrorAction SilentlyContinue) {
        $VenvPython = "python"
    } else {
        Write-Host "  ❌ Critical: No Python found." -ForegroundColor Red
        exit 1
    }
}

# --- 2. START ML SERVICE ---

Write-Host "`n🧠 Starting Machine Learning Service (Port 5001)..." -ForegroundColor Magenta

# Set Env Vars for ML Service
$env:ML_MODEL_PATH = "./ml-service/models/model.joblib"
$env:SCALER_PATH = "./ml-service/models/scaler.joblib"

# Start ML Service Process
$mlJob = Start-Job -ScriptBlock {
    param($python, $app)
    & $python $app
} -ArgumentList $VenvPython, $MlApp

# Wait a moment for ML service to initialize
Start-Sleep -Seconds 5
if ($mlJob.State -eq 'Running') {
    Write-Host "  ✅ ML Service is running in background." -ForegroundColor Green
} else {
    Write-Host "  ❌ ML Service failed to start." -ForegroundColor Red
    Receive-Job $mlJob
}

# --- 3. START BACKEND SERVICE ---

Write-Host "`n⚡ Starting Backend Server (Port 5000)..." -ForegroundColor Cyan

Write-Host "  ℹ️  Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host "  ℹ️  If 'Registration Failed' occurs, check MongoDB Whitelist." -ForegroundColor Yellow

# Start Node Server
try {
    & $NodeExe $ServerJs
} finally {
    # Cleanup on exit
    Write-Host "`n🛑 Shutting down ML Service..." -ForegroundColor Yellow
    Stop-Job $mlJob
    Remove-Job $mlJob
    Write-Host "✅ Done." -ForegroundColor Green
}
