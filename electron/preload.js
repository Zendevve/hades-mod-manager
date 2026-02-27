const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),

  // Game path
  selectGamePath: () => ipcRenderer.invoke('select-game-path'),
  autoDetectGame: () => ipcRenderer.invoke('auto-detect-game'),

  // Mod management
  scanMods: () => ipcRenderer.invoke('scan-mods'),
  toggleMod: (modName, enabled) => ipcRenderer.invoke('toggle-mod', modName, enabled),

  // Import / Restore
  runImport: () => ipcRenderer.invoke('run-import'),
  runRestore: () => ipcRenderer.invoke('run-restore'),

  // Log streaming
  onImportLog: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('import-log', handler)
    return () => ipcRenderer.removeListener('import-log', handler)
  },
})
