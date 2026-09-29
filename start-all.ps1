# Nori Full Suite PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Launching Nori AI Companion Full Suite..." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# 0. Check / Start Ollama
$ollamaProc = Get-Process -Name "*ollama*" -ErrorAction SilentlyContinue
$ollamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
if (-not $ollamaProc -and (Test-Path $ollamaExe)) {
    Write-Host "[0/4] Starting Ollama Local AI Service..." -ForegroundColor Yellow
    Start-Process $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[0/4] Local AI service ready." -ForegroundColor Green
}

# 1. Start Backend API Server
Write-Host "[1/4] Starting Backend Server on port 8000..." -ForegroundColor Yellow
$backendCmd = "cd '$rootDir'; if (Test-Path '.\venv\Scripts\Activate.ps1') { .\venv\Scripts\Activate.ps1 }; python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Start-Sleep -Seconds 2

# 2. Start Frontend Dev Server
Write-Host "[2/4] Starting React Frontend Dashboard..." -ForegroundColor Yellow
$frontendCmd = "cd '$rootDir\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Start-Sleep -Seconds 2

# 3. Start Electron Floating Companion
Write-Host "[3/4] Starting Floating Companion Orb & Voice Daemon..." -ForegroundColor Green
$electronCmd = "cd '$rootDir\electron'; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $electronCmd

# 4. Open UI
Write-Host "[4/4] Launching Dashboard in Browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host "`nNori is running! Press Alt+N anytime to toggle the floating pet." -ForegroundColor Cyan

