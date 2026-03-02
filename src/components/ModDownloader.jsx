import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DownloadSimple, MagnifyingGlass, X, Link, Package, Sparkle, SpinnerGap } from '@phosphor-icons/react'
import clsx from 'clsx'

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

  // Check for suspicious characters that might indicate injection attempts
  const suspiciousPatterns = [
    /[<>\"'\`]/,  // HTML/script injection chars
    /\s/,           // Whitespace in URL
    /\.\./,         // Path traversal attempt
    /\/\//,         // Double slash (potential confusion)
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
    // Warn but don't block - could be a redirect URL
    console.warn('URL does not appear to be a direct ZIP file link:', trimmedUrl)
  }

  return { isValid: true, url: trimmedUrl }
}

// ─── Dummy Curated List (Later can be fetched from a raw JSON on GH)
const CURATED_MODS = [
  {
    id: 'sjn-modutil',
    name: 'ModUtil',
    author: 'SGG Modding',
    description: 'Core utility mod required by almost all other Hades 1 mods. Provides unified hooking and utility functions.',
    localBundle: 'ModUtil', // Install from local source instead of URL
    tags: ['Core', 'Framework']
  },
  {
    id: 'ponyluis-ponysqol',
    name: "Pony's Quality of Life",
    author: 'Pony',
    description: 'Various subtle improvements to gameplay without drastically altering balance or core mechanics.',
    url: 'https://github.com/PonyTheHorse/Pony_QOL/releases/latest/download/PonyQOL.zip',
    tags: ['QoL']
  }
]

export default function ModDownloader({ isOpen, onClose, onInstalled }) {
  const [activeTab, setActiveTab] = useState('discover') // 'discover' | 'direct'
  const [urlInput, setUrlInput] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [installStatus, setInstallStatus] = useState('')
  const [installProgress, setInstallProgress] = useState(0)
  const [errorStatus, setErrorStatus] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setUrlInput('')
      setInstallStatus('')
      setInstallProgress(0)
      setErrorStatus(null)
      setIsInstalling(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const unsub = window.electronAPI.onDownloadStatus((data) => {
        setInstallStatus(data.status)
        setInstallProgress(data.progress)
      })
      return unsub
    }
  }, [isOpen])

  const handleInstallUrl = async (modDef) => {
    if (!modDef) return

    // modDef can be a stringent url string, or an object containing localBundle or url
    const isLocal = typeof modDef === 'object' && modDef.localBundle
    const targetUrl = typeof modDef === 'string' ? modDef : modDef.url

    if (!isLocal && !targetUrl) return

    // Validate URL format before attempting download (for non-local mods)
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
    setInstallProgress(isLocal ? -1 : 0) // indeterminate for local copy

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
        setErrorStatus(res.error)
        setIsInstalling(false)
      }
    } catch (err) {
      setErrorStatus(err.message)
      setIsInstalling(false)
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()

    // Validate URL before submission
    const validation = validateUrlFormat(urlInput)
    if (!validation.isValid) {
      setErrorStatus(validation.error)
      return
    }

    handleInstallUrl(urlInput)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isInstalling ? onClose : undefined}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 pointer-events-none z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="pointer-events-auto w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[60px] rounded-full pointer-events-none -translate-y-1/2" />

                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sparkle weight="duotone" className="text-gold-400" />
                    Get More Mods
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Discover curated mods or install directly from a URL.</p>
                </div>

                <button
                  onClick={onClose}
                  disabled={isInstalling}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X weight="bold" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/5 px-6 pt-4 gap-6">
                {['discover', 'direct'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={isInstalling}
                    className={clsx(
                      "pb-3 text-sm font-semibold tracking-wide capitalize relative px-2 transition-colors",
                      activeTab === tab ? "text-gold-400" : "text-slate-500 hover:text-slate-300",
                      isInstalling && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {tab === 'discover' ? 'Curated List' : 'Direct URL'}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50">

                {/* Status Overlay */}
                <AnimatePresence>
                  {isInstalling && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-zinc-950/90 backdrop-blur-lg flex flex-col justify-center items-center z-50 rounded-b-3xl"
                    >
                      <SpinnerGap weight="bold" className="w-12 h-12 text-gold-500 animate-spin mb-4" />
                      <p className="text-slate-200 font-medium">{installStatus}</p>
                      {installProgress >= 0 && (
                        <div className="w-64 h-2 bg-white/10 rounded-full mt-4 overflow-hidden relative">
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

                {errorStatus && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                    <span className="mt-0.5">⚠️</span>
                    <p className="leading-relaxed">{errorStatus}</p>
                  </div>
                )}

                {activeTab === 'discover' ? (
                  <div className="space-y-4">
                    {CURATED_MODS.map(mod => (
                      <div key={mod.id} className="glass-panel p-4 rounded-2xl border border-white/5 flex gap-4 hover:border-white/10 hover:bg-white-[0.02] transition-colors group">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-slate-400 group-hover:text-gold-400 transition-colors">
                          <Package weight="duotone" className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-slate-200 truncate pr-4">{mod.name}</h3>
                            <button
                              onClick={() => handleInstallUrl(mod)}
                              className="btn-magnetic px-3 py-1.5 text-xs font-semibold rounded-full bg-gold-500 text-zinc-950 hover:bg-gold-400 flex items-center gap-1.5 shrink-0"
                            >
                              <DownloadSimple weight="bold" />
                              Install
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">by {mod.author}</p>
                          <p className="text-sm text-slate-400 leading-relaxed mb-3">{mod.description}</p>
                          <div className="flex gap-2">
                            {mod.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold bg-white/5 text-slate-500 border border-white/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-slate-400">
                        <Link weight="duotone" className="w-6 h-6" />
                      </div>
                      <h3 className="text-slate-200 font-semibold mb-2">Direct Download</h3>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                        Paste a direct URL to a `.zip` file containing a Hades mod. GitHub Release URLs work best.
                      </p>

                      <div className="relative flex items-center">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => {
                            setUrlInput(e.target.value)
                            // Clear error when user starts typing
                            if (errorStatus) setErrorStatus(null)
                          }}
                          placeholder="https://github.com/.../release.zip"
                          className={clsx(
                            "flex-1 bg-black/50 border rounded-xl py-3 pl-4 pr-32 text-slate-300 placeholder:text-slate-600 focus:outline-none transition-colors",
                            errorStatus
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-white/10 focus:border-gold-500/50"
                          )}
                          required
                        />
                        <button
                          type="submit"
                          className="absolute right-2 px-4 py-1.5 bg-zinc-800 hover:bg-white/10 rounded-lg text-sm font-semibold text-slate-300 transition-colors"
                        >
                          Install
                        </button>
                      </div>
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
