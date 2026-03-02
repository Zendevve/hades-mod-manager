# Getting Started with Hades Mod Manager

This guide walks you through installing, configuring, and using Hades Mod Manager to enhance your gaming experience with community-created mods.

## Prerequisites

Before installing Hades Mod Manager, ensure you have the following:

- Hades game installed on your computer
- Administrative privileges (for initial setup)
- Internet connection (for downloading mods)

## Installation

### Downloading the Application

1. Download the latest release of Hades Mod Manager from the releases page
2. Extract the downloaded archive to your preferred location
3. Run `Hades Mod Manager.exe` to launch the application

### First Launch

When you first launch Hades Mod Manager:

1. The application will create necessary configuration files
2. You'll be presented with the Welcome Screen
3. Follow the prompts to configure your mod directory

## Initial Setup

### Configuring the Mod Directory

The mod directory is where all your mods will be stored and managed. To set it up:

1. From the Welcome Screen, click **"Select Mod Folder"**
2. Navigate to your preferred location for storing mods
3. Click **"Select Folder"** to confirm

> [!TIP]
> We recommend creating a dedicated folder for mods, such as `C:\Users\[YourName]\Documents\HadesMods` or a location of your choice.

### Validating the Setup

After selecting your mod directory, the application will:

- Validate the folder structure
- Create necessary subdirectories
- Scan for any existing mods

## Understanding the Interface

### Main Window Layout

The Hades Mod Manager interface consists of several key areas:

```
┌─────────────────────────────────────────────────────────┐
│  Header (Application title and status)                  │
├─────────────────────────────────────────────────────────┤
│  Action Bar (Common operations)                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┬─────────────────────────────┐  │
│  │                     │                             │  │
│  │   Mod List          │   Mod Detail View           │  │
│  │   (Left Panel)      │   (Right Panel)             │  │
│  │                     │                             │  │
│  │   - Mod names       │   - Description             │  │
│  │   - Status icons    │   - Author info             │  │
│  │   - Toggle switches │   - Version                 │  │
│  │                     │   - Actions                 │  │
│  └─────────────────────┴─────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Log Viewer (Activity and error messages)               │
└─────────────────────────────────────────────────────────┘
```

### Header

The Header displays:
- Application title
- Current mod directory path
- Connection status indicators

### Action Bar

The Action Bar provides quick access to:
- **Refresh**: Rescan the mod directory for changes
- **Import**: Add mods from external sources
- **Download**: Access the mod downloader
- **Settings**: Configure application preferences

### Mod List (Left Panel)

The Mod List displays all detected mods with:
- Mod name and version
- Enable/disable toggle switches
- Status indicators (active, disabled, error)
- Search and filter options

### Mod Detail View (Right Panel)

When you select a mod, this panel shows:
- Full mod description
- Author information
- Version number
- Installation date
- Available actions (enable, disable, uninstall)

### Log Viewer

The Log Viewer displays real-time activity:
- Mod loading status
- Error messages
- Operation confirmations
- System notifications

## Managing Mods

### Installing Mods

#### Method 1: Import from Folder

1. Click **"Import"** in the Action Bar
2. Select the folder containing the mod files
3. The application will validate and copy the mod to your mod directory

#### Method 2: Download from Source

1. Click **"Download"** in the Action Bar
2. Enter the mod URL or browse available mods
3. The application will download and install the mod automatically

### Enabling and Disabling Mods

To enable or disable a mod:

1. Locate the mod in the Mod List
2. Click the toggle switch next to the mod name
3. The mod status will update in real-time

> [!NOTE]
> Disabled mods remain installed but won't be loaded by the game.

### Uninstalling Mods

To remove a mod completely:

1. Select the mod in the Mod List
2. In the Mod Detail View, click **"Uninstall"**
3. Confirm the deletion when prompted

### Organizing Mods

Use the following features to organize your mods:

- **Search**: Use the search box to find specific mods
- **Filter**: Filter by status (enabled, disabled, all)
- **Sort**: Sort by name, date, or status

## Working with the Mod Downloader

The Mod Downloader allows you to download mods directly from supported sources:

1. Click **"Download"** in the Action Bar
2. Browse or search for available mods
3. Select a mod to view its details
4. Click **"Download and Install"** to add it to your collection

## Viewing Logs

The Log Viewer helps you monitor application activity:

- **Info messages**: General operation status
- **Warning messages**: Non-critical issues
- **Error messages**: Problems that need attention

To clear the log:
1. Right-click in the Log Viewer area
2. Select **"Clear Log"**

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + R` | Refresh mod list |
| `Ctrl + I` | Import mod |
| `Ctrl + D` | Open downloader |
| `Ctrl + F` | Focus search box |
| `F5` | Refresh |
| `Delete` | Uninstall selected mod |

## Next Steps

Now that you're familiar with the basics:

- Learn about the [application architecture](architecture.md)
- Explore [component details](components.md) for advanced usage
- Check the [troubleshooting guide](troubleshooting.md) if you encounter issues
- Review the [development guide](development.md) if you want to contribute

## Getting Help

If you need assistance:

1. Check the [troubleshooting guide](troubleshooting.md)
2. Review the log viewer for error messages
3. Consult the project documentation

## See Also

- [Architecture Overview](architecture.md)
- [Component Reference](components.md)
- [Troubleshooting](troubleshooting.md)
