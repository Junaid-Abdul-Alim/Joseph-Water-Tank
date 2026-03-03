@echo off
echo ========================================
echo  Fluid Fusion RO Dashboard
echo ========================================
echo.
echo Starting application...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installing bridge server dependencies...
cd bridge-server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install bridge server dependencies
    pause
    exit /b 1
)

echo [2/3] Installing React app dependencies...
cd ..
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install React app dependencies
    pause
    exit /b 1
)

echo.
echo [3/3] Starting Bridge Server + React Dashboard...
echo.
echo ========================================
echo  BOTH SERVERS RUNNING IN ONE WINDOW
echo ========================================
echo.
echo Bridge Server: http://localhost:3333
echo React Dashboard: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

npm start
