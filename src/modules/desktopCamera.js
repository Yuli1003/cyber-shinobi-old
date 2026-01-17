/**
 * Desktop ASCII Camera Module
 * Shows ASCII camera output directly on the desktop (top right corner)
 * Simple version with faded edges - no background removal
 */

// ============================================
// DEBUG MODE: Set to true to skip to README sequence
const CAMERA_DEBUG_MODE = false
// ============================================

let asciiContainer = null
let video = null
let canvas = null
let ctx = null
let animationId = null
let stream = null
let isActive = false

const ASCII_CHARS = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. '
const WIDTH = 120
const HEIGHT = 60
let edgeTime = 0 // For animating edges
let glitchOffset = 0 // For occasional glitch
let nextGlitchTime = 0

// Extended dimensions for fake edge chars
const EXTENDED_WIDTH = 180 // Extra chars on sides
const EXTENDED_HEIGHT = 100 // Extra chars top/bottom
const EDGE_PADDING_X = 40 // How many fake chars on each side
const EDGE_PADDING_Y = 20 // How many fake chars on top/bottom

// Edge fade - probability of showing character based on distance from edge
// Now with organic movement and extended range
function getEdgeFade(x, y, width, height, time) {
  const edgeDist = 40 // Much larger fade radius
  const distFromLeft = x
  const distFromRight = width - 1 - x
  const distFromTop = y
  const distFromBottom = height - 1 - y
  const minDist = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom)
  
  // Organic wave movement on edges
  const waveX = Math.sin(time * 0.002 + y * 0.15) * 4
  const waveY = Math.cos(time * 0.0015 + x * 0.12) * 4
  const organicDist = minDist + waveX + waveY
  
  if (organicDist >= edgeDist) return 1
  // Smoother fade curve
  const fadeProb = Math.max(0, Math.pow(organicDist / edgeDist, 0.5))
  return Math.random() < fadeProb ? 1 : 0
}

// Generate fake edge character based on position
function getFakeEdgeChar(x, y, time) {
  // Use noise pattern based on position and time
  const noise = Math.sin(x * 0.3 + time * 0.001) * Math.cos(y * 0.4 + time * 0.0015)
  const idx = Math.floor((noise + 1) * 0.5 * (ASCII_CHARS.length - 1))
  return ASCII_CHARS[Math.max(0, Math.min(idx, ASCII_CHARS.length - 1))]
}

// Get fake edge brightness
function getFakeEdgeBrightness(x, y, time) {
  // Darker towards edges, with some variation
  const noise = Math.sin(x * 0.2 + time * 0.002) * Math.cos(y * 0.25)
  return 50 + noise * 30 + Math.random() * 20
}

// Get color based on brightness for screen effect
function getColorForBrightness(brightness) {
  // Different shades of red based on brightness
  if (brightness < 50) return '#330000'
  if (brightness < 100) return '#660000'
  if (brightness < 150) return '#990000'
  if (brightness < 200) return '#cc0000'
  return '#ff3333'
}

// Get organic fade for camera edges (seamless blending)
function getCameraEdgeFade(realX, realY, time) {
  const edgeDist = 15 // Fade starts this many chars from edge
  const distFromLeft = realX
  const distFromRight = WIDTH - 1 - realX
  const distFromTop = realY
  const distFromBottom = HEIGHT - 1 - realY
  const minDist = Math.min(distFromLeft, distFromRight, distFromTop, distFromBottom)
  
  // Organic wave movement
  const waveX = Math.sin(time * 0.003 + realY * 0.2) * 3
  const waveY = Math.cos(time * 0.0025 + realX * 0.18) * 3
  const organicDist = minDist + waveX + waveY
  
  if (organicDist >= edgeDist) return 1.0
  // Smooth fade with random variance
  return Math.max(0, Math.pow(organicDist / edgeDist, 0.6) + Math.random() * 0.1)
}

// Check if fake letter should be rendered based on distance from center
function shouldRenderFakeLetter(ex, ey, time) {
  // Calculate distance from the real camera area
  const centerX = EXTENDED_WIDTH / 2
  const centerY = EXTENDED_HEIGHT / 2
  const dx = ex - centerX
  const dy = ey - centerY
  const distFromCenter = Math.sqrt(dx * dx + dy * dy)
  
  // Define layers based on distance
  const layerSize = 15 // pixels per layer
  const layer = Math.floor(distFromCenter / layerSize)
  
  // Spacing increases with each layer
  // Layer 0-1: every char, Layer 2: every 2nd, Layer 3: every 3rd, etc.
  const spacing = Math.max(1, layer - 1)
  
  // Add some organic variation
  const noise = Math.sin(ex * 0.4 + time * 0.001) * Math.cos(ey * 0.5 + time * 0.0012)
  
  // Check if this position should have a character
  if (spacing > 1) {
    const xMod = Math.floor(ex + noise * 2) % spacing
    const yMod = Math.floor(ey + noise * 2) % spacing
    if (xMod !== 0 || yMod !== 0) return false
  }
  
  // Additionally, reduce density for outer layers
  const densityThreshold = Math.max(0.3, 1 - layer * 0.08)
  return Math.random() < densityThreshold
}

/**
 * Start the desktop ASCII camera
 */
export async function startDesktopAsciiCamera() {
  if (isActive) return
  isActive = true
  
  // Create container for ASCII output - z-index below slime layer (9999)
  asciiContainer = document.createElement('div')
  asciiContainer.id = 'desktop-ascii-camera'
  asciiContainer.style.cssText = `
    position: fixed;
    top: 20px;           /* LOCATION: Vertical position from top */
    right: 20px;         /* LOCATION: Horizontal position from right */
    z-index: 9998;
    font-family: 'Courier New', monospace;
    font-size: 10px;      /* SIZE: Adjust this to make ASCII art bigger/smaller */
    line-height: 1;
    letter-spacing: 0;
    white-space: pre;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s;
    mix-blend-mode: multiply;
    filter: contrast(1.2) brightness(0.9);
  `
  
  // Always append to body for chaos sequence
  document.body.appendChild(asciiContainer)
  
  // Create hidden video element
  video = document.createElement('video')
  video.autoplay = true
  video.playsInline = true
  video.style.display = 'none'
  document.body.appendChild(video)
  
  // Create canvas for processing
  canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  canvas.style.display = 'none'
  document.body.appendChild(canvas)
  ctx = canvas.getContext('2d')
  
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 } 
    })
    video.srcObject = stream
    await video.play()
    
    // Fade in
    setTimeout(() => {
      asciiContainer.style.opacity = '0.8'
    }, 100)
    
    // Start rendering
    renderASCII()
    
  } catch (err) {
    console.error('Camera error:', err)
    asciiContainer.textContent = 'CAMERA\nACCESS\nDENIED'
    asciiContainer.style.opacity = '0.8'
  }
}

/**
 * Render ASCII frame
 */
function renderASCII() {
  if (!isActive || !video.srcObject) return
  
  edgeTime++
  
  // Occasional glitch - random chance every few seconds
  if (edgeTime > nextGlitchTime) {
    glitchOffset = (Math.random() - 0.5) * 6 // -3 to 3 char shift
    nextGlitchTime = edgeTime + 100 + Math.random() * 400 // Next glitch in 100-500 frames
    // Reset glitch after a few frames
    setTimeout(() => { glitchOffset = 0 }, 50 + Math.random() * 100)
  }
  
  // Draw video frame to canvas (mirrored)
  ctx.save()
  ctx.scale(-1, 1)
  ctx.drawImage(video, -WIDTH, 0, WIDTH, HEIGHT)
  ctx.restore()
  
  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  const pixels = imageData.data
  
  let ascii = ''
  
  // Render extended area with fake edges + real center
  for (let ey = 0; ey < EXTENDED_HEIGHT; ey++) {
    // Apply glitch offset to some rows
    const rowGlitch = (ey % 7 < 2) ? Math.round(glitchOffset) : 0
    if (rowGlitch > 0) ascii += ' '.repeat(rowGlitch)
    
    for (let ex = 0; ex < EXTENDED_WIDTH; ex++) {
      // Map extended coords to real camera coords
      const realX = ex - EDGE_PADDING_X
      const realY = ey - EDGE_PADDING_Y
      
      // Check if we're in the real camera area
      const inRealArea = realX >= 0 && realX < WIDTH && realY >= 0 && realY < HEIGHT
      
      let char, color
      
      if (inRealArea) {
        // Real camera data with organic edge fade for seamless blending
        const i = (realY * WIDTH + realX) * 4
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
        
        // Apply organic fade at camera edges
        const edgeFade = getCameraEdgeFade(realX, realY, edgeTime)
        if (edgeFade < 0.1 || Math.random() > edgeFade) {
          ascii += ' '
          continue
        }
        
        const charIndex = Math.floor((1 - brightness / 255) * (ASCII_CHARS.length - 1))
        char = ASCII_CHARS[Math.max(0, Math.min(charIndex, ASCII_CHARS.length - 1))]
        color = getColorForBrightness(brightness)
      } else {
        // Fake edge chars - check spacing and fade
        if (!shouldRenderFakeLetter(ex, ey, edgeTime)) {
          ascii += ' '
          continue
        }
        if (getEdgeFade(ex, ey, EXTENDED_WIDTH, EXTENDED_HEIGHT, edgeTime) === 0) {
          ascii += ' '
          continue
        }
        char = getFakeEdgeChar(ex, ey, edgeTime)
        const fakeBrightness = getFakeEdgeBrightness(ex, ey, edgeTime)
        color = getColorForBrightness(fakeBrightness)
      }
      
      ascii += `<span style="color:${color};text-shadow:0 0 3px ${color}">${char}</span>`
    }
    
    // Trim glitch chars from end if negative offset
    if (rowGlitch < 0) ascii = ascii.slice(0, rowGlitch)
    ascii += '\n'
  }
  
  asciiContainer.innerHTML = ascii
  animationId = requestAnimationFrame(renderASCII)
}

/**
 * Stop the desktop ASCII camera
 */
export function stopDesktopAsciiCamera() {
  isActive = false
  
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  
  if (video) {
    video.remove()
    video = null
  }
  
  if (canvas) {
    canvas.remove()
    canvas = null
  }
  
  if (asciiContainer) {
    asciiContainer.style.opacity = '0'
    setTimeout(() => {
      if (asciiContainer) {
        asciiContainer.remove()
        asciiContainer = null
      }
    }, 500)
  }
}

/**
 * Check if camera is active
 */
export function isDesktopCameraActive() {
  return isActive
}
