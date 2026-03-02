import React from 'react'
import { Warning, ArrowClockwise, Bug, FileText, CaretDown, CaretUp } from '@phosphor-icons/react'
import { clsx } from 'clsx'

/**
 * Error Boundary Component
 * Catches React component errors and displays a user-friendly error UI
 * Implements accessibility best practices with ARIA attributes
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error)
    console.error('Component stack:', errorInfo.componentStack)

    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Optionally report to error tracking service
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    })
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <main
          className="min-h-screen bg-zinc-950 flex items-center justify-center p-6"
          role="alert"
          aria-live="assertive"
          aria-label="Application error"
        >
          <article className="max-w-lg w-full bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <header className="bg-red-500/10 border-b border-red-500/20 p-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Warning weight="duotone" className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-100">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-slate-400">
                    The application encountered an unexpected error
                  </p>
                </div>
              </div>
            </header>

            {/* Error Details */}
            <div className="p-6 space-y-4">
              {/* Error Message Card */}
              <section
                className="bg-black/30 rounded-xl p-4 border border-white/5"
                aria-labelledby="error-message-heading"
              >
                <h2
                  id="error-message-heading"
                  className="flex items-center gap-2 mb-2 text-red-400 text-sm font-semibold uppercase tracking-wider"
                >
                  <Bug weight="duotone" className="w-4 h-4" aria-hidden="true" />
                  Error Details
                </h2>
                <p className="text-sm text-slate-300 font-mono break-all">
                  {this.state.error?.toString() || 'Unknown error'}
                </p>
              </section>

              {/* Stack Trace (Collapsible) */}
              {this.state.errorInfo && (
                <details
                  className="group"
                  open={this.state.showDetails}
                >
                  <summary
                    className="flex items-center justify-between text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors select-none p-2 rounded-lg hover:bg-white/5"
                    onClick={(e) => {
                      e.preventDefault()
                      this.toggleDetails()
                    }}
                    aria-expanded={this.state.showDetails}
                    aria-controls="stack-trace-content"
                  >
                    <span className="flex items-center gap-2">
                      <FileText weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
                      View component stack trace
                    </span>
                    {this.state.showDetails ? (
                      <CaretUp weight="bold" className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <CaretDown weight="bold" className="w-4 h-4" aria-hidden="true" />
                    )}
                  </summary>
                  <pre
                    id="stack-trace-content"
                    className="mt-3 p-3 bg-black/50 rounded-lg text-xs text-slate-400 font-mono overflow-x-auto max-h-48 overflow-y-auto"
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <nav
                className="flex gap-3 pt-2"
                aria-label="Error recovery options"
              >
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-400 text-zinc-950 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  <ArrowClockwise weight="bold" className="w-4 h-4" aria-hidden="true" />
                  Reload Application
                </button>
                <button
                  onClick={this.handleReset}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  Try Again
                </button>
              </nav>

              {/* Footer Message */}
              <footer>
                <p className="text-xs text-slate-500 text-center">
                  If the problem persists, please check the console for more details or report the issue.
                </p>
              </footer>
            </div>
          </article>
        </main>
      )
    }

    // Render children normally
    return this.props.children
  }
}

export default ErrorBoundary
