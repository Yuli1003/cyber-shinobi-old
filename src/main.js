/**
 * Main Entry Point
 * Cyber Shinobi - Windows-style desktop simulator
 */

// ============================================
// DEBUG MODE: Set to true to skip to README sequence
const DEBUG_MODE = false
// ============================================

import './style.css'
import { WindowManager } from './windowManager.js'
import { apps } from './apps.js'

// Modules
import { 
  initAntivirus, 
  showAntivirusPopup,
  spawnReadmeFiles
} from './modules/antivirus.js'
import { 
  initDesktop as initDesktopModule, 
  createDesktopIcons, 
  initTaskbar, 
  initStartMenu, 
  initClock, 
  initContextMenu,
  disableAllDesktopInteractions,
  enableAllDesktopInteractions
} from './modules/desktop.js'
import { initLockScreen } from './modules/lockscreen.js'

// Global state
const windowManager = new WindowManager()
window.windowManager = windowManager
window.apps = apps

// Initialize desktop module
initDesktopModule(windowManager, openApp)
initAntivirus(windowManager)

// Expose functions globally for antivirus module
window.disableAllDesktopInteractions = disableAllDesktopInteractions
window.enableAllDesktopInteractions = enableAllDesktopInteractions

/**
 * Initialize desktop components
 */
function initializeDesktop() {
  createDesktopIcons()
  initTaskbar()
  initStartMenu()
  initClock()
  initContextMenu()
  
  // Disable all desktop interactions - only shield will be clickable
  disableAllDesktopInteractions()
  
  // Show antivirus popup (shield with !)
  showAntivirusPopup()
}

/**
 * Open an application
 */
function openApp(appId, x, y) {
  const appConfig = apps[appId]
  if (!appConfig) return null
  
  const config = { ...appConfig }
  if (x !== undefined) config.x = x
  if (y !== undefined) config.y = y
  const win = windowManager.createWindow(config)
  
  return win
}

/**
 * DOM Ready - Initialize application
 */
document.addEventListener('DOMContentLoaded', () => {
  // Debug mode: skip directly to README sequence
  if (DEBUG_MODE) {
    // Hide lock screen and show desktop immediately
    const lockScreen = document.getElementById('lock-screen')
    const desktop = document.getElementById('desktop')
    if (lockScreen) lockScreen.style.display = 'none'
    if (desktop) desktop.classList.remove('hidden')
    
    // Initialize desktop without the antivirus sequence
    createDesktopIcons()
    initTaskbar()
    initStartMenu()
    initClock()
    initContextMenu()
    
    // Enable all interactions for debugging
    enableAllDesktopInteractions()
    
    // Spawn README files immediately
    setTimeout(() => {
      spawnReadmeFiles()
    }, 500)
    return
  }
  
  // Normal flow: Start from login screen
  // After successful login show the regular desktop and immediately spawn README files
  initLockScreen(() => {
    // Initialize desktop UI components (skip antivirus popup)
    createDesktopIcons()
    initTaskbar()
    initStartMenu()
    initClock()
    initContextMenu()

    // Enable interactions so the spawned README files can be interacted with
    enableAllDesktopInteractions()

    // Spawn README files shortly after the desktop appears
    setTimeout(() => {
      spawnReadmeFiles()
    }, 500)
  })
})
