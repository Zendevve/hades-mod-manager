import React, { useRef, useEffect } from 'react'
import { CaretUp, CaretDown, TerminalWindow } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

export default function LogViewer({ logs, isOpen, onToggle }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, isOpen])

  return (
    <div className={clsx(
      "absolute bottom-0 left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
      isOpen ? "h-[40vh]" : "h-0"
    )}>

      {/* ── Toggle Handle ── */}
      <div className="absolute -top-10 right-8">
        <button
          onClick={onToggle}
          className="btn-magnetic flex items-center justify-center w-10 h-10 rounded-full glass-panel shadow-lg text-slate-400 hover:text-gold-400 hover:bg-white/10"
        >
          {isOpen ? <CaretDown weight="bold" /> : <CaretUp weight="bold" />}
        </button>
      </div>

      {/* ── Console Body ── */}
      <div className="w-full h-full bg-[#050505] border-t border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative">

        {/* Header Block */}
        <div className="h-10 border-b border-white/5 bg-zinc-950/50 flex items-center px-6 gap-3 shrink-0">
          <TerminalWindow weight="duotone" className="text-slate-500" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
            Mod Engine Terminal
          </span>
        </div>

        {/* Content Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed relative"
        >
          <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#050505] to-transparent z-10" />

          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Waiting for Engine output...</div>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={clsx(
                  "mb-1 break-words",
                  log.type === 'stderr' ? 'text-ember-400 selection:bg-ember-500/30' : 'text-slate-400 selection:bg-gold-500/30'
                )}
              >
                {/* Prefix arrow for terminal feel */}
                <span className={clsx("mr-2 opacity-50", log.type === 'stderr' ? 'text-ember-500' : 'text-gold-500')}>❯</span>
                {log.text.split('\n').map((line, lIdx) => (
                  <span key={lIdx} className="block pl-4 -indent-4">
                    {line}
                  </span>
                ))}
              </div>
            ))
          )}

          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#050505] to-transparent z-10" />
        </div>
      </div>

    </div>
  )
}
