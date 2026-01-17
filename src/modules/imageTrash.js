/**
 * Image Trash Module
 * Displays images from 'image spline' folder based on 'image spline/Spine.json'
 * Images appear one by one, sorted by Y coordinate (Top to Bottom)
 */

let trashContainer = null
let isActive = false
let spineData = [] // Stores {x, y, width, height, attachment}

const ASSET_BASE_PATH = 'image spline/'

/**
 * Start the trash image effect
 */
export async function startImageTrash() {
  if (isActive) return
  isActive = true
  
  trashContainer = document.getElementById('trash-container')
  if (!trashContainer) {
    trashContainer = document.createElement('div')
    trashContainer.id = 'trash-container'
    trashContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 61; /* distinct layer */
      overflow: hidden;
    `
    document.body.appendChild(trashContainer)
  }

  try {
    await loadSpineData()
    // Sort data for "Top to Bottom" appearance
    // In screen coords, Top is y=0. Bottom is y=Height.
    // In Spine (usually), Y is UP. So Top is High Y.
    // However, we need to know how we map Y.
    // Usually: screenY = Height - spineY.
    // So Top of screen corresponds to High spineY.  
    // Bottom of screen corresponds to Low spineY.
    
    // User wants "start from most top". So we want smallest screenY first.
    // If we assume Y is Top-Down (screen coords):
    // Smallest Y is at Top. Largest Y is at Bottom.
    // So we sort Ascending.
    
    spineData.sort((a, b) => a.y - b.y)
    
    console.log(`Trash initialized. Spawning ${spineData.length} images top-to-bottom.`)
    animateTrashReveal()
  } catch (e) {
    console.error("Failed to start trash effect:", e)
  }
}

export function stopImageTrash() {
  isActive = false
  if (trashContainer) {
    trashContainer.remove()
    trashContainer = null
  }
  spineData = []
}

export function isImageTrashActive() {
  return isActive
}

async function loadSpineData() {
  const response = await fetch('image spline/Spine.json')
  const text = await response.text()
  
  // 1. Attachments
  const slotsMatch = text.match(/"slots"\s*:\s*\[([\s\S]*?)\]/)
  const slotsContent = slotsMatch ? slotsMatch[1] : ''
  const attachmentRegex = /"attachment"\s*:\s*"([^"]+)"/g
  let match
  const attachments = []
  while ((match = attachmentRegex.exec(slotsContent)) !== null) {
     attachments.push(match[1]) 
  }
  
  // 2. Coords from skins
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

function animateTrashReveal() {
  let index = 0
  const canvasHeight = window.innerHeight
  
  // Animate one after another
  const nextFrame = () => {
    if (!isActive || index >= spineData.length) return
    
    createTrashImage(spineData[index], canvasHeight)
    index++
    
    // Fixed delay between images for smooth "one after another"
    setTimeout(nextFrame, 50) 
  }
  
  nextFrame()
}

function createTrashImage(data, canvasHeight) {
  if (!trashContainer) return
  
  const img = document.createElement('div')
  
  // File naming: folder has "SMALLer-POPUP.png.png" or "SMALLer-POPUP.png_10.png"
  // Attachments in spine usually omit the extension if it's implicitly part of the name in atlas,
  // but here we are parsing raw.
  // In mouseTrail we append .png. 
  // Let's verify file list again.
  // Folder: SMALLer-POPUP.png.png, SMALLer-POPUP.png_10.png
  // If attachment is "SMALLer-POPUP.png", then we need "SMALLer-POPUP.png.png".
  // If attachment is "SMALLer-POPUP.png_10", we need "SMALLer-POPUP.png_10.png".
  // So append .png is correct safely.
  
  const imgPath = `${ASSET_BASE_PATH}${data.attachment}.png`
  
  const finalLeft = data.x
  const finalTop = data.y // Use raw Y (Top-Down) instead of inverting
  
  img.style.cssText = `
    position: absolute;
    left: ${finalLeft}px;
    top: ${finalTop}px;
    width: ${data.width}px;
    height: ${data.height}px;
    background-image: url('${imgPath}');
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0;
    transform: translate(-50%, -50%) scale(1); /* Centering anchor */
    transition: all 0.3s ease-out;
  `
  
  trashContainer.appendChild(img)
  
  requestAnimationFrame(() => {
    img.style.opacity = '1'
    img.style.transform = 'translate(-50%, -50%) scale(1)'
  })
}
