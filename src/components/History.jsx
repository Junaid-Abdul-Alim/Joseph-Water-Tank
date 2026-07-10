import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './History.css';

const HISTORY_API_URL = "http://localhost:3333/api/history/hours";
const STATS_API_URL = "http://localhost:3333/api/statistics";

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMetric(value, unit = '', decimals = 0) {
  const number = toNumber(value);
  if (number == null) {
    return '--';
  }

  return `${number.toFixed(decimals)}${unit ? ` ${unit}` : ''}`;
}

const History = () => {
  const [readings, setReadings] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [timeRange, setTimeRange] = useState(24);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`${HISTORY_API_URL}/${timeRange}`),
        fetch(STATS_API_URL)
      ]);

      const historyResult = await historyResponse.json();
      const statsResult = await statsResponse.json();

      if (historyResult.success) {
        setReadings(historyResult.data);
      }

      if (statsResult.success) {
        setStatistics(statsResult.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      full: date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedReadings = useMemo(() => {
    let filtered = readings;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reading => 
        reading.device_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(reading.node_id ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDateTime(reading.timestamp).full.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'timestamp') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal == null && bVal == null) {
        return 0;
      }

      if (aVal == null) {
        return 1;
      }

      if (bVal == null) {
        return -1;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [readings, searchTerm, sortBy, sortOrder]);

  return (
    <div className="history-container">
      <div className="history-page">
        {/* Header */}
        <div className="history-header">
          <div className="header-left">
            <Link to="/" className="back-button">
              <span className="back-icon">&lt;</span>
              <span>Dashboard</span>
            </Link>
            <div>
              <h1 className="page-title">Reading History</h1>
              <p className="page-subtitle">
                {sortedReadings.length} readings - Last {timeRange}h
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="stats-overview">
            <div className="stat-box">
              <div className="stat-icon">DB</div>
              <div className="stat-content">
                <div className="stat-label">Total Readings</div>
                <div className="stat-number">{statistics.total_readings || 0}</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">MT</div>
              <div className="stat-content">
                <div className="stat-label">Avg Main TDS</div>
                <div className="stat-number">{formatMetric(statistics.avg_main_tds, 'ppm', 1)}</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">RO</div>
              <div className="stat-content">
                <div className="stat-label">Avg RO TDS</div>
                <div className="stat-number">{formatMetric(statistics.avg_ro_tds, 'ppm', 1)}</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">pH</div>
              <div className="stat-content">
                <div className="stat-label">Avg pH</div>
                <div className="stat-number">{formatMetric(statistics.avg_ph, '', 2)}</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">TU</div>
              <div className="stat-content">
                <div className="stat-label">Avg Turbidity</div>
                <div className="stat-number">{formatMetric(statistics.avg_turbidity, 'NTU', 1)}</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">TP</div>
              <div className="stat-content">
                <div className="stat-label">Avg Temp</div>
                <div className="stat-number">{formatMetric(statistics.avg_temperature, 'C', 1)}</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">WL</div>
              <div className="stat-content">
                <div className="stat-label">Avg Level</div>
                <div className="stat-number">{formatMetric(statistics.avg_water_level_cm, 'cm', 1)}</div>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">FR</div>
              <div className="stat-content">
                <div className="stat-label">Avg Flow</div>
                <div className="stat-number">{formatMetric(statistics.avg_flow_rate, '', 1)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls-bar">
          <div className="search-box">
            <span className="search-icon">Find</span>
            <input
              type="text"
              placeholder="Search by device or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="time-range-buttons">
            <button
              className={`range-btn ${timeRange === 24 ? 'active' : ''}`}
              onClick={() => setTimeRange(24)}
            >
              24 Hours
            </button>
            <button
              className={`range-btn ${timeRange === 168 ? 'active' : ''}`}
              onClick={() => setTimeRange(168)}
            >
              7 Days
            </button>
            <button
              className={`range-btn ${timeRange === 720 ? 'active' : ''}`}
              onClick={() => setTimeRange(720)}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Readings Table */}
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading readings...</p>
            </div>
          ) : sortedReadings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">No data</div>
              <h3>No Readings Found</h3>
              <p>No sensor data available for the selected time range.</p>
            </div>
          ) : (
            <table className="readings-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} className="sortable">
                    <div className="th-content">
                      ID
                      {sortBy === 'id' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('timestamp')} className="sortable">
                    <div className="th-content">
                      Date & Time
                      {sortBy === 'timestamp' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th>Device</th>
                  <th onClick={() => handleSort('node_id')} className="sortable">
                    <div className="th-content">
                      Node
                      {sortBy === 'node_id' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('main_tds')} className="sortable">
                    <div className="th-content">
                      Main TDS
                      {sortBy === 'main_tds' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('ro_tds')} className="sortable">
                    <div className="th-content">
                      RO TDS
                      {sortBy === 'ro_tds' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('ph')} className="sortable">
                    <div className="th-content">
                      pH Level
                      {sortBy === 'ph' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('turbidity')} className="sortable">
                    <div className="th-content">
                      Turbidity
                      {sortBy === 'turbidity' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('temperature')} className="sortable">
                    <div className="th-content">
                      Temp
                      {sortBy === 'temperature' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('water_level_cm')} className="sortable">
                    <div className="th-content">
                      Level
                      {sortBy === 'water_level_cm' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('flow_rate')} className="sortable">
                    <div className="th-content">
                      Flow
                      {sortBy === 'flow_rate' && <span className="sort-indicator">{sortOrder === 'asc' ? '^' : 'v'}</span>}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedReadings.map((reading) => {
                  const dt = formatDateTime(reading.timestamp);
                  return (
                    <tr key={reading.id}>
                      <td className="id-cell">#{reading.id}</td>
                      <td className="datetime-cell">
                        <div className="datetime-wrapper">
                          <span className="date-text">{dt.date}</span>
                          <span className="time-text">{dt.time}</span>
                        </div>
                      </td>
                      <td className="device-cell">{reading.device_id || 'N/A'}</td>
                      <td className="value-cell">
                        {reading.node_id ?? '--'}
                      </td>
                      <td className={reading.main_tds > 500 ? 'value-cell alert' : 'value-cell'}>
                        {formatMetric(reading.main_tds, 'ppm')}
                      </td>
                      <td className={reading.ro_tds > 100 ? 'value-cell alert' : 'value-cell'}>
                        {formatMetric(reading.ro_tds, 'ppm')}
                      </td>
                      <td className={reading.ph < 6.5 || reading.ph > 8.5 ? 'value-cell alert' : 'value-cell'}>
                        {formatMetric(reading.ph, '', 2)}
                      </td>
                      <td className={toNumber(reading.turbidity) != null && reading.turbidity > 5 ? 'value-cell alert' : 'value-cell'}>
                        {formatMetric(reading.turbidity, 'NTU')}
                      </td>
                      <td className={toNumber(reading.temperature) != null && (reading.temperature < 20 || reading.temperature > 35) ? 'value-cell alert' : 'value-cell'}>
                        {formatMetric(reading.temperature, 'C')}
                      </td>
                      <td className="value-cell">
                        {formatMetric(reading.water_level_cm, 'cm')}
                      </td>
                      <td className="value-cell">
                        {formatMetric(reading.flow_rate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
