# Architecture Overview

This document provides a comprehensive overview of the Hades Mod Manager architecture, explaining the system's design principles, component structure, and data flow.

## System Architecture

Hades Mod Manager follows a modern desktop application architecture built on Electron and React. The application consists of two main processes that communicate through Inter-Process Communication (IPC).

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Electron Main Process                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   main.js    │  │ modEngine.js │  │     settings.js      │  │
│  │              │  │              │  │                      │  │
│  │ - Window mgmt│  │ - Mod I/O    │  │ - Config storage     │  │
│  │ - IPC handle │  │ - Validation │  │ - Preferences        │  │
│  │ - App lifecycle│ │ - Operations │  │ - Persistence        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  preload.js  │  │ipcChannels.js│                            │
│  │              │  │              │                            │
│  │ - Secure API │  │ - Channel    │                            │
│  │   bridge     │  │   constants  │                            │
│  └──────────────┘  └──────────────┘                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ IPC (Inter-Process Communication)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                  Electron Renderer Process                       │
│                     (React Application)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Components                      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │   │
│  │  │    App.jsx   │ │   Header.jsx │ │ModList.jsx   │    │   │
│  │  │              │ │              │ │              │    │   │
│  │  │ - App state  │ │ - Title bar  │ │ - Mod list   │    │   │
│  │  │ - Routing    │ │ - Navigation │ │ - Selection  │    │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘    │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │   │
│  │  │ ModDetail.jsx│ │ModDownloader │ │  ActionBar   │    │   │
│  │  │              │ │   .jsx       │ │   .jsx       │    │   │
│  │  │ - Details    │ │ - Download   │ │ - Actions    │    │   │
│  │  │ - Actions    │ │ - Sources    │ │ - Shortcuts  │    │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘    │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │   │
│  │  │ LogViewer.jsx│ │WelcomeScreen │ │ErrorBoundary │    │   │
│  │  │              │ │   .jsx       │ │   .jsx       │    │   │
│  │  │ - Log display│ │ - Onboarding │ │ - Error      │    │   │
│  │  │ - Filtering  │ │ - First run  │ │   handling   │    │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Custom Hooks                          │   │
│  │  ┌──────────────────┐  ┌──────────────────────────┐    │   │
│  │  │ useModOperations │  │    useAccessibility      │    │   │
│  │  │                  │  │                          │    │   │
│  │  │ - Mod CRUD ops   │  │ - Keyboard shortcuts     │    │   │
│  │  │ - IPC calls      │  │ - Screen reader support  │    │   │
│  │  │ - State mgmt     │  │ - Focus management       │    │   │
│  │  └──────────────────┘  └──────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Main Process Architecture

The main process runs in a Node.js environment and has full access to the operating system APIs.

### Core Modules

#### main.js
The entry point for the Electron application responsible for:
- Window creation and management
- Application lifecycle events
- IPC handler registration
- Menu bar configuration

#### modEngine.js
Handles all mod-related operations:
- Reading and writing mod files
- Validating mod structures
- Managing mod metadata
- Executing mod operations (install, enable, disable, uninstall)

#### settings.js
Manages application configuration:
- User preferences storage
- Mod directory path management
- Application settings persistence
- Configuration file I/O

#### preload.js
Provides a secure bridge between main and renderer processes:
- Exposes controlled APIs to the renderer
- Validates IPC message data
- Prevents direct Node.js access from renderer

#### ipcChannels.js
Defines constants for IPC communication channels:
- Channel name enumeration
- Message type definitions
- Protocol specifications

## Renderer Process Architecture

The renderer process runs the React application in a Chromium environment.

### Component Hierarchy

```
App.jsx (Root)
├── Header
├── ActionBar
├── Main Content Area
│   ├── WelcomeScreen (conditional)
│   ├── ModList
│   └── ModDetail
├── ModDownloader (modal/overlay)
└── LogViewer
```

### State Management

The application uses React's built-in state management:

- **Local Component State**: UI-specific state (modals, selections)
- **Custom Hooks**: Shared logic and IPC communication
- **Props Drilling**: Data passed down the component tree

### Component Responsibilities

#### App.jsx
- Application root component
- Global state container
- IPC event listeners setup
- Error boundary wrapper

#### Header.jsx
- Application branding
- Navigation elements
- Status indicators
- Connection status

#### ModList.jsx
- Mod collection display
- Selection management
- Sorting and filtering
- Virtual scrolling for performance

#### ModDetail.jsx
- Selected mod information display
- Action buttons (enable, disable, uninstall)
- Metadata visualization
- Version information

#### ModDownloader.jsx
- Download interface
- Source management
- Progress tracking
- Installation workflow

#### ActionBar.jsx
- Quick action buttons
- Toolbar layout
- Keyboard shortcut triggers
- Action state management

#### LogViewer.jsx
- Log message display
- Severity filtering
- Timestamp formatting
- Auto-scroll behavior

#### WelcomeScreen.jsx
- First-run experience
- Initial configuration
- User onboarding
- Directory selection

#### ErrorBoundary.jsx
- Error catching
- Fallback UI rendering
- Error reporting
- Recovery options

## Data Flow

### Mod Loading Flow

```
1. Application Start
         │
         ▼
2. main.js creates window
         │
         ▼
3. Renderer loads React app
         │
         ▼
4. App.jsx requests mod list
         │
         ▼ (IPC)
5. modEngine.js reads directory
         │
         ▼
6. Mod metadata parsed
         │
         ▼ (IPC)
7. Mod list displayed in UI
```

### Mod Installation Flow

```
1. User clicks "Import" or "Download"
         │
         ▼
2. ModDownloader or Import dialog
         │
         ▼
3. Source validation
         │
         ▼ (IPC)
4. modEngine.js processes files
         │
         ▼
5. Files copied to mod directory
         │
         ▼
6. Metadata extracted
         │
         ▼ (IPC)
7. UI updated with new mod
         │
         ▼
8. Log entry created
```

## IPC Communication

### Channel Definitions

The [`ipcChannels.js`](../electron/ipcChannels.js) file defines all communication channels:

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `mods:getAll` | Renderer → Main | Request all mods |
| `mods:getOne` | Renderer → Main | Request single mod |
| `mods:install` | Renderer → Main | Install new mod |
| `mods:uninstall` | Renderer → Main | Remove mod |
| `mods:toggle` | Renderer → Main | Enable/disable mod |
| `settings:get` | Renderer → Main | Get settings |
| `settings:set` | Renderer → Main | Update settings |
| `log:message` | Main → Renderer | Send log message |

### Security Considerations

- All IPC channels are defined as constants
- Preload script validates message data
- No direct Node.js access from renderer
- Context isolation is enabled

## File System Integration

### Mod Directory Structure

```
mod-directory/
├── mod1/
│   ├── modfile.txt
│   ├── mod.lua
│   └── metadata.json
├── mod2/
│   ├── modfile.txt
│   └── ...
└── mod-manager-config.json
```

### Configuration File

The application stores configuration in `mod-manager-config.json`:

```json
{
  "modDirectory": "path/to/mods",
  "settings": {
    "autoRefresh": true,
    "logLevel": "info"
  }
}
```

## Build and Distribution

### Development Build

```bash
npm run dev
```
- Runs Vite dev server
- Hot module replacement
- Electron in development mode

### Production Build

```bash
npm run build
```
- Bundles React application
- Compiles Electron main process
- Outputs to `dist/` and `dist-electron/`

### Packaging

```bash
npm run dist
```
- Creates distributable installer
- Packages for Windows
- Outputs to `release/` directory

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI Framework | React 18 | Component-based UI |
| Build Tool | Vite 5 | Fast development and building |
| Desktop Shell | Electron 28 | Native desktop application |
| Styling | Tailwind CSS | Utility-first CSS |
| Icons | Lucide React | Consistent iconography |
| State | React Hooks | Component state management |
| IPC | Electron IPC | Process communication |

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling**: Large mod lists use virtualization
2. **Lazy Loading**: Components load on demand
3. **Debounced Search**: Search input is debounced
4. **Memoization**: Expensive computations are memoized
5. **IPC Batching**: Multiple IPC calls are batched

### Memory Management

- Event listeners are properly cleaned up
- Large file operations use streams
- Unused mod data is unloaded
- Electron context isolation reduces memory footprint

## Extension Points

The architecture supports future extensions:

- **Plugin System**: Planned for third-party integrations
- **Custom Themes**: Theme configuration system
- **Additional Games**: Modular game support
- **Cloud Sync**: Settings and mod list synchronization

## See Also

- [Getting Started Guide](getting-started.md)
- [Component Documentation](components.md)
- [Development Guide](development.md)
- [Troubleshooting Guide](troubleshooting.md)
