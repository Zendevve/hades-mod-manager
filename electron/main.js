import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { detectPython, scanMods, toggleMod, ensureImporter, runImporter, runRestore, downloadMod, installLocalMod } from './modEngine.js'
import { get as getSetting, set as setSetting } from './settings.js'

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

ipcMain.handle('get-settings', () => {
  return {
    gamePath: getSetting('gamePath', ''),
    pythonPath: detectPython(),
  }
})

ipcMain.handle('select-game-path', async () => {
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

ipcMain.handle('auto-detect-game', () => {
  const commonPaths = [
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Hades\\Content',
    'C:\\Program Files\\Steam\\steamapps\\common\\Hades\\Content',
    'D:\\SteamLibrary\\steamapps\\common\\Hades\\Content',
    'E:\\SteamLibrary\\steamapps\\common\\Hades\\Content',
    'C:\\Program Files\\Epic Games\\Hades\\Content',
    path.join(process.env.HOME || process.env.USERPROFILE || '', 'Library/Application Support/Steam/steamapps/common/Hades/Content'),
  ]

  for (const p of commonPaths) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'Scripts'))) {
      setSetting('gamePath', p)
      return { success: true, path: p }
    }
  }
  return { success: false }
})

ipcMain.handle('scan-mods', async () => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    const mods = await scanMods(gamePath)
    return { success: true, mods }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('toggle-mod', async (_, modName, enabled) => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    await toggleMod(gamePath, modName, enabled)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('run-import', async () => {
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

ipcMain.handle('run-restore', async () => {
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

ipcMain.handle('install-mod-from-url', async (_, modUrl) => {
  const gamePath = getSetting('gamePath', '')
  if (!gamePath) return { success: false, error: 'No game path set.' }

  try {
    const result = await downloadMod(gamePath, modUrl, mainWindow.webContents)
    return result
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('install-local-mod', async (_, srcModName) => {
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
