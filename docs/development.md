# Development Guide

This guide provides instructions for setting up your development environment, understanding the codebase, and contributing to Hades Mod Manager.

## Prerequisites

Before you begin development, ensure you have the following installed:

- **Node.js** (version 18 or later)
- **npm** (included with Node.js) or **yarn**
- **Git** for version control
- **Visual Studio Code** (recommended) or your preferred IDE

### Windows-Specific Requirements

- Windows 10 or later
- Windows Build Tools (for native modules)

## Setting Up the Development Environment

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hades-mod-manager
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and ReactDOM
- Electron
- Vite
- Tailwind CSS
- Lucide React icons
- Development tools (ESLint, Prettier)

> ⚠️ **Note about dependency warnings**
>
> During `npm install`, you may see deprecation warnings for some packages. **This is expected and safe to ignore.**
>
> - **Do NOT run `npm audit fix`** or **`npm audit fix --force`**
> - These are build-time dependencies that do not affect the runtime security of the application
> - The warnings come from transitive dependencies of Electron and Vite, which we cannot directly control
>
> For more details, see the [Troubleshooting Guide](troubleshooting.md#dependency-warnings).

### 3. Configure Development Settings

Create a `.env` file in the project root (optional):

```env
# Development settings
NODE_ENV=development
ELECTRON_ENABLE_LOGGING=true
```

## Project Structure

```
hades-mod-manager/
├── electron/                 # Electron main process
│   ├── main.js              # Main entry point
│   ├── preload.js           # Preload script
│   ├── ipcChannels.js       # IPC channel constants
│   ├── modEngine.js         # Mod operations
│   └── settings.js          # Configuration management
├── src/                     # React application
│   ├── components/          # React components
│   │   ├── ActionBar.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── Header.jsx
│   │   ├── LogViewer.jsx
│   │   ├── ModDetail.jsx
│   │   ├── ModDownloader.jsx
│   │   ├── ModList.jsx
│   │   └── WelcomeScreen.jsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAccessibility.js
│   │   └── useModOperations.js
│   ├── App.jsx              # Root component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── docs/                    # Documentation
├── dist/                    # Build output (React)
├── dist-electron/           # Build output (Electron)
├── release/                 # Packaged application
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
└── tailwind.config.js       # Tailwind CSS configuration
```

## Development Workflow

### Running in Development Mode

Start the development server with hot reloading:

```bash
npm run dev
```

This command:
1. Starts the Vite development server
2. Launches Electron with the development build
3. Enables hot module replacement for React components

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Electron |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run dist` | Create distributable installer |
| `npm run lint` | Run ESLint on source files |
| `npm run lint:fix` | Fix ESLint errors automatically |

### Debugging

#### Main Process Debugging

To debug the Electron main process:

1. Set breakpoints in `electron/main.js` or other main process files
2. Run `npm run dev`
3. Use Chrome DevTools (accessible from View menu) or VS Code debugger

#### Renderer Process Debugging

React DevTools and Chrome DevTools are available in development:

1. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
2. Use the React DevTools tab for component inspection
3. Use the Console for logging

#### VS Code Debugging Configuration

Add this to your `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "args": ["run", "dev"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## Building the Application

### Production Build

Create a production-ready build:

```bash
npm run build
```

This generates:
- `dist/` - Bundled React application
- `dist-electron/` - Compiled Electron main process

### Creating Installer

Package the application for distribution:

```bash
npm run dist
```

The installer will be created in the `release/` directory.

### Build Configuration

Build settings are controlled in `package.json`:

```json
{
  "build": {
    "appId": "com.example.hades-mod-manager",
    "productName": "Hades Mod Manager",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*"
    ],
    "win": {
      "target": "nsis"
    }
  }
}
```

## Code Style and Standards

### ESLint Configuration

The project uses ESLint for code quality. Configuration is in `.eslintrc.cjs`:

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'dist-electron', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

### Code Formatting

Use consistent formatting:

- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in objects/arrays

### React Best Practices

1. **Functional Components**: Use functional components with hooks
2. **Props Destructuring**: Destructure props in component parameters
3. **Event Handlers**: Prefix with `handle` (e.g., `handleClick`)
4. **Custom Hooks**: Prefix with `use` (e.g., `useModOperations`)

Example:

```jsx
// Good
const ModList = ({ mods, onSelectMod }) => {
  const handleModClick = (mod) => {
    onSelectMod(mod);
  };

  return (
    <ul>
      {mods.map(mod => (
        <li key={mod.id} onClick={() => handleModClick(mod)}>
          {mod.name}
        </li>
      ))}
    </ul>
  );
};
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Test Structure

Create test files alongside components:

```
src/
└── components/
    ├── ModList.jsx
    └── ModList.test.jsx
```

### Writing Tests

Use React Testing Library:

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import ModList from './ModList';

describe('ModList', () => {
  const mockMods = [
    { id: '1', name: 'Test Mod', enabled: true },
  ];

  it('renders mod list', () => {
    render(<ModList mods={mockMods} />);
    expect(screen.getByText('Test Mod')).toBeInTheDocument();
  });
});
```

## Contributing

### Before You Start

1. Check existing issues and pull requests
2. Create a new branch for your feature/fix
3. Ensure your code follows the style guide

### Making Changes

1. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**:
   - Follow the code style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit Your Changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Format

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/config changes

Example:
```
feat: add mod search functionality

- Add search input to ModList
- Implement fuzzy matching
- Add keyboard shortcut (Ctrl+F)
```

## Common Development Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Add PropTypes or TypeScript interfaces
3. Create corresponding test file
4. Export from component index (if using barrel exports)
5. Document in [components.md](components.md)

### Adding IPC Communication

1. Define channel in `electron/ipcChannels.js`:
   ```javascript
   MODS: {
     NEW_CHANNEL: 'mods:newChannel'
   }
   ```

2. Add handler in `electron/main.js`:
   ```javascript
   ipcMain.handle(IPC_CHANNELS.MODS.NEW_CHANNEL, async (event, data) => {
     // Handler logic
   });
   ```

3. Expose in `electron/preload.js`:
   ```javascript
   newChannel: (data) => ipcRenderer.invoke('mods:newChannel', data)
   ```

4. Use in React component via hook or direct API call

### Styling with Tailwind CSS

Use Tailwind utility classes:

```jsx
<div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
  <h2 className="text-lg font-semibold text-white">Mod Name</h2>
  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
    Enable
  </button>
</div>
```

Custom styles can be added to `src/index.css`:

```css
@layer components {
  .mod-card {
    @apply p-4 bg-gray-800 rounded-lg shadow-md;
  }
}
```

## Troubleshooting Development Issues

### Common Issues

#### Electron Window Not Opening

- Check for errors in the terminal
- Verify `main.js` is correctly compiled
- Ensure `NODE_ENV` is set correctly

#### Hot Reload Not Working

- Restart the dev server: `Ctrl+C` then `npm run dev`
- Check for syntax errors in the console
- Verify Vite is running on the expected port

#### Build Failures

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors (if using TS)
- Verify all imports are correct

#### IPC Communication Errors

- Verify channel names match in all files
- Check that handlers are registered before use
- Ensure preload script is correctly configured

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## See Also

- [Getting Started Guide](getting-started.md)
- [Architecture Overview](architecture.md)
- [Component Documentation](components.md)
- [Troubleshooting Guide](troubleshooting.md)
