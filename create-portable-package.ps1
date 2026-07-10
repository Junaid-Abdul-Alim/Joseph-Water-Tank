Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Creating Portable Package..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Build production version
Write-Host "[1/5] Building production version..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build complete" -ForegroundColor Green
Write-Host ""

# Create package directory
Write-Host "[2/5] Creating package directory..." -ForegroundColor Yellow
$packageDir = "WaterQualityMonitor-Portable"
if (Test-Path $packageDir) {
    Remove-Item $packageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $packageDir | Out-Null
Write-Host "✅ Directory created" -ForegroundColor Green
Write-Host ""

# Copy application files
Write-Host "[3/5] Copying application files..." -ForegroundColor Yellow
$filesToCopy = @(
    "dist",
    "electron", 
    "bridge-server",
    "public",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "START-APP.bat",
    "start-desktop.bat",
    "launch-silent.vbs",
    "create-desktop-shortcut.ps1",
    "recreate-desktop-shortcut.ps1",
    "auto-setup.bat",
    "UNBLOCK-AND-INSTALL.bat",
    "SIMPLE-INSTALL.bat",
    "FIX-SECURITY-WARNING.txt",
    "USER_GUIDE.md",
    "README.md"
)

foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        Copy-Item $item -Destination $packageDir -Recurse -Force
        Write-Host "  + $item" -ForegroundColor Gray
    } else {
        Write-Host "  ! $item not found (skipped)" -ForegroundColor Yellow
    }
}

# Copy .env.example (DO NOT copy actual .env!)
if (Test-Path "bridge-server\.env.example") {
    Copy-Item "bridge-server\.env.example" -Destination "$packageDir\bridge-server\.env.example" -Force
    Write-Host "  + bridge-server\.env.example" -ForegroundColor Gray
}

Write-Host "✅ Files copied" -ForegroundColor Green
Write-Host ""

# Create setup files
Write-Host "[4/5] Creating setup files..." -ForegroundColor Yellow

# .gitignore
@"
node_modules/
.env
*.db
*.db-journal
*.db-wal
release/
.vscode/
*.log
"@ | Out-File "$packageDir\.gitignore" -Encoding utf8

# SETUP_INSTRUCTIONS.txt
@"
================================================================================
  WATER QUALITY MONITOR - SETUP INSTRUCTIONS
================================================================================

Quick Setup (5-10 minutes):

STEP 1: Install Node.js
-----------------------
1. Visit: https://nodejs.org/
2. Download LTS version (v18 or higher)
3. Run installer and accept defaults
4. Verify installation:
   Open PowerShell and run: node --version
   Should show: v18.x.x or higher

STEP 2: Install Dependencies
-----------------------------
1. Open PowerShell in this folder (right-click → "Open in Terminal")
2. Run these commands:
   
   npm install
   cd bridge-server
   npm install
   cd ..

   (This takes 3-5 minutes depending on internet speed)

STEP 3: Configure TTN Credentials
----------------------------------
1. Navigate to: bridge-server folder
2. Copy .env.example to .env
   PowerShell command: Copy-Item bridge-server\.env.example -Destination bridge-server\.env
3. Edit .env file with your TTN credentials:
   PowerShell command: notepad bridge-server\.env
   
   Enter your values:
   TTN_MQTT_USERNAME=your-application-id@ttn
   TTN_MQTT_PASSWORD=NNSXS.YOUR.API.KEY.HERE
   TTN_MQTT_TOPIC=v3/your-application-id@ttn/devices/+/up
   TTN_DEVICE_ID=your-device-id
   
   Save and close notepad.

STEP 4: Create Desktop Shortcut
--------------------------------
PowerShell command:
   powershell -ExecutionPolicy Bypass -File create-desktop-shortcut.ps1

STEP 5: Launch Application
---------------------------
Double-click "Water Quality Monitor" shortcut on your desktop!

================================================================================

AUTOMATED SETUP (Recommended):

Instead of manual steps 2-4 above, you can run:
   auto-setup.bat

This will automatically install dependencies and create the shortcut.
You'll still need to configure .env manually (Step 3).

================================================================================

For detailed documentation, see:
- README.md - Application overview and features
- INSTALLATION.md - Detailed installation instructions
- TROUBLESHOOTING.md - Common issues and solutions
- DEPLOYMENT.md - Installing on multiple computers

Need help? Check TROUBLESHOOTING.md first!

================================================================================
"@ | Out-File "$packageDir\SETUP_INSTRUCTIONS.txt" -Encoding utf8

# auto-setup.bat
@"
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

echo [1/4] Node.js found: 
node --version
echo.

echo [2/4] Installing main dependencies...
echo (This may take 2-3 minutes)
call npm install --production
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Try running: npm cache clean --force
    echo Then run this script again.
    pause
    exit /b 1
)
echo.

echo [3/4] Installing bridge server dependencies...
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

echo [4/4] Creating desktop shortcut...
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
"@ | Out-File "$packageDir\auto-setup.bat" -Encoding ascii

Write-Host "  + SETUP_INSTRUCTIONS.txt" -ForegroundColor Gray
Write-Host "  + auto-setup.bat" -ForegroundColor Gray
Write-Host "  + .gitignore" -ForegroundColor Gray
Write-Host "SUCCESS: Setup files created" -ForegroundColor Green
Write-Host ""

# Create ZIP archive
Write-Host "[5/5] Creating ZIP archive..." -ForegroundColor Yellow
$zipPath = "$packageDir.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}
Compress-Archive -Path "$packageDir\*" -DestinationPath $zipPath -Force

$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "SUCCESS: ZIP created: $zipSize MB" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Green
Write-Host "  PACKAGE CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Package Location:" -ForegroundColor Cyan
Write-Host "   $(Resolve-Path $zipPath)" -ForegroundColor White
Write-Host ""
Write-Host "Package Size: $zipSize MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Contents:" -ForegroundColor Cyan
Write-Host "   + Application files (dist, electron, bridge-server)" -ForegroundColor White
Write-Host "   + Configuration template (.env.example)" -ForegroundColor White
Write-Host "   + Setup scripts (auto-setup.bat)" -ForegroundColor White
Write-Host "   + Documentation (README, INSTALLATION, etc.)" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  NEXT STEPS" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "To install on another computer:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Transfer the ZIP file:" -ForegroundColor Yellow
Write-Host "   - USB drive, cloud storage, or network share" -ForegroundColor White
Write-Host ""
Write-Host "2. On the target computer:" -ForegroundColor Yellow
Write-Host "   - Extract ZIP to desired location" -ForegroundColor White
Write-Host "   - Install Node.js (https://nodejs.org/)" -ForegroundColor White
Write-Host "   - Run: auto-setup.bat" -ForegroundColor White
Write-Host "   - Configure: bridge-server\.env" -ForegroundColor White
Write-Host "   - Launch: Double-click desktop shortcut" -ForegroundColor White
Write-Host ""
Write-Host "3. Quick validation:" -ForegroundColor Yellow
Write-Host "   - Application should open without terminal window" -ForegroundColor White
Write-Host "   - Dashboard displays sensor data" -ForegroundColor White
Write-Host "   - History page accessible" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Gray
Write-Host ""

# Open folder containing the ZIP
Write-Host "Opening folder..." -ForegroundColor Gray
Start-Process explorer.exe (Get-Location).Path
