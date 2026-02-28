import React from 'react'
import { motion } from 'framer-motion'
import { Flame, FolderOpen, MagnifyingGlass } from '@phosphor-icons/react'

export default function WelcomeScreen({ onSelectPath, onAutoDetect }) {
  return (
    <div className="relative z-10 w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-6 p-4">

      {/* ── Left Content: Branding / Info ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col justify-center pr-8"
      >
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/20 to-ember-500/20 text-gold-500 border border-gold-500/30 mb-8 shadow-[0_0_30px_rgba(232,166,52,0.15)]">
          <Flame weight="duotone" className="w-6 h-6" />
        </div>

        <h1 className="text-5xl font-sans tracking-tighter font-semibold mb-4 leading-[1.1] text-balance">
          Manage your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-gold-400 to-ember-500">Underworld</span>
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed max-w-[40ch] font-medium text-pretty mb-8">
          A high-performance GUI for the SGG-Mod-Format engine. Install, toggle, and restore mods effortlessly.
        </p>

        <div className="flex gap-2 text-xs font-mono text-slate-500 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
          System Ready
        </div>
      </motion.div>

      {/* ── Right Content: Action Cards ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="glass-panel rounded-[2rem] p-8 flex flex-col justify-center gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-ember-500/5 blur-[80px] rounded-full pointer-events-none" />

        <h2 className="text-sm font-semibold tracking-wide text-slate-300 mb-2 uppercase">Initialization</h2>

        <button
          onClick={onAutoDetect}
          className="btn-magnetic group flex flex-col gap-1 items-start w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
        >
          <div className="flex items-center gap-3 text-gold-400 mb-1">
            <MagnifyingGlass weight="duotone" className="w-5 h-5 text-gold-500 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-slate-200">Auto-Detect Game</span>
          </div>
          <p className="text-xs text-slate-400">Scans standard Steam installation paths for Hades.</p>
        </button>

        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <span className="relative bg-zinc-900 px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">OR</span>
        </div>

        <button
          onClick={onSelectPath}
          className="btn-magnetic group flex flex-col gap-1 items-start w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
        >
          <div className="flex items-center gap-3 text-slate-300 mb-1">
            <FolderOpen weight="duotone" className="w-5 h-5 text-slate-400 group-hover:text-slate-200 transition-colors" />
            <span className="font-semibold">Browse Manually</span>
          </div>
          <p className="text-xs text-slate-400">Select the Content folder in your game directory.</p>
        </button>

      </motion.div>
    </div>
  )
}
