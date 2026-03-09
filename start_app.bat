@echo off
title ServiceTestDemo - Startup Script
color 0b

echo =======================================================
echo          ServiceTestDemo Full Stack Startup
echo =======================================================
echo.

echo [1/2] Installing dependencies and Starting the Backend Server (Port 5000)...
start "Backend Server" /D "%~dp0\backend" cmd /k "echo Installing Backend Dependencies... && npm install && echo Starting Backend Server... && npm run dev"

timeout /t 2 /nobreak > nul

echo [2/2] Installing dependencies and Starting the Frontend Client (Port 5173)...
start "Frontend Client" /D "%~dp0" cmd /k "echo Installing Frontend Dependencies... && npm install && echo Starting Frontend Client... && npm run dev"

echo.
echo =======================================================
echo Both servers are launching in separate windows!
echo It will take a minute or two to install packages first.
echo Close this window at any time. (Keep the other two open)
echo =======================================================
echo.
pause
