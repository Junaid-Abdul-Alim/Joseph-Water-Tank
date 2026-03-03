import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
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

const THRESHOLDS = {
  main_tds: 'Safe: < 500 ppm',
  ro_tds: 'Safe: < 100 ppm',
  reject_tds: 'Normal: Varies',
  ph: 'Safe: 6.5 - 8.5'
};

const Dashboard = () => {
  const [data, setData] = useState({
    main_tds: 0,
    ro_tds: 0,
    reject_tds: 0,
    ph: 0
  });
  const [history, setHistory] = useState({
    timestamps: [],
    main_tds: [],
    ro_tds: [],
    reject_tds: [],
    ph: []
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [nextUpdateIn, setNextUpdateIn] = useState(180);
  const wsRef = useRef(null);
  const maxHistoryPoints = 20;

  useEffect(() => {
    // Fetch initial data via HTTP
    fetch(BRIDGE_HTTP_URL)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data && result.data.timestamp) {
          updateUI(result.data);
        }
      })
      .catch(err => console.error('❌ Failed to fetch initial data:', err));
    
    const ws = new WebSocket(BRIDGE_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('Connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.data) {
          console.log('✅ [DATA RECEIVED] Updating dashboard immediately');
          updateUI(message.data);
          setNextUpdateIn(180);
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
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
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNextUpdateIn((prev) => {
        if (prev <= 1) {
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const updateUI = (data) => {
    const main_tds = data.main_tds ?? 0;
    const ro_tds = data.ro_tds ?? 0;
    const reject_tds = data.reject_tds ?? 0;
    const ph = data.ph ?? 0;
    const timestamp = new Date();

    setData({ main_tds, ro_tds, reject_tds, ph });
    setLastUpdate(timestamp);

    setHistory(prev => {
      const timeStr = timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      const newTimestamps = [...prev.timestamps, timeStr].slice(-maxHistoryPoints);
      const newMainTds = [...prev.main_tds, main_tds].slice(-maxHistoryPoints);
      const newRoTds = [...prev.ro_tds, ro_tds].slice(-maxHistoryPoints);
      const newRejectTds = [...prev.reject_tds, reject_tds].slice(-maxHistoryPoints);
      const newPh = [...prev.ph, ph].slice(-maxHistoryPoints);

      return {
        timestamps: newTimestamps,
        main_tds: newMainTds,
        ro_tds: newRoTds,
        reject_tds: newRejectTds,
        ph: newPh
      };
    });
  };

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

  const main_alert = data.main_tds > 500;
  const ro_alert = data.ro_tds > 100;
  const ph_alert = data.ph < 6.5 || data.ph > 8.5;

  return (
    <div className="dashboard-container">
      <div className="dashboard">
        <header className="header">
          <div className="header-content">
            <h1 className="title">Water Quality Monitor</h1>
            <p className="subtitle">Real-time RO system monitoring</p>
          </div>
          <div className="header-status">
            <div className={`status-indicator ${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              <span>{connectionStatus}</span>
            </div>
            <div className="update-info-header">
              <div className="update-item">
                <span className="update-label-header">Last Updated</span>
                <span className="update-value-header">{formatDateTime(lastUpdate)}</span>
              </div>
              <div className="update-item">
                <span className="update-label-header">Next Update</span>
                <span className="update-value-header countdown">{formatCountdown(nextUpdateIn)}</span>
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
            title="Reject Tank TDS"
            value={data.reject_tds}
            unit="ppm"
            icon="RT"
            iconClass="reject-tank"
            alert={false}
            threshold={THRESHOLDS.reject_tds}
          />
          
          <MetricCard
            title="pH Level"
            value={data.ph}
            unit=""
            icon="pH"
            iconClass="ph-level"
            alert={ph_alert}
            threshold={THRESHOLDS.ph}
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
                data={{
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
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
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
                        text: 'TDS (ppm)',
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
                    }
                  }
                }}
              />
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

// ================= METRIC CARD =================
// iOS-style clean card component - Optimized with React.memo
// This prevents re-rendering when countdown changes (only re-renders when data changes)
const MetricCard = React.memo(({ title, value, unit, icon, iconClass, alert, threshold }) => {
  return (
    <div className={`metric-card ${alert ? 'alert' : 'normal'}`}>
      <div className="card-content">
        <div className="card-header">
          <div className={`card-icon ${iconClass}`}>{icon}</div>
          <h3 className="card-title">{title}</h3>
        </div>
        <div className="card-value">
          <span className="value-number">
            {value !== null && value !== undefined ? value : '--'}
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

export default Dashboard;
