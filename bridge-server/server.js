import mqtt from 'mqtt';
import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const TTN_MQTT_HOST = process.env.TTN_MQTT_HOST || "eu1.cloud.thethings.network";
const TTN_MQTT_PORT = parseInt(process.env.TTN_MQTT_PORT) || 8883;
const TTN_MQTT_USERNAME = process.env.TTN_MQTT_USERNAME;
const TTN_MQTT_PASSWORD = process.env.TTN_MQTT_PASSWORD;
const TTN_MQTT_TOPIC = process.env.TTN_MQTT_TOPIC;

const HTTP_PORT = parseInt(process.env.HTTP_PORT) || 3333;
const WS_PORT = parseInt(process.env.WS_PORT) || 3334;

if (!TTN_MQTT_USERNAME || !TTN_MQTT_PASSWORD || !TTN_MQTT_TOPIC) {
  console.error('❌ ERROR: Missing required environment variables!');
  console.error('Please create bridge-server/.env file with:');
  console.error('  TTN_MQTT_USERNAME=your_username@ttn');
  console.error('  TTN_MQTT_PASSWORD=your_password');
  console.error('  TTN_MQTT_TOPIC=v3/your_username@ttn/devices/+/up');
  process.exit(1);
}

let latestData = {
  main_tds: 0,
  ro_tds: 0,
  reject_tds: 0,
  ph: 0,
  timestamp: null
};

console.log('🚀 Starting TTN MQTT Bridge Server...');
console.log('📡 Connecting to TTN using NATIVE MQTT protocol');
console.log(`Host: ${TTN_MQTT_HOST}:${TTN_MQTT_PORT}`);

const mqttClient = mqtt.connect(`mqtts://${TTN_MQTT_HOST}:${TTN_MQTT_PORT}`, {
  username: TTN_MQTT_USERNAME,
  password: TTN_MQTT_PASSWORD,
  protocol: 'mqtts',
  keepalive: 60,
  clean: true,
  rejectUnauthorized: true
});

mqttClient.on('connect', (connack) => {
  const rc = connack.returnCode || 0;
  console.log('✅ Connected to TTN MQTT:', rc);
  
  mqttClient.subscribe(TTN_MQTT_TOPIC, (err) => {
    if (err) {
      console.error('❌ Subscription error:', err);
    } else {
      console.log('✅ Subscribed to:', TTN_MQTT_TOPIC);
      console.log('⏳ Waiting for messages from TTN devices...');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    console.log('\n📩 [TTN DATA] Received from device');
    
    const payload = JSON.parse(message.toString());
    const decoded = payload["uplink_message"]["decoded_payload"];
    
    if (decoded) {
      latestData = {
        main_tds: decoded.main_tds ?? 0,
        ro_tds: decoded.ro_tds ?? 0,
        reject_tds: decoded.reject_tds ?? 0,
        ph: decoded.ph ?? 0,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ [TTN DATA] Main TDS:', latestData.main_tds, '| RO TDS:', latestData.ro_tds, '| Reject TDS:', latestData.reject_tds, '| pH:', latestData.ph);
      
      broadcastToClients(latestData);
    } else {
      console.warn('⚠️ [TTN WARN] No decoded_payload in message');
    }
  } catch (error) {
    console.error('❌ [TTN ERROR] Parsing failed:', error.message);
  }
});

mqttClient.on('error', (error) => {
  console.error('❌ [MQTT ERROR]', error.message);
});

mqttClient.on('reconnect', () => {
  console.log('🔄 [MQTT] Reconnecting to TTN...');
});

mqttClient.on('offline', () => {
  console.log('📴 MQTT connection offline');
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    data: latestData,
    connected: mqttClient.connected
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    mqtt_connected: mqttClient.connected,
    uptime: process.uptime()
  });
});

app.listen(HTTP_PORT, () => {
  console.log(`🌐 HTTP API server running on http://localhost:${HTTP_PORT}`);
  console.log(`   - GET /api/data - Get latest sensor data`);
  console.log(`   - GET /api/health - Server health check`);
});

const wss = new WebSocketServer({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  if (latestData.timestamp) {
    ws.send(JSON.stringify({
      type: 'initial',
      data: latestData
    }));
  }
  
  ws.on('close', () => {
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ [BRIDGE] WebSocket error:', error.message);
    clients.delete(ws);
  });
});

function broadcastToClients(data) {
  const message = JSON.stringify({
    type: 'update',
    data: data
  });
  
  let sentCount = 0;
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
      sentCount++;
    }
  });
  
  if (sentCount > 0) {
    console.log(`📤 [BROADCAST] Sent to ${sentCount} client(s)\n`);
  }
}

console.log(`🔌 WebSocket server running on ws://localhost:${WS_PORT}`);
console.log('\n✅ Bridge server ready! React app can now connect to:');
console.log(`   - HTTP: http://localhost:${HTTP_PORT}/api/data`);
console.log(`   - WebSocket: ws://localhost:${WS_PORT}\n`);
