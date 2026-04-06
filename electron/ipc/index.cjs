'use strict'

const { ipcMain } = require('electron')

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
