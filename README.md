# Hades Mod Manager

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](./package.json)
[![Electron](https://img.shields.io/badge/Electron-33.2.0-47848F?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)

A premium, hardware-accelerated desktop application for managing Hades game mods. Built with Electron, React, Tailwind CSS v4, and Framer Motion, it features a fluid Bento 2.0 interface ("Liquid Glass") running on top of the community-standard [`modimporter`](https://github.com/SGG-Modding/SGG-Mod-Format) engine.

## Features

- **Mod Management**: Browse, install, uninstall, and organize your Hades mods with an intuitive interface
- **Mod Detail View**: View comprehensive mod information with metadata and descriptions
- **Mod Downloader**: Built-in download capability for fetching mods directly
- **Real-time Log Viewer**: Stream standard output and error logs from the Mod Engine directly in the application
- **Dynamic Action Bar**: macOS-style sticky pill interface for rapid mod operations
- **Automated Python Integration**: Seamlessly bridges Node.js with the `modimporter.py` engine
- **Asymmetric Bento UI**: Modern interface utilizing Framer Motion layout transitions for organic sorting and reveals
- **Liquid Glass Rendering**: Authentic glassmorphism with inner refraction borders and diffusion shadows

## Prerequisites

- **Node.js** 18+ and **npm**
- **Python 3**: Required to run the underlying [`SGG-Mod-Format`](https://github.com/SGG-Modding/SGG-Mod-Format) engine
- A legitimate installation of **Hades** (Steam/Epic)

## Installation

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hades-mod-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

   ### ⚠️ Important: Dependency Warnings

   > **DO NOT run `npm audit fix` or `npm audit fix --force`**

   When running `npm install`, you will see deprecation warnings for several packages (such as `inflight`, `rimraf`, `glob`, `tar`, and others). **This is expected and safe to ignore.**

   **Why you should NOT attempt to fix these warnings:**

   - These "vulnerabilities" are in **build-time dependencies only** (the electron-builder toolchain)
   - This application runs entirely **locally** and does not access the internet, so these vulnerabilities pose no security risk
   - Running `npm audit fix --force` will **break the application completely**, locking it into a permanent error screen
   - Specifically, force-fixing dependencies will break the automatic Hades installation detection feature

   **What to do:** Simply ignore the warnings during `npm install` and proceed with development. The dependencies will be properly updated in a future release.

3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

Create a production build:
```bash
npm run build
```

Build the Electron application:
```bash
# Build installer for Windows
npm run dist:win

# Build portable version
npm run dist:win:portable

# Build for all platforms
npm run dist
```

> **Note**: The built application will be available in the `release/` directory.

## Usage

1. **Launch the Application**: Start Hades Mod Manager after building or run in development mode
2. **Configure Game Path**: On first launch, ensure your Hades installation directory is correctly detected
3. **Browse Mods**: View your installed mods in the mod list
4. **Install Mods**: Use the mod downloader or place mods in your Hades `Content/Mods` folder
5. **Manage Mods**: Select mods to view details, install/uninstall using the action bar
6. **Monitor Logs**: Check the log viewer for real-time feedback from the mod engine

## Architecture

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | React 18 + Vite | Modern UI with fast HMR and optimized builds |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with `@tailwindcss/vite` integration |
| **Animations** | Framer Motion | Complex state choreography and layout transitions |
| **Desktop Shell** | Electron 33 | Cross-platform desktop application wrapper |
| **Icons** | Phosphor Icons | Clean, consistent iconography |
| **Mod Engine** | Python (modimporter) | Community-standard SGG-Mod-Format engine |

### Project Structure

```
hades-mod-manager/
├── electron/           # Electron main process
│   ├── main.js        # Main entry point
│   ├── preload.js     # Preload scripts
│   ├── modEngine.js   # Python bridge for mod operations
│   └── ipcChannels.js # IPC communication definitions
├── src/               # React frontend
│   ├── components/    # UI components
│   ├── hooks/         # Custom React hooks
│   ├── App.jsx        # Main application
│   └── main.jsx       # React entry point
├── dist/              # Built frontend assets
└── dist-electron/     # Built Electron assets
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run build:electron` | Build and package Electron app |
| `npm run dist` | Build distributables for current platform |
| `npm run dist:win` | Build Windows installer |
| `npm run dist:win:portable` | Build Windows portable version |

## Tech Stack

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop app framework
- **[React](https://react.dev/)** - UI library with hooks and functional components
- **[Vite](https://vitejs.dev/)** - Next-generation frontend build tool
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Production-ready motion library
- **[Phosphor Icons](https://phosphoricons.com/)** - Flexible icon family

## Support the Project

If you find Hades Mod Manager helpful, consider supporting its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/zendevve)

Your support helps maintain and improve this tool for the Hades modding community!

## Credits

Powered by the [SGG-Mod-Format](https://github.com/SGG-Modding/SGG-Mod-Format) community modding engine.
