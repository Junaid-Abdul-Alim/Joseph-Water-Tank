@echo off
echo ========================================
echo  Water Quality Monitor - Desktop App
echo ========================================
echo.
echo Starting Desktop Application...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Build the React app if the production HTML doesn't exist
if not exist "dist\index.html" (
    echo Building application for first run...
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build application
        pause
        exit /b 1
    )
)

echo.
echo Launching Desktop App...
echo.

if exist "node_modules\.bin\electron.cmd" (
    call "node_modules\.bin\electron.cmd" .
) else (
    call npm run electron:start
)
