import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import ModList from './components/ModList'
import ModDetail from './components/ModDetail'
import ActionBar from './components/ActionBar'
import LogViewer from './components/LogViewer'
import WelcomeScreen from './components/WelcomeScreen'

export default function App() {
  const [gamePath, setGamePath] = useState('')
  const [pythonInfo, setPythonInfo] = useState({ found: false })
  const [mods, setMods] = useState([])
  const [selectedMod, setSelectedMod] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [runStatus, setRunStatus] = useState('')
  const [logs, setLogs] = useState([])
  const [logOpen, setLogOpen] = useState(false)

  useEffect(() => {
    async function init() {
      const settings = await window.electronAPI.getSettings()
      if (settings.gamePath) setGamePath(settings.gamePath)
      setPythonInfo(settings.pythonPath || { found: false })
    }
    init()
  }, [])

  useEffect(() => {
    if (gamePath) refreshMods()
  }, [gamePath])

  useEffect(() => {
    const cleanup = window.electronAPI.onImportLog((data) => {
      setLogs(prev => [...prev, data])
    })
    return cleanup
  }, [])

  const refreshMods = useCallback(async () => {
    const result = await window.electronAPI.scanMods()
    if (result.success) {
      setMods(result.mods)
      if (selectedMod) {
        const updated = result.mods.find(m => m.name === selectedMod.name)
        setSelectedMod(updated || null)
      }
    }
  }, [selectedMod])

  const handleSelectGamePath = async () => {
    const result = await window.electronAPI.selectGamePath()
    if (result.success) setGamePath(result.path)
  }

  const handleAutoDetect = async () => {
    const result = await window.electronAPI.autoDetectGame()
    if (result.success) setGamePath(result.path)
    else handleSelectGamePath()
  }

  const handleToggleMod = async (modName, enabled) => {
    await window.electronAPI.toggleMod(modName, enabled)
    await refreshMods()
  }

  const handleImport = async () => {
    setIsRunning(true)
    setRunStatus('Importing mods...')
    setLogs([{ type: 'info', text: '═══ Starting mod import ═══\n' }])
    setLogOpen(true)

    const result = await window.electronAPI.runImport()

    if (result.success) {
      setRunStatus(`Import complete (exit code: ${result.code})`)
      setLogs(prev => [...prev, { type: 'info', text: '\n═══ Import finished ═══\n' }])
    } else {
      setRunStatus(`Error: ${result.error}`)
      setLogs(prev => [...prev, { type: 'stderr', text: `\nError: ${result.error}\n` }])
    }

    setIsRunning(false)
    await refreshMods()
  }

  const handleRestore = async () => {
    setIsRunning(true)
    setRunStatus('Restoring original files...')
    setLogs([{ type: 'info', text: '═══ Starting restore ═══\n' }])
    setLogOpen(true)

    const result = await window.electronAPI.runRestore()

    if (result.success) {
      setRunStatus(`Restore complete (exit code: ${result.code})`)
      setLogs(prev => [...prev, { type: 'info', text: '\n═══ Restore finished ═══\n' }])
    } else {
      setRunStatus(`Error: ${result.error}`)
      setLogs(prev => [...prev, { type: 'stderr', text: `\nError: ${result.error}\n` }])
    }

    setIsRunning(false)
    await refreshMods()
  }

  if (!gamePath) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
        <WelcomeScreen onSelectPath={handleSelectGamePath} onAutoDetect={handleAutoDetect} />
      </main>
    )
  }

  const enabledCount = mods.filter(m => m.enabled).length

  return (
    <main className="h-screen flex flex-col bg-zinc-950 text-slate-200 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-gold-500/5 blur-[100px] rounded-full pointer-events-none" />

      {!pythonInfo.found && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 font-medium flex items-center justify-center gap-2 z-50">
          <span>⚠</span> Python not detected on PATH. Operations will fail.
        </div>
      )}

      <Header
        gamePath={gamePath}
        onChangePath={handleSelectGamePath}
        isConnected={!!gamePath}
      />

      <div className="flex-1 flex overflow-hidden p-4 gap-4 pb-24 z-10 relative">
        <ModList
          mods={mods}
          selectedMod={selectedMod}
          onSelectMod={setSelectedMod}
          onToggleMod={handleToggleMod}
          onRefresh={refreshMods}
        />

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {selectedMod ? (
              <ModDetail key={selectedMod.name} mod={selectedMod} />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                className="h-full glass-panel rounded-3xl flex flex-col items-center justify-center text-slate-500"
              >
                <span className="text-4xl mb-4 opacity-30">📜</span>
                <p className="text-sm font-medium tracking-wide">Select a mod to inspect its runes.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ActionBar
        onImport={handleImport}
        onRestore={handleRestore}
        isRunning={isRunning}
        runStatus={runStatus}
        enabledCount={enabledCount}
        hasPython={pythonInfo.found}
      />

      <LogViewer
        logs={logs}
        isOpen={logOpen}
        onToggle={() => setLogOpen(!logOpen)}
      />
    </main>
  )
}
