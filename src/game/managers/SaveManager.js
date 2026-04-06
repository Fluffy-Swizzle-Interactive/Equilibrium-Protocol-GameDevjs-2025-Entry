/**
 * @typedef {Object} SettingsData
 * @property {number} musicVolume   - 0 to 0.1
 * @property {number} sfxVolume     - 0 to 0.1
 * @property {boolean} fullscreen
 */

/**
 * @typedef {Object} GameStateData
 * @property {number} highestWave
 * @property {number} totalKills
 */

/**
 * Persistent save/settings storage.
 * Uses Electron IPC on desktop, localStorage on web.
 * All methods are static and async.
 */
export class SaveManager {
  /** @returns {SettingsData} */
  static defaultSettings() {
    return { musicVolume: 0.05, sfxVolume: 0.07, fullscreen: false }
  }

  /** @returns {GameStateData} */
  static defaultGameState() {
    return { highestWave: 0, totalKills: 0 }
  }

  /** @returns {Promise<SettingsData>} */
  static async loadSettings() {
    return SaveManager._load('settings', SaveManager.defaultSettings())
  }

  /** @param {SettingsData} settings @returns {Promise<void>} */
  static async saveSettings(settings) {
    return SaveManager._save('settings', settings)
  }

  /** @returns {Promise<GameStateData>} */
  static async loadGameState() {
    return SaveManager._load('gameState', SaveManager.defaultGameState())
  }

  /** @param {GameStateData} state @returns {Promise<void>} */
  static async saveGameState(state) {
    return SaveManager._save('gameState', state)
  }

  static async _load(key, defaults) {
    try {
      if (window.electronAPI?.loadData) {
        const result = await window.electronAPI.loadData(key)
        if (result.success && result.data) {
          return { ...defaults, ...result.data }
        }
      } else {
        const raw = window.localStorage.getItem(`eq_${key}`)
        if (raw) return { ...defaults, ...JSON.parse(raw) }
      }
    } catch (e) {
      console.warn(`[SaveManager] Load failed for "${key}", using defaults:`, e.message)
    }
    return { ...defaults }
  }

  static async _save(key, data) {
    try {
      if (window.electronAPI?.saveData) {
        await window.electronAPI.saveData(key, data)
      } else {
        window.localStorage.setItem(`eq_${key}`, JSON.stringify(data))
      }
    } catch (e) {
      console.warn(`[SaveManager] Save failed for "${key}":`, e.message)
    }
  }
}
