'use strict'

const { contextBridge, ipcRenderer } = require('electron')

/**
 * @typedef {Object} ElectronAPI
 * @property {() => Promise<boolean>} toggleFullscreen
 * @property {() => Promise<boolean>} isFullscreen
 * @property {string} platform
 */

/**
 * @typedef {{success: boolean, data?: any, error?: string}} SteamResult
 * Standard response envelope returned by every steamAPI method.
 * - success: true on success, false on failure or when Steam is unavailable
 * - data: present on success, contains the return value of the Steam call
 * - error: present on failure, human-readable reason string
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
  /** @returns {Promise<SteamResult>} success:true once Steam is initialised */
  init:             () => ipcRenderer.invoke('steam:init'),

  /** @returns {Promise<SteamResult<boolean>>} data:true if Steam client is available */
  isAvailable:      () => ipcRenderer.invoke('steam:is-available'),

  /** @returns {Promise<SteamResult<string>>} data: display name of the local player */
  getPlayerName:    () => ipcRenderer.invoke('steam:get-player-name'),

  /** @returns {Promise<SteamResult<string>>} data: SteamID64 as a decimal string */
  getSteamId:       () => ipcRenderer.invoke('steam:get-steam-id'),

  /** @returns {Promise<SteamResult<number>>} data: Steam level of the local player */
  getPlayerLevel:   () => ipcRenderer.invoke('steam:get-player-level'),

  /**
   * @param {string} achievementId  Steam API name of the achievement (e.g. 'ACH_WIN_10')
   * @returns {Promise<SteamResult<true>>}
   */
  unlockAchievement:(achievementId) => ipcRenderer.invoke('steam:unlock-achievement', achievementId),

  /**
   * @param {string} achievementId
   * @returns {Promise<SteamResult<boolean>>} data:true if the achievement is already unlocked
   */
  getAchievement:   (achievementId) => ipcRenderer.invoke('steam:get-achievement', achievementId),

  /**
   * @param {string} leaderboardName
   * @param {number} score
   * @returns {Promise<SteamResult<true>>}
   */
  submitScore:      (leaderboardName, score) => ipcRenderer.invoke('steam:submit-score', { leaderboardName, score }),

  /**
   * @param {string} leaderboardName
   * @param {number} [count=10]  Number of top entries to fetch
   * @returns {Promise<SteamResult<Object[]>>} data: array of leaderboard entry objects
   */
  getLeaderboard:   (leaderboardName, count = 10) => ipcRenderer.invoke('steam:get-leaderboard', { leaderboardName, count }),

  /** @returns {Promise<SteamResult<boolean>>} data:true if Steam Cloud is enabled for this app */
  cloudIsEnabled:   () => ipcRenderer.invoke('steam:cloud-is-enabled'),

  /**
   * @param {string} filename  Cloud filename (relative, no path separators)
   * @param {Object} data      JSON-serialisable payload
   * @returns {Promise<SteamResult<true>>}
   */
  cloudWrite:       (filename, data) => ipcRenderer.invoke('steam:cloud-write', { filename, data }),

  /**
   * @param {string} filename
   * @returns {Promise<SteamResult<Object|null>>} data: parsed JSON object, or null if file not found
   */
  cloudRead:        (filename) => ipcRenderer.invoke('steam:cloud-read', filename),

  /**
   * @param {string} [page='Achievements']  Overlay page name (e.g. 'Achievements', 'Community')
   * @returns {Promise<SteamResult<true>>}
   */
  activateOverlay:  (page = 'Achievements') => ipcRenderer.invoke('steam:activate-overlay', page),
})
