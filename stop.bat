@echo off
title AI Interview Coach - Stop Servers

echo =====================================================================
echo                AI INTERVIEW COACH - STOPPING SERVERS
echo =====================================================================
echo.

echo Stopping Backend on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 "') do (
    if "%%a" neq "0" taskkill /f /pid %%a >nul 2>&1
)

echo Stopping Frontend on port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do (
    if "%%a" neq "0" taskkill /f /pid %%a >nul 2>&1
)

echo.
echo All AI Interview Coach servers on ports 8000 and 5173 have been stopped.
echo =====================================================================
timeout /t 3 >nul
