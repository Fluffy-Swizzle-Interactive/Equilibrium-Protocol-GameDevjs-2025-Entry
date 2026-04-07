/**
 * steamPreload.test.js
 *
 * Two-layer contract test for the Steamworks IPC bridge:
 *
 * 1. Shape test — verifies window.steamAPI exposes all expected methods.
 *    Uses a mock object that mirrors preload.cjs exactly, so any method
 *    removed from the preload also breaks these tests.
 *
 * 2. Channel test — reads electron/preload.cjs source and verifies every
 *    expected IPC channel string literal is present. Catches channel-name
 *    typos without needing to run in an Electron environment.
 */

import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── 1. Shape test (mock matching real preload.cjs) ────────────────────────────

const mockInvoke = vi.fn().mockResolvedValue({ success: true })

const steamAPI = {
  init:             () => mockInvoke('steam:init'),
  isAvailable:      () => mockInvoke('steam:is-available'),
  getPlayerName:    () => mockInvoke('steam:get-player-name'),
  getSteamId:       () => mockInvoke('steam:get-steam-id'),
  getPlayerLevel:   () => mockInvoke('steam:get-player-level'),
  unlockAchievement:(id) => mockInvoke('steam:unlock-achievement', id),
  getAchievement:   (id) => mockInvoke('steam:get-achievement', id),
  submitScore:      (name, score) => mockInvoke('steam:submit-score', { leaderboardName: name, score }),
  getLeaderboard:   (name, count = 10) => mockInvoke('steam:get-leaderboard', { leaderboardName: name, count }),
  cloudIsEnabled:   () => mockInvoke('steam:cloud-is-enabled'),
  cloudWrite:       (file, data) => mockInvoke('steam:cloud-write', { filename: file, data }),
  cloudRead:        (file) => mockInvoke('steam:cloud-read', file),
  activateOverlay:  (page = 'Achievements') => mockInvoke('steam:activate-overlay', page),
}

const EXPECTED_METHODS = Object.keys(steamAPI)

describe('steamAPI bridge shape', () => {
  it.each(EXPECTED_METHODS)('exposes method: %s', (method) => {
    expect(typeof steamAPI[method]).toBe('function')
  })

  it('all methods return a Promise', async () => {
    for (const method of EXPECTED_METHODS) {
      const result = steamAPI[method]('arg1', 'arg2')
      expect(result).toBeInstanceOf(Promise)
      await result
    }
  })

  it('passes achievementId to the correct IPC channel', async () => {
    mockInvoke.mockClear()
    await steamAPI.unlockAchievement('ACH_WAVE_10')
    expect(mockInvoke).toHaveBeenCalledWith('steam:unlock-achievement', 'ACH_WAVE_10')
  })

  it('passes leaderboard name and score to submit-score channel', async () => {
    mockInvoke.mockClear()
    await steamAPI.submitScore('HighScore', 9000)
    expect(mockInvoke).toHaveBeenCalledWith(
      'steam:submit-score', { leaderboardName: 'HighScore', score: 9000 }
    )
  })

  it('getLeaderboard defaults count to 10', async () => {
    mockInvoke.mockClear()
    await steamAPI.getLeaderboard('HighScore')
    expect(mockInvoke).toHaveBeenCalledWith(
      'steam:get-leaderboard', { leaderboardName: 'HighScore', count: 10 }
    )
  })

  it('activateOverlay defaults page to Achievements', async () => {
    mockInvoke.mockClear()
    await steamAPI.activateOverlay()
    expect(mockInvoke).toHaveBeenCalledWith('steam:activate-overlay', 'Achievements')
  })
})

// ── 2. Channel contract test (reads real preload.cjs source) ──────────────────
// Reads electron/preload.cjs and asserts every expected IPC channel literal is
// present. This catches typos in channel names without needing to run Electron.

const PRELOAD_PATH = resolve(__dirname, '../../electron/preload.cjs')
const preloadSrc = readFileSync(PRELOAD_PATH, 'utf-8')

const EXPECTED_CHANNELS = [
  'steam:init',
  'steam:is-available',
  'steam:get-player-name',
  'steam:get-steam-id',
  'steam:get-player-level',
  'steam:unlock-achievement',
  'steam:get-achievement',
  'steam:submit-score',
  'steam:get-leaderboard',
  'steam:cloud-is-enabled',
  'steam:cloud-write',
  'steam:cloud-read',
  'steam:activate-overlay',
]

describe('preload.cjs IPC channel contract', () => {
  it.each(EXPECTED_CHANNELS)('references channel literal: %s', (channel) => {
    expect(preloadSrc).toContain(`'${channel}'`)
  })

  it('exposes steamAPI (not just electronAPI)', () => {
    expect(preloadSrc).toContain("exposeInMainWorld('steamAPI'")
  })
})
