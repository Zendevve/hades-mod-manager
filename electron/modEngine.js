import fs from 'fs'
import path from 'path'
import { execSync, spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Python Detection ────────────────────────────────────────

export function detectPython() {
  const candidates = ['python', 'python3', 'py']
  for (const cmd of candidates) {
    try {
      const version = execSync(`${cmd} --version`, {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim()
      if (version.toLowerCase().includes('python')) {
        return { found: true, command: cmd, version }
      }
    } catch {
      // try next
    }
  }
  return { found: false, command: null, version: null }
}

// ─── Modfile Parsing ─────────────────────────────────────────

export function parseModfile(modfilePath) {
  if (!fs.existsSync(modfilePath)) {
    return { targets: [], imports: [], priority: 100, raw: '' }
  }

  const raw = fs.readFileSync(modfilePath, 'utf-8')
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('::'))

  const targets = []
  const imports = []
  let priority = 100
  const importTypes = new Set()

  for (const line of lines) {
    const tokens = line.split(/\s+/)
    const cmd = tokens[0]

    if (cmd === 'To' && tokens[1]) {
      targets.push(tokens.slice(1).join(' ').replace(/"/g, ''))
    } else if (cmd === 'Import' && tokens[1]) {
      imports.push({ type: 'lua', file: tokens.slice(1).join(' ').replace(/"/g, '') })
      importTypes.add('Lua')
    } else if (cmd === 'Top' && tokens[1] === 'Import' && tokens[2]) {
      imports.push({ type: 'lua-top', file: tokens.slice(2).join(' ').replace(/"/g, '') })
      importTypes.add('Lua')
    } else if (cmd === 'XML' && tokens[1]) {
      imports.push({ type: 'xml', file: tokens.slice(1).join(' ').replace(/"/g, '') })
      importTypes.add('XML')
    } else if (cmd === 'SJSON' && tokens[1]) {
      imports.push({ type: 'sjson', file: tokens.slice(1).join(' ').replace(/"/g, '') })
      importTypes.add('SJSON')
    } else if (cmd === 'Replace' && tokens[1]) {
      imports.push({ type: 'replace', file: tokens.slice(1).join(' ').replace(/"/g, '') })
      importTypes.add('Replace')
    } else if (cmd === 'CSV' && tokens[1]) {
      imports.push({ type: 'csv', file: tokens.slice(1).join(' ').replace(/"/g, '') })
      importTypes.add('CSV')
    } else if (cmd === 'Load' && tokens[1] === 'Priority' && tokens[2]) {
      priority = parseInt(tokens[2], 10) || 100
    }
  }

  return {
    targets: targets.length > 0 ? targets : ['Scripts/RoomManager.lua'],
    imports,
    importTypes: Array.from(importTypes),
    priority,
    raw,
  }
}

// ─── Mod Scanning ────────────────────────────────────────────

export async function scanMods(contentPath) {
  const modsDir = path.join(contentPath, 'Mods')
  if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true })
    return []
  }

  const entries = fs.readdirSync(modsDir, { withFileTypes: true })
  const mods = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const dirName = entry.name
    const isDisabled = dirName.endsWith('.disabled')
    const modName = isDisabled ? dirName.slice(0, -'.disabled'.length) : dirName
    const modDir = path.join(modsDir, dirName)
    const modfilePath = path.join(modDir, 'modfile.txt')

    // Count files in mod directory
    let fileCount = 0
    try {
      const countFiles = (dir) => {
        const items = fs.readdirSync(dir, { withFileTypes: true })
        for (const item of items) {
          if (item.isFile()) fileCount++
          else if (item.isDirectory()) countFiles(path.join(dir, item.name))
        }
      }
      countFiles(modDir)
    } catch { /* ignore */ }

    const parsed = parseModfile(modfilePath)

    mods.push({
      name: modName,
      dirName,
      enabled: !isDisabled,
      path: modDir,
      hasModfile: fs.existsSync(modfilePath),
      fileCount,
      ...parsed,
    })
  }

  // Sort: enabled first, then alphabetical
  mods.sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return mods
}

// ─── Mod Toggle ──────────────────────────────────────────────

export async function toggleMod(contentPath, modName, enabled) {
  const modsDir = path.join(contentPath, 'Mods')
  const enabledPath = path.join(modsDir, modName)
  const disabledPath = path.join(modsDir, modName + '.disabled')

  if (enabled) {
    if (fs.existsSync(disabledPath)) {
      fs.renameSync(disabledPath, enabledPath)
    }
  } else {
    if (fs.existsSync(enabledPath)) {
      fs.renameSync(enabledPath, disabledPath)
    }
  }
}

// ─── Importer Management ────────────────────────────────────

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.name === '.git') continue
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export function ensureImporter(contentPath) {
  const importerSrc = path.resolve(__dirname, '../../SGG-Mod-Format/ModImporter/modimporter.py')
  const sjsonSrc = path.resolve(__dirname, '../../SGG-Mod-Format/ModImporter/sjson')
  const importerDest = path.join(contentPath, 'modimporter.py')
  const sjsonDest = path.join(contentPath, 'sjson')

  if (fs.existsSync(importerSrc)) {
    fs.copyFileSync(importerSrc, importerDest)
  }

  if (fs.existsSync(sjsonSrc) && !fs.existsSync(sjsonDest)) {
    copyDirSync(sjsonSrc, sjsonDest)
  }
}

// ─── Run Importer ────────────────────────────────────────────

export function runImporter(contentPath, webContents) {
  return runPythonScript(contentPath, ['modimporter.py', '--game', 'Hades'], webContents)
}

export function runRestore(contentPath, webContents) {
  return runPythonScript(contentPath, ['modimporter.py', '--game', 'Hades', '--clean'], webContents)
}

function runPythonScript(cwd, args, webContents) {
  return new Promise((resolve, reject) => {
    const python = detectPython()
    if (!python.found) {
      reject(new Error('Python not found. Please install Python and ensure it is on your PATH.'))
      return
    }

    const proc = spawn(python.command, args, {
      cwd,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      const text = data.toString()
      stdout += text
      webContents.send('import-log', { type: 'stdout', text })
    })

    proc.stderr.on('data', (data) => {
      const text = data.toString()
      stderr += text
      webContents.send('import-log', { type: 'stderr', text })
    })

    // Send empty input to handle "Press ENTER/RETURN to end program..."
    setTimeout(() => {
      try { proc.stdin.write('\n') } catch { }
    }, 500)

    proc.on('close', (code) => {
      try { proc.stdin.write('\n') } catch { }
      resolve({ code, stdout, stderr })
    })

    proc.on('error', (err) => {
      reject(err)
    })

    setTimeout(() => {
      try { proc.stdin.write('\n') } catch { }
      try { proc.kill() } catch { }
    }, 60000)
  })
}
