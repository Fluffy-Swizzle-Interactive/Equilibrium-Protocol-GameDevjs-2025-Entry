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

  /** @param {string} key @param {Object} data @returns {Promise<{success: boolean, error?: string}>} */
  saveData: (key, data) => ipcRenderer.invoke('data:save', key, data),

  /** @param {string} key @returns {Promise<{success: boolean, data: Object|null, error?: string}>} */
  loadData: (key) => ipcRenderer.invoke('data:load', key),
})
