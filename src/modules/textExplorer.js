/**
 * Text Explorer Module
 * Handles the "glitchy/laggy" image reveal effect for the File Explorer
 */

let explorerContainer = null
let isActive = false
let spineData = [] // Stores {x, y, width, height, attachment}

const ASSET_BASE_PATH = 'text spine/'

/**
 * Start the text explorer effect
 */
export async function startTextExplorer() {
  if (isActive) return
  isActive = true
  
  // Create container
  explorerContainer = document.getElementById('text-explorer-container')
  if (!explorerContainer) {
    explorerContainer = document.createElement('div')
    explorerContainer.id = 'text-explorer-container'
    explorerContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 60; /* Above desktop, below warnings */
      overflow: hidden;
    `
    document.body.appendChild(explorerContainer)
  }

  try {
    await loadSpineData()
    console.log(`Text Explorer initialized with ${spineData.length} items.`)
    animateGlitchyReveal()
  } catch (e) {
    console.error("Failed to start text explorer:", e)
  }
}

/**
 * Stop the effect
 */
export function stopTextExplorer() {
  isActive = false
  if (explorerContainer) {
    explorerContainer.remove()
    explorerContainer = null
  }
  spineData = []
}

export function isTextExplorerActive() {
  return isActive
}

/**
 * Load and parse the Spine JSON data
 */
async function loadSpineData() {
  const response = await fetch('text spine/Spine.json')
  const text = await response.text()
  
  // 1. Extract attachment names
  const slotsMatch = text.match(/"slots"\s*:\s*\[([\s\S]*?)\]/)
  const slotsContent = slotsMatch ? slotsMatch[1] : ''
  
  const attachmentRegex = /"attachment"\s*:\s*"([^"]+)"/g
  let match
  const attachments = []
  while ((match = attachmentRegex.exec(slotsContent)) !== null) {
     attachments.push(match[1]) 
  }
  
  // 2. Extract coordinates
  const coordRegex = /"x"\s*:\s*([\d\.-]+)\s*,\s*"y"\s*:\s*([\d\.-]+)\s*(\s*,\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+))?/g
  
  const skinsStart = text.indexOf('"skins"')
  const skinsText = skinsStart > -1 ? text.substring(skinsStart) : text
  
  const coords = []
  while ((match = coordRegex.exec(skinsText)) !== null) {
    coords.push({
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
      width: match[4] ? parseFloat(match[4]) : 50,
      height: match[5] ? parseFloat(match[5]) : 50
    })
  }

  // Combine
  const count = Math.min(attachments.length, coords.length)
  spineData = []
  
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
 * Animate images appearing one by one with lag/glitch
 */
function animateGlitchyReveal() {
  let index = 0
  
  const canvasHeight = window.innerHeight
  
  // Recursive timeout for erratic timing
  const nextFrame = () => {
    if (!isActive || index >= spineData.length) return
    
    // Configurable "lag"
    // Random delay between 100ms and 400ms to simulate computer struggling slowly
    const delay = Math.random() < 0.2 ? 400 : (100 + Math.random() * 200)
    
    setTimeout(() => {
        // Spawn 1 item at a time (rarely 2) for slower reveal
        const burst = Math.random() > 0.9 ? 2 : 1
        
        for(let k=0; k<burst && index < spineData.length; k++) {
            createGlitchImage(spineData[index], canvasHeight)
            index++
        }
        
        nextFrame()
    }, delay)
  }
  
  nextFrame()
}

function createGlitchImage(data, canvasHeight) {
    if (!explorerContainer) return
    
    const img = document.createElement('div')
    
    // Position logic
    // We assume coordinates are similar to other spine files (needs flipping Y)
    // We'll also add a slight random offset that "corrects" itself for glitch effect
    
    const finalLeft = data.x
    const finalTop = canvasHeight - data.y
    
    img.style.cssText = `
        position: absolute;
        left: ${finalLeft}px;
        top: ${finalTop}px;
        width: ${data.width}px;
        height: ${data.height}px;
        background-image: url('${ASSET_BASE_PATH}${data.attachment}.png');
        background-size: contain;
        background-repeat: no-repeat;
        opacity: 0; /* Start hidden */
        transform: translate(-50%, -50%) scale(0.8);
        filter: brightness(2) contrast(2); /* Start blown out */
        transition: opacity 0.1s, transform 0.2s cubic-bezier(0.1, 1.5, 0.2, 1), filter 0.3s;
    `
    
    explorerContainer.appendChild(img)
    
    // Trigger appearance
    requestAnimationFrame(() => {
        img.style.opacity = '1'
        img.style.transform = 'translate(-50%, -50%) scale(1)'
        img.style.filter = 'brightness(1) contrast(1)'
        
        // Occasional specific glitch
        if (Math.random() > 0.7) {
            img.style.transform = `translate(calc(-50% + ${Math.random()*20 - 10}px), calc(-50% + ${Math.random()*10 - 5}px))`
            setTimeout(() => {
                 img.style.transform = 'translate(-50%, -50%) scale(1)'
            }, 100)
        }
    })
}
