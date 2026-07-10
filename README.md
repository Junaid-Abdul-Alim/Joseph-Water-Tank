# Water Quality Monitor Dashboard

Modern desktop application for monitoring RO water quality data from The Things Network (TTN) with real-time visualization and historical data storage.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📊 Features

✅ **Desktop Application** - Electron-based standalone app for Windows/Mac/Linux  
✅ **Real-time Monitoring** - Live sensor data every 3 minutes via TTN LoRaWAN  
✅ **SQLite Database** - Automatic local data storage with unlimited history  
✅ **Historical Analysis** - Dedicated History page with powerful search & filtering  
✅ **iOS-style Design** - Clean, modern interface with smooth animations  
✅ **Device Status Tracking** - Real-time online/offline sensor status  
✅ **Statistics Dashboard** - Quick overview of averages, min/max values  
✅ **Responsive Charts** - Interactive trend visualization using Chart.js  

## 🏗️ Architecture

```
TTN LoRaWAN Sensor ──MQTT──> Bridge Server ──WebSocket──> React App
   (3-min interval)        (Node.js + SQLite)         (Electron Desktop)
                                  │
                           SQLite Database
                        (sensor_data.db)
```

## 📈 Monitored Metrics

| Metric | Safe Range | Alert Trigger |
|--------|------------|---------------|
| **Main Tank TDS** | < 500 ppm | > 500 ppm |
| **RO Tank TDS** | < 100 ppm | > 100 ppm |
| **Reject Tank TDS** | Varies | N/A |
| **pH Level** | 6.5 - 8.5 | < 6.5 or > 8.5 |

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** (optional) - For cloning repository

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd water-quality-monitor

# Install dependencies (auto-installs bridge-server too)
npm install
```

### 3. Configure TTN Credentials

Create `bridge-server/.env`:

```bash
cd bridge-server
cp .env.example .env
```

Edit `.env` with your TTN credentials:

```env
TTN_MQTT_HOST=eu1.cloud.thethings.network
TTN_MQTT_PORT=8883
TTN_MQTT_USERNAME=your_username@ttn
TTN_MQTT_PASSWORD=your_ttn_password_here
TTN_MQTT_TOPIC=v3/your_username@ttn/devices/+/up
HTTP_PORT=3333
WS_PORT=3334
```

### 4. Run Desktop App

**Option A: Double-click launcher**  
Run `start-desktop.bat` (Windows)

**Option B: Command line**
```bash
npm run build          # Build React app
npm run electron:start # Launch desktop app
```

Desktop app automatically starts bridge server on launch!

## 💾 Database Features

### Storage Capacity

- **Location**: `bridge-server/sensor_data.db`
- **Size**: ~200 bytes per reading
- **Retention**: **Automatic 6-month cleanup** - Data older than 6 months is automatically deleted
- **Cleanup Schedule**: Daily at midnight + on server startup
- **Storage Required**: 
  - 6 Months: ~87,600 readings = ~17.5 MB
  - Grows until 6-month limit, then stays constant

### Database Schema

```sql
CREATE TABLE sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  main_tds REAL NOT NULL,
  ro_tds REAL NOT NULL,
  reject_tds REAL NOT NULL,
  ph REAL NOT NULL,
  signal_quality INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Indexes** for performance:
- `idx_timestamp` on timestamp DESC
- `idx_device_id` on device_id

### Available API Endpoints

- `GET /api/data` - Latest sensor reading
- `GET /api/health` - Server health check
- `GET /api/history/latest` - Recent readings
- `GET /api/history/hours/:hours` - Readings from last N hours
- `GET /api/statistics` - Database statistics (avg, min, max)

## 📱 Application Pages

### Dashboard (Home)
- **Live Metrics**: Real-time TDS and pH readings
- **Status Indicators**: Bridge and sensor connection status
- **Trend Charts**: Visual representation of last 20 readings
- **Statistics Cards**: Quick overview (total readings, averages)
- **Next Update Timer**: Countdown to next sensor transmission

### History Page
- **Advanced Search**: Filter by device ID or date
- **Sortable Columns**: Click headers to sort by any metric
- **Time Range Filters**: View data for 24h, 7d, or 30d
- **Full Details**: Complete reading list with timestamps
- **Statistics Overview**: Aggregated metrics at a glance

## 🎮 Usage & Navigation

### Starting the Application

1. **Double-click** `start-desktop.bat`
2. Wait for automatic setup (dependencies + build)
3. Desktop window opens automatically
4. Bridge server starts in background

### Navigation

- **Dashboard**: Main monitoring view (home)
- **View History** button → Navigate to History page
- **← Dashboard** button → Return from History

### Sensor Status Indicators

| Status | Meaning |
|--------|---------|
| 🟢 **Online** | Data received within last 5 minutes |
| 🔴 **Offline** | No data for >5 minutes |
| ⏳ **Waiting** | Bridge connected, awaiting first transmission |

## 🛠️ Development

### Run in Development Mode

```bash
# Terminal 1: Bridge server
npm run bridge

# Terminal 2: React dev server
npm run dev

# Or run both together:
npm start
```

Open browser: http://localhost:3000

### Build for Production

```bash
# Build React app only
npm run build

# Package desktop app for Windows
npm run package:win

# Package for macOS
npm run package:mac

# Package for Linux
npm run package:linux
```

Installers output to `release/` folder.

## 🏗️ Project Structure

```
water-quality-monitor/
├── bridge-server/              # Node.js MQTT bridge & database
│   ├── server.js              # Express + MQTT + WebSocket server
│   ├── database.js            # SQLite operations
│   ├── sensor_data.db         # SQLite database file
│   ├── .env                   # TTN credentials (gitignored)
│   └── package.json           # Server dependencies
├── electron/                   # Electron desktop wrapper
│   ├── main.js                # Main process (window management)
│   └── preload.js             # Security context bridge
├── src/                        # React application
│   ├── App.jsx                # Router configuration
│   ├── main.jsx               # React entry point
│   ├── index.css              # Global styles
│   └── components/
│       ├── Dashboard.jsx      # Main monitoring page
│       ├── Dashboard.css      # Dashboard styles
│       ├── History.jsx        # Historical data viewer
│       └── History.css        # History page styles
├── public/                     # Static assets
│   ├── manifest.json          # PWA manifest
│   └── icon.ico/icns/png      # Application icons
├── package.json                # Main dependencies & scripts
├── vite.config.js             # Vite bundler config
└── start-desktop.bat          # Windows launcher
```

## 🧰 Technology Stack

- **Frontend**: React 18 + React Router DOM 7
- **Desktop**: Electron 28 + Electron Builder
- **Bundler**: Vite 5
- **Database**: better-sqlite3
- **Charts**: Chart.js + react-chartjs-2
- **Server**: Express.js 4
- **MQTT**: mqtt.js 5
- **WebSocket**: ws 8

## 🌐 Network Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| TTN MQTT | 8883 | MQTTS | LoRaWAN data ingestion |
| Bridge HTTP | 3333 | HTTP | REST API endpoints |
| Bridge WebSocket | 3334 | WS | Real-time data streaming |
| React Dev Server | 3000 | HTTP | Development only |

## 🔧 Troubleshooting

### Bridge Server Won't Connect to TTN

- Verify `.env` credentials are correct
- Check firewall allows outbound port 8883
- Ensure TTN application has valid API keys
- Check bridge server console for error messages

### Desktop App Won't Start

- Ensure `npm install` completed successfully
- Check if `dist/` folder exists (run `npm run build`)
- Verify `bridge-server/node_modules` installed
- Check for port conflicts (3333, 3334)

### Sensor Shows Offline

- Verify sensor is transmitting to TTN (check TTN console)
- Ensure MQTT topic matches your device pattern
- Wait 5 minutes after last transmission to update status
- Check bridge server console for incoming messages

### Database Issues

- Database file auto-creates on first run
- Check write permissions in `bridge-server/` folder
- View database: Use [DB Browser for SQLite](https://sqlitebrowser.org/)
- Backup: Copy `sensor_data.db` file manually

## 📦 Deployment

### Building Desktop Installers

```bash
# Windows (creates .exe installer)
npm run package:win

# macOS (creates .dmg)
npm run package:mac

# Linux (creates .AppImage and .deb)
npm run package:linux
```

**Output**: `release/` folder
- Windows: `Water Quality Monitor Setup X.X.X.exe`
- macOS: `Water Quality Monitor-X.X.X.dmg`
- Linux: `Water Quality Monitor-X.X.X.AppImage`

### Distribution

1. Copy installer to target machine
2. Run installer (admin/sudo may be required)
3. Launch from Start Menu / Applications
4. Configure `.env` on first run

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

Built for RO water quality monitoring with ❤️

- **TTN Community** - LoRaWAN infrastructure
- **React Team** - UI framework
- **Electron** - Desktop application platform
- **SQLite** - Embedded database

---

**Made with ❤️ for professional water quality monitoring**
