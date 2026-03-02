import { contextBridge, ipcRenderer } from 'electron'
import {
  GET_SETTINGS,
  GET_CUSTOM_PATHS,
  ADD_CUSTOM_PATH,
  REMOVE_CUSTOM_PATH,
  REFRESH_PYTHON,
  SELECT_GAME_PATH,
  AUTO_DETECT_GAME,
  SCAN_MODS,
  TOGGLE_MOD,
  RUN_IMPORT,
  RUN_RESTORE,
  INSTALL_MOD_FROM_URL,
  INSTALL_LOCAL_MOD,
  IMPORT_LOG,
  DOWNLOAD_STATUS,
} from './ipcChannels.js'

contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke(GET_SETTINGS),
  getCustomPaths: () => ipcRenderer.invoke(GET_CUSTOM_PATHS),
  addCustomPath: (customPath) => ipcRenderer.invoke(ADD_CUSTOM_PATH, customPath),
  removeCustomPath: (customPath) => ipcRenderer.invoke(REMOVE_CUSTOM_PATH, customPath),

  // Python detection
  refreshPython: () => ipcRenderer.invoke(REFRESH_PYTHON),

  // Game path
  selectGamePath: () => ipcRenderer.invoke(SELECT_GAME_PATH),
  autoDetectGame: () => ipcRenderer.invoke(AUTO_DETECT_GAME),

  // Mod management
  scanMods: () => ipcRenderer.invoke(SCAN_MODS),
  toggleMod: (modName, enabled) => ipcRenderer.invoke(TOGGLE_MOD, modName, enabled),

  // Import / Restore
  runImport: () => ipcRenderer.invoke(RUN_IMPORT),
  runRestore: () => ipcRenderer.invoke(RUN_RESTORE),

  // Log streaming
  onImportLog: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on(IMPORT_LOG, handler)
    return () => ipcRenderer.removeListener(IMPORT_LOG, handler)
  },

  // Mod Downloading
  installModFromUrl: (url) => ipcRenderer.invoke(INSTALL_MOD_FROM_URL, url),
  installLocalMod: (modName) => ipcRenderer.invoke(INSTALL_LOCAL_MOD, modName),
  onDownloadStatus: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on(DOWNLOAD_STATUS, handler)
    return () => ipcRenderer.removeListener(DOWNLOAD_STATUS, handler)
  },
})
