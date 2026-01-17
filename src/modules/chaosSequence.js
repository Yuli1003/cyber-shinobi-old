/**
 * Chaos Sequence Module
 * Orchestrates the glitchy sequence of events when an icon is clicked after the icon glitch
 */

import { startMouseTrail } from './mouseTrail.js'
import { startDesktopAsciiCamera } from './desktopCamera.js'
import { startImageTrash } from './imageTrash.js'
import { startMinesweeperGame } from './minesweeper.js'
import { startTextExplorer } from './textExplorer.js'
import { createBlackScreen } from './antivirus.js'

let isSequenceActive = false
let mouseJitterInterval = null
let extrasContainer = null
let blackScreenScheduled = false
let blackScreenTimeoutId = null

export function isChaosSequenceActive() {
  return isSequenceActive
}

/**
 * Start the chaos sequence
 */
export async function startChaosSequence() {
  if (isSequenceActive) return
  isSequenceActive = true
  
  console.log('🌀 Starting Chaos Sequence...')
  
  // Start background transition immediately
  startPixelatedBackgroundTransition()
  
  // Start unwanted mouse movements
  startUnwantedMouseMovements()
  
  // Sequence of events with delays
  const sequence = [
    { name: 'Mouse Trail', fn: startMouseTrail, delay: 800 },
    { name: 'ASCII Camera', fn: startDesktopAsciiCamera, delay: 2500 },
    { name: 'Image Trash', fn: startImageTrash, delay: 3000 },
    { name: 'Minesweeper', fn: startMinesweeperGame, delay: 2800 },
    { name: 'Text Explorer', fn: startTextExplorer, delay: 3200 },
    { name: 'Extras Spine', fn: startExtrasSpine, delay: 3500 },
  ]
  
  let totalDelay = 0
  for (const step of sequence) {
    totalDelay += step.delay
    setTimeout(() => {
      console.log(`🎯 Triggering: ${step.name}`)
      step.fn()
    }, totalDelay)
  }
}

/**
 * Transition desktop background to solid #000A5D in a pixelated glitchy way
 */
function startPixelatedBackgroundTransition() {
  const desktop = document.getElementById('desktop')
  if (!desktop) return
  
  // Create overlay canvas
  const canvas = document.createElement('canvas')
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  `
  desktop.appendChild(canvas)
  
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  const targetColor = '#000A5D'
  const pixelSize = 12 // Larger blocks for more glitchy look
  const cols = Math.ceil(canvas.width / pixelSize)
  const rows = Math.ceil(canvas.height / pixelSize)
  const totalPixels = cols * rows
  
  // Create array of all pixel positions
  const pixels = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      pixels.push({ x, y, filled: false })
    }
  }
  
  // Shuffle pixels for random glitchy fill
  for (let i = pixels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pixels[i], pixels[j]] = [pixels[j], pixels[i]]
  }
  
  // Fill pixels over time
  const duration = 2000 // 2 seconds (faster)
  const pixelsPerFrame = Math.ceil(totalPixels / (duration / 16)) // 60fps
  
  let currentIndex = 0
  
  function fillPixels() {
    // Fill multiple pixels per frame with very glitchy speed variations
    const batchSize = Math.max(1, Math.floor(pixelsPerFrame * (0.5 + Math.random() * 2))) // More glitchy variations
    
    for (let i = 0; i < batchSize && currentIndex < pixels.length; i++) {
      const pixel = pixels[currentIndex]
      ctx.fillStyle = targetColor
      
      // Random size variation for glitchy effect
      const sizeVariation = Math.random() > 0.8 ? pixelSize * (0.5 + Math.random()) : pixelSize
      ctx.fillRect(pixel.x * pixelSize, pixel.y * pixelSize, sizeVariation, sizeVariation)
      pixel.filled = true
      currentIndex++
    }
    
    if (currentIndex < pixels.length) {
      requestAnimationFrame(fillPixels)
    } else {
      // Transition complete - set solid background (use 'background' to override CSS gradient)
      desktop.style.background = targetColor
      // Keep the canvas for additional glitchy static effect
      startBlueScreenGlitch(canvas, ctx, cols, rows, pixelSize, targetColor)
    }
  }
  
  requestAnimationFrame(fillPixels)
}

/**
 * Keep the blue screen glitchy with ongoing random pixel noise
 */
function startBlueScreenGlitch(canvas, ctx, cols, rows, pixelSize, baseColor) {
  const glitchColors = ['#000A5D', '#0015A3', '#001177', '#000833', '#0000FF', '#000044']
  
  function drawGlitch() {
    // Draw random glitch rectangles
    const glitchCount = 5 + Math.floor(Math.random() * 15)
    
    for (let i = 0; i < glitchCount; i++) {
      const x = Math.floor(Math.random() * cols) * pixelSize
      const y = Math.floor(Math.random() * rows) * pixelSize
      const w = (1 + Math.floor(Math.random() * 8)) * pixelSize
      const h = (1 + Math.floor(Math.random() * 3)) * pixelSize
      
      // Random glitch color
      ctx.fillStyle = glitchColors[Math.floor(Math.random() * glitchColors.length)]
      ctx.fillRect(x, y, w, h)
    }
    
    // Sometimes add horizontal scan lines
    if (Math.random() > 0.7) {
      const scanY = Math.floor(Math.random() * rows) * pixelSize
      ctx.fillStyle = Math.random() > 0.5 ? '#0022AA' : '#000033'
      ctx.fillRect(0, scanY, canvas.width, pixelSize * 2)
    }
    
    // Sometimes flash small areas back to base color
    if (Math.random() > 0.6) {
      const resetCount = 2 + Math.floor(Math.random() * 5)
      ctx.fillStyle = baseColor
      for (let i = 0; i < resetCount; i++) {
        const x = Math.floor(Math.random() * cols) * pixelSize
        const y = Math.floor(Math.random() * rows) * pixelSize
        ctx.fillRect(x, y, pixelSize * 3, pixelSize * 2)
      }
    }
    
    // Keep glitching
    setTimeout(drawGlitch, 50 + Math.random() * 150)
  }
  
  drawGlitch()
}

/**
 * Make the mouse cursor move unwantedly every couple of seconds
 */
function startUnwantedMouseMovements() {
  // Create invisible element that we'll move the cursor to
  const fakeCursor = document.createElement('div')
  fakeCursor.style.cssText = `
    position: fixed;
    width: 1px;
    height: 1px;
    pointer-events: none;
    opacity: 0;
  `
  document.body.appendChild(fakeCursor)
  
  function triggerRandomMove() {
    // Random position
    const x = Math.random() * window.innerWidth
    const y = Math.random() * window.innerHeight
    
    // Dispatch mouse events to simulate movement
    // This creates a glitchy jump effect
    const duration = 200 + Math.random() * 300 // 200-500ms
    const steps = 8
    const startX = window.lastMouseX || window.innerWidth / 2
    const startY = window.lastMouseY || window.innerHeight / 2
    
    let step = 0
    const moveInterval = setInterval(() => {
      step++
      const progress = step / steps
      
      // Glitchy easing (sudden jumps)
      const t = progress < 0.7 ? progress * 0.3 : 0.3 + (progress - 0.7) * 2.33
      
      const currentX = startX + (x - startX) * t
      const currentY = startY + (y - startY) * t
      
      // Dispatch mouse move event
      const event = new MouseEvent('mousemove', {
        clientX: currentX,
        clientY: currentY,
        bubbles: true,
        cancelable: true,
        view: window
      })
      
      document.dispatchEvent(event)
      window.lastMouseX = currentX
      window.lastMouseY = currentY
      
      if (step >= steps) {
        clearInterval(moveInterval)
      }
    }, duration / steps)
  }
  
  // Track real mouse position
  document.addEventListener('mousemove', (e) => {
    window.lastMouseX = e.clientX
    window.lastMouseY = e.clientY
  })
  
  // Trigger random moves every 2-4 seconds
  mouseJitterInterval = setInterval(() => {
    triggerRandomMove()
  }, 2000 + Math.random() * 2000)
}

/**
 * Load and display extras spine icons in a glitchy unorganized way
 */
async function startExtrasSpine() {
  console.log('🎨 Starting Extras Spine...')
  
  try {
    // Load Spine Data
    const response = await fetch('extras spine/Spine.json')
    const text = await response.text()
    
    // Parse similar to other spine modules
    const slotsMatch = text.match(/"slots"\s*:\s*\[([\s\S]*?)\]/)
    const slotsContent = slotsMatch ? slotsMatch[1] : ''
    
    const attachmentRegex = /"attachment"\s*:"([^"]+)"/g
    let match
    const attachments = []
    while ((match = attachmentRegex.exec(slotsContent)) !== null) {
      attachments.push(match[1])
    }
    
    // Extract coordinates
    const coordRegex = /"x"\s*:\s*([\d\.-]+)\s*,\s*"y"\s*:\s*([\d\.-]+)\s*(\s*,\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+))?/g
    const skinsStart = text.indexOf('"skins"')
    const skinsText = skinsStart > -1 ? text.substring(skinsStart) : text
    
    const coords = []
    while ((match = coordRegex.exec(skinsText)) !== null) {
      coords.push({
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
        width: match[4] ? parseFloat(match[4]) : 64,
        height: match[5] ? parseFloat(match[5]) : 64
      })
    }
    
    // Combine them
    const spineData = []
    const count = Math.min(attachments.length, coords.length)
    for (let i = 0; i < count; i++) {
      spineData.push({
        ...coords[i],
        attachment: attachments[i]
      })
    }
    
    // Create container
    extrasContainer = document.createElement('div')
    extrasContainer.id = 'extras-spine-container'
    extrasContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5000;
      overflow: hidden;
    `
    document.body.appendChild(extrasContainer)
    
    // Spawn each icon one after another in a glitchy way
    const canvasHeight = window.innerHeight
    
    for (let i = 0; i < spineData.length; i++) {
      setTimeout(() => {
        spawnExtrasIcon(spineData[i], canvasHeight)
      }, i * (50 + Math.random() * 80)) // 50-130ms between each icon (much faster!)
    }
    
  } catch (e) {
    console.error('Failed to load extras spine:', e)
  }
}

/**
 * Spawn a single extras icon with glitchy appearance
 */
function spawnExtrasIcon(data, canvasHeight) {
  const el = document.createElement('div')

  // Schedule a single black screen 10s after the first extras icon spawns
  if (!blackScreenScheduled) {
    blackScreenScheduled = true
    blackScreenTimeoutId = setTimeout(() => {
      createBlackScreen()
    }, 10000)
  }
  
  // Extract icon name from attachment (e.g., "browser.png_4" -> "browser.png")
  // Files are named with double extension: browser.png.png
  const iconName = data.attachment.split('_')[0]
  const imgPath = `extras spine/${iconName}.png`
  
  // Y-flip like other modules
  const targetY = canvasHeight - data.y
  
  // Create image element like desktop icons
  const img = document.createElement('img')
  img.src = imgPath
  img.style.cssText = `
    width: ${data.width}px;
    height: ${data.height}px;
    object-fit: contain;
  `
  
  el.style.cssText = `
    position: absolute;
    left: ${data.x}px;
    top: ${targetY}px;
    pointer-events: none;
  `
  
  el.appendChild(img)
  extrasContainer.appendChild(el)
  
  // Desktop-style glitch animation - fast and snappy
  const glitchDuration = 150
  const glitchInterval = 20
  const glitchCount = glitchDuration / glitchInterval
  let glitchCounter = 0
  
  const glitchTimer = setInterval(() => {
    if (glitchCounter >= glitchCount) {
      clearInterval(glitchTimer)
      // Final state - clean
      img.style.transform = ''
      img.style.opacity = '1'
      img.style.filter = ''
      return
    }
    
    // Same glitch effects as desktop icons
    const glitchEffects = [
      `translateX(${(Math.random() - 0.5) * 10}px) skewX(${(Math.random() - 0.5) * 30}deg)`,
      `translateY(${(Math.random() - 0.5) * 10}px) scaleX(${0.7 + Math.random() * 0.6})`,
      `translateX(${(Math.random() - 0.5) * 15}px) scaleY(${0.7 + Math.random() * 0.6})`,
      'translateX(0) translateY(0)'
    ]
    
    img.style.transform = glitchEffects[Math.floor(Math.random() * glitchEffects.length)]
    img.style.opacity = Math.random() > 0.3 ? '1' : '0.5'
    img.style.filter = Math.random() > 0.5 ? 'invert(1) hue-rotate(180deg)' : 'none'
    
    glitchCounter++
  }, glitchInterval)
}

/**
 * Stop the chaos sequence and clean up
 */
export function stopChaosSequence() {
  isSequenceActive = false
  
  // Stop unwanted mouse movements
  if (mouseJitterInterval) {
    clearInterval(mouseJitterInterval)
    mouseJitterInterval = null
  }
  
  // Clean up extras container
  if (extrasContainer) {
    extrasContainer.remove()
    extrasContainer = null
  }

  // Clear any scheduled black screen
  if (blackScreenTimeoutId) {
    clearTimeout(blackScreenTimeoutId)
    blackScreenTimeoutId = null
    blackScreenScheduled = false
  }
}
