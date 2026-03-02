import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

/**
 * Vite Configuration for Hades Mod Manager
 *
 * This configuration sets up a modern Electron + React development environment
 * with hot module replacement (HMR) for both the renderer and main processes.
 *
 * Architecture Overview:
 * ----------------------
 * The app consists of three processes:
 * 1. Main Process (Node.js/Electron) - Controls the application lifecycle
 * 2. Preload Script - Secure bridge between main and renderer
 * 3. Renderer Process (React) - The UI that users interact with
 *
 * vite-plugin-electron handles bundling and hot-reloading for all three.
 */

export default defineConfig({
  plugins: [
    // Tailwind CSS plugin for utility-first styling
    // Note: Using v4 alpha syntax (@tailwindcss/vite instead of @tailwindcss/postcss)
    tailwindcss(),

    // React plugin with Fast Refresh for instant UI updates during development
    react(),

    /**
     * vite-plugin-electron Configuration
     *
     * This plugin is the core of our Electron build process. It creates separate
     * bundles for the main process and preload script, with their own build
     * configurations and hot-reload behaviors.
     *
     * Why two separate configs?
     * - Main process runs in Node.js and needs different externals
     * - Preload runs in a limited context and needs to be isolated
     * - They have different reload behaviors (restart vs reload)
     */
    electron([
      // Main Process Configuration
      {
        // Entry point for the main Electron process
        // This is where window creation, IPC handlers, and app lifecycle live
        entry: 'electron/main.js',

        /**
         * onstart callback - Triggered when the main process bundle is rebuilt
         *
         * args.startup() - Restarts the entire Electron app
         * This is necessary because the main process can't be hot-reloaded;
         * changes require a full app restart to take effect.
         *
         * --no-sandbox flag is required for development on some Linux systems
         * to prevent permission issues with the dev server.
         */
        onstart(args) {
          args.startup(['.', '--no-sandbox'])
        },

        /**
         * Vite build configuration for the main process
         *
         * Key settings:
         * - outDir: Separate output directory to avoid conflicts with renderer
         * - external: ['electron'] prevents Electron from being bundled;
           it's provided by the runtime
         *
         * Why bundle at all for Node.js?
         * Even though Node.js can run native ESM, bundling gives us:
         * - Single file output (easier distribution)
         * - Tree shaking (smaller bundle)
         * - Consistent module resolution
         */
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },

      // Preload Script Configuration
      {
        // Entry point for the preload script
        // This script runs in an isolated context with access to both
        // Node.js APIs and the renderer window
        entry: 'electron/preload.js',

        /**
         * onstart callback for preload
         *
         * args.reload() - Reloads the renderer window only
         * Unlike the main process, preload changes don't require a full
         * app restart. We can simply reload the renderer window to pick
         * up changes to the context bridge.
         *
         * Note: In production, preload is loaded once at window creation.
         * Changes require window recreation or app restart.
         */
        onstart(args) {
          args.reload()
        },

        /**
         * Build configuration for preload script
         *
         * Preload scripts have special requirements:
         * - Must be a single file (no dynamic imports)
         * - Runs in an isolated context
         * - Needs electron external (provided by runtime)
         *
         * Separate outDir prevents conflicts with main process output.
         */
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),

    /**
     * vite-plugin-electron-renderer
     *
     * This plugin configures the renderer process (React app) to work
     * correctly with Electron's security model.
     *
     * Key features:
     * - Enables proper resolution of Electron modules in renderer
     * - Configures Node.js integration settings
     * - Sets up proper target for Electron's Chromium version
     *
     * IMPORTANT SECURITY NOTE:
     * This app uses contextIsolation: true and nodeIntegration: false
     * for security. All Node.js APIs are accessed through the preload
     * script's contextBridge, not directly from the renderer.
     */
    renderer(),
  ],

  /**
   * Path Resolution Aliases
   *
   * The '@' alias points to the src directory, allowing imports like:
   * import Header from '@/components/Header'
   *
   * This is a common convention that makes imports cleaner and allows
   * for easier refactoring (moving files doesn't break relative imports).
   */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  /**
   * Development Server Configuration
   *
   * Note: In development, Vite's dev server runs on port 5173 (default).
   * The Electron main process loads the app from this URL via
   * process.env.VITE_DEV_SERVER_URL (set by vite-plugin-electron).
   *
   * In production, the main process loads the built files from
   * the dist directory (created by 'vite build').
   *
   * Build Process Summary:
   * ---------------------
   * Development:
   *   1. Vite dev server starts on port 5173
   *   2. Electron main starts, loads URL from dev server
   *   3. Changes to renderer trigger HMR
   *   4. Changes to main/preload trigger restart/reload
   *
   * Production:
   *   1. Vite builds renderer to dist/
   *   2. vite-plugin-electron builds main to dist-electron/main/
   *   3. vite-plugin-electron builds preload to dist-electron/preload/
   *   4. Electron loads static files from dist/ and dist-electron/
   */
})
