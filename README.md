# Water Quality Monitor Dashboard

Modern React.js dashboard for monitoring RO water quality data from The Things Network (TTN).

## Architecture

```
TTN MQTT Server → Node.js Bridge → React Dashboard
  (port 8883)     (native MQTT)    (WebSocket)
```

**Why Bridge Server?**
Browsers can't use native MQTT protocol. The Node.js bridge connects to TTN via MQTT and exposes data to React via WebSocket.

## Monitored Metrics

- **Main Tank TDS** (ppm) - Alert > 500
- **RO Tank TDS** (ppm) - Alert > 100  
- **Reject Tank TDS** (ppm)
- **pH Level** - Alert < 6.5 or > 8.5

## Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd react-ttn-dashboard
npm install
```

### 2. Configure TTN Credentials

Create `bridge-server/.env` from the example:

```bash
cd bridge-server
cp .env.example .env
```

Edit `bridge-server/.env` with your TTN credentials:

```env
TTN_MQTT_USERNAME=your_username@ttn
TTN_MQTT_PASSWORD=your_ttn_password
TTN_MQTT_TOPIC=v3/your_username@ttn/devices/+/up
```

### 3. Run

```bash
npm start
```

Or double-click: `start.bat` (Windows)

Open browser: http://localhost:3000

## Features

✅ Real-time data from TTN every 3 minutes
✅ Historical data chart (last 20 readings)
✅ iPhone-style iOS design
✅ Mobile-optimized 2x2 grid layout
✅ Threshold indicators on each metric
✅ Auto-reconnection on disconnect

## Ports

- Bridge HTTP: 3333
- Bridge WebSocket: 3334
- React Dev Server: 3000
- TTN MQTT: 8883

## Environment Variables

### Bridge Server (`bridge-server/.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TTN_MQTT_HOST` | TTN MQTT server | No | eu1.cloud.thethings.network |
| `TTN_MQTT_PORT` | MQTT port | No | 8883 |
| `TTN_MQTT_USERNAME` | Your TTN username | **Yes** | - |
| `TTN_MQTT_PASSWORD` | Your TTN password | **Yes** | - |
| `TTN_MQTT_TOPIC` | MQTT topic pattern | **Yes** | - |
| `HTTP_PORT` | Bridge HTTP port | No | 3333 |
| `WS_PORT` | Bridge WebSocket port | No | 3334 |

## Project Structure

```
react-ttn-dashboard/
├── bridge-server/          # Node.js MQTT bridge
│   ├── .env               # TTN credentials (NOT in git)
│   ├── .env.example       # Template for .env
│   ├── server.js          # Bridge server code
│   └── package.json       # Server dependencies
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx  # Main React component
│   │   └── Dashboard.css  # Styling
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json           # Frontend dependencies
├── start.bat              # Windows launcher
└── README.md
```

## Development

```bash
# Run frontend only
npm run dev

# Run bridge only
npm run bridge

# Run both (recommended)
npm start
```

## Build for Production

```bash
npm run build
```

Output in `dist/` folder.

---
Built with React + Vite + Chart.js + Node.js + MQTT.js

[BRIDGE] 🚀 Starting TTN MQTT Bridge Server...
[BRIDGE] ✅ Connected to TTN MQTT: 0
[BRIDGE] ✅ Subscribed to: v3/5000fusion@ttn/devices/+/up
[REACT]  VITE v5.0.12  ready in 523 ms
[REACT]  ➜ Local:   http://localhost:3000/
```

Press **Ctrl+C** to stop both servers.

## 🔧 Configuration

The TTN MQTT credentials are configured in [bridge-server/server.js](bridge-server/server.js):

```javascript
const TTN_MQTT_HOST = "eu1.cloud.thethings.network";
const TTN_MQTT_PORT = 8883;
const TTN_MQTT_USERNAME = "5000fusion@ttn";
const TTN_MQTT_PASSWORD = "NNSXS.E6H6ZZT74FMQGBQHRWY6ELTW6VJB5MQXKBGSN3Y...";
const TTN_MQTT_TOPIC = "v3/5000fusion@ttn/devices/+/up";
```

To use different credentials, update these values in the server configuration.

## 🛠️ Technology Stack

- **Bridge Server**: Node.js + mqtt (native MQTT client)
- **React Dashboard**: React 18 + Vite
- **Real-time Communication**: WebSocket
- **Styling**: CSS3 with modern animations

## 🔍 How It Works

1. **Bridge Server** connects to TTN using native MQTT (port 8883) - same as Python
2. When TTN sends data, server receives it via MQTT
3. Server broadcasts data to React app via WebSocket (port 3002)
4. React dashboard updates in real-time with smooth animations

## 📱 Responsive Breakpoints

- Desktop: > 768px
- Tablet: 481px - 768px
- Mobile: ≤ 480px

## 🎨 Design Features

- **Gradient Backgrounds**: Each metric card has a unique gradient
- **Hover Effects**: Cards lift on hover for better interactivity
- **Alert Animations**: Pulsing effects for values exceeding thresholds
- **Status Indicators**: Real-time connection status with animated dot
- **Custom Fonts**: Inter font family for modern typography

## 📝 Project Structure

```
react-ttn-dashboard/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   └── components/
│       ├── Dashboard.jsx
│       └── Dashboard.css
```

## 🔍 Troubleshooting

### Bridge Server Won't Connect to TTN

- Ensure your firewall allows outbound connections on port 8883
- Verify TTN credentials are correct in `bridge-server/server.js`
- Check if your Python script (halo.py) works - this proves TTN is accessible
- Check the server console for error messages

### React Dashboard Shows "Disconnected"

- Make sure the bridge server is running FIRST before starting React app
- Check if ports 3001 and 3002 are not already in use
- Open browser console (F12) and look for WebSocket connection errors
- Verify the bridge server console shows "WebSocket server running"

### No Data Appearing

- Check if your TTN device is actually sending data (test with Python script)
- Look at the bridge server console - you should see "Message received from TTN!"
- Check browser console (F12) for incoming WebSocket messages
- Verify the decoded_payload structure matches what the code expects

## 💡 Why Can't Browsers Connect Directly to TTN MQTT?

**Browsers have built-in security restrictions:**
- Cannot open raw TCP/IP sockets
- Cannot use arbitrary network protocols  
- Limited to HTTP, WebSocket, WebRTC, etc.
- Same-Origin Policy prevents direct access to external MQTT brokers

**This is why we need the bridge server** - it acts as a translator:
- Bridge uses native MQTT (like Python does) ✅
- Bridge exposes data via WebSocket (which browsers CAN use) ✅

## 📊 Comparison: Python vs React Dashboard

| Feature | Python (halo.py) | React Dashboard |
|---------|------------------|-----------------|
| MQTT Connection | Direct (native MQTT) | Via Bridge Server |
| Port | 8883 | Bridge: 8883 → React: 3002/WS |
| Protocol | MQTT over TLS | WebSocket |
| Data Flow | TTN → Python | TTN → Bridge → React |
| Credentials | Same | Same (stored in bridge) |
| Can Run Without Internet | No | No (both need TTN) |

## 📄 License

This project is created for Fluid Fusion RO monitoring system.

## 🤝 Support

For issues or questions, please contact the development team.

---

**Made with ❤️ for Fluid Fusion**
