Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTARTING TOOL RENTAL APPLICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Write-Host "   [OK] All Node.js processes stopped" -ForegroundColor Green
} catch {
    Write-Host "   [INFO] No Node.js processes were running" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Step 2: Waiting for ports to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "   [OK] Ports released" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Starting backend server..." -ForegroundColor Yellow
Write-Host "   Backend will run on http://localhost:5000" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run server" -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "   [OK] Backend server started" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Starting frontend..." -ForegroundColor Yellow
Write-Host "   Frontend will run on http://localhost:5001 (or 3000)" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm start" -WindowStyle Normal
Write-Host "   [OK] Frontend starting..." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   APPLICATION STARTED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "Frontend: http://localhost:5001 (or 3000)" -ForegroundColor White
Write-Host ""
Write-Host "Two new PowerShell windows have opened:" -ForegroundColor White
Write-Host "  1. Backend Server (Node.js)" -ForegroundColor White
Write-Host "  2. Frontend (React)" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
