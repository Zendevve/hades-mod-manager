import React from 'react'
import { MagicWand, ArrowCounterClockwise, SpinnerGap, CheckCircle, Warning } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { STATES } from '../hooks/useModOperations'

/**
 * ActionBar Component
 * @param {Object} props
 * @param {Function} props.onImport - Import button click handler
 * @param {Function} props.onRestore - Restore button click handler
 * @param {Function} props.onReset - Reset state handler (for completed/error states)
 * @param {string} props.state - Current state machine state
 * @param {string} props.statusMessage - Current status message
 * @param {number} props.enabledCount - Number of enabled mods
 * @param {boolean} props.hasPython - Whether Python is available
 */
export default function ActionBar({ onImport, onRestore, onReset, state, statusMessage, enabledCount, hasPython }) {
  const isRunning = state === STATES.IMPORTING || state === STATES.RESTORING
  const isImporting = state === STATES.IMPORTING
  const isRestoring = state === STATES.RESTORING
  const isCompleted = state === STATES.COMPLETED
  const isError = state === STATES.ERROR
  const isIdle = state === STATES.IDLE

  // Determine which status icon to show
  const StatusIcon = () => {
    if (isRunning) return <SpinnerGap className="animate-spin" />
    if (isCompleted) return <CheckCircle weight="fill" className="text-green-400" />
    if (isError) return <Warning weight="fill" className="text-red-400" />
    return null
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">

      {/* ── Status Indicator (Floating above bar) ── */}
      <AnimatePresence mode="wait">
        {statusMessage && (
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.9 }}
            className={clsx(
              "absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border text-xs font-mono shadow-2xl whitespace-nowrap flex items-center gap-2",
              isError
                ? "bg-red-900/50 border-red-500/30 text-red-400"
                : isCompleted
                  ? "bg-green-900/50 border-green-500/30 text-green-400"
                  : "bg-zinc-900 border-white/10 text-gold-400"
            )}
          >
            <StatusIcon />
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Bar ── */}
      <div className="glass-panel flex items-center gap-2 p-2 rounded-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">

        {/* Restore Button */}
        <button
          onClick={onRestore}
          disabled={isRunning || !hasPython}
          className={clsx(
            "btn-magnetic flex items-center gap-2 px-5 py-3 rounded-full text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed group transition-colors",
            isRestoring
              ? "bg-amber-600/50 text-amber-100"
              : "bg-zinc-800 hover:bg-zinc-700"
          )}
        >
          {isRestoring ? (
            <SpinnerGap weight="bold" className="animate-spin" />
          ) : (
            <ArrowCounterClockwise weight="bold" className="group-hover:-rotate-45 transition-transform" />
          )}
          <span className="text-sm font-semibold tracking-wide">
            {isRestoring ? 'Restoring...' : 'Restore Originals'}
          </span>
        </button>

        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* Import Button */}
        <button
          onClick={onImport}
          disabled={isRunning || enabledCount === 0 || !hasPython}
          className={clsx(
            "btn-magnetic relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-full font-semibold tracking-wide shadow-lg transition-all",
            isRunning || enabledCount === 0 || !hasPython
              ? "bg-slate-500 opacity-50 cursor-not-allowed text-zinc-950"
              : "bg-gradient-to-r from-gold-400 to-gold-500 hover:shadow-[0_0_20px_rgba(232,166,52,0.4)] text-zinc-950"
          )}
        >
          {isImporting ? (
            <SpinnerGap weight="bold" className="animate-spin" />
          ) : (
            <MagicWand weight="fill" />
          )}

          <span className="relative z-10">
            {isImporting ? 'Weaving...' : `Import ${enabledCount} Mod${enabledCount === 1 ? '' : 's'}`}
          </span>

          {/* Inner highlight for 3D feel */}
          <div className="absolute inset-0 border-t border-white/40 rounded-full pointer-events-none" />
        </button>

        {/* Reset Button (shown after completed/error) */}
        <AnimatePresence>
          {(isCompleted || isError) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              onClick={onReset}
              className="ml-1 px-3 py-3 rounded-full bg-zinc-700 hover:bg-zinc-600 text-slate-300 transition-colors"
              title="Dismiss"
            >
              <span className="text-xs font-medium px-2">Dismiss</span>
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
