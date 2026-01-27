# Voice Health Detection - Universal Start Script (PowerShell)

Write-Host "🚀 Starting Voice Health Detection System..." -ForegroundColor Green

# 1. Check for Python
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found! Please install Python." -ForegroundColor Red
    exit 1
}

# 2. Check for Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️ 'node' command not found in PATH." -ForegroundColor Yellow
    Write-Host "   Attempting to find typical locations..."
    
    $possiblePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe"
    )
    
    $nodePath = ""
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $nodePath = $path
            break
        }
    }
    
    if ($nodePath) {
        Write-Host "✅ Found Node.js at: $nodePath" -ForegroundColor Green
        Set-Alias node $nodePath
    } else {
        Write-Host "❌ Node.js not found! Please install Node.js from nodejs.org" -ForegroundColor Red
        exit 1
    }
}

# 3. Install Python Dependencies (Optional)
if ($args -contains "--install") {
    Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
    python -m pip install -r ml-service/requirements.txt
}

# 4. Train Model (if missing)
if (-not (Test-Path "ml-service/models/model.joblib")) {
    Write-Host "🧠 Training ML Model..." -ForegroundColor Cyan
    python ml-service/train_model_optimized.py
} else {
    Write-Host "✅ ML Model already exists." -ForegroundColor Green
}

# 5. Start Services
Write-Host "⚡ Starting Services..." -ForegroundColor Cyan

# Start ML Service in background
$mlProcess = Start-Process -FilePath "python" -ArgumentList "ml-service/app.py" -PassThru -NoNewWindow
Write-Host "   -> ML Service started (PID: $($mlProcess.Id))" -ForegroundColor Blue

# Wait for ML service
Start-Sleep -Seconds 3

# Start Backend
Write-Host "   -> Starting Node.js Backend..." -ForegroundColor Green
npm run dev

# Cleanup on exit
Stop-Process -Id $mlProcess.Id -ErrorAction SilentlyContinue
