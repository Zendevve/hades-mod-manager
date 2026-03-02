import React, { useState, useEffect, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DownloadSimple, X, Link, Package, Sparkle, SpinnerGap, CheckCircle, Warning, Globe } from '@phosphor-icons/react'
import { clsx } from 'clsx'
import { useFocusTrap, useUniqueId } from '../hooks/useAccessibility'

// ─── URL Validation ──────────────────────────────────────────

/**
 * Validates URL format to prevent invalid download attempts
 * @param {string} url - The URL to validate
 * @returns {Object} Validation result with isValid and error properties
 */
function validateUrlFormat(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' }
  }

  const trimmedUrl = url.trim()

  if (trimmedUrl === '') {
    return { isValid: false, error: 'URL cannot be empty' }
  }

  let parsedUrl
  try {
    parsedUrl = new URL(trimmedUrl)
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format. Please enter a valid URL starting with http:// or https://' }
  }

  // Only allow HTTP and HTTPS protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return { isValid: false, error: `URL protocol "${parsedUrl.protocol}" is not allowed. Only HTTP and HTTPS are supported.` }
  }

  // Validate hostname exists
  if (!parsedUrl.hostname) {
    return { isValid: false, error: 'URL must include a valid hostname' }
  }

  // Check for suspicious characters
  const suspiciousPatterns = [
    /[<>"'\`]/,  // HTML/script injection chars
    /\s/,           // Whitespace in URL
    /\.\./,         // Path traversal attempt
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedUrl)) {
      return { isValid: false, error: 'URL contains invalid characters' }
    }
  }

  // Validate that it's likely a zip file or from a known source
  const isZipUrl = trimmedUrl.toLowerCase().endsWith('.zip') ||
    parsedUrl.pathname.toLowerCase().endsWith('.zip')

  if (!isZipUrl) {
    console.warn('URL does not appear to be a direct ZIP file link:', trimmedUrl)
  }

  return { isValid: true, url: trimmedUrl }
}

// ─── Curated Mods Data ───────────────────────────────────────

const CURATED_MODS = [
  {
    id: 'sjn-modutil',
    name: 'ModUtil',
    author: 'SGG Modding',
    description: 'Core utility mod required by almost all other Hades 1 mods. Provides unified hooking and utility functions.',
    localBundle: 'ModUtil',
    tags: ['Core', 'Framework', 'Required']
  },
  {
    id: 'ponyluis-ponysqol',
    name: "Pony's Quality of Life",
    author: 'PonyLuis',
    description: 'Various subtle improvements to gameplay without drastically altering balance or core mechanics.',
    url: 'https://github.com/PonyTheHorse/Pony_QOL/releases/latest/download/PonyQOL.zip',
    tags: ['QoL', 'Gameplay']
  },
  {
    id: 'magic-magicedits',
    name: 'MagicEdits',
    author: 'MagicGonads',
    description: 'Collection of gameplay tweaks and enhancements for a refined Hades experience.',
    url: 'https://github.com/MagicGonads/MagicEdits/releases/latest/download/MagicEdits.zip',
    tags: ['Gameplay', 'Enhancement']
  }
]

// ─── Component ───────────────────────────────────────────────

/**
 * ModDownloader Component
 * Modal dialog for discovering and installing mods
 * Fully accessible with focus trapping and ARIA attributes
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Handler to close the modal
 * @param {Function} props.onInstalled - Callback when installation completes
 */
function ModDownloader({ isOpen, onClose, onInstalled }) {
  const [activeTab, setActiveTab] = useState('discover')
  const [urlInput, setUrlInput] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [installStatus, setInstallStatus] = useState('')
  const [installProgress, setInstallProgress] = useState(0)
  const [errorStatus, setErrorStatus] = useState(null)

  // Accessibility IDs
  const dialogTitleId = useUniqueId('downloader-title')
  const dialogDescId = useUniqueId('downloader-desc')

  // Focus trap for modal
  const modalRef = useFocusTrap(isOpen)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUrlInput('')
      setInstallStatus('')
      setInstallProgress(0)
      setErrorStatus(null)
      setIsInstalling(false)
      setActiveTab('discover')
    }
  }, [isOpen])

  // Subscribe to download progress updates
  useEffect(() => {
    if (!isOpen) return

    const unsub = window.electronAPI.onDownloadStatus((data) => {
      setInstallStatus(data.status)
      setInstallProgress(data.progress)
    })
    return unsub
  }, [isOpen])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isInstalling) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isInstalling, onClose])

  // Handle mod installation
  const handleInstall = useCallback(async (modDef) => {
    if (!modDef) return

    const isLocal = typeof modDef === 'object' && modDef.localBundle
    const targetUrl = typeof modDef === 'string' ? modDef : modDef.url

    if (!isLocal && !targetUrl) return

    // Validate URL format before attempting download
    if (!isLocal && targetUrl) {
      const validation = validateUrlFormat(targetUrl)
      if (!validation.isValid) {
        setErrorStatus(validation.error)
        return
      }
    }

    setIsInstalling(true)
    setErrorStatus(null)
    setInstallStatus(isLocal ? `Installing bundled ${modDef.localBundle}...` : 'Initiating download...')
    setInstallProgress(isLocal ? -1 : 0)

    try {
      const res = isLocal
        ? await window.electronAPI.installLocalMod(modDef.localBundle)
        : await window.electronAPI.installModFromUrl(targetUrl)

      if (res.success) {
        setInstallStatus(`Successfully installed: ${res.modName}`)
        setInstallProgress(100)
        setTimeout(() => {
          onInstalled()
          onClose()
        }, 1500)
      } else {
        setErrorStatus(res.error || 'Installation failed')
        setIsInstalling(false)
      }
    } catch (err) {
      setErrorStatus(err.message || 'An unexpected error occurred')
      setIsInstalling(false)
    }
  }, [onInstalled, onClose])

  // Handle manual URL submission
  const handleManualSubmit = useCallback((e) => {
    e.preventDefault()

    const validation = validateUrlFormat(urlInput)
    if (!validation.isValid) {
      setErrorStatus(validation.error)
      return
    }

    handleInstall(urlInput)
  }, [urlInput, handleInstall])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isInstalling ? onClose : undefined}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 pointer-events-none z-[101] flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="pointer-events-auto w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              aria-describedby={dialogDescId}
            >
              {/* Header */}
              <header className="flex items-center justify-between p-6 border-b border-white/5 relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[60px] rounded-full pointer-events-none -translate-y-1/2"
                  aria-hidden="true"
                />

                <div>
                  <h2
                    id={dialogTitleId}
                    className="text-xl font-bold flex items-center gap-2"
                  >
                    <Sparkle weight="duotone" className="text-gold-400" aria-hidden="true" />
                    Get More Mods
                  </h2>
                  <p
                    id={dialogDescId}
                    className="text-sm text-slate-400 mt-1"
                  >
                    Discover curated mods or install directly from a URL.
                  </p>
                </div>

                <button
                  onClick={onClose}
                  disabled={isInstalling}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  aria-label="Close mod downloader"
                >
                  <X weight="bold" aria-hidden="true" />
                </button>
              </header>

              {/* Tabs */}
              <nav
                className="flex border-b border-white/5 px-6 pt-4 gap-6"
                role="tablist"
                aria-label="Installation method"
              >
                {[
                  { id: 'discover', label: 'Curated List' },
                  { id: 'direct', label: 'Direct URL' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => !isInstalling && setActiveTab(tab.id)}
                    disabled={isInstalling}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`tabpanel-${tab.id}`}
                    className={clsx(
                      "tab pb-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      activeTab === tab.id ? "tab-active" : "tab-inactive"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                      />
                    )}
                  </button>
                ))}
              </nav>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50 relative">

                {/* Status Overlay (shown during installation) */}
                <AnimatePresence>
                  {isInstalling && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-zinc-950/90 backdrop-blur-lg flex flex-col justify-center items-center z-50 rounded-b-3xl"
                      role="status"
                      aria-live="polite"
                      aria-label={installStatus}
                    >
                      <SpinnerGap
                        weight="bold"
                        className="w-12 h-12 text-gold-500 animate-spin mb-4"
                        aria-hidden="true"
                      />
                      <p className="text-slate-200 font-medium">{installStatus}</p>
                      {installProgress >= 0 && (
                        <div
                          className="w-64 h-2 bg-white/10 rounded-full mt-4 overflow-hidden relative"
                          role="progressbar"
                          aria-valuenow={installProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Download progress"
                        >
                          <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold-500 to-ember-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${installProgress}%` }}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {errorStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="alert-error mb-6"
                      role="alert"
                      aria-live="assertive"
                    >
                      <Warning weight="bold" className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      <p className="leading-relaxed">{errorStatus}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Curated List Tab */}
                {activeTab === 'discover' && (
                  <div
                    id="tabpanel-discover"
                    role="tabpanel"
                    aria-label="Curated mod list"
                    className="space-y-4"
                  >
                    <p className="text-xs text-slate-500 mb-4">
                      Recommended mods from the community. Click Install to add them to your game.
                    </p>

                    {CURATED_MODS.map(mod => (
                      <article
                        key={mod.id}
                        className="glass-panel p-4 rounded-2xl border border-white/5 flex gap-4 hover:border-white/10 hover:bg-white/[0.02] transition-colors group"
                      >
                        <div
                          className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-slate-400 group-hover:text-gold-400 transition-colors"
                          aria-hidden="true"
                        >
                          <Package weight="duotone" className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-slate-200 truncate pr-4">
                              {mod.name}
                            </h3>
                            <button
                              onClick={() => handleInstall(mod)}
                              disabled={isInstalling}
                              className="btn-primary text-xs py-1.5 px-3 shrink-0"
                              aria-label={`Install ${mod.name}`}
                            >
                              <DownloadSimple weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                              Install
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">by {mod.author}</p>
                          <p className="text-sm text-slate-400 leading-relaxed mb-3">
                            {mod.description}
                          </p>
                          <div
                            className="flex flex-wrap gap-2"
                            aria-label="Tags"
                          >
                            {mod.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-white/5 text-slate-500 border border-white/10"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* Direct URL Tab */}
                {activeTab === 'direct' && (
                  <form
                    id="tabpanel-direct"
                    role="tabpanel"
                    aria-label="Direct URL installation"
                    onSubmit={handleManualSubmit}
                    className="flex flex-col gap-4"
                  >
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
                      <div
                        className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-slate-400"
                        aria-hidden="true"
                      >
                        <Globe weight="duotone" className="w-6 h-6" />
                      </div>
                      <h3 className="text-slate-200 font-semibold mb-2">Direct Download</h3>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                        Paste a direct URL to a <code className="text-gold-400">.zip</code> file containing a Hades mod.
                        GitHub Release URLs work best.
                      </p>

                      <div className="relative flex items-center">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => {
                            setUrlInput(e.target.value)
                            if (errorStatus) setErrorStatus(null)
                          }}
                          placeholder="https://github.com/.../release.zip"
                          className={clsx(
                            "input pr-24",
                            errorStatus && "input-error"
                          )}
                          required
                          disabled={isInstalling}
                          aria-label="Mod ZIP file URL"
                          aria-invalid={!!errorStatus}
                          aria-describedby={errorStatus ? 'url-error' : undefined}
                        />
                        <button
                          type="submit"
                          disabled={isInstalling || !urlInput.trim()}
                          className="absolute right-2 px-4 py-1.5 bg-zinc-800 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                        >
                          Install
                        </button>
                      </div>

                      {errorStatus && (
                        <p id="url-error" className="sr-only" role="alert">
                          {errorStatus}
                        </p>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default memo(ModDownloader)
