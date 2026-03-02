import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { detectPython, scanMods, toggleMod, ensureImporter, runImporter, runRestore, downloadMod, installLocalMod } from './modEngine.js'
import { get as getSetting, set as setSetting } from './settings.js'
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
} from './ipcChannels.js'

// ─── Default Game Detection Paths ────────────────────────────
// These are the default paths checked when auto-detecting the game.
// Users can add custom paths via settings which will be checked first.
const DEFAULT_GAME_PATHS = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Hades\\Content',
  'C:\\Program Files\\Steam\\steamapps\\common\\Hades\\Content',
  'D:\\SteamLibrary\\steamapps\\common\\Hades\\Content',
  'E:\\SteamLibrary\\steamapps\\common\\Hades\\Content',
  'C:\\Program Files\\Epic Games\\Hades\\Content',
  path.join(process.env.HOME || process.env.USERPROFILE || '', 'Library/Application Support/Steam/steamapps/common/Hades/Content'),
]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null

function createWindow() {
  const bounds = getSetting('windowBounds', {
    width: 1100,
    height: 750,
  })

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0d0d',
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Save window bounds on resize/move
  const saveBounds = () => {
    if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
      setSetting('windowBounds', mainWindow.getBounds())
    }
  }
  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

// ─── IPC Handlers ────────────────────────────────────────────

ipcMain.handle(GET_SETTINGS, () => {
  return {
    gamePath: getSetting('gamePath', ''),
    pythonPath: detectPython(),
  }
})

// Refresh Python detection on demand (for when Python is installed after app starts)
ipcMain.handle(REFRESH_PYTHON, () => {
  const pythonInfo = detectPython()
  return pythonInfo
})

// Get user's custom game detection paths
ipcMain.handle(GET_CUSTOM_PATHS, () => {
  return getSetting('customGamePaths', [])
})

// Add a custom game detection path
ipcMain.handle(ADD_CUSTOM_PATH, (_, customPath) => {
  try {
    const customPaths = getSetting('customGamePaths', [])
    if (!customPaths.includes(customPath)) {
      customPaths.push(customPath)
      setSetting('customGamePaths', customPaths)
      return { success: true, paths: customPaths }
    }
    return { success: true, paths: customPaths, message: 'Path already exists' }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Remove a custom game detection path
ipcMain.handle(REMOVE_CUSTOM_PATH, (_, customPath) => {
  try {
    const customPaths = getSetting('customGamePaths', [])
    const filtered = customPaths.filter(p => p !== customPath)
    setSetting('customGamePaths', filtered)
    return { success: true, paths: filtered }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle(SELECT_GAME_PATH, async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Hades Content Folder',
    properties: ['openDirectory'],
    defaultPath: getSetting('gamePath', ''),
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    const modsDir = path.join(selectedPath, 'Mods')
    const scriptsDir = path.join(selectedPath, 'Scripts')

    if (fs.existsSync(scriptsDir)) {
      setSetting('gamePath', selectedPath)
      if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir, { recursive: true })
      }
      return { success: true, path: selectedPath }
    } else {
      return { success: false, error: 'This does not appear to be a valid Hades Content folder (no Scripts/ directory found).' }
    }
  }
  return { success: false, error: 'No folder selected.' }
})

ipcMain.handle(AUTO_DETECT_GAME, () => {
  // Combine user custom paths (checked first) with default paths
  const customPaths = getSetting('customGamePaths', [])
  const allPaths = [...customPaths, ...DEFAULT_GAME_PATHS]

  for (const p of allPaths) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'Scripts'))) {
      setSetting('gamePath', p)
      return { success: true, path: p }
    }
  }
  return { success: false, error: 'Game not found in any configured paths' }
})

ipcMain.handle(SCAN_MODS, async () => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    const mods = await scanMods(gamePath)
    return { success: true, mods }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle(TOGGLE_MOD, async (_, modName, enabled) => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    await toggleMod(gamePath, modName, enabled)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle(RUN_IMPORT, async () => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    ensureImporter(gamePath)
    const result = await runImporter(gamePath, mainWindow.webContents)
    return { success: true, ...result }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle(RUN_RESTORE, async () => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    ensureImporter(gamePath)
    const result = await runRestore(gamePath, mainWindow.webContents)
    return { success: true, ...result }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle(INSTALL_MOD_FROM_URL, async (_, modUrl) => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    const result = await downloadMod(gamePath, modUrl, mainWindow.webContents)
    return result
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle(INSTALL_LOCAL_MOD, async (_, srcModName) => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    const result = await installLocalMod(gamePath, srcModName)
    return result
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// ─── App Lifecycle ───────────────────────────────────────────

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
