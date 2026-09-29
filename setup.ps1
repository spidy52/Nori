# Nori Complete 1-Click Setup & Verification Script for Windows
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Setting up Nori AI Work Companion Environment   " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# 1. Check Python
Write-Host "`n[1/6] Checking Python installation..." -ForegroundColor Yellow
$pyVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python 3.10+ is required. Please install Python from python.org and add to PATH." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Detected $pyVersion" -ForegroundColor Green
}

# 2. Setup Virtual Environment
Write-Host "`n[2/6] Configuring Python Virtual Environment (venv)..." -ForegroundColor Yellow
if (-not (Test-Path ".\venv")) {
    Write-Host "Creating venv..." -ForegroundColor Gray
    python -m venv venv
}
& ".\venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\venv\Scripts\pip.exe" install -r backend\requirements.txt

# 3. Check Node.js & npm
Write-Host "`n[3/6] Checking Node.js and npm..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js 18+ is required. Please install Node.js." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Detected Node $nodeVersion" -ForegroundColor Green
}

# 4. Install Node Dependencies
Write-Host "`n[4/6] Installing Node dependencies (Root, Frontend, Electron)..." -ForegroundColor Yellow
npm install
npm --prefix frontend install
npm --prefix electron install

# 5. Pre-warm Whisper Model Cache
Write-Host "`n[5/6] Initializing offline Whisper speech recognition model..." -ForegroundColor Yellow
$pyScript = @"
from backend.voice.whisper_engine import whisper_engine
whisper_engine.initialize()
print('Whisper engine initialized successfully.')
"@
& ".\venv\Scripts\python.exe" -c $pyScript

# 6. Check Ollama Local LLM
Write-Host "`n[6/6] Checking local Ollama LLM provider..." -ForegroundColor Yellow
$ollamaExe = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
if (Test-Path $ollamaExe) {
    Write-Host "✅ Ollama is installed." -ForegroundColor Green
    Write-Host "Tip: To pull high-speed local models, run: ollama pull qwen2.5:1.5b" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️ Ollama is not installed in default path. Nori will use DirectML/CPU fallback." -ForegroundColor Gray
}

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "   ✅ Setup Complete! Run '.\start-all.ps1' or 'npm start' to begin." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
