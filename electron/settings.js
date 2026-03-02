import fs from 'fs'
import path from 'path'

const settingsPath = path.join(
  process.env.APPDATA || path.join(process.env.HOME || '', '.config'),
  'hades-mod-manager',
  'settings.json'
)

let cache = null
let cacheMtime = null

function load() {
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (fs.existsSync(settingsPath)) {
      const stats = fs.statSync(settingsPath)
      // Check if cache is stale (file modified externally or never loaded)
      if (cache && cacheMtime === stats.mtimeMs) {
        return cache
      }
      cache = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      cacheMtime = stats.mtimeMs
    } else {
      cache = {}
      cacheMtime = null
    }
  } catch (err) {
    console.error('Failed to parse settings file:', err)
    // Backup the corrupted settings file
    try {
      const backupPath = `${settingsPath}.backup.${Date.now()}`
      fs.copyFileSync(settingsPath, backupPath)
      console.error(`Corrupted settings file backed up to: ${backupPath}`)
    } catch (backupErr) {
      console.error('Failed to backup corrupted settings file:', backupErr)
    }
    cache = {}
    cacheMtime = null
  }
  return cache
}

function save() {
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    // Atomic write: write to temp file, then rename
    const tempPath = `${settingsPath}.tmp`
    fs.writeFileSync(tempPath, JSON.stringify(cache, null, 2), 'utf-8')
    fs.renameSync(tempPath, settingsPath)
    // Update cacheMtime to match the newly written file
    const stats = fs.statSync(settingsPath)
    cacheMtime = stats.mtimeMs
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

export function get(key, defaultValue) {
  const data = load()
  return data[key] !== undefined ? data[key] : defaultValue
}

export function set(key, value) {
  const data = load()
  data[key] = value
  save()
}
