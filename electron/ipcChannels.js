/**
 * IPC Channel Constants
 * Centralized constants for all IPC communication between main and renderer processes
 */

// Settings
export const GET_SETTINGS = 'get-settings'
export const GET_CUSTOM_PATHS = 'get-custom-paths'
export const ADD_CUSTOM_PATH = 'add-custom-path'
export const REMOVE_CUSTOM_PATH = 'remove-custom-path'

// Python detection
export const REFRESH_PYTHON = 'refresh-python'
export const INSTALL_PYTHON = 'install-python'
export const PYTHON_INSTALL_STATUS = 'python-install-status'

// Game path
export const SELECT_GAME_PATH = 'select-game-path'
export const AUTO_DETECT_GAME = 'auto-detect-game'

// Mod management
export const SCAN_MODS = 'scan-mods'
export const TOGGLE_MOD = 'toggle-mod'

// Import / Restore
export const RUN_IMPORT = 'run-import'
export const RUN_RESTORE = 'run-restore'

// Log streaming (main -> renderer)
export const IMPORT_LOG = 'import-log'

// Mod Downloading
export const INSTALL_MOD_FROM_URL = 'install-mod-from-url'
export const INSTALL_LOCAL_MOD = 'install-local-mod'
export const DOWNLOAD_STATUS = 'download-status'
