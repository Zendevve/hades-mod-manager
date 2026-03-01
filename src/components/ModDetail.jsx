import React from 'react'
import { motion } from 'framer-motion'
import { FileCode, Stack, Tag, BracketsAngle } from '@phosphor-icons/react'
import clsx from 'clsx'

export default function ModDetail({ mod }) {
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  }

  const itemVars = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div
      variants={containerVars}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.98 }}
      className="h-full glass-panel rounded-3xl flex flex-col overflow-hidden relative"
    >

      {/* ── Header ── */}
      <motion.div variants={itemVars} className="p-8 border-b border-white/5 relative z-10 shrink-0">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <h2 className="text-3xl font-sans font-semibold tracking-tighter text-slate-100 mb-4 truncate text-balance">
          {mod.name}
        </h2>

        <div className="flex flex-wrap gap-2">
          {mod.enabled ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 border border-white/5 text-slate-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Disabled
            </div>
          )}

          {mod.priority && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
              <Stack weight="bold" />
              Priority {mod.priority}
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
            <FileCode weight="bold" />
            {mod.fileCount} Files
          </div>
        </div>
      </motion.div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-8 relative z-10">

        {/* Targets & Types Grid */}
        <motion.div variants={itemVars} className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

          <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/[0.02]">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
              <BracketsAngle weight="bold" /> Import Types
            </h3>
            <div className="flex flex-wrap gap-2">
              {mod.types.length > 0 ? mod.types.map(t => (
                <span key={t} className="px-2 py-1 rounded bg-white/5 text-xs font-mono text-slate-300">
                  {t}
                </span>
              )) : <span className="text-sm text-slate-500">None detected</span>}
            </div>
          </div>

          {mod.targets.length > 0 && (
            <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/[0.02]">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
                <Tag weight="bold" /> Targeted Files
              </h3>
              <div className="flex flex-col gap-1.5">
                {mod.targets.map(t => (
                  <div key={t} className="text-xs font-mono text-slate-300 truncate bg-white/[0.02] px-2 py-1 rounded">
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>

        {/* Raw Modfile */}
        <motion.div variants={itemVars}>
          <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-4">
            modfile.txt Source
          </h3>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-ember-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-md -z-10" />
            <pre className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap">
              {mod.rawModfile || 'No modfile.txt active.'}
            </pre>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
