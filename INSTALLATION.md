# Water Quality Monitor - Desktop Installation Guide

## Quick Start (No Installation Required)

### Option 1: Desktop Shortcut (Recommended)

**Already created!** ✅ You now have a shortcut on your desktop named **"Water Quality Monitor"**

#### How to Use:
1. **Double-click** the "Water Quality Monitor" icon on your desktop
2. Wait 5-10 seconds for the application to start
3. The dashboard will open automatically in a window
4. Start monitoring your water quality!

#### What Happens When You Click:
- Bridge server starts automatically in the background
- Connects to TTN LoRaWAN network for sensor data
- SQLite database initializes (stores 6 months of data)
- Desktop window opens with real-time dashboard

---

### Option 2: Manual Start

If the desktop shortcut doesn't work, you can start manually:

#### Windows:
```batch
# Navigate to the application folder
cd C:\Users\SOFTWARES\OneDrive\Desktop\Joseph

# Double-click:
start-desktop.bat
```

#### Alternative - From Command Line:
```powershell
cd C:\Users\SOFTWARES\OneDrive\Desktop\Joseph
npm run electron:start
```

---

## First-Time Setup

### Prerequisites Check:
Run this command to verify everything is installed:

```powershell
# Check Node.js
node --version  # Should show: v18.x.x or higher

# Check dependencies
npm list electron react react-router-dom chart.js better-sqlite3
```

### If Dependencies Missing:
```powershell
# Install all dependencies
npm install

# Install bridge server dependencies
cd bridge-server
npm install
cd ..
```

---

## Creating Additional Shortcuts

### Desktop Shortcut:
```powershell
# Run this script anytime to recreate the shortcut
powershell -ExecutionPolicy Bypass -File create-desktop-shortcut.ps1
```

### Start Menu Shortcut:
```powershell
# Copy to Start Menu folder
$StartPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
Copy-Item "Water Quality Monitor.lnk" -Destination $StartPath
```

### Taskbar Pin:
1. Right-click the desktop shortcut
2. Select "Pin to taskbar"
3. Done!

---

## Configuration

### TTN LoRaWAN Settings:

Edit the configuration file:
```
bridge-server\.env
```

Required settings:
```env
TTN_MQTT_BROKER=eu1.cloud.thethings.network
TTN_MQTT_PORT=8883
TTN_USERNAME=your-app-id@ttn
TTN_PASSWORD=your-app-api-key
TTN_DEVICE_ID=your-device-id
```

### Port Configuration:

Default ports (can be changed in `bridge-server/server.js`):
- HTTP API: `3333`
- WebSocket: `3334`
- Electron Window: Opens automatically

---

## Troubleshooting

### Shortcut Not Opening?

**Check 1: Verify Path**
```powershell
# Make sure the batch file exists
Test-Path "C:\Users\SOFTWARES\OneDrive\Desktop\Joseph\start-desktop.bat"
# Should return: True
```

**Check 2: Dependencies**
```powershell
cd C:\Users\SOFTWARES\OneDrive\Desktop\Joseph
npm install
```

**Check 3: Manual Start**
```batch
# Try running manually
start-desktop.bat
```

### Application Won't Connect to Sensor?

**Check TTN Configuration:**
```powershell
cd bridge-server
type .env
```

Verify your TTN credentials are correct.

**Test Bridge Server:**
```powershell
cd bridge-server
npm start
# Should show: "Connected to TTN MQTT broker"
```

### Database Issues?

**Reset Database:**
```powershell
# Delete old database
Remove-Item bridge-server\sensor_data.db -ErrorAction SilentlyContinue

# Restart application - database recreates automatically
```

---

## Creating a Full Installer (Advanced)

If you want to create a standalone `.exe` installer for distribution:

### Option 1: Portable Build (No Admin Required)

```powershell
# Build the application
npm run build

# Create portable folder
mkdir "Water Quality Monitor"
Copy-Item -Recurse dist, electron, bridge-server, public "Water Quality Monitor\"
Copy-Item package.json, start-desktop.bat "Water Quality Monitor\"

# Zip for distribution
Compress-Archive -Path "Water Quality Monitor" -DestinationPath "WaterQualityMonitor-Portable.zip"
```

**Distribution:**
1. Share `WaterQualityMonitor-Portable.zip`
2. Users extract anywhere
3. Run `start-desktop.bat`
4. No installation needed!

### Option 2: Full Installer (Requires Admin)

```powershell
# Run PowerShell as Administrator
Start-Process powershell -Verb RunAs

# Then build installer
npm run package:win
```

**Issues with permissions?**
- Code signing requires admin privileges
- Use portable build instead (Option 1)

---

## Auto-Start on Windows Boot (Optional)

To launch automatically when Windows starts:

```powershell
# Create startup shortcut
$StartupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$DesktopShortcut = "$env:USERPROFILE\Desktop\Water Quality Monitor.lnk"
Copy-Item $DesktopShortcut -Destination $StartupPath
```

**Disable auto-start:**
```powershell
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Water Quality Monitor.lnk"
```

---

## Uninstallation

### Simple Method:
1. Delete the desktop shortcut
2. Delete the application folder: `C:\Users\SOFTWARES\OneDrive\Desktop\Joseph`

### Complete Cleanup:
```powershell
# Remove application folder
Remove-Item -Recurse "C:\Users\SOFTWARES\OneDrive\Desktop\Joseph"

# Remove desktop shortcut
Remove-Item "$env:USERPROFILE\Desktop\Water Quality Monitor.lnk"

# Remove from Start Menu (if added)
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Water Quality Monitor.lnk" -ErrorAction SilentlyContinue

# Remove from Startup (if added)
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Water Quality Monitor.lnk" -ErrorAction SilentlyContinue
```

---

## Tips & Best Practices

### Performance:
- **Database Size**: Auto-cleans data older than 6 months
- **Memory Usage**: ~100-150 MB typical
- **Storage**: ~17.5 MB for 6 months of data

### Security:
- Never share your `.env` file (contains TTN credentials)
- Keep `bridge-server/.env` secure
- Credentials are stored locally only

### Backup:
```powershell
# Backup your data
Copy-Item bridge-server\sensor_data.db "backup-$(Get-Date -Format 'yyyy-MM-dd').db"
```

### Updates:
When you receive an update:
1. Download new version
2. Copy your `bridge-server\.env` file to the new folder
3. Your historical data is preserved in `.db` file
4. Recreate desktop shortcut

---

## Support

### Check Status:
- Bridge Server: http://localhost:3333/api/health
- WebSocket: ws://localhost:3334
- Database: `bridge-server/sensor_data.db`

### Logs:
Check terminal output when running for troubleshooting info.

### Common Issues:

**"Port already in use"**
```powershell
# Kill existing process
Get-Process node | Stop-Process -Force
```

**"Cannot find module"**
```powershell
# Reinstall dependencies
npm install
cd bridge-server; npm install
```

**"MQTT connection failed"**
- Verify TTN credentials in `bridge-server/.env`
- Check internet connection
- Verify TTN device is active

---

## Quick Reference

| Action | Command |
|--------|---------|
| **Start App** | Double-click desktop shortcut |
| **Manual Start** | `npm run electron:start` |
| **Build Frontend** | `npm run build` |
| **Bridge Server Only** | `cd bridge-server; npm start` |
| **Reset Database** | Delete `sensor_data.db` and restart |
| **Recreate Shortcut** | `powershell -File create-desktop-shortcut.ps1` |

---

**🎉 You're all set! Enjoy monitoring your water quality!**
