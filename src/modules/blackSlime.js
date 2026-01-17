/**
 * Black Slime Module
 * Creeping pixelated tentacles that slowly invade from screen corners
 * Triggered after README is closed
 */

// Configuration
const CONFIG = {
  // Timing
  startDelay: 1000,           // 1 second before tentacles appear
  revealDuration: 60000,      // 60 seconds for full reveal
  blackoutDelay: 999999999,   // Disabled - no blackout
  blackoutDuration: 3000,     // Fade to black duration
  
  // Slither/breathing
  breathingSpeed: 0.0008,     // Slow breathing cycle
  breathingIntensity: 0.02,   // Scale change amount (2%)
  writheSpeed: 0.002,         // Writhing oscillation speed
  writheIntensity: 3,         // Pixels of movement
  
  // Screen dimensions (laptop 16:10 aspect)
  aspectRatio: 16 / 10
}

let slimeContainer = null
let corners = []
let animationId = null
let isActive = false
let startTime = 0

// Corner image paths - to be set when images are added
const CORNER_IMAGES = {
  topLeft: 'inspo/slime-top-left.png',
  topRight: 'inspo/slime-top-right.png',
  bottomLeft: 'inspo/slime-bottom-left.png',
  bottomRight: 'inspo/slime-bottom-right.png'
}

/**
 * Initialize and start the black slime effect
 */
export function startBlackSlime() {
  if (isActive) return
  isActive = true
  
  // Create main container
  slimeContainer = document.createElement('div')
  slimeContainer.id = 'black-slime-container'
  slimeContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `
  const canvas = document.getElementById('main-canvas')
  if (canvas) canvas.appendChild(slimeContainer)
  else document.body.appendChild(slimeContainer)
  
  // Create corner tentacles after delay
  setTimeout(() => {
    createCornerTentacles()
    startTime = Date.now()
    animateSlime()
  }, CONFIG.startDelay)
}

/**
 * Create tentacle elements for each corner
 */
function createCornerTentacles() {
  const cornerConfigs = [
    {
      id: 'top-left',
      image: CORNER_IMAGES.topLeft,
      position: { top: '0', left: '0' },
      transform: 'rotate(0deg)',
      clipStart: 'inset(0 100% 100% 0)',  // Hidden from bottom-right
      clipEnd: 'inset(0 0% 0% 0)',        // Fully visible
      origin: 'top left'
    },
    {
      id: 'top-right',
      image: CORNER_IMAGES.topRight,
      position: { top: '0', right: '0' },
      transform: 'rotate(0deg)',
      clipStart: 'inset(0 0 100% 100%)',  // Hidden from bottom-left
      clipEnd: 'inset(0 0 0% 0%)',
      origin: 'top right'
    },
    {
      id: 'bottom-left',
      image: CORNER_IMAGES.bottomLeft,
      position: { bottom: '0', left: '0' },
      transform: 'rotate(0deg)',
      clipStart: 'inset(100% 100% 0 0)',  // Hidden from top-right
      clipEnd: 'inset(0% 0% 0 0)',
      origin: 'bottom left'
    },
    {
      id: 'bottom-right',
      image: CORNER_IMAGES.bottomRight,
      position: { bottom: '0', right: '0' },
      transform: 'rotate(0deg)',
      clipStart: 'inset(100% 0 0 100%)',  // Hidden from top-left
      clipEnd: 'inset(0% 0 0 0%)',
      origin: 'bottom right'
    }
  ]
  
  cornerConfigs.forEach((config, index) => {
    const corner = document.createElement('div')
    corner.className = 'slime-corner'
    corner.id = `slime-${config.id}`
    
    // Size each corner to cover roughly half the screen
    corner.style.cssText = `
      position: absolute;
      ${Object.entries(config.position).map(([k, v]) => `${k}: ${v}`).join('; ')};
      width: 55%;
      height: 55%;
      background-image: url('${config.image}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: ${config.origin};
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      clip-path: ${config.clipStart};
      transform-origin: ${config.origin};
      will-change: clip-path, transform;
    `
    
    slimeContainer.appendChild(corner)
    
    corners.push({
      element: corner,
      config: config,
      clipStart: config.clipStart,
      clipEnd: config.clipEnd,
      breathOffset: Math.random() * Math.PI * 2,  // Random phase offset
      writheOffsetX: Math.random() * Math.PI * 2,
      writheOffsetY: Math.random() * Math.PI * 2
    })
  })
}

/**
 * Main animation loop - handles reveal, breathing, and writhing
 */
function animateSlime() {
  if (!isActive) return
  
  const elapsed = Date.now() - startTime
  const revealProgress = Math.min(elapsed / CONFIG.revealDuration, 1)
  
  corners.forEach((corner, index) => {
    // Calculate reveal clip-path (edge-wipe from corner outward)
    updateRevealClip(corner, revealProgress)
    
    // Add breathing and writhing transforms
    updateSlitherTransform(corner, elapsed)
  })
  
  // Check if it's time for blackout
  if (elapsed >= CONFIG.blackoutDelay) {
    startBlackout()
    return
  }
  
  animationId = requestAnimationFrame(animateSlime)
}

/**
 * Update the clip-path for reveal animation
 * Edge-wipe from corner outward following tentacle shapes
 */
function updateRevealClip(corner, progress) {
  // Eased progress for more organic reveal
  const easedProgress = easeInOutQuad(progress)
  
  // Parse start and end clip values
  const clipValues = interpolateClip(corner.clipStart, corner.clipEnd, easedProgress)
  corner.element.style.clipPath = clipValues
}

/**
 * Interpolate between two inset clip-path values
 */
function interpolateClip(start, end, progress) {
  // Parse "inset(top right bottom left)" values
  const parseInset = (str) => {
    const match = str.match(/inset\(([^)]+)\)/)
    if (!match) return [0, 0, 0, 0]
    return match[1].split(' ').map(v => parseFloat(v))
  }
  
  const startVals = parseInset(start)
  const endVals = parseInset(end)
  
  const interpolated = startVals.map((s, i) => {
    const e = endVals[i] || 0
    return s + (e - s) * progress
  })
  
  return `inset(${interpolated.map(v => v + '%').join(' ')})`
}

/**
 * Update transform for breathing and writhing effect
 */
function updateSlitherTransform(corner, elapsed) {
  // Breathing - subtle scale pulsing
  const breathPhase = elapsed * CONFIG.breathingSpeed + corner.breathOffset
  const breathScale = 1 + Math.sin(breathPhase) * CONFIG.breathingIntensity
  
  // Writhing - slight positional movement
  const writheX = Math.sin(elapsed * CONFIG.writheSpeed + corner.writheOffsetX) * CONFIG.writheIntensity
  const writheY = Math.cos(elapsed * CONFIG.writheSpeed * 0.7 + corner.writheOffsetY) * CONFIG.writheIntensity
  
  // Secondary slower writhe for organic feel
  const slowWritheX = Math.sin(elapsed * CONFIG.writheSpeed * 0.3) * CONFIG.writheIntensity * 0.5
  const slowWritheY = Math.cos(elapsed * CONFIG.writheSpeed * 0.4) * CONFIG.writheIntensity * 0.5
  
  corner.element.style.transform = `
    scale(${breathScale})
    translate(${writheX + slowWritheX}px, ${writheY + slowWritheY}px)
  `
}

/**
 * Fade to complete black screen
 */
function startBlackout() {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  // Create blackout overlay
  const blackout = document.createElement('div')
  blackout.id = 'slime-blackout'
  blackout.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: black;
    opacity: 0;
    z-index: 10000;
    pointer-events: none;
    transition: opacity ${CONFIG.blackoutDuration}ms ease-in;
  `
  document.body.appendChild(blackout)
  
  // Continue slithering during blackout
  const blackoutStart = Date.now()
  const animateDuringBlackout = () => {
    const elapsed = Date.now() - startTime
    corners.forEach(corner => {
      updateSlitherTransform(corner, elapsed)
    })
    
    if (Date.now() - blackoutStart < CONFIG.blackoutDuration + 1000) {
      requestAnimationFrame(animateDuringBlackout)
    }
  }
  animateDuringBlackout()
  
  // Trigger fade to black
  requestAnimationFrame(() => {
    blackout.style.opacity = '1'
  })
  
  // After blackout completes, trigger next phase
  setTimeout(() => {
    onBlackoutComplete()
  }, CONFIG.blackoutDuration)
}

/**
 * Called when screen is fully black
 */
function onBlackoutComplete() {
  // Dispatch event for other modules to listen to
  window.dispatchEvent(new CustomEvent('slimeBlackoutComplete'))
  
  // Clean up tentacle elements but keep blackout
  corners.forEach(corner => corner.element.remove())
  corners = []
}

/**
 * Stop and clean up the slime effect
 */
export function stopBlackSlime() {
  isActive = false
  
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  
  if (slimeContainer) {
    slimeContainer.remove()
    slimeContainer = null
  }
  
  const blackout = document.getElementById('slime-blackout')
  if (blackout) {
    blackout.remove()
  }
  
  corners = []
}

/**
 * Easing function for smooth animation
 */
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/**
 * Check if slime effect is currently active
 */
export function isSlimeActive() {
  return isActive
}
