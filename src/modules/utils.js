/**
 * Utility Functions
 * Helper functions used across the application
 */

let seed = 46 // Seed for consistent random patterns

/**
 * Seeded random number generator
 */
export function seededRandom() {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

/**
 * Generate random integer between min and max (inclusive) using seeded random
 */
export function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min
}

export function randomFloat(min, max) {
  return seededRandom() * (max - min + 1) + min
}


/**
 * Reset the random seed
 */
export function resetSeed(newSeed = 46) {
  seed = newSeed
}

/**
 * Create pixel interference effect on progress bar
 * @param {HTMLElement} container - Container element for pixels
 * @param {HTMLElement} progressFill - Progress bar fill element
 * @param {Function} onComplete - Callback when animation completes
 */
export function createPixelInterference(container, progressFill, onComplete) {
  const pushbackAmount = 12 + Math.random() * 10 // 12-22% pushback (increased)
  let activePixels = 0
  let completed = false
  let hasCalledComplete = false
  
  // Recursive spawner function to create stringy/branching shapes
  const spawnPixel = (y, generation) => {
    if (generation > 8) return // Limit depth
    
    activePixels++
    const pixel = document.createElement('div')
    pixel.className = 'interference-pixel'
    
    // Square pixels for "pixely" look (no border-radius)
    const size = 3 + Math.floor(Math.random() * 4) // 3-6px square
    pixel.style.width = size + 'px'
    pixel.style.height = size + 'px'
    pixel.style.backgroundColor = 'black'
    pixel.style.position = 'absolute'
    pixel.style.top = y + '%'
    pixel.style.zIndex = '10'
    
    container.appendChild(pixel)
    
    // Animation state
    const startTime = Date.now()
    const duration = 2000 + Math.random() * 500
    // Pixels stay AHEAD of bar tip to look like they're pushing
    const aheadOffset = 2 + Math.random() * 4 // 2-6% ahead of current position
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentBarProgress = parseFloat(progressFill.style.width) || 0
      
      // Stronger push effect - pixels lead the pushback
      const push = Math.pow(progress, 0.4) * pushbackAmount // Faster push curve
      
      // Organic jitter movement  
      const jitter = Math.sin(elapsed * 0.008 + y * 0.15) * 1.5
      
      // Position pixels AT the bar tip, pushing it back
      // They stay at currentBarProgress (the tip) and push grows
      const pos = Math.max(0, currentBarProgress + aheadOffset + jitter)
      
      pixel.style.left = pos + '%'
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        pixel.remove()
        activePixels--
        if (activePixels <= 0 && !hasCalledComplete) {
          hasCalledComplete = true
          if (onComplete) onComplete(pushbackAmount)
        }
      }
    }
    animate()
    
    // Recursively spawn children to form stringy tendrils
    // Higher chance to spawn if generation is low
    const spawnChance = 0.9 - (generation * 0.1)
    if (Math.random() < spawnChance) {
      const numChildren = 1 + Math.floor(Math.random() * 2) // 1-2 children
      for(let i=0; i<numChildren; i++) {
        setTimeout(() => {
          // Spread in Y to create stringy veins
          // Small Y change = stringy, Large Y change = scattered
          const yOffset = (Math.random() - 0.5) * 15 
          const newY = Math.max(0, Math.min(100, y + yOffset))
          spawnPixel(newY, generation + 1)
        }, 50 + Math.random() * 100) // Delay for growth effect
      }
    } else if (activePixels <= 0 && !hasCalledComplete) {
        // Safety check if no children spawned and this was the last one
        hasCalledComplete = true
        if (onComplete) onComplete(pushbackAmount)
    }
  }
  
  // Start with several seeds at different heights
  const numSeeds = 4 + Math.floor(Math.random() * 3)
  for(let i=0; i<numSeeds; i++) {
    spawnPixel(10 + Math.random() * 80, 0)
  }
}
