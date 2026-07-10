const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  getAppInfo: () => {
    return new Promise((resolve) => {
      ipcRenderer.send('app-info');
      ipcRenderer.once('app-info-response', (event, info) => {
        resolve(info);
      });
    });
  },
  updater: {
    check: () => ipcRenderer.invoke('updates:check'),
    install: () => ipcRenderer.invoke('updates:install')
  },
  platform: process.platform,
  isElectron: true
});
