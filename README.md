# Hades Mod Manager

A premium, hardware-accelerated desktop application for managing Hades mods. Built with Electron, React, Tailwind CSS v4, and Framer Motion, it features a fluid Bento 2.0 interface ("Liquid Glass") running on top of the community-standard `modimporter` engine.

## Features

- **Automated Python Injection**: Bridges Node.js with the `modimporter.py` engine silently.
- **Asymmetric Bento UI**: A modern interface utilizing Framer Motion layout transitions for organic sorting and reveals.
- **Liquid Glass Rendering**: Authentic glassmorphism with inner refraction borders and diffusion shadows.
- **Contextual Cockpit**: Real-time console streaming standard output and error logs from the Mod Engine directly into a terminal widget.
- **Dynamic Action Dial**: macOS-style sticky pill for rapid mod initialization and restoration.

## Requirements

- **Python 3**: Required to run the underlying `sgg-mod-format` engine.
- A legitimate installation of **Hades** (Steam/Epic).

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   npx electron .
   ```

## Architecture

- **Electron Main**: Handles IPC, window rendering, file system scraping (`Content/Mods`), and Python child-process spawning.
- **React Renderer**: The user interface. Uses `@tailwindcss/vite` for the styling layer and `framer-motion` for complex state choreography.
- **Mod Engine Bridge**: The `modEngine.js` module automatically injects the Python dependencies into the Hades game path and bridges the IO streams.

## Credits

Powered by the [SGG-Mod-Format](https://github.com/SGG-Modding/SGG-Mod-Format) community modding engine.
