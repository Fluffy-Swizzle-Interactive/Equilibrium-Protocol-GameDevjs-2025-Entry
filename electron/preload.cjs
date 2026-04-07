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

contextBridge.exposeInMainWorld('steamAPI', {
  init:             () => ipcRenderer.invoke('steam:init'),
  isAvailable:      () => ipcRenderer.invoke('steam:is-available'),
  getPlayerName:    () => ipcRenderer.invoke('steam:get-player-name'),
  getSteamId:       () => ipcRenderer.invoke('steam:get-steam-id'),
  getPlayerLevel:   () => ipcRenderer.invoke('steam:get-player-level'),
  unlockAchievement:(achievementId) => ipcRenderer.invoke('steam:unlock-achievement', achievementId),
  getAchievement:   (achievementId) => ipcRenderer.invoke('steam:get-achievement', achievementId),
  submitScore:      (leaderboardName, score) => ipcRenderer.invoke('steam:submit-score', { leaderboardName, score }),
  getLeaderboard:   (leaderboardName, count = 10) => ipcRenderer.invoke('steam:get-leaderboard', { leaderboardName, count }),
  cloudIsEnabled:   () => ipcRenderer.invoke('steam:cloud-is-enabled'),
  cloudWrite:       (filename, data) => ipcRenderer.invoke('steam:cloud-write', { filename, data }),
  cloudRead:        (filename) => ipcRenderer.invoke('steam:cloud-read', filename),
  activateOverlay:  (page = 'Achievements') => ipcRenderer.invoke('steam:activate-overlay', page),
})
