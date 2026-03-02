import React, { memo } from 'react'
import { MagicWand, ArrowCounterClockwise, SpinnerGap, CheckCircle, Warning } from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { STATES } from '../hooks/useModOperations'

/**
 * ActionBar Component
 * Floating action bar for import/restore operations with status indicators
 * Fully accessible with ARIA live regions and keyboard navigation
 *
 * @param {Object} props
 * @param {Function} props.onImport - Import button click handler
 * @param {Function} props.onRestore - Restore button click handler
 * @param {Function} props.onReset - Reset state handler (for completed/error states)
 * @param {string} props.state - Current state machine state
 * @param {string} props.statusMessage - Current status message
 * @param {number} props.enabledCount - Number of enabled mods
 * @param {boolean} props.hasPython - Whether Python is available
 */
function ActionBar({
  onImport,
  onRestore,
  onReset,
  state,
  statusMessage,
  enabledCount,
  hasPython
}) {
  const isRunning = state === STATES.IMPORTING || state === STATES.RESTORING
  const isImporting = state === STATES.IMPORTING
  const isRestoring = state === STATES.RESTORING
  const isCompleted = state === STATES.COMPLETED
  const isError = state === STATES.ERROR
  const isIdle = state === STATES.IDLE

  // Determine which status icon to show
  const StatusIcon = () => {
    if (isRunning) return <SpinnerGap className="animate-spin" weight="bold" aria-hidden="true" />
    if (isCompleted) return <CheckCircle weight="fill" className="text-emerald-400" aria-hidden="true" />
    if (isError) return <Warning weight="fill" className="text-red-400" aria-hidden="true" />
    return null
  }

  // Determine status styling
  const statusStyles = {
    error: "bg-red-900/50 border-red-500/30 text-red-400",
    completed: "bg-emerald-900/50 border-emerald-500/30 text-emerald-400",
    default: "bg-zinc-900 border-white/10 text-gold-400"
  }

  const currentStatusStyle = isError ? statusStyles.error
    : isCompleted ? statusStyles.completed
      : statusStyles.default

  return (
    <nav
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50"
      role="toolbar"
      aria-label="Mod operations"
    >
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
              currentStatusStyle
            )}
            role="status"
            aria-live={isError ? "assertive" : "polite"}
            aria-atomic="true"
          >
            <StatusIcon />
            <span>{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Action Bar ── */}
      <div
        className="glass-panel flex items-center gap-2 p-2 rounded-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
        role="group"
        aria-label="Primary actions"
      >
        {/* Restore Button */}
        <button
          onClick={isCompleted || isError ? onReset : onRestore}
          disabled={isRunning || (!hasPython && !isCompleted && !isError)}
          className={clsx(
            "btn-magnetic flex items-center gap-2 px-5 py-3 rounded-full text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed group transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
            isRestoring
              ? "bg-amber-600/50 text-amber-100"
              : "bg-zinc-800 hover:bg-zinc-700"
          )}
          aria-label={isRestoring ? 'Restoring original files' : isCompleted || isError ? 'Reset operation' : 'Restore original game files'}
          aria-busy={isRestoring}
        >
          {isRestoring ? (
            <SpinnerGap weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <ArrowCounterClockwise
              weight="bold"
              className="group-hover:-rotate-45 transition-transform"
              aria-hidden="true"
            />
          )}
          <span className="text-sm font-semibold tracking-wide">
            {isRestoring ? 'Restoring...' : isCompleted || isError ? 'Reset' : 'Restore Originals'}
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10 mx-1" aria-hidden="true" />

        {/* Import Button */}
        <button
          onClick={isCompleted || isError ? onReset : onImport}
          disabled={(isRunning || enabledCount === 0 || !hasPython) && !isCompleted && !isError}
          className={clsx(
            "btn-magnetic relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-full font-semibold tracking-wide shadow-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
            (isRunning || enabledCount === 0 || !hasPython) && !isCompleted && !isError
              ? "bg-slate-500 opacity-50 cursor-not-allowed text-zinc-950"
              : "bg-gradient-to-r from-gold-400 to-gold-500 hover:shadow-[0_0_20px_rgba(232,166,52,0.4)] text-zinc-950"
          )}
          aria-label={isImporting ? 'Importing mods' : isCompleted || isError ? 'Reset operation' : `Import ${enabledCount} enabled mod${enabledCount !== 1 ? 's' : ''}`}
          aria-busy={isImporting}
        >
          {isImporting ? (
            <SpinnerGap weight="bold" className="animate-spin" aria-hidden="true" />
          ) : (
            <MagicWand weight="fill" aria-hidden="true" />
          )}
          <span>
            {isImporting ? 'Importing...' : isCompleted || isError ? 'Done' : 'Import Mods'}
          </span>

          {/* Enabled count badge */}
          {!isRunning && !isCompleted && !isError && (
            <span
              className={clsx(
                "ml-1 px-2 py-0.5 rounded-full text-xs",
                enabledCount > 0 ? "bg-zinc-950/30" : "bg-zinc-950/20"
              )}
              aria-label={`${enabledCount} mods enabled`}
            >
              {enabledCount}
            </span>
          )}
        </button>
      </div>

      {/* Helper text for disabled state */}
      {!hasPython && isIdle && (
        <p
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap"
          role="note"
        >
          Python required for operations
        </p>
      )}

      {hasPython && enabledCount === 0 && isIdle && (
        <p
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap"
          role="note"
        >
          Enable at least one mod to import
        </p>
      )}
    </nav>
  )
}

export default memo(ActionBar)
