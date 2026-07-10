import mqtt from 'mqtt';
import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  insertReading, 
  getLatestReading,
  getLatestReadings, 
  getReadingsLastHours,
  getStatistics,
  getTotalCount,
  cleanOldData
} from './database.js';
import { extractSensorData } from './payloadDecoder.js';

dotenv.config({
  path: process.env.BRIDGE_ENV_PATH,
  quiet: true
});

const TTN_MQTT_HOST = process.env.TTN_MQTT_HOST || "eu1.cloud.thethings.network";
const TTN_MQTT_PORT = parseInt(process.env.TTN_MQTT_PORT) || 8883;
const TTN_MQTT_USERNAME = process.env.TTN_MQTT_USERNAME;
const TTN_MQTT_PASSWORD = process.env.TTN_MQTT_PASSWORD;
const TTN_MQTT_TOPIC = process.env.TTN_MQTT_TOPIC;

const HTTP_PORT = parseInt(process.env.HTTP_PORT) || 3333;
const WS_PORT = parseInt(process.env.WS_PORT) || 3334;

function hasRealValue(value) {
  return Boolean(value) && !String(value).toLowerCase().includes('your_');
}

const hasMqttConfig = [TTN_MQTT_USERNAME, TTN_MQTT_PASSWORD, TTN_MQTT_TOPIC].every(hasRealValue);

if (!hasMqttConfig) {
  console.error('[CONFIG] Missing TTN MQTT environment variables.');
  console.error('[CONFIG] Dashboard will open, but live TTN data will not connect until .env is configured.');
}

let latestData = {
  node_id: null,
  main_tds: 0,
  main_ec: 0,
  ro_tds: 0,
  ro_ec: 0,
  reject_tds: null,
  reject_ec: null,
  ph: 0,
  turbidity: null,
  temperature: null,
  water_level_cm: null,
  flow_rate: null,
  timestamp: null
};

let deviceStatus = {
  lastSeen: null,
  isOnline: false,
  deviceId: null,
  signalQuality: null
};

const DEVICE_TIMEOUT = 5 * 60 * 1000; // 5 minutes - consider device offline if no data
const DATA_RETENTION_DAYS = 180; // Keep only last 6 months of data

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function numberOrDefault(value, fallback = 0) {
  const number = numberOrNull(value);
  return number == null ? fallback : number;
}

function buildSensorData(data, timestamp = data.timestamp) {
  const mainTds = numberOrDefault(data.main_tds);
  const roTds = numberOrDefault(data.ro_tds);
  const rejectTds = numberOrNull(data.reject_tds);
  const ph = numberOrDefault(data.ph);

  return {
    node_id: numberOrNull(data.node_id),
    main_tds: mainTds,
    main_ec: data.main_ec == null ? mainTds * 2 : numberOrDefault(data.main_ec),
    ro_tds: roTds,
    ro_ec: data.ro_ec == null ? roTds * 2 : numberOrDefault(data.ro_ec),
    reject_tds: rejectTds,
    reject_ec: data.reject_ec == null ? (rejectTds == null ? null : rejectTds * 2) : numberOrNull(data.reject_ec),
    ph,
    turbidity: numberOrNull(data.turbidity),
    temperature: numberOrNull(data.temperature),
    water_level_cm: numberOrNull(data.water_level_cm),
    flow_rate: numberOrNull(data.flow_rate),
    timestamp: timestamp || new Date().toISOString()
  };
}

function readingToSensorData(reading) {
  return buildSensorData(reading, reading.timestamp);
}

function loadLatestReadingFromDatabase() {
  const reading = getLatestReading();
  if (!reading) {
    return;
  }

  latestData = readingToSensorData(reading);
  deviceStatus = {
    lastSeen: reading.timestamp,
    isOnline: false,
    deviceId: reading.device_id || null,
    signalQuality: reading.signal_quality ?? null,
    receivedAt: reading.timestamp
  };
  checkDeviceOnlineStatus();

  console.log(`[START] Loaded latest database reading #${reading.id} from ${reading.timestamp}`);
}

// Clean old data on startup
const deletedCount = cleanOldData(DATA_RETENTION_DAYS);
if (deletedCount > 0) {
  console.log(`[CLEANUP] Cleaned up ${deletedCount} old readings (keeping last ${DATA_RETENTION_DAYS} days)`);
}

loadLatestReadingFromDatabase();

// Schedule daily cleanup at midnight
const scheduleCleanup = () => {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // Next day
    0, 0, 0 // Midnight
  );
  const msToMidnight = night.getTime() - now.getTime();
  
  setTimeout(() => {
    const deleted = cleanOldData(DATA_RETENTION_DAYS);
    console.log(`[CLEANUP] Daily cleanup: Removed ${deleted} old readings`);
    scheduleCleanup(); // Schedule next cleanup
  }, msToMidnight);
};

scheduleCleanup();
console.log('[SCHEDULE] Scheduled daily cleanup (keeps last 6 months)');

console.log('[START] Starting TTN MQTT Bridge Server...');
let mqttClient = null;

function handleMqttMessage(topic, message) {
  try {
    console.log('\n[TTN DATA] Received from device');

    const payload = JSON.parse(message.toString());
    const metadata = payload["uplink_message"];
    const sensorPayload = extractSensorData(payload);

    // Update device status
    const now = new Date();
    deviceStatus = {
      lastSeen: now.toISOString(),
      isOnline: true,
      deviceId: payload["end_device_ids"]?.device_id || 'Unknown',
      signalQuality: metadata?.rx_metadata?.[0]?.rssi || null,
      receivedAt: metadata?.received_at || now.toISOString()
    };

    if (sensorPayload) {
      const decoded = sensorPayload.data;
      latestData = buildSensorData(decoded, now.toISOString());

      console.log(
        '[OK] [TTN DATA]',
        'Source:', sensorPayload.source,
        '| Node:', latestData.node_id ?? 'n/a',
        '| Main TDS:', latestData.main_tds,
        '| RO TDS:', latestData.ro_tds,
        '| pH:', latestData.ph,
        '| Turbidity:', latestData.turbidity ?? 'n/a',
        '| Temp:', latestData.temperature ?? 'n/a',
        '| Level:', latestData.water_level_cm ?? 'n/a',
        '| Flow:', latestData.flow_rate ?? 'n/a'
      );
      console.log('[DEVICE] ID:', deviceStatus.deviceId, '| Last Seen:', now.toLocaleTimeString());

      // Save to database
      try {
        const dbId = insertReading({
          deviceId: deviceStatus.deviceId,
          node_id: latestData.node_id,
          main_tds: latestData.main_tds,
          ro_tds: latestData.ro_tds,
          reject_tds: latestData.reject_tds,
          ph: latestData.ph,
          turbidity: latestData.turbidity,
          temperature: latestData.temperature,
          water_level_cm: latestData.water_level_cm,
          flow_rate: latestData.flow_rate,
          signalQuality: deviceStatus.signalQuality,
          timestamp: latestData.timestamp
        });
        console.log('[DATABASE] Saved reading #' + dbId);
      } catch (dbError) {
        console.error('[DATABASE ERROR]', dbError.message);
      }

      broadcastToClients({
        sensorData: latestData,
        deviceStatus: deviceStatus
      });
    } else {
      console.warn('[TTN WARN] No usable decoded_payload or Arduino frm_payload in message');
    }
  } catch (error) {
    console.error('[TTN ERROR] Parsing failed:', error.message);
  }
}

if (hasMqttConfig) {
  console.log('[MQTT] Connecting to TTN using NATIVE MQTT protocol');
  console.log(`Host: ${TTN_MQTT_HOST}:${TTN_MQTT_PORT}`);

  mqttClient = mqtt.connect(`mqtts://${TTN_MQTT_HOST}:${TTN_MQTT_PORT}`, {
    username: TTN_MQTT_USERNAME,
    password: TTN_MQTT_PASSWORD,
    protocol: 'mqtts',
    keepalive: 60,
    clean: true,
    rejectUnauthorized: true
  });

  mqttClient.on('connect', (connack) => {
    const rc = connack.returnCode || 0;
    console.log('[OK] Connected to TTN MQTT:', rc);

    mqttClient.subscribe(TTN_MQTT_TOPIC, (err) => {
      if (err) {
        console.error('[ERROR] Subscription error:', err);
      } else {
        console.log('[OK] Subscribed to:', TTN_MQTT_TOPIC);
        console.log('[WAIT] Waiting for messages from TTN devices...');
      }
    });
  });

  mqttClient.on('message', handleMqttMessage);

  mqttClient.on('error', (error) => {
    console.error('[MQTT ERROR]', error.message);
  });

  mqttClient.on('reconnect', () => {
    console.log('[MQTT] Reconnecting to TTN...');
  });

  mqttClient.on('offline', () => {
    console.log('[MQTT] Connection offline');
  });
}

const app = express();
app.use(cors());
app.use(express.json());

// Check if device is still online based on last seen time
function checkDeviceOnlineStatus() {
  if (deviceStatus.lastSeen) {
    const timeSinceLastSeen = Date.now() - new Date(deviceStatus.lastSeen).getTime();
    deviceStatus.isOnline = timeSinceLastSeen < DEVICE_TIMEOUT;
  } else {
    deviceStatus.isOnline = false;
  }
}

app.get('/api/data', (req, res) => {
  checkDeviceOnlineStatus();
  res.json({
    success: true,
    sensorData: latestData,
    deviceStatus: deviceStatus,
    bridgeConnected: mqttClient?.connected ?? false,
    mqttConfigured: hasMqttConfig
  });
});

app.get('/api/health', (req, res) => {
  checkDeviceOnlineStatus();
  res.json({
    success: true,
    mqtt_configured: hasMqttConfig,
    mqtt_connected: mqttClient?.connected ?? false,
    device_online: deviceStatus.isOnline,
    device_last_seen: deviceStatus.lastSeen,
    uptime: process.uptime()
  });
});

// Get historical data (last N readings)
app.get('/api/history/latest', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const readings = getLatestReadings(limit);
    res.json({
      success: true,
      count: readings.length,
      data: readings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get readings for last N hours
app.get('/api/history/hours/:hours', (req, res) => {
  try {
    const hours = parseInt(req.params.hours) || 24;
    const readings = getReadingsLastHours(hours);
    res.json({
      success: true,
      count: readings.length,
      hours: hours,
      data: readings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get database statistics
app.get('/api/statistics', (req, res) => {
  try {
    const stats = getStatistics();
    const totalCount = getTotalCount();
    res.json({
      success: true,
      statistics: {
        ...stats,
        total_readings: totalCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP] API server running on http://localhost:${HTTP_PORT}`);
  console.log(`   - GET /api/data - Get latest sensor data`);
  console.log(`   - GET /api/health - Server health check`);
  console.log(`   - GET /api/history/latest?limit=N - Get last N readings`);
  console.log(`   - GET /api/history/hours/:hours - Get readings for last N hours`);
  console.log(`   - GET /api/statistics - Get database statistics`);
});

const wss = new WebSocketServer({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  checkDeviceOnlineStatus();
  
  // Send initial data if available
  if (latestData.timestamp) {
    ws.send(JSON.stringify({
      type: 'initial',
      sensorData: latestData,
      deviceStatus: deviceStatus
    }));
  }
  
  ws.on('close', () => {
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('[BRIDGE] WebSocket error:', error.message);
    clients.delete(ws);
  });
});

// Periodically check device status and broadcast if it changes
setInterval(() => {
  const wasOnline = deviceStatus.isOnline;
  checkDeviceOnlineStatus();
  
  if (wasOnline !== deviceStatus.isOnline) {
    console.log(`[DEVICE STATUS CHANGE] Device is now ${deviceStatus.isOnline ? 'ONLINE' : 'OFFLINE'}`);
    broadcastToClients({
      sensorData: latestData,
      deviceStatus: deviceStatus
    });
  }
}, 10000); // Check every 10 seconds

function broadcastToClients(payload) {
  const message = JSON.stringify({
    type: 'update',
    sensorData: payload.sensorData || latestData,
    deviceStatus: payload.deviceStatus || deviceStatus
  });
  
  let sentCount = 0;
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
      sentCount++;
    }
  });
  
  if (sentCount > 0) {
    console.log(`[BROADCAST] Sent to ${sentCount} client(s)\n`);
  }
}

console.log(`[WS] WebSocket server running on ws://localhost:${WS_PORT}`);
console.log('\n[OK] Bridge server ready! React app can now connect to:');
console.log(`   - HTTP: http://localhost:${HTTP_PORT}/api/data`);
console.log(`   - WebSocket: ws://localhost:${WS_PORT}\n`);
