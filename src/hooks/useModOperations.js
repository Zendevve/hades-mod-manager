import { useState, useCallback, useRef } from 'react'

/**
 * Mod Operations State Machine
 *
 * States: 'idle', 'importing', 'restoring', 'completed', 'error'
 * Actions: 'startImport', 'startRestore', 'complete', 'error', 'reset'
 *
 * Valid transitions:
 * - idle -> importing (startImport)
 * - idle -> restoring (startRestore)
 * - importing -> completed (complete)
 * - importing -> error (error)
 * - restoring -> completed (complete)
 * - restoring -> error (error)
 * - completed -> idle (reset)
 * - error -> idle (reset)
 */

export const STATES = {
  IDLE: 'idle',
  IMPORTING: 'importing',
  RESTORING: 'restoring',
  COMPLETED: 'completed',
  ERROR: 'error'
}

export const OPERATIONS = {
  IMPORT: 'import',
  RESTORE: 'restore'
}

// Valid state transitions
const TRANSITIONS = {
  [STATES.IDLE]: {
    startImport: STATES.IMPORTING,
    startRestore: STATES.RESTORING
  },
  [STATES.IMPORTING]: {
    complete: STATES.COMPLETED,
    error: STATES.ERROR
  },
  [STATES.RESTORING]: {
    complete: STATES.COMPLETED,
    error: STATES.ERROR
  },
  [STATES.COMPLETED]: {
    reset: STATES.IDLE
  },
  [STATES.ERROR]: {
    reset: STATES.IDLE
  }
}

// Status messages for each state
const STATUS_MESSAGES = {
  [STATES.IDLE]: '',
  [STATES.IMPORTING]: 'Importing mods...',
  [STATES.RESTORING]: 'Restoring original files...',
  [STATES.COMPLETED]: 'Operation completed',
  [STATES.ERROR]: '' // Error message is dynamic
}

/**
 * Custom hook for managing mod import/restore operations with a state machine
 * @returns {Object} State machine interface
 */
export function useModOperations() {
  const [state, setState] = useState(STATES.IDLE)
  const [errorMessage, setErrorMessage] = useState('')
  const [operation, setOperation] = useState(null)
  const [result, setResult] = useState(null)

  // Use ref to track pending operations for race condition prevention
  const isTransitioning = useRef(false)

  /**
   * Attempt a state transition
   * @param {string} action - The action to perform
   * @param {Object} payload - Optional payload (e.g., error message)
   * @returns {boolean} Whether the transition was successful
   */
  const transition = useCallback((action, payload = {}) => {
    // Prevent concurrent transitions
    if (isTransitioning.current) {
      console.warn(`[StateMachine] Transition blocked: already transitioning`)
      return false
    }

    const nextState = TRANSITIONS[state]?.[action]

    if (!nextState) {
      console.warn(`[StateMachine] Invalid transition: ${state} -> ${action}`)
      return false
    }

    isTransitioning.current = true

    try {
      setState(nextState)

      if (action === 'error') {
        setErrorMessage(payload.message || 'An error occurred')
      } else if (action === 'reset') {
        setErrorMessage('')
        setResult(null)
        setOperation(null)
      } else if (action === 'complete') {
        setResult(payload.result || null)
      }

      console.log(`[StateMachine] ${state} -> ${nextState} (${action})`)
      return true
    } finally {
      // Small delay to ensure state updates have processed
      setTimeout(() => {
        isTransitioning.current = false
      }, 0)
    }
  }, [state])

  /**
   * Start an import operation
   * @returns {boolean} Whether the operation was started
   */
  const startImport = useCallback(() => {
    const success = transition('startImport')
    if (success) {
      setOperation(OPERATIONS.IMPORT)
    }
    return success
  }, [transition])

  /**
   * Start a restore operation
   * @returns {boolean} Whether the operation was started
   */
  const startRestore = useCallback(() => {
    const success = transition('startRestore')
    if (success) {
      setOperation(OPERATIONS.RESTORE)
    }
    return success
  }, [transition])

  /**
   * Mark the current operation as completed
   * @param {Object} operationResult - The result of the operation
   * @returns {boolean} Whether the transition was successful
   */
  const complete = useCallback((operationResult) => {
    return transition('complete', { result: operationResult })
  }, [transition])

  /**
   * Mark the current operation as failed
   * @param {string} message - Error message
   * @returns {boolean} Whether the transition was successful
   */
  const error = useCallback((message) => {
    return transition('error', { message })
  }, [transition])

  /**
   * Reset the state machine to idle
   * @returns {boolean} Whether the transition was successful
   */
  const reset = useCallback(() => {
    return transition('reset')
  }, [transition])

  /**
   * Check if any operation is currently running
   * @returns {boolean}
   */
  const isRunning = state === STATES.IMPORTING || state === STATES.RESTORING

  /**
   * Check if currently importing
   * @returns {boolean}
   */
  const isImporting = state === STATES.IMPORTING

  /**
   * Check if currently restoring
   * @returns {boolean}
   */
  const isRestoring = state === STATES.RESTORING

  /**
   * Get the current status message
   * @returns {string}
   */
  const statusMessage = state === STATES.ERROR
    ? `Error: ${errorMessage}`
    : STATUS_MESSAGES[state]

  return {
    // State
    state,
    operation,
    result,
    errorMessage,

    // Computed values
    isRunning,
    isImporting,
    isRestoring,
    isIdle: state === STATES.IDLE,
    isCompleted: state === STATES.COMPLETED,
    isError: state === STATES.ERROR,
    statusMessage,

    // Actions
    startImport,
    startRestore,
    complete,
    error,
    reset,

    // Raw transition for advanced use cases
    transition
  }
}

export default useModOperations
