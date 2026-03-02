import React, { useState, useCallback, useRef, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowsClockwise, FileArchive, CheckCircle, CircleDashed, Spinner } from '@phosphor-icons/react'
import { clsx } from 'clsx'

/**
 * ModList Component
 * Displays a scrollable list of installed mods with toggle functionality
 * Implements full keyboard navigation and ARIA accessibility
 *
 * @param {Object} props
 * @param {Array} props.mods - Array of mod objects
 * @param {Object} props.selectedMod - Currently selected mod
 * @param {Function} props.onSelectMod - Handler when a mod is selected
 * @param {Function} props.onToggleMod - Handler when a mod is toggled
 * @param {Function} props.onRefresh - Handler to refresh the mod list
 */
function ModList({ mods, selectedMod, onSelectMod, onToggleMod, onRefresh }) {
  // Track which mod is currently being toggled
  const [togglingMod, setTogglingMod] = useState(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const listRef = useRef(null)
  const debounceRef = useRef(null)
  const itemRefs = useRef([])

  // Sort: Enabled first, then alphabetically
  const sortedMods = useMemo(() => {
    return [...mods].sort((a, b) => {
      if (a.enabled && !b.enabled) return -1
      if (!a.enabled && b.enabled) return 1
      return a.name.localeCompare(b.name)
    })
  }, [mods])

  // Debounced toggle handler
  const handleToggle = useCallback((modName, enabled, event) => {
    // Prevent event bubbling to avoid selecting the mod
    event?.stopPropagation()

    // Prevent toggling if already toggling this mod
    if (togglingMod === modName) return

    // Clear any existing debounce timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set debounce timeout (300ms)
    debounceRef.current = setTimeout(async () => {
      setTogglingMod(modName)
      try {
        await onToggleMod(modName, enabled)
      } finally {
        setTogglingMod(null)
      }
    }, 300)
  }, [togglingMod, onToggleMod])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event, index) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (index < sortedMods.length - 1) {
          setFocusedIndex(index + 1)
          itemRefs.current[index + 1]?.focus()
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (index > 0) {
          setFocusedIndex(index - 1)
          itemRefs.current[index - 1]?.focus()
        }
        break
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        itemRefs.current[0]?.focus()
        break
      case 'End':
        event.preventDefault()
        setFocusedIndex(sortedMods.length - 1)
        itemRefs.current[sortedMods.length - 1]?.focus()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelectMod(sortedMods[index])
        break
      default:
        break
    }
  }, [sortedMods, onSelectMod])

  // Set ref for list item
  const setItemRef = useCallback((index) => (element) => {
    itemRefs.current[index] = element
  }, [])

  return (
    <aside
      className="w-[340px] flex flex-col glass-panel rounded-3xl overflow-hidden shrink-0"
      role="complementary"
      aria-label="Installed mods list"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-5 border-b border-white/5 bg-zinc-950/40">
        <h2 className="text-sm font-semibold tracking-wide text-slate-300">
          Installed Runes
          <span className="ml-2 text-xs text-slate-500 font-normal">
            ({mods.length})
          </span>
        </h2>
        <button
          onClick={onRefresh}
          className="btn-magnetic w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          title="Refresh mod list"
          aria-label="Refresh mod list"
        >
          <ArrowsClockwise weight="bold" size={14} aria-hidden="true" />
        </button>
      </header>

      {/* Mod List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        role="listbox"
        aria-label="Select a mod to view details"
      >
        {mods.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {sortedMods.map((mod, index) => (
              <motion.article
                layout
                layoutId={`mod-${mod.name}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                key={mod.name}
                ref={setItemRef(index)}
                className={clsx(
                  "group relative p-3 rounded-2xl cursor-pointer transition-all duration-200 border outline-none",
                  selectedMod?.name === mod.name
                    ? "bg-white/10 border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
                    : "bg-transparent border-transparent hover:bg-white/[0.03]",
                  "focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                )}
                onClick={() => onSelectMod(mod)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                tabIndex={0}
                role="option"
                aria-selected={selectedMod?.name === mod.name}
                aria-label={`${mod.name}, ${mod.enabled ? 'enabled' : 'disabled'}, ${mod.fileCount} files`}
              >
                {/* Active indicator animation */}
                {selectedMod?.name === mod.name && (
                  <motion.div
                    layoutId="active-highlight"
                    className="absolute inset-0 border-2 border-gold-500/30 rounded-2xl pointer-events-none"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    aria-hidden="true"
                  />
                )}

                <div className="flex items-center gap-3 relative z-10">
                  {/* Toggle Button */}
                  <button
                    onClick={(e) => handleToggle(mod.name, !mod.enabled, e)}
                    disabled={togglingMod === mod.name}
                    className={clsx(
                      "btn-magnetic relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-zinc-900 border border-white/5 shadow-inner transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
                      togglingMod === mod.name && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label={`${mod.enabled ? 'Disable' : 'Enable'} ${mod.name}`}
                    aria-pressed={mod.enabled}
                    aria-busy={togglingMod === mod.name}
                    role="switch"
                  >
                    <AnimatePresence mode="popLayout">
                      {togglingMod === mod.name ? (
                        <motion.div
                          key="loading"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute inset-0 flex items-center justify-center text-slate-400"
                        >
                          <Spinner weight="bold" size={18} className="animate-spin" aria-hidden="true" />
                        </motion.div>
                      ) : mod.enabled ? (
                        <motion.div
                          key="enabled"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center text-emerald-400"
                          aria-hidden="true"
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
                          aria-hidden="true"
                        >
                          <CircleDashed weight="bold" size={20} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>

                  {/* Mod Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={clsx(
                      "text-sm font-semibold truncate transition-colors",
                      mod.enabled ? "text-slate-200" : "text-slate-500"
                    )}>
                      {mod.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      <span>{mod.fileCount} files</span>
                      {mod.types?.length > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/10" aria-hidden="true" />
                          <span className="truncate">
                            {mod.types.slice(0, 2).join(' / ')}
                            {mod.types.length > 2 && '...'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        )}
      </div>
    </aside>
  )
}

/**
 * EmptyState Sub-component
 * Displayed when no mods are detected
 */
function EmptyState() {
  return (
    <div
      className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 py-12"
      role="status"
      aria-label="No mods detected"
    >
      <FileArchive
        size={32}
        weight="duotone"
        className="mb-3"
        aria-hidden="true"
      />
      <p className="text-xs font-medium text-center px-4">
        No mods detected.
      </p>
      <p className="text-[10px] text-slate-600 mt-1 text-center px-6">
        Use the "Get More Mods" button to install your first mod.
      </p>
    </div>
  )
}

export default memo(ModList)
