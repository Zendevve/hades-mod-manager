import React from 'react'
import { FolderOpen, Flame, MapPin, DownloadSimple, ArrowsClockwise } from '@phosphor-icons/react'

export default function Header({
  gamePath,
  onChangePath,
  isConnected,
  onOpenDownloader,
  pythonInfo,
  onRefreshPython,
  isRefreshingPython
}) {
  const shortPath = gamePath.length > 40
    ? '...' + gamePath.slice(-37)
    : gamePath

  return (
    <header className="h-[60px] flex items-center justify-between px-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md z-50 shrink-0" style={{ WebkitAppRegion: 'drag' }}>

      <div className="flex items-center gap-3">
        <Flame weight="duotone" className="w-6 h-6 text-gold-500 drop-shadow-[0_0_8px_rgba(232,166,52,0.5)]" />
        <h1 className="font-sans font-bold tracking-tight text-sm uppercase bg-gradient-to-br from-gold-400 to-ember-500 bg-clip-text text-transparent">
          Hades Mod Manager
        </h1>
        {/* Python Status Indicator */}
        <div className="flex items-center gap-2 ml-4">
          <div className={`w-2 h-2 rounded-full ${pythonInfo?.found ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-xs text-slate-400">
            {pythonInfo?.found ? 'Python Ready' : 'Python Not Found'}
          </span>
          <button
            onClick={onRefreshPython}
            disabled={isRefreshingPython}
            className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh Python Detection"
          >
            <ArrowsClockwise
              weight="bold"
              className={`w-3 h-3 text-slate-400 ${isRefreshingPython ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Dynamic Island style path display */}
        <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full text-xs text-slate-400 font-mono shadow-sm">
          <div className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </div>
          <MapPin weight="bold" className="w-3.5 h-3.5 opacity-50" />
          <span className="max-w-[300px] truncate text-slate-300">{shortPath}</span>
        </div>

        <button
          onClick={onChangePath}
          className="btn-magnetic px-3 py-1.5 text-xs font-semibold rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-colors flex items-center gap-2"
        >
          <FolderOpen weight="bold" />
          <span>Change</span>
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={onOpenDownloader}
          className="btn-magnetic px-4 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-zinc-950 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(232,166,52,0.3)]"
        >
          <DownloadSimple weight="bold" />
          <span>Get More Mods</span>
        </button>
      </div>

    </header>
  )
}
