# Water Quality Monitor - Complete User Guide
## Developed by Fluid Fusion Team · Dr. Vinod Kumar

**Version:** 1.0.0  
**Last Updated:** March 2026

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Installation on Another Computer](#installation-on-another-computer)
3. [Configuration](#configuration)
4. [Using the Application](#using-the-application)
5. [Troubleshooting](#troubleshooting)
6. [Technical Details](#technical-details)

---

## Quick Start

### Prerequisites
- Windows 10/11
- Node.js v18+ (Download from: https://nodejs.org/)
- TTN (The Things Network) account with active device

### First-Time Setup (This Computer)
1. Install Node.js from https://nodejs.org/
2. Open PowerShell in the application folder
3. Run: `npm install`
4. Configure TTN credentials in `bridge-server\.env`
5. Run: `npm run build`
6. Double-click desktop shortcut or run `launch-silent.vbs`

---

## Installation on Another Computer

### Package Contents
Your deployment package **WaterQualityMonitor-Setup.zip (8.36 MB)** contains:
- Built React application
- Electron desktop wrapper
- MQTT-HTTP bridge server
- Custom application icon
- Auto-setup scripts
- Complete documentation

### Installation Steps

**Step 1: Transfer Package**
- Copy `WaterQualityMonitor-Setup.zip` to target computer via:
  - USB drive
  - Email
  - Network share
  - Cloud storage

**Step 2: Extract Files**
- Right-click ZIP → Extract All
- Choose location (e.g., `C:\Apps` or Desktop)

**Step 3: Install Node.js**
- Visit: https://nodejs.org/
- Download LTS version (v18+)
- Run installer (accept all defaults)
- Restart computer

**Step 4: Run Auto-Setup**
- Open extracted folder
- Double-click `auto-setup.bat`
- Wait 3-5 minutes for automatic installation
- Desktop shortcut will be created

**Step 5: Configure TTN**
- Edit `bridge-server\.env` file:
  ```
  TTN_MQTT_USERNAME=your-app@ttn
  TTN_MQTT_PASSWORD=your-api-key
  TTN_MQTT_TOPIC=v3/your-app@ttn/devices/+/up
  TTN_DEVICE_ID=your-device-id
  ```

**Step 6: Launch**
- Double-click desktop shortcut "Water Quality Monitor"
- Application runs silently (no terminal window)

---

## Configuration

### TTN Credentials Setup

1. **Locate Configuration File:**
   - Path: `bridge-server\.env`
   - If missing, copy from `.env.example`

2. **Required Settings:**
   ```env
   # TTN MQTT Connection
   TTN_MQTT_HOST=eu1.cloud.thethings.network
   TTN_MQTT_PORT=8883
   TTN_MQTT_USERNAME=your-application-id@ttn
   TTN_MQTT_PASSWORD=NNSXS.YOUR.API.KEY.HERE
   TTN_MQTT_TOPIC=v3/your-application-id@ttn/devices/+/up
   
   # Device Settings
   TTN_DEVICE_ID=your-device-id
   
   # Server Ports
   HTTP_PORT=3333
   WS_PORT=3334
   ```

3. **Get TTN Credentials:**
   - Login to https://console.cloud.thethings.network/
   - Navigate to your application
   - Go to "Integrations" → "MQTT"
   - Copy credentials

### Custom Icon Setup

Your custom icon is already included in the package:
- `public/icon.ico` - Desktop shortcut icon
- `public/icon.png` - Application window icon

To update icons:
1. Replace files in `public/` folder
2. Run `recreate-desktop-shortcut.ps1`
3. Press F5 to refresh desktop

---

## Using the Application

### Dashboard Overview

**Header Section:**
- **FLUID FUSION** - Team branding
- **Water Quality Monitor** - Application title
- **View History** button - Access historical data
- **Connection Status** - Bridge and Sensor connectivity
- **Last Update / Next Update** - Data refresh timing

**Metric Cards:**
- **Main Tank TDS** - Input water quality (Safe: < 500 ppm)
- **RO Water TDS** - Purified water quality (Safe: < 100 ppm)
- **Reject Water TDS** - Waste water measurement
- **pH Level** - Water acidity/alkalinity (Safe: 6.5-8.5)

**Real-Time Chart:**
- Last 20 data points displayed
- Auto-updates every 3 minutes
- Color-coded lines for each parameter

**Statistics Panel:**
- 24-hour averages
- Min/Max values
- Total readings count

### History View

- Access via "View History" button
- Shows last 7 days of data
- Sortable columns (click headers)
- Timestamps in 12-hour format

### Data Retention

- Automatic cleanup after 180 days
- Runs daily at 2:00 AM
- SQLite database: `bridge-server/database.db`

---

## Troubleshooting

### Common Issues

**Q: Desktop icon doesn't show?**
- Run `recreate-desktop-shortcut.ps1`
- Press F5 to refresh desktop
- Ensure icon.ico exists in `public/` folder

**Q: Bridge shows "Disconnected"?**
- Check TTN credentials in `.env`
- Verify internet connection
- Check TTN console for device activity

**Q: Sensor shows "Offline"?**
- Verify device is powered on
- Check TTN network coverage
- Confirm device is transmitting (check TTN console)

**Q: No data appearing?**
- Wait 3 minutes for first reading
- Check device ID matches `.env` configuration
- Verify MQTT topic format

**Q: Application won't start?**
- Check Node.js is installed: `node --version`
- Reinstall dependencies: `npm install`
- Check port 3333 and 3334 aren't in use

**Q: Terminal window appears?**
- Use desktop shortcut (not .bat file directly)
- Ensure `launch-silent.vbs` is being used

### Error Messages

**"Missing required environment variables"**
- Solution: Create/update `bridge-server\.env` file

**"EADDRINUSE: address already in use"**
- Solution: Close other instances of the application
- Or change ports in `.env` file

**"Failed to fetch initial data"**
- Solution: Ensure bridge server is running
- Check Windows Firewall isn't blocking ports

### Reset Application

If issues persist:
1. Close application
2. Delete `bridge-server/database.db`
3. Restart application
4. Database will be recreated automatically

---

## Technical Details

### Architecture

```
┌─────────────────────────────────────────┐
│         Desktop Application              │
│  ┌─────────────────────────────────┐    │
│  │   Electron (Window Manager)     │    │
│  │   ├── React Frontend (Vite)     │    │
│  │   └── Chart.js (Visualization)  │    │
│  └─────────────────────────────────┘    │
│              ↕ HTTP/WebSocket            │
│  ┌─────────────────────────────────┐    │
│  │   Bridge Server (Node.js)       │    │
│  │   ├── Express HTTP API          │    │
│  │   ├── WebSocket Server          │    │
│  │   ├── MQTT Client (TTN)         │    │
│  │   └── SQLite Database           │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                   ↕ MQTT/SSL
         ┌──────────────────────┐
         │  The Things Network  │
         │   (LoRaWAN Server)   │
         └──────────────────────┘
                   ↕ LoRaWAN
         ┌──────────────────────┐
         │   IoT Sensor Device  │
         │  (Water Quality)     │
         └──────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18.2.0
- Chart.js 4.5.1
- React Router DOM 7.13.1
- Vite 5.0.12 (Build tool)

**Desktop:**
- Electron 28.1.0

**Backend:**
- Node.js 18+
- Express.js (HTTP API)
- WebSocket (Real-time communication)
- MQTT.js 5.3.4 (TTN integration)
- better-sqlite3 (Database)

**Build Tools:**
- Electron Builder (Packaging)
- Vite (Frontend bundling)

### File Structure

```
WaterQualityMonitor/
├── electron/              # Desktop wrapper
│   └── main.js           # Electron main process
├── bridge-server/        # MQTT-HTTP bridge
│   ├── server.js        # Main server logic
│   ├── database.js      # SQLite operations
│   └── .env             # Configuration
├── src/                 # React application
│   ├── components/      # Dashboard & History
│   ├── App.jsx         # Main component
│   └── main.jsx        # Entry point
├── public/             # Static assets
│   ├── icon.ico       # Desktop icon
│   └── icon.png       # App window icon
├── dist/              # Built application
├── package.json       # Dependencies
└── vite.config.js     # Build configuration
```

### Database Schema

**Table: sensor_readings**
```sql
CREATE TABLE sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    main_tds REAL NOT NULL,
    ro_tds REAL NOT NULL,
    reject_tds REAL NOT NULL,
    ph REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### API Endpoints

```
GET  /api/data           - Latest sensor reading + device status
GET  /api/history        - Last 7 days of readings
GET  /api/statistics     - 24-hour statistics
GET  /api/count          - Total readings count
```

### WebSocket Events

```javascript
{
  "sensorData": {
    "main_tds": 450,
    "ro_tds": 50,
    "reject_tds": 800,
    "ph": 7.2,
    "timestamp": "2026-03-05T10:30:00.000Z"
  },
  "deviceStatus": {
    "isOnline": true,
    "lastSeen": "2026-03-05T10:30:00.000Z",
    "deviceId": "sensor-001",
    "signalQuality": "good"
  }
}
```

### System Requirements

**Minimum:**
- Windows 10 (64-bit)
- 2GB RAM
- 500MB disk space
- Node.js 18.0.0
- Internet connection

**Recommended:**
- Windows 11 (64-bit)
- 4GB RAM
- 1GB disk space
- Node.js 20.0.0+
- Stable internet (1 Mbps+)

### Performance

- **Startup Time:** < 5 seconds
- **Memory Usage:** ~150-200 MB
- **CPU Usage:** < 2% (idle), < 10% (active)
- **Data Update Interval:** 3 minutes
- **Database Size:** ~1MB per 10,000 readings

### Security Notes

- All MQTT connections use TLS/SSL encryption
- Credentials stored in local `.env` file (not in code)
- Database is local-only (no remote access)
- No external APIs except TTN
- Desktop application runs in isolated process

---

## Support

**Documentation:**
- README.md - Project overview
- INSTALLATION.md - Installation details
- DEPLOYMENT.md - Advanced deployment
- CHANGELOG.md - Version history

**Developed by:**
- **Team:** Fluid Fusion
- **Supervisor:** Dr. Vinod Kumar
- **Version:** 1.0.0
- **License:** MIT

**For Technical Support:**
- Check TROUBLESHOOTING.md
- Review this complete guide
- Verify TTN console for device activity
- Check Windows Event Viewer for system errors

---

*End of User Guide*
