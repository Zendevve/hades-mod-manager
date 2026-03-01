import React from 'react'
import { MagicWand, ArrowCounterClockwise, SpinnerGap } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function ActionBar({ onImport, onRestore, isRunning, runStatus, enabledCount, hasPython }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">

      {/* ── Status Indicator (Floating above bar) ── */}
      <AnimatePresence>
        {runStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-gold-400 shadow-2xl whitespace-nowrap flex items-center gap-2"
          >
            {isRunning && <SpinnerGap className="animate-spin" />}
            {runStatus}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Bar ── */}
      <div className="glass-panel flex items-center gap-2 p-2 rounded-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">

        <button
          onClick={onRestore}
          disabled={isRunning || !hasPython}
          className="btn-magnetic flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed group transition-colors"
        >
          <ArrowCounterClockwise weight="bold" className="group-hover:-rotate-45 transition-transform" />
          <span className="text-sm font-semibold tracking-wide">Restore Originals</span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button
          onClick={onImport}
          disabled={isRunning || enabledCount === 0 || !hasPython}
          className={clsx(
            "btn-magnetic relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-full text-zinc-950 font-semibold tracking-wide shadow-lg transition-all",
            isRunning || enabledCount === 0 || !hasPython
              ? "bg-slate-500 opacity-50 cursor-not-allowed"
              : "bg-gradient-to-r from-gold-400 to-gold-500 hover:shadow-[0_0_20px_rgba(232,166,52,0.4)]"
          )}
        >
          {isRunning ? (
            <SpinnerGap weight="bold" className="animate-spin" />
          ) : (
            <MagicWand weight="fill" />
          )}

          <span className="relative z-10">
            {isRunning ? 'Weaving...' : `Import ${enabledCount} Mod${enabledCount === 1 ? '' : 's'}`}
          </span>

          {/* Inner highlight for 3D feel */}
          <div className="absolute inset-0 border-t border-white/40 rounded-full pointer-events-none" />
        </button>

      </div>
    </div>
  )
}
