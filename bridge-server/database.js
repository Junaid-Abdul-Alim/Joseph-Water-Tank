import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const dataDir = process.env.BRIDGE_DATA_DIR || __dirname;
fs.mkdirSync(dataDir, { recursive: true });

const sqlitePath = path.join(dataDir, 'sensor_data.db');
const jsonPath = path.join(dataDir, 'sensor_readings.json');

const STAT_FIELDS = [
  'main_tds',
  'ro_tds',
  'reject_tds',
  'ph',
  'turbidity',
  'temperature',
  'water_level_cm',
  'flow_rate'
];

let db = null;
let sqlite = null;
let jsonReadings = [];

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function numberOrDefault(value, fallback = 0) {
  const number = numberOrNull(value);
  return number == null ? fallback : number;
}

function normalizeReadingData(data) {
  return {
    device_id: data.deviceId || data.device_id || null,
    node_id: numberOrNull(data.node_id),
    main_tds: numberOrDefault(data.main_tds),
    ro_tds: numberOrDefault(data.ro_tds),
    reject_tds: numberOrDefault(data.reject_tds),
    ph: numberOrDefault(data.ph),
    turbidity: numberOrNull(data.turbidity),
    temperature: numberOrNull(data.temperature),
    water_level_cm: numberOrNull(data.water_level_cm),
    flow_rate: numberOrNull(data.flow_rate),
    signal_quality: numberOrNull(data.signalQuality ?? data.signal_quality),
    timestamp: data.timestamp || new Date().toISOString()
  };
}

function ensureSqliteColumns() {
  const existingColumns = new Set(
    db.prepare('PRAGMA table_info(sensor_readings)').all().map((column) => column.name)
  );

  const columns = {
    node_id: 'INTEGER',
    turbidity: 'REAL',
    temperature: 'REAL',
    water_level_cm: 'REAL',
    flow_rate: 'REAL'
  };

  for (const [column, definition] of Object.entries(columns)) {
    if (!existingColumns.has(column)) {
      db.exec(`ALTER TABLE sensor_readings ADD COLUMN ${column} ${definition}`);
      console.log(`[DATABASE] Added missing column: ${column}`);
    }
  }
}

function isMissingOptionalSqlite(error) {
  return error?.code === 'MODULE_NOT_FOUND'
    && String(error.message || '').includes('better-sqlite3');
}

function initSqlite() {
  try {
    const Database = require('better-sqlite3');
    db = new Database(sqlitePath);
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        node_id INTEGER,
        main_tds REAL NOT NULL DEFAULT 0,
        ro_tds REAL NOT NULL DEFAULT 0,
        reject_tds REAL NOT NULL DEFAULT 0,
        ph REAL NOT NULL DEFAULT 0,
        turbidity REAL,
        temperature REAL,
        water_level_cm REAL,
        flow_rate REAL,
        signal_quality INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    ensureSqliteColumns();

    db.exec('CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_readings(timestamp DESC)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_device_id ON sensor_readings(device_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_node_id ON sensor_readings(node_id)');

    sqlite = {
      insertReading: db.prepare(`
        INSERT INTO sensor_readings (
          device_id,
          node_id,
          main_tds,
          ro_tds,
          reject_tds,
          ph,
          turbidity,
          temperature,
          water_level_cm,
          flow_rate,
          signal_quality,
          timestamp
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      getLatestReading: db.prepare('SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1'),
      getLatestReadings: db.prepare('SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT ?'),
      getReadingsByTimeRange: db.prepare(`
        SELECT * FROM sensor_readings
        WHERE timestamp BETWEEN ? AND ?
        ORDER BY timestamp DESC
        LIMIT ?
      `),
      getReadingsLastHours: db.prepare(`
        SELECT * FROM sensor_readings
        WHERE timestamp >= datetime('now', '-' || ? || ' hours')
        ORDER BY timestamp ASC
      `),
      getStatistics: db.prepare(`
        SELECT
          COUNT(*) as total_readings,
          MIN(timestamp) as first_reading,
          MAX(timestamp) as last_reading,
          AVG(main_tds) as avg_main_tds,
          AVG(ro_tds) as avg_ro_tds,
          AVG(reject_tds) as avg_reject_tds,
          AVG(ph) as avg_ph,
          AVG(turbidity) as avg_turbidity,
          AVG(temperature) as avg_temperature,
          AVG(water_level_cm) as avg_water_level_cm,
          AVG(flow_rate) as avg_flow_rate,
          MIN(main_tds) as min_main_tds,
          MAX(main_tds) as max_main_tds,
          MIN(ro_tds) as min_ro_tds,
          MAX(ro_tds) as max_ro_tds,
          MIN(ph) as min_ph,
          MAX(ph) as max_ph,
          MIN(turbidity) as min_turbidity,
          MAX(turbidity) as max_turbidity,
          MIN(temperature) as min_temperature,
          MAX(temperature) as max_temperature,
          MIN(water_level_cm) as min_water_level_cm,
          MAX(water_level_cm) as max_water_level_cm,
          MIN(flow_rate) as min_flow_rate,
          MAX(flow_rate) as max_flow_rate
        FROM sensor_readings
      `),
      cleanOldData: db.prepare(`
        DELETE FROM sensor_readings
        WHERE timestamp < datetime('now', '-' || ? || ' days')
      `),
      getTotalCount: db.prepare('SELECT COUNT(*) as count FROM sensor_readings')
    };

    console.log('[OK] SQLite database initialized:', sqlitePath);
    return true;
  } catch (error) {
    db = null;
    sqlite = null;

    if (!isMissingOptionalSqlite(error)) {
      console.warn('[DATABASE] SQLite unavailable, using JSON storage:', error.message);
    }

    return false;
  }
}

function initJsonStore() {
  try {
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, 'utf8');
      jsonReadings = content.trim() ? JSON.parse(content) : [];
    }
  } catch (error) {
    console.warn('[DATABASE] Could not read JSON store, starting fresh:', error.message);
    jsonReadings = [];
  }

  if (!Array.isArray(jsonReadings)) {
    jsonReadings = [];
  }

  console.log('[OK] JSON database initialized:', jsonPath);
}

function saveJsonStore() {
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReadings, null, 2), 'utf8');
}

function sortByTimestampDesc(readings) {
  return [...readings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getNextJsonId() {
  return jsonReadings.reduce((max, reading) => Math.max(max, Number(reading.id) || 0), 0) + 1;
}

function averageFor(readings, field) {
  const values = readings
    .map((reading) => numberOrNull(reading[field]))
    .filter((value) => value != null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function minFor(readings, field) {
  const values = readings
    .map((reading) => numberOrNull(reading[field]))
    .filter((value) => value != null);

  return values.length ? Math.min(...values) : null;
}

function maxFor(readings, field) {
  const values = readings
    .map((reading) => numberOrNull(reading[field]))
    .filter((value) => value != null);

  return values.length ? Math.max(...values) : null;
}

function buildStatistics(readings) {
  const base = {
    total_readings: readings.length,
    first_reading: null,
    last_reading: null
  };

  for (const field of STAT_FIELDS) {
    base[`avg_${field}`] = null;
    base[`min_${field}`] = null;
    base[`max_${field}`] = null;
  }

  if (readings.length === 0) {
    return base;
  }

  const sorted = sortByTimestampDesc(readings);
  base.first_reading = sorted[sorted.length - 1].timestamp;
  base.last_reading = sorted[0].timestamp;

  for (const field of STAT_FIELDS) {
    base[`avg_${field}`] = averageFor(readings, field);
    base[`min_${field}`] = minFor(readings, field);
    base[`max_${field}`] = maxFor(readings, field);
  }

  return base;
}

const usingSqlite = initSqlite();
if (!usingSqlite) {
  initJsonStore();
}

const insertReading = (data) => {
  const reading = normalizeReadingData(data);

  if (sqlite) {
    const result = sqlite.insertReading.run(
      reading.device_id,
      reading.node_id,
      reading.main_tds,
      reading.ro_tds,
      reading.reject_tds,
      reading.ph,
      reading.turbidity,
      reading.temperature,
      reading.water_level_cm,
      reading.flow_rate,
      reading.signal_quality,
      reading.timestamp
    );

    return result.lastInsertRowid;
  }

  const jsonReading = {
    id: getNextJsonId(),
    ...reading,
    created_at: new Date().toISOString()
  };

  jsonReadings.push(jsonReading);
  saveJsonStore();
  return jsonReading.id;
};

const getLatestReading = () => {
  if (sqlite) {
    return sqlite.getLatestReading.get();
  }

  return sortByTimestampDesc(jsonReadings)[0] || null;
};

const getLatestReadings = (limit = 100) => {
  if (sqlite) {
    return sqlite.getLatestReadings.all(limit);
  }

  return sortByTimestampDesc(jsonReadings).slice(0, limit);
};

const getReadingsByTimeRange = (startTime, endTime, limit = 1000) => {
  if (sqlite) {
    return sqlite.getReadingsByTimeRange.all(startTime, endTime, limit);
  }

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return sortByTimestampDesc(jsonReadings)
    .filter((reading) => {
      const timestamp = new Date(reading.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    })
    .slice(0, limit);
};

const getReadingsLastHours = (hours = 24) => {
  if (sqlite) {
    return sqlite.getReadingsLastHours.all(hours);
  }

  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  return [...jsonReadings]
    .filter((reading) => new Date(reading.timestamp).getTime() >= cutoff)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

const getStatistics = () => {
  if (sqlite) {
    return sqlite.getStatistics.get();
  }

  return buildStatistics(jsonReadings);
};

const cleanOldData = (daysToKeep = 180) => {
  if (sqlite) {
    return sqlite.cleanOldData.run(daysToKeep).changes;
  }

  const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  const before = jsonReadings.length;
  jsonReadings = jsonReadings.filter((reading) => new Date(reading.timestamp).getTime() >= cutoff);

  if (jsonReadings.length !== before) {
    saveJsonStore();
  }

  return before - jsonReadings.length;
};

const getTotalCount = () => {
  if (sqlite) {
    return sqlite.getTotalCount.get().count;
  }

  return jsonReadings.length;
};

export {
  db,
  insertReading,
  getLatestReading,
  getLatestReadings,
  getReadingsByTimeRange,
  getReadingsLastHours,
  getStatistics,
  cleanOldData,
  getTotalCount
};
