/**
 * Desktop Module
 * Handles desktop UI components: icons, taskbar, start menu, clock, context menu
 */

import { startDesktopAsciiCamera, stopDesktopAsciiCamera, isDesktopCameraActive } from './desktopCamera.js'
import { startMinesweeperGame, stopMinesweeperGame, isMinesweeperActive } from './minesweeper.js'
import { startMouseTrail, stopMouseTrail, isMouseTrailActive } from './mouseTrail.js'
import { startTextExplorer, stopTextExplorer, isTextExplorerActive } from './textExplorer.js'
import { startImageTrash, stopImageTrash, isImageTrashActive } from './imageTrash.js'
import { startChaosSequence, isChaosSequenceActive } from './chaosSequence.js'

const desktopIcons = [
  { id: 'explorer', icon: '📁', label: 'File Explorer', newIcon: 'final icons/files.png' },
  { id: 'browser', icon: '🌐', label: 'Browser', newIcon: 'final icons/browser.png' },
  { id: 'notepad', icon: '✉️', label: 'Notepad', newIcon: 'final icons/txt.png' },
  { id: 'calculator', icon: '🔢', label: 'Calculator', newIcon: 'final icons/calc.png' },
  { id: 'trash', icon: '🗑️', label: 'Trash', newIcon: 'final icons/TRASH.png' },
  { id: 'settings', icon: '⚙️', label: 'Settings', newIcon: 'final icons/settings.png' },
]

let windowManager = null
let appOpenCallback = null
let interactionsDisabled = false
let specialEffectsEnabled = false // Enable after icon glitch

/**
 * Initialize desktop module
 * @param {WindowManager} wm - Window manager instance
 * @param {Function} onAppOpen - Callback when app is opened
 */
export function initDesktop(wm, onAppOpen) {
  windowManager = wm
  appOpenCallback = onAppOpen
}

/**
 * Disable all desktop interactions (icons, start menu, taskbar)
 */
export function disableAllDesktopInteractions() {
  interactionsDisabled = true
  
  // Disable desktop icons (but keep them visible)
  const icons = document.querySelectorAll('.desktop-icon')
  icons.forEach(icon => {
    icon.style.pointerEvents = 'none'
  })
  
  // Disable start button
  const startBtn = document.getElementById('start-btn')
  if (startBtn) {
    startBtn.style.pointerEvents = 'none'
  }
  
  // Disable taskbar apps
  const taskbarApps = document.getElementById('taskbar-apps')
  if (taskbarApps) {
    taskbarApps.style.pointerEvents = 'none'
  }
}

/**
 * Enable all desktop interactions
 */
export function enableAllDesktopInteractions() {
  interactionsDisabled = false
  
  // Enable desktop icons
  const icons = document.querySelectorAll('.desktop-icon')
  icons.forEach(icon => {
    icon.style.pointerEvents = 'auto'
  })
  
  // Enable start button
  const startBtn = document.getElementById('start-btn')
  if (startBtn) {
    startBtn.style.pointerEvents = 'auto'
  }
  
  // Enable taskbar apps
  const taskbarApps = document.getElementById('taskbar-apps')
  if (taskbarApps) {
    taskbarApps.style.pointerEvents = 'auto'
  }
}

/**
 * Glitch all desktop icons and change them to new versions
 */
export function glitchAllDesktopIcons() {
  const iconElements = document.querySelectorAll('.desktop-icon')
  
  iconElements.forEach((iconEl, index) => {
    const iconSpan = iconEl.querySelector('.icon')
    const label = iconEl.querySelector('.label')
    if (!iconSpan || !label) return
    
    // Find matching icon config
    const iconConfig = desktopIcons.find(ic => ic.label === label.textContent)
    if (!iconConfig || !iconConfig.newIcon) return
    
    // Stagger the glitch effect
    setTimeout(() => {
      let glitchCounter = 0
      const glitchDuration = 500
      const glitchInterval = 30
      const glitchCount = glitchDuration / glitchInterval
      
      const glitchTimer = setInterval(() => {
        if (glitchCounter >= glitchCount) {
          clearInterval(glitchTimer)
          
          // Replace with new image
          iconSpan.innerHTML = `<img src="${iconConfig.newIcon}" style="width: 48px; height: 48px; object-fit: contain;">`
          iconSpan.style.transform = ''
          iconSpan.style.opacity = '1'
          iconSpan.style.filter = ''
          return
        }
        
        // Random glitch effects
        const glitchEffects = [
          `translateX(${(Math.random() - 0.5) * 10}px) skewX(${(Math.random() - 0.5) * 30}deg)`,
          `translateY(${(Math.random() - 0.5) * 10}px) scaleX(${0.7 + Math.random() * 0.6})`,
          `translateX(${(Math.random() - 0.5) * 15}px) scaleY(${0.7 + Math.random() * 0.6})`,
          'translateX(0) translateY(0)'
        ]
        
        iconSpan.style.transform = glitchEffects[Math.floor(Math.random() * glitchEffects.length)]
        iconSpan.style.opacity = Math.random() > 0.3 ? '1' : '0.5'
        iconSpan.style.filter = Math.random() > 0.5 ? 'invert(1) hue-rotate(180deg)' : 'none'
        
        glitchCounter++
      }, glitchInterval)
    }, index * 100) // Stagger each icon's glitch
  })
  
  // Enable special effects after all icons are glitched
  const totalGlitchTime = iconElements.length * 100 + 500
  setTimeout(() => {
    specialEffectsEnabled = true
  }, totalGlitchTime)
}

/**
 * Create desktop icons
 */
export function createDesktopIcons() {
  const container = document.getElementById('desktop-icons')
  if (!container) return
  
  container.innerHTML = '' // Clear existing icons
  
  desktopIcons.forEach(iconData => {
    const icon = document.createElement('div')
    icon.className = 'desktop-icon'
    icon.innerHTML = `
      <span class="icon">${iconData.icon}</span>
      <span class="label">${iconData.label}</span>
    `
    
    // Single click selects
    icon.addEventListener('click', (e) => {
      if (interactionsDisabled) return
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'))
      icon.classList.add('selected')
    })
    
    // Double click opens - with special effects after icon glitch
    icon.addEventListener('dblclick', () => {
      if (interactionsDisabled) return
      
      // Check for special effects on specific icons
      if (specialEffectsEnabled) {
        // ANY icon click triggers the chaos sequence
        if (!isChaosSequenceActive()) {
          startChaosSequence()
          return
        }
        
        // If sequence is already active, ignore further clicks
        return
        
        /* OLD INDIVIDUAL EFFECTS - Now replaced by chaos sequence
        if (iconData.id === 'browser') {
          // Browser: Toggle ASCII camera on desktop
          if (isDesktopCameraActive()) {
            stopDesktopAsciiCamera()
          } else {
            startDesktopAsciiCamera()
          }
          return
        }
        
        if (iconData.id === 'calculator') {
          // Calculator: Toggle minesweeper game
          if (isMinesweeperActive()) {
            stopMinesweeperGame()
          } else {
            startMinesweeperGame()
          }
          return
        }
        
        if (iconData.id === 'settings') {
          // Settings: Start mouse trail effect
          if (!isMouseTrailActive()) {
            startMouseTrail()
          }
          return
        }

        if (iconData.id === 'explorer') {
          // File Explorer: Start glitchy text spine effect
          if (!isTextExplorerActive()) {
            startTextExplorer()
          } else {
            stopTextExplorer()
          }
          return
        }

        if (iconData.id === 'trash') {
          // Trash: Start image spine effect
          if (!isImageTrashActive()) {
            startImageTrash()
          } else {
            stopImageTrash()
          }
          return
        }
        */
      }
      
      // Default behavior: open app via callback
      if (appOpenCallback) appOpenCallback(iconData.id)
    })
    
    container.appendChild(icon)
  })
  
  // Click on desktop to deselect icons
  const desktop = document.getElementById('desktop')
  if (desktop) {
    desktop.addEventListener('click', (e) => {
      if (e.target.id === 'desktop' || e.target.id === 'desktop-icons') {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'))
      }
    })
  }
}

/**
 * Initialize taskbar
 */
export function initTaskbar() {
  if (windowManager) {
    windowManager.onWindowsChange = updateTaskbar
  }
}

/**
 * Update taskbar (currently minimal, no window buttons shown)
 */
function updateTaskbar() {
  const container = document.getElementById('taskbar-apps')
  if (container) {
    container.innerHTML = ''
  }
}

/**
 * Initialize start menu
 */
export function initStartMenu() {
  const startBtn = document.getElementById('start-btn')
  const startMenu = document.getElementById('start-menu')
  if (!startBtn || !startMenu) return
  
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    startMenu.classList.toggle('hidden')
  })
  
  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
      startMenu.classList.add('hidden')
    }
  })
  
  // App clicks in start menu
  document.querySelectorAll('.start-app').forEach(app => {
    app.addEventListener('click', () => {
      const appId = app.dataset.app
      if (appOpenCallback) appOpenCallback(appId)
      startMenu.classList.add('hidden')
    })
  })
  
  // Power button
  const powerBtn = document.querySelector('.power-btn')
  if (powerBtn) {
    powerBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to shut down?')) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-size:24px;">Goodbye!</div>'
      }
    })
  }
}

/**
 * Initialize clock
 */
export function initClock() {
  const clockEl = document.getElementById('clock')
  if (!clockEl) return
  
  function updateClock() {
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    clockEl.innerHTML = `${time}<br>${date}`
  }
  
  updateClock()
  setInterval(updateClock, 1000)
}

/**
 * Initialize context menu
 */
export function initContextMenu() {
  let contextMenu = null
  const desktop = document.getElementById('desktop')
  if (!desktop) return
  
  desktop.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    
    // Remove existing context menu
    if (contextMenu) contextMenu.remove()
    
    // Show only on desktop background
    if (e.target.id === 'desktop' || e.target.id === 'desktop-icons' || e.target.closest('#desktop-icons')) {
      contextMenu = document.createElement('div')
      contextMenu.className = 'context-menu'
      contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="refresh">🔄 Refresh</div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="new-folder">📁 New Folder</div>
        <div class="context-menu-item" data-action="new-file">📄 New File</div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="settings">⚙️ Display Settings</div>
      `
      
      contextMenu.style.left = `${e.clientX}px`
      contextMenu.style.top = `${e.clientY}px`
      
      document.body.appendChild(contextMenu)
      
      // Handle menu clicks
      contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action
          if (action === 'settings' && appOpenCallback) {
            appOpenCallback('settings')
          } else if (action === 'refresh') {
            location.reload()
          }
          contextMenu.remove()
          contextMenu = null
        })
      })
    }
  })
  
  // Close on any click
  document.addEventListener('click', () => {
    if (contextMenu) {
      contextMenu.remove()
      contextMenu = null
    }
  })
}
