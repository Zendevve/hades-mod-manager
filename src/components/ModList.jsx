import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowsClockwise, FileArchive, CheckCircle, CircleDashed } from '@phosphor-icons/react'
import clsx from 'clsx'

export default function ModList({ mods, selectedMod, onSelectMod, onToggleMod, onRefresh }) {
  // Sort: Enabled first, then alphabetically
  const sortedMods = [...mods].sort((a, b) => {
    if (a.enabled && !b.enabled) return -1
    if (!a.enabled && b.enabled) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="w-[340px] flex flex-col glass-panel rounded-3xl overflow-hidden shrink-0">

      <div className="flex items-center justify-between p-5 border-b border-white/5 bg-zinc-950/40">
        <h2 className="text-sm font-semibold tracking-wide text-slate-300">Installed Runes</h2>
        <button
          onClick={onRefresh}
          className="btn-magnetic w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          title="Refresh List"
        >
          <ArrowsClockwise weight="bold" size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {mods.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <FileArchive size={32} weight="duotone" className="mb-3" />
            <p className="text-xs font-medium">No mods detected.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {sortedMods.map((mod) => (
              <motion.div
                layout
                layoutId={`mod-${mod.name}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                key={mod.name}
                className={clsx(
                  "group relative p-3 rounded-2xl cursor-pointer transition-colors border",
                  selectedMod?.name === mod.name
                    ? "bg-white/10 border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
                    : "bg-transparent border-transparent hover:bg-white/[0.03]"
                )}
                onClick={() => onSelectMod(mod)}
              >

                {selectedMod?.name === mod.name && (
                  <motion.div
                    layoutId="active-highlight"
                    className="absolute inset-0 border border-gold-500/30 rounded-2xl pointer-events-none"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <div className="flex items-center gap-3 relative z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleMod(mod.name, !mod.enabled)
                    }}
                    className="btn-magnetic relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-zinc-900 border border-white/5 shadow-inner"
                  >
                    <AnimatePresence mode="popLayout">
                      {mod.enabled ? (
                        <motion.div
                          key="enabled"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center text-emerald-400"
                        >
                          <CheckCircle weight="fill" size={20} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="disabled"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute inset-0 text-slate-500/50 flex items-center justify-center hover:text-slate-400 transition-colors"
                        >
                          <CircleDashed weight="bold" size={20} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={clsx(
                      "text-sm font-semibold truncate transition-colors",
                      mod.enabled ? "text-slate-200" : "text-slate-500"
                    )}>
                      {mod.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      <span>{mod.fileCount} files</span>
                      {mod.types.length > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="truncate">{mod.types.slice(0, 2).join(' / ')}{mod.types.length > 2 && '...'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
