@echo off
echo ============================================
echo  Water Quality Monitor - Automated Setup
echo ============================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    echo.
    echo Please install Node.js first from:
    echo https://nodejs.org/
    echo.
    echo After installing Node.js, run this script again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Node.js found: 
node --version
echo.

echo [2/3] Installing bridge server dependencies...
echo (This may take 1-2 minutes)
cd bridge-server
call npm install --production
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install bridge server dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [3/3] Creating desktop shortcut...
powershell -ExecutionPolicy Bypass -File create-desktop-shortcut.ps1
if %errorlevel% neq 0 (
    echo WARNING: Could not create desktop shortcut
    echo You can create it manually later.
)
echo.

echo ============================================
echo  SETUP COMPLETE!
echo ============================================
echo.
echo NEXT STEPS:
echo.
echo 1. Configure TTN credentials:
echo    - Open: bridge-server\.env (copy from .env.example if needed)
echo    - Add your TTN MQTT username, password, and topic
echo.
echo 2. Launch the application:
echo    - Double-click "Water Quality Monitor" on your desktop
echo    - Or run: start-desktop.bat
echo.
echo For help, see SETUP_INSTRUCTIONS.txt
echo.
pause
