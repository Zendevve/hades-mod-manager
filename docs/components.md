# Component Documentation

This document provides detailed documentation for all React components, custom hooks, and Electron modules in the Hades Mod Manager application.

## Component Overview

The Hades Mod Manager UI is built with React and organized into a component hierarchy that separates concerns and promotes reusability.

### Component Hierarchy

```
App (Root)
├── Header
├── ActionBar
├── Main Content
│   ├── WelcomeScreen (conditional)
│   └── ModManagerLayout
│       ├── ModList
│       └── ModDetail
├── ModDownloader (modal)
└── LogViewer
```

## React Components

### App.jsx

The root component that initializes the application and manages global state.

**Location**: [`src/App.jsx`](../src/App.jsx)

**Responsibilities**:
- Application state management
- IPC event listener setup
- Theme and layout configuration
- Error boundary wrapper

**State**:
| Property | Type | Description |
|----------|------|-------------|
| `mods` | `Array<Mod>` | List of all mods |
| `selectedMod` | `Mod \| null` | Currently selected mod |
| `logs` | `Array<LogEntry>` | Application logs |
| `showWelcome` | `boolean` | Show welcome screen |

**Example Usage**:
```jsx
<App />
```

---

### Header.jsx

Displays the application header with title, status indicators, and navigation elements.

**Location**: [`src/components/Header.jsx`](../src/components/Header.jsx)

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Application title |
| `modDirectory` | `string` | Current mod directory path |
| `connectionStatus` | `string` | Connection status indicator |

**Example Usage**:
```jsx
<Header
  title="Hades Mod Manager"
  modDirectory={modDir}
  connectionStatus="connected"
/>
```

---

### ModList.jsx

Displays the list of available mods with selection and toggle capabilities.

**Location**: [`src/components/ModList.jsx`](../src/components/ModList.jsx)

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `mods` | `Array<Mod>` | Array of mod objects |
| `selectedMod` | `Mod \| null` | Currently selected mod |
| `onSelectMod` | `(mod: Mod) => void` | Selection callback |
| `onToggleMod` | `(modId: string) => void` | Toggle callback |
| `searchQuery` | `string` | Search filter text |

**Features**:
- Virtual scrolling for performance
- Real-time status updates
- Enable/disable toggle switches
- Selection highlighting

**Example Usage**:
```jsx
<ModList
  mods={mods}
  selectedMod={selectedMod}
  onSelectMod={handleSelect}
  onToggleMod={handleToggle}
  searchQuery={searchText}
/>
```

---

### ModDetail.jsx

Shows detailed information about the selected mod.

**Location**: [`src/components/ModDetail.jsx`](../src/components/ModDetail.jsx)

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `mod` | `Mod \| null` | Mod to display |
| `onEnable` | `() => void` | Enable callback |
| `onDisable` | `() => void` | Disable callback |
| `onUninstall` | `() => void` | Uninstall callback |

**Displayed Information**:
- Mod name and version
- Author information
- Description
- Installation date
- File size
- Dependencies

**Example Usage**:
```jsx
<ModDetail
  mod={selectedMod}
  onEnable={enableMod}
  onDisable={disableMod}
  onUninstall={uninstallMod}
/>
```

---

### ModDownloader.jsx

Interface for downloading mods from external sources.

**Location**: [`src/components/ModDownloader.jsx`](../src/components/ModDownloader.jsx)

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Modal visibility |
| `onClose` | `() => void` | Close callback |
| `onDownload` | `(url: string) => void` | Download callback |

**Features**:
- URL input
- Source browser
- Download progress
- Installation confirmation

**Example Usage**:
```jsx
<ModDownloader
  isOpen={showDownloader}
  onClose={closeDownloader}
  onDownload={handleDownload}
/>
```

---

### ActionBar.jsx

Toolbar with quick action buttons for common operations.

**Location**: [`src/components/ActionBar.jsx`](../src/components/ActionBar.jsx)

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `onRefresh` | `() => void` | Refresh callback |
| `onImport` | `() => void` | Import callback |
| `onDownload` | `() => void` | Download callback |
| `onSettings` | `() => void` | Settings callback |

**Actions**:
- Refresh mod list
- Import from folder
- Open mod downloader
- Open settings

**Example Usage**:
```jsx
<ActionBar
  onRefresh={refreshMods}
  onImport={openImport}
  onDownload={openDownloader}
  onSettings={openSettings}
/>
```

---

### LogViewer.jsx

Displays application logs with filtering capabilities.

**Location**: [`src/components/LogViewer.jsx`](../src/components/LogViewer.jsx)

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `logs` | `Array<LogEntry>` | Log entries to display |
| `maxHeight` | `number` | Maximum height in pixels |

**Features**:
- Severity filtering (info, warn, error)
- Timestamp display
- Auto-scroll to newest
- Clear logs function

**Example Usage**:
```jsx
<LogViewer
  logs={logs}
  maxHeight={200}
/>
```

---

### WelcomeScreen.jsx

First-run experience for initial configuration.

**Location**: [`src/components/WelcomeScreen.jsx`](../src/components/WelcomeScreen.jsx)

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `onDirectorySelect` | `(path: string) => void` | Directory selection callback |

**Features**:
- Application introduction
- Mod directory selection
- Initial setup guidance

**Example Usage**:
```jsx
<WelcomeScreen
  onDirectorySelect={setModDirectory}
/>
```

---

### ErrorBoundary.jsx

Catches JavaScript errors in child components and displays fallback UI.

**Location**: [`src/components/ErrorBoundary.jsx`](../src/components/ErrorBoundary.jsx)

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Child components |
| `fallback` | `ReactNode` | Custom fallback UI |

**Features**:
- Error catching
- Error logging
- Recovery options
- Graceful degradation

**Example Usage**:
```jsx
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

---

## Custom Hooks

### useModOperations

Custom hook for managing mod operations and IPC communication.

**Location**: [`src/hooks/useModOperations.js`](../src/hooks/useModOperations.js)

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| `mods` | `Array<Mod>` | Current mod list |
| `loading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error state |
| `refreshMods` | `() => Promise<void>` | Refresh mod list |
| `installMod` | `(path: string) => Promise<void>` | Install mod |
| `uninstallMod` | `(id: string) => Promise<void>` | Uninstall mod |
| `toggleMod` | `(id: string) => Promise<void>` | Toggle mod state |

**Example Usage**:
```jsx
const { mods, loading, refreshMods, toggleMod } = useModOperations();

useEffect(() => {
  refreshMods();
}, []);
```

---

### useAccessibility

Custom hook for managing accessibility features.

**Location**: [`src/hooks/useAccessibility.js`](../src/hooks/useAccessibility.js)

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| `announceToScreenReader` | `(message: string) => void` | Screen reader announcement |
| `setFocus` | `(elementId: string) => void` | Programmatic focus |
| `highContrast` | `boolean` | High contrast mode state |

**Example Usage**:
```jsx
const { announceToScreenReader, setFocus } = useAccessibility();

const handleAction = () => {
  performAction();
  announceToScreenReader('Action completed');
  setFocus('next-element');
};
```

---

## Electron Modules

### main.js

Main Electron process entry point.

**Location**: [`electron/main.js`](../electron/main.js)

**Exports**: None (entry point)

**Responsibilities**:
- BrowserWindow creation
- IPC handler registration
- Application lifecycle management
- Menu configuration

**Key Functions**:
| Function | Description |
|----------|-------------|
| `createWindow()` | Creates main application window |
| `registerIpcHandlers()` | Sets up IPC communication |
| `setupMenu()` | Configures application menu |

---

### preload.js

Preload script that bridges main and renderer processes securely.

**Location**: [`electron/preload.js`](../electron/preload.js)

**Exposed APIs**:
| API | Description |
|-----|-------------|
| `electronAPI.getMods()` | Retrieve all mods |
| `electronAPI.getMod(id)` | Retrieve specific mod |
| `electronAPI.installMod(path)` | Install mod from path |
| `electronAPI.uninstallMod(id)` | Remove mod |
| `electronAPI.toggleMod(id)` | Enable/disable mod |
| `electronAPI.onLog(callback)` | Subscribe to log messages |

---

### ipcChannels.js

Constants for IPC communication channels.

**Location**: [`electron/ipcChannels.js`](../electron/ipcChannels.js)

**Channels**:
```javascript
const IPC_CHANNELS = {
  MODS: {
    GET_ALL: 'mods:getAll',
    GET_ONE: 'mods:getOne',
    INSTALL: 'mods:install',
    UNINSTALL: 'mods:uninstall',
    TOGGLE: 'mods:toggle'
  },
  SETTINGS: {
    GET: 'settings:get',
    SET: 'settings:set'
  },
  LOG: {
    MESSAGE: 'log:message'
  }
};
```

---

### modEngine.js

Core module for mod file operations.

**Location**: [`electron/modEngine.js`](../electron/modEngine.js)

**Exported Functions**:
| Function | Signature | Description |
|----------|-----------|-------------|
| `getAllMods` | `() => Promise<Mod[]>` | Get all mods |
| `getMod` | `(id: string) => Promise<Mod>` | Get specific mod |
| `installMod` | `(sourcePath: string) => Promise<void>` | Install mod |
| `uninstallMod` | `(id: string) => Promise<void>` | Remove mod |
| `toggleMod` | `(id: string) => Promise<boolean>` | Toggle mod state |
| `validateMod` | `(path: string) => Promise<boolean>` | Validate mod structure |

---

### settings.js

Module for managing application settings.

**Location**: [`electron/settings.js`](../electron/settings.js)

**Exported Functions**:
| Function | Signature | Description |
|----------|-----------|-------------|
| `getSettings` | `() => Promise<Settings>` | Get all settings |
| `setSettings` | `(settings: Settings) => Promise<void>` | Update settings |
| `getModDirectory` | `() => Promise<string>` | Get mod directory path |
| `setModDirectory` | `(path: string) => Promise<void>` | Set mod directory |

---

## Type Definitions

### Mod

```typescript
interface Mod {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  installedAt: Date;
  path: string;
  dependencies?: string[];
  fileSize?: number;
}
```

### LogEntry

```typescript
interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}
```

### Settings

```typescript
interface Settings {
  modDirectory: string;
  autoRefresh: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  theme: 'light' | 'dark' | 'system';
}
```

---

## Best Practices

### Component Guidelines

1. **Single Responsibility**: Each component should do one thing well
2. **Prop Drilling**: Keep prop chains shallow; use context for deeply nested data
3. **Error Boundaries**: Wrap major sections with error boundaries
4. **Memoization**: Use `React.memo` for expensive renders
5. **Accessibility**: Include ARIA labels and keyboard navigation

### Hook Guidelines

1. **Custom Hooks**: Extract reusable logic into custom hooks
2. **Effect Cleanup**: Always clean up subscriptions and listeners
3. **Async Handling**: Handle loading and error states
4. **Dependencies**: Specify all effect dependencies correctly

### IPC Guidelines

1. **Channel Constants**: Always use constants from `ipcChannels.js`
2. **Data Validation**: Validate all IPC message data
3. **Error Handling**: Handle errors gracefully in IPC handlers
4. **Security**: Never expose full Node.js API to renderer

## See Also

- [Architecture Overview](architecture.md)
- [Getting Started Guide](getting-started.md)
- [Development Guide](development.md)
- [Troubleshooting Guide](troubleshooting.md)
