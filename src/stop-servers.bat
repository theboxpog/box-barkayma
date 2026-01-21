@echo off
echo Stopping Tool Rental Servers...
echo.

echo Stopping backend (port 5000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /PID %%a /F
)

echo.
echo Stopping frontend (port 5001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /PID %%a /F
)

echo.
echo Done! All servers stopped.
pause
