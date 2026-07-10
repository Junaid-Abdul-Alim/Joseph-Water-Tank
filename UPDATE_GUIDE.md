# Software Update Guide - Complete

## Quick Reference

**To create and distribute an update:**

1. **Update version** in `package.json`
2. **Build application:** `npm run build`
3. **Create update package:** Run `create-update-package.ps1`
4. **Distribute** the ZIP file to all installations
5. **Users apply update:** Extract and run `apply-update.bat`

---

## Detailed Update Process

### 1. Preparing the Update

#### A. Update Version Number

Edit `package.json`:
```json
{
  "version": "1.1.0"  // Changed from 1.0.0
}
```

#### B. Document Changes

Create `CHANGELOG.md` or update it:
```markdown
## Version 1.1.0 (2026-03-05)

### New Features
- Added export functionality for historical data
- Improved chart performance with data grouping

### Bug Fixes
- Fixed timezone display issue
- Corrected pH value precision

### Improvements
- Faster database queries with new indexes
- Updated minimal design with better contrast
```

#### C. Test Changes

```powershell
# Test locally first
npm run build
npm run electron:start

# Test on a separate computer if possible
```

### 2. Creating Update Package

#### Quick Update (Recommended)

```powershell
# Run the automated script
.\create-update-package.ps1 -Version "1.1.0"
```

This creates: `WaterQualityMonitor-Update-v1.1.0.zip`

#### Manual Update Package

If you prefer manual control:

```powershell
# Build latest
npm run build

# Create folder
New-Item -ItemType Directory -Path "Update-v1.1.0"

# Copy updated files
Copy-Item -Recurse dist, electron, src -Destination "Update-v1.1.0\"
Copy-Item package.json, vite.config.js -Destination "Update-v1.1.0\"

# If backend changed
Copy-Item bridge-server\*.js -Destination "Update-v1.1.0\bridge-server\"
Copy-Item bridge-server\package.json -Destination "Update-v1.1.0\bridge-server\"

# Create ZIP
Compress-Archive -Path "Update-v1.1.0\*" -DestinationPath "Update-v1.1.0.zip"
```

---

## 3. Distribution Methods

### Method A: Manual Distribution

**For Small Deployments (1-10 computers)**

1. **Email the update:**
   ```
   Subject: Water Quality Monitor - Update v1.1.0 Available
   
   Hi team,
   
   A new update (v1.1.0) is available with the following improvements:
   - [List key features]
   
   To update:
   1. Download attached ZIP file
   2. Close Water Quality Monitor application
   3. Extract ZIP
   4. Run apply-update.bat
   5. Restart application
   
   Backup reminder: Your data will be preserved, but it's good practice
   to backup bridge-server\sensor_data.db before updating.
   ```

2. **USB Drive distribution:**
   - Copy ZIP to USB
   - Visit each computer
   - Apply update manually

3. **Cloud storage:**
   - Upload to Google Drive / OneDrive / Dropbox
   - Share link with all users
   - Users download and apply

### Method B: Network Share

**For Medium Deployments (10-50 computers)**

**On a file server:**
```powershell
# Create shared updates folder
$sharePath = "C:\SharedApps\WaterQualityMonitor\Updates"
New-Item -ItemType Directory -Path $sharePath -Force
New-SmbShare -Name "WQM-Updates" -Path $sharePath -ReadAccess "Everyone"

# Copy update
Copy-Item "WaterQualityMonitor-Update-v1.1.0.zip" -Destination $sharePath
```

**Create update notification script for users:**

`check-for-updates.ps1`:
```powershell
$networkPath = "\\ServerName\WQM-Updates"
$currentVersion = "1.0.0"  # Read from local package.json

# Check network share for updates
$latestUpdate = Get-ChildItem "$networkPath\*.zip" | 
                Sort-Object LastWriteTime -Descending | 
                Select-Object -First 1

if ($latestUpdate) {
    $latestVersion = $latestUpdate.Name -replace '.*v(\d+\.\d+\.\d+).*', '$1'
    
    if ($latestVersion -gt $currentVersion) {
        Write-Host "New update available: v$latestVersion" -ForegroundColor Green
        Write-Host "Current version: v$currentVersion" -ForegroundColor Yellow
        
        $response = Read-Host "Download update now? (Y/N)"
        if ($response -eq 'Y') {
            Copy-Item $latestUpdate.FullName -Destination ".\update-temp.zip"
            Expand-Archive ".\update-temp.zip" -DestinationPath ".\update-temp" -Force
            
            Write-Host "Update downloaded. Run apply-update.bat to install." -ForegroundColor Green
        }
    } else {
        Write-Host "You have the latest version: v$currentVersion" -ForegroundColor Green
    }
}
```

### Method C: Automated Update System

**For Large Deployments (50+ computers)**

Create an auto-update service:

#### On Development Computer - Create Update Server

**`update-server.js`** (Simple HTTP server for updates):

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const UPDATES_DIR = path.join(__dirname, 'updates');

// Ensure updates directory exists
if (!fs.existsSync(UPDATES_DIR)) {
  fs.mkdirSync(UPDATES_DIR);
}

// Get latest version info
app.get('/api/version', (req, res) => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
  );
  
  res.json({
    version: packageJson.version,
    releaseDate: new Date().toISOString(),
    downloadUrl: `/updates/WaterQualityMonitor-Update-v${packageJson.version}.zip`,
    changelog: [
      'Feature 1: Description',
      'Bug fix 1: Description'
    ]
  });
});

// Serve update files
app.use('/updates', express.static(UPDATES_DIR));

app.listen(PORT, () => {
  console.log(`Update server running on http://localhost:${PORT}`);
  console.log(`Place update ZIP files in: ${UPDATES_DIR}`);
});
```

#### On Client Computers - Auto-Update Checker

**Add to `electron/main.js`:**

```javascript
const https = require('https');
const { app, dialog } = require('electron');

async function checkForUpdates() {
  const currentVersion = app.getVersion();
  const updateServer = 'http://your-update-server.com:3000';
  
  try {
    const response = await fetch(`${updateServer}/api/version`);
    const updateInfo = await response.json();
    
    if (updateInfo.version > currentVersion) {
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `Version ${updateInfo.version} is available!`,
        detail: `You are currently running version ${currentVersion}.\n\nChanges:\n${updateInfo.changelog.join('\n')}`,
        buttons: ['Download Update', 'Later'],
        defaultId: 0
      });
      
      if (result.response === 0) {
        // Open update URL in default browser
        shell.openExternal(updateInfo.downloadUrl);
      }
    }
  } catch (error) {
    console.log('Could not check for updates:', error.message);
  }
}

// Check for updates on startup
app.on('ready', () => {
  createWindow();
  
  // Check for updates after 5 seconds
  setTimeout(checkForUpdates, 5000);
  
  // Check every 24 hours
  setInterval(checkForUpdates, 24 * 60 * 60 * 1000);
});
```

---

## 4. Applying Updates on Target Computers

### Method A: Automated Update Script

Users extract the update ZIP and run `apply-update.bat`:

```batch
@echo off
echo ============================================
echo  Water Quality Monitor - Applying Update
echo ============================================
echo.

REM Stop running application
echo Stopping application...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

REM Backup current version
echo Creating backup...
xcopy /E /Y /I ..\dist ..\backup\dist
xcopy /E /Y /I ..\electron ..\backup\electron

REM Apply update
echo Applying update...
xcopy /E /Y /I dist ..\dist
xcopy /E /Y /I electron ..\electron
xcopy /E /Y /I src ..\src
copy /Y package.json ..\package.json

REM Update dependencies if needed
if exist package-lock.json (
    echo Updating dependencies...
    cd ..
    npm install --production
)

echo.
echo ============================================
echo  UPDATE COMPLETE!
echo ============================================
echo.
echo Please restart the application.
pause
```

### Method B: Manual Update Steps

**Instructions for users:**

1. **Stop the application**
   - Close Water Quality Monitor completely
   - Check Task Manager - ensure no `electron.exe` or `node.exe` processes

2. **Backup (Optional but recommended)**
   ```powershell
   # Backup database
   Copy-Item "bridge-server\sensor_data.db" -Destination "sensor_data.db.backup"
   
   # Backup configuration
   Copy-Item "bridge-server\.env" -Destination ".env.backup"
   ```

3. **Extract update**
   - Extract ZIP file
   - You'll see: `dist/`, `electron/`, `src/`, `package.json`, etc.

4. **Replace files**
   - Copy extracted files to installation folder
   - Overwrite when prompted
   - **DO NOT overwrite** `bridge-server\.env` or `*.db` files

5. **Update dependencies** (if needed)
   ```powershell
   npm install
   cd bridge-server
   npm install
   ```

6. **Restart application**
   - Double-click desktop shortcut
   - Or run `start-desktop.bat`

---

## 5. Database Migration

### When Database Schema Changes

If your update includes database changes:

#### A. Create Migration Script

**`bridge-server/migrate-v1.1.0.js`:**

```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sensor_data.db');
const db = new Database(dbPath);

console.log('Running database migration to v1.1.0...');

try {
  // Example: Adding a new column
  db.exec(`
    ALTER TABLE sensor_readings 
    ADD COLUMN temperature REAL DEFAULT 0;
  `);
  
  console.log('✓ Added temperature column');
  
  // Example: Creating a new table
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      alert_type TEXT,
      threshold_value REAL,
      actual_value REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('✓ Created alerts table');
  
  // Update version in metadata table
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    
    INSERT OR REPLACE INTO app_metadata (key, value)
    VALUES ('schema_version', '1.1.0');
  `);
  
  console.log('✓ Updated schema version');
  console.log('\n✅ Migration completed successfully!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
```

#### B. Include in Update Package

```powershell
# In create-update-package.ps1
if (Test-Path "bridge-server\migrate-v$Version.js") {
    Copy-Item "bridge-server\migrate-v$Version.js" -Destination "$updateDir\bridge-server\"
    
    # Update instructions to mention migration
    Add-Content "$updateDir\UPDATE_INSTRUCTIONS.txt" @"
    
IMPORTANT: This update requires database migration!

After copying files, run:
   cd bridge-server
   node migrate-v$Version.js

"@
}
```

#### C. User Runs Migration

```powershell
cd bridge-server
node migrate-v1.1.0.js
```

### Backward Compatibility

If possible, make database changes backward compatible:

```javascript
// Good: Adding optional columns
ALTER TABLE sensor_readings ADD COLUMN temperature REAL DEFAULT 0;

// Risky: Removing columns (avoid if possible)
// ALTER TABLE sensor_readings DROP COLUMN old_column;

// Better: Mark as deprecated, remove in next major version
// Add new column, migrate data, deprecate old column
```

---

## 6. Version Management Best Practices

### Semantic Versioning

Follow `MAJOR.MINOR.PATCH` format:

- **MAJOR (2.0.0)**: Breaking changes, database schema changes
- **MINOR (1.1.0)**: New features, backward compatible
- **PATCH (1.0.1)**: Bug fixes, no new features

### Version Tracking

**In `package.json`:**
```json
{
  "version": "1.1.0"
}
```

**Display version in UI:**

Add to `src/components/Dashboard.jsx`:
```jsx
import packageJson from '../../package.json';

// In component
<div className="version-info">
  v{packageJson.version}
</div>
```

**Check version programmatically:**

```javascript
// bridge-server/database.js
function getAppVersion() {
  const metadata = db.prepare('SELECT value FROM app_metadata WHERE key = ?').get('schema_version');
  return metadata ? metadata.value : '1.0.0';
}
```

---

## 7. Rollback Strategy

### If Update Fails

**Provide rollback instructions:**

```batch
REM rollback-update.bat
@echo off
echo ============================================
echo  Rolling Back Update
echo ============================================
echo.

echo Restoring previous version...

if exist backup\dist (
    xcopy /E /Y /I backup\dist dist
    xcopy /E /Y /I backup\electron electron
    echo Rollback complete!
) else (
    echo No backup found. Please reinstall from original package.
)

pause
```

### Backup Strategy

**Automatic backup before update:**

```batch
echo Creating automatic backup...
set BACKUP_DIR=backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%
mkdir "%BACKUP_DIR%"
xcopy /E /Y /I dist "%BACKUP_DIR%\dist"
xcopy /E /Y /I electron "%BACKUP_DIR%\electron"
xcopy /Y bridge-server\sensor_data.db "%BACKUP_DIR%\"
```

---

## 8. Update Notification System

### Email Notification Template

```
Subject: Water Quality Monitor - Update v1.1.0 Available

Dear Team,

A new version (v1.1.0) of the Water Quality Monitor is now available.

WHAT'S NEW:
- Improved chart performance
- New export feature for historical data
- Bug fixes and stability improvements

HOW TO UPDATE:
1. Download: [Link to update file]
2. Close the application
3. Extract and run apply-update.bat
4. Restart application

ESTIMATED TIME: 2-3 minutes
DATA SAFETY: Your historical data and settings will be preserved

For detailed instructions, see the included UPDATE_INSTRUCTIONS.txt

Questions? Contact: support@example.com

---
Water Quality Monitor Team
```

### In-App Notification

Add to Dashboard:

```jsx
function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    fetch('http://your-server.com/api/version')
      .then(res => res.json())
      .then(data => {
        if (data.version > packageJson.version) {
          setUpdateAvailable(true);
        }
      });
  }, []);
  
  if (!updateAvailable) return null;
  
  return (
    <div className="update-notification">
      🔔 New version available! 
      <button onClick={() => window.open('http://your-server.com/updates')}>
        Download Update
      </button>
    </div>
  );
}
```

---

## Summary: Complete Update Workflow

### Development Side

1. ✅ Make changes to code
2. ✅ Update version in `package.json`
3. ✅ Test thoroughly
4. ✅ Build application: `npm run build`
5. ✅ Create update package: `.\create-update-package.ps1 -Version "1.1.0"`
6. ✅ Distribute update file

### User Side

1. ✅ Receive update notification
2. ✅ Download update ZIP
3. ✅ Close application
4. ✅ Backup (optional)
5. ✅ Extract and run `apply-update.bat`
6. ✅ Restart application
7. ✅ Verify version updated

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| Create update | `.\create-update-package.ps1 -Version "1.1.0"` |
| Apply update | Run `apply-update.bat` |
| Rollback | Run `rollback-update.bat` |
| Backup database | `Copy-Item bridge-server\sensor_data.db backup\` |
| Check version | Check `package.json` or UI footer |

---

For questions or issues with updates, see TROUBLESHOOTING.md
