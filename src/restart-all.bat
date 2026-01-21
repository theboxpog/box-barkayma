@echo off
echo ========================================
echo   RESTARTING TOOL RENTAL APPLICATION
echo ========================================
echo.

echo Step 1: Closing previous command windows...
taskkill /FI "WINDOWTITLE eq Backend Server*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend*" /F >nul 2>&1
echo    [OK] Previous windows closed
echo.

echo Step 2: Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    [OK] All Node.js processes stopped
) else (
    echo    [INFO] No Node.js processes were running
)
echo.

echo Step 3: Waiting for ports to be released...
timeout /t 2 /nobreak >nul
echo    [OK] Ports released
echo.

echo Step 4: Starting backend server...
echo    Backend will run on http://localhost:5000
start "Backend Server" cmd /k "cd /d %~dp0server && npm start"
timeout /t 3 /nobreak >nul
echo    [OK] Backend server started
echo.

echo Step 5: Starting frontend...
echo    Frontend will run on http://localhost:5001
start "Frontend" cmd /k "cd /d %~dp0client && npm start"
echo    [OK] Frontend starting...
echo.

echo ========================================
echo   APPLICATION STARTED!
echo ========================================
echo.
echo Backend: http://localhost:5000/api/health
echo Frontend: http://localhost:5001
echo.
echo Two new windows have opened:
echo   1. Backend Server (Node.js)
echo   2. Frontend (React)
echo.
echo Press any key to close this window...
pause >nul
