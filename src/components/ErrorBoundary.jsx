import React from 'react'
import { Warning, ArrowClockwise, Bug } from '@phosphor-icons/react'

/**
 * Error Boundary Component
 * Catches React component errors and displays a user-friendly error UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
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
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-500/10 border-b border-red-500/20 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Warning weight="duotone" className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-100">Something went wrong</h1>
                  <p className="text-sm text-slate-400">The application encountered an unexpected error</p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6 space-y-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <Bug weight="duotone" className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Error Details</span>
                </div>
                <p className="text-sm text-slate-300 font-mono break-all">
                  {this.state.error?.toString() || 'Unknown error'}
                </p>
              </div>

              {this.state.errorInfo && (
                <details className="group">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors select-none">
                    View component stack trace
                  </summary>
                  <pre className="mt-3 p-3 bg-black/50 rounded-lg text-xs text-slate-400 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gold-500 hover:bg-gold-400 text-zinc-950 font-semibold rounded-xl transition-colors"
                >
                  <ArrowClockwise weight="bold" className="w-4 h-4" />
                  Reload Application
                </button>
                <button
                  onClick={this.handleReset}
                  className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Try Again
                </button>
              </div>

              <p className="text-xs text-slate-500 text-center">
                If the problem persists, please check the console for more details or report the issue.
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Render children normally
    return this.props.children
  }
}

export default ErrorBoundary
