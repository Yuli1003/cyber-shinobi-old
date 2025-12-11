import './style.css'
import { WindowManager } from './windowManager.js'
import { apps } from './apps.js'

// Hebrew transcription storage
window.hebrewTranscript = ''
window.transcriptionActive = false
window.currentChunk = ''  // Buffer for current 10-second chunk

// Initialize Hebrew speech transcription using Web Speech API with Hebrew
async function initTranscription() {
  // Add timestamp header
  const now = new Date()
  window.hebrewTranscript = `=== תמלול - ${now.toLocaleDateString('he-IL')} ${now.toLocaleTimeString('he-IL')} ===\n\n`
  
  // Check for Web Speech API support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    console.log('Speech recognition not supported')
    window.hebrewTranscript += '[שגיאה: תמלול לא נתמך בדפדפן זה - השתמש ב-Chrome]\n\n'
    return
  }
  
  // First request microphone permission
  try {
    window.hebrewTranscript += '[מבקש הרשאת מיקרופון...]\n\n'
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop()) // Stop the stream, we just needed permission
    window.hebrewTranscript += '[הרשאת מיקרופון אושרה ✓]\n\n'
  } catch (e) {
    window.hebrewTranscript += `[שגיאה: לא ניתן לגשת למיקרופון - ${e.message}]\n\n`
    console.log('Microphone error:', e)
    return
  }
  
  const recognition = new SpeechRecognition()
  recognition.lang = 'he-IL'  // Hebrew
  recognition.continuous = true
  recognition.interimResults = true
  
  window.hebrewTranscript += '[מתחיל להקשיב...]\n\n'
  
  // Collect speech into current chunk
  recognition.onresult = (event) => {
    console.log('Speech result:', event.results)
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (result.isFinal) {
        const text = result[0].transcript
        console.log('Final transcript:', text)
        window.currentChunk += text + ' '
      }
    }
  }
  
  // Every 10 seconds, write the chunk to transcript
  setInterval(() => {
    if (window.currentChunk.trim()) {
      const timestamp = new Date().toLocaleTimeString('he-IL')
      window.hebrewTranscript += `[${timestamp}] ${window.currentChunk.trim()}\n\n`
      window.currentChunk = ''  // Clear the chunk
      
      // Update any open notepad windows
      document.querySelectorAll('.notepad-content').forEach(textarea => {
        if (textarea.dataset.transcriptMode === 'true') {
          textarea.value = window.hebrewTranscript
          textarea.scrollTop = textarea.scrollHeight
        }
      })
    }
  }, 10000)  // Every 10 seconds
  
  recognition.onerror = (event) => {
    console.log('Speech recognition error:', event.error)
    window.hebrewTranscript += `\n[שגיאה: ${event.error}]\n\n`
    
    // Update notepad
    document.querySelectorAll('.notepad-content').forEach(textarea => {
      if (textarea.dataset.transcriptMode === 'true') {
        textarea.value = window.hebrewTranscript
      }
    })
  }
  
  recognition.onend = () => {
    console.log('Speech recognition ended, restarting...')
    // Restart if still active
    if (window.transcriptionActive) {
      setTimeout(() => {
        try {
          recognition.start()
        } catch (e) {
          console.log('Could not restart:', e)
        }
      }, 500)
    }
  }
  
  recognition.onaudiostart = () => {
    console.log('Audio started')
    window.hebrewTranscript += '[🎤 מקליט...]\n\n'
    document.querySelectorAll('.notepad-content').forEach(textarea => {
      if (textarea.dataset.transcriptMode === 'true') {
        textarea.value = window.hebrewTranscript
      }
    })
  }
  
  // Start transcription
  try {
    recognition.start()
    window.transcriptionActive = true
    console.log('Hebrew transcription started')
  } catch (e) {
    console.log('Could not start transcription:', e)
    window.hebrewTranscript += `[שגיאה בהתחלה: ${e.message}]\n\n`
  }
  
  window.speechRecognition = recognition
}

// Desktop icons configuration
const desktopIcons = [
  { id: 'explorer', icon: '📁', label: 'File Explorer' },
  { id: 'browser', icon: '🌐', label: 'Browser' },
  { id: 'notepad', icon: '📝', label: 'Notepad' },
  { id: 'calculator', icon: '🔢', label: 'Calculator' },
  { id: 'terminal', icon: '💻', label: 'Terminal' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

// Initialize window manager
const windowManager = new WindowManager()
window.windowManager = windowManager // Make accessible globally for fog check

// Initialize desktop
function initDesktop() {
  createDesktopIcons()
  initTaskbar()
  initStartMenu()
  initClock()
  initContextMenu()
  initFog()
}

// Create desktop icons
function createDesktopIcons() {
  const container = document.getElementById('desktop-icons')
  
  desktopIcons.forEach(iconData => {
    const icon = document.createElement('div')
    icon.className = 'desktop-icon'
    icon.innerHTML = `
      <span class="icon">${iconData.icon}</span>
      <span class="label">${iconData.label}</span>
    `
    
    icon.addEventListener('click', (e) => {
      // Remove selected from all icons
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'))
      icon.classList.add('selected')
    })
    
    icon.addEventListener('dblclick', () => {
      openApp(iconData.id)
    })
    
    container.appendChild(icon)
  })
  
  // Click on desktop to deselect icons
  document.getElementById('desktop').addEventListener('click', (e) => {
    if (e.target.id === 'desktop' || e.target.id === 'desktop-icons') {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'))
    }
  })
}

// Initialize taskbar
function initTaskbar() {
  // Update taskbar when windows change
  windowManager.onWindowsChange = updateTaskbar
}

function updateTaskbar() {
  // Don't show open windows in taskbar
  const container = document.getElementById('taskbar-apps')
  container.innerHTML = ''
}

// Initialize start menu
function initStartMenu() {
  const startBtn = document.getElementById('start-btn')
  const startMenu = document.getElementById('start-menu')
  
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    startMenu.classList.toggle('hidden')
  })
  
  // Close start menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
      startMenu.classList.add('hidden')
    }
  })
  
  // Start menu app clicks
  document.querySelectorAll('.start-app').forEach(app => {
    app.addEventListener('click', () => {
      const appId = app.dataset.app
      openApp(appId)
      startMenu.classList.add('hidden')
    })
  })
  
  // Power button
  document.querySelector('.power-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to shut down?')) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-size:24px;">Goodbye!</div>'
    }
  })
}

// Initialize clock
function initClock() {
  function updateClock() {
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const date = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    document.getElementById('clock').innerHTML = `${time}<br>${date}`
  }
  
  updateClock()
  setInterval(updateClock, 1000)
}

// Initialize context menu
function initContextMenu() {
  let contextMenu = null
  
  document.getElementById('desktop').addEventListener('contextmenu', (e) => {
    e.preventDefault()
    
    // Remove existing context menu
    if (contextMenu) {
      contextMenu.remove()
    }
    
    // Only show on desktop background
    if (e.target.id === 'desktop' || e.target.id === 'desktop-icons' || e.target.closest('#desktop-icons')) {
      contextMenu = document.createElement('div')
      contextMenu.className = 'context-menu'
      contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="refresh">🔄 Refresh</div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="new-folder">📁 New Folder</div>
        <div class="context-menu-item" data-action="new-file">📄 New File</div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="settings">⚙️ Display Settings</div>
      `
      
      contextMenu.style.left = `${e.clientX}px`
      contextMenu.style.top = `${e.clientY}px`
      
      document.body.appendChild(contextMenu)
      
      // Handle menu item clicks
      contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.dataset.action
          if (action === 'settings') {
            openApp('settings')
          } else if (action === 'refresh') {
            location.reload()
          }
          contextMenu.remove()
          contextMenu = null
        })
      })
    }
  })
  
  // Close context menu on click
  document.addEventListener('click', () => {
    if (contextMenu) {
      contextMenu.remove()
      contextMenu = null
    }
  })
}

// Track browser window spam state
let browserSpamActive = false
let browserSpamCount = 0
let browserSpamMaxClicks = 20
let lastBrowserWindow = null

// Open an app
function openApp(appId, x, y) {
  const appConfig = apps[appId]
  if (appConfig) {
    const config = { ...appConfig }
    if (x !== undefined) config.x = x
    if (y !== undefined) config.y = y
    const win = windowManager.createWindow(config)
    
    // If opening the browser (ASCII Camera), activate click spam mode
    if (appId === 'browser' && !browserSpamActive) {
      browserSpamActive = true
      browserSpamCount = 0
      lastBrowserWindow = win
      
      // Add click listener for spam windows
      const spamClickHandler = (e) => {
        if (!browserSpamActive) return
        
        browserSpamCount++
        
        if (browserSpamCount < browserSpamMaxClicks) {
          // Random offset position, keeping windows on screen
          const randomX = Math.floor(Math.random() * (window.innerWidth - 500))
          const randomY = Math.floor(Math.random() * (window.innerHeight - 400))
          
          openApp('browser', randomX, randomY)
        } else {
          // After 20 clicks, disable spam mode and show final sequence
          browserSpamActive = false
          document.removeEventListener('click', spamClickHandler, true)
          
          // Show "look at yourself" window
          showFinalSequence()
        }
        
        // Prevent the click from doing anything else during spam mode
        e.preventDefault()
        e.stopPropagation()
      }
      
      // Use capture phase to intercept all clicks
      setTimeout(() => {
        document.addEventListener('click', spamClickHandler, true)
      }, 100)
    }
    
    return win
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDesktop)

// Show final sequence after 20 clicks
function showFinalSequence() {
  // Create "look at yourself" window
  const finalWindow = windowManager.createWindow({
    title: '',
    icon: '',
    width: 900,
    height: 700,
    x: Math.floor((window.innerWidth - 900) / 2),
    y: Math.floor((window.innerHeight - 700) / 2),
    content: `
      <div class="camera-window ascii-camera">
        <div class="camera-viewport ascii-viewport">
          <pre class="ascii-output final-message">look at yourself</pre>
        </div>
        <div class="mirror-text">can you even look at yourself in the mirror?</div>
      </div>
    `
  })
  
  // Add the special class for red titlebar
  const finalWindowEl = document.getElementById(finalWindow.id)
  if (finalWindowEl) {
    finalWindowEl.classList.add('ascii-camera-window')
  }
  
  // After 1 second, close all windows with offset
  setTimeout(() => {
    closeAllWindowsWithDelay()
  }, 1000)
}

// Close all windows with small delay between each
function closeAllWindowsWithDelay() {
  const windows = [...windowManager.windows]
  let delay = 0
  
  windows.forEach((win) => {
    setTimeout(() => {
      windowManager.closeWindow(win.id)
    }, delay)
    delay += 50 // 50ms offset between each close
  })
}

// Initialize fog effect with interactive particles
function initFog() {
  const fogContainer = document.getElementById('fog-container')
  const popup = document.getElementById('too-late-popup')
  const particles = []
  const particleCount = 30
  let fogActivated = false
  let fogCleared = false
  let clearingProgress = 0
  let lastClearTime = 0
  let lastMouseX = 0
  let lastMouseY = 0
  let totalDistanceMoved = 0
  let mouseEnteredFog = false // Track if mouse has entered fog area
  
  // Ensure fog hole is hidden initially - use !important via direct property
  fogContainer.style.setProperty('--mouse-x', '-9999px')
  fogContainer.style.setProperty('--mouse-y', '-9999px')
  
  // Activate fog on first mouse movement
  function activateFog() {
    if (fogActivated) return
    fogActivated = true
    fogContainer.classList.add('active')
    document.removeEventListener('mousemove', activateFog)
  }
  
  document.addEventListener('mousemove', activateFog)
  
  // Mouse clearing effect - update CSS variables for mask position
  // Use capture phase to ensure we get the event before windows
  document.addEventListener('mousemove', (e) => {
    if (fogCleared) return
    
    // Check if any window is currently open
    const windowManager = window.windowManager
    const hasOpenWindows = windowManager && windowManager.windows && 
      windowManager.windows.some(w => !w.minimized)
    
    // Don't clear fog if any window is open
    if (hasOpenWindows) {
      fogContainer.style.setProperty('--mouse-x', '-1000px')
      fogContainer.style.setProperty('--mouse-y', '-1000px')
      return
    }
    
    // Always update mask position based on mouse Y position relative to fog
    const viewportHeight = window.innerHeight
    const fogTop = viewportHeight * 0.5 // Fog covers bottom 50%
    
    // Only show clearing hole if mouse is actually in the fog area (not just near it)
    if (e.clientY > fogTop) {
      // Mark that mouse has entered fog
      mouseEnteredFog = true
      
      // Now show the clearing hole
      fogContainer.style.setProperty('--mouse-x', `${e.clientX}px`)
      fogContainer.style.setProperty('--mouse-y', `${e.clientY}px`)
      
      // Calculate distance moved
      if (lastMouseX > 0 && lastMouseY > 0) {
        const dx = e.clientX - lastMouseX
        const dy = e.clientY - lastMouseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        totalDistanceMoved += distance
        clearingProgress = totalDistanceMoved / 50
      }
      
      lastMouseX = e.clientX
      lastMouseY = e.clientY
      
      // Need to move the mouse a LOT (about 5000+ pixels of movement in fog)
      if (clearingProgress > 100 && !fogCleared) {
        fogCleared = true
        fogContainer.classList.add('clearing')
        
        // Show popup after fog fades
        setTimeout(() => {
          popup.classList.remove('hidden')
        }, 2000)
      }
    } else {
      fogContainer.style.setProperty('--mouse-x', '-1000px')
      fogContainer.style.setProperty('--mouse-y', '-1000px')
    }
  }, true) // Use capture phase
  
  // Hide clear hole when mouse leaves window
  document.addEventListener('mouseleave', () => {
    if (!fogCleared) {
      fogContainer.style.setProperty('--mouse-x', '-1000px')
      fogContainer.style.setProperty('--mouse-y', '-1000px')
    }
  })
  
  // Close popup and bring fog back (X button in titlebar)
  const closeBtn = popup.querySelector('.titlebar-btn.close')
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.classList.add('hidden')
      fogContainer.classList.remove('clearing')
      fogContainer.classList.add('returning')
      setTimeout(() => {
        fogContainer.classList.remove('returning')
        fogCleared = false
        clearingProgress = 0
        totalDistanceMoved = 0
      }, 3000)
    })
  }
  
  // Create fog particles
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.className = 'fog-particle'
    
    // Random size between 100 and 300px
    const size = 100 + Math.random() * 200
    particle.style.width = `${size}px`
    particle.style.height = `${size}px`
    
    // Random position in lower portion of screen
    const x = Math.random() * 100
    const y = 30 + Math.random() * 70 // Bottom 70%
    particle.style.left = `${x}%`
    particle.style.top = `${y}%`
    
    // Random opacity
    particle.style.opacity = 0.3 + Math.random() * 0.4
    
    // Store original position for respawn
    particle.dataset.origX = x
    particle.dataset.origY = y
    particle.dataset.origOpacity = particle.style.opacity
    
    // Add hover interaction
    particle.addEventListener('mouseenter', () => scatterParticle(particle))
    
    fogContainer.appendChild(particle)
    particles.push(particle)
  }
  
  // Also scatter particles near mouse movement
  fogContainer.addEventListener('mousemove', (e) => {
    const rect = fogContainer.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    particles.forEach(particle => {
      if (particle.classList.contains('scattered')) return
      
      const pRect = particle.getBoundingClientRect()
      const pCenterX = pRect.left + pRect.width / 2 - rect.left
      const pCenterY = pRect.top + pRect.height / 2 - rect.top
      
      const distance = Math.sqrt(
        Math.pow(mouseX - pCenterX, 2) + 
        Math.pow(mouseY - pCenterY, 2)
      )
      
      // Scatter if mouse is within 100px
      if (distance < 100) {
        scatterParticle(particle)
      }
    })
  })
  
  function scatterParticle(particle) {
    if (particle.classList.contains('scattered')) return
    
    particle.classList.add('scattered')
    
    // Random scatter direction
    const scatterX = (Math.random() - 0.5) * 200
    const scatterY = -50 - Math.random() * 100 // Scatter upward
    particle.style.transform = `translate(${scatterX}px, ${scatterY}px) scale(1.5)`
    
    // Respawn particle after it fades
    setTimeout(() => {
      particle.style.transition = 'none'
      particle.classList.remove('scattered')
      particle.style.transform = ''
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${30 + Math.random() * 70}%`
      particle.style.opacity = '0'
      
      // Force reflow
      particle.offsetHeight
      
      // Fade back in
      particle.style.transition = 'transform 1.5s ease-out, opacity 1.5s ease-out'
      setTimeout(() => {
        particle.style.opacity = particle.dataset.origOpacity
      }, 50)
    }, 1500)
  }
  
  // Gentle floating animation for particles
  function animateParticles() {
    particles.forEach((particle, i) => {
      if (particle.classList.contains('scattered')) return
      
      const time = Date.now() / 1000
      const offsetX = Math.sin(time * 0.5 + i) * 10
      const offsetY = Math.sin(time * 0.3 + i * 0.5) * 5
      
      if (!particle.classList.contains('scattered')) {
        particle.style.transform = `translate(${offsetX}px, ${offsetY}px)`
      }
    })
    requestAnimationFrame(animateParticles)
  }
  
  animateParticles()
}
