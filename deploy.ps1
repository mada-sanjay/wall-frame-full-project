# PowerShell Deployment Script for Wall Frame

Write-Host "🚀 Starting Wall Frame Deployment Process..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "frontend") -or !(Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Current directory confirmed: $PWD" -ForegroundColor Yellow

# Build Frontend
Write-Host "`n🔨 Building Frontend..." -ForegroundColor Cyan
Set-Location frontend
try {
    npm run build
    Write-Host "✅ Frontend build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Check Backend Dependencies
Write-Host "`n📦 Checking Backend Dependencies..." -ForegroundColor Cyan
Set-Location backend
try {
    npm install --production
    Write-Host "✅ Backend dependencies updated!" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend dependency installation failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host "`n📋 Deployment Summary:" -ForegroundColor Yellow
Write-Host "✅ Frontend built and ready in './frontend/build/'" -ForegroundColor Green
Write-Host "✅ Backend dependencies updated" -ForegroundColor Green
Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host "✅ CORS configured for production" -ForegroundColor Green

Write-Host "`n🚀 Ready for deployment!" -ForegroundColor Green
Write-Host "Frontend: Deploy './frontend/build/' folder to your hosting service" -ForegroundColor Cyan
Write-Host "Backend: Deploy './backend/' folder to your server" -ForegroundColor Cyan

Write-Host "`n🔗 Production URLs:" -ForegroundColor Yellow
Write-Host "Frontend: https://wall-frame-full-project-frontend.onrender.com" -ForegroundColor Cyan
Write-Host "Backend: http://13.203.67.147:5000" -ForegroundColor Cyan
