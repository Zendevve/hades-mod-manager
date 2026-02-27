import fs from 'fs'
import path from 'path'

const settingsPath = path.join(
  process.env.APPDATA || path.join(process.env.HOME || '', '.config'),
  'hades-mod-manager',
  'settings.json'
)

let cache = null

function load() {
  if (cache) return cache
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    if (fs.existsSync(settingsPath)) {
      cache = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    } else {
      cache = {}
    }
  } catch {
    cache = {}
  }
  return cache
}

function save() {
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(settingsPath, JSON.stringify(cache, null, 2), 'utf-8')
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
