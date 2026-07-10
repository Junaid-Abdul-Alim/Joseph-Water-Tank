# Software Update & Distribution Guide

This guide explains how to update your Water Quality Monitor application across all installed computers.

---

## 📋 Table of Contents

1. [Update Types](#update-types)
2. [Preparing an Update](#preparing-an-update)
3. [Distribution Methods](#distribution-methods)
4. [Installation on Target Computers](#installation-on-target-computers)
5. [Database Migration](#database-migration)
6. [Automated Update System](#automated-update-system)
7. [Version Management](#version-management)

---

## Update Types

### Minor Updates (Bug Fixes, UI Changes)
- Changes to frontend code (React components, CSS)
- Small bug fixes in backend logic
- Configuration changes
- **No database schema changes**

### Major Updates (New Features)
- New pages or components
- New API endpoints
- Database schema changes
- Dependency updates

### Critical Updates (Security/Hotfixes)
- Security patches
- Critical bug fixes
- Emergency updates

---

## Preparing an Update

### Step 1: Version Management

**Update version in `package.json`:**

```json
{
  "name": "water-quality-monitor",
  "version": "1.1.0",  // Change from 1.0.0
  "description": "Real-time water quality monitoring dashboard"
}
```

**Version numbering:**
- `1.0.0` → `1.0.1` - Minor bug fix
- `1.0.0` → `1.1.0` - New features
- `1.0.0` → `2.0.0` - Major changes/breaking changes

### Step 2: Create Update Package

#### Method A: Full Update Package (Easiest)

```powershell
# On your development computer
cd C:\Users\SOFTWARES\OneDrive\Desktop\Joseph

# Update version in package.json first!

# Build the latest version
npm run build

# Create update package
powershell -ExecutionPolicy Bypass -File create-portable-package.ps1
# This creates WaterQualityMonitor-Portable.zip with new version
```

**Rename for clarity:**
```powershell
# Rename to include version number
Rename-Item "WaterQualityMonitor-Portable.zip" "WaterQualityMonitor-v1.1.0-Update.zip"
```

#### Method B: Delta Update (Only Changed Files)

**Create a PowerShell script: `create-update-package.ps1`**

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "Creating update package for version $Version" -ForegroundColor Cyan

# Create update directory
$updateDir = "Update-$Version"
Remove-Item $updateDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $updateDir | Out-Null

# Build latest version
Write-Host "Building application..." -ForegroundColor Yellow
npm run build

# Copy only essential files
Write-Host "Copying updated files..." -ForegroundColor Yellow

# Always include
Copy-Item -Recurse -Force "dist" -Destination "$updateDir\dist"
Copy-Item -Recurse -Force "electron" -Destination "$updateDir\electron"
Copy-Item -Recurse -Force "src" -Destination "$updateDir\src"
Copy-Item "package.json" -Destination "$updateDir\"
Copy-Item "vite.config.js" -Destination "$updateDir\"

# Include bridge-server only if changed
# Users can skip this if no backend changes
New-Item -ItemType Directory -Path "$updateDir\bridge-server" -Force | Out-Null
Copy-Item "bridge-server\*.js" -Destination "$updateDir\bridge-server\"
Copy-Item "bridge-server\package.json" -Destination "$updateDir\bridge-server\"

# Create update instructions
@"
==============================================
  WATER QUALITY MONITOR - UPDATE v$Version
==============================================

WHAT'S NEW:
-----------
(Add your changelog here)
- Feature 1: Description
- Bug fix 1: Description
- Improvement 1: Description

INSTALLATION INSTRUCTIONS:
--------------------------

IMPORTANT: Backup your data first!
   Copy bridge-server\sensor_data.db to a safe location

METHOD 1: Quick Update (Recommended)
   1. Stop the application if running
   2. Extract this update package
   3. Copy files to your installation folder
      (Overwrite existing files when prompted)
   4. Restart the application

METHOD 2: Manual Update
   1. Stop the application
   2. Backup your .env file: bridge-server\.env
   3. Backup your database: bridge-server\sensor_data.db
   4. Replace these folders:
      - dist\
      - electron\
      - src\
   5. Replace these files:
      - package.json
      - vite.config.js
   6. If bridge-server changed, replace:
      - bridge-server\*.js files
   7. Restore your .env file
   8. Restart application

DATABASE CHANGES:
-----------------
This update $(if (Test-Path "migration-$Version.sql") { "REQUIRES" } else { "does NOT require" }) database migration.
$(if (Test-Path "migration-$Version.sql") { "Run: node bridge-server/migrate.js" })

DEPENDENCY CHANGES:
-------------------
This update $(if ((Get-Content package.json) -match '"version": "$Version"') { "MAY require" } else { "does NOT require" }) dependency updates.
If needed, run:
   npm install
   cd bridge-server
   npm install

==============================================
"@ | Out-File "$updateDir\UPDATE_INSTRUCTIONS_v$Version.txt" -Encoding utf8

# Create update script
@"
@echo off
echo ============================================
echo  Water Quality Monitor - Update v$Version
echo ============================================
echo.

echo WARNING: This will update your installation.
echo Make sure you have backed up your database!
echo.
pause

echo.
echo [1/3] Checking for running processes...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/3] Copying updated files...
xcopy /E /Y /I dist ..\dist
xcopy /E /Y /I electron ..\electron
xcopy /E /Y /I src ..\src
copy /Y package.json ..
copy /Y vite.config.js ..

if exist bridge-server\*.js (
    echo [3/3] Updating bridge server...
    xcopy /Y bridge-server\*.js ..\bridge-server\
    xcopy /Y bridge-server\package.json ..\bridge-server\
)

echo.
echo ============================================
echo  UPDATE COMPLETE!
echo ============================================
echo.
echo Application updated to version $Version
echo.
echo IMPORTANT: Restart the application now
echo.
pause
"@ | Out-File "$updateDir\apply-update.bat" -Encoding ascii

# Create rollback script
@"
@echo off
echo ============================================
echo  Rollback Update
echo ============================================
echo.
echo This will restore your previous version.
echo Make sure you have a backup!
echo.
pause

REM User needs to manually restore from backup
echo Please restore files from your backup manually.
pause
"@ | Out-File "$updateDir\rollback-update.bat" -Encoding ascii

# Include migration if database schema changed
# (You would create this manually)
if (Test-Path "database-migration-$Version.sql") {
    Copy-Item "database-migration-$Version.sql" -Destination "$updateDir\"
}

# Create ZIP
$zipPath = "WaterQualityMonitor-Update-v$Version.zip"
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Compress-Archive -Path "$updateDir\*" -DestinationPath $zipPath -Force

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  UPDATE PACKAGE CREATED!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "File: $zipPath" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test this update on a test machine first" -ForegroundColor White
Write-Host "2. Distribute $zipPath to all installations" -ForegroundColor White
Write-Host "3. Users run: apply-update.bat" -ForegroundColor White
Write-Host ""
