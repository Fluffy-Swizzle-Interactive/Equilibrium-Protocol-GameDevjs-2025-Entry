'use strict'

const { ipcMain } = require('electron')

// steamworks.js wraps the Steamworks C SDK. It must be initialized in the
// main process (Node.js). If Steam is not running, init() throws — we catch
// and degrade gracefully so the game still works without Steam.

let steamworks = null
let steamClient = null

function initSteam() {
  try {
    steamworks = require('steamworks.js')
    const appId = parseInt(process.env.STEAM_APP_ID || require('fs').readFileSync(
      require('path').join(process.cwd(), 'steam_appid.txt'), 'utf8'
    ).trim())
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

/** @returns {{success: false, error: string}} */
function notAvailable() {
  return { success: false, error: 'Steam not available' }
}

/**
 * Wrap a synchronous Steam call in a try/catch.
 * @param {() => any} fn
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

function registerSteamHandlers() {
  ipcMain.handle('steam:init', () => {
    const ok = initSteam()
    return { success: ok }
  })

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
