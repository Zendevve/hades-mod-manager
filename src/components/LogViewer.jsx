import React, { useRef, useEffect, memo, useCallback } from 'react'
import { CaretUp, CaretDown, TerminalWindow, Trash, Download, Copy } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

/**
 * LogViewer Component
 * Collapsible terminal-style log viewer with real-time updates
 * Fully accessible with ARIA live regions and keyboard navigation
 *
 * @param {Object} props
 * @param {Array} props.logs - Array of log entries
 * @param {boolean} props.isOpen - Whether the viewer is expanded
 * @param {Function} props.onToggle - Handler to toggle visibility
 * @param {Function} props.onClear - Handler to clear logs
 */
function LogViewer({ logs, isOpen, onToggle, onClear }) {
  const scrollRef = useRef(null)
  const contentRef = useRef(null)

  // Auto-scroll to bottom when new logs arrive or when opened
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, isOpen])

  // Handle copying logs to clipboard
  const handleCopyLogs = useCallback(() => {
    const text = logs.map(log => log.text).join('')
    navigator.clipboard.writeText(text).catch(console.error)
  }, [logs])

  // Handle downloading logs
  const handleDownloadLogs = useCallback(() => {
    const text = logs.map(log => log.text).join('')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hades-mod-manager-logs-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [logs])

  return (
    <section
      className={clsx(
        "absolute bottom-0 left-0 right-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isOpen ? "h-[40vh]" : "h-0"
      )}
      role="region"
      aria-label="Log viewer"
      aria-expanded={isOpen}
    >
      {/* ── Toggle Handle ── */}
      <div className="absolute -top-10 right-8">
        <button
          onClick={onToggle}
          className="btn-magnetic flex items-center justify-center w-10 h-10 rounded-full glass-panel shadow-lg text-slate-400 hover:text-gold-400 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          aria-label={isOpen ? "Collapse log viewer" : "Expand log viewer"}
          aria-expanded={isOpen}
          aria-controls="log-content"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? 'open' : 'closed'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <CaretDown weight="bold" /> : <CaretUp weight="bold" />}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>

      {/* ── Console Body ── */}
      <div
        id="log-content"
        className="w-full h-full bg-zinc-1000 border-t border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative"
      >
        {/* Header Block */}
        <header className="h-10 border-b border-white/5 bg-zinc-950/50 flex items-center px-6 gap-3 shrink-0 justify-between">
          <div className="flex items-center gap-3">
            <TerminalWindow weight="duotone" className="text-slate-500" aria-hidden="true" />
            <h2 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
              Mod Engine Terminal
            </h2>
            {logs.length > 0 && (
              <span
                className="text-[10px] text-slate-600"
                aria-label={`${logs.length} log entries`}
              >
                ({logs.length} lines)
              </span>
            )}
          </div>

          {/* Log Actions */}
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <>
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  title="Copy logs to clipboard"
                  aria-label="Copy logs to clipboard"
                >
                  <Copy weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Copy</span>
                </button>

                <button
                  onClick={handleDownloadLogs}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  title="Download logs"
                  aria-label="Download logs"
                >
                  <Download weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" aria-hidden="true" />

                <button
                  onClick={onClear}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  title="Clear all logs"
                  aria-label="Clear all logs"
                >
                  <Trash weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed relative scroll-smooth"
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
          tabIndex={0}
        >
          {/* Top fade gradient */}
          <div
            className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-zinc-1000 to-transparent z-10 pointer-events-none"
            aria-hidden="true"
          />

          {/* Empty State */}
          {logs.length === 0 ? (
            <div
              className="text-slate-600 italic"
              role="status"
            >
              Waiting for Engine output...
            </div>
          ) : (
            /* Log Entries */
            <div ref={contentRef}>
              {logs.map((log, idx) => (
                <LogEntry key={idx} log={log} index={idx} />
              ))}
            </div>
          )}

          {/* Bottom fade gradient */}
          <div
            className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-1000 to-transparent z-10 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}

/**
 * LogEntry Sub-component
 * Renders a single log entry with appropriate styling
 */
function LogEntry({ log, index }) {
  const isError = log.type === 'stderr'

  return (
    <div
      className={clsx(
        "mb-1 break-words",
        isError ? 'text-red-400 selection:bg-red-500/30' : 'text-slate-400 selection:bg-gold-500/30'
      )}
      role="listitem"
    >
      {/* Timestamp and prefix */}
      <span
        className={clsx(
          "mr-2 opacity-50 select-none",
          isError ? 'text-red-500' : 'text-gold-500'
        )}
        aria-hidden="true"
      >
        ❯
      </span>

      {/* Log text - split by newlines for better formatting */}
      {log.text.split('\n').map((line, lineIdx) => (
        <span
          key={lineIdx}
          className="block pl-4 -indent-4"
        >
          {line || '\u00A0'}
        </span>
      ))}
    </div>
  )
}

export default memo(LogViewer)
