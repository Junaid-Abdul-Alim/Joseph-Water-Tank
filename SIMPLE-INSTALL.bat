@echo off
REM ============================================================================
REM  Water Quality Monitor - SIMPLE INSTALLER
REM  No PowerShell required - Works on all Windows systems
REM ============================================================================

echo.
echo ============================================================================
echo   Water Quality Monitor - Installation
echo   Developed by Fluid Fusion Team - Dr. Vinod Kumar
echo ============================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo   1. Visit: https://nodejs.org/
    echo   2. Download LTS version
    echo   3. Install and restart your computer
    echo   4. Run this script again
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Install bridge server dependencies
echo ============================================================================
echo   Step 1: Installing Bridge Server Dependencies
echo ============================================================================
echo.

cd bridge-server
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install bridge server dependencies!
    echo.
    pause
    exit /b 1
)

cd ..

echo.
echo SUCCESS: Bridge server dependencies installed!
echo.

REM Create .env file if it doesn't exist
if not exist "bridge-server\.env" (
    echo ============================================================================
    echo   Step 2: Creating Configuration File
    echo ============================================================================
    echo.
    
    if exist "bridge-server\.env.example" (
        copy "bridge-server\.env.example" "bridge-server\.env" >nul
        echo Configuration file created: bridge-server\.env
        echo.
        echo IMPORTANT: You must edit this file with your TTN credentials!
        echo.
    ) else (
        echo Warning: .env.example not found
        echo You will need to create bridge-server\.env manually
        echo.
    )
)

REM Create desktop shortcut manually
echo ============================================================================
echo   Step 3: Desktop Shortcut
echo ============================================================================
echo.
echo To create a desktop shortcut:
echo   1. Right-click on "launch-silent.vbs" in this folder
echo   2. Select "Create shortcut"
echo   3. Drag the shortcut to your Desktop
echo   4. Rename it to "Water Quality Monitor"
echo.
echo OR use this shortcut creator (requires PowerShell):
echo   Right-click create-desktop-shortcut.ps1 ^> Run with PowerShell
echo.

REM Open .env file for editing
echo ============================================================================
echo   Step 4: Configure TTN Credentials
echo ============================================================================
echo.
echo Opening configuration file for editing...
timeout /t 2 >nul
notepad "bridge-server\.env"

echo.
echo ============================================================================
echo   INSTALLATION COMPLETE!
echo ============================================================================
echo.
echo To start the application:
echo   1. Double-click desktop shortcut "Water Quality Monitor"
echo   2. OR run START-APP.bat from this folder
echo   3. Dashboard will open in your browser at http://localhost:3000
echo.
echo IMPORTANT:
echo   - Configure your TTN credentials in bridge-server\.env
echo   - Keep the bridge server window running
echo   - Access dashboard through your browser
echo.
echo For help, see README-INSTALLATION.txt
echo.
pause
