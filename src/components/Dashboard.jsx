import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import packageInfo from '../../package.json';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const BRIDGE_WS_URL = "ws://localhost:3334";
const BRIDGE_HTTP_URL = "http://localhost:3333/api/data";
const STATS_API_URL = "http://localhost:3333/api/statistics";

const THRESHOLDS = {
  main_tds: 'Safe: < 500 ppm',
  ro_tds: 'Safe: < 100 ppm',
  ph: 'Safe: 6.5 - 8.5',
  turbidity: 'Target: Low NTU',
  temperature: 'Normal: 20 - 35 C',
  water_level_cm: 'Visual max: 200 cm'
};

const SENSOR_INTERVAL_SECONDS = 180;
const MAX_HISTORY_POINTS = 20;
const WATER_LEVEL_VISUAL_MAX_CM = 200;
const SENSOR_FIELDS = ['main_tds', 'ro_tds', 'ph', 'turbidity', 'temperature', 'water_level_cm'];

function parseReadingDate(timestamp) {
  if (!timestamp) {
    return new Date();
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getSecondsUntilNextReading(timestamp) {
  if (!timestamp) {
    return 0;
  }

  const elapsedSeconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
  return Math.max(0, SENSOR_INTERVAL_SECONDS - elapsedSeconds);
}

function getOptionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getSensorValue(sensorData, field, fallback = 0) {
  const value = getOptionalNumber(sensorData[field]);
  return value == null ? fallback : value;
}

function formatStat(value, unit = '', decimals = 1) {
  const number = getOptionalNumber(value);
  if (number == null) {
    return '--';
  }

  return `${number.toFixed(decimals)}${unit ? ` ${unit}` : ''}`;
}

function getWaterLevelPercent(value) {
  const number = getOptionalNumber(value);
  if (number == null) {
    return 0;
  }

  return Math.max(0, Math.min(100, (number / WATER_LEVEL_VISUAL_MAX_CM) * 100));
}

const Dashboard = () => {
  const [data, setData] = useState({
    main_tds: 0,
    ro_tds: 0,
    ph: 0,
    turbidity: null,
    temperature: null,
    water_level_cm: null
  });
  const [history, setHistory] = useState({
    timestamps: [],
    main_tds: [],
    ro_tds: [],
    ph: [],
    turbidity: [],
    temperature: [],
    water_level_cm: []
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [deviceStatus, setDeviceStatus] = useState({
    isOnline: false,
    lastSeen: null,
    deviceId: null,
    signalQuality: null
  });
  const [nextUpdateIn, setNextUpdateIn] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [updateState, setUpdateState] = useState({
    checking: false,
    installing: false,
    available: false,
    message: '',
    error: false,
    latestVersion: null
  });
  const wsRef = useRef(null);
  const updaterApi = typeof window !== 'undefined' ? window.electron?.updater : null;
  const canUseUpdater = Boolean(updaterApi);

  const checkForUpdates = useCallback(async ({ silent = false } = {}) => {
    if (!updaterApi) {
      if (!silent) {
        setUpdateState(prev => ({
          ...prev,
          message: 'Updates are available in the desktop app only.',
          error: true
        }));
      }
      return;
    }

    setUpdateState(prev => ({
      ...prev,
      checking: true,
      error: false,
      message: silent ? prev.message : 'Checking for updates...'
    }));

    try {
      const result = await updaterApi.check();

      if (silent && result.success && !result.available) {
        setUpdateState(prev => ({
          ...prev,
          checking: false,
          available: false,
          latestVersion: result.latestVersion || null
        }));
        return;
      }

      setUpdateState({
        checking: false,
        installing: false,
        available: Boolean(result.available),
        message: result.message || (result.available ? 'Update available.' : 'No update available.'),
        error: !result.success,
        latestVersion: result.latestVersion || null
      });
    } catch (error) {
      if (!silent) {
        setUpdateState({
          checking: false,
          installing: false,
          available: false,
          message: error.message || 'Could not check for updates.',
          error: true,
          latestVersion: null
        });
      } else {
        setUpdateState(prev => ({
          ...prev,
          checking: false
        }));
      }
    }
  }, [updaterApi]);

  const installUpdate = useCallback(async () => {
    if (!updaterApi) {
      return;
    }

    setUpdateState(prev => ({
      ...prev,
      installing: true,
      checking: false,
      error: false,
      message: 'Downloading update...'
    }));

    try {
      const result = await updaterApi.install();

      if (!result.success) {
        throw new Error(result.message || 'Update install failed.');
      }

      setUpdateState(prev => ({
        ...prev,
        installing: true,
        message: result.message || 'Update downloaded. Restarting...',
        error: false
      }));
    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        installing: false,
        message: error.message || 'Update install failed.',
        error: true
      }));
    }
  }, [updaterApi]);

  const updateUI = useCallback((sensorData) => {
    const nextData = {
      main_tds: getSensorValue(sensorData, 'main_tds'),
      ro_tds: getSensorValue(sensorData, 'ro_tds'),
      ph: getSensorValue(sensorData, 'ph'),
      turbidity: getOptionalNumber(sensorData.turbidity),
      temperature: getOptionalNumber(sensorData.temperature),
      water_level_cm: getOptionalNumber(sensorData.water_level_cm)
    };
    const timestamp = parseReadingDate(sensorData.timestamp);

    setData(nextData);
    setLastUpdate(timestamp);
    setNextUpdateIn(getSecondsUntilNextReading(timestamp));

    setHistory(prev => {
      const timeStr = timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const lastIndex = prev.timestamps.length - 1;
      const isDuplicate =
        prev.timestamps[lastIndex] === timeStr &&
        SENSOR_FIELDS.every((field) => prev[field][lastIndex] === nextData[field]);

      if (isDuplicate) {
        return prev;
      }

      return {
        timestamps: [...prev.timestamps, timeStr].slice(-MAX_HISTORY_POINTS),
        main_tds: [...prev.main_tds, nextData.main_tds].slice(-MAX_HISTORY_POINTS),
        ro_tds: [...prev.ro_tds, nextData.ro_tds].slice(-MAX_HISTORY_POINTS),
        ph: [...prev.ph, nextData.ph].slice(-MAX_HISTORY_POINTS),
        turbidity: [...prev.turbidity, nextData.turbidity].slice(-MAX_HISTORY_POINTS),
        temperature: [...prev.temperature, nextData.temperature].slice(-MAX_HISTORY_POINTS),
        water_level_cm: [...prev.water_level_cm, nextData.water_level_cm].slice(-MAX_HISTORY_POINTS)
      };
    });
  }, []);

  useEffect(() => {
    // Fetch initial data via HTTP
    fetch(BRIDGE_HTTP_URL)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          if (result.sensorData && result.sensorData.timestamp) {
            updateUI(result.sensorData);
          }
          if (result.deviceStatus) {
            setDeviceStatus(result.deviceStatus);
          }
        }
      })
      .catch(err => console.error('Failed to fetch initial data:', err));
    
    const ws = new WebSocket(BRIDGE_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('Connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.sensorData) {
          updateUI(message.sensorData);
        }
        
        if (message.deviceStatus) {
          setDeviceStatus(message.deviceStatus);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('Connection Error');
    };

    ws.onclose = () => {
      setConnectionStatus('Disconnected');
    };

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [updateUI]);

  // Fetch database statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch(STATS_API_URL);
        const result = await response.json();
        if (result.success) {
          setStatistics(result.statistics);
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    fetchStatistics();

    // Refresh statistics every 5 minutes
    const interval = setInterval(() => {
      fetchStatistics();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNextUpdateIn((prev) => {
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!canUseUpdater) {
      return undefined;
    }

    const timer = setTimeout(() => {
      checkForUpdates({ silent: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [canUseUpdater, checkForUpdates]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatLastSeen = (isoString) => {
    if (!isoString) return 'Never';
    const lastSeen = new Date(isoString);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return lastSeen.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const main_alert = data.main_tds > 500;
  const ro_alert = data.ro_tds > 100;
  const ph_alert = data.ph < 6.5 || data.ph > 8.5;
  const turbidity_alert = data.turbidity != null && data.turbidity > 5;
  const temperature_alert = data.temperature != null && (data.temperature < 20 || data.temperature > 35);
  const waterLevelPercent = getWaterLevelPercent(data.water_level_cm);

  const chartData = useMemo(() => ({
    labels: history.timestamps,
    datasets: [
      {
        label: 'Main Tank TDS',
        data: history.main_tds,
        borderColor: '#007AFF',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'RO Tank TDS',
        data: history.ro_tds,
        borderColor: '#5856D6',
        backgroundColor: 'rgba(88, 86, 214, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'pH Level',
        data: history.ph,
        borderColor: '#FF9500',
        backgroundColor: 'rgba(255, 149, 0, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y1'
      },
      {
        label: 'Turbidity',
        data: history.turbidity,
        borderColor: '#34C759',
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Temperature',
        data: history.temperature,
        borderColor: '#FF3B30',
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y2'
      }
    ]
  }), [history]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            family: '-apple-system, SF Pro Display, sans-serif',
            size: 12,
            weight: '600'
          },
          color: '#3C3C43',
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: '-apple-system, SF Pro Display, sans-serif',
          size: 13,
          weight: '600'
        },
        bodyFont: {
          family: '-apple-system, SF Pro Display, sans-serif',
          size: 12
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: '-apple-system, SF Pro Display, sans-serif',
            size: 11
          },
          color: '#8E8E93',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        position: 'left',
        title: {
          display: true,
          text: 'TDS / Turbidity',
          font: {
            family: '-apple-system, SF Pro Display, sans-serif',
            size: 12,
            weight: '600'
          },
          color: '#3C3C43'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: '-apple-system, SF Pro Display, sans-serif',
            size: 11
          },
          color: '#8E8E93'
        }
      },
      y1: {
        position: 'right',
        title: {
          display: true,
          text: 'pH',
          font: {
            family: '-apple-system, SF Pro Display, sans-serif',
            size: 12,
            weight: '600'
          },
          color: '#3C3C43'
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: '-apple-system, SF Pro Display, sans-serif',
            size: 11
          },
          color: '#8E8E93'
        },
        min: 0,
        max: 14
      },
      y2: {
        position: 'right',
        title: {
          display: true,
          text: 'Temp (C)',
          font: {
            family: '-apple-system, SF Pro Display, sans-serif',
            size: 12,
            weight: '600'
          },
          color: '#3C3C43'
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: '-apple-system, SF Pro Display, sans-serif',
            size: 11
          },
          color: '#8E8E93'
        },
        min: 0,
        max: 50
      }
    }
  }), []);

  return (
    <div className="dashboard-container">
      <div className="dashboard">
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <div className="team-name">Fluid Fusion</div>
              <h1 className="title">Water Quality Monitor</h1>
              <p className="subtitle">Real-time RO system monitoring</p>
            </div>
            <div className="header-right">
              <div className="header-actions">
                {canUseUpdater && (
                  <div className="update-controls">
                    <button
                      type="button"
                      className={`update-check-btn ${updateState.available ? 'available' : ''}`}
                      onClick={updateState.available ? installUpdate : () => checkForUpdates()}
                      disabled={updateState.checking || updateState.installing}
                    >
                      {updateState.installing
                        ? 'Installing...'
                        : updateState.available
                          ? `Install ${updateState.latestVersion || 'Update'}`
                          : updateState.checking
                            ? 'Checking...'
                            : 'Check Updates'}
                    </button>
                    {updateState.message && (
                      <div className={`update-message ${updateState.error ? 'error' : updateState.available ? 'available' : ''}`}>
                        {updateState.message}
                      </div>
                    )}
                  </div>
                )}
                <Link to="/history" className="history-link-btn">
                  <span className="btn-icon">Chart</span>
                  <span>View History</span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="header-status">
            <div className="status-group">
              <div className={`status-indicator ${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}>
                <div className="status-dot"></div>
                <span className="status-label">Bridge</span>
                <span>{connectionStatus}</span>
              </div>
              <div className={`status-indicator device-status ${deviceStatus.isOnline ? 'connected' : 'disconnected'}`}>
                <div className="status-dot"></div>
                <span className="status-label">Sensor</span>
                <span>{deviceStatus.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            
            <div className="device-info">
              {deviceStatus.deviceId ? (
                <>
                  <span className="device-id" title={`Device: ${deviceStatus.deviceId}`}>
                    Device: {deviceStatus.deviceId}
                  </span>
                  <span className="last-seen">
                    Last seen: {formatLastSeen(deviceStatus.lastSeen)}
                  </span>
                </>
              ) : (
                <span className="last-seen waiting">
                  {connectionStatus === 'Connected' 
                    ? 'Waiting for sensor data...'
                    : 'Bridge not connected'}
                </span>
              )}
            </div>
            
            <div className="update-info-header">
              <div className="update-item">
                <div className="update-label-header">Last Update</div>
                <div className="update-value-header">{formatDateTime(lastUpdate)}</div>
              </div>
              <div className="update-item">
                <div className="update-label-header">Next Update</div>
                <div className="update-value-header countdown">{formatCountdown(nextUpdateIn)}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="cards-grid">
          <MetricCard
            title="Main Tank TDS"
            value={data.main_tds}
            unit="ppm"
            icon="MT"
            iconClass="main-tank"
            alert={main_alert}
            threshold={THRESHOLDS.main_tds}
          />
          
          <MetricCard
            title="RO Tank TDS"
            value={data.ro_tds}
            unit="ppm"
            icon="RO"
            iconClass="ro-tank"
            alert={ro_alert}
            threshold={THRESHOLDS.ro_tds}
          />
          
          <MetricCard
            title="pH Level"
            value={data.ph}
            unit=""
            icon="pH"
            iconClass="ph-level"
            alert={ph_alert}
            threshold={THRESHOLDS.ph}
            decimals={2}
          />

          <MetricCard
            title="Turbidity"
            value={data.turbidity}
            unit="NTU"
            icon="TU"
            iconClass="turbidity"
            alert={turbidity_alert}
            threshold={THRESHOLDS.turbidity}
          />

          <MetricCard
            title="Temperature"
            value={data.temperature}
            unit="C"
            icon="TP"
            iconClass="temperature"
            alert={temperature_alert}
            threshold={THRESHOLDS.temperature}
          />

          <WaterLevelCard
            value={data.water_level_cm}
            percent={waterLevelPercent}
            threshold={THRESHOLDS.water_level_cm}
          />
        </div>

        {history.timestamps.length > 0 && (
          <div className="chart-section">
            <div className="chart-header">
              <h2 className="chart-title">Historical Trends</h2>
              <p className="chart-subtitle">Last {history.timestamps.length} readings</p>
            </div>
            <div className="chart-container">
              <Line
                data={chartData}
                options={chartOptions}
              />
            </div>
          </div>
        )}

        {/* Database Statistics Section */}
        {statistics && (
          <div className="stats-section">
            <div className="stats-header">
              <h2 className="stats-title">Database Statistics</h2>
              <p className="stats-subtitle">Historical data overview</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Readings</div>
                <div className="stat-value">{statistics.total_readings || 0}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg Main TDS</div>
                <div className="stat-value">{formatStat(statistics.avg_main_tds, 'ppm')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg RO TDS</div>
                <div className="stat-value">{formatStat(statistics.avg_ro_tds, 'ppm')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg pH</div>
                <div className="stat-value">{formatStat(statistics.avg_ph, '', 2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg Turbidity</div>
                <div className="stat-value">{formatStat(statistics.avg_turbidity, 'NTU')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg Temperature</div>
                <div className="stat-value">{formatStat(statistics.avg_temperature, 'C')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg Water Level</div>
                <div className="stat-value">{formatStat(statistics.avg_water_level_cm, 'cm')}</div>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="version-info">v{packageInfo.version}</div>
          <div className="developer-info">Developed by Fluid Fusion Team - Dr. Vinod Kumar</div>
        </div>
      </footer>
    </div>
  );
};

// ================= METRIC CARD =================
// iOS-style clean card component - Optimized with React.memo
// This prevents re-rendering when countdown changes (only re-renders when data changes)
const MetricCard = React.memo(({ title, value, unit, icon, iconClass, alert, threshold, decimals = 0 }) => {
  const numberValue = getOptionalNumber(value);
  const displayValue = numberValue == null ? '--' : numberValue.toFixed(decimals);

  return (
    <div className={`metric-card ${alert ? 'alert' : 'normal'}`}>
      <div className="card-content">
        <div className="card-header">
          <div className={`card-icon ${iconClass}`}>{icon}</div>
          <h3 className="card-title">{title}</h3>
        </div>
        <div className="card-value">
          <span className="value-number">
            {displayValue}
          </span>
          {unit && <span className="value-unit">{unit}</span>}
        </div>
        {threshold && (
          <div className="threshold-info">
            {threshold}
          </div>
        )}
        {alert && (
          <div className="alert-badge">
            Alert
          </div>
        )}
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

const WaterLevelCard = React.memo(({ value, percent, threshold }) => {
  const numberValue = getOptionalNumber(value);
  const displayValue = numberValue == null ? '--' : numberValue.toFixed(0);
  const displayPercent = Math.round(percent);

  return (
    <div className="metric-card water-level-card">
      <div className="water-card-content">
        <div className="water-card-copy">
          <div className="card-header">
            <div className="card-icon water-level">WL</div>
            <h3 className="card-title">Water Level</h3>
          </div>
          <div className="card-value">
            <span className="value-number">{displayValue}</span>
            <span className="value-unit">cm</span>
          </div>
          <div className="threshold-info">{threshold}</div>
          <div className="water-percent-label">
            {numberValue == null ? 'Waiting for reading' : `${displayPercent}% visual fill`}
          </div>
        </div>

        <div className="glass-tub" style={{ '--water-level': `${percent}%` }}>
          <div className="tub-shine"></div>
          <div className="water-fill">
            <div className="water-wave wave-one"></div>
            <div className="water-wave wave-two"></div>
          </div>
          <div className="tub-base"></div>
        </div>
      </div>
    </div>
  );
});

WaterLevelCard.displayName = 'WaterLevelCard';

export default Dashboard;
