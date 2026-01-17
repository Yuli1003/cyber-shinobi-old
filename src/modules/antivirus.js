/**
 * Antivirus Module
 * Handles all fake antivirus/security popup functionality
 */

// ============================================
// DEBUG MODE: Set to true to enable shuriken position editor
const SHURIKEN_DEBUG_MODE = false
// ============================================

import { createPixelInterference, randomFloat, resetSeed } from './utils.js'
import { apps } from '../apps.js'
import { glitchAllDesktopIcons } from './desktop.js'
import { triggerPixelDisintegration } from './lockscreen.js'
import { startBlackSlime } from './blackSlime.js'

let windowManager = null
let desktopFiles = [] // Store all README file icons
let readmeHasBeenOpened = false // Track if user has opened a README

/**
 * Initialize the antivirus module
 * @param {WindowManager} wm - Window manager instance
 */
export function initAntivirus(wm) {
  windowManager = wm
}

/**
 * Show the initial antivirus warning popup (shield with exclamation)
 */
export function showAntivirusPopup() {
  const iconContainer = document.getElementById('antivirus-icon-container')
  const notificationContainer = document.getElementById('antivirus-notification-container')
  if (!iconContainer || !notificationContainer) return
  
  // Show shield icon
  iconContainer.classList.remove('hidden')
  iconContainer.classList.add('show-icon')
  
  // After 1 second, show exclamation mark
  setTimeout(() => {
    iconContainer.classList.add('show-exclamation')
    
    const exclamation = iconContainer.querySelector('.antivirus-exclamation')
    if (exclamation) {
      // Make only the exclamation clickable
      exclamation.style.cursor = 'pointer'
      exclamation.style.pointerEvents = 'auto'
      
      exclamation.addEventListener('click', () => {
        notificationContainer.classList.remove('hidden')
        notificationContainer.classList.add('show-notification')
      }, { once: true })
    }
  }, 1000)
  
  // Handle update button click
  const updateBtn = notificationContainer.querySelector('.antivirus-update-btn')
  if (updateBtn) {
    updateBtn.addEventListener('click', () => {
      notificationContainer.classList.add('hidden')
      notificationContainer.classList.remove('show-notification')
      iconContainer.classList.remove('show-exclamation')
      iconContainer.classList.add('hidden')
      showInstallationWindow()
    }, { once: true })
  }
}

/**
 * Show installation window with progress bar and pixel interference
 */
export function showInstallationWindow() {
  if (!windowManager) return
  
  const width = 1536
  const height = 864
  
  const win = windowManager.createWindow({
    title: 'Security Update',
    icon: '🛡️',
    width: 400,
    height: 220,
    x: Math.floor((width - 400) / 2),
    y: Math.floor((height - 220) / 2),
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
  
  // Disable close button during installation
  const closeBtn = windowEl.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.style.pointerEvents = 'none'
    closeBtn.style.opacity = '0.5'
  }
  
  const progressFill = windowEl.querySelector('.progress-bar-fill')
  const percentageText = windowEl.querySelector('.installation-percentage')
  const progressContainer = windowEl.querySelector('.progress-bar-container')
  
  // Progress bar configuration
  let progress = 0
  const duration = 10000 // 10 seconds total
  const intervalTime = 50 // Update every 50ms
  const increment = (100 / (duration / intervalTime))
  
  // Pixel interference timings
  const pixelIntervals = [2900, 5000, 6800, 7200, 8000, 8500]
  
  pixelIntervals.forEach(delay => {
    setTimeout(() => {
      createPixelInterference(progressContainer, progressFill, (pushbackAmount) => {
        progress = Math.max(0, progress - pushbackAmount)
        progressFill.style.width = progress + '%'
        percentageText.textContent = Math.floor(progress) + '%'
      })
    }, delay)
  })
  
  const progressInterval = setInterval(() => {
    progress += increment
    if (progress > 100) progress = 100
    
    progressFill.style.width = progress + '%'
    percentageText.textContent = Math.floor(progress) + '%'
  }, intervalTime)
  
  // Show failure after 10 seconds
  setTimeout(() => {
    clearInterval(progressInterval)
    windowManager.closeWindow(win.id)
    showUpdateFailedPopup()
  }, duration)
}

/**
 * Show update failed popup
 */
export function showUpdateFailedPopup() {
  if (!windowManager) return
  
  const width = 1536
  const height = 864
  
  const win = windowManager.createWindow({
    title: 'Update Failed',
    icon: '⚠',
    width: 500,
    height: 320,
    x: Math.floor((width - 500) / 2),
    y: Math.floor((height - 320) / 2),
    content: `
      <div class="installation-window-content" style="background: #f0f0f0; padding: 25px; border: 2px solid #ccc;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #999;">
          <span style="font-size: 32px;">⚠ </span>
          <span style="color: #c00; font-size: 20px; font-weight: bold; font-family: 'Courier New', monospace;">Update Failed</span>
        </div>
        <p style="color: #000; font-size: 15px; margin-bottom: 12px;">The security update could not be completed.</p>
        <p style="color: #333; font-size: 14px; margin-bottom: 20px;">System files may be corrupted. We recommend re-installing the firewall immediately.</p>
        <button class="antivirus-update-btn" style="width: 70%; padding: 10px; background: #d00; border: 2px outset #d00; color: white; font-size: 14px; font-weight: bold; cursor: pointer; font-family: Arial, sans-serif; margin: 0 auto; display: block;">
          Install Now
        </button>
      </div>
    `
  })
  
  const windowEl = document.getElementById(win.id)
  if (windowEl) {
    // Disable close button
    const closeBtn = windowEl.querySelector('.close-btn')
    if (closeBtn) {
      closeBtn.style.pointerEvents = 'none'
      closeBtn.style.opacity = '0.5'
    }
    
    const installBtn = windowEl.querySelector('.antivirus-update-btn')
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        windowManager.closeWindow(win.id)
        showAntivirusInfoPage()
      }, { once: true })
    }
  }
}

/**
 * Show antivirus info page (fake browser with scareware)
 */
export function showAntivirusInfoPage() {
  const windowId = `window-${Date.now()}`
  const width = 580
  const height = 520
  
  const canvasWidth = 1536
  const canvasHeight = 864
  
  const x = Math.floor((canvasWidth - width) / 2)
  const y = Math.floor((canvasHeight - height) / 2)
  
  const windowEl = document.createElement('div')
  windowEl.id = windowId
  windowEl.className = 'antivirus-info-window'
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
    <div class="antivirus-info-titlebar" style="background: #e8e8e8; padding: 6px 10px; display: flex; flex-direction: column; cursor: move; user-select: none; border-bottom: 1px solid #ccc;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <div style="display: flex; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57;"></div>
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e;"></div>
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #28ca42;"></div>
        </div>
        <div style="font-size: 12px; color: #333; font-weight: 500;">CyberShield Firewall</div>
        <div style="width: 50px;"></div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; padding: 4px;">
        <span style="color: #888; font-size: 16px;">←</span>
        <span style="color: #888; font-size: 16px;">→</span>
        <span style="color: #888; font-size: 16px;">↻</span>
        <div style="flex: 1; display: flex; align-items: center; background: white; border: 1px solid #ddd; border-radius: 16px; padding: 4px 10px; gap: 6px; margin-left: 8px;">
          <span style="font-size: 12px; color: #666;">🔒</span>
          <span style="font-size: 11px; color: #333;">www.cy6er3hield-f!rewalll.com/download</span>
        </div>
      </div>
    </div>
    <div class="antivirus-info-content" style="background: #fff; padding: 24px 28px; font-family: 'Segoe UI', Arial, sans-serif; flex: 1; overflow-y: auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0 0 4px 0; color: #0066cc; font-size: 22px; font-weight: 600;">CyberShield Firewall Pro</h1>
        <p style="margin: 0; color: #888; font-size: 11px; letter-spacing: 1px;">Enterprise-Grade Protection</p>
      </div>
      
      <div style="margin-bottom: 18px;">
        <h2 style="color: #333; font-size: 13px; margin: 0 0 10px 0; padding-left: 10px; border-left: 3px solid #0066cc;">Why You Need CyberShield</h2>
        <p style="color: #555; line-height: 1.5; margin: 0 0 12px 0; font-size: 12px;">
          Your system has been identified as vulnerable to critical security threats. CyberShield Firewall Pro provides comprehensive protection against malware, ransomware, and unauthorized access attempts.
        </p>
        <ul style="color: #555; line-height: 1.6; margin: 0; padding-left: 20px; font-size: 11px;">
          <li>Real-time threat detection and elimination</li>
          <li>Advanced firewall with intelligent traffic filtering</li>
          <li>Automatic system vulnerability patching</li>
          <li>24/7 monitoring and instant threat response</li>
          <li>Secure browsing and anti-phishing protection</li>
        </ul>
      </div>
      
      <div style="background: #fff8e6; border: 1px solid #f0c000; border-radius: 6px; padding: 12px 14px; margin-bottom: 20px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <span style="font-size: 20px; line-height: 1;">⚠️</span>
          <div>
            <strong style="color: #8a6d00; display: block; margin-bottom: 2px; font-size: 12px;">Critical Security Alert</strong>
            <span style="color: #8a6d00; font-size: 11px;">Your system is currently unprotected. Install CyberShield now to prevent data loss.</span>
          </div>
        </div>
      </div>
      
      <div style="text-align: center;">
        <button class="install-firewall-btn" style="width: 75%; padding: 14px 20px; background: linear-gradient(180deg, #0088ee 0%, #0066cc 100%); border: none; color: white; font-size: 15px; font-weight: 600; cursor: pointer; border-radius: 6px; box-shadow: 0 3px 10px rgba(0,100,200,0.3); transition: all 0.2s;">
          Install CyberShield Now
        </button>
        <p style="color: #aaa; font-size: 10px; margin-top: 12px;">Free 30-day trial • No credit card required</p>
      </div>
    </div>
  `
  
  const canvas = document.getElementById('main-canvas')
  if (canvas) canvas.appendChild(windowEl)
  else document.body.appendChild(windowEl)
  
  // Make draggable
  makeDraggable(windowEl)
    
  // Reset seed for consistent pixel patterns
  resetSeed(46)
  
  // Pixel patterns for the install button - EATING/MULTIPLYING EFFECT
  const installBtn = windowEl.querySelector('.install-firewall-btn')
  if (installBtn) {
    
    installBtn.addEventListener('click', () => {
      installBtn.style.position = 'relative'
      installBtn.style.overflow = 'hidden'
      
      const btnWidth = installBtn.offsetWidth
      const btnHeight = installBtn.offsetHeight
      
      // Seed points where corruption starts - focus on frame/edges for spreading effect
      const seedPoints = []
      
      // Top edge seeds
      for (let i = 0; i < 8; i++) {
        seedPoints.push({
          x: (i / 8) * btnWidth,
          y: Math.random() * 3,
          delay: Math.random() * 200
        })
      }
      
      // Bottom edge seeds
      for (let i = 0; i < 8; i++) {
        seedPoints.push({
          x: (i / 8) * btnWidth,
          y: btnHeight - Math.random() * 3,
          delay: Math.random() * 200
        })
      }
      
      // Left edge seeds
      for (let i = 0; i < 6; i++) {
        seedPoints.push({
          x: Math.random() * 3,
          y: (i / 6) * btnHeight,
          delay: Math.random() * 200
        })
      }
      
      // Right edge seeds
      for (let i = 0; i < 6; i++) {
        seedPoints.push({
          x: btnWidth - Math.random() * 3,
          y: (i / 6) * btnHeight,
          delay: Math.random() * 200
        })
      }
      
      // Corner emphasis
      seedPoints.push(
        { x: 0, y: 0, delay: 0 }, // Top-left
        { x: btnWidth, y: 0, delay: 50 }, // Top-right
        { x: 0, y: btnHeight, delay: 100 }, // Bottom-left
        { x: btnWidth, y: btnHeight, delay: 150 } // Bottom-right
      )
      
      // Each seed point spawns and multiplies pixels that spread outward
      seedPoints.forEach((seed, seedIndex) => {
        setTimeout(() => {
          let pixelCount = 0
          const maxPixels = 60 + Math.floor(Math.random() * 40) // Each seed spawns 60-100 pixels
          
          const spawnPixel = (originX, originY, generation) => {
            if (pixelCount >= maxPixels) return
            pixelCount++
            
            const pixel = document.createElement('div')
            pixel.className = 'button-pixel'
            const size = 2 + Math.floor(Math.random() * 4)
            pixel.style.cssText = `
              position: absolute;
              left: ${originX}px;
              top: ${originY}px;
              width: ${size}px;
              height: ${size}px;
              background: black;
              pointer-events: none;
              opacity: 0;
              transition: opacity 0.1s;
            `
            installBtn.appendChild(pixel)
            
            // Fade in
            requestAnimationFrame(() => {
              pixel.style.opacity = '1'
            })
            
            // Spawn children (multiply effect) - spreads in all directions
            if (generation < 8 && Math.random() > 0.2) {
              const numChildren = 1 + Math.floor(Math.random() * 3)
              for (let c = 0; c < numChildren; c++) {
                const spreadDelay = 30 + Math.random() * 80
                const angle = Math.random() * Math.PI * 2
                const distance = 3 + Math.random() * 8
                const newX = originX + Math.cos(angle) * distance
                const newY = originY + Math.sin(angle) * distance
                
                // Keep within button bounds mostly
                if (newX >= -5 && newX <= btnWidth + 5 && newY >= -5 && newY <= btnHeight + 5) {
                  setTimeout(() => {
                    spawnPixel(newX, newY, generation + 1)
                  }, spreadDelay)
                }
              }
            }
          }
          
          // Start from seed point
          spawnPixel(seed.x, seed.y, 0)
          
        }, seed.delay)
      })
      
      installBtn.style.background = '#0077dd'
      installBtn.style.transform = 'scale(0.98)'
      
      // Old TV/VHS turn-off effect
      setTimeout(() => {
        windowEl.style.transition = 'transform 0.15s ease-in'
        windowEl.style.transformOrigin = 'center center'
        windowEl.style.transform = 'scaleY(0.01)'
        
        setTimeout(() => {
          windowEl.style.background = 'black'
          windowEl.style.filter = 'brightness(1)'
          
          setTimeout(() => {
            windowEl.style.filter = 'brightness(5)'
            setTimeout(() => {
              windowEl.style.filter = 'brightness(0)'
              setTimeout(() => {
                windowEl.remove()
                
                // Trigger glitch effect
                triggerSingleGlitch()
                
                // Spawn README files
                setTimeout(() => {
                  spawnReadmeFiles()
                }, 200)
              }, 30)
            }, 40)
          }, 100)
        }, 150)
      }, 1000)
    }, { once: true })
    
    installBtn.addEventListener('mouseenter', () => {
      installBtn.style.background = '#0077dd'
      installBtn.style.fontFamily = "'VT323', monospace"
      installBtn.style.fontWeight = 'normal'
      installBtn.style.fontSize = '22px'
      installBtn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)'
    })
    
    installBtn.addEventListener('mouseleave', () => {
      installBtn.style.background = 'linear-gradient(180deg, #0077dd 0%, #0055aa 100%)'
      installBtn.style.fontFamily = ''
      installBtn.style.fontSize = '15px'
      installBtn.style.fontWeight = 'bold'
      installBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
    })
  }
}

/**
 * Make window draggable
 */
function makeDraggable(windowEl) {
  const titlebar = windowEl.querySelector('.antivirus-info-titlebar')
  let isDragging = false
  let initialX, initialY
  
  titlebar.addEventListener('mousedown', (e) => {
    isDragging = true
    initialX = e.clientX - windowEl.offsetLeft
    initialY = e.clientY - windowEl.offsetTop
    windowEl.style.zIndex = 10000
  })
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      e.preventDefault()
      windowEl.style.left = (e.clientX - initialX) + 'px'
      windowEl.style.top = (e.clientY - initialY) + 'px'
    }
  })
  
  document.addEventListener('mouseup', () => {
    isDragging = false
  })
}

/**
 * Trigger a single glitch effect
 */
function triggerSingleGlitch() {
  const colors = ['#000000', '#ffffff', '#001f3f']
  const glitch = document.createElement('div')
  
  glitch.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 99999;
    mix-blend-mode: difference;
  `
  
  const pixelSize = 6
  const width = 1536
  const height = 864
  const cols = Math.ceil(width / pixelSize)
  const rows = Math.ceil(height / pixelSize)
  const glitchCount = Math.floor((cols * rows) * (0.005 + Math.random() * 0.005))
  
  for (let i = 0; i < glitchCount; i++) {
    const pixel = document.createElement('div')
    const x = Math.floor(Math.random() * cols) * pixelSize
    const y = Math.floor(Math.random() * rows) * pixelSize
    const color = colors[Math.floor(Math.random() * colors.length)]
    const moveX = (Math.random() - 0.5) * 4
    const moveY = (Math.random() - 0.5) * 4
    
    pixel.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${pixelSize}px;
      height: ${pixelSize}px;
      background: ${color};
      opacity: ${0.3 + Math.random() * 0.3};
      transform: translate(${moveX}px, ${moveY}px);
    `
    
    glitch.appendChild(pixel)
  }
  
  const canvas = document.getElementById('main-canvas')
  if (canvas) canvas.appendChild(glitch)
  else document.body.appendChild(glitch)
  
  setTimeout(() => glitch.remove(), 50)
}

/**
 * Create a full-screen black overlay to simulate the screen going black
 */
export function createBlackScreen() {
  // Avoid duplicate overlays
  if (document.getElementById('black-screen-overlay')) return

  const overlay = document.createElement('div')
  overlay.id = 'black-screen-overlay'
  overlay.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    opacity: 0;
    z-index: 999999;
    pointer-events: none;
    transition: opacity 600ms ease-in;
  `

  document.body.appendChild(overlay)

  // Fade in to black
  requestAnimationFrame(() => {
    overlay.style.opacity = '1'
  })

  // 3 seconds after the black screen appears, spawn justice spine images
}

/**
 * Spawn README files on the screen
 */
export async function spawnReadmeFiles() {
  desktopFiles = []
  
  const canvas = document.getElementById('main-canvas')
  // Use canvas dimensions if available, or fallback to fixed dimensions
  const width = canvas ? canvas.offsetWidth : 1536
  const height = canvas ? canvas.offsetHeight : 864
  
  try {
    // Manually fetch and parse the JSON to handle duplicate keys
    const response = await fetch('txt spine/Spine.json')
    const text = await response.text()
    
    // 1. Extract attachment names from slots section
    const slotsMatch = text.match(/"slots"\s*:\s*\[([\s\S]*?)\]/)
    const slotsContent = slotsMatch ? slotsMatch[1] : ''
    
    const attachmentRegex = /"attachment"\s*:\s*"([^"]+)"/g
    let match
    const attachments = []
    while ((match = attachmentRegex.exec(slotsContent)) !== null) {
       attachments.push(match[1]) // e.g. "TXT.png_147"
    }
    
    // 2. Extract coordinates from skins section
    // Matches patterns like "TXT.png":{"TXT.png":{...}} or similar
    // We strictly look for "x":VAL,"y":VAL,"width":VAL,"height":VAL which appear in the skins area for attachments
    // To avoid matching bones or other things, we can be more specific or rely on the fact that ONLY attachments in skins have width/height usually.
    const coordRegex = /"x"\s*:\s*([\d\.-]+)\s*,\s*"y"\s*:\s*([\d\.-]+)\s*,\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+)/g
    
    // We skip the first part of the file (bones, slots) to avoid false positives if any
    const skinsStart = text.indexOf('"skins"')
    const skinsText = skinsStart > -1 ? text.substring(skinsStart) : text
    
    const validCoords = []
    while ((match = coordRegex.exec(skinsText)) !== null) {
      validCoords.push({
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
        width: parseFloat(match[3]),
        height: parseFloat(match[4])
      })
    }
    
    // 3. Spawning
    const count = Math.min(attachments.length, validCoords.length)
    console.log(`Spawning ${count} README files based on Spine data`)
    
    for (let i = 0; i < count; i++) {
        // const attachName = attachments[i] 
        const data = validCoords[i]
        
        setTimeout(() => {
          const file = document.createElement('div')
          file.className = 'desktop-file'
          file.style.cssText = `
            position: absolute;
            left: ${Math.random() * (width - 100)}px;
            top: ${Math.random() * (height - 100)}px;
            width: ${data.width}px;
            height: ${data.height}px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 999;
            opacity: 0;
            transition: opacity 0.2s;
          `
          
          // Store the target data on the element
          file.dataset.spineX = data.x
          file.dataset.spineY = data.y
          file.dataset.spineWidth = data.width
          file.dataset.spineHeight = data.height
          
          const img = document.createElement('img')
          img.src = 'final icons/TXT.png'
          img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            pointer-events: none;
          `
          
          file.appendChild(img)
          
          // Add README label
          const label = document.createElement('div')
          label.className = 'readme-label'
          label.textContent = 'README'
          label.style.cssText = `
            position: absolute;
            top: 100%;
            left: 50%;
            width: 100px;
            margin-left: -50px;
            margin-top: 5px;
            color: white;
            font-family: 'VT323', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            text-align: center;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            pointer-events: none;
            overflow: visible;
            white-space: nowrap;
          `
          file.appendChild(label)
          
          // Add click handler 
          file.addEventListener('dblclick', () => {
             // Logic to open readme and trigger next phase
             const overlay = document.createElement('div')
             overlay.style.cssText = `
               position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
               z-index: 2000; display: flex;
               align-items: center; justify-content: center;
               pointer-events: auto;
             `
             const readmeImg = document.createElement('img')
             readmeImg.src = 'final icons/README.png' 
             readmeImg.style.maxWidth = '25%'
             readmeImg.style.cursor = 'pointer'
             overlay.appendChild(readmeImg)
             document.body.appendChild(overlay)
             
             overlay.addEventListener('click', () => {
               overlay.remove()
               startBlackSlime() // Ensure this is available in scope or global
               glitchyLabelDisappear()
               setTimeout(animateFilesToNinjaStar, 200)
             }, { once: true })
          })
          
          canvas.appendChild(file)
          desktopFiles.push(file)
          
          requestAnimationFrame(() => {
            file.style.opacity = '1'
          })
          
        }, i * 5)
    }

  } catch (e) {
    console.error("Failed to parse Spine JSON", e)
  }
}


/**
 * Make all README labels disappear with a glitchy effect
 */
function glitchyLabelDisappear() {
  const labels = document.querySelectorAll('.readme-label')
  
  labels.forEach((label, index) => {
    setTimeout(() => {
      const glitchDuration = 200
      const glitchInterval = 20
      const glitchCount = glitchDuration / glitchInterval
      
      let glitchCounter = 0
      const glitchTimer = setInterval(() => {
        if (glitchCounter >= glitchCount) {
          clearInterval(glitchTimer)
          label.style.opacity = '0'
          return
        }
        
        const effects = [
          `translateX(${(Math.random() - 0.5) * 10}px) skewX(${(Math.random() - 0.5) * 20}deg)`,
          `translateY(${(Math.random() - 0.5) * 10}px) scaleX(${0.8 + Math.random() * 0.4})`,
          `translateX(${(Math.random() - 0.5) * 15}px) scaleY(${0.8 + Math.random() * 0.4})`,
          'translateX(0) translateY(0)'
        ]
        
        label.style.transform = effects[Math.floor(Math.random() * effects.length)]
        label.style.opacity = Math.random() > 0.3 ? '1' : '0'
        label.style.filter = Math.random() > 0.5 ? 'invert(1)' : 'invert(0)'
        
        glitchCounter++
      }, glitchInterval)
    }, index * 2)
  })
}

/**
 * Animate all README files into a ninja star pattern with Manhattan movement
 */
function animateFilesToNinjaStar() {
  if (desktopFiles.length === 0) return
  
  // DEBUG MODE: Show position editor instead of normal animation
  if (SHURIKEN_DEBUG_MODE) {
    startShurikenDebugMode()
    return
  }
  
  // Use canvas center
  const canvas = document.getElementById('main-canvas')
  const canvasWidth = canvas ? canvas.offsetWidth : 1536
  const canvasHeight = canvas ? canvas.offsetHeight : 864
  
  // Calculate center relative to canvas
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  
  // Distribute files using captured positions
  desktopFiles.forEach((file, index) => {
    // Check if element has spine data
    if (file.dataset.spineX) {
      // Use data from Spine JSON
      // Spine coordinates usually have (0,0) at the center or are positive/negative relative to root
      // In the JSON provided: "x": 747.5, "y": 726.5...
      // These look like absolute coordinates from a Spine project of a certain size.
      // We need to map them to our canvas.
      
      const targetX = parseFloat(file.dataset.spineX)
      // Spine uses Y-up, we need Y-down.
      const spineY = parseFloat(file.dataset.spineY)
      const targetY = canvasHeight - spineY
      
      // Also apply size
      const targetWidth = file.dataset.spineWidth ? parseFloat(file.dataset.spineWidth) : file.offsetWidth
      const targetHeight = file.dataset.spineHeight ? parseFloat(file.dataset.spineHeight) : file.offsetHeight
      
      // Manhattan movement: first horizontal, then vertical (choppy/glitchy)
      setTimeout(() => {
        file.style.transition = 'left 0.8s steps(8, end), width 0.8s ease, height 0.8s ease'
        file.style.left = (targetX - targetWidth/2) + 'px' // Center the item
        
        if (file.dataset.spineWidth) {
           file.style.width = targetWidth + 'px'
           file.style.height = targetHeight + 'px'
        }
        
        // After horizontal movement, start vertical
        setTimeout(() => {
          file.style.transition = 'top 0.8s steps(8, end)'
          file.style.top = (targetY - targetHeight/2) + 'px' // Center the item
          
          // Add glitch effect on arrival
          setTimeout(() => {
             // ... glitch logic ...
          }, 800)
        }, 800)
      }, index * 2) 
      
      return
    }
  
    // Fallback if needed
  })
  
  // After all files are in position, trigger the desktop icon glitch (Step 16)
  const totalAnimationTime = (desktopFiles.length * 5) + 800 + 800 // stagger + horizontal + vertical
  setTimeout(() => {
    // Step 16: Glitch all desktop icons and change them to new versions
    glitchAllDesktopIcons()
    
    // Enable desktop interactions after the flow is complete
    if (window.enableAllDesktopInteractions) {
      setTimeout(() => {
        window.enableAllDesktopInteractions()
      }, 1000)
    }
    // After the chaos flow fully ends, make the screen go black after 10s
    setTimeout(() => {
      createBlackScreen()
    }, 30000)
  }, totalAnimationTime)
}

// ============================================
// SHURIKEN DEBUG MODE FUNCTIONS
// ============================================

let shurikenDebugIcons = []
let shurikenDebugOverlay = null

// Obsolete debug function removed
function startShurikenDebugMode() {
  console.log("Debug mode removed")
}

// Obsolete debug function removed
function captureShurikenPositions() {
  console.log("Debug capture removed")
}
