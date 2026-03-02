# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project setup and foundation

## [1.0.0] - 2026-03-02

### Added

- **Mod Management**: Browse, install, uninstall, and organize Hades mods with an intuitive interface
- **Mod Detail View**: View comprehensive mod information with metadata, descriptions, and version details
- **Mod Downloader**: Built-in download capability for fetching mods directly from supported sources
- **Real-time Log Viewer**: Stream standard output and error logs from the Mod Engine directly in the application
- **Dynamic Action Bar**: macOS-style sticky pill interface for rapid mod operations (install, uninstall, enable, disable)
- **Automated Python Integration**: Seamlessly bridges Node.js with the `modimporter.py` engine from SGG-Mod-Format
- **Asymmetric Bento UI**: Modern interface utilizing Framer Motion layout transitions for organic sorting and reveals
- **Liquid Glass Rendering**: Authentic glassmorphism with inner refraction borders and diffusion shadows
- **Welcome Screen**: First-time user onboarding with setup guidance
- **Error Boundary**: Graceful error handling and recovery mechanisms
- **Accessibility Support**: Keyboard shortcuts, screen reader support, and focus management
- **Virtual Scrolling**: Performance optimization for large mod lists
- **Search and Filter**: Quick mod finding with real-time search
- **Settings Management**: Persistent configuration for mod directory and user preferences

### Changed

- N/A (Initial release)

### Deprecated

- N/A (Initial release)

### Removed

- N/A (Initial release)

### Fixed

- N/A (Initial release)

### Security

- Secure IPC communication between Electron main and renderer processes
- Input validation for all mod operations
- Safe file system operations with path traversal protection

---

## Release Notes Template

When creating a new release, use the following template:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

[Unreleased]: https://github.com/yourusername/hades-mod-manager/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/hades-mod-manager/releases/tag/v1.0.0
