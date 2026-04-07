'use strict'

const { ipcMain, app } = require('electron')
const fs = require('fs')
const path = require('path')

// steamworks.js wraps the Steamworks C SDK. It must be initialized in the
// main process (Node.js). If Steam is not running, init() throws — we catch
// and degrade gracefully so the game still works without Steam.

let steamworks = null
let steamClient = null

/**
 * Resolve the path to steam_appid.txt.
 * In packaged builds, extraFiles places it next to the executable.
 * In dev, it sits in the project root (process.cwd()).
 */
function getSteamAppIdPath() {
  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), 'steam_appid.txt')
  }
  return path.join(process.cwd(), 'steam_appid.txt')
}

/**
 * Initialize the Steamworks SDK. Idempotent — returns true immediately if
 * already initialized, so calling it from both startup and the steam:init
 * IPC handler is safe.
 * @returns {boolean}
 */
function initSteam() {
  if (steamClient) return true  // Already initialized
  try {
    steamworks = require('steamworks.js')
    const appId = parseInt(
      process.env.STEAM_APP_ID ||
      fs.readFileSync(getSteamAppIdPath(), 'utf8').trim()
    )
    steamClient = steamworks.init(appId)
    console.log('[Steam] Initialized. Player:', steamClient.localplayer.getName())
    return true
  } catch (e) {
    console.warn('[Steam] Not available:', e.message)
    steamworks = null
    steamClient = null
    return false
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Standard failure response when Steam is not available.
 * @returns {{success: false, error: string}}
 */
function notAvailable() {
  return { success: false, error: 'Steam not available' }
}

/**
 * Wrap a synchronous Steam call in a try/catch.
 * @param {() => any} fn
 * @returns {{success: boolean, data?: any, error?: string}}
 */
function steamCall(fn) {
  if (!steamClient) return notAvailable()
  try {
    const data = fn()
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

/**
 * Wrap an async Steam call in a try/catch.
 * @param {() => Promise<any>} fn
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function steamCallAsync(fn) {
  if (!steamClient) return notAvailable()
  try {
    const data = await fn()
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────

function registerSteamHandlers() {
  // Returns { success: true } if Steam initialised, { success: false, error } if not.
  ipcMain.handle('steam:init', () => {
    const ok = initSteam()
    return ok ? { success: true } : { success: false, error: 'Steam not available' }
  })

  // Returns { success: true, data: boolean } — never fails, reports availability.
  ipcMain.handle('steam:is-available', () => {
    return { success: true, data: steamClient !== null }
  })

  ipcMain.handle('steam:get-player-name', () =>
    steamCall(() => steamClient.localplayer.getName())
  )

  ipcMain.handle('steam:get-steam-id', () =>
    steamCall(() => steamClient.localplayer.getSteamId().toString())
  )

  ipcMain.handle('steam:get-player-level', () =>
    steamCall(() => steamClient.localplayer.getLevel())
  )

  ipcMain.handle('steam:unlock-achievement', (_, achievementId) =>
    steamCall(() => {
      steamClient.achievement.activate(achievementId)
      return true
    })
  )

  ipcMain.handle('steam:get-achievement', (_, achievementId) =>
    steamCall(() => steamClient.achievement.isActivated(achievementId))
  )

  ipcMain.handle('steam:submit-score', async (_, { leaderboardName, score }) =>
    steamCallAsync(async () => {
      const board = await steamClient.leaderboard.findOrCreate(
        leaderboardName,
        steamworks.LeaderboardSortMethod.Descending,
        steamworks.LeaderboardDisplayType.Numeric
      )
      await board.uploadScore(score, steamworks.LeaderboardUploadScoreMethod.KeepBest)
      return true
    })
  )

  ipcMain.handle('steam:get-leaderboard', async (_, { leaderboardName, count = 10 }) =>
    steamCallAsync(async () => {
      const board = await steamClient.leaderboard.findOrCreate(
        leaderboardName,
        steamworks.LeaderboardSortMethod.Descending,
        steamworks.LeaderboardDisplayType.Numeric
      )
      return board.downloadScores(
        steamworks.LeaderboardDataRequest.Global, 1, count
      )
    })
  )

  ipcMain.handle('steam:cloud-is-enabled', () =>
    steamCall(() => steamClient.cloud.isEnabled())
  )

  ipcMain.handle('steam:cloud-write', (_, { filename, data }) =>
    steamCall(() => {
      steamClient.cloud.writeFile(filename, Buffer.from(JSON.stringify(data)))
      return true
    })
  )

  ipcMain.handle('steam:cloud-read', (_, filename) =>
    steamCall(() => {
      const buffer = steamClient.cloud.readFile(filename)
      if (!buffer) return null
      return JSON.parse(buffer.toString('utf8'))
    })
  )

  ipcMain.handle('steam:activate-overlay', (_, page = 'Achievements') =>
    steamCall(() => {
      steamClient.overlay.activateGameOverlay(page)
      return true
    })
  )
}

module.exports = { registerSteamHandlers, initSteam }
