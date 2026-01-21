@echo off
echo ========================================
echo Starting Frontend Server (Port 3000)
echo ========================================
echo.
echo IMPORTANT: Make sure backend is running first!
echo.
timeout /t 3
cd /d "%~dp0"
call npm start
