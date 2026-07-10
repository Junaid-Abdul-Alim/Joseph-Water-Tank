const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');
const packageInfo = require('../package.json');

let mainWindow;
let bridgeServerProcess;

// Suppress SSL handshake error messages from Chromium/Electron console
// These are harmless retry attempts and don't affect functionality
if (process.env.NODE_ENV === 'development') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  app.commandLine.appendSwitch('ignore-certificate-errors');
}
app.commandLine.appendSwitch('log-level', '3'); // Suppress most warnings

const updateConfig = packageInfo.githubRelease || {};
const UPDATE_USER_AGENT = 'WaterQualityMonitorUpdater/1.0';

// Enable hot reload for development
try {
  require('electron-reloader')(module);
} catch (_) {}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: false,
    title: 'Water Quality Monitor'
  });

  // Load the app
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start the bridge server
function startBridgeServer() {
  const bridgeServerPath = path.join(__dirname, '../bridge-server/server.js');
  const bridgeDataDir = path.join(app.getPath('userData'), 'bridge-server');
  const bridgeEnvPath = path.join(bridgeDataDir, '.env');

  fs.mkdirSync(bridgeDataDir, { recursive: true });
  ensureBridgeConfig(bridgeDataDir, bridgeEnvPath);

  const command = app.isPackaged ? process.execPath : 'node';
  const env = {
    ...process.env,
    BRIDGE_DATA_DIR: bridgeDataDir,
    BRIDGE_ENV_PATH: bridgeEnvPath
  };

  if (app.isPackaged) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  bridgeServerProcess = spawn(command, [bridgeServerPath], {
    stdio: 'inherit',
    cwd: bridgeDataDir,
    env
  });

  bridgeServerProcess.on('error', (err) => {
    console.error('Failed to start bridge server:', err);
  });

  bridgeServerProcess.on('exit', (code) => {
    console.log(`Bridge server exited with code ${code}`);
  });
}

function ensureBridgeConfig(bridgeDataDir, bridgeEnvPath) {
  const externalConfigDir = app.isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '..');
  const candidates = [
    path.join(externalConfigDir, 'bridge-server', '.env'),
    path.join(externalConfigDir, 'bridge-server', '.env.example'),
    path.join(__dirname, '../bridge-server/.env'),
    path.join(__dirname, '../bridge-server/.env.example')
  ];

  const realConfigPath = candidates.find((candidate) => {
    return path.basename(candidate) === '.env' && hasRealBridgeConfig(candidate);
  });

  if (fs.existsSync(bridgeEnvPath)) {
    if (!realConfigPath || hasRealBridgeConfig(bridgeEnvPath)) {
      return;
    }

    fs.copyFileSync(realConfigPath, bridgeEnvPath);
    return;
  }

  const sourcePath = realConfigPath || candidates.find((candidate) => fs.existsSync(candidate));

  if (sourcePath) {
    fs.copyFileSync(sourcePath, bridgeEnvPath);
    return;
  }

  const envTemplate = [
    '# TTN MQTT Configuration',
    'TTN_MQTT_HOST=eu1.cloud.thethings.network',
    'TTN_MQTT_PORT=8883',
    'TTN_MQTT_USERNAME=your_username@ttn',
    'TTN_MQTT_PASSWORD=your_ttn_password_here',
    'TTN_MQTT_TOPIC=v3/your_username@ttn/devices/+/up',
    '',
    '# Server Ports',
    'HTTP_PORT=3333',
    'WS_PORT=3334',
    ''
  ].join('\n');

  fs.writeFileSync(bridgeEnvPath, envTemplate, 'utf8');
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseEnvValue(content, key) {
  const line = content
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));

  if (!line) {
    return '';
  }

  return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
}

function hasConfiguredValue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return Boolean(normalized) && !normalized.includes('your_') && !normalized.includes('your-');
}

function hasRealBridgeConfig(filePath) {
  const content = readTextFile(filePath);
  if (!content) {
    return false;
  }

  return [
    'TTN_MQTT_USERNAME',
    'TTN_MQTT_PASSWORD',
    'TTN_MQTT_TOPIC'
  ].every((key) => hasConfiguredValue(parseEnvValue(content, key)));
}

function normalizeVersion(version) {
  return String(version || '')
    .trim()
    .replace(/^[^\d]*/, '')
    .split(/[+-]/)[0];
}

function compareVersions(left, right) {
  const leftParts = normalizeVersion(left).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = normalizeVersion(right).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length, 3);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;

    if (leftValue > rightValue) {
      return 1;
    }

    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
}

function requestJson(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': UPDATE_USER_AGENT
      }
    }, (response) => {
      const { statusCode, headers } = response;

      if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
        response.resume();
        if (redirectCount >= 5) {
          reject(new Error('Too many redirects while checking for updates'));
          return;
        }

        resolve(requestJson(new URL(headers.location, url).toString(), redirectCount + 1));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');

        if (statusCode < 200 || statusCode >= 300) {
          const error = new Error(`GitHub returned HTTP ${statusCode}`);
          error.statusCode = statusCode;
          error.body = body;
          reject(error);
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('GitHub update response was not valid JSON'));
        }
      });
    });

    request.setTimeout(30000, () => {
      request.destroy(new Error('GitHub update check timed out'));
    });
    request.on('error', reject);
  });
}

function emitUpdateProgress(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updates:progress', payload);
  }
}

function downloadFile(url, destinationPath, onProgress, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': UPDATE_USER_AGENT
      }
    }, (response) => {
      const { statusCode, headers } = response;

      if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
        response.resume();
        if (redirectCount >= 5) {
          reject(new Error('Too many redirects while downloading update'));
          return;
        }

        resolve(downloadFile(new URL(headers.location, url).toString(), destinationPath, onProgress, redirectCount + 1));
        return;
      }

      if (statusCode < 200 || statusCode >= 300) {
        response.resume();
        reject(new Error(`Update download returned HTTP ${statusCode}`));
        return;
      }

      const file = fs.createWriteStream(destinationPath);
      const totalBytes = Number.parseInt(headers['content-length'], 10) || 0;
      let downloadedBytes = 0;
      let lastPercent = -1;

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;

        if (!onProgress || !totalBytes) {
          return;
        }

        const percent = Math.max(0, Math.min(100, Math.floor((downloadedBytes / totalBytes) * 100)));
        if (percent !== lastPercent) {
          lastPercent = percent;
          onProgress({
            stage: 'download',
            percent,
            downloadedBytes,
            totalBytes,
            message: `Downloading update: ${percent}%`
          });
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(resolve);
      });

      file.on('error', (error) => {
        fs.unlink(destinationPath, () => reject(error));
      });
    });

    request.setTimeout(5 * 60 * 1000, () => {
      request.destroy(new Error('Update download timed out'));
    });
    request.on('error', reject);
  });
}

function getUpdaterScriptPath() {
  const executableDir = app.isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '..');
  const candidates = [
    path.join(executableDir, 'tools', 'apply-portable-update.ps1'),
    process.resourcesPath ? path.join(process.resourcesPath, 'tools', 'apply-portable-update.ps1') : null,
    path.join(__dirname, '../tools/apply-portable-update.ps1')
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function checkForUpdates() {
  const { owner, repo, assetName = 'WaterQualityMonitor-CollegePortable.zip' } = updateConfig;
  const currentVersion = app.getVersion();

  if (!owner || !repo) {
    return {
      success: false,
      configured: false,
      currentVersion,
      message: 'GitHub update repository is not configured.'
    };
  }

  try {
    const release = await requestJson(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
    const latestVersion = normalizeVersion(release.tag_name || release.name);
    const asset = (release.assets || []).find((item) => item.name === assetName)
      || (release.assets || []).find((item) => /\.zip$/i.test(item.name));

    if (!asset) {
      return {
        success: false,
        configured: true,
        currentVersion,
        latestVersion,
        releaseUrl: release.html_url,
        message: `Latest GitHub Release does not contain ${assetName}.`
      };
    }

    const available = compareVersions(latestVersion, currentVersion) > 0;

    return {
      success: true,
      configured: true,
      available,
      currentVersion,
      latestVersion,
      releaseName: release.name || release.tag_name,
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
      assetName: asset.name,
      assetSize: asset.size,
      downloadUrl: asset.browser_download_url,
      message: available
        ? `Update ${latestVersion} is available.`
        : `You are on the latest version (${currentVersion}).`
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        success: false,
        configured: true,
        currentVersion,
        message: 'No GitHub Release was found, or the repository is not reachable from this computer.'
      };
    }

    return {
      success: false,
      configured: true,
      currentVersion,
      message: error.message
    };
  }
}

async function installLatestUpdate() {
  if (!app.isPackaged) {
    return {
      success: false,
      message: 'Update install is available only in the packaged desktop app.'
    };
  }

  const update = await checkForUpdates();
  if (!update.success || !update.available || !update.downloadUrl) {
    return {
      success: false,
      message: update.message || 'No update is available.'
    };
  }

  const updaterScriptPath = getUpdaterScriptPath();
  if (!updaterScriptPath) {
    return {
      success: false,
      message: 'Updater script was not found in this installation.'
    };
  }

  const safeVersion = normalizeVersion(update.latestVersion).replace(/[^\d.]/g, '') || 'latest';
  const downloadPath = path.join(app.getPath('temp'), `WaterQualityMonitor-${safeVersion}.zip`);

  emitUpdateProgress({
    stage: 'download',
    percent: 0,
    downloadedBytes: 0,
    totalBytes: update.assetSize || 0,
    message: 'Starting update download...'
  });

  await downloadFile(update.downloadUrl, downloadPath, emitUpdateProgress);

  emitUpdateProgress({
    stage: 'install',
    percent: 100,
    downloadedBytes: update.assetSize || 0,
    totalBytes: update.assetSize || 0,
    message: 'Download complete. Installing files and restarting...'
  });

  const installDir = path.dirname(process.execPath);
  const updaterProcess = spawn('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    updaterScriptPath,
    '-PackagePath',
    downloadPath,
    '-InstallDir',
    installDir,
    '-StartDelaySeconds',
    '2',
    '-Restart'
  ], {
    detached: true,
    stdio: 'ignore'
  });

  updaterProcess.unref();

  setTimeout(() => {
    if (bridgeServerProcess) {
      bridgeServerProcess.kill();
    }
    app.quit();
  }, 500);

  return {
    success: true,
    message: `Update ${update.latestVersion} downloaded. The app will restart after updating.`
  };
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Start the bridge server first
  startBridgeServer();
  
  // Wait a bit for the server to start, then create window
  setTimeout(createWindow, 2000);

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Kill bridge server process
  if (bridgeServerProcess) {
    bridgeServerProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up on app quit
app.on('quit', () => {
  if (bridgeServerProcess) {
    bridgeServerProcess.kill();
  }
});

// Handle any IPC messages if needed
ipcMain.on('app-info', (event) => {
  event.reply('app-info-response', {
    version: app.getVersion(),
    name: app.getName()
  });
});

ipcMain.handle('updates:check', async () => checkForUpdates());
ipcMain.handle('updates:install', async () => installLatestUpdate());
