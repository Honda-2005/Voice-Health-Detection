# Voice Health Detection - Local Production Deployment (Windows)

Write-Host "🚀 Starting Full Deployment (Local Windows)..." -ForegroundColor Green

# 1. Environment Check
$pythonVersion = python --version
$nodeVersion = node --version

if (-not $?) {
    Write-Host "❌ Error: Python or Node.js is missing." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Environment verified: $pythonVersion, Node $nodeVersion" -ForegroundColor Gray

# 2. Database Confirmation
Write-Host "ℹ️  Ensure your MongoDB instance is running separately." -ForegroundColor Yellow
# Optional: Check for mongo connection if possible, or just proceed.

# 3. Python Setup (ML Service)
Write-Host "📦 Setting up ML Service..." -ForegroundColor Cyan
Push-Location "ml-service"
try {
    # Install dependencies including production server 'waitress'
    pip install -r requirements.txt
    pip install waitress
    
    # Train model if needed
    if (-not (Test-Path "models/model.joblib")) {
        Write-Host "🧠 Training Model..." -ForegroundColor Yellow
        python train_model_optimized.py
    }
} finally {
    Pop-Location
}

# 4. Node.js Setup (Backend)
Write-Host "📦 Setting up Backend..." -ForegroundColor Cyan
# Install production dependencies
npm ci --omit=dev
if (-not $?) {
    Write-Host "⚠️ 'npm ci' failed (maybe no lockfile?), trying 'npm install'..."
    npm install --omit=dev
}

# 5. Start Services
Write-Host "⚡ Starting Services in PRODUCTION mode..." -ForegroundColor Magenta

# Start ML Service with Waitress (Background)
$mlProcess = Start-Process -FilePath "waitress-serve" -ArgumentList "--listen=127.0.0.1:5001 --chdir=ml-service app:app" -PassThru -NoNewWindow
Write-Host "   -> ML Service (Waitress) started (PID: $($mlProcess.Id))" -ForegroundColor Green

# Wait a moment
Start-Sleep -Seconds 5

# Start Node.js Backend (Foreground)
Write-Host "   -> Starting Node.js Backend (npm start)..." -ForegroundColor Green
Write-Host "   -> Application will be available at http://localhost:5000" -ForegroundColor White
Write-Host "   -> Press Ctrl+C to stop the server." -ForegroundColor Red

try {
    npm start
} finally {
    # Cleanup on exit
    Write-Host "🛑 Shutting down ML Service..." -ForegroundColor Yellow
    Stop-Process -Id $mlProcess.Id -ErrorAction SilentlyContinue
}
