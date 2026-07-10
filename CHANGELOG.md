# Changelog

All notable changes to the Water Quality Monitor project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned Features
- CSV/Excel export for historical data
- Email/SMS alert notifications
- User-configurable retention period
- Multi-device support
- Custom threshold configurations

---

## [1.0.0] - 2026-03-05

### Added
- **Desktop Application** with Electron wrapper
  - Auto-starting bridge server
  - Silent launcher (no terminal window)
  - Windows desktop shortcut creation
- **Real-time Monitoring Dashboard**
  - Live TDS readings (Main, RO, Reject)
  - Live pH monitoring
  - Real-time quality trend charts
  - Device online/offline status tracking
  - Visual alerts for threshold violations
- **Historical Data Analysis**
  - Dedicated History page with React Router
  - Searchable and sortable readings table
  - Time-range filtering (24h, 7days, 30days, all)
  - Statistical overview (averages, totals)
  - 6-month automatic data retention
- **Database System**
  - SQLite local storage with better-sqlite3
  - Automatic data persistence
  - Indexed queries for performance
  - WAL mode for reliability
  - Automatic cleanup (keeps 180 days)
  - Daily midnight cleanup schedule
- **TTN LoRaWAN Integration**
  - Native MQTT protocol connection
  - Secure TLS/SSL communication
  - Device status tracking (5-minute timeout)
  - Signal quality monitoring
- **Bridge Server**
  - HTTP API (port 3333)
  - WebSocket real-time updates (port 3334)
  - CORS-enabled for frontend
  - Health check endpoint
  - Statistics endpoint
  - History query endpoints
- **Modern UI Design**
  - Minimal iPhone aesthetic
  - Subtle shadows (1px)
  - Light borders (rgba 0.06-0.08)
  - Refined typography (400-500 weights)
  - Responsive layout
  - Mobile-friendly
- **Documentation**
  - README.md - Complete overview
  - INSTALLATION.md - Setup guide
  - DEPLOYMENT.md - Multi-computer installation
  - TROUBLESHOOTING.md - Common issues and solutions
  - UPDATE_GUIDE.md - Software update procedures
  - QUICK_INSTALL_GUIDE.md - Quick reference

### Technical Details
- **Frontend**: React 18.2.0, Chart.js 4.5.1, React Router DOM 7.13.1
- **Backend**: Node.js, Express 4.18.2, MQTT.js 5.3.4, WebSocket (ws 8.16.0)
- **Database**: SQLite with better-sqlite3 12.6.2
- **Desktop**: Electron 28.1.0
- **Build**: Vite 5.0.12 with optimized chunking

### Security
- Environment-based configuration (.env files)
- Credentials excluded from version control
- TLS/SSL for MQTT connections
- Localhost-only API access by default

### Performance
- Optimized Vite build (4.47s build time)
- Smart chunk splitting (react-vendor, chart-vendor)
- esbuild minification for faster builds
- Efficient database indexing
- CSS code splitting

---

## Version History Format

### Changed
- Updates to existing features

### Added
- New features

### Fixed  
- Bug fixes

### Removed
- Removed features

### Security
- Security-related changes

### Deprecated
- Features that will be removed in future versions

---

## Upgrade Instructions

See [UPDATE_GUIDE.md](UPDATE_GUIDE.md) for detailed update procedures.

### From 1.0.0 to Future Versions:

When a new version is released:
1. Check this CHANGELOG for breaking changes
2. Backup your database: `bridge-server\sensor_data.db`
3. Download the update package
4. Follow instructions in UPDATE_GUIDE.md
5. Run any required database migrations

---

## Support

- **Issues**: Check TROUBLESHOOTING.md first
- **Updates**: See UPDATE_GUIDE.md
- **Installation**: See DEPLOYMENT.md for multi-computer setup

---

**Legend:**
- `[Unreleased]` - Changes in development, not yet released
- `[X.Y.Z]` - Released version (MAJOR.MINOR.PATCH)
- `YYYY-MM-DD` - Release date

**Versioning:**
- **MAJOR** (X.0.0) - Breaking changes, major features
- **MINOR** (1.X.0) - New features, backward compatible
- **PATCH** (1.0.X) - Bug fixes, minor improvements
