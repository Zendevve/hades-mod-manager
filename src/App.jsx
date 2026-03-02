import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import ModList from './components/ModList'
import ModDetail from './components/ModDetail'
import ActionBar from './components/ActionBar'
import LogViewer from './components/LogViewer'
import WelcomeScreen from './components/WelcomeScreen'
import ModDownloader from './components/ModDownloader'
import { useModOperations, STATES } from './hooks/useModOperations'
import { useAnnouncer, useSkipLink } from './hooks/useAccessibility'

/**
 * Main Application Component
 * Manages global state, settings, and coordinates all child components
 * Implements React best practices and accessibility standards
 */
export default function App() {
  // ─────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ─────────────────────────────────────────────────────────

  // Core application state
  const [gamePath, setGamePath] = useState('')
  const [pythonInfo, setPythonInfo] = useState({ found: false })
  const [isRefreshingPython, setIsRefreshingPython] = useState(false)
  const [isInstallingPython, setIsInstallingPython] = useState(false)
  const [pythonInstallStatus, setPythonInstallStatus] = useState(null)
  const [mods, setMods] = useState([])
  const [selectedMod, setSelectedMod] = useState(null)
  const [logs, setLogs] = useState([])
  const [logOpen, setLogOpen] = useState(false)
  const [isDownloaderOpen, setIsDownloaderOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Use state machine for import/restore operations
  const modOperations = useModOperations()

  // Accessibility announcer for screen readers
  const announce = useAnnouncer()

  // Skip link for keyboard navigation
  const { skipLinkProps, mainContentProps } = useSkipLink('main-content')

  // ─────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────

  const enabledCount = useMemo(() =>
    mods.filter(m => m.enabled).length,
    [mods]
  )

  const hasPython = useMemo(() =>
    pythonInfo?.found ?? false,
    [pythonInfo]
  )

  // ─────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      setIsLoading(true)
      try {
        const settings = await window.electronAPI.getSettings()
        if (settings.gamePath) {
          setGamePath(settings.gamePath)
          announce('Game path loaded successfully')
        }
        setPythonInfo(settings.pythonPath || { found: false })
      } catch (err) {
        console.error('Failed to initialize:', err)
        announce('Error loading settings', 'assertive')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [announce])

  // Refresh mods when game path changes
  useEffect(() => {
    if (gamePath) {
      refreshMods()
    }
  }, [gamePath])

  // Subscribe to import logs
  useEffect(() => {
    const cleanup = window.electronAPI.onImportLog((data) => {
      setLogs(prev => {
        const updated = [...prev, data]
        // Keep only the most recent 1000 entries to prevent memory leaks
        return updated.length > 1000 ? updated.slice(-1000) : updated
      })
    })
    return cleanup
  }, [])

  // Subscribe to Python installation status updates
  useEffect(() => {
    const cleanup = window.electronAPI.onPythonInstallStatus((data) => {
      setPythonInstallStatus(data)
    })
    return cleanup
  }, [])

  // ─────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────

  /**
   * Refresh Python detection
   */
  const handleRefreshPython = useCallback(async () => {
    setIsRefreshingPython(true)
    try {
      const result = await window.electronAPI.refreshPython()
      setPythonInfo(result)

      const message = result.found
        ? `Python ${result.version} detected successfully`
        : 'Python not found. Please install Python and try again.'

      setLogs(prev => [...prev, {
        type: result.found ? 'info' : 'stderr',
        text: result.found ? `Python detected: ${result.version}\n` : 'Python not found. Please install Python and try again.\n'
      }])

      announce(message, result.found ? 'polite' : 'assertive')
    } catch (err) {
      console.error('Failed to refresh Python detection:', err)
      setLogs(prev => [...prev, { type: 'stderr', text: `Failed to detect Python: ${err.message}\n` }])
      announce('Failed to detect Python', 'assertive')
    } finally {
      setIsRefreshingPython(false)
    }
  }, [announce])

  /**
   * Install Python automatically
   */
  const handleInstallPython = useCallback(async () => {
    setIsInstallingPython(true)
    setPythonInstallStatus({ status: 'Starting installation...', type: 'info', progress: 0 })
    announce('Starting Python installation', 'assertive')

    try {
      const result = await window.electronAPI.installPython()

      if (result.success) {
        setPythonInfo({
          found: true,
          command: result.path,
          version: result.version,
          isEmbedded: result.isEmbedded,
          success: true
        })
        setPythonInstallStatus({ status: 'Installation complete!', type: 'success', progress: 100 })
        setLogs(prev => [...prev, { type: 'info', text: `Python installed successfully: ${result.version}\n` }])
        announce(`Python ${result.version} installed successfully`, 'polite')
      } else {
        const errorMsg = result.error || 'Installation failed'
        setPythonInstallStatus({ status: errorMsg, type: 'error', progress: null })
        setLogs(prev => [...prev, { type: 'stderr', text: `Python installation failed: ${errorMsg}\n` }])
        announce(`Python installation failed: ${errorMsg}`, 'assertive')
      }
    } catch (err) {
      const errorMessage = err.message || 'Unknown error during installation'
      setPythonInstallStatus({ status: errorMessage, type: 'error', progress: null })
      setLogs(prev => [...prev, { type: 'stderr', text: `Python installation error: ${errorMessage}\n` }])
      announce(`Python installation error: ${errorMessage}`, 'assertive')
    } finally {
      setIsInstallingPython(false)
    }
  }, [announce])

  /**
   * Clear all logs
   */
  const handleClearLogs = useCallback(() => {
    setLogs([])
    announce('Logs cleared')
  }, [announce])

  /**
   * Refresh the mod list from disk
   */
  const refreshMods = useCallback(async () => {
    try {
      const result = await window.electronAPI.scanMods()
      if (result.success) {
        setMods(result.mods)
        // Update selected mod reference if it still exists
        if (selectedMod) {
          const updated = result.mods.find(m => m.name === selectedMod.name)
          setSelectedMod(updated || null)
        }
        if (result.mods.length > 0) {
          announce(`Found ${result.mods.length} mods`)
        }
      } else {
        console.error('Failed to scan mods:', result.error)
        announce('Failed to scan mods', 'assertive')
      }
    } catch (err) {
      console.error('Error scanning mods:', err)
      announce('Error scanning mods', 'assertive')
    }
  }, [selectedMod, announce])

  /**
   * Handle game path selection
   */
  const handleSelectGamePath = useCallback(async () => {
    try {
      const result = await window.electronAPI.selectGamePath()
      if (result.success) {
        setGamePath(result.path)
        announce(`Game path set to ${result.path}`)
      }
    } catch (err) {
      console.error('Failed to select game path:', err)
      announce('Failed to select game path', 'assertive')
    }
  }, [announce])

  /**
   * Auto-detect game installation
   */
  const handleAutoDetect = useCallback(async () => {
    try {
      const result = await window.electronAPI.autoDetectGame()
      if (result.success) {
        setGamePath(result.path)
        announce(`Game auto-detected at ${result.path}`)
      } else {
        // Fall back to manual selection
        handleSelectGamePath()
      }
    } catch (err) {
      console.error('Auto-detect failed:', err)
      handleSelectGamePath()
    }
  }, [handleSelectGamePath, announce])

  /**
   * Toggle a mod on/off
   */
  const handleToggleMod = useCallback(async (modName, enabled) => {
    try {
      announce(`${enabled ? 'Enabling' : 'Disabling'} mod ${modName}`)
      const result = await window.electronAPI.toggleMod(modName, enabled)

      if (!result.success) {
        console.error(`Failed to toggle mod ${modName}:`, result.error)
        setLogs(prev => [...prev, { type: 'stderr', text: `Failed to toggle mod ${modName}: ${result.error}\n` }])
        announce(`Failed to toggle mod ${modName}`, 'assertive')
      } else {
        announce(`Mod ${modName} ${enabled ? 'enabled' : 'disabled'}`)
      }

      await refreshMods()
    } catch (err) {
      console.error(`Error toggling mod ${modName}:`, err)
      setLogs(prev => [...prev, { type: 'stderr', text: `Error toggling mod ${modName}: ${err.message}\n` }])
      announce(`Error toggling mod ${modName}`, 'assertive')
    }
  }, [refreshMods, announce])

  /**
   * Handle import mods operation
   */
  const handleImport = useCallback(async () => {
    // State machine prevents starting if already running
    if (!modOperations.startImport()) {
      console.warn('[App] Import already in progress, ignoring request')
      return
    }

    setLogs([{ type: 'info', text: '═══ Starting mod import ═══\n' }])
    setLogOpen(true)
    announce('Starting mod import', 'assertive')

    try {
      const result = await window.electronAPI.runImport()

      if (result.success) {
        modOperations.complete(result)
        setLogs(prev => [...prev, { type: 'info', text: `\n═══ Import finished (exit code: ${result.code}) ═══\n` }])
        announce('Mod import completed successfully')
      } else {
        const errorMsg = result.error || 'Import failed'
        modOperations.error(errorMsg)
        setLogs(prev => [...prev, { type: 'stderr', text: `\nError: ${errorMsg}\n` }])
        announce(`Import failed: ${errorMsg}`, 'assertive')
      }
    } catch (err) {
      const errorMessage = err.message || 'Unknown error during import'
      modOperations.error(errorMessage)
      setLogs(prev => [...prev, { type: 'stderr', text: `\nError: ${errorMessage}\n` }])
      announce(`Import error: ${errorMessage}`, 'assertive')
    }

    await refreshMods()
  }, [modOperations, refreshMods, announce])

  /**
   * Handle restore originals operation
   */
  const handleRestore = useCallback(async () => {
    // State machine prevents starting if already running
    if (!modOperations.startRestore()) {
      console.warn('[App] Restore already in progress, ignoring request')
      return
    }

    setLogs([{ type: 'info', text: '═══ Starting restore ═══\n' }])
    setLogOpen(true)
    announce('Starting restore operation', 'assertive')

    try {
      const result = await window.electronAPI.runRestore()

      if (result.success) {
        modOperations.complete(result)
        setLogs(prev => [...prev, { type: 'info', text: `\n═══ Restore finished (exit code: ${result.code}) ═══\n` }])
        announce('Restore completed successfully')
      } else {
        const errorMsg = result.error || 'Restore failed'
        modOperations.error(errorMsg)
        setLogs(prev => [...prev, { type: 'stderr', text: `\nError: ${errorMsg}\n` }])
        announce(`Restore failed: ${errorMsg}`, 'assertive')
      }
    } catch (err) {
      const errorMessage = err.message || 'Unknown error during restore'
      modOperations.error(errorMessage)
      setLogs(prev => [...prev, { type: 'stderr', text: `\nError: ${errorMessage}\n` }])
      announce(`Restore error: ${errorMessage}`, 'assertive')
    }

    await refreshMods()
  }, [modOperations, refreshMods, announce])

  /**
   * Reset operation state
   */
  const handleResetState = useCallback(() => {
    modOperations.reset()
    announce('Operation state reset')
  }, [modOperations, announce])

  /**
   * Handle mod installation completion
   */
  const handleModInstalled = useCallback(() => {
    announce('Mod installed successfully')
    refreshMods()
  }, [refreshMods, announce])

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  // Show loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-zinc-950 flex items-center justify-center"
        role="status"
        aria-label="Loading application"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  // Show welcome screen if no game path is set
  if (!gamePath) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Skip link for accessibility */}
        <a {...skipLinkProps} className="skip-link">
          Skip to main content
        </a>

        {/* Subtle background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none"
          aria-hidden="true"
        />

        <WelcomeScreen
          onSelectPath={handleSelectGamePath}
          onAutoDetect={handleAutoDetect}
          isLoading={isRefreshingPython}
          pythonInfo={pythonInfo}
          onInstallPython={handleInstallPython}
          isInstallingPython={isInstallingPython}
          pythonInstallStatus={pythonInstallStatus}
        />
      </main>
    )
  }

  // Main application view
  return (
    <>
      {/* Skip link for accessibility */}
      <a {...skipLinkProps}>
        Skip to main content
      </a>

      <main
        id="main-content"
        className="h-screen flex flex-col bg-zinc-950 text-slate-200 overflow-hidden relative"
        role="main"
        aria-label="Hades Mod Manager"
      >
        {/* Decorative background */}
        <div
          className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-gold-500/5 blur-[100px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Python warning banner */}
        {!hasPython && (
          <div
            className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 font-medium flex items-center justify-center gap-2 z-50"
            role="alert"
            aria-live="assertive"
          >
            <span aria-hidden="true">⚠</span>
            <span>Python not detected on PATH. Operations will fail.</span>
          </div>
        )}

        {/* Header */}
        <Header
          gamePath={gamePath}
          onChangePath={handleSelectGamePath}
          isConnected={!!gamePath}
          onOpenDownloader={() => setIsDownloaderOpen(true)}
          pythonInfo={pythonInfo}
          onRefreshPython={handleRefreshPython}
          isRefreshingPython={isRefreshingPython}
          enabledCount={enabledCount}
          totalCount={mods.length}
        />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4 pb-24 z-10 relative">
          {/* Mod list sidebar */}
          <ModList
            mods={mods}
            selectedMod={selectedMod}
            onSelectMod={setSelectedMod}
            onToggleMod={handleToggleMod}
            onRefresh={refreshMods}
          />

          {/* Mod detail view */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {selectedMod ? (
                <ModDetail
                  key={selectedMod.name}
                  mod={selectedMod}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  className="h-full glass-panel rounded-3xl flex flex-col items-center justify-center text-slate-500"
                  role="region"
                  aria-label="No mod selected"
                >
                  <span className="text-4xl mb-4 opacity-30" aria-hidden="true">📜</span>
                  <p className="text-sm font-medium tracking-wide">
                    Select a mod to inspect its runes.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action bar */}
        <ActionBar
          onImport={handleImport}
          onRestore={handleRestore}
          onReset={handleResetState}
          state={modOperations.state}
          statusMessage={modOperations.statusMessage}
          enabledCount={enabledCount}
          hasPython={hasPython}
        />

        {/* Log viewer */}
        <LogViewer
          logs={logs}
          isOpen={logOpen}
          onToggle={() => setLogOpen(!logOpen)}
          onClear={handleClearLogs}
        />

        {/* Mod downloader modal */}
        <ModDownloader
          isOpen={isDownloaderOpen}
          onClose={() => setIsDownloaderOpen(false)}
          onInstalled={handleModInstalled}
        />
      </main>
    </>
  )
}
