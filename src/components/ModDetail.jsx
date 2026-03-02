import React, { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileCode, Stack, Tag, BracketsAngle, Folder, FileText } from '@phosphor-icons/react'
import { clsx } from 'clsx'

/**
 * ModDetail Component
 * Displays detailed information about a selected mod
 * Fully accessible with semantic HTML and ARIA attributes
 *
 * @param {Object} props
 * @param {Object} props.mod - The selected mod object
 */
function ModDetail({ mod }) {
  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  }

  // Memoized file count display
  const fileCountDisplay = useMemo(() => {
    return `${mod.fileCount} ${mod.fileCount === 1 ? 'file' : 'files'}`
  }, [mod.fileCount])

  return (
    <motion.article
      variants={containerVars}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.98 }}
      className="h-full glass-panel rounded-3xl flex flex-col overflow-hidden relative"
      role="region"
      aria-label={`${mod.name} details`}
    >
      {/* ── Header ── */}
      <motion.header
        variants={itemVars}
        className="p-8 border-b border-white/5 relative z-10 shrink-0"
      >
        <div
          className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Mod Name */}
        <h2 className="text-3xl font-sans font-semibold tracking-tighter text-slate-100 mb-4 truncate text-balance">
          {mod.name}
        </h2>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {/* Enabled/Disabled Badge */}
          <StatusBadge
            enabled={mod.enabled}
            aria-label={`Mod status: ${mod.enabled ? 'enabled' : 'disabled'}`}
          />

          {/* Priority Badge */}
          {mod.priority && (
            <div
              className="badge-warning"
              role="status"
              aria-label={`Priority level ${mod.priority}`}
            >
              <Stack weight="bold" aria-hidden="true" />
              Priority {mod.priority}
            </div>
          )}

          {/* File Count Badge */}
          <div
            className="badge-neutral"
            role="status"
            aria-label={`Contains ${fileCountDisplay}`}
          >
            <FileCode weight="bold" aria-hidden="true" />
            {fileCountDisplay}
          </div>
        </div>
      </motion.header>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-8 relative z-10">

        {/* Targets & Types Grid */}
        <motion.div
          variants={itemVars}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8"
        >
          {/* Import Types Section */}
          <section
            className="p-5 rounded-2xl bg-zinc-950/50 border border-white/[0.02]"
            aria-labelledby="import-types-heading"
          >
            <h3
              id="import-types-heading"
              className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2"
            >
              <BracketsAngle weight="bold" aria-hidden="true" />
              Import Types
            </h3>
            <div className="flex flex-wrap gap-2">
              {mod.importTypes?.length > 0 ? (
                mod.importTypes.map(type => (
                  <span
                    key={type}
                    className="px-2 py-1 rounded bg-white/5 text-xs font-mono text-slate-300"
                  >
                    {type}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">None detected</span>
              )}
            </div>
          </section>

          {/* Target Files Section */}
          {mod.targets?.length > 0 && (
            <section
              className="p-5 rounded-2xl bg-zinc-950/50 border border-white/[0.02]"
              aria-labelledby="target-files-heading"
            >
              <h3
                id="target-files-heading"
                className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2"
              >
                <Tag weight="bold" aria-hidden="true" />
                Targeted Files
                <span className="text-slate-600 normal-case">
                  ({mod.targets.length})
                </span>
              </h3>
              <ul className="flex flex-col gap-1.5">
                {mod.targets.map(target => (
                  <li
                    key={target}
                    className="text-xs font-mono text-slate-300 truncate bg-white/[0.02] px-2 py-1 rounded flex items-center gap-2"
                  >
                    <FileText weight="bold" className="text-slate-500 flex-shrink-0" size={12} />
                    {target}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </motion.div>

        {/* Raw Modfile */}
        <motion.section variants={itemVars}>
          <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
            <Folder weight="bold" aria-hidden="true" />
            modfile.txt Source
          </h3>
          <div className="relative group">
            <div
              className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-ember-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-md -z-10"
              aria-hidden="true"
            />
            <pre
              className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap"
              tabIndex={0}
              aria-label="Mod configuration file contents"
            >
              {mod.raw || 'No modfile.txt content available.'}
            </pre>
          </div>
        </motion.section>

        {/* Additional Mod Info */}
        {mod.description && (
          <motion.section variants={itemVars} className="mt-8">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">
              Description
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {mod.description}
            </p>
          </motion.section>
        )}
      </div>
    </motion.article>
  )
}

/**
 * StatusBadge Component
 * Displays enabled/disabled status with appropriate styling
 */
function StatusBadge({ enabled }) {
  if (enabled) {
    return (
      <div
        className="badge-success"
        role="status"
        aria-label="Mod is enabled"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
        Active
      </div>
    )
  }

  return (
    <div
      className="badge-neutral"
      role="status"
      aria-label="Mod is disabled"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden="true" />
      Disabled
    </div>
  )
}

export default memo(ModDetail)
