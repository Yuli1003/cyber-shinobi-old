/**
 * Minesweeper Game Module
 * A decorative minesweeper-style display using custom tile images defined by Spine JSON
 */

let gameContainer = null
let isActive = false
let spineData = [] // Stores {x, y, width, height, attachment}
let tileStates = [] // 0 = closed (show slice), 1 = open (show number)
let tileNumbers = [] // Random numbers

const ASSET_BASE_PATH = 'mine spine/'

/**
 * Start the minesweeper game/display
 */
export async function startMinesweeperGame() {
  if (isActive) return
  isActive = true
  
  // Create container immediately
  gameContainer = document.getElementById('minesweeper-game')
  if (!gameContainer) {
    gameContainer = document.createElement('div')
    gameContainer.id = 'minesweeper-game'
    gameContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none; /* Let clicks pass through to tiles */
      z-index: 50;
    `
    document.body.appendChild(gameContainer)
  }

  try {
    // Load data
    await loadSpineData()
    console.log(`Minesweeper initialized with ${spineData.length} tiles.`)
    
    // Initialize state
    // -1 = hidden (animation start), 0 = closed, 1 = open
    tileStates = new Array(spineData.length).fill(-1) 
    tileNumbers = spineData.map(() => Math.floor(Math.random() * 4)) // 0-3
    
    // Render initial (hidden) state
    renderTiles()
    
    // Animate in
    animateSequentialReveal()
    
  } catch (e) {
    console.error("Failed to start minesweeper:", e)
  }
}

/**
 * Stop the game and cleanup
 */
export function stopMinesweeperGame() {
  isActive = false
  if (gameContainer) {
    gameContainer.remove()
    gameContainer = null
  }
  spineData = []
  tileStates = []
}

export function isMinesweeperActive() {
  return isActive
}

/**
 * Load and parse the Spine JSON data
 */
async function loadSpineData() {
  const response = await fetch('mine spine/Spine.json')
  const text = await response.text()
  
  // 1. Extract attachment names from slots section
  const slotsMatch = text.match(/"slots"\s*:\s*\[([\s\S]*?)\]/)
  const slotsContent = slotsMatch ? slotsMatch[1] : ''
  
  const attachmentRegex = /"attachment"\s*:\s*"([^"]+)"/g
  let match
  const attachments = []
  while ((match = attachmentRegex.exec(slotsContent)) !== null) {
     attachments.push(match[1]) 
  }
  
  // 2. Extract coordinates from skins section
  const coordRegex = /"x"\s*:\s*([\d\.-]+)\s*,\s*"y"\s*:\s*([\d\.-]+)\s*(\s*,\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+))?/g
  
  const skinsStart = text.indexOf('"skins"')
  const skinsText = skinsStart > -1 ? text.substring(skinsStart) : text
  
  const coords = []
  while ((match = coordRegex.exec(skinsText)) !== null) {
    coords.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      width: match[4] ? parseFloat(match[4]) : 30, // Default width fallback
      height: match[5] ? parseFloat(match[5]) : 30 // Default height fallback
    })
  }

  // Combine them
  const count = Math.min(attachments.length, coords.length)
  spineData = []
  
  // Find bounds for centering
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < count; i++) {
    const x = coords[i].x
    const y = coords[i].y
    if(x < minX) minX = x;
    if(x > maxX) maxX = x;
    if(y < minY) minY = y;
    if(y > maxY) maxY = y;
  }
  
  // Just use raw coords like mouseTrail - assuming design coordinates are meaningful
  // Or if we want to ensure it's on screen:
  // mouseTrail logic: height - d.y
  
  for (let i = 0; i < count; i++) {
    spineData.push({
      x: coords[i].x,
      y: coords[i].y, 
      width: coords[i].width,
      height: coords[i].height,
      attachment: attachments[i]
    })
  }
}

/**
 * Render the tiles based on current state
 */
function renderTiles() {
  if (!gameContainer) return
  gameContainer.innerHTML = ''
  
  const canvasWidth = window.innerWidth
  const canvasHeight = window.innerHeight
  
  spineData.forEach((data, index) => {
    // State: -1 (hidden/invisible), 0 (closed/image), 1 (open/number)
    const state = tileStates[index]
    if (state === -1) return // Don't render
    
    const tile = document.createElement('div')
    
    // Position using same logic as mouseTrail
    const left = data.x
    const top = canvasHeight - data.y 
    
    tile.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${data.width}px;
      height: ${data.height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      cursor: pointer;
      transition: transform 0.2s ease;
      transform: translate(-50%, -50%); /* Centering anchor handled by spine usually? */
    `
    // Note: mouseTrail didn't use translate(-50%, -50%) but it used cursors.
    // If spine coords are center, we need the translate.
    // Let's assume they are center.
    
    if (state === 0) {
      // CLOSED: Show spine image (sliceX.png)
      tile.style.backgroundImage = `url('${ASSET_BASE_PATH}${data.attachment}.png')`
      tile.style.backgroundSize = 'contain'
      tile.style.backgroundRepeat = 'no-repeat'
      tile.className = 'mine-tile closed'
      
      // Hover effect
      tile.onmouseenter = () => tile.style.transform = 'translate(-50%, -50%) scale(1.1)'
      tile.onmouseleave = () => tile.style.transform = 'translate(-50%, -50%) scale(1)'
      
      tile.onclick = () => {
        tileStates[index] = 1
        renderTiles()
      }
    } else if (state === 1) {
      // OPEN: Show background + number
      tile.style.backgroundColor = '#d0d0d0'
      tile.style.border = '1px solid #808080'
      tile.className = 'mine-tile open'
      
      const num = tileNumbers[index]
      if (num > 0) {
        const colors = ['', '#0000ff', '#008000', '#ff0000']
        tile.style.color = colors[num] || 'black'
        tile.style.fontWeight = 'bold'
        tile.style.fontSize = Math.min(data.width, data.height) * 0.8 + 'px'
        tile.style.fontFamily = "'VT323', monospace"
        tile.textContent = num
      }
    }
    
    gameContainer.appendChild(tile)
  })
}

/**
 * Animate tiles appearing one by one
 */
function animateSequentialReveal() {
  let index = 0
  const total = spineData.length
  
  // Flatten order? Or random order?
  // Sequential might look cool if spine data is ordered meaningfully (e.g. layers)
  
  const interval = setInterval(() => {
    if (!isActive || index >= total) {
      clearInterval(interval)
      return
    }
    
    // Reveal a batch at a time
    const batchSize = 10
    for (let i=0; i<batchSize && index<total; i++) {
        tileStates[index] = 0 // Visible but closed
        index++
    }
    renderTiles()
    
  }, 20)
}
