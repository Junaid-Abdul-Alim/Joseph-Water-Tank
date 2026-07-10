@echo off
REM ============================================================================
REM  Water Quality Monitor - Browser Launcher
REM  Starts both the bridge server and dashboard, then opens the browser
REM ============================================================================

echo.
echo ============================================================================
echo   Water Quality Monitor - Starting...
echo ============================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing application dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install application dependencies.
        pause
        exit /b 1
    )
)

if not exist "bridge-server\node_modules" (
    echo Installing bridge server dependencies...
    cd bridge-server
    call npm install
    if %errorlevel% neq 0 (
        cd ..
        echo ERROR: Failed to install bridge server dependencies.
        pause
        exit /b 1
    )
    cd ..
)

REM Check if .env file exists
if not exist "bridge-server\.env" (
    echo WARNING: Configuration file missing!
    echo.
    echo Creating default .env file...
    if exist "bridge-server\.env.example" (
        copy "bridge-server\.env.example" "bridge-server\.env" >nul
        echo.
        echo IMPORTANT: Edit bridge-server\.env with your TTN credentials!
        echo Opening file now...
        timeout /t 2 >nul
        notepad "bridge-server\.env"
        echo.
    )
)

echo Starting Bridge Server + Dashboard...
echo (Keep this window open while using the application)
echo.

REM Open browser after Vite has a few seconds to start
start "" /B cmd /c "timeout /t 6 >nul && start http://localhost:3000"

echo.
echo ============================================================================
echo   Application Starting!
echo ============================================================================
echo.
echo Dashboard: http://localhost:3000
echo.
echo IMPORTANT: 
echo   - DO NOT close this window while using the application
echo   - Press Ctrl+C here to stop both servers
echo.
call npm start
