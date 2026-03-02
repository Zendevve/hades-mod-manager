# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Hades Mod Manager.

## Common Issues

### Application Won't Start

#### Symptoms
- Double-clicking the executable does nothing
- Error message on launch
- Application window doesn't appear

#### Solutions

1. **Check System Requirements**
   - Ensure you're running Windows 10 or later
   - Verify you have sufficient disk space (at least 100 MB)
   - Check that your system meets minimum RAM requirements (4 GB)

2. **Verify Installation**
   - Re-extract the application archive
   - Ensure all files are present in the installation folder
   - Try running as administrator (right-click → Run as administrator)

3. **Check for Missing Dependencies**
   - Install the latest Visual C++ Redistributable
   - Update Windows to the latest version
   - Ensure .NET Framework is installed

---

### Mod Directory Not Found

#### Symptoms
- "Mod directory not configured" error
- Empty mod list after setup
- Cannot select mod folder

#### Solutions

1. **Verify Directory Path**
   - Ensure the path doesn't contain special characters
   - Check that you have read/write permissions
   - Try creating the folder manually first

2. **Check Folder Permissions**
   - Right-click the mod folder → Properties → Security
   - Ensure your user has Full Control permissions
   - Try moving the folder to your Documents directory

3. **Reset Configuration**
   - Close the application
   - Delete or rename `mod-manager-config.json` in the mod directory
   - Restart the application and reconfigure

---

### Mods Not Appearing in List

#### Symptoms
- Mod folder contains files but nothing shows in app
- Mods appear as "Invalid" or "Error"
- Some mods missing from the list

#### Solutions

1. **Verify Mod Structure**
   Ensure each mod folder contains required files:
   ```
   mod-folder/
   ├── modfile.txt (required)
   ├── *.lua files
   └── metadata.json (optional)
   ```

2. **Refresh Mod List**
   - Click the Refresh button in the Action Bar
   - Press `F5` or `Ctrl+R`
   - Restart the application

3. **Check File Permissions**
   - Verify the application can read the mod files
   - Check that mod files aren't marked as read-only
   - Ensure antivirus isn't blocking file access

4. **Validate Mod Files**
   - Check that `modfile.txt` is present in each mod folder
   - Verify Lua files have correct syntax
   - Look for error messages in the Log Viewer

---

### Cannot Enable/Disable Mods

#### Symptoms
- Toggle switches don't respond
- Mod state doesn't persist
- Error message when toggling

#### Solutions

1. **Check File Locks**
   - Ensure Hades game is not running
   - Close any file explorers viewing the mod folder
   - Check that no other applications are using the files

2. **Verify Permissions**
   - Run the mod manager as administrator
   - Check write permissions on the mod directory
   - Ensure the mod files aren't read-only

3. **Check Disk Space**
   - Verify you have enough free disk space
   - Mod operations may require temporary space
   - Clear temporary files if needed

---

### Mod Downloader Not Working

#### Symptoms
- Cannot download mods
- Download fails or times out
- "Network error" messages

#### Solutions

1. **Check Internet Connection**
   - Verify your internet connection is active
   - Try accessing the mod source website in a browser
   - Check firewall settings

2. **Configure Proxy (if needed)**
   - If behind a corporate proxy, configure system proxy settings
   - Check with your network administrator

3. **Try Manual Download**
   - Download the mod manually from the source
   - Use the Import feature to add the mod
   - This bypasses network-related issues

---

### Application Crashes or Freezes

#### Symptoms
- Application becomes unresponsive
- Error dialogs appear
- Application closes unexpectedly

#### Solutions

1. **Check Log Files**
   - Review the Log Viewer for error messages
   - Look for JavaScript errors in the console
   - Check Windows Event Viewer for system errors

2. **Clear Cache and Settings**
   ```
   1. Close the application
   2. Navigate to: %APPDATA%/hades-mod-manager
   3. Delete or rename the cache folder
   4. Restart the application
   ```

3. **Update Graphics Drivers**
   - Electron apps may have GPU-related issues
   - Update your graphics card drivers
   - Try running with `--disable-gpu` flag

4. **Disable Hardware Acceleration**
   - Create a shortcut to the application
   - Add `--disable-gpu` to the target path
   - Launch using this shortcut

---

### Mod Conflicts

#### Symptoms
- Mods not working in game
- Game crashes with mods enabled
- Unexpected behavior in Hades

#### Solutions

1. **Check Mod Compatibility**
   - Verify mods are for the correct game version
   - Check mod documentation for known conflicts
   - Disable recently added mods to identify conflicts

2. **Load Order**
   - Some mods may require specific load order
   - Check mod documentation for dependencies
   - Enable mods one at a time to test

3. **Clean Installation**
   - Disable all mods
   - Enable them one by one
   - Identify which mod causes issues

---

### Slow Performance

#### Symptoms
- UI is sluggish or unresponsive
- Long loading times
- High CPU or memory usage

#### Solutions

1. **Large Mod Collections**
   - The application loads all mods at startup
   - Consider organizing mods into subdirectories
   - Disable unused mods instead of keeping them all enabled

2. **System Resources**
   - Close other applications to free up RAM
   - Check Task Manager for high resource usage
   - Consider upgrading hardware if consistently slow

3. **Optimize Settings**
   - Reduce log verbosity in settings
   - Disable auto-refresh if not needed
   - Clear old log files

---

## Error Messages Reference

### "ENOENT: no such file or directory"

**Cause**: The application cannot find a required file or directory.

**Solution**:
- Verify the mod directory path is correct
- Ensure the mod folder exists
- Check that files haven't been moved or deleted

### "EACCES: permission denied"

**Cause**: The application doesn't have permission to access files.

**Solution**:
- Run as administrator
- Check folder permissions
- Move mod directory to a user-accessible location

### "EPERM: operation not permitted"

**Cause**: File is locked by another process.

**Solution**:
- Close Hades game
- Close file explorers
- Restart the mod manager

### "ENOTDIR: not a directory"

**Cause**: Expected a directory but found a file.

**Solution**:
- Check mod folder structure
- Ensure mods are in their own subdirectories
- Remove any loose files from the mod root

### "SyntaxError: Unexpected token"

**Cause**: Corrupted configuration or mod file.

**Solution**:
- Delete `mod-manager-config.json`
- Reconfigure the application
- Check mod files for syntax errors

---

## Log Viewer Interpretation

### Understanding Log Levels

| Level | Color | Meaning |
|-------|-------|---------|
| INFO | Blue/White | Normal operation |
| WARN | Yellow | Non-critical issue |
| ERROR | Red | Problem requiring attention |

### Common Log Messages

**"Scanning mod directory..."**
- Normal operation during refresh
- No action needed

**"Failed to parse mod metadata"**
- Check the specific mod's metadata.json file
- Verify JSON syntax is valid
- This is a warning; the mod may still work

**"IPC communication timeout"**
- Main and renderer processes out of sync
- Try restarting the application
- Check for blocking operations

**"Mod validation failed"**
- Missing required files in mod folder
- Check that modfile.txt exists
- Verify mod structure

---

## Getting Help

### Before Requesting Support

1. Check this troubleshooting guide thoroughly
2. Review the Log Viewer for specific error messages
3. Try the solutions listed above
4. Note your operating system and application version

### Information to Provide

When seeking help, include:
- Operating system and version
- Application version
- Steps to reproduce the issue
- Relevant log messages
- Screenshots if applicable

### Reporting Bugs

If you've found a bug:
1. Check if it's already reported
2. Provide detailed reproduction steps
3. Include error messages and logs
4. Describe expected vs actual behavior

---

## Advanced Diagnostics

### Enable Debug Mode

Create a `debug.log` file in the application directory to enable verbose logging.

### Check Configuration File

The configuration is stored in `mod-manager-config.json`:

```json
{
  "modDirectory": "C:/path/to/mods",
  "settings": {
    "autoRefresh": true,
    "logLevel": "debug"
  }
}
```

### Reset to Defaults

To completely reset the application:

1. Close the application
2. Delete `%APPDATA%/hades-mod-manager/` folder
3. Delete `mod-manager-config.json` from mod directory
4. Restart the application

---

## Prevention Tips

1. **Regular Backups**
   - Back up your mod directory periodically
   - Keep copies of working configurations

2. **Update Regularly**
   - Keep the mod manager updated
   - Update mods when new versions are available

3. **Organize Mods**
   - Use descriptive folder names
   - Keep notes on mod compatibility
   - Document any custom configurations

4. **Monitor Resources**
   - Don't enable too many mods at once
   - Keep the mod directory organized
   - Clear logs periodically

---

## See Also

- [Getting Started Guide](getting-started.md)
- [Architecture Overview](architecture.md)
- [Component Documentation](components.md)
- [Development Guide](development.md)
