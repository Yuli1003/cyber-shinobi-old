/**
 * Mouse Trail Module
 * Creates a trail of cursor pointers that form a torii gate when all are collected
 */

// State for the mouse spine animation
let spineData = [] // Will store {x, y, width, height, attachment}
let activeCursors = []
let mouseHistory = [] // Stores {x, y} coordinates of mouse movement
let isCollecting = false
let isFormingShape = false
let trailActive = false
let cursorContainer = null

export function isMouseTrailActive() {
  return trailActive
}


// Use updated cursor path
const CURSOR_BASE_PATH = 'mouse spine/'

/**
 * Initialize Mouse Trail module 
 * This should be called by main.js or desktop.js
 */
export async function startMouseTrail() {
  if (trailActive) return
  trailActive = true
  
  cursorContainer = document.getElementById('mouse-trail-container')
  if (!cursorContainer) {
    cursorContainer = document.createElement('div')
    cursorContainer.id = 'mouse-trail-container'
    cursorContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `
    document.body.appendChild(cursorContainer)
  }

  try {
    // Load Spine Data
    await loadSpineData()
    
    // Start listening to mouse events
    document.addEventListener('mousemove', handleMouseMove)
    
    console.log(`Mouse Trail initialized. Need to collect ${spineData.length} cursors.`)
    isCollecting = true
    
  } catch (e) {
    console.error("Failed to initialize mouse trail:", e)
  }
}

/**
 * Load and parse the Spine JSON data
 */
async function loadSpineData() {
  const response = await fetch('mouse spine/Spine.json')
  const text = await response.text()
  
  // 1. Extract attachment names from slots section
  // Matches "attachment":"NAME" inside the slots array
  const slotsMatch = text.match(/"slots"\s*:\s*\[([\s\S]*?)\]/)
  const slotsContent = slotsMatch ? slotsMatch[1] : ''
  
  const attachmentRegex = /"attachment"\s*:\s*"([^"]+)"/g
  let match
  const attachments = []
  while ((match = attachmentRegex.exec(slotsContent)) !== null) {
     attachments.push(match[1]) 
  }
  
  // 2. Extract coordinates from skins section
  // Logic matches antivirus.js to handle duplicate keys
  const coordRegex = /"x"\s*:\s*([\d\.-]+)\s*,\s*"y"\s*:\s*([\d\.-]+)\s*(\s*,\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+))?/g
  
  const skinsStart = text.indexOf('"skins"')
  const skinsText = skinsStart > -1 ? text.substring(skinsStart) : text
  
  const coords = []
  while ((match = coordRegex.exec(skinsText)) !== null) {
    coords.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      width: match[4] ? parseFloat(match[4]) : 17, // default width if missing
      height: match[5] ? parseFloat(match[5]) : 26 // default height if missing
    })
  }

  // Combine them
  const count = Math.min(attachments.length, coords.length)
  spineData = []
  
  for (let i = 0; i < count; i++) {
    spineData.push({
      ...coords[i],
      attachment: attachments[i]
    })
  }
}

/**
 * Handle mouse movement to spawn trails
 */
function handleMouseMove(e) {
  if (!isCollecting || isFormingShape) return
  
  const { clientX, clientY } = e
  
  // "New York Streets" / Glitchy movement
  // 1. Snap to a grid to make it jerky/pixelated
  const gridSize = 6 // Larger grid = more pixelated/jerky
  const snapX = Math.round(clientX / gridSize) * gridSize
  const snapY = Math.round(clientY / gridSize) * gridSize
  
  // Throttle: only add history if moved enough distance
  const lastPos = mouseHistory.length > 0 ? mouseHistory[mouseHistory.length - 1] : {x: -100, y: -100}
  
  // Manhattan distance check (sum of absolute differences) or strict grid movement
  const dx = Math.abs(snapX - lastPos.x)
  const dy = Math.abs(snapY - lastPos.y)
  
  // Only update if moved at least one grid cell in either direction
  if (dx >= gridSize || dy >= gridSize) {
    
    // Manhattan Logic: If moving diagonally, insert a corner point to force 90-degree turns
    // Check if both X and Y changed
    if (dx >= gridSize && dy >= gridSize) {
      // Create a corner. We can go X then Y, or Y then X.
      // Alternating or fixing it creates the "street" look.
      // Let's go Horizontal first (X then Y)
      mouseHistory.push({ x: snapX, y: lastPos.y })
    }
    
    // Push the final point
    mouseHistory.push({ x: snapX, y: snapY })
    
    // Spawn cursors faster - one for every segment of history
    // If user moves fast, we might add 1 point but "dist" is large.
    // However, here we just check if we need more.
    if (activeCursors.length < spineData.length) {
       // Spawn up to 2 per frame to catch up faster
       spawnCursor(activeCursors.length)
       if(activeCursors.length < spineData.length) {
         spawnCursor(activeCursors.length)
       }
    }
    
    // Trim history if too long (optimization)
    // Keep enough history for all cursors
    if (mouseHistory.length > spineData.length * 3 + 100) {
      mouseHistory.shift()
    }
    
    updateTrailPositions()
    
    // Check if complete
    if (activeCursors.length >= spineData.length) {
      finishCollection()
    }
  }
}

/**
 * Spawn a single cursor element
 */
function spawnCursor(index) {
  const data = spineData[index]
  const el = document.createElement('div')
  el.className = 'trail-cursor'
  // Image path check:
  // Data attachment is like "MOUSE.png_223"
  // File is "MOUSE.png_223.png"
  // So path + attachment + .png should be correct.
  const imgPath = `${CURSOR_BASE_PATH}${data.attachment}.png`
  
  el.style.cssText = `
    position: absolute;
    width: ${data.width}px;
    height: ${data.height}px;
    background-image: url('${imgPath}');
    background-size: contain;
    background-repeat: no-repeat;
    pointer-events: none;
    will-change: transform;
    z-index: 10000;
  `
  // Initially place off screen
  el.style.transform = `translate(-100px, -100px)`
  
  cursorContainer.appendChild(el)
  activeCursors.push({
    el,
    data,
    offsetIndex: index // Used for trail delay
  })
}

/**
 * Update positions of all cursors in the trail
 */
function updateTrailPositions() {
  if (isFormingShape) return
  
  // Make the FIRST cursor (index 0) follow the mouse (Head),
  // and subsequent cursors trail behind it.
  // This ensures the "Head" is rigid/static relative to the mouse.
  
  const historyLen = mouseHistory.length
  
  activeCursors.forEach((cursorObj, i) => {
    // i=0 is Head (Latest history)
    // i=1 is behind it
    // i=2 is further behind
    
    // We want a gap between them in history so they don't bunch up
    const gap = 3 // Slightly larger gap for smoother look
    
    // For i=0, diff is 0 -> historyLen - 1 (Latest)
    // For i=1, diff is gap -> historyLen - 1 - gap
    const historyIndex = historyLen - 1 - (i * gap)
    
    if (historyIndex >= 0 && historyIndex < historyLen) {
      const pos = mouseHistory[historyIndex]
      cursorObj.el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      cursorObj.el.style.display = 'block'
    } else {
       // Not enough history yet for the tail
       // Hide or clamp to oldest history?
       // Hiding looks "growing" which is good.
       // Or we can clamp to mouseHistory[0] so they emerge from it.
       if(historyLen > 0) {
          const pos = mouseHistory[0]
           cursorObj.el.style.transform = `translate(${pos.x}px, ${pos.y}px)`
           cursorObj.el.style.display = 'block'
       } else {
           cursorObj.el.style.display = 'none'
       }
    }
  })
}

/**
 * Finish collection and trigger shape formation
 */
function finishCollection() {
  isCollecting = false
  isFormingShape = true
  
  console.log("Collection complete! Forming shape...")
  
  // Remove listener
  document.removeEventListener('mousemove', handleMouseMove)
  
  // Animate to positions
  animateToShape()
}

/**
 * Animate cursors to their spine positions with "Manhattan" movement (Grid streets)
 */
function animateToShape() {
  const canvas = document.getElementById('main-canvas') || document.body
  const width = canvas.offsetWidth
  const height = canvas.offsetHeight
  
  // Calculate bounding box etc (same as before)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  spineData.forEach(d => {
    minX = Math.min(minX, d.x)
    maxX = Math.max(maxX, d.x)
    minY = Math.min(minY, d.y)
    maxY = Math.max(maxY, d.y)
  })
  
  if (spineData.length === 0) return

  // Prepare animation data
  const cursorsToAnimate = []
  
  activeCursors.forEach((cursorObj) => {
    // 1. Get current position
    // We assume the transform is set as translate(Xpx, Ypx)
    const style = cursorObj.el.style.transform
    const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(style)
    let startX = 0, startY = 0
    if (match) {
      startX = parseFloat(match[1])
      startY = parseFloat(match[2])
    }

    // 2. Calculate target position
    const d = cursorObj.data
    // Assuming 1920x1080 design space, preserving absolute position relative to bottom-left spine coords?
    // In previous code: targetY = height - d.y
    const targetX = d.x 
    const targetY = height - d.y 

    // 3. Decide path type: 0 = X-First (Horizontal then Vertical), 1 = Y-First (Vertical then Horizontal)
    const pathType = Math.random() > 0.5 ? 'x-first' : 'y-first'

    cursorsToAnimate.push({
      el: cursorObj.el,
      startX,
      startY,
      targetX,
      targetY,
      pathType
    })
    
    // Ensure no CSS transition interferes
    cursorObj.el.style.transition = 'none'
  })

  // Animation Loop
  const duration = 1500 // ms
  const startTime = performance.now()
  const gridSize = 6 // Consistent with handleMouseMove

  function step(now) {
    const elapsed = now - startTime
    let progress = Math.min(1, elapsed / duration)
    
    // Optional: Easing
    // easeOutQuart
    const t = 1 - Math.pow(1 - progress, 4);

    cursorsToAnimate.forEach(c => {
      let curX, curY

      if (c.pathType === 'x-first') {
        // Move X fully, then Y
        // Split time: First 50% for X, Second 50% for Y? 
        // Or better: Determine corner point.
        // Corner is (targetX, startY)
        
        if (t < 0.5) {
          // 0 to 0.5 -> Map to 0 to 1
          const localT = t * 2
          curX = c.startX + (c.targetX - c.startX) * localT
          curY = c.startY
        } else {
           // 0.5 to 1.0 -> Map to 0 to 1
           const localT = (t - 0.5) * 2
           curX = c.targetX
           curY = c.startY + (c.targetY - c.startY) * localT
        }
      } else {
        // Y-First
        // Corner is (startX, targetY)
        if (t < 0.5) {
          curX = c.startX
          const localT = t * 2
          curY = c.startY + (c.targetY - c.startY) * localT
        } else {
          curY = c.targetY
          const localT = (t - 0.5) * 2
          curX = c.startX + (c.targetX - c.startX) * localT
        }
      }

      // Snap to grid for glitchy feel
      if (progress < 1) { // Don't snap final frame to ensure precision? Or do snap?
          // If we want them to land EXACTLY at target, we shouldn't snap the final frame if target isn't on grid.
          // But target comes from JSON, might not be on grid.
          // Let's snap during movement, set exact at end.
          curX = Math.round(curX / gridSize) * gridSize
          curY = Math.round(curY / gridSize) * gridSize
      } else {
          curX = c.targetX
          curY = c.targetY
      }

      c.el.style.transform = `translate(${curX}px, ${curY}px)`
    })

    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }

  requestAnimationFrame(step)
}

// Reset functions
export function stopMouseTrail() {
  trailActive = false
  isCollecting = false
  isFormingShape = false
  if (cursorContainer) {
    // Clean up
    cursorContainer.remove()
    cursorContainer = null
  }
  
  // Remove listeners
  document.removeEventListener('mousemove', handleMouseMove)
  
  activeCursors.forEach(c => c.el.remove())
  activeCursors = []
  mouseHistory = []
}
