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
