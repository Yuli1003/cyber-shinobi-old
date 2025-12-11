# Windows Desktop Simulator

A JavaScript web app built with Vite that simulates a Windows-style desktop environment.

## Features

- **Desktop Icons** - Double-click to open applications
- **Taskbar** - Shows running applications with minimize/restore functionality
- **Start Menu** - Access all applications
- **Window Management**
  - Drag windows by title bar
  - Resize windows from edges and corners
  - Minimize, maximize, and close windows
  - Focus windows by clicking
- **Built-in Apps**
  - 📝 Notepad - Text editor
  - 🔢 Calculator - Basic calculator
  - 🌐 Browser - Simulated web browser
  - 📁 File Explorer - File browser interface
  - ⚙️ Settings - Toggle switches
  - 💻 Terminal - Command line interface
- **Context Menu** - Right-click on desktop for options
- **System Clock** - Real-time clock in taskbar

## Getting Started

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Project Structure

```
├── index.html          # Main HTML file
├── src/
│   ├── main.js         # Main entry point
│   ├── style.css       # All styles
│   ├── windowManager.js # Window management logic
│   └── apps.js         # Application configurations
└── package.json
```

## Usage

- **Open an app**: Double-click a desktop icon or click an app in the Start Menu
- **Move a window**: Drag the title bar
- **Resize a window**: Drag window edges or corners
- **Maximize**: Double-click title bar or click maximize button
- **Minimize**: Click minimize button or click active app in taskbar
- **Close**: Click the X button
- **Context menu**: Right-click on desktop
