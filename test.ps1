# Voice Health Detection - Test Runner Script (PowerShell)

Write-Host "🧪 Running Tests..." -ForegroundColor Cyan

# 1. Check for Node.js
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
        # Also try to find npm relative to node
        $npmPath = Join-Path (Split-Path $nodePath) "npm.cmd"
        if (Test-Path $npmPath) {
             Set-Alias npm $npmPath
        } else {
             $npmPath = Join-Path (Split-Path $nodePath) "node_modules\npm\bin\npm-cli.js"
             if (Test-Path $npmPath) {
                function global:npm { node $npmPath $args }
             }
        }
    } else {
        Write-Host "❌ Node.js not found! Please install Node.js from nodejs.org" -ForegroundColor Red
        exit 1
    }
}

# 2. Run Tests
Write-Host "   -> Executing npm test..." -ForegroundColor Green
try {
    npm test
} catch {
    Write-Host "❌ Test execution failed." -ForegroundColor Red
    exit 1
}
