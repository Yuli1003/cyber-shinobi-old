// App configurations and initialization functions

export const apps = {
  readme: {
    title: 'README.txt - Notepad',
    icon: '📄',
    width: 500,
    height: 400,
    content: `
      <div class="win95-text-viewer">
        <div class="win95-menubar">
          <span class="win95-menu-item">File</span>
          <span class="win95-menu-item">Edit</span>
          <span class="win95-menu-item">Help</span>
        </div>
        <div class="win95-text-content">
          <img src="bamboo_frame.svg" class="bamboo-frame" alt="">
          <pre class="win95-text">README.txt

⚠️  SYSTEM WARNING ⚠️

Your system has been compromised.

Unauthorized access detected.
Multiple security violations found.
Data integrity cannot be verified.

[!] DO NOT CLOSE THIS WINDOW [!]

Attempting to restore system...

Error: Restoration failed.
Error: Security protocols offline.
Error: Cannot establish secure connection.

═══════════════════════════════════

YOU SHOULDN'T HAVE OPENED THIS.

═══════════════════════════════════</pre>
        </div>
      </div>
    `,
  },

  notepad: {
    title: 'Notepad',
    icon: '✉️',
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

  camera: {
    title: 'ASCII Camera',
    icon: '📷',
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
      
      // Always use highest resolution
      const WIDTH = 140
      const HEIGHT = 75
      let colorMode = 0  // 0: black/white, 1: red/white, 2: white/red, 3: white/black, 4: black/red
      
      // Color mode classes
      const colorModes = ['mode-default', 'mode-red-white', 'mode-white-red', 'mode-white-black', 'mode-black-red']
      
      function setColorMode(mode) {
        colorModes.forEach(m => asciiOutput.classList.remove(m))
        asciiOutput.classList.add(colorModes[mode])
        window.asciiColorMode = mode
      }
      
      // Face tracking variables
      let animationId = null
      let stream = null
      
      // Skip face tracking - not needed anymore
      loading.textContent = 'Starting camera...'
      
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
        
        // ASCII render loop
        async function renderASCII() {
          if (!video.srcObject) return
          
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
              // Show "look at yourself" final sequence
              if (window.showFinalSequence) {
                window.showFinalSequence()
              }
            }
          })
        })
      })
      
      if (windowEl && windowEl.parentNode) {
        observer.observe(windowEl.parentNode, { childList: true })
      }
    }
  },

  browser: {
    title: 'Browser',
    icon: '🌐',
    width: 800,
    height: 600,
    content: `
      <div class="browser-content">
        <div class="browser-toolbar">
          <input type="text" class="browser-url" value="https://example.com" readonly>
        </div>
        <div class="browser-page">
          <h1>Browser</h1>
          <p>This is a placeholder browser window.</p>
        </div>
      </div>
    `,
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
