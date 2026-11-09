@echo off
setlocal enabledelayedexpansion
title AI Interview Coach - Application Launcher

echo =====================================================================
echo                  AI INTERVIEW COACH - APPLICATION RUNNER
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking MongoDB Database Service...
netstat -ano | findstr ":27017 " | findstr "LISTENING" >nul
if errorlevel 1 (
    echo MongoDB is not detected on port 27017.
    echo Attempting to start MongoDB Windows service...
    sc start MongoDB >nul 2>&1
    timeout /t 3 /nobreak >nul
    netstat -ano | findstr ":27017 " | findstr "LISTENING" >nul
    if errorlevel 1 (
        echo [WARNING] MongoDB service could not be started automatically.
        echo Please ensure MongoDB Server is installed and running.
    ) else (
        echo [OK] MongoDB service started successfully.
    )
) else (
    echo [OK] MongoDB is running on port 27017.
)
echo.

echo [2/3] Starting FastAPI Backend (Port 8000)...
start "AI Interview Coach - Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Vite Frontend (Port 5173)...
start "AI Interview Coach - Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo =====================================================================
echo Application started successfully in separate terminal windows!
echo.
echo   - Frontend:    http://localhost:5173
echo   - Backend:     http://localhost:8000
echo   - API Docs:    http://localhost:8000/docs
echo   - Admin User:  admin@interview.ai
echo   - Demo User:   demo@interview.ai
echo.
echo Both terminal windows will remain open while the application runs.
echo To safely stop all running servers, double-click stop.bat
echo =====================================================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

pause
