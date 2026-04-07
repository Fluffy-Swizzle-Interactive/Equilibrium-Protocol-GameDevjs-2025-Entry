import { SaveManager } from '../game/managers/SaveManager'

describe('SaveManager', () => {
  afterEach(() => {
    window.localStorage.clear()
    delete window.electronAPI
  })

  describe('defaultSettings', () => {
    it('returns the expected shape', () => {
      const s = SaveManager.defaultSettings()
      expect(s).toHaveProperty('musicVolume')
      expect(s).toHaveProperty('sfxVolume')
      expect(s).toHaveProperty('fullscreen')
      expect(typeof s.musicVolume).toBe('number')
    })
  })

  describe('loadSettings (localStorage fallback)', () => {
    it('returns defaults when no saved data exists', async () => {
      const settings = await SaveManager.loadSettings()
      expect(settings).toEqual(SaveManager.defaultSettings())
    })

    it('merges saved data with defaults', async () => {
      window.localStorage.setItem('eq_settings', JSON.stringify({ musicVolume: 0.08 }))
      const settings = await SaveManager.loadSettings()
      expect(settings.musicVolume).toBe(0.08)
      expect(settings.sfxVolume).toBe(SaveManager.defaultSettings().sfxVolume)
    })
  })

  describe('saveSettings (localStorage fallback)', () => {
    it('writes settings to localStorage', async () => {
      await SaveManager.saveSettings({ musicVolume: 0.03, sfxVolume: 0.07, fullscreen: true })
      const raw = window.localStorage.getItem('eq_settings')
      expect(JSON.parse(raw).musicVolume).toBe(0.03)
    })
  })

  describe('loadSettings (Electron path)', () => {
    it('calls electronAPI.loadData with the settings key', async () => {
      window.electronAPI = {
        loadData: vi.fn().mockResolvedValue({ success: true, data: { musicVolume: 0.1 } })
      }
      const settings = await SaveManager.loadSettings()
      expect(window.electronAPI.loadData).toHaveBeenCalledWith('settings')
      expect(settings.musicVolume).toBe(0.1)
    })

    it('returns defaults when electronAPI returns success:false', async () => {
      window.electronAPI = {
        loadData: vi.fn().mockResolvedValue({ success: false, error: 'disk error' })
      }
      const settings = await SaveManager.loadSettings()
      expect(settings).toEqual(SaveManager.defaultSettings())
    })
  })
})
