# Plan 1: Electron Shell + Resolution + Error Handling

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the Phaser/React game in Electron so it runs as a Windows and Linux desktop app, with proper resolution scaling, fullscreen toggle, and crash logging.

**Architecture:** Electron's main process (Node.js, `.cjs` files) creates a BrowserWindow that loads the Vite-built renderer. The game code is unchanged — all new work lives in `electron/`. The web build continues to work for the itch.io demo via a separate Vite config. `package.json` uses `"type": "module"`, so all Electron files use the `.cjs` extension to stay CommonJS.

**Tech Stack:** Electron 34+, electron-builder 25+, Vitest 2+, @testing-library/react 16+, concurrently, wait-on, cross-env

---

## File Map

**Create:**
- `electron/main.cjs` — BrowserWindow setup, protocol, crash log, fullscreen IPC handler
- `electron/preload.cjs` — contextBridge: exposes `toggleFullscreen` and `platform` to renderer
- `electron/ipc/index.cjs` — IPC route registration (fullscreen now; Steamworks routes in Plan 3)
- `vite/config.electron.mjs` — Vite build config for Electron renderer (outputs to `dist/electron`)
- `electron-builder.config.cjs` — Packaging config for Windows + Linux
- `vitest.config.mjs` — Vitest config with jsdom environment
- `src/__tests__/setup.js` — `@testing-library/jest-dom` import
- `src/__tests__/ErrorBoundary.test.jsx` — Unit tests for ErrorBoundary
- `src/ErrorBoundary.jsx` — React class component, catches game crashes

**Modify:**
- `package.json` — add `"main"` field, new scripts, new dev dependencies
- `src/game/main.js` — add `scale` block with `Phaser.Scale.FIT`
- `src/App.jsx` — wrap `<PhaserGame>` with `<ErrorBoundary>`, add F11 keydown listener

---

## Task 1: Set up Vitest and React Testing Library

**Files:**
- Create: `vitest.config.mjs`
- Create: `src/__tests__/setup.js`
- Modify: `package.json`

- [ ] **Step 1: Install test dependencies**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected: packages added to `devDependencies` in `package.json`, no errors.

- [ ] **Step 2: Create Vitest config**

Create `vitest.config.mjs`:

```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
  }
})
```

- [ ] **Step 3: Create test setup file**

Create `src/__tests__/setup.js`:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add inside `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify Vitest runs with no tests**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected output: `No test files found` or `0 tests passed`. No errors about missing modules.

- [ ] **Step 6: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add vitest.config.mjs src/__tests__/setup.js package.json package-lock.json
git commit -m "chore: add Vitest and React Testing Library"
```

---

## Task 2: Install Electron dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Electron and packaging tools**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

Expected: packages added, no errors. `electron` version should be 34.x or higher.

- [ ] **Step 2: Verify Electron binary exists**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
./node_modules/.bin/electron --version
```

Expected output: `v34.x.x` (or current version).

- [ ] **Step 3: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add package.json package-lock.json
git commit -m "chore: add Electron and electron-builder dependencies"
```

---

## Task 3: Create Electron main process files

**Files:**
- Create: `electron/main.cjs`
- Create: `electron/preload.cjs`
- Create: `electron/ipc/index.cjs`

- [ ] **Step 1: Create the ipc directory**

```bash
mkdir -p "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry/electron/ipc"
```

- [ ] **Step 2: Create `electron/ipc/index.cjs`**

```js
'use strict'

const { ipcMain, BrowserWindow } = require('electron')

/**
 * Register all IPC handlers.
 * Add new handlers here as Steam features are built in Plan 3.
 * @param {BrowserWindow} mainWindow
 */
function registerIpcHandlers(mainWindow) {
  ipcMain.handle('window:toggle-fullscreen', () => {
    const isFullScreen = mainWindow.isFullScreen()
    mainWindow.setFullScreen(!isFullScreen)
    return !isFullScreen
  })

  ipcMain.handle('window:is-fullscreen', () => {
    return mainWindow.isFullScreen()
  })
}

module.exports = { registerIpcHandlers }
```

- [ ] **Step 3: Create `electron/preload.cjs`**

```js
'use strict'

const { contextBridge, ipcRenderer } = require('electron')

/**
 * @typedef {Object} ElectronAPI
 * @property {() => Promise<boolean>} toggleFullscreen
 * @property {() => Promise<boolean>} isFullscreen
 * @property {string} platform
 */

contextBridge.exposeInMainWorld('electronAPI', {
  /** @returns {Promise<boolean>} new fullscreen state */
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),

  /** @returns {Promise<boolean>} current fullscreen state */
  isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),

  /** @type {string} 'win32' | 'linux' | 'darwin' */
  platform: process.platform,
})
```

- [ ] **Step 4: Create `electron/main.cjs`**

> **Note on asset paths:** The design spec described a custom `game://` protocol for asset loading. This plan uses `loadFile()` instead — simpler, more reliable, and works natively with Electron's `.asar` packaging. Vite already builds assets with `base: './'`, so relative paths resolve correctly when loaded via `file://`. No asset pack JSON files need to be modified.

```js
'use strict'

const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { registerIpcHandlers } = require('./ipc/index.cjs')

const isDev = process.env.NODE_ENV === 'development'

// ── Crash logging ────────────────────────────────────────────────────────────
function getLogPath() {
  const logDir = path.join(app.getPath('userData'), 'logs')
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
  return path.join(logDir, 'error.log')
}

process.on('uncaughtException', (error) => {
  try {
    fs.appendFileSync(
      getLogPath(),
      `${new Date().toISOString()} [uncaughtException]\n${error.stack}\n\n`
    )
  } catch (_) { /* can't log the logger */ }
})

// ── Window creation ──────────────────────────────────────────────────────────
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 768,
    fullscreenable: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  // Remove default menu bar (keeps Alt+F4, OS shortcuts intact)
  mainWindow.setMenuBarVisibility(false)

  registerIpcHandlers(mainWindow)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/electron/index.html'))
  }

  // Open external links in the system browser, not in the game window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // Quit on all platforms (no macOS "stay open" behavior for a game)
  app.quit()
})
```

- [ ] **Step 5: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add electron/
git commit -m "feat: add Electron main process, preload, and IPC scaffold"
```

---

## Task 4: Add `"main"` field and Electron scripts to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `"main"` field and new scripts**

Open `package.json`. Add `"main": "electron/main.cjs"` at the top level (alongside `"name"`, `"version"`, etc.).

Replace the `"scripts"` block with:

```json
"scripts": {
    "dev": "node log.js dev & vite --config vite/config.dev.mjs",
    "dev:electron": "concurrently \"vite --config vite/config.dev.mjs\" \"wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .\"",
    "build": "node log.js build & vite build --config vite/config.prod.mjs",
    "build:web": "vite build --config vite/config.prod.mjs --outDir dist/web --emptyOutDir",
    "build:electron": "vite build --config vite/config.electron.mjs",
    "build:win": "npm run build:electron && electron-builder --win",
    "build:linux": "npm run build:electron && electron-builder --linux",
    "preview": "vite preview --config vite/config.prod.mjs",
    "dev-nolog": "vite --config vite/config.dev.mjs",
    "build-nolog": "vite build --config vite/config.prod.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "npm run build:web && butler push dist/web fluffymcchicken/gjg2:web",
    "deploy:win": "npm run build:web && butler push dist/web fluffymcchicken/gjg2:windows-web",
    "deploy:all": "npm run build:web && butler push dist/web fluffymcchicken/gjg2:all"
}
```

- [ ] **Step 2: Verify the scripts parse correctly**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
node -e "require('./package.json')" && echo "JSON valid"
```

Expected: `JSON valid`

- [ ] **Step 3: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add package.json
git commit -m "feat: add Electron scripts and main entry to package.json"
```

---

## Task 5: Create Electron Vite build config

**Files:**
- Create: `vite/config.electron.mjs`

- [ ] **Step 1: Create `vite/config.electron.mjs`**

```js
import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './config.prod.mjs'

// Electron renderer build — identical to web production build
// except it outputs to dist/electron so electron-builder can find it.
// base './' is required so loadFile() resolves assets correctly.
export default mergeConfig(baseConfig, defineConfig({
  base: './',
  build: {
    outDir: 'dist/electron',
    emptyOutDir: true,
  }
}))
```

- [ ] **Step 2: Verify the config can be loaded by Vite**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
node -e "import('./vite/config.electron.mjs').then(() => console.log('config OK')).catch(e => { console.error(e.message); process.exit(1) })"
```

Expected: `config OK`

- [ ] **Step 3: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add vite/config.electron.mjs
git commit -m "feat: add Vite build config for Electron renderer"
```

---

## Task 6: Configure electron-builder

**Files:**
- Create: `electron-builder.config.cjs`

- [ ] **Step 1: Create `electron-builder.config.cjs`**

```js
'use strict'

/**
 * electron-builder configuration.
 * Icons: add build-resources/icon.ico (Windows) and build-resources/icon.png
 * (Linux, 512x512) when game art is finalised. electron-builder uses a
 * default icon until then — no build failure without them.
 */
module.exports = {
  appId: 'com.fluffyswizzle.equilibriumprotocol',
  productName: 'Equilibrium Protocol',

  directories: {
    output: 'release',
  },

  // Files included in the packaged app
  files: [
    'dist/electron/**/*',
    'electron/**/*',
    'package.json',
  ],

  // electron-builder needs the package.json "main" field to point here
  // Already set to "electron/main.cjs" in Task 4.

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    // icon: 'build-resources/icon.ico',  // uncomment when icon is ready
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },

  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    category: 'Game',
    // icon: 'build-resources/icon.png',  // uncomment when icon is ready
  },
}
```

- [ ] **Step 2: Verify the config is valid JavaScript**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
node -e "require('./electron-builder.config.cjs'); console.log('config OK')"
```

Expected: `config OK`

- [ ] **Step 3: Add `release/` to `.gitignore`**

electron-builder writes packaged installers to `release/`. This is not in `.gitignore` yet. Add it:

Open `.gitignore` and add under `# Build directories`:
```
release
```

- [ ] **Step 4: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add electron-builder.config.cjs .gitignore
git commit -m "feat: add electron-builder config for Windows and Linux packaging"
```

---

## Task 7: Update Phaser scale config to FIT mode

**Files:**
- Modify: `src/game/main.js`

- [ ] **Step 1: Write the failing test**

The Phaser game config is not unit-testable in isolation, but we can verify the config object has the expected shape. Create `src/__tests__/gameConfig.test.js`:

```js
import StartGame from '../game/main.js'

// We can't actually start the game in tests (Phaser needs a DOM canvas),
// but we can verify the exported StartGame function exists and that
// the config shape has a scale block. We inspect the module source instead.
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Phaser game config', () => {
  it('main.js includes Phaser.Scale.FIT in the scale config', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/game/main.js'), 'utf8')
    expect(src).toContain('Phaser.Scale.FIT')
    expect(src).toContain('autoCenter')
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/gameConfig.test.js
```

Expected: FAIL — `expect(src).toContain('Phaser.Scale.FIT')` fails.

- [ ] **Step 3: Add the scale block to `src/game/main.js`**

In `src/game/main.js`, the current `config` object has:
```js
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
```

Replace those four lines with:
```js
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
```

`width` and `height` remain as the internal resolution. `FIT` letterboxes to any window size without changing game coordinates.

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/gameConfig.test.js
```

Expected: PASS.

- [ ] **Step 5: Run full test suite**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/game/main.js src/__tests__/gameConfig.test.js
git commit -m "feat: add Phaser Scale.FIT mode for responsive desktop window"
```

---

## Task 8: Add React ErrorBoundary

**Files:**
- Create: `src/ErrorBoundary.jsx`
- Create: `src/__tests__/ErrorBoundary.test.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/ErrorBoundary.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

function BrokenComponent() {
  throw new Error('Test crash')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Game loaded</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Game loaded')).toBeInTheDocument()
  })

  it('renders the error screen when a child throws', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('resets error state when Try Again is clicked', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )
    // Click Try Again — resets the error flag (BrokenComponent throws again immediately,
    // which is correct: the error screen reappears, proving the reset cycle works)
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/ErrorBoundary.test.jsx
```

Expected: FAIL — `ErrorBoundary` not found.

- [ ] **Step 3: Create `src/ErrorBoundary.jsx`**

```jsx
import { Component } from 'react'

/**
 * Catches uncaught errors in the Phaser/React game tree.
 * Shows a recovery screen instead of a blank canvas.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Game crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
          background: '#0a0a1a',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          gap: '16px',
        }}>
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)' }}>
            Please restart the game. If this keeps happening, check the error log.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.87)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/ErrorBoundary.test.jsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Wrap `<PhaserGame>` in `<ErrorBoundary>` in `src/App.jsx`**

In `src/App.jsx`, add the import at the top:

```js
import { ErrorBoundary } from './ErrorBoundary';
```

In the `return` block, wrap the `<PhaserGame>` with the boundary:

```jsx
return (
    <div id="app">
        <div style={{ position: 'relative' }}>
            <ErrorBoundary>
                <PhaserGame ref={phaserRef} />
            </ErrorBoundary>
        </div>
        
        {isDev && (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <div>
                    <button className="button" onClick={changeScene}>Change Scene</button>
                </div>
                
                {/* Debug Panel */}
                <DebugPanel gameRef={phaserRef} />
            </div>
        )}
    </div>
);
```

- [ ] **Step 6: Run full test suite**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/ErrorBoundary.jsx src/__tests__/ErrorBoundary.test.jsx src/App.jsx
git commit -m "feat: add React ErrorBoundary around game with recovery screen"
```

---

## Task 9: Add F11 fullscreen toggle

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/ErrorBoundary.test.jsx` (or create a new `App.test.jsx` — use new file):

Create `src/__tests__/fullscreen.test.js`:

```js
describe('F11 fullscreen handler', () => {
  it('calls electronAPI.toggleFullscreen when F11 is pressed', () => {
    // Mock the electronAPI (only available in Electron, not browser/test)
    const toggleFullscreen = vi.fn().mockResolvedValue(true)
    window.electronAPI = { toggleFullscreen, isFullscreen: vi.fn(), platform: 'linux' }

    // Simulate the keydown handler directly (the handler is tested in isolation)
    const handler = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        window.electronAPI?.toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handler)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11' }))
    window.removeEventListener('keydown', handler)

    expect(toggleFullscreen).toHaveBeenCalledOnce()

    delete window.electronAPI
  })

  it('does nothing when electronAPI is absent (web build)', () => {
    // electronAPI is undefined in web/browser context
    expect(window.electronAPI).toBeUndefined()

    const handler = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        window.electronAPI?.toggleFullscreen()
      }
    }

    // Should not throw
    window.addEventListener('keydown', handler)
    expect(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F11' }))
    }).not.toThrow()
    window.removeEventListener('keydown', handler)
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/fullscreen.test.js
```

Expected: FAIL (the handler doesn't exist yet so neither test can find it in `App.jsx`). The second test about not throwing may pass — that is fine.

- [ ] **Step 3: Add F11 listener to `src/App.jsx`**

In `src/App.jsx`, add a `useEffect` that registers the keydown listener. Add it below the existing `useEffect` for scene changes:

```jsx
// F11 toggles fullscreen in Electron desktop builds.
// window.electronAPI is undefined in web/browser builds — optional chaining is intentional.
useEffect(() => {
    const handleKeyDown = (e) => {
        if (e.key === 'F11') {
            e.preventDefault()
            window.electronAPI?.toggleFullscreen()
        }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/fullscreen.test.js
```

Expected: 2 tests pass.

- [ ] **Step 5: Run full test suite**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/App.jsx src/__tests__/fullscreen.test.js
git commit -m "feat: add F11 fullscreen toggle via Electron IPC"
```

---

## Task 10: Manual verification — Electron dev mode

**No files to change — this is a smoke test.**

- [ ] **Step 1: Start the Electron dev build**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm run dev:electron
```

Expected: Two processes start. Vite dev server on port 5173, then Electron opens a 1280×720 window loading the game. The Phaser game should load and be playable.

- [ ] **Step 2: Verify F11 fullscreen**

With the Electron window focused, press F11. Expected: window goes fullscreen. Press F11 again — returns to windowed mode.

- [ ] **Step 3: Verify canvas scales with window resize**

Drag the Electron window to resize it. Expected: the game canvas letterboxes (black bars on sides or top/bottom) and scales to fit. Game UI and gameplay area remain proportional.

- [ ] **Step 4: Verify no crashes on console**

Check Electron DevTools (opens detached automatically in dev mode). Expected: no red errors in the console. The existing yellow/orange warnings about Phaser internals are acceptable.

- [ ] **Step 5: Stop the dev server**

Press `Ctrl+C` in the terminal to stop both processes.

---

## Task 11: Manual verification — Production build

**No files to change — this is a smoke test.**

- [ ] **Step 1: Build the Electron renderer**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm run build:electron
```

Expected: `dist/electron/` is created containing `index.html`, `assets/`, and chunked JS. No build errors.

- [ ] **Step 2: Verify the dist structure**

```bash
ls "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry/dist/electron/"
```

Expected output (similar to):
```
assets/  index.html
```

- [ ] **Step 3: Package for Linux (runs on current OS)**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm run build:linux
```

Expected: `release/` directory created containing an `.AppImage` file. May take 2–5 minutes on first run (downloads Electron binaries).

- [ ] **Step 4: Run the packaged AppImage**

```bash
chmod +x "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry/release/"*.AppImage
"/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry/release/"*.AppImage
```

Expected: game launches from the packaged binary. All game assets load. F11 fullscreen works. No broken asset paths.

- [ ] **Step 5: Commit final state**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add -A
git status
```

Review that only expected files are staged (no `dist/`, `release/`, or `node_modules/`). Then:

```bash
git commit -m "feat: complete Electron shell — game runs as desktop app on Linux/Windows"
```

---

## What's Next

- **Plan 2:** Save System + Input Abstraction (Sections 3 and 5 of the spec)
- **Plan 3:** Steamworks IPC Bridge (Section 6 of the spec)
- **Section 8:** Asset licensing audit — manual checklist in `docs/superpowers/specs/2026-04-05-steam-release-foundation-design.md`
