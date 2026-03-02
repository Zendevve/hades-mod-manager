import React, { memo, useMemo } from 'react'
import { FolderOpen, Flame, MapPin, DownloadSimple, ArrowsClockwise, Coffee } from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility for merging Tailwind classes
 */
function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Header Component
 * Displays app branding, game path, Python status, and primary actions
 * Implements full accessibility support with ARIA labels and keyboard navigation
 *
 * @param {Object} props
 * @param {string} props.gamePath - Current game installation path
 * @param {Function} props.onChangePath - Handler for changing game path
 * @param {boolean} props.isConnected - Whether game path is valid
 * @param {Function} props.onOpenDownloader - Handler to open mod downloader
 * @param {Object} props.pythonInfo - Python detection info
 * @param {Function} props.onRefreshPython - Handler to refresh Python detection
 * @param {boolean} props.isRefreshingPython - Whether Python detection is in progress
 * @param {number} props.enabledCount - Number of enabled mods
 * @param {number} props.totalCount - Total number of mods
 */
function Header({
  gamePath,
  onChangePath,
  isConnected,
  onOpenDownloader,
  pythonInfo,
  onRefreshPython,
  isRefreshingPython,
  enabledCount = 0,
  totalCount = 0
}) {
  // Memoized truncated path for display
  const shortPath = useMemo(() => {
    if (!gamePath) return 'No path selected'
    return gamePath.length > 40
      ? '...' + gamePath.slice(-37)
      : gamePath
  }, [gamePath])

  // Memoized Python status
  const pythonStatus = useMemo(() => {
    if (!pythonInfo) return { label: 'Unknown', color: 'bg-slate-500' }
    return pythonInfo.found
      ? { label: `Python ${pythonInfo.version || 'Ready'}`, color: 'bg-emerald-500' }
      : { label: 'Python Not Found', color: 'bg-amber-500' }
  }, [pythonInfo])

  return (
    <header
      className="h-[60px] flex items-center justify-between px-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md z-50 shrink-0"
      style={{ WebkitAppRegion: 'drag' }}
      role="banner"
      aria-label="Application header"
    >
      {/* Left Section: Branding & Status */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* App Logo & Title */}
        <div className="flex items-center gap-3">
          <Flame
            weight="duotone"
            className="w-6 h-6 text-gold-500 drop-shadow-[0_0_8px_rgba(232,166,52,0.5)]"
            aria-hidden="true"
          />
          <h1 className="font-sans font-bold tracking-tight text-sm uppercase bg-gradient-to-br from-gold-400 to-ember-500 bg-clip-text text-transparent">
            Hades Mod Manager
          </h1>
        </div>

        {/* Python Status Indicator */}
        <div
          className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/5"
          role="status"
          aria-live="polite"
          aria-label={`Python status: ${pythonStatus.label}`}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              pythonStatus.color,
              pythonInfo?.found && "animate-pulse"
            )}
            aria-hidden="true"
          />
          <span className="text-xs text-slate-400">
            {pythonStatus.label}
          </span>
          <button
            onClick={onRefreshPython}
            disabled={isRefreshingPython}
            className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            title="Refresh Python Detection"
            aria-label={isRefreshingPython ? "Refreshing Python detection" : "Refresh Python detection"}
            aria-busy={isRefreshingPython}
          >
            <ArrowsClockwise
              weight="bold"
              className={cn(
                "w-3 h-3 text-slate-400 transition-transform",
                isRefreshingPython && "animate-spin"
              )}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Mod Count Badge */}
        {totalCount > 0 && (
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5"
            role="status"
            aria-label={`${enabledCount} of ${totalCount} mods enabled`}
          >
            <span className="text-xs text-slate-400">
              <span className="text-gold-400 font-semibold">{enabledCount}</span>
              <span className="mx-1">/</span>
              <span>{totalCount}</span>
              <span className="ml-1">mods</span>
            </span>
          </div>
        )}
      </div>

      {/* Right Section: Path Display & Actions */}
      <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Game Path Display */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full text-xs font-mono shadow-sm"
          role="region"
          aria-label="Game installation path"
        >
          {/* Connection Status Indicator */}
          <div className="relative flex h-2 w-2" aria-hidden="true">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20" />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isConnected ? 'bg-emerald-500' : 'bg-red-500'
              )}
            />
          </div>

          <MapPin
            weight="bold"
            className="w-3.5 h-3.5 opacity-50"
            aria-hidden="true"
          />

          <span
            className="max-w-[200px] xl:max-w-[300px] truncate text-slate-300"
            title={gamePath}
          >
            {shortPath}
          </span>
        </div>

        {/* Change Path Button */}
        <button
          onClick={onChangePath}
          className="btn-magnetic px-3 py-1.5 text-xs font-semibold rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          aria-label="Change game installation path"
        >
          <FolderOpen weight="bold" aria-hidden="true" />
          <span className="hidden sm:inline">Change</span>
        </button>

        {/* Support Button */}
        <a
          href="https://buymeacoffee.com/zendevve"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-magnetic px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(232,166,52,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          aria-label="Support the developer on Buy Me a Coffee"
          title="Buy me a coffee ☕"
        >
          <Coffee weight="bold" aria-hidden="true" />
          <span className="hidden sm:inline">Support</span>
        </a>

        {/* Divider */}
        <div className="divider-vertical h-6" aria-hidden="true" />

        {/* Download Mods Button */}
        <button
          onClick={onOpenDownloader}
          className="btn-magnetic px-4 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-zinc-950 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(232,166,52,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          aria-label="Download more mods"
        >
          <DownloadSimple weight="bold" aria-hidden="true" />
          <span className="hidden sm:inline">Get More Mods</span>
        </button>
      </div>
    </header>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(Header)
