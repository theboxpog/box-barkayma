@echo off
echo ========================================
echo Starting Backend Server (Port 5000)
echo ========================================
echo.
cd /d "%~dp0"
call npm run server
