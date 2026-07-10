# Installing Water Quality Monitor on Another Computer

This guide explains how to install and run the **Water Quality Monitor** application on a different computer.

---

## 📦 Installation Methods

### Method 1: Portable Installation (Recommended - No Installer Needed)
**Best for:** Quick deployment, no admin rights needed  
**Time:** 5-10 minutes  
**Requirements:** Node.js 18+ only

### Method 2: Full Installer (Advanced)
**Best for:** Professional distribution, automatic setup  
**Time:** 15-20 minutes  
**Requirements:** Build tools, potentially admin rights

---

## Method 1: Portable Installation (Easy & Fast)

### Step 1: Prepare the Application Package

On **your current computer** (where the app is working):

#### Option A: Manual Package Creation

```powershell
# Navigate to the application folder
cd C:\Users\SOFTWARES\OneDrive\Desktop\Joseph

# Create a distribution folder
New-Item -ItemType Directory -Force -Path ".\WaterQualityMonitor-Portable"

# Copy necessary files
Copy-Item -Recurse -Path dist, electron, bridge-server, public, src -Destination ".\WaterQualityMonitor-Portable\"
Copy-Item package.json, package-lock.json, vite.config.js -Destination ".\WaterQualityMonitor-Portable\"
Copy-Item start-desktop.bat, launch-silent.vbs, create-desktop-shortcut.ps1 -Destination ".\WaterQualityMonitor-Portable\"
Copy-Item README.md, INSTALLATION.md, TROUBLESHOOTING.md -Destination ".\WaterQualityMonitor-Portable\"

# Copy TTN configuration template (NOT your actual .env with credentials!)
Copy-Item bridge-server\.env.example -Destination ".\WaterQualityMonitor-Portable\bridge-server\.env.example"

# Create ZIP for easy transfer
Compress-Archive -Path "WaterQualityMonitor-Portable\*" -DestinationPath "WaterQualityMonitor-Portable.zip" -Force

Write-Host "✅ Package created: WaterQualityMonitor-Portable.zip" -ForegroundColor Green
```

#### Option B: Quick Package Script

Create and run this script on your current computer:

**`create-portable-package.ps1`:**
```powershell
Write-Host "Creating portable package..." -ForegroundColor Cyan

# Build production version
npm run build

# Create package directory
$packageDir = "WaterQualityMonitor-Portable"
Remove-Item $packageDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $packageDir | Out-Null

# Copy application files
$filesToCopy = @(
    "dist",
    "electron", 
    "bridge-server",
    "public",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "start-desktop.bat",
    "launch-silent.vbs",
    "create-desktop-shortcut.ps1",
    "README.md",
    "INSTALLATION.md",
    "TROUBLESHOOTING.md"
)

foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        Copy-Item $item -Destination $packageDir -Recurse -Force
        Write-Host "✓ Copied: $item" -ForegroundColor Green
    }
}

# Copy .env.example (DO NOT copy actual .env!)
Copy-Item "bridge-server\.env.example" -Destination "$packageDir\bridge-server\.env.example" -Force

# Create .gitignore in package
@"
node_modules/
.env
*.db
*.db-journal
*.db-wal
release/
dist/
.vscode/
*.log
"@ | Out-File "$packageDir\.gitignore" -Encoding utf8

# Create setup instruction file
@"
# Quick Setup Instructions

## 1. Install Node.js
Download and install from: https://nodejs.org/ (Version 18 or higher)

## 2. Configure TTN Credentials
1. Navigate to bridge-server folder
2. Copy .env.example to .env
3. Edit .env with your TTN credentials:
   - TTN_MQTT_USERNAME=your-app-id@ttn
   - TTN_MQTT_PASSWORD=your-api-key
   - TTN_MQTT_TOPIC=v3/your-app-id@ttn/devices/+/up

## 3. Install Dependencies
Open PowerShell in this folder and run:
   npm install
   cd bridge-server
   npm install
   cd ..

## 4. Create Desktop Shortcut
   powershell -ExecutionPolicy Bypass -File create-desktop-shortcut.ps1

## 5. Launch Application
Double-click the "Water Quality Monitor" shortcut on your desktop!

For detailed instructions, see INSTALLATION.md
"@ | Out-File "$packageDir\SETUP_INSTRUCTIONS.txt" -Encoding utf8

# Create ZIP archive
$zipPath = "$packageDir.zip"
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Compress-Archive -Path "$packageDir\*" -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  PORTABLE PACKAGE CREATED!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Package location: $zipPath" -ForegroundColor Cyan
Write-Host "Package size: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Transfer $zipPath to the other computer" -ForegroundColor White
Write-Host "2. Extract the ZIP file" -ForegroundColor White
Write-Host "3. Follow SETUP_INSTRUCTIONS.txt on that computer" -ForegroundColor White
Write-Host ""
```

**Run it:**
```powershell
powershell -ExecutionPolicy Bypass -File create-portable-package.ps1
```

---

### Step 2: Transfer to the Other Computer

**Choose one method:**

#### Via USB Drive:
1. Copy `WaterQualityMonitor-Portable.zip` to USB drive
2. Plug into target computer
3. Copy ZIP file to desired location (e.g., Desktop or Documents)

#### Via Cloud Storage:
1. Upload `WaterQualityMonitor-Portable.zip` to Google Drive / OneDrive / Dropbox
2. Download on target computer

#### Via Network Share:
1. Share folder containing ZIP file
2. Access from target computer via network

#### Via Email:
- If file size < 25 MB, can email directly
- Otherwise use cloud storage link

---

### Step 3: Install on the Target Computer

On the **new computer**:

#### A. Install Prerequisites

**Install Node.js** (Required):
1. Go to https://nodejs.org/
2. Download LTS version (v18.x or higher recommended)
3. Run installer
4. Accept all defaults
5. Verify installation:
   ```powershell
   node --version
   # Should show: v18.x.x or higher
   ```

#### B. Extract the Application

```powershell
# Navigate to where you saved the ZIP
cd C:\Users\YourName\Downloads

# Extract ZIP
Expand-Archive -Path "WaterQualityMonitor-Portable.zip" -DestinationPath "C:\WaterQualityMonitor" -Force

# Navigate to extracted folder
cd C:\WaterQualityMonitor
```

#### C. Configure TTN Credentials

**IMPORTANT:** Each computer needs its own `.env` file with TTN credentials.

```powershell
# Navigate to bridge-server folder
cd bridge-server

# Copy template
Copy-Item .env.example -Destination .env

# Edit .env file
notepad .env
```

**In the .env file, enter your credentials:**
```env
TTN_MQTT_HOST=eu1.cloud.thethings.network
TTN_MQTT_PORT=8883
TTN_MQTT_USERNAME=your-application-id@ttn
TTN_MQTT_PASSWORD=NNSXS.YOUR.API.KEY.HERE
TTN_MQTT_TOPIC=v3/your-application-id@ttn/devices/+/up
TTN_DEVICE_ID=your-device-id

HTTP_PORT=3333
WS_PORT=3334
```

**Save and close notepad.**

#### D. Install Dependencies

```powershell
# Go back to main folder
cd C:\WaterQualityMonitor

# Install main application dependencies
npm install
# This takes 2-3 minutes

# Install bridge server dependencies
cd bridge-server
npm install
# This takes 1-2 minutes

# Return to main folder
cd ..
```

#### E. Create Desktop Shortcut

```powershell
# Run shortcut creation script
powershell -ExecutionPolicy Bypass -File create-desktop-shortcut.ps1
```

#### F. Launch the Application!

**Double-click** the "Water Quality Monitor" icon on your desktop!

---

## Method 2: Full Installer (Advanced)

This creates a standalone `.exe` installer that includes everything (Node.js not required on target computer).

### Prerequisites on Build Computer:

- Windows 10/11
- Node.js installed
- Administrator privileges (for code signing)

### Creating the Installer:

#### Option 1: Windows Installer (NSIS)

```powershell
# On your development computer
cd C:\Users\SOFTWARES\OneDrive\Desktop\Joseph

# Clean previous builds
Remove-Item release -Recurse -Force -ErrorAction SilentlyContinue

# Build the installer
npm run package:win
```

**If you encounter permission errors:**

```powershell
# Run PowerShell as Administrator
Start-Process powershell -Verb RunAs

# Then in the admin window:
cd C:\Users\SOFTWARES\OneDrive\Desktop\Joseph
npm run package:win
```

**Output:**
- `release\Water Quality Monitor Setup 1.0.0.exe` (~150-200 MB)

#### Option 2: Portable Executable (No Installation)

If the installer build fails, create a portable executable:

```powershell
# Build the application
npm run build

# Package as portable
npx electron-builder --win portable --config.win.sign=null
```

**Output:**
- `release\Water Quality Monitor 1.0.0.exe` (portable, ~150 MB)

---

### Distributing the Installer:

#### Share via Cloud:
```powershell
# Upload to Google Drive / OneDrive / Dropbox
# Share link with users
```

#### Share via USB:
```powershell
# Copy installer to USB drive
Copy-Item "release\Water Quality Monitor Setup 1.0.0.exe" -Destination "E:\"
```

#### Create Installation Package:
```powershell
# Create a complete package with installer + documentation
New-Item -ItemType Directory -Path "Installation-Package"
Copy-Item "release\Water Quality Monitor Setup 1.0.0.exe" -Destination "Installation-Package\"
Copy-Item README.md, INSTALLATION.md, "bridge-server\.env.example" -Destination "Installation-Package\"

# Create quick start guide
@"
Water Quality Monitor - Installation Guide

1. Run: Water Quality Monitor Setup 1.0.0.exe
2. Follow installation wizard
3. After installation:
   - Navigate to install folder (default: C:\Program Files\Water Quality Monitor)
   - Navigate to: resources\app\bridge-server
   - Copy .env.example to .env
   - Edit .env with your TTN credentials
4. Launch application from Start Menu or Desktop shortcut

For detailed setup, see INSTALLATION.md
"@ | Out-File "Installation-Package\QUICK_START.txt"

# Compress for distribution
Compress-Archive -Path "Installation-Package\*" -DestinationPath "WaterQualityMonitor-Installer.zip"
```

---

### Installing from Full Installer:

On the **target computer**:

1. **Extract ZIP** (if packaged)
2. **Run installer:** Double-click `Water Quality Monitor Setup 1.0.0.exe`
3. **Installation wizard:**
   - Choose installation location
   - Select "Create desktop shortcut" ✅
   - Select "Create Start Menu shortcut" ✅
   - Click Install
4. **Configure TTN credentials:**
   ```powershell
   # Navigate to installation folder
   cd "C:\Program Files\Water Quality Monitor\resources\app\bridge-server"
   
   # Copy and edit .env
   Copy-Item .env.example -Destination .env
   notepad .env
   ```
5. **Launch:** Double-click desktop shortcut or find in Start Menu

---

## Troubleshooting Installation on New Computer

### Issue: "node is not recognized"

**Solution:** Node.js not installed or not in PATH
```powershell
# Reinstall Node.js from https://nodejs.org/
# Make sure to check "Add to PATH" during installation
```

### Issue: "npm install fails"

**Solution:** Network or permissions issue
```powershell
# Run PowerShell as Administrator
Start-Process powershell -Verb RunAs

# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Issue: "Cannot find module 'better-sqlite3'"

**Solution:** Native module needs rebuilding
```powershell
# Rebuild native modules
npm rebuild better-sqlite3
```

### Issue: "Application won't connect to TTN"

**Solution:** Check .env configuration
```powershell
# Verify .env exists
Test-Path bridge-server\.env

# Check contents
Get-Content bridge-server\.env

# Make sure credentials are correct (no quotes around values)
```

### Issue: "Port already in use"

**Solution:** Another application using port 3333 or 3334
```powershell
# Find what's using the port
netstat -ano | findstr "3333"

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or change ports in bridge-server/.env
```

---

## Quick Comparison: Methods

| Feature | Portable | Full Installer |
|---------|----------|---------------|
| **File Size** | ~2-5 MB (without node_modules) | ~150-200 MB |
| **Requires Node.js** | ✅ Yes (on target PC) | ❌ No (bundled) |
| **Installation Time** | 5-10 min | 2-3 min |
| **Admin Rights** | ❌ Not needed | ✅ May be needed |
| **Update Process** | Replace files | Run new installer |
| **Best For** | Development/Testing | End users |

---

## Automation: Batch Installation Script

Create this on the **target computer** after extracting portable package:

**`auto-setup.bat`:**
```batch
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
    echo Please install Node.js first:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/4] Node.js found: 
node --version
echo.

echo [2/4] Installing dependencies...
call npm install --production
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/4] Installing bridge server dependencies...
cd bridge-server
call npm install --production
if %errorlevel% neq 0 (
    echo ERROR: Failed to install bridge server dependencies
    pause
    exit /b 1
)
cd ..
echo.

echo [4/4] Creating desktop shortcut...
powershell -ExecutionPolicy Bypass -File create-desktop-shortcut.ps1
echo.

echo ============================================
echo  SETUP COMPLETE!
echo ============================================
echo.
echo IMPORTANT: Before running the application:
echo 1. Edit bridge-server\.env with your TTN credentials
echo 2. Double-click "Water Quality Monitor" on your desktop
echo.
pause
```

**Usage:**
```batch
# On new computer, just run:
auto-setup.bat
```

---

## Network Installation (Multiple Computers)

For installing on multiple computers in an office:

### 1. Create Network Share

On a server or shared computer:
```powershell
# Create shared folder
New-Item -ItemType Directory -Path "C:\SharedApps\WaterQualityMonitor" -Force
New-SmbShare -Name "WaterQualityMonitor" -Path "C:\SharedApps\WaterQualityMonitor" -ReadAccess "Everyone"

# Copy portable package
Copy-Item WaterQualityMonitor-Portable.zip -Destination "C:\SharedApps\WaterQualityMonitor\"
```

### 2. Install from Network Share

On each client computer:
```powershell
# Map network drive (optional)
net use Z: \\ServerName\WaterQualityMonitor

# Copy and extract
Copy-Item Z:\WaterQualityMonitor-Portable.zip -Destination C:\WaterQualityMonitor.zip
Expand-Archive C:\WaterQualityMonitor.zip -DestinationPath C:\WaterQualityMonitor

# Run setup
cd C:\WaterQualityMonitor
.\auto-setup.bat
```

---

## Validation Checklist

After installation on new computer, verify:

```powershell
# ✅ Node.js installed
node --version

# ✅ Application files present
Test-Path "C:\WaterQualityMonitor\package.json"
Test-Path "C:\WaterQualityMonitor\electron\main.js"
Test-Path "C:\WaterQualityMonitor\bridge-server\server.js"

# ✅ Dependencies installed
Test-Path "C:\WaterQualityMonitor\node_modules"
Test-Path "C:\WaterQualityMonitor\bridge-server\node_modules"

# ✅ Configuration file exists
Test-Path "C:\WaterQualityMonitor\bridge-server\.env"

# ✅ Desktop shortcut created
Test-Path "$env:USERPROFILE\Desktop\Water Quality Monitor.lnk"

# ✅ Application runs
# Double-click desktop shortcut - application should open
```

---

## Summary

### Easiest Method:
1. Run `create-portable-package.ps1` on your computer
2. Transfer `WaterQualityMonitor-Portable.zip` to new computer
3. Install Node.js on new computer
4. Extract ZIP
5. Run `auto-setup.bat`
6. Configure `.env` file
7. Double-click desktop shortcut ✅

### Most Professional Method:
1. Run `npm run package:win` to create installer
2. Distribute `Water Quality Monitor Setup.exe`
3. Users run installer
4. Configure `.env` after installation
5. Launch from Start Menu ✅

**Both methods work perfectly!** Choose based on your needs and target audience.
