'use strict'

const { registerSteamHandlers, initSteam } = require('./steam.cjs')

const { ipcMain, app } = require('electron')
const path = require('path')
const fs = require('fs')

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

  // --- Data persistence ---
  const ALLOWED_SAVE_KEYS = new Set(['settings', 'gameState'])

  ipcMain.handle('data:save', (_, key, data) => {
    if (!ALLOWED_SAVE_KEYS.has(key)) {
      return { success: false, error: `Unknown save key: ${key}` }
    }
    try {
      const filePath = path.join(app.getPath('userData'), `${key}.json`)
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('data:load', (_, key) => {
    if (!ALLOWED_SAVE_KEYS.has(key)) {
      return { success: false, error: `Unknown save key: ${key}` }
    }
    try {
      const filePath = path.join(app.getPath('userData'), `${key}.json`)
      if (!fs.existsSync(filePath)) return { success: true, data: null }
      const raw = fs.readFileSync(filePath, 'utf8')
      return { success: true, data: JSON.parse(raw) }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  // Register all Steamworks IPC routes
  registerSteamHandlers()
  // Attempt Steam init immediately (non-blocking — fails gracefully if Steam not running)
  initSteam()
}

module.exports = { registerIpcHandlers }
