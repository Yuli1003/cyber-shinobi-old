/**
 * Lock Screen Module
 * Handles login screen and pixel disintegration effect
 */

let seed = 46 // Seed for consistent random patterns

function seededRandom() {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

function randomInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min
}

/**
 * Initialize lock screen
 * @param {Function} onLoginSuccess - Callback when login succeeds
 */
export function initLockScreen(onLoginSuccess) {
  const lockScreen = document.getElementById('lock-screen')
  const loginForm = document.getElementById('login-form')
  const usernameInput = document.getElementById('username')
  const passwordInput = document.getElementById('password')
  const desktop = document.getElementById('desktop')
  
  if (!loginForm || !lockScreen || !desktop) return

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    const username = usernameInput.value.trim()
    const password = passwordInput.value.trim()
    
    // Require at least 2 characters to prevent accidental submission
    if (username.length >= 2 && password.length >= 2) {
      // Trigger pixel disintegration effect
      const loginBox = document.querySelector('.lock-screen-box')
      triggerPixelDisintegration(loginBox)
      
      // Wait for effect, then show desktop
      setTimeout(() => {
        lockScreen.classList.add('hidden')
        desktop.classList.remove('hidden')
        setTimeout(() => {
          lockScreen.style.display = 'none'
          loginBox.classList.remove('disintegrating')
          if (onLoginSuccess) onLoginSuccess()
        }, 300)
      }, 600)
    } else {
      // Shake on invalid input
      loginForm.classList.add('shake')
      setTimeout(() => loginForm.classList.remove('shake'), 500)
    }
  })
}

/**
 * Black pixel disintegration effect
 * @param {HTMLElement} element - Element to disintegrate
 */
export function triggerPixelDisintegration(element) {
  element.classList.add('disintegrating')
  
  const rect = element.getBoundingClientRect()
  const manualPixels = []

  // Generate pixels in various patterns
  // Right edge pixels
  for (let y = 0; y < rect.height; y += randomInt(1, 3)) {
    manualPixels.push({ 
      x: rect.width + randomInt(-10, 10),
      y: y, 
      size: randomInt(3, 12) 
    })
  }

  for (let y = 0; y < rect.height; y += randomInt(3, 5)) {
    manualPixels.push({
      x: rect.width + randomInt(-20, -5),
      y: y, 
      size: randomInt(3, 8) 
    })
  }

  // Top edge pixels - multiple layers
  const topLayers = [
    { startX: 200, offset: [-5, 5] },
    { startX: 250, offset: [-10, 5] },
    { startX: 270, offset: [-5, 20] },
    { startX: 300, offset: [-5, 25] },
    { startX: 320, offset: [-5, 30] }
  ]

  topLayers.forEach(layer => {
    for (let x = layer.startX; x < rect.width; x += randomInt(2, 4)) {
      manualPixels.push({ 
        x: x,
        y: 0 + randomInt(layer.offset[0], layer.offset[1]),
        size: randomInt(3, 8) 
      })
    }
  })

  // Mid and bottom pixels
  for (let x = 300; x < rect.width; x += randomInt(2, 4)) {
    manualPixels.push({ 
      x: x,
      y: 80 + randomInt(-3, 3),
      size: randomInt(3, 8) 
    })
  }

  for (let x = 320; x < rect.width; x += randomInt(2, 4)) {
    manualPixels.push({ 
      x: x,
      y: 80 + randomInt(-7, 7),
      size: randomInt(3, 8) 
    })
  }

  // Bottom edge
  for (let x = 300; x < rect.width; x += randomInt(2, 4)) {
    manualPixels.push({ 
      x: x,
      y: rect.height + randomInt(-3, 3),
      size: randomInt(3, 8) 
    })
  }

  for (let x = 320; x < rect.width; x += randomInt(2, 4)) {
    manualPixels.push({ 
      x: x,
      y: rect.height + randomInt(-7, 7),
      size: randomInt(3, 8) 
    })
  }
  
  // Wave animation delays
  const waveDelays = [0, 50, 100, 150, 200]
  const maxDelay = Math.max(...waveDelays)
  
  manualPixels.forEach((pixelData, i) => {
    const waveIndex = Math.floor((i / manualPixels.length) * waveDelays.length)
    const baseDelay = waveDelays[waveIndex] || 0
    const randomDelay = Math.random() * 40
    
    setTimeout(() => {
      const pixel = document.createElement('div')
      pixel.className = 'pixel-particle'
      
      pixel.style.width = `${pixelData.size}px`
      pixel.style.height = `${pixelData.size}px`
      pixel.style.left = `${pixelData.x}px`
      pixel.style.top = `${pixelData.y}px`
      
      // Movement parameters
      const moveDistance = 20 + Math.random() * 50
      const tx = -moveDistance
      const ty = (Math.random() - 0.5) * 10
      
      pixel.style.setProperty('--tx', `${tx}px`)
      pixel.style.setProperty('--ty', `${ty}px`)
      
      pixel.style.animation = 'none'
      pixel.dataset.steps = 3 + Math.floor(Math.random() * 5)
      
      element.appendChild(pixel)
      
      setTimeout(() => {
        if (pixel.parentNode) pixel.remove()
      }, maxDelay + 800)
    }, baseDelay + randomDelay)
  })
  
  // Start animations after all pixels drawn
  setTimeout(() => {
    const pixels = element.querySelectorAll('.pixel-particle')
    pixels.forEach(pixel => {
      const steps = parseInt(pixel.dataset.steps) || 3
      pixel.style.animation = `pixelGlitch ${steps * 0.08}s steps(${steps}) forwards`
    })
  }, maxDelay + 50)
}
