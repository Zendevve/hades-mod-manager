# Hades Mod Manager API Reference

Complete API documentation for the Hades Mod Manager application.

## Table of Contents

- [Overview](#overview)
- [IPC Channels](#ipc-channels)
- [Renderer API (window.electronAPI)](#renderer-api-windowelectronapi)
- [Main Process API](#main-process-api)
- [ModEngine API](#modengine-api)
- [Settings API](#settings-api)
- [React Hooks](#react-hooks)
- [Type Definitions](#type-definitions)

---

## Overview

The Hades Mod Manager uses Electron's IPC (Inter-Process Communication) for communication between the main process (Node.js/Electron backend) and renderer process (React frontend).

**Architecture:**
- **Main Process** ([`main.js`](../electron/main.js)): Handles file system operations, Python execution, and mod management
- **Preload Script** ([`preload.js`](../electron/preload.js)): Securely exposes APIs to the renderer process
- **Renderer Process** (React): User interface that calls exposed APIs via `window.electronAPI`

---

## IPC Channels

IPC channel constants defined in [`ipcChannels.js`](../electron/ipcChannels.js).

### Settings Channels

| Channel | Direction | Description |
|---------|-----------|-------------|
| `get-settings` | Renderer → Main | Get current application settings |
| `get-custom-paths` | Renderer → Main | Get user-defined custom game detection paths |
| `add-custom-path` | Renderer → Main | Add a custom game detection path |
| `remove-custom-path` | Renderer → Main | Remove a custom game detection path |

### Python Detection

| Channel | Direction | Description |
|---------|-----------|-------------|
| `refresh-python` | Renderer → Main | Refresh Python detection on demand |

### Game Path

| Channel | Direction | Description |
|---------|-----------|-------------|
| `select-game-path` | Renderer → Main | Open folder dialog to select Hades Content folder |
| `auto-detect-game` | Renderer → Main | Auto-detect Hades installation from configured paths |

### Mod Management

| Channel | Direction | Description |
|---------|-----------|-------------|
| `scan-mods` | Renderer → Main | Scan the Mods directory for all installed mods |
| `toggle-mod` | Renderer → Main | Enable or disable a mod by renaming its directory |

### Import / Restore

| Channel | Direction | Description |
|---------|-----------|-------------|
| `run-import` | Renderer → Main | Run modimporter.py to apply all enabled mods |
| `run-restore` | Renderer → Main | Run modimporter.py --clean to restore original files |

### Log Streaming (Main → Renderer)

| Channel | Direction | Description |
|---------|-----------|-------------|
| `import-log` | Main → Renderer | Stream stdout/stderr from Python processes |

### Mod Downloading

| Channel | Direction | Description |
|---------|-----------|-------------|
| `install-mod-from-url` | Renderer → Main | Download and install a mod from URL |
| `install-local-mod` | Renderer → Main | Install a bundled mod from SGG-Mod-Format |
| `download-status` | Main → Renderer | Progress updates for mod downloads |

---

## Renderer API (window.electronAPI)

The [`preload.js`](../electron/preload.js) exposes these methods to the renderer process via `window.electronAPI`.

### Settings Methods

#### `getSettings()`
Retrieves current application settings.

**Returns:** `Promise<Settings>`

```javascript
// Example usage
const settings = await window.electronAPI.getSettings();
// Returns:
// {
//   gamePath: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Hades\\Content",
//   pythonPath: {
//     found: true,
//     command: "python",
//     version: "Python 3.10.4"
//   }
// }
```

#### `getCustomPaths()`
Gets user-defined custom game detection paths.

**Returns:** `Promise<string[]>`

```javascript
const customPaths = await window.electronAPI.getCustomPaths();
// Returns: ["D:\\Games\\Hades\\Content", "E:\\SteamLibrary\\steamapps\\common\\Hades\\Content"]
```

#### `addCustomPath(customPath)`
Adds a custom game detection path.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `customPath` | `string` | Absolute path to Content folder |

**Returns:** `Promise<{success: boolean, paths: string[], message?: string}>`

```javascript
const result = await window.electronAPI.addCustomPath("D:\\Games\\Hades\\Content");
```

#### `removeCustomPath(customPath)`
Removes a custom game detection path.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `customPath` | `string` | Path to remove |

**Returns:** `Promise<{success: boolean, paths: string[]}>`

### Python Detection

#### `refreshPython()`
Refreshes Python detection (useful when Python is installed after app starts).

**Returns:** `Promise<PythonInfo>`

```javascript
const pythonInfo = await window.electronAPI.refreshPython();
// Returns:
// {
//   found: true,
//   command: "python",
//   version: "Python 3.11.0",
//   success: true
// }
```

### Game Path Methods

#### `selectGamePath()`
Opens a dialog for the user to select the Hades Content folder.

**Returns:** `Promise<{success: boolean, path?: string, error?: string}>`

```javascript
const result = await window.electronAPI.selectGamePath();
if (result.success) {
  console.log("Selected:", result.path);
} else {
  console.error("Error:", result.error);
}
```

**Validation:** Verifies the selected folder contains a `Scripts/` subdirectory.

#### `autoDetectGame()`
Attempts to auto-detect Hades installation from configured paths.

**Returns:** `Promise<{success: boolean, path?: string, error?: string}>`

```javascript
const result = await window.electronAPI.autoDetectGame();
if (result.success) {
  console.log("Found at:", result.path);
}
```

**Search Order:**
1. User custom paths (from settings)
2. Default paths:
   - `C:\Program Files (x86)\Steam\steamapps\common\Hades\Content`
   - `C:\Program Files\Steam\steamapps\common\Hades\Content`
   - `D:\SteamLibrary\steamapps\common\Hades\Content`
   - `E:\SteamLibrary\steamapps\common\Hades\Content`
   - `C:\Program Files\Epic Games\Hades\Content`
   - macOS Steam path

### Mod Management Methods

#### `scanMods()`
Scans the Mods directory for all installed mods.

**Returns:** `Promise<ScanResult>`

```javascript
const result = await window.electronAPI.scanMods();
if (result.success) {
  for (const mod of result.mods) {
    console.log(`${mod.name}: ${mod.enabled ? 'enabled' : 'disabled'}`);
  }
}
```

#### `toggleMod(modName, enabled)`
Enables or disables a mod by renaming its directory.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `modName` | `string` | Name of the mod folder |
| `enabled` | `boolean` | `true` to enable, `false` to disable |

**Returns:** `Promise<{success: boolean, modName?: string, enabled?: boolean, error?: string}>`

```javascript
// Enable a mod
await window.electronAPI.toggleMod("ModUtil", true);

// Disable a mod
await window.electronAPI.toggleMod("ModUtil", false);
```

### Import / Restore Methods

#### `runImport()`
Runs the modimporter to apply all enabled mods to the game.

**Returns:** `Promise<{success: boolean, code?: number, stdout?: string, stderr?: string, error?: string}>`

```javascript
const result = await window.electronAPI.runImport();
if (result.success) {
  console.log("Mods imported successfully!");
}
```

#### `runRestore()`
Restores original game files by running modimporter with --clean flag.

**Returns:** `Promise<{success: boolean, code?: number, stdout?: string, stderr?: string, error?: string}>`

```javascript
const result = await window.electronAPI.runRestore();
if (result.success) {
  console.log("Game files restored!");
}
```

### Event Listeners

#### `onImportLog(callback)`
Subscribe to log messages from Python import/restore processes.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `callback` | `(data: {type: 'stdout' \| 'stderr', text: string}) => void` | Log handler |

**Returns:** `() => void` - Unsubscribe function

```javascript
const unsubscribe = window.electronAPI.onImportLog((data) => {
  if (data.type === 'stdout') {
    console.log('[Importer]', data.text);
  } else {
    console.error('[Importer Error]', data.text);
  }
});

// Later, to stop listening:
unsubscribe();
```

### Mod Downloading Methods

#### `installModFromUrl(url)`
Downloads and installs a mod from a URL.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `url` | `string` | Direct download URL to a ZIP file |

**Returns:** `Promise<{success: boolean, modName?: string, extractedFiles?: number, error?: string}>`

```javascript
const result = await window.electronAPI.installModFromUrl(
  "https://github.com/user/mod/archive/main.zip"
);
if (result.success) {
  console.log(`Installed ${result.modName} with ${result.extractedFiles} files`);
}
```

**Security:** URLs are validated to prevent SSRF attacks. Only HTTP/HTTPS protocols allowed.

#### `installLocalMod(modName)`
Installs a bundled mod from the SGG-Mod-Format directory.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `modName` | `string` | Name of the bundled mod directory |

**Returns:** `Promise<{success: boolean, modName?: string, error?: string}>`

```javascript
const result = await window.electronAPI.installLocalMod("ModUtil");
```

#### `onDownloadStatus(callback)`
Subscribe to download progress updates.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `callback` | `(data: {status: string, progress: number}) => void` | Status handler |

**Returns:** `() => void` - Unsubscribe function

```javascript
const unsubscribe = window.electronAPI.onDownloadStatus((data) => {
  console.log(`${data.status} (${data.progress}%)`);
});
```

---

## Main Process API

### IPC Handlers in [`main.js`](../electron/main.js)

All handlers follow the pattern:
```javascript
ipcMain.handle(CHANNEL_NAME, async (event, ...args) => {
  // Handler implementation
  return { success: boolean, ...data, error?: string };
});
```

### Window Management

#### `createWindow()`
Creates the main application window with settings from user preferences.

**Behavior:**
- Loads window bounds from settings
- Sets minimum dimensions (900x600)
- Configures preload script with context isolation
- Saves window bounds on resize/move

---

## ModEngine API

Core mod operations in [`modEngine.js`](../electron/modEngine.js).

### Error Handling

All modEngine functions return standardized result objects:

```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;        // Error code for categorization
  details?: string;     // Additional error details
  timestamp?: string;   // ISO 8601 timestamp
}
```

### Python Detection

#### `detectPython()`
Detects Python installation on the system.

**Returns:** `PythonInfo`

```typescript
interface PythonInfo {
  found: boolean;
  command: string | null;    // Command to run Python (e.g., "python", "python3")
  version: string | null;    // Full version string
  success: boolean;
  error?: string;
}
```

**Detection Order:**
1. `python`
2. `python3`
3. `py`

### Modfile Parsing

#### `parseModfile(modfilePath)`
Parses and validates a modfile.txt against the SGG modfile schema.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `modfilePath` | `string` | Absolute path to modfile.txt |

**Returns:** `ModfileParseResult`

```typescript
interface ModfileParseResult {
  targets: string[];           // Target files (e.g., "Scripts/RoomManager.lua")
  imports: Import[];           // Import directives
  importTypes: string[];       // Unique import types used
  priority: number;            // Load priority (default: 100)
  raw: string;                 // Raw file content
  success: boolean;
  errors: string[];            // Parse errors
  warnings: string[];          // Parse warnings
}

interface Import {
  type: 'lua' | 'lua-top' | 'xml' | 'sjson' | 'replace' | 'csv';
  file: string;
}
```

**Supported Commands:**

| Command | Arguments | Type | Description |
|---------|-----------|------|-------------|
| `To` | file path | `target` | Target file path |
| `Import` | file path | `lua` | Import Lua file |
| `Top Import` | file path | `lua-top` | Import at top of target |
| `XML` | file path | `xml` | Import XML file |
| `SJSON` | file path | `sjson` | Import SJSON file |
| `Replace` | file path | `replace` | Replace file entirely |
| `CSV` | file path | `csv` | Import CSV file |
| `Load Priority` | number | `priority` | Set load priority |

### Mod Scanning

#### `scanMods(contentPath)`
Scans the Mods directory and parses all modfile.txt files.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `contentPath` | `string` | Path to Hades Content directory |

**Returns:** `Promise<{success: boolean, mods?: ModInfo[], error?: string}>`

```typescript
interface ModInfo {
  name: string;                // Mod name
  dirName: string;             // Actual directory name
  enabled: boolean;            // Whether mod is enabled
  path: string;                // Absolute path to mod directory
  hasModfile: boolean;         // Whether modfile.txt exists
  fileCount: number;           // Number of files in mod
  targets: string[];           // Parsed targets
  imports: Import[];           // Parsed imports
  importTypes: string[];       // Import types used
  priority: number;            // Load priority
  errors: string[];            // Parse errors
  warnings: string[];          // Parse warnings
}
```

**Sorting:** Enabled mods first, then alphabetical by name.

### Mod Toggle

#### `toggleMod(contentPath, modName, enabled)`
Enables or disables a mod by renaming its directory.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `contentPath` | `string` | Path to Hades Content directory |
| `modName` | `string` | Name of the mod |
| `enabled` | `boolean` | Target enabled state |

**Returns:** `Promise<{success: boolean, modName?: string, enabled?: boolean, error?: string}>`

**Error Codes:**
- `INVALID_PATH` - Content path not provided
- `INVALID_MOD_NAME` - Mod name not provided
- `INVALID_DIRECTORY` - Mods directory not accessible
- `MOD_NOT_FOUND` - Mod folder doesn't exist
- `MOD_ALREADY_EXISTS` - Target state already exists
- `TOGGLE_ERROR` - Rename operation failed

### Importer Management

#### `ensureImporter(contentPath)`
Copies modimporter.py and sjson module to the Content directory.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `contentPath` | `string` | Path to Hades Content directory |

**Returns:** `{success: boolean, error?: string}`

### Import / Restore Execution

#### `runImporter(contentPath, webContents)`
Runs modimporter.py to apply all enabled mods.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `contentPath` | `string` | Path to Hades Content directory |
| `webContents` | `WebContents` | For sending log messages |

**Returns:** `Promise<{success: boolean, code: number, stdout: string, stderr: string}>`

#### `runRestore(contentPath, webContents)`
Runs modimporter.py --clean to restore original files.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `contentPath` | `string` | Path to Hades Content directory |
| `webContents` | `WebContents` | For sending log messages |

**Returns:** `Promise<{success: boolean, code: number, stdout: string, stderr: string}>`

**Timeout:** 60 seconds with automatic termination

### Mod Installation

#### `validateUrl(url, strictHostCheck?)`
Validates a URL for security (SSRF protection).

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | - | URL to validate |
| `strictHostCheck` | `boolean` | `false` | Enforce hostname allowlist |

**Returns:** `URL` - Parsed URL object

**Throws:** `Error` if URL is invalid or not allowed

**Allowed Hostnames (when strict):**
- `github.com`
- `raw.githubusercontent.com`
- `*.nexusmods.com`
- `*.thunderstore.io`

#### `downloadMod(contentPath, modUrl, webContents)`
Downloads and installs a mod from a URL.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `contentPath` | `string` | Path to Hades Content directory |
| `modUrl` | `string` | Direct download URL to ZIP file |
| `webContents` | `WebContents` | For progress updates |

**Returns:** `Promise<{success: boolean, modName?: string, extractedFiles?: number, error?: string}>`

**Process:**
1. Validates URL (SSRF protection)
2. Downloads ZIP to temp file (30s timeout)
3. Handles redirects
4. Validates ZIP contains modfile.txt
5. Extracts to Mods directory
6. Cleans up temp file

**Error Codes:**
- `INVALID_PATH`, `INVALID_URL`, `DOWNLOAD_ERROR`
- `EXTRACTION_ERROR`, `INVALID_MOD_FORMAT`
- `MOD_ALREADY_EXISTS`

#### `installLocalMod(contentPath, srcModName)`
Installs a bundled mod from SGG-Mod-Format directory.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `contentPath` | `string` | Path to Hades Content directory |
| `srcModName` | `string` | Name of bundled mod directory |

**Returns:** `Promise<{success: boolean, modName?: string, error?: string}>`

### Utility Functions

#### `createError(message, code?, originalError?)`
Creates a standardized error object.

#### `validatePath(filePath, type?)`
Validates that a path exists and is the correct type.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `filePath` | `string` | Path to validate |
| `type` | `'file' \| 'directory' \| 'any'` | Expected type |

**Returns:** `{valid: boolean, error?: string, stats?: Stats}`

#### `safeFileOperation(operation, maxRetries?, delayMs?)`
Executes a file operation with retry logic for Windows file locking.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `operation` | `() => Promise<T>` | - | Operation to execute |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `delayMs` | `number` | `100` | Initial delay between retries |

---

## Settings API

Persistent settings management in [`settings.js`](../electron/settings.js).

**Storage Location:**
- Windows: `%APPDATA%/hades-mod-manager/settings.json`
- macOS/Linux: `~/.config/hades-mod-manager/settings.json`

### Methods

#### `get(key, defaultValue?)`
Retrieves a setting value.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `key` | `string` | Setting key |
| `defaultValue` | `any` | Default if not set |

**Returns:** `any` - The setting value or default

```javascript
import { get } from './settings.js';

const gamePath = get('gamePath', '');
const bounds = get('windowBounds', { width: 1100, height: 750 });
const customPaths = get('customGamePaths', []);
```

#### `set(key, value)`
Sets a setting value.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `key` | `string` | Setting key |
| `value` | `any` | Value to store |

```javascript
import { set } from './settings.js';

set('gamePath', 'C:\\Games\\Hades\\Content');
set('windowBounds', { x: 100, y: 100, width: 1200, height: 800 });
```

### Built-in Settings Keys

| Key | Type | Description |
|-----|------|-------------|
| `gamePath` | `string` | Path to Hades Content folder |
| `windowBounds` | `Rectangle` | Last window position/size |
| `customGamePaths` | `string[]` | User-defined detection paths |

### Features

- **Caching:** Settings are cached in memory after first load
- **Atomic Writes:** Uses temp file + rename for crash safety
- **Corruption Recovery:** Automatically backs up corrupted files

---

## React Hooks

### useModOperations

State machine hook for managing mod import/restore operations.

**File:** [`useModOperations.js`](../src/hooks/useModOperations.js)

#### States

| State | Description |
|-------|-------------|
| `idle` | Ready for operation |
| `importing` | Import in progress |
| `restoring` | Restore in progress |
| `completed` | Operation completed successfully |
| `error` | Operation failed |

#### Constants

```javascript
import { STATES, OPERATIONS } from './hooks/useModOperations';

STATES.IDLE        // 'idle'
STATES.IMPORTING   // 'importing'
STATES.RESTORING   // 'restoring'
STATES.COMPLETED   // 'completed'
STATES.ERROR       // 'error'

OPERATIONS.IMPORT  // 'import'
OPERATIONS.RESTORE // 'restore'
```

#### Usage

```javascript
import { useModOperations } from './hooks/useModOperations';

function ModManager() {
  const {
    // State
    state,
    operation,
    result,
    errorMessage,

    // Computed
    isRunning,
    isImporting,
    isRestoring,
    isIdle,
    isCompleted,
    isError,
    canStartOperation,
    statusMessage,
    elapsedTime,

    // Actions
    startImport,
    startRestore,
    complete,
    error,
    reset
  } = useModOperations();

  const handleImport = async () => {
    if (!startImport()) return;

    try {
      const result = await window.electronAPI.runImport();
      if (result.success) {
        complete(result);
      } else {
        error(result.error);
      }
    } catch (err) {
      error(err.message);
    }
  };

  return (
    <div>
      <p>Status: {statusMessage}</p>
      {isRunning && <p>Running for {elapsedTime}ms</p>}
      <button
        onClick={handleImport}
        disabled={!canStartOperation}
      >
        Import Mods
      </button>
      <button
        onClick={reset}
        disabled={!isCompleted && !isError}
      >
        Reset
      </button>
    </div>
  );
}
```

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `state` | `string` | Current state |
| `operation` | `string \| null` | Current operation type |
| `result` | `any` | Result from completed operation |
| `errorMessage` | `string` | Error message if in error state |
| `isRunning` | `boolean` | True if importing or restoring |
| `isImporting` | `boolean` | True if importing |
| `isRestoring` | `boolean` | True if restoring |
| `isIdle` | `boolean` | True if idle |
| `isCompleted` | `boolean` | True if completed |
| `isError` | `boolean` | True if error |
| `canStartOperation` | `boolean` | True if can start new operation |
| `statusMessage` | `string` | Human-readable status |
| `elapsedTime` | `number \| null` | Operation duration in ms |
| `startImport()` | `() => boolean` | Start import operation |
| `startRestore()` | `() => boolean` | Start restore operation |
| `complete(result)` | `(result) => boolean` | Mark as completed |
| `error(message)` | `(message) => boolean` | Mark as error |
| `reset()` | `() => boolean` | Reset to idle |

### useAccessibility

Comprehensive accessibility utilities for React components.

**File:** [`useAccessibility.js`](../src/hooks/useAccessibility.js)

#### useFocusTrap

Traps focus within a modal or dialog when active.

```javascript
import { useFocusTrap } from './hooks/useAccessibility';

function Modal({ isOpen, onClose }) {
  const containerRef = useFocusTrap(isOpen);

  return (
    <div ref={containerRef} role="dialog">
      <button>Focused first</button>
      <button>Second</button>
      {/* Tab cycles between focusable elements */}
    </div>
  );
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `isActive` | `boolean` | Whether to trap focus |

**Returns:** `React.RefObject<HTMLElement>`

#### useListNavigation

Keyboard navigation for lists (arrow keys, Home, End, Enter).

```javascript
import { useListNavigation } from './hooks/useAccessibility';

function ModList({ mods, onSelectMod }) {
  const {
    selectedIndex,
    handleKeyDown,
    setItemRef
  } = useListNavigation(mods, onSelectMod, 0);

  return (
    <ul onKeyDown={handleKeyDown} role="listbox">
      {mods.map((mod, index) => (
        <li
          key={mod.name}
          ref={setItemRef(index)}
          tabIndex={selectedIndex === index ? 0 : -1}
          aria-selected={selectedIndex === index}
        >
          {mod.name}
        </li>
      ))}
    </ul>
  );
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `items` | `Array` | List items |
| `onSelect` | `(item, index) => void` | Selection callback |
| `initialIndex` | `number` | Initial selected index |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `selectedIndex` | `number` | Current selection |
| `setSelectedIndex` | `(index) => void` | Set selection |
| `handleKeyDown` | `(event) => void` | Key handler |
| `setItemRef` | `(index) => (el) => void` | Ref setter |
| `itemRefs` | `React.MutableRefObject` | All item refs |

#### useUniqueId

Generates unique IDs for ARIA attributes.

```javascript
import { useUniqueId } from './hooks/useAccessibility';

function LabelledInput() {
  const id = useUniqueId('input');

  return (
    <>
      <label htmlFor={id}>Name</label>
      <input id={id} type="text" />
    </>
  );
}
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `prefix` | `string` | `'id'` | ID prefix |

**Returns:** `string` - Unique ID

#### useAnnouncer

Announces changes to screen readers via ARIA live regions.

```javascript
import { useAnnouncer } from './hooks/useAccessibility';

function Notification({ message }) {
  const announce = useAnnouncer();

  useEffect(() => {
    if (message) {
      announce(message, 'polite'); // or 'assertive'
    }
  }, [message, announce]);

  return null;
}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `message` | `string` | Message to announce |
| `priority` | `'polite' \| 'assertive'` | Announcement priority |

**Returns:** `(message, priority?) => void` - Announce function

#### useExpandable

Manages expanded/collapsed state with ARIA attributes.

```javascript
import { useExpandable } from './hooks/useAccessibility';

function AccordionItem({ title, children }) {
  const {
    isExpanded,
    toggle,
    triggerProps,
    contentProps
  } = useExpandable(false);

  return (
    <div>
      <button {...triggerProps}>
        {title}
      </button>
      {isExpanded && (
        <div {...contentProps}>
          {children}
        </div>
      )}
    </div>
  );
}
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `initialState` | `boolean` | `false` | Initial expanded state |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `isExpanded` | `boolean` | Current state |
| `toggle` | `() => void` | Toggle state |
| `expand` | `() => void` | Set expanded |
| `collapse` | `() => void` | Set collapsed |
| `triggerProps` | `object` | ARIA props for trigger |
| `contentProps` | `object` | ARIA props for content |

#### useSkipLink

Skip link functionality for keyboard navigation.

```javascript
import { useSkipLink } from './hooks/useAccessibility';

function Layout() {
  const { skipLinkProps, mainContentProps } = useSkipLink('main');

  return (
    <>
      <a {...skipLinkProps}>Skip to main content</a>
      <nav>...</nav>
      <main {...mainContentProps}>
        Content here
      </main>
    </>
  );
}
```

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `mainContentId` | `string` | `'main-content'` | Main content ID |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `skipLinkProps` | `object` | Props for skip link |
| `mainContentProps` | `object` | Props for main content |

#### ariaPatterns

Pre-configured ARIA attribute patterns.

```javascript
import { ariaPatterns } from './hooks/useAccessibility';

// Loading button
<button {...ariaPatterns.loadingButton(isLoading, 'Saving...')}>
  {isLoading ? 'Saving...' : 'Save'}
</button>

// Progress bar
<div {...ariaPatterns.progress(50, 100, 'Upload progress')} />

// Alert message
<div {...ariaPatterns.alert('error')}>
  Error occurred!
</div>

// Dialog
<div {...ariaPatterns.dialog(isOpen, 'dialog-title')}>
  <h2 id="dialog-title">Dialog Title</h2>
</div>

// Tab panel
<div {...ariaPatterns.tabPanel(isSelected, 'tab-1')}>
  Panel content
</div>

// Tab list
<div {...ariaPatterns.tabList()}>
  <button {...ariaPatterns.tab(true, 'panel-1')}>Tab 1</button>
</div>

// Listbox
<ul {...ariaPatterns.listbox('list-label')}>
  <li {...ariaPatterns.listboxOption(true)}>Selected item</li>
</ul>

// Switch/Toggle
<button {...ariaPatterns.switch(isOn, 'Enable feature')}>
  Toggle
</button>

// Tooltip
<span {...ariaPatterns.tooltip('tooltip-id')}>Help</span>
```

**Available Patterns:**

| Pattern | Parameters | Description |
|---------|------------|-------------|
| `loadingButton` | `(isLoading, loadingText)` | Button with loading state |
| `progress` | `(value, max, label)` | Progress indicator |
| `alert` | `(type)` | Alert/status message |
| `dialog` | `(isOpen, titleId)` | Modal dialog |
| `tabPanel` | `(isSelected, labelledBy)` | Tab panel |
| `tabList` | `()` | Tab list container |
| `tab` | `(isSelected, controlsId)` | Individual tab |
| `listbox` | `(labelledBy)` | Selectable list |
| `listboxOption` | `(isSelected, isDisabled)` | Listbox option |
| `switch` | `(isChecked, label)` | Toggle switch |
| `tooltip` | `(id)` | Tooltip |
| `menu` | `(labelledBy)` | Menu container |
| `menuItem` | `()` | Menu item |

---

## Type Definitions

### Common Interfaces

```typescript
// Settings object
interface Settings {
  gamePath: string;
  pythonPath: PythonInfo;
}

// Python detection result
interface PythonInfo {
  found: boolean;
  command: string | null;
  version: string | null;
  success: boolean;
  error?: string;
}

// Scan operation result
interface ScanResult {
  success: boolean;
  mods?: ModInfo[];
  error?: string;
}

// Mod information
interface ModInfo {
  name: string;
  dirName: string;
  enabled: boolean;
  path: string;
  hasModfile: boolean;
  fileCount: number;
  targets: string[];
  imports: Import[];
  importTypes: string[];
  priority: number;
  errors: string[];
  warnings: string[];
  raw?: string;
}

// Import directive
interface Import {
  type: 'lua' | 'lua-top' | 'xml' | 'sjson' | 'replace' | 'csv';
  file: string;
}

// Operation result
interface OperationResult {
  success: boolean;
  code?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
}

// Download status
interface DownloadStatus {
  status: string;
  progress: number;
}

// Log message
interface LogMessage {
  type: 'stdout' | 'stderr';
  text: string;
}

// Window bounds
interface Rectangle {
  x?: number;
  y?: number;
  width: number;
  height: number;
}
```

---

## Complete Example: Building a Custom Component

```jsx
import { useState, useEffect } from 'react';
import { useModOperations, STATES } from '../hooks/useModOperations';
import { useAnnouncer } from '../hooks/useAccessibility';

function ModImporter() {
  const [logs, setLogs] = useState([]);
  const announce = useAnnouncer();

  const {
    isRunning,
    isIdle,
    isCompleted,
    isError,
    canStartOperation,
    statusMessage,
    startImport,
    complete,
    error,
    reset
  } = useModOperations();

  // Subscribe to import logs
  useEffect(() => {
    const unsubscribe = window.electronAPI.onImportLog((data) => {
      setLogs(prev => [...prev, data]);
    });
    return unsubscribe;
  }, []);

  const handleImport = async () => {
    if (!startImport()) return;

    try {
      const result = await window.electronAPI.runImport();

      if (result.success) {
        complete(result);
        announce('Mods imported successfully', 'polite');
      } else {
        error(result.error);
        announce('Import failed: ' + result.error, 'assertive');
      }
    } catch (err) {
      error(err.message);
      announce('Import error: ' + err.message, 'assertive');
    }
  };

  const handleReset = () => {
    reset();
    setLogs([]);
  };

  return (
    <div className="mod-importer">
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <div className="status-bar">
        {statusMessage}
        {isRunning && <span className="spinner" />}
      </div>

      <div className="actions">
        <button
          onClick={handleImport}
          disabled={!canStartOperation}
          aria-busy={isRunning}
        >
          {isRunning ? 'Importing...' : 'Import Mods'}
        </button>

        <button
          onClick={handleReset}
          disabled={isIdle}
        >
          Reset
        </button>
      </div>

      {isCompleted && (
        <div className="success-message" role="alert">
          ✓ Import completed successfully!
        </div>
      )}

      {isError && (
        <div className="error-message" role="alert">
          ✗ {statusMessage}
        </div>
      )}

      <div className="log-viewer" role="log" aria-label="Import logs">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`log-line log-${log.type}`}
          >
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModImporter;
```

---

## Error Handling Best Practices

```javascript
// Always check success flag
const result = await window.electronAPI.scanMods();
if (!result.success) {
  console.error('Scan failed:', result.error);
  // Handle error appropriately
  return;
}

// Use try-catch for unexpected errors
try {
  const result = await window.electronAPI.runImport();
  // Handle result
} catch (err) {
  // Handle unexpected error
  console.error('Unexpected error:', err);
}

// Handle specific error codes from modEngine
if (result.code === 'MOD_NOT_FOUND') {
  // Show "mod not found" message
} else if (result.code === 'TOGGLE_ERROR') {
  // Suggest checking file permissions
}
```

---

## Security Considerations

1. **URL Validation:** The `downloadMod` function validates URLs to prevent SSRF attacks
2. **Path Validation:** All paths are validated before file operations
3. **Context Isolation:** The preload script uses `contextBridge` for secure API exposure
4. **No Node.js in Renderer:** Node integration is disabled in the renderer process

---

*Generated for Hades Mod Manager*
