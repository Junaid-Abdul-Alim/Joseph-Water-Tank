# Setup Guide

Complete guide to set up the Water Quality Monitor Dashboard.

## Prerequisites

- Node.js 16+ installed
- TTN account with active device
- Git installed (for cloning)

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/water-quality-monitor.git
cd water-quality-monitor
```

### 2. Install Dependencies

```bash
npm install
```

This will automatically:
- Install frontend dependencies (React, Vite, Chart.js)
- Install bridge-server dependencies (MQTT, WebSocket, Express)

### 3. Configure TTN Credentials

**Important:** Never commit your TTN credentials to Git!

1. Navigate to bridge server folder:
   ```bash
   cd bridge-server
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` file with your TTN credentials:
   ```env
   TTN_MQTT_USERNAME=your_username@ttn
   TTN_MQTT_PASSWORD=NNSXS.YOUR_PASSWORD_HERE
   TTN_MQTT_TOPIC=v3/your_username@ttn/devices/+/up
   ```

**Where to find your TTN credentials:**
- Login to [The Things Network Console](https://console.cloud.thethings.network/)
- Go to your application
- Navigate to "Integrations" → "MQTT"
- Use the username and password shown there

### 4. Run the Application

From the root directory:

```bash
npm start
```

This starts both:
- Bridge server (connects to TTN)
- React dashboard (frontend)

### 5. Open Browser

Navigate to: http://localhost:3000

You should see:
- Connection status: "Connected"
- Metric cards showing current values
- Historical data chart (fills as data comes in)

## Troubleshooting

### "Missing required environment variables"

**Solution:** Check that `bridge-server/.env` exists and has all required variables:
- `TTN_MQTT_USERNAME`
- `TTN_MQTT_PASSWORD`
- `TTN_MQTT_TOPIC`

### "ECONNREFUSED localhost:3334"

**Solution:** Bridge server isn't running. Make sure you run `npm start` from the root directory, not `npm run dev`.

### "Disconnected" status in dashboard

**Possible causes:**
1. Wrong TTN credentials in `.env`
2. TTN server is down
3. Network/firewall blocking port 8883
4. Device not sending data

**Check bridge server logs** for specific error messages.

### No data appearing

**Verify:**
1. Your TTN device is online and transmitting
2. Device payload format in TTN matches expected structure:
   ```json
   {
     "uplink_message": {
       "decoded_payload": {
         "main_tds": 450,
         "ro_tds": 85,
         "reject_tds": 800,
         "ph": 7.2
       }
     }
   }
   ```

## Port Configuration

Default ports can be changed in `bridge-server/.env`:

```env
HTTP_PORT=3333      # Bridge HTTP API
WS_PORT=3334        # Bridge WebSocket
```

React dev server port can be changed in `vite.config.js`:

```javascript
server: {
  port: 3000
}
```

## Security Notes

✅ **DO:**
- Keep `.env` files in `.gitignore`
- Use `.env.example` as template (no real credentials)
- Rotate TTN passwords periodically
- Use environment variables for all secrets

❌ **DON'T:**
- Commit `.env` files to Git
- Share your TTN credentials publicly
- Hardcode credentials in source files

## Next Steps

- Customize thresholds in `src/components/Dashboard.jsx`
- Adjust chart settings for your needs
- Deploy to production (see deployment guide)
- Set up alerts/notifications

## Support

For issues, check:
1. Bridge server console output
2. Browser console (F12)
3. TTN console for device activity
4. GitHub issues for similar problems
