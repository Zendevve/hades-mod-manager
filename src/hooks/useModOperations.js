import { useState, useCallback, useRef, useMemo } from 'react'

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
  [STATES.COMPLETED]: 'Operation completed successfully',
  [STATES.ERROR]: '' // Error message is dynamic
}

/**
 * Custom hook for managing mod import/restore operations with a state machine
 * Provides type-safe state management with transition guards
 *
 * @returns {Object} State machine interface
 */
export function useModOperations() {
  const [state, setState] = useState(STATES.IDLE)
  const [errorMessage, setErrorMessage] = useState('')
  const [operation, setOperation] = useState(null)
  const [result, setResult] = useState(null)
  const [startTime, setStartTime] = useState(null)

  // Use ref to track pending operations for race condition prevention
  const isTransitioning = useRef(false)
  const transitionHistory = useRef([])

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
      const previousState = state
      setState(nextState)

      // Handle payload based on action type
      switch (action) {
        case 'error':
          setErrorMessage(payload.message || 'An error occurred')
          break
        case 'reset':
          setErrorMessage('')
          setResult(null)
          setOperation(null)
          setStartTime(null)
          break
        case 'complete':
          setResult(payload.result || null)
          break
        case 'startImport':
        case 'startRestore':
          setStartTime(Date.now())
          break
        default:
          break
      }

      // Log transition for debugging
      const transitionRecord = {
        from: previousState,
        to: nextState,
        action,
        timestamp: Date.now()
      }
      transitionHistory.current.push(transitionRecord)

      // Keep only last 100 transitions
      if (transitionHistory.current.length > 100) {
        transitionHistory.current = transitionHistory.current.slice(-100)
      }

      console.log(`[StateMachine] ${previousState} -> ${nextState} (${action})`)
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

  // ─────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────────────────

  const isRunning = useMemo(() =>
    state === STATES.IMPORTING || state === STATES.RESTORING,
    [state]
  )

  const isImporting = useMemo(() =>
    state === STATES.IMPORTING,
    [state]
  )

  const isRestoring = useMemo(() =>
    state === STATES.RESTORING,
    [state]
  )

  const isIdle = useMemo(() =>
    state === STATES.IDLE,
    [state]
  )

  const isCompleted = useMemo(() =>
    state === STATES.COMPLETED,
    [state]
  )

  const isError = useMemo(() =>
    state === STATES.ERROR,
    [state]
  )

  const statusMessage = useMemo(() => {
    if (state === STATES.ERROR) {
      return `Error: ${errorMessage}`
    }
    return STATUS_MESSAGES[state]
  }, [state, errorMessage])

  const elapsedTime = useMemo(() => {
    if (!startTime || isIdle) return null
    return Date.now() - startTime
  }, [startTime, isIdle, state])

  const canStartOperation = useMemo(() =>
    isIdle && !isTransitioning.current,
    [isIdle]
  )

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
    isIdle,
    isCompleted,
    isError,
    canStartOperation,
    statusMessage,
    elapsedTime,
    transitionHistory: transitionHistory.current,

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
