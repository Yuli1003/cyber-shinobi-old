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
import { playSequenceAudio } from './modules/chaosSequence.js'
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
import { runLoginAutomation, runReadmeAutomation, removeFakeCursor } from './modules/autoMouse.js'
import { startChaosSequence, setOnSequenceComplete, stopChaosSequence } from './modules/chaosSequence.js'

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
 * Reset UI back to login screen so the sequence can run again.
 * Cleans up chaos sequence overlays and shows lock screen.
 */
function resetToLoginScreen() {
  stopChaosSequence()

  const lockScreen = document.getElementById('lock-screen')
  const desktop = document.getElementById('desktop')
  const loginForm = document.getElementById('login-form')
  const usernameInput = document.getElementById('username')
  const passwordInput = document.getElementById('password')
  const loginBox = document.querySelector('.lock-screen-box')

  if (lockScreen) {
    lockScreen.style.display = ''
    lockScreen.classList.remove('hidden')
  }
  if (desktop) desktop.classList.add('hidden')
  if (usernameInput) usernameInput.value = ''
  if (passwordInput) passwordInput.value = ''
  if (loginBox) loginBox.classList.remove('disintegrating')
  if (loginForm) loginForm.classList.remove('shake')

  // Remove any leftover overlays from chaos sequence
  const blackOverlay = document.getElementById('black-screen-overlay')
  const redOverlay = document.getElementById('red-screen-overlay')
  if (blackOverlay) blackOverlay.remove()
  if (redOverlay) redOverlay.remove()
}

/**
 * Show "Press Space to start" and run login automation when space is pressed.
 */
function waitForSpaceToStart() {
  const overlay = document.createElement('div')
  overlay.id = 'press-space-overlay'
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.7);
    pointer-events: none;
  `
  const text = document.createElement('div')
  text.textContent = ''
  text.style.cssText = `
    font-family: 'IBM Plex Mono', monospace;
    font-size: 24px;
    color: #fff;
    text-shadow: 0 0 10px #00ff41;
  `
  overlay.appendChild(text)
  document.body.appendChild(overlay)

  function onSpace(e) {
    if (e.code !== 'Space') return
    e.preventDefault()
    document.removeEventListener('keydown', onSpace)
    overlay.remove()
    setTimeout(() => {
      playSequenceAudio() // Start music 2 seconds after Space press
    }, 2800)
    runLoginAutomation()
  }
  document.addEventListener('keydown', onSpace)
}

/**
 * Show "Press Space to replay" and run callback when space is pressed.
 */
function waitForSpaceThenRerun() {
  const overlay = document.createElement('div')
  overlay.id = 'press-space-overlay'
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.7);
    pointer-events: none;
  `
  const text = document.createElement('div')
  text.textContent = ' '
  text.style.cssText = `
    font-family: 'IBM Plex Mono', monospace;
    font-size: 24px;
    color: #fff;
    text-shadow: 0 0 10px #00ff41;
  `
  overlay.appendChild(text)
  document.body.appendChild(overlay)

  function onSpace(e) {
    if (e.code !== 'Space') return
    e.preventDefault()
    document.removeEventListener('keydown', onSpace)
    overlay.remove()
    resetToLoginScreen()
    setTimeout(() => {
      playSequenceAudio()
    }, 2800)
    setTimeout(() => runLoginAutomation(), 300)
  }
  document.addEventListener('keydown', onSpace)
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
  
  // When sequence ends (after Phase 3), wait for spacebar then reset and rerun from login
  setOnSequenceComplete(waitForSpaceThenRerun)

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

      // Run README automation, then start chaos sequence (login → desktop → README → Phase 1–3)
      setTimeout(() => {
        runReadmeAutomation().then(() => {
          startChaosSequence()
        })
      }, 500)
    }, 500)
  })

  // Show "Press Space to start" and begin login automation only after space is pressed
  setTimeout(() => {
    waitForSpaceToStart()
  }, 800)
})
