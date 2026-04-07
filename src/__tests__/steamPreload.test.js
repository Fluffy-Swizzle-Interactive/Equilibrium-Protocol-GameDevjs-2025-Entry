// Simulate what contextBridge.exposeInMainWorld puts on window.
// We construct a mock steamAPI with the same method names as preload.cjs.
const mockIpcRenderer = {
  invoke: vi.fn().mockResolvedValue({ success: true }),
}

const steamAPI = {
  init:             () => mockIpcRenderer.invoke('steam:init'),
  isAvailable:      () => mockIpcRenderer.invoke('steam:is-available'),
  getPlayerName:    () => mockIpcRenderer.invoke('steam:get-player-name'),
  getSteamId:       () => mockIpcRenderer.invoke('steam:get-steam-id'),
  getPlayerLevel:   () => mockIpcRenderer.invoke('steam:get-player-level'),
  unlockAchievement:(id) => mockIpcRenderer.invoke('steam:unlock-achievement', id),
  getAchievement:   (id) => mockIpcRenderer.invoke('steam:get-achievement', id),
  submitScore:      (name, score) => mockIpcRenderer.invoke('steam:submit-score', { leaderboardName: name, score }),
  getLeaderboard:   (name, count) => mockIpcRenderer.invoke('steam:get-leaderboard', { leaderboardName: name, count }),
  cloudIsEnabled:   () => mockIpcRenderer.invoke('steam:cloud-is-enabled'),
  cloudWrite:       (file, data) => mockIpcRenderer.invoke('steam:cloud-write', { filename: file, data }),
  cloudRead:        (file) => mockIpcRenderer.invoke('steam:cloud-read', file),
  activateOverlay:  (page) => mockIpcRenderer.invoke('steam:activate-overlay', page),
}

const EXPECTED_METHODS = [
  'init', 'isAvailable', 'getPlayerName', 'getSteamId', 'getPlayerLevel',
  'unlockAchievement', 'getAchievement', 'submitScore', 'getLeaderboard',
  'cloudIsEnabled', 'cloudWrite', 'cloudRead', 'activateOverlay',
]

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
    await steamAPI.unlockAchievement('ACH_WAVE_10')
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
      'steam:unlock-achievement', 'ACH_WAVE_10'
    )
  })

  it('passes leaderboard name and score to submit-score channel', async () => {
    await steamAPI.submitScore('HighScore', 9000)
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
      'steam:submit-score', { leaderboardName: 'HighScore', score: 9000 }
    )
  })
})
