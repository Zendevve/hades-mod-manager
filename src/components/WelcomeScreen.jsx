import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { Flame, FolderOpen, MagnifyingGlass, Spinner, Download, CheckCircle, Warning, Terminal } from '@phosphor-icons/react'

/**
 * WelcomeScreen Component
 * Onboarding screen for first-time users to set up game path and Python
 * Fully accessible with proper ARIA labels and keyboard navigation
 *
 * @param {Object} props
 * @param {Function} props.onSelectPath - Handler for manual path selection
 * @param {Function} props.onAutoDetect - Handler for auto-detection
 * @param {boolean} props.isLoading - Whether detection is in progress
 * @param {Object} props.pythonInfo - Python detection info { found, version, isEmbedded }
 * @param {Function} props.onInstallPython - Handler to install Python
 * @param {boolean} props.isInstallingPython - Whether Python installation is in progress
 * @param {Object} props.pythonInstallStatus - Current installation status { status, progress, type }
 */
function WelcomeScreen({
  onSelectPath,
  onAutoDetect,
  isLoading = false,
  pythonInfo = { found: false },
  onInstallPython,
  isInstallingPython = false,
  pythonInstallStatus = null,
}) {
  const hasPython = pythonInfo?.found ?? false
  const showPythonInstall = !hasPython && !isInstallingPython

  return (
    <section
      className="relative z-10 w-full max-w-[900px] grid grid-cols-1 md:grid-cols-2 gap-6 p-4"
      role="region"
      aria-label="Welcome screen"
    >
      {/* ── Left Content: Branding & Info ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col justify-center pr-8"
      >
        {/* App Icon */}
        <div
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/20 to-ember-500/20 text-gold-500 border border-gold-500/30 mb-8 shadow-[0_0_30px_rgba(232,166,52,0.15)]"
          aria-hidden="true"
        >
          <Flame weight="duotone" className="w-6 h-6" />
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl font-sans tracking-tighter font-semibold mb-4 leading-[1.1] text-balance">
          Manage your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-gold-400 to-ember-500">
            Underworld
          </span>
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-sm leading-relaxed max-w-[40ch] font-medium text-pretty mb-8">
          A high-performance GUI for the SGG-Mod-Format engine. Install, toggle, and restore mods effortlessly.
        </p>

        {/* System Status */}
        <div
          className="flex flex-col gap-3 text-xs font-mono"
          role="status"
          aria-live="polite"
        >
          {/* Python Status */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                hasPython ? "bg-emerald-500" : isInstallingPython ? "bg-amber-500 animate-pulse" : "bg-rose-500"
              )}
              aria-hidden="true"
            />
            <span className={cn(
              hasPython ? "text-emerald-400" : isInstallingPython ? "text-amber-400" : "text-rose-400"
            )}>
              {hasPython
                ? `Python Ready${pythonInfo.isEmbedded ? ' (Bundled)' : ''}`
                : isInstallingPython
                  ? 'Installing Python...'
                  : 'Python Required'}
            </span>
          </div>

          {/* Game Status */}
          <div className="flex items-center gap-2 text-slate-500">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isLoading ? "bg-amber-500 animate-pulse" : "bg-slate-600"
              )}
              aria-hidden="true"
            />
            <span>{isLoading ? 'Detecting game...' : 'Game path not set'}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Right Content: Action Cards ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="glass-panel rounded-[2rem] p-8 flex flex-col justify-center gap-4 relative overflow-hidden"
        role="region"
        aria-label="Initialization options"
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-ember-500/5 blur-[80px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        <h2 className="text-sm font-semibold tracking-wide text-slate-300 mb-2 uppercase">
          Setup Required
        </h2>

        {/* Python Installation Section */}
        {!hasPython && (
          <div className="space-y-3">
            {/* Install Python Button */}
            {showPythonInstall && (
              <button
                onClick={onInstallPython}
                disabled={isLoading}
                className="btn-magnetic group flex flex-col gap-1 items-start w-full text-left p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/30 hover:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 transition-all"
                aria-label="Install Python automatically"
              >
                <div className="flex items-center gap-3 text-amber-400 mb-1">
                  <Download
                    weight="duotone"
                    className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-slate-200">Install Python</span>
                </div>
                <p className="text-xs text-slate-400">
                  Automatic installation for Windows. No admin rights needed.
                </p>
              </button>
            )}

            {/* Installation Progress */}
            {isInstallingPython && (
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-amber-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Spinner
                    weight="bold"
                    className="w-5 h-5 text-amber-500 animate-spin"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-slate-200 text-sm">Installing Python...</span>
                </div>

                {/* Progress Bar */}
                {pythonInstallStatus?.progress !== null && pythonInstallStatus?.progress >= 0 && (
                  <div className="w-full bg-zinc-800 rounded-full h-2 mb-2" role="progressbar" aria-valuenow={pythonInstallStatus.progress} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className="bg-gradient-to-r from-amber-500 to-gold-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pythonInstallStatus.progress}%` }}
                    />
                  </div>
                )}

                {/* Status Message */}
                {pythonInstallStatus?.status && (
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                    <Terminal weight="fill" className="w-3 h-3 text-slate-500" />
                    {pythonInstallStatus.status}
                  </p>
                )}
              </div>
            )}

            {/* Installation Error */}
            {pythonInstallStatus?.type === 'error' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
                <Warning weight="fill" className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-rose-400">{pythonInstallStatus.status}</p>
              </div>
            )}

            {/* Manual Install Note */}
            <p className="text-xs text-slate-500 text-center">
              Or install manually from{' '}
              <a
                href="https://python.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-400 hover:text-gold-300 underline"
              >
                python.org
              </a>
            </p>
          </div>
        )}

        {/* Python Installed Success */}
        {hasPython && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
            <CheckCircle weight="fill" className="w-5 h-5 text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-400">Python Installed</p>
              <p className="text-xs text-slate-400">{pythonInfo.version || 'Version detected'}</p>
            </div>
          </div>
        )}

        {/* Divider - only show if Python is ready */}
        {hasPython && (
          <div className="relative py-2 flex items-center justify-center" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <span className="relative bg-zinc-900 px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Next Step
            </span>
          </div>
        )}

        {/* Auto-Detect Button */}
        <button
          onClick={onAutoDetect}
          disabled={isLoading || !hasPython}
          className="btn-magnetic group flex flex-col gap-1 items-start w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 transition-all"
          aria-label="Auto-detect game installation path"
          aria-busy={isLoading}
        >
          <div className="flex items-center gap-3 text-gold-400 mb-1">
            {isLoading ? (
              <Spinner
                weight="bold"
                className="w-5 h-5 text-gold-500 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <MagnifyingGlass
                weight="duotone"
                className="w-5 h-5 text-gold-500 group-hover:scale-110 transition-transform"
                aria-hidden="true"
              />
            )}
            <span className="font-semibold text-slate-200">
              {isLoading ? 'Detecting...' : 'Auto-Detect Game'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Scans standard Steam installation paths for Hades.
          </p>
        </button>

        {/* Divider */}
        <div className="relative py-2 flex items-center justify-center" aria-hidden="true">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <span className="relative bg-zinc-900 px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">
            OR
          </span>
        </div>

        {/* Manual Browse Button */}
        <button
          onClick={onSelectPath}
          disabled={isLoading || !hasPython}
          className="btn-magnetic group flex flex-col gap-1 items-start w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 transition-all"
          aria-label="Manually browse for game installation folder"
        >
          <div className="flex items-center gap-3 text-slate-300 mb-1">
            <FolderOpen
              weight="duotone"
              className="w-5 h-5 text-slate-400 group-hover:text-slate-200 transition-colors"
              aria-hidden="true"
            />
            <span className="font-semibold">Browse Manually</span>
          </div>
          <p className="text-xs text-slate-400">
            Select the Content folder in your game directory.
          </p>
        </button>

        {/* Help text */}
        <p className="text-xs text-slate-500 mt-4 text-center">
          Need help? Visit our documentation for setup instructions.
        </p>
      </motion.div>
    </section>
  )
}

// Utility function for class merging
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default memo(WelcomeScreen)
