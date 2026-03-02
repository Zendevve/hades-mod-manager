import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

/**
 * Application Entry Point
 *
 * Initializes the React application with:
 * - StrictMode for highlighting potential problems
 * - ErrorBoundary for graceful error handling
 * - Proper accessibility configuration
 */

// Create root with React 18 createRoot API
const root = ReactDOM.createRoot(document.getElementById('root'))

// Configure error handler for boundary
const handleAppError = (error, errorInfo) => {
  // Log to console for development
  console.error('Application Error:', error)
  console.error('Component Stack:', errorInfo.componentStack)

  // Could also send to error tracking service here
  // e.g., Sentry, LogRocket, etc.
}

// Render application
root.render(
  <React.StrictMode>
    <ErrorBoundary onError={handleAppError}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

// Add helpful console message for developers
if (import.meta.env.DEV) {
  console.log('%c🔱 Hades Mod Manager', 'color: #e8a634; font-size: 24px; font-weight: bold;')
  console.log('%cDevelopment Mode', 'color: #64748b; font-size: 12px;')
}
