/**
 * Main Entry Point
 * Cyber Shinobi - Windows-style desktop simulator
 */

import './style.css'
import { WindowManager } from './windowManager.js'
import { apps } from './apps.js'

// Modules
import { initAntivirus, showAntivirusPopup, showInstallationWindow, showUpdateFailedPopup, showAntivirusInfoPage, setDebugMode } from './modules/antivirus.js'
import { initDesktop as initDesktopModule, createDesktopIcons, initTaskbar, initStartMenu, initClock, initContextMenu } from './modules/desktop.js'
import { initLockScreen, triggerPixelDisintegration } from './modules/lockscreen.js'
import { initDebug, initDebugListeners } from './modules/debug.js'

// Global state
let isDebugMode = false
const windowManager = new WindowManager()
window.windowManager = windowManager

// Initialize all modules
initAntivirus(windowManager, isDebugMode)
initDesktopModule(windowManager, openApp)
initDebug({
  initDesktop: initializeDesktop,
  showInstallation: showInstallationWindow,
  showUpdateFailed: showUpdateFailedPopup,
  showAntivirusInfo: showAntivirusInfoPage,
  triggerPixelDisintegration
})

/**
 * Initialize desktop components
 */
function initializeDesktop() {
  createDesktopIcons()
  initTaskbar()
  initStartMenu()
  initClock()
  initContextMenu()
  showAntivirusPopup()
}

// Show antivirus warning popup
function showAntivirusPopup() {
  const iconContainer = document.getElementById('antivirus-icon-container')
  const notificationContainer = document.getElementById('antivirus-notification-container')
  if (!iconContainer || !notificationContainer) return
  
  // Show just the shield icon first
  iconContainer.classList.remove('hidden')
  iconContainer.classList.add('show-icon')
  
  // After 1 second, show the exclamation mark
  setTimeout(() => {
    iconContainer.classList.add('show-exclamation')
    
    // Add click handler to exclamation mark
    const exclamation = iconContainer.querySelector('.antivirus-exclamation')
    if (exclamation) {
      exclamation.addEventListener('click', () => {
        // Show the notification popup
        notificationContainer.classList.remove('hidden')
        notificationContainer.classList.add('show-notification')
      }, { once: true })
    }
  }, 1000)
  
  // Handle update button click
  const updateBtn = notificationContainer.querySelector('.antivirus-update-btn')
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      // Hide notification
      notificationContainer.classList.add('hidden')
      notificationContainer.classList.remove('show-notification')
      
      // Hide exclamation mark but keep shield
      iconContainer.classList.remove('show-exclamation')
      
      // Show installation window
      showInstallationWindow()
    })
  }
}

// Show installation window with loading bar
function showInstallationWindow() {
  // Create real window in center of screen
  const win = windowManager.createWindow({
    title: 'Security Update',
    icon: '🛡️',
    width: 400,
    height: 220,
    x: Math.floor((window.innerWidth - 400) / 2),
    y: Math.floor((window.innerHeight - 220) / 2),
    content: `
      <div class="installation-window-content">
        <p class="installation-status">Installing security updates...</p>
        <div class="progress-bar-container">
          <div class="progress-bar-fill"></div>
        </div>
        <p class="installation-percentage">0%</p>
      </div>
    `
  })
  
  const windowEl = document.getElementById(win.id)
  if (!windowEl) return
  
  const progressFill = windowEl.querySelector('.progress-bar-fill')
  const percentageText = windowEl.querySelector('.installation-percentage')
  const progressContainer = windowEl.querySelector('.progress-bar-container')
  
  // Animate progress bar over 10 seconds with pixel interference
  let progress = 0
  const duration = 10000 // CUSTOMIZE: Total time for the struggle (in milliseconds)
  const intervalTime = 50 // CUSTOMIZE: How often progress updates (lower = smoother)
  const increment = (100 / (duration / intervalTime)) // CUSTOMIZE: Progress speed - increase for faster loading
  
  // CUSTOMIZE: When pixels appear (in milliseconds) - add/remove times as needed
  const pixelIntervals = [2900, 5000, 6800,7200,8000, 8500]
  
  pixelIntervals.forEach(delay => {
    setTimeout(() => {
      createPixelInterference(progressContainer, progressFill, (pushbackAmount) => {
        // Receive pushback amount from pixel interference
        progress = Math.max(0, progress - pushbackAmount)
        progressFill.style.width = progress + '%'
        percentageText.textContent = Math.floor(progress) + '%'
      })
    }, delay)
  })
  
  const progressInterval = setInterval(() => {
    progress += increment
    
    if (progress > 100) {
      progress = 100
    }
    
    progressFill.style.width = progress + '%'
    percentageText.textContent = Math.floor(progress) + '%'
  }, intervalTime)
  
  // After 10 seconds, stop progress and show failure popup
  setTimeout(() => {
    clearInterval(progressInterval)
    windowManager.closeWindow(win.id)
    if (!isDebugMode) {
      showUpdateFailedPopup()
    }
  }, duration)
}

// Create black pixels that interfere with progress bar
function createPixelInterference(container, progressFill, onComplete) {
  const containerRect = container.getBoundingClientRect()
  const pixelCount = 5 + Math.floor(Math.random() * 8) // CUSTOMIZE: Number of pixels (5-13 random)
  
  // CUSTOMIZE: How much pixels push back progress
  const pushbackAmount = 8 + Math.random() * 10 // 8-18% random pushback
  
  for (let i = 0; i < pixelCount; i++) {
    setTimeout(() => {
      const pixel = document.createElement('div')
      pixel.className = 'interference-pixel'
      
      const size = 3 + Math.floor(Math.random() * 6) // CUSTOMIZE: Pixel size (3-9px random)
      pixel.style.width = size + 'px'
      pixel.style.height = size + 'px'
      
      // Disable CSS transition - we'll animate manually
      pixel.style.transition = 'none'
      
      // Random vertical position
      pixel.style.top = (Math.random() * 100) + '%'
      
      container.appendChild(pixel)
      
      // Manually animate pixel to follow progress bar
      const animationDuration = 2000 // Match CSS transition duration
      const startTime = Date.now()
      
      const animatePixel = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / animationDuration, 1)
        
        // Read current progress bar position
        const currentBarProgress = parseFloat(progressFill.style.width) || 0
        
        // Pixel position: start at bar, move back by pushback amount over time
        const pixelOffset = progress * pushbackAmount
        const pixelPosition = Math.max(0, currentBarProgress - pixelOffset)
        
        pixel.style.left = pixelPosition + randomInt(0,10)+ '%'
        
        if (progress < 1) {
          requestAnimationFrame(animatePixel)
        } else {
          // Animation complete - remove pixel immediately
          pixel.remove()
          if (i === pixelCount - 1 && onComplete) {
            onComplete(pushbackAmount) // Pass pushback amount to callback
          }
        }
      }
      
      animatePixel()
      
    }, i * 2) // CUSTOMIZE: Delay between each pixel (milliseconds)
  }
}

// Show update failed popup
function showUpdateFailedPopup() {
  // Create real window for failure message
  const win = windowManager.createWindow({
    title: 'Update Failed',
    icon: '⚠',
    width: 500,
    height: 320,
    x: Math.floor((window.innerWidth - 500) / 2),
    y: Math.floor((window.innerHeight - 320) / 2),
    content: `
      <div class="installation-window-content" style="background: #f0f0f0; padding: 25px; border: 2px solid #ccc;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #999;">
          <span style="font-size: 32px;">⚠ </span>
          <span style="color: #c00; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace;">Update Failed</span>
        </div>
        <p style="color: #000; font-size: 15px; margin-bottom: 12px; ">The security update could not be completed.</p>
        <p style="color: #333; font-size: 14px; margin-bottom: 20px;">System files may be corrupted. We recommend re-installing the firewall immediately.</p>
        <button class="antivirus-update-btn" style="width: 70%; padding: 10px; background: #d00; border: 2px outset #d00; color: white; font-size: 14px; font-weight: bold; cursor: pointer; font-family: Arial, sans-serif; margin: 0 auto; display: block;">
          Install Now
        </button>
      </div>
    `
  })
  
  // Handle install button click
  const windowEl = document.getElementById(win.id)
  if (windowEl) {
    const installBtn = windowEl.querySelector('.antivirus-update-btn')
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        windowManager.closeWindow(win.id)
        showAntivirusInfoPage()
      }, { once: true })
    }
  }
}

// Show antivirus firewall information page
function showAntivirusInfoPage() {
  // Create custom window with unique structure
  const windowId = `window-${Date.now()}`
  const width = 800
  const height = 750
  const x = Math.floor((window.innerWidth - width) / 2)
  const y = Math.floor((window.innerHeight - height) / 2)
  
  const windowEl = document.createElement('div')
  windowEl.id = windowId
  windowEl.className = 'antivirus-info-window' // Unique class for custom styling
  windowEl.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${width}px;
    height: ${height}px;
    background: white;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    border-radius: 8px;
    overflow: hidden;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  `
  
  windowEl.innerHTML = `
    <div class="antivirus-info-titlebar" style="background: #dee1e6; padding: 8px 8px 4px 8px; display: flex; flex-direction: column; cursor: move; user-select: none; border-bottom: 1px solid #bbb;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="display: flex; gap: 6px;">
            <button style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; border: none; cursor: pointer;"></button>
            <button style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e; border: none; cursor: pointer;"></button>
            <button class="antivirus-info-close-btn" style="width: 12px; height: 12px; border-radius: 50%; background: #28ca42; border: none; cursor: pointer;"></button>
          </div>
        </div>
        <div style="font-size: 11px; color: #5f6368;">SecureShield Firewall</div>
        <div style="width: 60px;"></div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; padding: 4px 6px;">
        <button style="background: transparent; border: none; color: #5f6368; cursor: pointer; padding: 4px 8px; border-radius: 4px; font-size: 18px;">←</button>
        <button style="background: transparent; border: none; color: #5f6368; cursor: pointer; padding: 4px 8px; border-radius: 4px; font-size: 18px;">→</button>
        <button style="background: transparent; border: none; color: #5f6368; cursor: pointer; padding: 4px 8px; border-radius: 4px; font-size: 18px;">↻</button>
        <div style="flex: 1; display: flex; align-items: center; background: white; border: 1px solid #dadce0; border-radius: 20px; padding: 6px 12px; gap: 8px;">
          <span style="font-size: 14px; color: #5f6368;">🔒</span>
          <span style="font-size: 13px; color: #202124; font-family: 'Segoe UI', Arial, sans-serif;">www.secvre3hieId-f!rewalll.com/download</span>
        </div>
        <button style="background: transparent; border: none; color: #5f6368; cursor: pointer; padding: 4px; font-size: 18px;">⋮</button>
      </div>
    </div>
    <div class="antivirus-info-content" style="background: #ffffff; padding: 30px; font-family: Arial, sans-serif; height: 100%; overflow-y: auto; box-sizing: border-box;">
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid #0066cc;">
        <div style="font-size: 48px; margin-bottom: 10px;">🛡️</div>
        <h1 style="margin: 0; color: #0066cc; font-size: 28px; font-weight: bold;">SecureShield Firewall Pro</h1>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Enterprise-Grade Protection</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h2 style="color: #333; font-size: 20px; margin-bottom: 12px; border-left: 4px solid #0066cc; padding-left: 12px;">Why You Need SecureShield</h2>
        <p style="color: #555; line-height: 1.6; margin-bottom: 15px;">
          Your system has been identified as vulnerable to critical security threats. SecureShield Firewall Pro provides comprehensive protection against malware, ransomware, and unauthorized access attempts.
        </p>
        <ul style="color: #555; line-height: 1.8; margin-left: 20px;">
          <li>Real-time threat detection and elimination</li>
          <li>Advanced firewall with intelligent traffic filtering</li>
          <li>Automatic system vulnerability patching</li>
          <li>24/7 monitoring and instant threat response</li>
          <li>Secure browsing and anti-phishing protection</li>
        </ul>
      </div>
      
      <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 4px; padding: 15px; margin-bottom: 25px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">⚠️</span>
          <div>
            <strong style="color: #856404; display: block; margin-bottom: 5px;">Critical Security Alert</strong>
            <span style="color: #856404; font-size: 14px;">Your system is currently unprotected. Install SecureShield now to prevent data loss and system compromise.</span>
          </div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <button class="install-firewall-btn" style="width: 80%; padding: 16px; background: linear-gradient(180deg, #0077dd 0%, #0055aa 100%); border: 2px outset #0066cc; color: white; font-size: 18px; font-weight: bold; cursor: pointer; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: all 0.2s;">
          🔒 Install SecureShield Now
        </button>
        <p style="color: #999; font-size: 12px; margin-top: 15px;">Free 30-day trial • No credit card required</p>
      </div>
    </div>
  `
  
  document.body.appendChild(windowEl)
  
  // Make window draggable
  const titlebar = windowEl.querySelector('.antivirus-info-titlebar')
  let isDragging = false
  let currentX
  let currentY
  let initialX
  let initialY
  
  titlebar.addEventListener('mousedown', (e) => {
    isDragging = true
    initialX = e.clientX - windowEl.offsetLeft
    initialY = e.clientY - windowEl.offsetTop
    windowEl.style.zIndex = 10000
  })
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      e.preventDefault()
      currentX = e.clientX - initialX
      currentY = e.clientY - initialY
      windowEl.style.left = currentX + 'px'
      windowEl.style.top = currentY + 'px'
    }
  })
  
  document.addEventListener('mouseup', () => {
    isDragging = false
  })
  
  // Close button (green button)
  const closeBtn = windowEl.querySelector('.antivirus-info-close-btn')
  closeBtn.addEventListener('click', () => {
    windowEl.remove()
  })
  
  // Install button click
  const installBtn = windowEl.querySelector('.install-firewall-btn')
  if (installBtn) {
    installBtn.addEventListener('click', () => {
      installBtn.style.background = 'linear-gradient(180deg, #0088ee 0%, #0066bb 100%)'
      installBtn.style.transform = 'scale(0.98)'
      
      setTimeout(() => {
        windowEl.remove()
        // Future: trigger actual installation sequence
      }, 150)
    })
    
    // Hover effects
    installBtn.addEventListener('mouseenter', () => {
      installBtn.style.background = 'linear-gradient(180deg, #0088ee 0%, #0066bb 100%)'
      installBtn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)'
    })
    
    installBtn.addEventListener('mouseleave', () => {
      installBtn.style.background = 'linear-gradient(180deg, #0077dd 0%, #0055aa 100%)'
      installBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
    })
  }
}

// Create desktop icons
function createDesktopIcons() {
  const container = document.getElementById('desktop-icons')
  
  desktopIcons.forEach(iconData => {
    const icon = document.createElement('div')
    icon.className = 'desktop-icon'
    icon.innerHTML = `
      <span class="icon">${iconData.icon}</span>
      <span class="label">${iconData.label}</span>
    `
    
    icon.addEventListener('click', (e) => {
      // Remove selected from all icons
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'))
      icon.classList.add('selected')
    })
    
    icon.addEventListener('dblclick', () => {
      openApp(iconData.id)
    })
    
    container.appendChild(icon)
  })
  
  // Click on desktop to deselect icons
  document.getElementById('desktop').addEventListener('click', (e) => {
    if (e.target.id === 'desktop' || e.target.id === 'desktop-icons') {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'))
    }
  })
}

// Initialize taskbar
function initTaskbar() {
  // Update taskbar when windows change
  windowManager.onWindowsChange = updateTaskbar
}

function updateTaskbar() {
  // Don't show open windows in taskbar
  const container = document.getElementById('taskbar-apps')
  container.innerHTML = ''
}

// Initialize start menu
function initStartMenu() {
  const startBtn = document.getElementById('start-btn')
  const startMenu = document.getElementById('start-menu')
  
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    startMenu.classList.toggle('hidden')
  })
  
  // Close start menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
      startMenu.classList.add('hidden')
    }
  })
  
  // Start menu app clicks
  document.querySelectorAll('.start-app').forEach(app => {
    app.addEventListener('click', () => {
      const appId = app.dataset.app
      openApp(appId)
      startMenu.classList.add('hidden')
    })
  })
  
  // Power button
  document.querySelector('.power-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to shut down?')) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-size:24px;">Goodbye!</div>'
    }
  })
}

// Initialize clock
function initClock() {
  function updateClock() {
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    document.getElementById('clock').innerHTML = `${time}<br>${date}`
  }
  
  updateClock()
  setInterval(updateClock, 1000)
}

// Initialize context menu
function initContextMenu() {
  let contextMenu = null
  
  document.getElementById('desktop').addEventListener('contextmenu', (e) => {
    e.preventDefault()
    
    // Remove existing context menu
    if (contextMenu) {
      contextMenu.remove()
    }
    
    // Only show on desktop background
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
      
      // Handle menu item clicks
      contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action
          if (action === 'settings') {
            openApp('settings')
          } else if (action === 'refresh') {
            location.reload()
          }
          contextMenu.remove()
          contextMenu = null
        })
      })
    }
  })
  
  // Close context menu on click
  document.addEventListener('click', () => {
    if (contextMenu) {
      contextMenu.remove()
      contextMenu = null
    }
  })
}

// Track browser window spam state
let browserSpamActive = false
let browserSpamCount = 0
let browserSpamMaxClicks = 20
let lastBrowserWindow = null

// Open an app
function openApp(appId, x, y) {
  const appConfig = apps[appId]
  if (appConfig) {
    const config = { ...appConfig }
    if (x !== undefined) config.x = x
    if (y !== undefined) config.y = y
    const win = windowManager.createWindow(config)
    
    // If opening the browser (ASCII Camera), activate click spam mode
    if (appId === 'browser' && !browserSpamActive) {
      browserSpamActive = true
      browserSpamCount = 0
      lastBrowserWindow = win
      
      // Add click listener for spam windows
      const spamClickHandler = (e) => {
        if (!browserSpamActive) return
        
        browserSpamCount++
        
        if (browserSpamCount < browserSpamMaxClicks) {
          // Random offset position, keeping windows on screen
          const randomX = Math.floor(Math.random() * (window.innerWidth - 500))
          const randomY = Math.floor(Math.random() * (window.innerHeight - 400))
          
          openApp('browser', randomX, randomY)
        } else {
          // After 20 clicks, disable spam mode and show final sequence
          browserSpamActive = false
          document.removeEventListener('click', spamClickHandler, true)
          
          // Show "look at yourself" window
          showFinalSequence()
        }
        
        // Prevent the click from doing anything else during spam mode
        e.preventDefault()
        e.stopPropagation()
      }
      
      // Use capture phase to intercept all clicks
      setTimeout(() => {
        document.addEventListener('click', spamClickHandler, true)
      }, 100)
    }
    
    return win
  }
}

// Initialize when DOM is ready
// document.addEventListener('DOMContentLoaded', initLockScreen)  // Skip login for development
document.addEventListener('DOMContentLoaded', () => {
  const lockScreen = document.getElementById('lock-screen');
  const desktop = document.getElementById('desktop');
  if (lockScreen) lockScreen.style.display = 'none';
  if (desktop) desktop.classList.remove('hidden');
  initDesktop();
  initDebugListeners(); // Enable debug mode shortcuts
})

// Debug listeners (moved out of initLockScreen so they work even when skipping login)
function initDebugListeners() {
  // Debug mode: Press 'd' to see pixels without logging in
  document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      const loginBox = document.querySelector('.lock-screen-box');
      if (loginBox) triggerPixelDisintegration(loginBox, true); // Static mode
    }
    // Debug mode: Press 'i' to test installation window in loop
    if (e.key === 'i' || e.key === 'I') {
      isDebugMode = true;
      const lockScreen = document.getElementById('lock-screen');
      const desktop = document.getElementById('desktop');
      if (lockScreen) lockScreen.style.display = 'none';
      if (desktop) desktop.classList.remove('hidden');
      initDesktop();
      // Loop installation window
      setInterval(() => {
        showInstallationWindow();
      }, 11000); // Restart every 11 seconds (10s duration + 1s gap)
    }
    // Debug menu: Ctrl+D to toggle debug menu
    if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      toggleDebugMenu();
    }
  });
}

function initLockScreen() {
  const lockScreen = document.getElementById('lock-screen');
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const desktop = document.getElementById('desktop');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (usernameInput.value.trim() !== '' && passwordInput.value.trim() !== '') {
      // Trigger pixel disintegration effect
      const loginBox = document.querySelector('.lock-screen-box');
      triggerPixelDisintegration(loginBox);
      
      // Wait for effect to complete, then show desktop
      setTimeout(() => {
        lockScreen.classList.add('hidden');
        desktop.classList.remove('hidden');
        setTimeout(() => {
          lockScreen.style.display = 'none';
          loginBox.classList.remove('disintegrating');
          initDesktop();
        }, 300);
      }, 600);
    } else {
      // Briefly shake the form to indicate an error
      loginForm.classList.add('shake');
      setTimeout(() => {
        loginForm.classList.remove('shake');
      }, 500);
    }
  });

  // Debug mode: Press 'd' to see pixels without logging in
  document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      const loginBox = document.querySelector('.lock-screen-box');
      triggerPixelDisintegration(loginBox, true); // Static mode
    }
    // Debug mode: Press 'i' to test installation window in loop
    if (e.key === 'i' || e.key === 'I') {
      isDebugMode = true;
      lockScreen.style.display = 'none';
      desktop.classList.remove('hidden');
      initDesktop();
      // Loop installation window
      setInterval(() => {
        showInstallationWindow();
      }, 11000); // Restart every 11 seconds (10s duration + 1s gap)
    }
    // Debug menu: Ctrl+D to toggle debug menu
    if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      toggleDebugMenu();
    }
  });
}

// Debug Menu System
function toggleDebugMenu() {
  let debugMenu = document.getElementById('debug-menu');
  
  if (debugMenu) {
    debugMenu.remove();
    return;
  }
  
  debugMenu = document.createElement('div');
  debugMenu.id = 'debug-menu';
  debugMenu.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1a1a2e; border: 3px solid #0f3460; padding: 25px; z-index: 99999; min-width: 350px; box-shadow: 0 0 30px rgba(0,0,0,0.8);">
      <h3 style="color: #00ff41; margin: 0 0 20px 0; font-family: 'Courier New', monospace; text-align: center; font-size: 18px; border-bottom: 2px solid #0f3460; padding-bottom: 10px;">DEBUG MENU</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button onclick="debugGoToLoginGlitch()" style="padding: 12px; background: #16213e; color: #00ff41; border: 2px solid #0f3460; cursor: pointer; font-family: 'Courier New', monospace; font-size: 14px; transition: all 0.2s;">Login Glitch</button>
        <button onclick="debugGoToInstallation()" style="padding: 12px; background: #16213e; color: #00ff41; border: 2px solid #0f3460; cursor: pointer; font-family: 'Courier New', monospace; font-size: 14px; transition: all 0.2s;">Installation Window</button>
        <button onclick="debugGoToUpdateFailed()" style="padding: 12px; background: #16213e; color: #00ff41; border: 2px solid #0f3460; cursor: pointer; font-family: 'Courier New', monospace; font-size: 14px; transition: all 0.2s;">Update Failed</button>
        <button onclick="debugGoToAntivirusInfo()" style="padding: 12px; background: #16213e; color: #00ff41; border: 2px solid #0f3460; cursor: pointer; font-family: 'Courier New', monospace; font-size: 14px; transition: all 0.2s;">Antivirus Info Page</button>
        <button onclick="toggleDebugMenu()" style="padding: 12px; background: #e74c3c; color: white; border: 2px solid #c0392b; cursor: pointer; font-family: 'Courier New', monospace; font-size: 14px; margin-top: 8px;">Close</button>
      </div>
      <p style="color: #777; font-size: 11px; margin-top: 15px; text-align: center; font-family: 'Courier New', monospace;">Press Ctrl+D to close</p>
    </div>
  `;
  
  document.body.appendChild(debugMenu);
}

// Debug state functions
window.debugGoToLoginGlitch = function() {
  const lockScreen = document.getElementById('lock-screen');
  const desktop = document.getElementById('desktop');
  const loginBox = document.querySelector('.lock-screen-box');
  
  lockScreen.style.display = 'flex';
  desktop.classList.add('hidden');
  
  setTimeout(() => {
    triggerPixelDisintegration(loginBox, false);
  }, 100);
  
  toggleDebugMenu();
}

window.debugGoToInstallation = function() {
  const lockScreen = document.getElementById('lock-screen');
  const desktop = document.getElementById('desktop');
  
  isDebugMode = true;
  lockScreen.style.display = 'none';
  desktop.classList.remove('hidden');
  
  if (!document.getElementById('desktop-icons').children.length) {
    initDesktop();
  }
  
  showInstallationWindow();
  toggleDebugMenu();
}

window.debugGoToUpdateFailed = function() {
  const lockScreen = document.getElementById('lock-screen');
  const desktop = document.getElementById('desktop');
  
  isDebugMode = true;
  lockScreen.style.display = 'none';
  desktop.classList.remove('hidden');
  
  if (!document.getElementById('desktop-icons').children.length) {
    initDesktop();
  }
  
  showUpdateFailedPopup();
  toggleDebugMenu();
}

window.debugGoToAntivirusInfo = function() {
  const lockScreen = document.getElementById('lock-screen');
  const desktop = document.getElementById('desktop');
  
  isDebugMode = true;
  lockScreen.style.display = 'none';
  desktop.classList.remove('hidden');
  
  if (!document.getElementById('desktop-icons').children.length) {
    initDesktop();
  }
  
  showAntivirusInfoPage();
  toggleDebugMenu();
}

let seed = 46; // Change this number to get different random patterns

function seededRandom() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

// Black pixel disintegration effect
function triggerPixelDisintegration(element, debugMode = false) {
  if (!debugMode) {
    element.classList.add('disintegrating');
  }
  const rect = element.getBoundingClientRect();
  const container = document.getElementById('lock-screen');
  
  // Manual pixel positions - edit these coordinates to place pixels exactly where you want
  // x and y are relative to the login box (0,0 = top-left of box)
  // You can add/remove as many pixels as you want
  const manualPixels = [];

// Generate pixels in a loop
for (let y = 0; y < rect.height; y += randomInt(1,3)) {
  manualPixels.push({ 
    x: rect.width  + randomInt(-10, 10),
    y: y, 
    size: randomInt(3, 12) 
  });
}

for (let y = 0; y < rect.height; y += randomInt(3,5)) {
  manualPixels.push({
    x: rect.width  + randomInt(-20,-5),
    y: y, 
    size: randomInt(3, 8) 
  });
}

for (let x = 200; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-5, 5),
    size: randomInt(3, 8) 
  });
}

for (let x = 250; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-10, 5),
    size: randomInt(3, 8) 
  });
}

for (let x = 270; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-5, 20),
    size: randomInt(3, 8) 
  });
}

for (let x = 300; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-5, 25),
    size: randomInt(3, 8) 
  });
}

for (let x = 320; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-5, 30),
    size: randomInt(3, 8) 
  });
}


for (let x = 200; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-5, 5),
    size: randomInt(3, 8) 
  });
}

for (let x = 250; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-10, 5),
    size: randomInt(3, 8) 
  });
}

for (let x = 270; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-5, 20),
    size: randomInt(3, 8) 
  });
}

for (let x = 300; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 0 + randomInt(-5, 25),
    size: randomInt(3, 8) 
  });
}

for (let x = 320; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: rect.heightP + randomInt(-5, 30),
    size: randomInt(3, 8) 
  });
}


for (let x = 300; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 80 + randomInt(-3, 3) ,
    size: randomInt(3, 8) 
  });
}

for (let x = 320; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: 80 + randomInt(-7, 7) ,
    size: randomInt(3, 8) 
  });
}


for (let x = 300; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: rect.height + randomInt(-3, 3) ,
    size: randomInt(3, 8) 
  });
}

for (let x = 320; x < rect.width; x += randomInt(2,4)) {
  manualPixels.push({ 
    x:x ,
    y: rect.height + randomInt(-7, 7) ,
    size: randomInt(3, 8) 
  });
}

const staticManualPixels = structuredClone(manualPixels);

  
  // Pixels appear in waves
  const waveDelays = [0, 50, 100, 150, 200];
  
  // Calculate when the last pixel will be drawn
  const maxDelay = Math.max(...waveDelays); // 680ms (last wave + max random delay)
  
  manualPixels.forEach((pixelData, i) => {
    const waveIndex = Math.floor((i / manualPixels.length) * waveDelays.length);
    const baseDelay = waveDelays[waveIndex] || 0;
    const randomDelay = Math.random() * 40;
    
    setTimeout(() => {
      const pixel = document.createElement('div');
      pixel.className = 'pixel-particle';
      
      pixel.style.width = `${pixelData.size}px`;
      pixel.style.height = `${pixelData.size}px`;
      pixel.style.left = `${pixelData.x}px`;
      pixel.style.top = `${pixelData.y}px`;
      
      // Smooth leftward movement with slight vertical variance
      const moveDistance = 20 + Math.random() * 50;
      const tx = -moveDistance; // Move left
      const ty = (Math.random() - 0.5) * 10; // Small vertical variance
      
      pixel.style.setProperty('--tx', `${tx}px`);
      pixel.style.setProperty('--ty', `${ty}px`);
      
      // In debug mode, pixels stay static
      if (debugMode) {
        pixel.style.animation = 'none';
        pixel.style.opacity = '1';
      } else {
        // Don't animate yet - will start after all pixels are drawn
        pixel.style.animation = 'none';
        pixel.dataset.steps = 3 + Math.floor(Math.random() * 5); // Store for later
      }
      
      element.appendChild(pixel);
      
      // Remove pixel after effect (not in debug mode)
      if (!debugMode) {
        setTimeout(() => {
          if (pixel.parentNode) {
            pixel.remove();
          }
        }, maxDelay + 800); // Account for draw time + animation time
      }
    }, baseDelay + randomDelay);
  });
  
  // After all pixels are drawn, start the animation
  if (!debugMode) {
    setTimeout(() => {
      const allPixels = element.querySelectorAll('.pixel-particle');
      allPixels.forEach(pixel => {
        const steps = pixel.dataset.steps || 5;
        pixel.style.animation = `pixelFloat 0.6s steps(${steps}) forwards`;
      });
    }, maxDelay);
  }

  staticManualPixels.forEach((pixelData, i) => {
    const waveIndex = Math.floor((i / staticManualPixels.length) * waveDelays.length);
    const baseDelay = waveDelays[waveIndex] || 0;
    const randomDelay = Math.random() * 80;
    
    setTimeout(() => {
      const pixel = document.createElement('div');
      pixel.className = 'pixel-particle';
      
      pixel.style.width = `${pixelData.size}px`;
      pixel.style.height = `${pixelData.size}px`;
      pixel.style.left = `${pixelData.x}px`;
      pixel.style.top = `${pixelData.y}px`;
      
      // // Smooth leftward movement with slight vertical variance
      // const moveDistance = 20 + Math.random() * 50;
      // const tx = -moveDistance; // Move left
      // const ty = (Math.random() - 0.5); // Small vertical variance
      
      // pixel.style.setProperty('--tx', `${tx}px`);
      // pixel.style.setProperty('--ty', `${ty}px`);
      
      // In debug mode, pixels stay static
      if (debugMode) {
        pixel.style.animation = 'none';
        pixel.style.opacity = '1';
      } else {
        // Animation with glitchy steps
        const steps = 0 + Math.floor(Math.random() ); // 3-7 steps for varying glitchiness
        pixel.style.animation = `pixelFloat 0.6s steps(${steps}) forwards`;
      }
      
      element.appendChild(pixel);
      
      // Remove pixel after effect (not in debug mode)
      if (!debugMode) {
        setTimeout(() => {
          if (pixel.parentNode) {
            pixel.remove();
          }
        }, 800);
      }
    }, baseDelay + randomDelay);
  });
}



// Show final sequence after 20 clicks
function showFinalSequence() {
  // Create "look at yourself" window
  const finalWindow = windowManager.createWindow({
    title: '',
    icon: '',
    width: 900,
    height: 700,
    x: Math.floor((window.innerWidth - 900) / 2),
    y: Math.floor((window.innerHeight - 700) / 2),
    content: `
      <div class="camera-window ascii-camera">
        <div class="camera-viewport ascii-viewport">
          <pre class="ascii-output final-message">look at yourself</pre>
        </div>
        <div class="mirror-text">can you even look at yourself in the mirror?</div>
      </div>
    `
  })
  
  // Add the special class for red titlebar
  const finalWindowEl = document.getElementById(finalWindow.id)
  if (finalWindowEl) {
    finalWindowEl.classList.add('ascii-camera-window')
  }
  
  // After 1 second, close all windows with offset
  setTimeout(() => {
    closeAllWindowsWithDelay()
  }, 1000)
}

// Close all windows with small delay between each
function closeAllWindowsWithDelay() {
  const windows = [...windowManager.windows]
  let delay = 0
  
  windows.forEach((win) => {
    setTimeout(() => {
      windowManager.closeWindow(win.id)
    }, delay)
    delay += 50 // 50ms offset between each close
  })
}

// // Initialize fog effect with interactive particles
// function initFog() {
//   const fogContainer = document.getElementById('fog-container')
//   const popup = document.getElementById('too-late-popup')
//   const particles = []
//   const particleCount = 30
//   let fogActivated = false
//   let fogCleared = false
//   let clearingProgress = 0
//   let lastClearTime = 0
//   let lastMouseX = 0
//   let lastMouseY = 0
//   let totalDistanceMoved = 0
//   let mouseEnteredFog = false // Track if mouse has entered fog area
  
//   // Ensure fog hole is hidden initially - use !important via direct property
//   fogContainer.style.setProperty('--mouse-x', '-9999px')
//   fogContainer.style.setProperty('--mouse-y', '-9999px')
  
//   // Activate fog on first mouse movement
//   function activateFog() {
//     if (fogActivated) return
//     fogActivated = true
//     fogContainer.classList.add('active')
//     document.removeEventListener('mousemove', activateFog)
//   }
  
//   document.addEventListener('mousemove', activateFog)
  
//   // Mouse clearing effect - update CSS variables for mask position
//   // Use capture phase to ensure we get the event before windows
//   document.addEventListener('mousemove', (e) => {
//     if (fogCleared) return
    
//     // Check if any window is currently open
//     const windowManager = window.windowManager
//     const hasOpenWindows = windowManager && windowManager.windows && 
//       windowManager.windows.some(w => !w.minimized)
    
//     // Don't clear fog if any window is open
//     if (hasOpenWindows) {
//       fogContainer.style.setProperty('--mouse-x', '-1000px')
//       fogContainer.style.setProperty('--mouse-y', '-1000px')
//       return
//     }
    
//     // Always update mask position based on mouse Y position relative to fog
//     const viewportHeight = window.innerHeight
//     const fogTop = viewportHeight * 0.5 // Fog covers bottom 50%
    
//     // Only show clearing hole if mouse is actually in the fog area (not just near it)
//     if (e.clientY > fogTop) {
//       // Mark that mouse has entered fog
//       mouseEnteredFog = true
      
//       // Now show the clearing hole
//       fogContainer.style.setProperty('--mouse-x', `${e.clientX}px`)
//       fogContainer.style.setProperty('--mouse-y', `${e.clientY}px`)
      
//       // Calculate distance moved
//       if (lastMouseX > 0 && lastMouseY > 0) {
//         const dx = e.clientX - lastMouseX
//         const dy = e.clientY - lastMouseY
//         const distance = Math.sqrt(dx * dx + dy * dy)
        
//         totalDistanceMoved += distance
//         clearingProgress = totalDistanceMoved / 50
//       }
      
//       lastMouseX = e.clientX
//       lastMouseY = e.clientY
      
//       // Need to move the mouse a LOT (about 5000+ pixels of movement in fog)
//       if (clearingProgress > 100 && !fogCleared) {
//         fogCleared = true
//         fogContainer.classList.add('clearing')
        
//         // Show popup after fog fades
//         setTimeout(() => {
//           popup.classList.remove('hidden')
//         }, 2000)
//       }
//     } else {
//       fogContainer.style.setProperty('--mouse-x', '-1000px')
//       fogContainer.style.setProperty('--mouse-y', '-1000px')
//     }
//   }, true) // Use capture phase
  
//   // Hide clear hole when mouse leaves window
//   document.addEventListener('mouseleave', () => {
//     if (!fogCleared) {
//       fogContainer.style.setProperty('--mouse-x', '-1000px')
//       fogContainer.style.setProperty('--mouse-y', '-1000px')
//     }
//   })
  
//   // Close popup and bring fog back (X button in titlebar)
//   const closeBtn = popup.querySelector('.titlebar-btn.close')
//   if (closeBtn) {
//     closeBtn.addEventListener('click', () => {
//       popup.classList.add('hidden')
//       fogContainer.classList.remove('clearing')
//       fogContainer.classList.add('returning')
//       setTimeout(() => {
//         fogContainer.classList.remove('returning')
//         fogCleared = false
//         clearingProgress = 0
//         totalDistanceMoved = 0
//       }, 3000)
//     })
//   }
  
//   // Create fog particles
//   for (let i = 0; i < particleCount; i++) {
//     const particle = document.createElement('div')
//     particle.className = 'fog-particle'
    
//     // Random size between 100 and 300px
//     const size = 100 + Math.random() * 200
//     particle.style.width = `${size}px`
//     particle.style.height = `${size}px`
    
//     // Random position in lower portion of screen
//     const x = Math.random() * 100
//     const y = 30 + Math.random() * 70 // Bottom 70%
//     particle.style.left = `${x}%`
//     particle.style.top = `${y}%`
    
//     // Random opacity
//     particle.style.opacity = 0.3 + Math.random() * 0.4
    
//     // Store original position for respawn
//     particle.dataset.origX = x
//     particle.dataset.origY = y
//     particle.dataset.origOpacity = particle.style.opacity
    
//     // Add hover interaction
//     particle.addEventListener('mouseenter', () => scatterParticle(particle))
    
//     fogContainer.appendChild(particle)
//     particles.push(particle)
//   }
  
//   // Also scatter particles near mouse movement
//   fogContainer.addEventListener('mousemove', (e) => {
//     const rect = fogContainer.getBoundingClientRect()
//     const mouseX = e.clientX - rect.left
//     const mouseY = e.clientY - rect.top
    
//     particles.forEach(particle => {
//       if (particle.classList.contains('scattered')) return
      
//       const pRect = particle.getBoundingClientRect()
//       const pCenterX = pRect.left + pRect.width / 2 - rect.left
//       const pCenterY = pRect.top + pRect.height / 2 - rect.top
      
//       const distance = Math.sqrt(
//         Math.pow(mouseX - pCenterX, 2) + 
//         Math.pow(mouseY - pCenterY, 2)
//       )
      
//       // Scatter if mouse is within 100px
//       if (distance < 100) {
//         scatterParticle(particle)
//       }
//     })
//   })
  
//   function scatterParticle(particle) {
//     if (particle.classList.contains('scattered')) return
    
//     particle.classList.add('scattered')
    
//     // Random scatter direction
//     const scatterX = (Math.random() - 0.5) * 200
//     const scatterY = -50 - Math.random() * 100 // Scatter upward
//     particle.style.transform = `translate(${scatterX}px, ${scatterY}px) scale(1.5)`
    
//     // Respawn particle after it fades
//     setTimeout(() => {
//       particle.style.transition = 'none'
//       particle.classList.remove('scattered')
//       particle.style.transform = ''
//       particle.style.left = `${Math.random() * 100}%`
//       particle.style.top = `${30 + Math.random() * 70}%`
//       particle.style.opacity = '0'
      
//       // Force reflow
//       particle.offsetHeight
      
//       // Fade back in
//       particle.style.transition = 'transform 1.5s ease-out, opacity 1.5s ease-out'
//       setTimeout(() => {
//         particle.style.opacity = particle.dataset.origOpacity
//       }, 50)
//     }, 1500)
//   }
  
//   // Gentle floating animation for particles
//   function animateParticles() {
//     particles.forEach((particle, i) => {
//       if (particle.classList.contains('scattered')) return
      
//       const time = Date.now() / 1000
//       const offsetX = Math.sin(time * 0.5 + i) * 10
//       const offsetY = Math.sin(time * 0.3 + i * 0.5) * 5
      
//       if (!particle.classList.contains('scattered')) {
//         particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`
//       }
//     })
//     requestAnimationFrame(animateParticles)
//   }
  
//   animateParticles()
// }
