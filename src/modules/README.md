# Project Structure

This project has been reorganized into a modular architecture for better maintainability and readability.

## File Organization

```
src/
├── main.js                 # Entry point - app initialization
├── windowManager.js        # Window management system
├── apps.js                 # App configurations (notepad, calculator, browser, etc.)
├── style.css              # Global styles
└── modules/
    ├── antivirus.js       # Fake antivirus/security popups
    ├── desktop.js         # Desktop UI (icons, taskbar, start menu, clock, context menu)
    ├── lockscreen.js      # Login screen and pixel disintegration effect
    ├── debug.js           # Debug menu and development tools
    └── utils.js           # Utility functions (random, pixel effects)
```

## Module Descriptions

### main.js
- Application entry point
- Initializes all modules
- Handles app opening logic
- Browser spam feature (ASCII Camera)
- DOM ready event handler

### modules/antivirus.js
**Exports:**
- `initAntivirus(windowManager, isDebug)` - Initialize module
- `showAntivirusPopup()` - Show shield with exclamation mark
- `showInstallationWindow()` - Show fake installation with progress bar
- `showUpdateFailedPopup()` - Show "Update Failed" dialog
- `showAntivirusInfoPage()` - Show fake browser with scareware page
- `setDebugMode(enabled)` - Update debug mode flag

**Features:**
- Fake antivirus notification sequence
- Progress bar with pixel interference
- Chrome-styled fake browser window

### modules/desktop.js
**Exports:**
- `initDesktop(windowManager, onAppOpen)` - Initialize module
- `createDesktopIcons()` - Create desktop icon grid
- `initTaskbar()` - Initialize taskbar
- `initStartMenu()` - Initialize start menu
- `initClock()` - Initialize taskbar clock
- `initContextMenu()` - Initialize right-click menu

**Features:**
- Desktop icon management
- Start menu with app launcher
- Live clock updates
- Right-click context menu
- Power button

### modules/lockscreen.js
**Exports:**
- `initLockScreen(onLoginSuccess)` - Initialize login screen
- `triggerPixelDisintegration(element, debugMode)` - Black pixel glitch effect

**Features:**
- Login form handling
- Dramatic pixel disintegration animation
- Seeded random for consistent patterns

### modules/debug.js
**Exports:**
- `initDebug(callbacks)` - Initialize with callbacks
- `initDebugListeners()` - Setup keyboard shortcuts
- `toggleDebugMenu()` - Show/hide debug menu

**Keyboard Shortcuts:**
- `D` - Show pixel disintegration in debug mode
- `I` - Loop installation window
- `Ctrl+D` - Open debug menu

**Debug Menu:**
- Jump to login glitch
- Jump to installation window
- Jump to update failed popup
- Jump to antivirus info page

### modules/utils.js
**Exports:**
- `randomInt(min, max)` - Random integer generator
- `seededRandom()` - Seeded random for consistent patterns
- `createPixelInterference(container, progressFill, onComplete)` - Pixel interference effect for progress bars

## Development Mode

By default, the app skips the login screen for easier development. To enable the login screen:

1. Open `src/main.js`
2. Comment out the development mode section
3. Uncomment the production mode section:

```javascript
// DEVELOPMENT MODE: Skip login screen
// if (lockScreen) lockScreen.style.display = 'none'
// if (desktop) desktop.classList.remove('hidden')
// initializeDesktop()
// initDebugListeners()

// PRODUCTION MODE: Enable login screen
initLockScreen(initializeDesktop)
initDebugListeners()
```

## Adding New Features

### Adding a new desktop app
Edit `src/apps.js` and add your app configuration.

### Adding a new desktop icon
Edit the `desktopIcons` array in `src/modules/desktop.js`.

### Modifying antivirus sequence
Edit functions in `src/modules/antivirus.js`:
- Timing: Change delays in `showAntivirusPopup()`
- Progress bar: Modify `duration` and `pixelIntervals` in `showInstallationWindow()`
- Content: Update HTML templates in respective functions

### Customizing pixel effects
Edit `src/modules/lockscreen.js` and `src/modules/utils.js`:
- Pattern: Modify pixel generation loops
- Animation: Adjust wave delays and random offsets

## Best Practices

1. **Keep modules focused** - Each module handles one aspect of the app
2. **Use exports/imports** - All cross-module communication via explicit imports
3. **Avoid global state** - Pass dependencies via initialization functions
4. **Document functions** - Use JSDoc comments for public APIs
5. **Test in isolation** - Each module can be tested independently

## Troubleshooting

**Module not found errors:**
- Ensure file paths use `.js` extensions
- Check that module exports match imports

**Functions not working:**
- Verify module initialization order in `main.js`
- Check that callbacks are properly passed to modules
- Use debug menu (Ctrl+D) to test individual features

**Old backup:**
If you need to revert changes, the old main.js is saved as `src/main-old.js`.
