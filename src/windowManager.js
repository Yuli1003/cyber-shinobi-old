// Window Manager - handles window creation, dragging, resizing, focus
export class WindowManager {
  constructor() {
    this.windows = []
    this.zIndex = 100
    this.container = document.getElementById('windows-container')
    this.onWindowsChange = null
  }

  createWindow(config) {
    const id = `window-${Date.now()}`
    const windowData = {
      id,
      title: config.title,
      icon: config.icon,
      minimized: false,
      maximized: false,
      focused: true,
      x: config.x || 100 + (this.windows.length * 30),
      y: config.y || 100 + (this.windows.length * 30),
      width: config.width || 600,
      height: config.height || 400,
    }

    // Unfocus all other windows
    this.windows.forEach(w => w.focused = false)
    this.windows.push(windowData)

    // Create window element
    const windowEl = document.createElement('div')
    windowEl.id = id
    windowEl.className = 'window focused'
    
    // Add special class for ASCII Camera window
    if (config.title === 'ASCII Camera') {
      windowEl.classList.add('ascii-camera-window')
    }
    
    windowEl.style.cssText = `
      left: ${windowData.x}px;
      top: ${windowData.y}px;
      width: ${windowData.width}px;
      height: ${windowData.height}px;
      z-index: ${++this.zIndex};
    `

    windowEl.innerHTML = `
      <div class="window-titlebar">
        <div class="window-title">
          <span class="icon">${config.icon}</span>
          <span>${config.title}</span>
        </div>
        <div class="window-controls">
          <button class="minimize-btn">─</button>
          <button class="maximize-btn">□</button>
          <button class="close-btn">✕</button>
        </div>
      </div>
      <div class="window-content">${config.content}</div>
      <div class="resize-handle n"></div>
      <div class="resize-handle s"></div>
      <div class="resize-handle e"></div>
      <div class="resize-handle w"></div>
      <div class="resize-handle nw"></div>
      <div class="resize-handle ne"></div>
      <div class="resize-handle sw"></div>
      <div class="resize-handle se"></div>
    `

    this.container.appendChild(windowEl)

    // Initialize window behaviors
    this.initWindowDrag(windowEl, windowData)
    this.initWindowResize(windowEl, windowData)
    this.initWindowControls(windowEl, windowData)
    this.initWindowFocus(windowEl, windowData)

    // Run app init if provided
    if (config.onInit) {
      config.onInit(windowEl.querySelector('.window-content'), windowData)
    }

    this.notifyChange()
    return windowData
  }

  initWindowDrag(windowEl, windowData) {
    const titlebar = windowEl.querySelector('.window-titlebar')
    let isDragging = false
    let startX, startY, startLeft, startTop

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.window-controls')) return
      if (windowData.maximized) return
      
      isDragging = true
      startX = e.clientX
      startY = e.clientY
      startLeft = windowData.x
      startTop = windowData.y
      
      this.focusWindow(windowData.id)
    })

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      
      windowData.x = startLeft + (e.clientX - startX)
      windowData.y = startTop + (e.clientY - startY)
      
      // Keep window in bounds
      const canvasWidth = 1536
      const canvasHeight = 864
      windowData.x = Math.max(0, Math.min(canvasWidth - 100, windowData.x))
      windowData.y = Math.max(0, Math.min(canvasHeight - 100, windowData.y))
      
      windowEl.style.left = `${windowData.x}px`
      windowEl.style.top = `${windowData.y}px`
    })

    document.addEventListener('mouseup', () => {
      isDragging = false
    })

    // Double click to maximize
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.closest('.window-controls')) return
      this.toggleMaximize(windowData.id)
    })
  }

  initWindowResize(windowEl, windowData) {
    const handles = windowEl.querySelectorAll('.resize-handle')
    let isResizing = false
    let currentHandle = null
    let startX, startY, startWidth, startHeight, startLeft, startTop

    handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        if (windowData.maximized) return
        
        isResizing = true
        currentHandle = handle
        startX = e.clientX
        startY = e.clientY
        startWidth = windowData.width
        startHeight = windowData.height
        startLeft = windowData.x
        startTop = windowData.y
        
        e.preventDefault()
        this.focusWindow(windowData.id)
      })
    })

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return
      
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      const classList = currentHandle.classList

      if (classList.contains('e') || classList.contains('ne') || classList.contains('se')) {
        windowData.width = Math.max(300, startWidth + dx)
      }
      if (classList.contains('w') || classList.contains('nw') || classList.contains('sw')) {
        const newWidth = Math.max(300, startWidth - dx)
        if (newWidth !== windowData.width) {
          windowData.x = startLeft + (startWidth - newWidth)
          windowData.width = newWidth
        }
      }
      if (classList.contains('s') || classList.contains('se') || classList.contains('sw')) {
        windowData.height = Math.max(200, startHeight + dy)
      }
      if (classList.contains('n') || classList.contains('ne') || classList.contains('nw')) {
        const newHeight = Math.max(200, startHeight - dy)
        if (newHeight !== windowData.height) {
          windowData.y = startTop + (startHeight - newHeight)
          windowData.height = newHeight
        }
      }

      windowEl.style.left = `${windowData.x}px`
      windowEl.style.top = `${windowData.y}px`
      windowEl.style.width = `${windowData.width}px`
      windowEl.style.height = `${windowData.height}px`
    })

    document.addEventListener('mouseup', () => {
      isResizing = false
      currentHandle = null
    })
  }

  initWindowControls(windowEl, windowData) {
    const minimizeBtn = windowEl.querySelector('.minimize-btn')
    const maximizeBtn = windowEl.querySelector('.maximize-btn')
    const closeBtn = windowEl.querySelector('.close-btn')

    minimizeBtn.addEventListener('click', () => {
      this.minimizeWindow(windowData.id)
    })

    maximizeBtn.addEventListener('click', () => {
      this.toggleMaximize(windowData.id)
    })

    closeBtn.addEventListener('click', () => {
      this.closeWindow(windowData.id)
    })
  }

  initWindowFocus(windowEl, windowData) {
    windowEl.addEventListener('mousedown', () => {
      this.focusWindow(windowData.id)
    })
  }

  focusWindow(id) {
    this.windows.forEach(w => {
      w.focused = w.id === id
      const el = document.getElementById(w.id)
      if (el) {
        el.classList.toggle('focused', w.focused)
        if (w.focused) {
          el.style.zIndex = ++this.zIndex
        }
      }
    })
    this.notifyChange()
  }

  minimizeWindow(id) {
    const windowData = this.windows.find(w => w.id === id)
    if (windowData) {
      windowData.minimized = true
      windowData.focused = false
      const el = document.getElementById(id)
      if (el) {
        el.classList.add('minimized')
        el.classList.remove('focused')
      }
      
      // Focus next window
      const visibleWindows = this.windows.filter(w => !w.minimized)
      if (visibleWindows.length > 0) {
        this.focusWindow(visibleWindows[visibleWindows.length - 1].id)
      }
      
      this.notifyChange()
    }
  }

  restoreWindow(id) {
    const windowData = this.windows.find(w => w.id === id)
    if (windowData) {
      windowData.minimized = false
      const el = document.getElementById(id)
      if (el) {
        el.classList.remove('minimized')
      }
      this.focusWindow(id)
    }
  }

  toggleMaximize(id) {
    const windowData = this.windows.find(w => w.id === id)
    if (windowData) {
      windowData.maximized = !windowData.maximized
      const el = document.getElementById(id)
      if (el) {
        el.classList.toggle('maximized', windowData.maximized)
        
        // Update maximize button icon
        const maxBtn = el.querySelector('.maximize-btn')
        maxBtn.textContent = windowData.maximized ? '❐' : '□'
      }
    }
  }

  closeWindow(id) {
    const index = this.windows.findIndex(w => w.id === id)
    if (index !== -1) {
      const el = document.getElementById(id)
      if (el) {
        el.remove()
      }
      this.windows.splice(index, 1)
      
      // Spawn offscreen Game of Life pattern when window closes
      if (window.spawnOffscreenPattern) {
        window.spawnOffscreenPattern()
      }
      
      // Focus next window
      if (this.windows.length > 0) {
        const visibleWindows = this.windows.filter(w => !w.minimized)
        if (visibleWindows.length > 0) {
          this.focusWindow(visibleWindows[visibleWindows.length - 1].id)
        }
      }
      
      this.notifyChange()
    }
  }

  notifyChange() {
    if (this.onWindowsChange) {
      this.onWindowsChange()
    }
  }
}
