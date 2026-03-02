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

// ─── Mod Installation ────────────────────────────────────────

import https from 'https'
import http from 'http'
import AdmZip from 'adm-zip'
import os from 'os'

export async function downloadMod(contentPath, modUrl, webContents) {
  const modsDir = path.join(contentPath, 'Mods')
  if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true })
  }

  const tempFilePath = path.join(os.tmpdir(), `hades_mod_${Date.now()}.zip`)

  try {
    webContents.send('download-status', { status: 'Downloading...', progress: 0 })

    await new Promise((resolve, reject) => {
      const client = modUrl.startsWith('https') ? https : http
      client.get(modUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Handle redirect
          downloadMod(contentPath, res.headers.location, webContents).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: ${res.statusCode} ${res.statusMessage}`))
          return
        }

        const totalLength = parseInt(res.headers['content-length'] || '0', 10)
        let downloadedLength = 0

        const fileStream = fs.createWriteStream(tempFilePath)
        res.pipe(fileStream)

        res.on('data', (chunk) => {
          downloadedLength += chunk.length
          if (totalLength > 0) {
            const progress = Math.round((downloadedLength / totalLength) * 100)
            webContents.send('download-status', { status: `Downloading... ${progress}%`, progress })
          } else {
            webContents.send('download-status', { status: `Downloading... ${Math.round(downloadedLength / 1024 / 1024)}MB`, progress: -1 })
          }
        })

        fileStream.on('finish', () => {
          fileStream.close()
          resolve()
        })
      }).on('error', (err) => {
        reject(err)
      })
    })

    webContents.send('download-status', { status: 'Extracting...', progress: 100 })

    const zip = new AdmZip(tempFilePath)
    const zipEntries = zip.getEntries()

    // Find the directory containing modfile.txt
    let modfileEntry = zipEntries.find(e => e.entryName.toLowerCase().endsWith('modfile.txt'))
    if (!modfileEntry) {
      throw new Error('No modfile.txt found in the downloaded archive. This might not be a valid Hades 1 mod.')
    }

    const modRootDir = modfileEntry.entryName.substring(0, modfileEntry.entryName.length - 'modfile.txt'.length)

    // Guess the mod name from the root directory or fallback to a timestamp
    let modName = modRootDir.split('/').filter(Boolean).pop()
    if (!modName || modName === '.' || modName === '') {
      modName = `DownloadedMod_${Date.now()}`
    }

    const outputDir = path.join(modsDir, modName)

    // Extract everything that is under the modRootDir
    zipEntries.forEach(entry => {
      if (entry.entryName.startsWith(modRootDir)) {
        const relativePath = entry.entryName.substring(modRootDir.length);
        // Ignore directory entries, extractAllTo is better but we need to strip prefix
        if (!entry.isDirectory && relativePath) {
          const destPath = path.join(outputDir, relativePath);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, entry.getData());
        }
      }
    })

    webContents.send('download-status', { status: 'Installation Complete!', progress: 100 })
    return { success: true, modName }

  } finally {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath)
      } catch (e) {
        console.error('Failed to cleanup temp file:', e)
      }
    }
  }
}

export async function installLocalMod(contentPath, srcModName) {
  const modsDir = path.join(contentPath, 'Mods')
  if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true })
  }

  const srcPath = path.resolve(__dirname, `../../SGG-Mod-Format/${srcModName}`)
  const destPath = path.join(modsDir, srcModName)

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Bundled mod ${srcModName} not found at ${srcPath}`)
  }

  copyDirSync(srcPath, destPath)
  return { success: true, modName: srcModName }
}

