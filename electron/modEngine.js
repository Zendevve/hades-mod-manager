import fs from 'fs'
import path from 'path'
import { execSync, spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { app } from 'electron'
import { IMPORT_LOG, DOWNLOAD_STATUS, PYTHON_INSTALL_STATUS } from './ipcChannels.js'
import https from 'https'
import http from 'http'
import AdmZip from 'adm-zip'
import os from 'os'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Error Handling Utilities ─────────────────────────────────

/**
 * Structured error object for consistent error handling
 * @param {string} message - Error message
 * @param {string} code - Error code for categorization
 * @param {Error} originalError - Original error object
 * @returns {Object} Structured error object
 */
function createError(message, code = 'UNKNOWN_ERROR', originalError = null) {
  return {
    success: false,
    error: message,
    code,
    details: originalError?.message || null,
    timestamp: new Date().toISOString()
  }
}

/**
 * Validates that a path exists and is accessible
 * @param {string} filePath - Path to validate
 * @param {string} type - 'file' or 'directory'
 * @returns {Object} Validation result
 */
function validatePath(filePath, type = 'any') {
  try {
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: `Path does not exist: ${filePath}` }
    }

    const stats = fs.statSync(filePath)

    if (type === 'file' && !stats.isFile()) {
      return { valid: false, error: `Path is not a file: ${filePath}` }
    }

    if (type === 'directory' && !stats.isDirectory()) {
      return { valid: false, error: `Path is not a directory: ${filePath}` }
    }

    return { valid: true, stats }
  } catch (err) {
    return { valid: false, error: `Failed to access path: ${err.message}` }
  }
}

/**
 * Safely executes a file operation with retry logic for Windows file locking
 * @param {Function} operation - The operation to execute
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise} Result of the operation
 */
async function safeFileOperation(operation, maxRetries = 3, delayMs = 100) {
  let lastError

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (err) {
      lastError = err

      // Check if it's a Windows file locking error
      const isLockError = err.code === 'EBUSY' ||
        err.code === 'EPERM' ||
        err.code === 'EACCES' ||
        (err.message && err.message.includes('resource busy'))

      if (isLockError && attempt < maxRetries - 1) {
        console.log(`File operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        delayMs *= 2 // Exponential backoff
      } else {
        throw err
      }
    }
  }

  throw lastError
}

// ─── Python Detection ────────────────────────────────────────

// Cache for embedded Python path
let embeddedPythonPath = null

/**
 * Safe logging helper that sends logs to webContents if available
 * @param {Object} webContents - Electron webContents for IPC
 * @param {string} message - Log message
 * @param {string} type - Log type ('info', 'error', 'success')
 */
function safeLog(webContents, message, type = 'info') {
  console.log(`[PythonInstall] ${message}`)
  if (webContents && !webContents.isDestroyed()) {
    try {
      webContents.send(PYTHON_INSTALL_STATUS, { status: message, type, progress: null })
    } catch (err) {
      console.error('Failed to send log:', err)
    }
  }
}

export function detectPython() {
  try {
    // First check if we have an embedded Python installed
    if (embeddedPythonPath && fs.existsSync(embeddedPythonPath)) {
      try {
        const version = execSync(`"${embeddedPythonPath}" --version`, {
          encoding: 'utf-8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim()
        return { found: true, command: embeddedPythonPath, version, success: true, isEmbedded: true }
      } catch {
        // Embedded Python not working, reset and try system
        embeddedPythonPath = null
      }
    }

    // Check for system Python
    const candidates = ['python', 'python3', 'py']
    for (const cmd of candidates) {
      try {
        const version = execSync(`${cmd} --version`, {
          encoding: 'utf-8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim()
        if (version.toLowerCase().includes('python')) {
          return { found: true, command: cmd, version, success: true, isEmbedded: false }
        }
      } catch {
        // try next
      }
    }
    return { found: false, command: null, version: null, success: false, error: 'Python not found on PATH' }
  } catch (err) {
    console.error('Error detecting Python:', err)
    return { found: false, command: null, version: null, success: false, error: err.message }
  }
}

/**
 * Downloads and installs Python embeddable package for Windows
 * Uses python-3.11.9-embed-amd64.zip (stable version)
 * @param {Object} webContents - Electron webContents for progress updates
 * @returns {Promise<Object>} Installation result
 */
export async function installPython(webContents) {
  const platform = os.platform()

  if (platform !== 'win32') {
    return {
      success: false,
      error: 'Automatic Python installation is currently only supported on Windows. Please install Python manually from python.org',
      platform
    }
  }

  try {
    safeLog(webContents, 'Starting Python installation...', 'info')

    // Get user data directory for storing embedded Python
    const userDataPath = app.getPath('userData')
    const pythonDir = path.join(userDataPath, 'python-embed')
    const pythonExePath = path.join(pythonDir, 'python.exe')

    // Check if already installed
    if (fs.existsSync(pythonExePath)) {
      safeLog(webContents, 'Found existing Python installation, verifying...', 'info')
      try {
        const version = execSync(`"${pythonExePath}" --version`, {
          encoding: 'utf-8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim()
        embeddedPythonPath = pythonExePath
        safeLog(webContents, `Python verified: ${version}`, 'success')
        return { success: true, path: pythonExePath, version, isEmbedded: true }
      } catch (err) {
        safeLog(webContents, 'Existing Python verification failed, reinstalling...', 'info')
        // Continue with reinstallation
      }
    }

    // Python version to download (3.11.9 - stable and widely compatible)
    const pythonVersion = '3.11.9'
    const zipFileName = `python-${pythonVersion}-embed-amd64.zip`
    const downloadUrl = `https://www.python.org/ftp/python/${pythonVersion}/${zipFileName}`
    const tempZipPath = path.join(os.tmpdir(), zipFileName)

    safeLog(webContents, `Downloading Python ${pythonVersion}...`, 'info')

    // Download Python embeddable package
    await new Promise((resolve, reject) => {
      const request = https.get(downloadUrl, { timeout: 120000 }, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
          const redirectUrl = res.headers.location
          if (!redirectUrl) {
            reject(new Error('Redirect received but no Location header'))
            return
          }
          safeLog(webContents, 'Following redirect...', 'info')
          // Use http for the redirect if needed
          const client = redirectUrl.startsWith('https') ? https : http
          client.get(redirectUrl, { timeout: 120000 }, (redirectRes) => {
            handleDownloadResponse(redirectRes, tempZipPath, webContents, resolve, reject)
          }).on('error', reject)
          return
        }

        handleDownloadResponse(res, tempZipPath, webContents, resolve, reject)
      })

      request.on('error', (err) => {
        reject(new Error(`Download request failed: ${err.message}`))
      })

      request.on('timeout', () => {
        request.destroy()
        reject(new Error('Download timed out after 120 seconds'))
      })
    })

    safeLog(webContents, 'Download complete, extracting...', 'info')

    // Extract the ZIP file
    try {
      // Ensure directory exists
      if (!fs.existsSync(pythonDir)) {
        fs.mkdirSync(pythonDir, { recursive: true })
      }

      const zip = new AdmZip(tempZipPath)
      zip.extractAllTo(pythonDir, true)
      safeLog(webContents, 'Extraction complete', 'success')
    } catch (err) {
      throw new Error(`Failed to extract Python: ${err.message}`)
    } finally {
      // Cleanup temp file
      try {
        if (fs.existsSync(tempZipPath)) {
          fs.unlinkSync(tempZipPath)
        }
      } catch (cleanupErr) {
        console.warn('Failed to cleanup temp file:', cleanupErr)
      }
    }

    // Verify the installation
    safeLog(webContents, 'Verifying installation...', 'info')

    if (!fs.existsSync(pythonExePath)) {
      throw new Error('Python executable not found after extraction')
    }

    // Create python311._pth file to enable site-packages (needed for pip compatibility)
    const pthFile = path.join(pythonDir, 'python311._pth')
    if (fs.existsSync(pthFile)) {
      let pthContent = fs.readFileSync(pthFile, 'utf-8')
      // Uncomment import site line to enable site-packages
      pthContent = pthContent.replace('#import site', 'import site')
      fs.writeFileSync(pthFile, pthContent)
    }

    // Test the installation
    const version = execSync(`"${pythonExePath}" --version`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()

    // Cache the path for future use
    embeddedPythonPath = pythonExePath

    safeLog(webContents, `Python ${pythonVersion} installed successfully!`, 'success')

    return {
      success: true,
      path: pythonExePath,
      version,
      isEmbedded: true
    }

  } catch (err) {
    console.error('Python installation failed:', err)
    safeLog(webContents, `Installation failed: ${err.message}`, 'error')
    return {
      success: false,
      error: err.message,
      platform
    }
  }
}

/**
 * Helper function to handle HTTP download response
 */
function handleDownloadResponse(res, tempPath, webContents, resolve, reject) {
  if (res.statusCode !== 200) {
    reject(new Error(`Download failed: ${res.statusCode} ${res.statusMessage}`))
    return
  }

  const totalLength = parseInt(res.headers['content-length'] || '0', 10)
  let downloadedLength = 0
  let lastProgressUpdate = 0

  const fileStream = fs.createWriteStream(tempPath)
  res.pipe(fileStream)

  res.on('data', (chunk) => {
    downloadedLength += chunk.length
    if (totalLength > 0) {
      const progress = Math.round((downloadedLength / totalLength) * 100)
      // Update progress every 5% to avoid spamming
      if (progress >= lastProgressUpdate + 5 || progress === 100) {
        lastProgressUpdate = progress
        safeLog(webContents, `Downloading Python... ${progress}%`, 'info')
        if (webContents && !webContents.isDestroyed()) {
          webContents.send(PYTHON_INSTALL_STATUS, {
            status: `Downloading Python... ${progress}%`,
            type: 'info',
            progress
          })
        }
      }
    } else {
      const mb = Math.round(downloadedLength / 1024 / 1024 * 10) / 10
      safeLog(webContents, `Downloading Python... ${mb}MB`, 'info')
    }
  })

  fileStream.on('finish', () => {
    fileStream.close()
    resolve()
  })

  fileStream.on('error', (err) => {
    fs.unlink(tempPath, () => { })
    reject(new Error(`Failed to write download: ${err.message}`))
  })
}

// ─── Modfile Schema Validation ───────────────────────────────

/**
 * Valid modfile commands and their argument requirements
 * Each command specifies:
 * - minArgs: Minimum number of arguments required
 * - maxArgs: Maximum number of arguments (null = unlimited)
 * - type: The import type associated with this command
 */
const MODFILE_SCHEMA = {
  'To': { minArgs: 1, maxArgs: null, type: 'target', description: 'Target file path' },
  'Import': { minArgs: 1, maxArgs: null, type: 'lua', description: 'Import Lua file' },
  'Top': { minArgs: 2, maxArgs: null, type: 'lua-top', description: 'Top import (requires "Import" as second word)' },
  'XML': { minArgs: 1, maxArgs: null, type: 'xml', description: 'Import XML file' },
  'SJSON': { minArgs: 1, maxArgs: null, type: 'sjson', description: 'Import SJSON file' },
  'Replace': { minArgs: 1, maxArgs: null, type: 'replace', description: 'Replace file' },
  'CSV': { minArgs: 1, maxArgs: null, type: 'csv', description: 'Import CSV file' },
  'Load': { minArgs: 2, maxArgs: 2, type: 'priority', description: 'Load priority (requires "Priority" and a number)' },
}

/**
 * Validates a single modfile line against the schema
 * @param {string} line - The line to validate
 * @param {number} lineNumber - Line number for error reporting
 * @returns {Object} Validation result with any errors
 */
function validateModfileLine(line, lineNumber) {
  const tokens = line.split(/\s+/)
  const cmd = tokens[0]
  const args = tokens.slice(1)

  // Check if command exists in schema
  if (!MODFILE_SCHEMA[cmd]) {
    return {
      valid: false,
      error: `Line ${lineNumber}: Unknown command "${cmd}". Valid commands: ${Object.keys(MODFILE_SCHEMA).join(', ')}`
    }
  }

  const schema = MODFILE_SCHEMA[cmd]

  // Special validation for "Top Import" command
  if (cmd === 'Top') {
    if (args[0] !== 'Import') {
      return {
        valid: false,
        error: `Line ${lineNumber}: "Top" command must be followed by "Import"`
      }
    }
    if (args.length < 2) {
      return {
        valid: false,
        error: `Line ${lineNumber}: "Top Import" requires a file path`
      }
    }
  }

  // Special validation for "Load Priority" command
  if (cmd === 'Load') {
    if (args[0] !== 'Priority') {
      return {
        valid: false,
        error: `Line ${lineNumber}: "Load" command must be followed by "Priority"`
      }
    }
    if (args.length < 2 || isNaN(parseInt(args[1], 10))) {
      return {
        valid: false,
        error: `Line ${lineNumber}: "Load Priority" requires a valid number`
      }
    }
  }

  // Check argument count
  if (args.length < schema.minArgs) {
    return {
      valid: false,
      error: `Line ${lineNumber}: "${cmd}" requires at least ${schema.minArgs} argument(s), got ${args.length}`
    }
  }

  if (schema.maxArgs !== null && args.length > schema.maxArgs) {
    return {
      valid: false,
      error: `Line ${lineNumber}: "${cmd}" accepts at most ${schema.maxArgs} argument(s), got ${args.length}`
    }
  }

  return { valid: true }
}

// ─── Modfile Parsing ─────────────────────────────────────────

/**
 * Parses a modfile.txt and validates its contents against the SGG modfile schema
 * @param {string} modfilePath - Path to the modfile
 * @returns {Object} Parsed modfile data with validation results
 */
export function parseModfile(modfilePath) {
  const errors = []
  const warnings = []

  try {
    // Edge case: File doesn't exist - return defaults for optional modfile
    if (!fs.existsSync(modfilePath)) {
      return {
        targets: ['Scripts/RoomManager.lua'],
        imports: [],
        importTypes: [],
        priority: 100,
        raw: '',
        success: true,
        warnings: ['No modfile.txt found, using default target'],
        errors: []
      }
    }

    // Edge case: Check if file is readable
    let raw
    try {
      raw = fs.readFileSync(modfilePath, 'utf-8')
    } catch (readErr) {
      return {
        targets: [],
        imports: [],
        importTypes: [],
        priority: 100,
        raw: '',
        success: false,
        errors: [`Failed to read modfile: ${readErr.message}`],
        warnings: []
      }
    }

    // Edge case: Empty file
    if (!raw || raw.trim().length === 0) {
      return {
        targets: ['Scripts/RoomManager.lua'],
        imports: [],
        importTypes: [],
        priority: 100,
        raw: '',
        success: true,
        warnings: ['modfile.txt is empty, using default target'],
        errors: []
      }
    }

    // Parse lines, filtering out comments and empty lines
    const lines = raw.split('\n')
      .map((l, idx) => ({ line: l.trim(), lineNumber: idx + 1 }))
      .filter(({ line }) => line && !line.startsWith('::'))

    // Edge case: File contains only comments
    if (lines.length === 0) {
      return {
        targets: ['Scripts/RoomManager.lua'],
        imports: [],
        importTypes: [],
        priority: 100,
        raw,
        success: true,
        warnings: ['modfile.txt contains only comments, using default target'],
        errors: []
      }
    }

    const targets = []
    const imports = []
    let priority = 100
    const importTypes = new Set()

    for (const { line, lineNumber } of lines) {
      // Validate line against schema
      const validation = validateModfileLine(line, lineNumber)
      if (!validation.valid) {
        errors.push(validation.error)
        continue
      }

      const tokens = line.split(/\s+/)
      const cmd = tokens[0]

      try {
        if (cmd === 'To' && tokens[1]) {
          const targetPath = tokens.slice(1).join(' ').replace(/"/g, '')
          if (!targetPath) {
            warnings.push(`Line ${lineNumber}: Empty target path ignored`)
          } else {
            targets.push(targetPath)
          }
        } else if (cmd === 'Import' && tokens[1]) {
          const filePath = tokens.slice(1).join(' ').replace(/"/g, '')
          if (!filePath) {
            warnings.push(`Line ${lineNumber}: Empty import path ignored`)
          } else {
            imports.push({ type: 'lua', file: filePath })
            importTypes.add('Lua')
          }
        } else if (cmd === 'Top' && tokens[1] === 'Import' && tokens[2]) {
          const filePath = tokens.slice(2).join(' ').replace(/"/g, '')
          if (!filePath) {
            warnings.push(`Line ${lineNumber}: Empty top import path ignored`)
          } else {
            imports.push({ type: 'lua-top', file: filePath })
            importTypes.add('Lua')
          }
        } else if (cmd === 'XML' && tokens[1]) {
          const filePath = tokens.slice(1).join(' ').replace(/"/g, '')
          if (!filePath) {
            warnings.push(`Line ${lineNumber}: Empty XML path ignored`)
          } else {
            imports.push({ type: 'xml', file: filePath })
            importTypes.add('XML')
          }
        } else if (cmd === 'SJSON' && tokens[1]) {
          const filePath = tokens.slice(1).join(' ').replace(/"/g, '')
          if (!filePath) {
            warnings.push(`Line ${lineNumber}: Empty SJSON path ignored`)
          } else {
            imports.push({ type: 'sjson', file: filePath })
            importTypes.add('SJSON')
          }
        } else if (cmd === 'Replace' && tokens[1]) {
          const filePath = tokens.slice(1).join(' ').replace(/"/g, '')
          if (!filePath) {
            warnings.push(`Line ${lineNumber}: Empty replace path ignored`)
          } else {
            imports.push({ type: 'replace', file: filePath })
            importTypes.add('Replace')
          }
        } else if (cmd === 'CSV' && tokens[1]) {
          const filePath = tokens.slice(1).join(' ').replace(/"/g, '')
          if (!filePath) {
            warnings.push(`Line ${lineNumber}: Empty CSV path ignored`)
          } else {
            imports.push({ type: 'csv', file: filePath })
            importTypes.add('CSV')
          }
        } else if (cmd === 'Load' && tokens[1] === 'Priority' && tokens[2]) {
          const parsedPriority = parseInt(tokens[2], 10)
          if (isNaN(parsedPriority)) {
            warnings.push(`Line ${lineNumber}: Invalid priority value "${tokens[2]}", using default (100)`)
          } else if (parsedPriority < 0 || parsedPriority > 999999) {
            warnings.push(`Line ${lineNumber}: Priority ${parsedPriority} out of reasonable range, using default (100)`)
          } else {
            priority = parsedPriority
          }
        }
      } catch (parseErr) {
        errors.push(`Line ${lineNumber}: Failed to parse command - ${parseErr.message}`)
      }
    }

    // Warning: No targets specified - using default
    if (targets.length === 0) {
      warnings.push('No target files specified, using default: Scripts/RoomManager.lua')
    }

    // Warning: No imports specified
    if (imports.length === 0) {
      warnings.push('No imports specified in modfile')
    }

    const result = {
      targets: targets.length > 0 ? targets : ['Scripts/RoomManager.lua'],
      imports,
      importTypes: Array.from(importTypes),
      priority,
      raw,
      success: errors.length === 0,
      errors,
      warnings
    }

    return result
  } catch (err) {
    console.error('Error parsing modfile:', err)
    return {
      targets: [],
      imports: [],
      importTypes: [],
      priority: 100,
      raw: '',
      success: false,
      errors: [`Unexpected error parsing modfile: ${err.message}`],
      warnings: []
    }
  }
}

// ─── Mod Scanning ────────────────────────────────────────────

export async function scanMods(contentPath) {
  try {
    if (!contentPath) {
      return createError('Content path is required', 'INVALID_PATH')
    }

    const modsDir = path.join(contentPath, 'Mods')

    // Create Mods directory if it doesn't exist
    try {
      if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir, { recursive: true })
        return { success: true, mods: [] }
      }
    } catch (err) {
      return createError(`Failed to create Mods directory: ${err.message}`, 'DIR_CREATE_ERROR', err)
    }

    // Validate Mods directory
    const dirValidation = validatePath(modsDir, 'directory')
    if (!dirValidation.valid) {
      return createError(dirValidation.error, 'INVALID_DIRECTORY')
    }

    let entries
    try {
      entries = fs.readdirSync(modsDir, { withFileTypes: true })
    } catch (err) {
      return createError(`Failed to read Mods directory: ${err.message}`, 'DIR_READ_ERROR', err)
    }

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
      } catch (err) {
        console.warn(`Failed to count files in ${modDir}:`, err.message)
      }

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

    return { success: true, mods }
  } catch (err) {
    console.error('Error scanning mods:', err)
    return createError(`Failed to scan mods: ${err.message}`, 'SCAN_ERROR', err)
  }
}

// ─── Mod Toggle ──────────────────────────────────────────────

/**
 * Recursively copies a directory synchronously
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
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

/**
 * Recursively removes a directory synchronously
 * @param {string} dirPath - Directory to remove
 */
function removeDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) return

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      removeDirSync(fullPath)
    } else {
      fs.unlinkSync(fullPath)
    }
  }
  fs.rmdirSync(dirPath)
}

/**
 * Performs atomic directory rename using copy-then-delete strategy
 * Handles Windows file locking issues
 * @param {string} sourcePath - Source directory path
 * @param {string} targetPath - Target directory path
 * @returns {Promise<Object>} Result of the operation
 */
async function atomicDirectoryRename(sourcePath, targetPath) {
  const tempPath = path.join(os.tmpdir(), `mod_atomic_${Date.now()}_${path.basename(sourcePath)}`)

  try {
    // Step 1: Copy source to temp location first
    console.log(`Atomic rename: Copying ${sourcePath} to temp location ${tempPath}`)
    await safeFileOperation(async () => {
      copyDirSync(sourcePath, tempPath)
    }, 3, 100)

    // Step 2: Rename source to target (this is usually atomic on most filesystems)
    console.log(`Atomic rename: Moving ${sourcePath} to ${targetPath}`)
    try {
      await safeFileOperation(async () => {
        fs.renameSync(sourcePath, targetPath)
      }, 3, 100)
    } catch (renameErr) {
      // If rename fails (e.g., on Windows with locked files), try copy-delete strategy
      console.log('Direct rename failed, using copy-delete strategy...')

      // Copy to target
      await safeFileOperation(async () => {
        copyDirSync(tempPath, targetPath)
      }, 3, 100)

      // Remove source
      await safeFileOperation(async () => {
        removeDirSync(sourcePath)
      }, 5, 200)
    }

    // Step 3: Clean up temp
    try {
      if (fs.existsSync(tempPath)) {
        removeDirSync(tempPath)
      }
    } catch (cleanupErr) {
      console.warn('Failed to cleanup temp directory:', cleanupErr.message)
      // Non-fatal, continue
    }

    return { success: true }
  } catch (err) {
    // Rollback: try to restore from temp if target wasn't created
    try {
      if (!fs.existsSync(targetPath) && fs.existsSync(tempPath)) {
        console.log('Attempting rollback...')
        copyDirSync(tempPath, sourcePath)
      }
    } catch (rollbackErr) {
      console.error('Rollback failed:', rollbackErr.message)
    }

    // Cleanup temp
    try {
      if (fs.existsSync(tempPath)) {
        removeDirSync(tempPath)
      }
    } catch (cleanupErr) {
      console.warn('Failed to cleanup temp directory:', cleanupErr.message)
    }

    throw err
  }
}

export async function toggleMod(contentPath, modName, enabled) {
  try {
    if (!contentPath) {
      return createError('Content path is required', 'INVALID_PATH')
    }

    if (!modName) {
      return createError('Mod name is required', 'INVALID_MOD_NAME')
    }

    const modsDir = path.join(contentPath, 'Mods')
    const enabledPath = path.join(modsDir, modName)
    const disabledPath = path.join(modsDir, modName + '.disabled')

    // Validate Mods directory exists
    const dirValidation = validatePath(modsDir, 'directory')
    if (!dirValidation.valid) {
      return createError(`Mods directory not accessible: ${dirValidation.error}`, 'INVALID_DIRECTORY')
    }

    if (enabled) {
      // Enable mod: rename from .disabled to normal
      const disabledValidation = validatePath(disabledPath, 'directory')
      if (!disabledValidation.valid) {
        return createError(
          `Disabled mod not found: ${modName}.disabled`,
          'MOD_NOT_FOUND'
        )
      }

      // Check if target already exists
      if (fs.existsSync(enabledPath)) {
        return createError(
          `Cannot enable mod: ${modName} already exists (enabled)`,
          'MOD_ALREADY_EXISTS'
        )
      }

      try {
        await atomicDirectoryRename(disabledPath, enabledPath)
        console.log(`Successfully enabled mod: ${modName}`)
        return { success: true, modName, enabled: true }
      } catch (err) {
        console.error(`Failed to enable mod ${modName}:`, err)
        return createError(
          `Failed to enable mod "${modName}": ${err.message}. This may be due to file locking or permission issues.`,
          'TOGGLE_ERROR',
          err
        )
      }
    } else {
      // Disable mod: rename to .disabled
      const enabledValidation = validatePath(enabledPath, 'directory')
      if (!enabledValidation.valid) {
        return createError(
          `Enabled mod not found: ${modName}`,
          'MOD_NOT_FOUND'
        )
      }

      // Check if target already exists
      if (fs.existsSync(disabledPath)) {
        return createError(
          `Cannot disable mod: ${modName}.disabled already exists`,
          'MOD_ALREADY_EXISTS'
        )
      }

      try {
        await atomicDirectoryRename(enabledPath, disabledPath)
        console.log(`Successfully disabled mod: ${modName}`)
        return { success: true, modName, enabled: false }
      } catch (err) {
        console.error(`Failed to disable mod ${modName}:`, err)
        return createError(
          `Failed to disable mod "${modName}": ${err.message}. This may be due to file locking or permission issues.`,
          'TOGGLE_ERROR',
          err
        )
      }
    }
  } catch (err) {
    console.error('Unexpected error in toggleMod:', err)
    return createError(`Unexpected error toggling mod: ${err.message}`, 'UNEXPECTED_ERROR', err)
  }
}

// ─── Importer Management ────────────────────────────────────

export function ensureImporter(contentPath) {
  try {
    if (!contentPath) {
      console.error('ensureImporter: contentPath is required')
      return { success: false, error: 'Content path is required' }
    }

    const importerSrc = path.resolve(__dirname, '../../SGG-Mod-Format/ModImporter/modimporter.py')
    const sjsonSrc = path.resolve(__dirname, '../../SGG-Mod-Format/ModImporter/sjson')
    const importerDest = path.join(contentPath, 'modimporter.py')
    const sjsonDest = path.join(contentPath, 'sjson')

    // Validate source files exist
    const importerValidation = validatePath(importerSrc, 'file')
    if (!importerValidation.valid) {
      console.warn(`Importer source not found: ${importerSrc}`)
      return { success: false, error: `Importer source not found: ${importerSrc}` }
    }

    // Copy importer
    try {
      fs.copyFileSync(importerSrc, importerDest)
      console.log('modimporter.py copied successfully')
    } catch (err) {
      console.error('Failed to copy modimporter.py:', err)
      return { success: false, error: `Failed to copy importer: ${err.message}` }
    }

    // Copy sjson module if needed
    const sjsonValidation = validatePath(sjsonSrc, 'directory')
    if (sjsonValidation.valid && !fs.existsSync(sjsonDest)) {
      try {
        copyDirSync(sjsonSrc, sjsonDest)
        console.log('sjson module copied successfully')
      } catch (err) {
        console.error('Failed to copy sjson module:', err)
        return { success: false, error: `Failed to copy sjson module: ${err.message}` }
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error in ensureImporter:', err)
    return { success: false, error: err.message }
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
    try {
      // Validate inputs
      if (!cwd) {
        reject(new Error('Working directory (cwd) is required'))
        return
      }

      if (!webContents) {
        reject(new Error('WebContents is required for logging'))
        return
      }

      const python = detectPython()
      if (!python.found) {
        reject(new Error('Python not found. Please install Python and ensure it is on your PATH.'))
        return
      }

      // Validate working directory exists
      const dirValidation = validatePath(cwd, 'directory')
      if (!dirValidation.valid) {
        reject(new Error(`Working directory not accessible: ${dirValidation.error}`))
        return
      }

      const proc = spawn(python.command, args, {
        cwd,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''
      let hasExited = false

      proc.stdout.on('data', (data) => {
        try {
          const text = data.toString()
          stdout += text
          webContents.send(IMPORT_LOG, { type: 'stdout', text })
        } catch (err) {
          console.error('Error handling stdout:', err)
        }
      })

      proc.stderr.on('data', (data) => {
        try {
          const text = data.toString()
          stderr += text
          webContents.send(IMPORT_LOG, { type: 'stderr', text })
        } catch (err) {
          console.error('Error handling stderr:', err)
        }
      })

      // Send empty input to handle "Press ENTER/RETURN to end program..."
      setTimeout(() => {
        try {
          if (proc.stdin && !proc.stdin.destroyed) {
            proc.stdin.write('\n')
          }
        } catch { }
      }, 500)

      proc.on('close', (code) => {
        hasExited = true
        try {
          if (proc.stdin && !proc.stdin.destroyed) {
            proc.stdin.write('\n')
          }
        } catch { }

        if (code !== 0) {
          console.warn(`Python script exited with code ${code}`)
        }

        resolve({ code, stdout, stderr, success: code === 0 })
      })

      proc.on('error', (err) => {
        hasExited = true
        console.error('Python process error:', err)
        reject(new Error(`Failed to run Python script: ${err.message}`))
      })

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!hasExited) {
          console.warn('Python script timeout, forcing termination...')
          try {
            if (proc.stdin && !proc.stdin.destroyed) {
              proc.stdin.write('\n')
            }
          } catch { }

          try {
            proc.kill('SIGTERM')
            // Force kill after 5 more seconds if still running
            setTimeout(() => {
              try {
                proc.kill('SIGKILL')
              } catch { }
            }, 5000)
          } catch { }
        }
      }, 60000)
    } catch (err) {
      console.error('Unexpected error in runPythonScript:', err)
      reject(new Error(`Unexpected error: ${err.message}`))
    }
  })
}

// ─── Mod Installation ────────────────────────────────────────

// Allowed hostnames for SSRF protection (optional - remove or modify as needed)
const ALLOWED_HOSTNAMES = [
  'github.com',
  'raw.githubusercontent.com',
  'www.nexusmods.com',
  'nexusmods.com',
  'thunderstore.io',
  'gcdn.thunderstore.io',
]

/**
 * Validates URL to prevent SSRF attacks
 * @param {string} url - The URL to validate
 * @param {boolean} strictHostCheck - Whether to enforce hostname allowlist
 * @returns {URL} - The parsed URL object
 * @throws {Error} - If URL is invalid or not allowed
 */
export function validateUrl(url, strictHostCheck = false) {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required and must be a string')
  }

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`)
  }

  // Only allow HTTP and HTTPS protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(`URL protocol not allowed: ${parsedUrl.protocol}. Only HTTP and HTTPS are supported.`)
  }

  // Optional: Validate hostname against allowlist
  if (strictHostCheck) {
    const hostname = parsedUrl.hostname.toLowerCase()
    const isAllowed = ALLOWED_HOSTNAMES.some(allowed =>
      hostname === allowed || hostname.endsWith(`.${allowed}`)
    )
    if (!isAllowed) {
      throw new Error(`Hostname not in allowlist: ${parsedUrl.hostname}`)
    }
  }

  return parsedUrl
}

export async function downloadMod(contentPath, modUrl, webContents) {
  try {
    // Validate inputs
    if (!contentPath) {
      return createError('Content path is required', 'INVALID_PATH')
    }

    if (!modUrl) {
      return createError('Mod URL is required', 'INVALID_URL')
    }

    if (!webContents) {
      return createError('WebContents is required for progress updates', 'INVALID_CONTEXT')
    }

    // Validate URL to prevent SSRF attacks
    try {
      validateUrl(modUrl, false) // Set to true to enable strict hostname checking
    } catch (urlErr) {
      return createError(urlErr.message, 'INVALID_URL', urlErr)
    }

    const modsDir = path.join(contentPath, 'Mods')

    // Ensure Mods directory exists
    try {
      if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir, { recursive: true })
      }
    } catch (err) {
      return createError(`Failed to create Mods directory: ${err.message}`, 'DIR_CREATE_ERROR', err)
    }

    const tempFilePath = path.join(os.tmpdir(), `hades_mod_${Date.now()}.zip`)

    try {
      webContents.send(DOWNLOAD_STATUS, { status: 'Downloading...', progress: 0 })

      await new Promise((resolve, reject) => {
        const client = modUrl.startsWith('https') ? https : http

        const request = client.get(modUrl, { timeout: 30000 }, (res) => {
          // Handle redirects
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
            const redirectUrl = res.headers.location
            if (!redirectUrl) {
              reject(new Error('Redirect received but no Location header'))
              return
            }

            // Validate redirect URL
            try {
              validateUrl(redirectUrl, false)
            } catch (urlErr) {
              reject(new Error(`Invalid redirect URL: ${urlErr.message}`))
              return
            }

            // Recursive call with redirect URL
            return downloadMod(contentPath, redirectUrl, webContents).then(resolve).catch(reject)
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
              webContents.send(DOWNLOAD_STATUS, { status: `Downloading... ${progress}%`, progress })
            } else {
              const mb = Math.round(downloadedLength / 1024 / 1024 * 10) / 10
              webContents.send(DOWNLOAD_STATUS, { status: `Downloading... ${mb}MB`, progress: -1 })
            }
          })

          fileStream.on('finish', () => {
            fileStream.close()
            resolve()
          })

          fileStream.on('error', (err) => {
            fs.unlink(tempFilePath, () => { }) // Cleanup on error
            reject(new Error(`Failed to write download: ${err.message}`))
          })
        })

        request.on('error', (err) => {
          fs.unlink(tempFilePath, () => { }) // Cleanup on error
          reject(new Error(`Download request failed: ${err.message}`))
        })

        request.on('timeout', () => {
          request.destroy()
          fs.unlink(tempFilePath, () => { }) // Cleanup on timeout
          reject(new Error('Download timed out after 30 seconds'))
        })
      })

      webContents.send(DOWNLOAD_STATUS, { status: 'Extracting...', progress: 100 })

      // Validate temp file exists and has content
      const tempValidation = validatePath(tempFilePath, 'file')
      if (!tempValidation.valid) {
        return createError('Downloaded file not found or inaccessible', 'DOWNLOAD_ERROR')
      }

      if (tempValidation.stats.size === 0) {
        return createError('Downloaded file is empty', 'DOWNLOAD_ERROR')
      }

      let zip
      try {
        zip = new AdmZip(tempFilePath)
      } catch (err) {
        return createError(`Failed to read ZIP file: ${err.message}. The file may be corrupted.`, 'EXTRACTION_ERROR', err)
      }

      const zipEntries = zip.getEntries()

      if (!zipEntries || zipEntries.length === 0) {
        return createError('ZIP file is empty or contains no entries', 'EXTRACTION_ERROR')
      }

      // Find the directory containing modfile.txt
      const modfileEntry = zipEntries.find(e => e.entryName.toLowerCase().endsWith('modfile.txt'))
      if (!modfileEntry) {
        return createError(
          'No modfile.txt found in the downloaded archive. This might not be a valid Hades 1 mod.',
          'INVALID_MOD_FORMAT'
        )
      }

      const modRootDir = modfileEntry.entryName.substring(0, modfileEntry.entryName.length - 'modfile.txt'.length)

      // Guess the mod name from the root directory or fallback to a timestamp
      let modName = modRootDir.split('/').filter(Boolean).pop()
      if (!modName || modName === '.' || modName === '') {
        modName = `DownloadedMod_${Date.now()}`
      }

      const outputDir = path.join(modsDir, modName)

      // Check if mod already exists
      if (fs.existsSync(outputDir)) {
        return createError(
          `A mod named "${modName}" already exists. Please remove it first or rename the new mod.`,
          'MOD_ALREADY_EXISTS'
        )
      }

      // Extract everything that is under the modRootDir
      let extractedCount = 0
      zipEntries.forEach(entry => {
        if (entry.entryName.startsWith(modRootDir)) {
          const relativePath = entry.entryName.substring(modRootDir.length)
          // Ignore directory entries, extractAllTo is better but we need to strip prefix
          if (!entry.isDirectory && relativePath) {
            try {
              const destPath = path.join(outputDir, relativePath)
              fs.mkdirSync(path.dirname(destPath), { recursive: true })
              fs.writeFileSync(destPath, entry.getData())
              extractedCount++
            } catch (err) {
              console.warn(`Failed to extract file ${entry.entryName}:`, err.message)
            }
          }
        }
      })

      if (extractedCount === 0) {
        return createError('No files were extracted from the archive', 'EXTRACTION_ERROR')
      }

      console.log(`Successfully extracted ${extractedCount} files to ${outputDir}`)
      webContents.send(DOWNLOAD_STATUS, { status: 'Installation Complete!', progress: 100 })

      return { success: true, modName, extractedFiles: extractedCount }

    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath)
        } catch (e) {
          console.error('Failed to cleanup temp file:', e)
        }
      }
    }
  } catch (err) {
    console.error('Unexpected error in downloadMod:', err)
    return createError(`Download failed: ${err.message}`, 'DOWNLOAD_ERROR', err)
  }
}

export async function installLocalMod(contentPath, srcModName) {
  try {
    // Validate inputs
    if (!contentPath) {
      return createError('Content path is required', 'INVALID_PATH')
    }

    if (!srcModName) {
      return createError('Source mod name is required', 'INVALID_MOD_NAME')
    }

    const modsDir = path.join(contentPath, 'Mods')

    // Ensure Mods directory exists
    try {
      if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir, { recursive: true })
      }
    } catch (err) {
      return createError(`Failed to create Mods directory: ${err.message}`, 'DIR_CREATE_ERROR', err)
    }

    const srcPath = path.resolve(__dirname, `../../SGG-Mod-Format/${srcModName}`)
    const destPath = path.join(modsDir, srcModName)

    // Validate source exists
    const srcValidation = validatePath(srcPath, 'directory')
    if (!srcValidation.valid) {
      return createError(`Bundled mod "${srcModName}" not found: ${srcValidation.error}`, 'MOD_NOT_FOUND')
    }

    // Check if destination already exists
    if (fs.existsSync(destPath)) {
      return createError(
        `Mod "${srcModName}" is already installed. Remove it first to reinstall.`,
        'MOD_ALREADY_EXISTS'
      )
    }

    try {
      await safeFileOperation(async () => {
        copyDirSync(srcPath, destPath)
      }, 3, 100)

      console.log(`Successfully installed local mod: ${srcModName}`)
      return { success: true, modName: srcModName }
    } catch (err) {
      // Cleanup on failure
      try {
        if (fs.existsSync(destPath)) {
          removeDirSync(destPath)
        }
      } catch (cleanupErr) {
        console.warn('Cleanup failed after copy error:', cleanupErr.message)
      }

      return createError(`Failed to copy mod files: ${err.message}`, 'COPY_ERROR', err)
    }
  } catch (err) {
    console.error('Unexpected error in installLocalMod:', err)
    return createError(`Installation failed: ${err.message}`, 'INSTALL_ERROR', err)
  }
}
