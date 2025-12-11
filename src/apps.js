// App configurations and initialization functions

export const apps = {
  notepad: {
    title: 'Notepad',
    icon: '📝',
    width: 600,
    height: 400,
    content: `<textarea class="notepad-content" placeholder="Start typing..."></textarea>`,
  },

  calculator: {
    title: 'Calculator',
    icon: '🔢',
    width: 320,
    height: 480,
    content: `
      <div class="calculator-content">
        <div class="calc-display">0</div>
        <div class="calc-buttons">
          <button class="calc-btn operator" data-action="clear">C</button>
          <button class="calc-btn operator" data-action="backspace">⌫</button>
          <button class="calc-btn operator" data-action="percent">%</button>
          <button class="calc-btn operator" data-value="/">÷</button>
          <button class="calc-btn" data-value="7">7</button>
          <button class="calc-btn" data-value="8">8</button>
          <button class="calc-btn" data-value="9">9</button>
          <button class="calc-btn operator" data-value="*">×</button>
          <button class="calc-btn" data-value="4">4</button>
          <button class="calc-btn" data-value="5">5</button>
          <button class="calc-btn" data-value="6">6</button>
          <button class="calc-btn operator" data-value="-">−</button>
          <button class="calc-btn" data-value="1">1</button>
          <button class="calc-btn" data-value="2">2</button>
          <button class="calc-btn" data-value="3">3</button>
          <button class="calc-btn operator" data-value="+">+</button>
          <button class="calc-btn" data-value="0" style="grid-column: span 2">0</button>
          <button class="calc-btn" data-value=".">.</button>
          <button class="calc-btn equals" data-action="equals">=</button>
        </div>
      </div>
    `,
    onInit: (content) => {
      const display = content.querySelector('.calc-display')
      let currentValue = '0'
      let previousValue = ''
      let operator = null
      let shouldResetDisplay = false

      content.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const value = btn.dataset.value
          const action = btn.dataset.action

          if (action === 'clear') {
            currentValue = '0'
            previousValue = ''
            operator = null
          } else if (action === 'backspace') {
            currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0'
          } else if (action === 'percent') {
            currentValue = String(parseFloat(currentValue) / 100)
          } else if (action === 'equals') {
            if (operator && previousValue) {
              const prev = parseFloat(previousValue)
              const curr = parseFloat(currentValue)
              let result
              switch (operator) {
                case '+': result = prev + curr; break
                case '-': result = prev - curr; break
                case '*': result = prev * curr; break
                case '/': result = prev / curr; break
              }
              currentValue = String(result)
              previousValue = ''
              operator = null
            }
          } else if (['+', '-', '*', '/'].includes(value)) {
            previousValue = currentValue
            operator = value
            shouldResetDisplay = true
          } else if (value) {
            if (shouldResetDisplay || currentValue === '0') {
              currentValue = value === '.' ? '0.' : value
              shouldResetDisplay = false
            } else {
              if (value === '.' && currentValue.includes('.')) return
              currentValue += value
            }
          }

          display.textContent = currentValue
        })
      })
    }
  },

  browser: {
    title: 'ASCII Camera',
    icon: '🌐',
    width: 900,
    height: 700,
    content: `
      <div class="camera-window ascii-camera">
        <div class="camera-viewport ascii-viewport">
          <video id="camera-feed" autoplay playsinline></video>
          <canvas id="camera-canvas"></canvas>
          <pre class="ascii-output"></pre>
          <div class="camera-overlay">
            <div class="camera-loading">Loading...</div>
          </div>
        </div>
        <div class="mirror-text">can you even look at yourself in the mirror?</div>
      </div>
    `,
    onInit: async (content) => {
      const asciiOutput = content.querySelector('.ascii-output')
      const overlay = content.querySelector('.camera-overlay')
      const loading = content.querySelector('.camera-loading')
      
      // Check if there's already a master ASCII camera running
      if (window.asciiCameraMaster) {
        // Just sync to the master output
        overlay.style.display = 'none'
        
        const colorModes = ['mode-default', 'mode-red-white', 'mode-white-red', 'mode-white-black', 'mode-black-red']
        const syncInterval = setInterval(() => {
          if (window.asciiCameraOutput) {
            asciiOutput.textContent = window.asciiCameraOutput
            // Sync the color mode and font size too
            colorModes.forEach(m => asciiOutput.classList.remove(m))
            asciiOutput.classList.add(colorModes[window.asciiColorMode || 0])
            if (window.asciiFontSize) {
              asciiOutput.style.fontSize = window.asciiFontSize + 'px'
            }
          }
        }, 50)
        
        // Cleanup on window close
        const windowEl = content.closest('.window')
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === windowEl || node.contains?.(windowEl)) {
                clearInterval(syncInterval)
              }
            })
          })
        })
        if (windowEl?.parentNode) {
          observer.observe(windowEl.parentNode, { childList: true })
        }
        return
      }
      
      // This is the master camera
      window.asciiCameraMaster = true
      window.asciiCameraOutput = ''
      window.asciiColorMode = 0  // 0-3 for 4 color combinations
      window.asciiFontSize = 6
      
      const video = content.querySelector('#camera-feed')
      const canvas = content.querySelector('#camera-canvas')
      const ctx = canvas.getContext('2d')
      
      // ASCII characters ordered by visual density (dark to light)
      const ASCII_CHARS = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. '
      
      // Dynamic resolution based on eye gaze
      let currentWidth = 40  // Start low res
      let currentHeight = 22
      let targetWidth = 40   // Low res until looking at camera
      let targetHeight = 22
      let colorMode = 0  // 0: black/white, 1: red/white, 2: white/red, 3: white/black, 4: black/red
      let lastBlinkState = false
      let lookingAtCamera = false
      
      // Color mode classes
      const colorModes = ['mode-default', 'mode-red-white', 'mode-white-red', 'mode-white-black', 'mode-black-red']
      
      function setColorMode(mode) {
        colorModes.forEach(m => asciiOutput.classList.remove(m))
        asciiOutput.classList.add(colorModes[mode])
        window.asciiColorMode = mode
      }
      
      // Face tracking variables
      let faceLandmarker = null
      let animationId = null
      let stream = null
      
      // Load MediaPipe Face Landmarker
      loading.textContent = 'Loading face tracking...'
      try {
        const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs')
        const { FaceLandmarker, FilesetResolver } = vision
        const wasmFileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        faceLandmarker = await FaceLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true
        })
        loading.textContent = 'Starting camera...'
      } catch (e) {
        console.log('Face tracking not available:', e)
        loading.textContent = 'Starting camera (no face tracking)...'
      }
      
      // Start camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        })
        video.srcObject = stream
        await video.play()
        
        overlay.style.display = 'none'
        
        // Create canvas for processing
        const processCanvas = document.createElement('canvas')
        processCanvas.width = 640
        processCanvas.height = 480
        const processCtx = processCanvas.getContext('2d')
        
        let lastFaceTime = 0
        
        // Get eye gaze direction as normalized values (-1 to 1)
        function getGazeDirection(blendshapes) {
          if (!blendshapes || blendshapes.length === 0) return { x: 0, y: 0 }
          
          const shapes = blendshapes[0].categories
          
          let lookLeft = 0, lookRight = 0, lookUp = 0, lookDown = 0
          
          for (const shape of shapes) {
            if (shape.categoryName === 'eyeLookOutLeft') lookLeft += shape.score
            if (shape.categoryName === 'eyeLookOutRight') lookRight += shape.score
            if (shape.categoryName === 'eyeLookInLeft') lookRight += shape.score
            if (shape.categoryName === 'eyeLookInRight') lookLeft += shape.score
            if (shape.categoryName === 'eyeLookUpLeft' || shape.categoryName === 'eyeLookUpRight') lookUp += shape.score
            if (shape.categoryName === 'eyeLookDownLeft' || shape.categoryName === 'eyeLookDownRight') lookDown += shape.score
          }
          
          // Return normalized gaze direction
          // Positive x = looking right, negative x = looking left
          // Positive y = looking down, negative y = looking up
          return {
            x: (lookRight - lookLeft) / 2,  // -1 (left) to 1 (right)
            y: (lookDown - lookUp) / 2      // -1 (up) to 1 (down)
          }
        }
        
        // Check if user is looking at a specific window
        function isLookingAtWindow(blendshapes, windowEl) {
          if (!windowEl) return false
          
          const gaze = getGazeDirection(blendshapes)
          const rect = windowEl.getBoundingClientRect()
          const screenCenterX = window.innerWidth / 2
          const screenCenterY = window.innerHeight / 2
          const windowCenterX = rect.left + rect.width / 2
          const windowCenterY = rect.top + rect.height / 2
          
          // Calculate where the window is relative to screen center
          const windowDirX = (windowCenterX - screenCenterX) / screenCenterX  // -1 to 1
          const windowDirY = (windowCenterY - screenCenterY) / screenCenterY  // -1 to 1
          
          // Check if gaze direction roughly matches window direction
          // Allow some tolerance (0.3)
          const xMatch = Math.abs(gaze.x - windowDirX) < 0.5
          const yMatch = Math.abs(gaze.y - windowDirY) < 0.5
          
          // Also check if looking roughly at center (window is centered)
          const lookingCenter = Math.abs(gaze.x) < 0.2 && Math.abs(gaze.y) < 0.2
          const windowNearCenter = Math.abs(windowDirX) < 0.3 && Math.abs(windowDirY) < 0.3
          
          return (xMatch && yMatch) || (lookingCenter && windowNearCenter)
        }
        
        // Check if user is looking at camera (eyes forward)
        function isLookingAtCamera(blendshapes) {
          if (!blendshapes || blendshapes.length === 0) return false
          
          const shapes = blendshapes[0].categories
          
          // Find eye look directions
          let lookLeft = 0, lookRight = 0, lookUp = 0, lookDown = 0
          
          for (const shape of shapes) {
            if (shape.categoryName === 'eyeLookOutLeft') lookLeft = shape.score
            if (shape.categoryName === 'eyeLookOutRight') lookRight = shape.score
            if (shape.categoryName === 'eyeLookInLeft') lookRight += shape.score
            if (shape.categoryName === 'eyeLookInRight') lookLeft += shape.score
            if (shape.categoryName === 'eyeLookUpLeft' || shape.categoryName === 'eyeLookUpRight') lookUp += shape.score
            if (shape.categoryName === 'eyeLookDownLeft' || shape.categoryName === 'eyeLookDownRight') lookDown += shape.score
          }
          
          // Looking at camera = not looking strongly in any direction
          const isLooking = lookLeft < 0.3 && lookRight < 0.3 && lookUp < 0.4 && lookDown < 0.4
          return isLooking
        }
        
        // Check if user is blinking
        function isBlinking(blendshapes) {
          if (!blendshapes || blendshapes.length === 0) return false
          
          const shapes = blendshapes[0].categories
          
          let leftBlink = 0, rightBlink = 0
          
          for (const shape of shapes) {
            if (shape.categoryName === 'eyeBlinkLeft') leftBlink = shape.score
            if (shape.categoryName === 'eyeBlinkRight') rightBlink = shape.score
          }
          
          // Both eyes mostly closed = blink
          return leftBlink > 0.5 && rightBlink > 0.5
        }
        
        // ASCII render loop with face tracking
        async function renderASCII() {
          if (!video.srcObject) return
          
          // Process face tracking
          if (faceLandmarker && video.readyState >= 2) {
            const now = performance.now()
            if (now - lastFaceTime > 50) { // ~20fps for face tracking
              processCtx.drawImage(video, 0, 0, 640, 480)
              try {
                const results = faceLandmarker.detectForVideo(processCanvas, now)
                
                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                  // Check if looking at camera
                  lookingAtCamera = isLookingAtCamera(results.faceBlendshapes)
                  
                  // Set resolution based on eye contact
                  if (lookingAtCamera) {
                    targetWidth = 140  // High res when looking at camera
                    targetHeight = 75
                  } else {
                    targetWidth = 40   // Low res when not looking
                    targetHeight = 22
                  }
                  
                  // Check for blink to cycle color modes
                  const currentBlink = isBlinking(results.faceBlendshapes)
                  if (currentBlink && !lastBlinkState) {
                    colorMode = (colorMode + 1) % 5
                    setColorMode(colorMode)
                  }
                  lastBlinkState = currentBlink
                }
                
              } catch (e) {}
              lastFaceTime = now
            }
          }
          
          // Smooth resolution changes
          currentWidth += (targetWidth - currentWidth) * 0.1
          currentHeight += (targetHeight - currentHeight) * 0.1
          
          const WIDTH = Math.round(currentWidth)
          const HEIGHT = Math.round(currentHeight)
          
          // Calculate font size to fill the viewport
          const viewport = asciiOutput.parentElement
          const viewportWidth = viewport?.clientWidth || 800
          const viewportHeight = viewport?.clientHeight || 600
          
          // Calculate font size based on both width and height constraints
          const fontByWidth = viewportWidth / WIDTH
          const fontByHeight = viewportHeight / HEIGHT
          const fontSize = Math.min(fontByWidth, fontByHeight) * 0.95
          
          asciiOutput.style.fontSize = fontSize + 'px'
          asciiOutput.style.lineHeight = '1'
          asciiOutput.style.letterSpacing = '0'
          window.asciiFontSize = fontSize
          
          // Set canvas size for ASCII sampling
          canvas.width = WIDTH
          canvas.height = HEIGHT
          
          // Draw video frame to canvas (mirrored)
          ctx.save()
          ctx.scale(-1, 1)
          ctx.drawImage(video, -WIDTH, 0, WIDTH, HEIGHT)
          ctx.restore()
          
          const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
          const pixels = imageData.data
          
          let ascii = ''
          for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
              const i = (y * WIDTH + x) * 4
              
              const r = pixels[i]
              const g = pixels[i + 1]
              const b = pixels[i + 2]
              const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
              
              // Map brightness to ASCII character
              const charIndex = Math.floor((1 - brightness / 255) * (ASCII_CHARS.length - 1))
              ascii += ASCII_CHARS[Math.max(0, Math.min(charIndex, ASCII_CHARS.length - 1))]
            }
            ascii += '\n'
          }
          
          asciiOutput.textContent = ascii
          window.asciiCameraOutput = ascii
          animationId = requestAnimationFrame(renderASCII)
        }
        
        renderASCII()
        
      } catch (err) {
        loading.textContent = 'Camera access denied'
        console.error('Camera error:', err)
      }
      
      // Cleanup when window closes
      const windowEl = content.closest('.window')
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (node === windowEl || node.contains?.(windowEl)) {
              if (animationId) cancelAnimationFrame(animationId)
              if (stream) stream.getTracks().forEach(track => track.stop())
              // Clear master flag so next window can become master
              window.asciiCameraMaster = false
            }
          })
        })
      })
      
      if (windowEl && windowEl.parentNode) {
        observer.observe(windowEl.parentNode, { childList: true })
      }
    }
  },

  explorer: {
    title: 'File Explorer',
    icon: '📁',
    width: 800,
    height: 500,
    content: `
      <div class="explorer-content">
        <div class="explorer-sidebar">
          <div class="explorer-sidebar-item">📁 Desktop</div>
          <div class="explorer-sidebar-item">📁 Documents</div>
          <div class="explorer-sidebar-item">📁 Downloads</div>
          <div class="explorer-sidebar-item">📁 Pictures</div>
          <div class="explorer-sidebar-item">📁 Music</div>
          <div class="explorer-sidebar-item">📁 Videos</div>
        </div>
        <div class="explorer-main">
          <div class="explorer-item">
            <span class="icon">📁</span>
            <span class="name">Documents</span>
          </div>
          <div class="explorer-item">
            <span class="icon">📁</span>
            <span class="name">Pictures</span>
          </div>
          <div class="explorer-item">
            <span class="icon">📁</span>
            <span class="name">Downloads</span>
          </div>
          <div class="explorer-item">
            <span class="icon">📄</span>
            <span class="name">readme.txt</span>
          </div>
          <div class="explorer-item">
            <span class="icon">🖼️</span>
            <span class="name">photo.jpg</span>
          </div>
          <div class="explorer-item">
            <span class="icon">🎵</span>
            <span class="name">music.mp3</span>
          </div>
        </div>
      </div>
    `,
  },

  settings: {
    title: 'Settings',
    icon: '⚙️',
    width: 700,
    height: 500,
    content: `
      <div class="settings-content">
        <h2>Settings</h2>
        <div class="setting-item">
          <label>Dark Mode</label>
          <div class="toggle-switch active" data-setting="darkMode"></div>
        </div>
        <div class="setting-item">
          <label>Notifications</label>
          <div class="toggle-switch" data-setting="notifications"></div>
        </div>
        <div class="setting-item">
          <label>Sound Effects</label>
          <div class="toggle-switch active" data-setting="sounds"></div>
        </div>
        <div class="setting-item">
          <label>Auto-hide Taskbar</label>
          <div class="toggle-switch" data-setting="autoHideTaskbar"></div>
        </div>
        <div class="setting-item">
          <label>Show Desktop Icons</label>
          <div class="toggle-switch active" data-setting="showIcons"></div>
        </div>
      </div>
    `,
    onInit: (content) => {
      content.querySelectorAll('.toggle-switch').forEach(toggle => {
        toggle.addEventListener('click', () => {
          toggle.classList.toggle('active')
        })
      })
    }
  },

  terminal: {
    title: 'Terminal',
    icon: '💻',
    width: 700,
    height: 400,
    content: `
      <div class="terminal-content">
        <div class="terminal-output">Welcome to Windows Terminal</div>
        <div class="terminal-output">Type 'help' for available commands.</div>
        <div class="terminal-line">
          <span class="terminal-prompt">C:\\Users\\User></span>
          <input type="text" class="terminal-input" autofocus />
        </div>
      </div>
    `,
    onInit: (content) => {
      const terminalContent = content.querySelector('.terminal-content')
      const input = content.querySelector('.terminal-input')
      
      const commands = {
        help: 'Available commands: help, clear, echo, date, whoami, dir, ver',
        clear: () => {
          const lines = terminalContent.querySelectorAll('.terminal-output')
          lines.forEach(line => line.remove())
          return ''
        },
        date: new Date().toString(),
        whoami: 'User',
        dir: `
 Directory of C:\\Users\\User

12/08/2025  10:00 AM    <DIR>          .
12/08/2025  10:00 AM    <DIR>          ..
12/08/2025  10:00 AM    <DIR>          Desktop
12/08/2025  10:00 AM    <DIR>          Documents
12/08/2025  10:00 AM    <DIR>          Downloads
               0 File(s)              0 bytes
               5 Dir(s)   500,000,000 bytes free`,
        ver: 'Windows Desktop Simulator [Version 1.0.0]'
      }

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value.trim().toLowerCase()
          const args = cmd.split(' ')
          const command = args[0]
          
          // Create output for the command
          const cmdOutput = document.createElement('div')
          cmdOutput.className = 'terminal-output'
          cmdOutput.textContent = `C:\\Users\\User>${input.value}`
          
          // Insert before the input line
          const inputLine = content.querySelector('.terminal-line')
          inputLine.before(cmdOutput)
          
          // Execute command
          let result = ''
          if (command === 'echo') {
            result = args.slice(1).join(' ')
          } else if (commands[command]) {
            result = typeof commands[command] === 'function' 
              ? commands[command]() 
              : commands[command]
          } else if (command) {
            result = `'${command}' is not recognized as an internal or external command.`
          }
          
          if (result) {
            const resultOutput = document.createElement('div')
            resultOutput.className = 'terminal-output'
            resultOutput.textContent = result
            inputLine.before(resultOutput)
          }
          
          input.value = ''
          terminalContent.scrollTop = terminalContent.scrollHeight
        }
      })
      
      // Focus input when clicking terminal
      content.addEventListener('click', () => {
        input.focus()
      })
    }
  }
}
