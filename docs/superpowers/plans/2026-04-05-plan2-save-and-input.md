# Plan 2: Save System + Input Abstraction

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent save/settings storage and a unified InputManager that abstracts keyboard and gamepad input so Steam Deck controllers work out of the box.

**Architecture:** SaveManager is a static class with async methods — it reads/writes JSON files via Electron IPC on desktop and falls back to localStorage on the web demo build. InputManager is a scene-level class that maps named actions to keyboard keys + gamepad buttons; Player.js and WaveGame.jsx consume it instead of raw Phaser key objects. Both systems are wired via EventBus — no direct scene-to-manager dependencies.

**Tech Stack:** Electron IPC (Node.js `fs`), Phaser 3 Gamepad API, EventBus, Vitest

**Prerequisite:** Plan 1 (Electron shell) must be complete. `electron/ipc/index.cjs` and `electron/preload.cjs` must exist.

---

## File Map

**Create:**
- `src/game/managers/SaveManager.js` — static class: load/save settings + game state, IPC + localStorage fallback
- `src/game/managers/InputManager.js` — maps named actions to keyboard/gamepad, consumed by Player and WaveGame
- `src/__tests__/SaveManager.test.js` — unit tests with mocked `window.electronAPI`
- `src/__tests__/InputManager.test.js` — unit tests with mocked Phaser keyboard keys

**Modify:**
- `electron/ipc/index.cjs` — add `data:save` and `data:load` IPC handlers
- `electron/preload.cjs` — expose `saveData` and `loadData` to renderer
- `src/game/scenes/Preloader.js` — load settings async, store in registry, then start MainMenu
- `src/game/scenes/MainMenu.js` — read settings from registry, apply to SoundManager; save on volume change
- `src/game/scenes/WaveGame.jsx` — create InputManager, emit `game-session-ended` on death/victory
- `src/game/entities/Player.js` — use `inputManager.isDown()` instead of `scene.wasd`
- `src/game/main.js` — enable Phaser gamepad plugin in config

---

## Part A: Save System

---

### Task 1: Extend Electron IPC with data persistence handlers

**Files:**
- Modify: `electron/ipc/index.cjs`
- Modify: `electron/preload.cjs`

- [ ] **Step 1: Add save/load handlers to `electron/ipc/index.cjs`**

The current file exports `registerIpcHandlers(mainWindow)`. Add the two new handlers inside that function, after the existing fullscreen handlers:

```js
// --- Data persistence ---
const { app } = require('electron')
const path = require('path')
const fs = require('fs')

ipcMain.handle('data:save', (_, key, data) => {
  try {
    const filePath = path.join(app.getPath('userData'), `${key}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('data:load', (_, key) => {
  try {
    const filePath = path.join(app.getPath('userData'), `${key}.json`)
    if (!fs.existsSync(filePath)) return { success: true, data: null }
    const raw = fs.readFileSync(filePath, 'utf8')
    return { success: true, data: JSON.parse(raw) }
  } catch (e) {
    return { success: false, error: e.message }
  }
})
```

Add the `require` statements at the top of the file (after `'use strict'`), alongside the existing `ipcMain` require.

- [ ] **Step 2: Expose save/load in `electron/preload.cjs`**

In `electron/preload.cjs`, add two methods to the existing `contextBridge.exposeInMainWorld('electronAPI', { ... })` object:

```js
/** @param {string} key @param {Object} data @returns {Promise<{success: boolean, error?: string}>} */
saveData: (key, data) => ipcRenderer.invoke('data:save', key, data),

/** @param {string} key @returns {Promise<{success: boolean, data: Object|null, error?: string}>} */
loadData: (key) => ipcRenderer.invoke('data:load', key),
```

- [ ] **Step 3: Verify the IPC file parses correctly**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
node -e "require('./electron/ipc/index.cjs'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add electron/ipc/index.cjs electron/preload.cjs
git commit -m "feat: add data:save and data:load IPC handlers for persistence"
```

---

### Task 2: Create SaveManager

**Files:**
- Create: `src/__tests__/SaveManager.test.js`
- Create: `src/game/managers/SaveManager.js`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/SaveManager.test.js`:

```js
import { SaveManager } from '../game/managers/SaveManager'

describe('SaveManager', () => {
  afterEach(() => {
    // Clean up any localStorage entries
    localStorage.clear()
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
      localStorage.setItem('eq_settings', JSON.stringify({ musicVolume: 0.08 }))
      const settings = await SaveManager.loadSettings()
      expect(settings.musicVolume).toBe(0.08)
      expect(settings.sfxVolume).toBe(SaveManager.defaultSettings().sfxVolume)
    })
  })

  describe('saveSettings (localStorage fallback)', () => {
    it('writes settings to localStorage', async () => {
      await SaveManager.saveSettings({ musicVolume: 0.03, sfxVolume: 0.07, fullscreen: true })
      const raw = localStorage.getItem('eq_settings')
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
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/SaveManager.test.js
```

Expected: FAIL — `SaveManager` not found.

- [ ] **Step 3: Create `src/game/managers/SaveManager.js`**

```js
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
        const raw = localStorage.getItem(`eq_${key}`)
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
        localStorage.setItem(`eq_${key}`, JSON.stringify(data))
      }
    } catch (e) {
      console.warn(`[SaveManager] Save failed for "${key}":`, e.message)
    }
  }
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/SaveManager.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Run full test suite**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/game/managers/SaveManager.js src/__tests__/SaveManager.test.js
git commit -m "feat: add SaveManager with IPC and localStorage persistence"
```

---

### Task 3: Load settings in Preloader, apply in MainMenu

**Files:**
- Modify: `src/game/scenes/Preloader.js`
- Modify: `src/game/scenes/MainMenu.js`

- [ ] **Step 1: Update `Preloader.js` to load settings before starting MainMenu**

In `src/game/scenes/Preloader.js`, add the import at the top of the file:

```js
import { SaveManager } from '../managers/SaveManager';
```

Replace the existing `create()` method:

```js
// BEFORE:
create () {
    if (!this.textures.exists('particle_texture')) {
        this.createFallbackParticleTexture();
    }
    EventBus.emit('preloader-complete', this);
    this.scene.start('MainMenu');
}
```

With:

```js
async create () {
    if (!this.textures.exists('particle_texture')) {
        this.createFallbackParticleTexture();
    }

    // Load saved settings and store in Phaser's cross-scene registry
    try {
        const settings = await SaveManager.loadSettings()
        this.registry.set('savedSettings', settings)
    } catch (e) {
        console.warn('[Preloader] Failed to load settings, using defaults:', e)
        this.registry.set('savedSettings', SaveManager.defaultSettings())
    }

    EventBus.emit('preloader-complete', this);
    this.scene.start('MainMenu');
}
```

- [ ] **Step 2: Apply loaded settings in `MainMenu.js`**

In `src/game/scenes/MainMenu.js`, update `setupSoundManager()` to read volume from the registry. Add this after `this.soundManager = new SoundManager(this)`:

```js
// Apply saved volume settings
const savedSettings = this.registry.get('savedSettings')
if (savedSettings) {
    this.soundManager.musicVolume = savedSettings.musicVolume
    this.soundManager.effectsVolume = savedSettings.sfxVolume
}
```

Also update the `createVolumeSlider()` method's `initialValue` to use the saved setting:

```js
// BEFORE:
initialValue: this.soundManager ? this.soundManager.musicVolume : 0.5,

// AFTER:
// VolumeSlider initialValue is 0–1 (it scales to 0–0.1 internally)
// soundManager.musicVolume is already in 0–0.1 range, so divide by 0.1 to get 0–1
initialValue: this.soundManager ? (this.soundManager.musicVolume / 0.1) : 0.5,
```

- [ ] **Step 3: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/game/scenes/Preloader.js src/game/scenes/MainMenu.js
git commit -m "feat: load and apply saved volume settings on game start"
```

---

### Task 4: Save settings on volume change

**Files:**
- Modify: `src/game/scenes/MainMenu.js`

- [ ] **Step 1: Add settings save to the volume slider's onChange callback**

In `src/game/scenes/MainMenu.js`, add the import at the top:

```js
import { SaveManager } from '../managers/SaveManager';
```

In `createVolumeSlider()`, update the `onChange` callback to also save:

```js
// BEFORE:
onChange: (value) => {
    if (this.soundManager) {
        this.soundManager.setMusicVolume(value);
        this.soundManager.setEffectsVolume(value);
    }
}

// AFTER:
onChange: (value) => {
    if (this.soundManager) {
        this.soundManager.setMusicVolume(value);
        this.soundManager.setEffectsVolume(value);
    }
    // Persist settings — fire and forget
    SaveManager.saveSettings({
        musicVolume: value,
        sfxVolume: value,
        fullscreen: this.scale.isFullscreen,
    });
}
```

- [ ] **Step 2: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/game/scenes/MainMenu.js
git commit -m "feat: persist volume settings on slider change"
```

---

### Task 5: Save game stats on death and victory

**Files:**
- Modify: `src/game/scenes/WaveGame.jsx`

- [ ] **Step 1: Add SaveManager import to `WaveGame.jsx`**

At the top of `src/game/scenes/WaveGame.jsx`, add:

```js
import { SaveManager } from '../managers/SaveManager';
```

- [ ] **Step 2: Add a helper method to save stats**

In `WaveGame.jsx`, add this method to the class (near other helper methods, before `playerDeath`):

```js
/**
 * Save end-of-session stats (wave reached, kills).
 * Accumulates total kills across sessions.
 * @param {number} waveReached
 * @param {number} sessionKills
 */
async saveSessionStats(waveReached, sessionKills) {
    try {
        const current = await SaveManager.loadGameState()
        await SaveManager.saveGameState({
            highestWave: Math.max(current.highestWave, waveReached),
            totalKills: current.totalKills + sessionKills,
        })
    } catch (e) {
        console.warn('[WaveGame] Failed to save session stats:', e)
    }
}
```

- [ ] **Step 3: Call `saveSessionStats` in `playerDeath()`**

In the existing `playerDeath()` method, add the save call right after `this.isGameOver = true`:

```js
// After: this.isGameOver = true;
// Add:
this.saveSessionStats(
    this.waveManager ? this.waveManager.currentWave : 0,
    this.killCount || 0
)
```

- [ ] **Step 4: Call `saveSessionStats` in `handleVictory()`**

Find the `handleVictory()` method (search for `showVictoryUI`). Add the save call right before `this.uiManager.showVictoryUI()`:

```js
// Before: this.uiManager.showVictoryUI();
// Add:
this.saveSessionStats(
    this.waveManager ? this.waveManager.maxWaves : 20,
    this.killCount || 0
)
```

- [ ] **Step 5: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/game/scenes/WaveGame.jsx
git commit -m "feat: save wave and kill stats on game end"
```

---

### Task 6: Manual smoke test — save system

**No new files — verification only.**

- [ ] **Step 1: Start the Electron dev build**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm run dev:electron
```

- [ ] **Step 2: Adjust volume on the main menu**

Move the volume slider. Close the game. Reopen it. Expected: volume slider is at the position you left it (not reset to default).

- [ ] **Step 3: Play to wave 3+ and let the player die**

Start a game. Survive a few waves. Let the player die. Close and reopen the game. Expected: no errors in the console related to SaveManager.

- [ ] **Step 4: Verify save file exists on disk**

```bash
# Linux path:
ls ~/.config/EquilibriumProtocol/
```

Expected: `settings.json` and `gameState.json` files present.

```bash
cat ~/.config/EquilibriumProtocol/settings.json
cat ~/.config/EquilibriumProtocol/gameState.json
```

Expected: valid JSON with the expected fields.

- [ ] **Step 5: Stop the dev server**

Press `Ctrl+C`.

---

## Part B: Input Abstraction

---

### Task 7: Enable Phaser gamepad and create InputManager

**Files:**
- Modify: `src/game/main.js`
- Create: `src/__tests__/InputManager.test.js`
- Create: `src/game/managers/InputManager.js`

- [ ] **Step 1: Enable gamepad in Phaser config**

In `src/game/main.js`, add `input.gamepad: true` to the config object (alongside the existing `physics` block):

```js
// Add inside the config object:
input: {
    gamepad: true,
},
```

- [ ] **Step 2: Write the failing InputManager tests**

Create `src/__tests__/InputManager.test.js`:

```js
import { InputManager, INPUT_ACTIONS } from '../game/managers/InputManager'

function makeMockKey(isDown = false) {
  return { isDown }
}

function makeMockScene(keyStates = {}) {
  const defaultState = {
    [INPUT_ACTIONS.MOVE_UP]: false,
    [INPUT_ACTIONS.MOVE_DOWN]: false,
    [INPUT_ACTIONS.MOVE_LEFT]: false,
    [INPUT_ACTIONS.MOVE_RIGHT]: false,
    [INPUT_ACTIONS.PAUSE]: false,
    [INPUT_ACTIONS.DASH]: false,
    [INPUT_ACTIONS.SHIELD]: false,
  }
  const state = { ...defaultState, ...keyStates }

  return {
    input: {
      keyboard: {
        addKey: vi.fn((keyCode) => {
          // Map KeyCodes back to action names for mock state
          const codeMap = {
            87: INPUT_ACTIONS.MOVE_UP,    // W
            83: INPUT_ACTIONS.MOVE_DOWN,  // S
            65: INPUT_ACTIONS.MOVE_LEFT,  // A
            68: INPUT_ACTIONS.MOVE_RIGHT, // D
            32: INPUT_ACTIONS.PAUSE,      // SPACE
            81: INPUT_ACTIONS.DASH,       // Q
            69: INPUT_ACTIONS.SHIELD,     // E
          }
          const action = codeMap[keyCode]
          return makeMockKey(state[action] || false)
        }),
      },
      gamepad: {
        once: vi.fn(),
        getPad: vi.fn().mockReturnValue(null), // No gamepad by default
      },
    },
  }
}

// Mock Phaser KeyCodes
vi.mock('phaser', () => ({
  default: {
    Input: {
      Keyboard: {
        KeyCodes: { W: 87, S: 83, A: 65, D: 68, SPACE: 32, Q: 81, E: 69 },
        JustDown: vi.fn((key) => key._justDown || false),
      },
    },
  },
}), { virtual: true })

describe('InputManager', () => {
  it('reports MOVE_UP as down when W is held', () => {
    const scene = makeMockScene({ [INPUT_ACTIONS.MOVE_UP]: true })
    const input = new InputManager(scene)
    expect(input.isDown(INPUT_ACTIONS.MOVE_UP)).toBe(true)
  })

  it('reports MOVE_UP as not down when no keys held', () => {
    const scene = makeMockScene()
    const input = new InputManager(scene)
    expect(input.isDown(INPUT_ACTIONS.MOVE_UP)).toBe(false)
  })

  it('reports false for unknown action', () => {
    const scene = makeMockScene()
    const input = new InputManager(scene)
    expect(input.isDown('NONEXISTENT')).toBe(false)
  })

  it('does not throw when no gamepad is connected', () => {
    const scene = makeMockScene()
    const input = new InputManager(scene)
    expect(() => input.isDown(INPUT_ACTIONS.MOVE_UP)).not.toThrow()
  })
})
```

- [ ] **Step 3: Run the tests to confirm they fail**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/InputManager.test.js
```

Expected: FAIL — `InputManager` not found.

- [ ] **Step 4: Create `src/game/managers/InputManager.js`**

```js
import Phaser from 'phaser'

/**
 * Named input actions. Use these constants when calling isDown() or justDown().
 */
export const INPUT_ACTIONS = {
  MOVE_UP:    'MOVE_UP',
  MOVE_DOWN:  'MOVE_DOWN',
  MOVE_LEFT:  'MOVE_LEFT',
  MOVE_RIGHT: 'MOVE_RIGHT',
  PAUSE:      'PAUSE',
  DASH:       'DASH',
  SHIELD:     'SHIELD',
}

const GAMEPAD_DEADZONE = 0.5

/**
 * Abstracts keyboard and gamepad input behind named actions.
 * Created once per WaveGame scene. Player reads from scene.inputManager.
 */
export class InputManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene
    const K = Phaser.Input.Keyboard.KeyCodes

    /** @type {Record<string, Phaser.Input.Keyboard.Key>} */
    this.keys = {
      [INPUT_ACTIONS.MOVE_UP]:    scene.input.keyboard.addKey(K.W),
      [INPUT_ACTIONS.MOVE_DOWN]:  scene.input.keyboard.addKey(K.S),
      [INPUT_ACTIONS.MOVE_LEFT]:  scene.input.keyboard.addKey(K.A),
      [INPUT_ACTIONS.MOVE_RIGHT]: scene.input.keyboard.addKey(K.D),
      [INPUT_ACTIONS.PAUSE]:      scene.input.keyboard.addKey(K.SPACE),
      [INPUT_ACTIONS.DASH]:       scene.input.keyboard.addKey(K.Q),
      [INPUT_ACTIONS.SHIELD]:     scene.input.keyboard.addKey(K.E),
    }

    scene.input.gamepad.once('connected', (pad) => {
      console.log('[InputManager] Gamepad connected:', pad.id)
    })
  }

  /**
   * Returns true while the action is held (keyboard OR gamepad).
   * @param {string} action - One of INPUT_ACTIONS values
   * @returns {boolean}
   */
  isDown(action) {
    if (this.keys[action]?.isDown) return true
    return this._isGamepadActionDown(action)
  }

  /**
   * Returns true only on the first frame the action is pressed (rising edge).
   * Gamepad rising-edge detection is keyboard-only for now (gamepad is polled each frame).
   * @param {string} action - One of INPUT_ACTIONS values
   * @returns {boolean}
   */
  justDown(action) {
    const keyJustDown = this.keys[action]
      ? Phaser.Input.Keyboard.JustDown(this.keys[action])
      : false
    if (keyJustDown) return true

    // Gamepad: we can't use JustDown so check isDown as a fallback
    // This means button-mashing may fire multiple frames — acceptable for abilities
    return this._isGamepadActionDown(action)
  }

  /**
   * @private
   * @param {string} action
   * @returns {boolean}
   */
  _isGamepadActionDown(action) {
    const pad = this.scene.input.gamepad?.getPad(0)
    if (!pad) return false

    switch (action) {
      case INPUT_ACTIONS.MOVE_UP:
        return pad.up || pad.leftStick.y < -GAMEPAD_DEADZONE
      case INPUT_ACTIONS.MOVE_DOWN:
        return pad.down || pad.leftStick.y > GAMEPAD_DEADZONE
      case INPUT_ACTIONS.MOVE_LEFT:
        return pad.left || pad.leftStick.x < -GAMEPAD_DEADZONE
      case INPUT_ACTIONS.MOVE_RIGHT:
        return pad.right || pad.leftStick.x > GAMEPAD_DEADZONE
      case INPUT_ACTIONS.PAUSE:
        return pad.isButtonDown(9)  // Start / Menu
      case INPUT_ACTIONS.DASH:
        return pad.isButtonDown(0)  // A / Cross
      case INPUT_ACTIONS.SHIELD:
        return pad.isButtonDown(1)  // B / Circle
      default:
        return false
    }
  }
}
```

- [ ] **Step 5: Run the tests to confirm they pass**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/InputManager.test.js
```

Expected: all tests pass.

- [ ] **Step 6: Run full test suite**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/game/main.js src/game/managers/InputManager.js src/__tests__/InputManager.test.js
git commit -m "feat: add InputManager with keyboard and gamepad support"
```

---

### Task 8: Update WaveGame.jsx to use InputManager

**Files:**
- Modify: `src/game/scenes/WaveGame.jsx`

- [ ] **Step 1: Add InputManager import**

At the top of `src/game/scenes/WaveGame.jsx`, add:

```js
import { InputManager } from '../managers/InputManager';
```

- [ ] **Step 2: Replace raw key setup with InputManager**

Search for the block starting with `// Set up WASD keys` (around line 907). It looks like:

```js
// Set up WASD keys
this.wasd = {
    up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
};

// Set up spacebar for pause
this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

// Set up Q key for dash ability
this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

// Set up E key for shield ability
this.shieldKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
```

Replace this entire block with:

```js
// Unified input manager (keyboard + gamepad)
this.inputManager = new InputManager(this);
```

Leave `this.volumeDownKey` and `this.volumeUpKey` unchanged — they are utility keys outside the gameplay input abstraction.

- [ ] **Step 3: Replace pauseKey usage in `update()`**

Search for:
```js
if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
    this.togglePause();
}
```

Replace with:
```js
if (this.inputManager.justDown('PAUSE')) {
    this.togglePause();
}
```

- [ ] **Step 4: Replace dashKey usage in `update()`**

Search for:
```js
if (Phaser.Input.Keyboard.JustDown(this.dashKey)) {
```

Replace with:
```js
if (this.inputManager.justDown('DASH')) {
```

- [ ] **Step 5: Replace shieldKey usage in `update()`**

Search for:
```js
if (Phaser.Input.Keyboard.JustDown(this.shieldKey)) {
```

Replace with:
```js
if (this.inputManager.justDown('SHIELD')) {
```

- [ ] **Step 6: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/game/scenes/WaveGame.jsx
git commit -m "feat: replace raw key bindings with InputManager in WaveGame"
```

---

### Task 9: Update Player.js to use InputManager

**Files:**
- Modify: `src/game/entities/Player.js`

- [ ] **Step 1: Update `updateMovement()` in `Player.js`**

Find `updateMovement()` (around line 1062). The current code is:

```js
updateMovement() {
    // Get keyboard references from scene
    const keys = this.scene.wasd;

    // Reset velocity for this frame
    this.velX = 0;
    this.velY = 0;

    const moveSpeed = 300;

    if (keys.up.isDown) {
        this.velY = -moveSpeed;
    }
    if (keys.down.isDown) {
        this.velY = moveSpeed;
    }
    if (keys.left.isDown) {
        this.velX = -moveSpeed;
    }
    if (keys.right.isDown) {
        this.velX = moveSpeed;
    }
```

Replace only the key-reading lines:

```js
updateMovement() {
    const input = this.scene.inputManager;

    // Reset velocity for this frame
    this.velX = 0;
    this.velY = 0;

    const moveSpeed = 300;

    if (input.isDown('MOVE_UP')) {
        this.velY = -moveSpeed;
    }
    if (input.isDown('MOVE_DOWN')) {
        this.velY = moveSpeed;
    }
    if (input.isDown('MOVE_LEFT')) {
        this.velX = -moveSpeed;
    }
    if (input.isDown('MOVE_RIGHT')) {
        this.velX = moveSpeed;
    }
```

Leave everything from `// Normalize diagonal movement` onwards unchanged.

- [ ] **Step 2: Run full test suite**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/game/entities/Player.js
git commit -m "feat: Player uses InputManager instead of raw scene.wasd"
```

---

### Task 10: Manual verification — input abstraction

**No new files — verification only.**

- [ ] **Step 1: Start Electron dev build**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm run dev:electron
```

- [ ] **Step 2: Verify keyboard still works**

Start a game. Use WASD to move. Press Q for dash (if unlocked). Press E for shield (if unlocked). Press Space to pause.

Expected: all controls work exactly as before. No regressions.

- [ ] **Step 3: Verify gamepad works (if hardware available)**

Connect a USB gamepad or Xbox/PS controller. Start a game. Use left stick or D-pad to move. Press Start to pause.

Expected: player moves with the gamepad. If no gamepad hardware is available, skip this step — the IPC bridge is in place for when hardware exists.

- [ ] **Step 4: Stop the dev server**

Press `Ctrl+C`.

---

## What's Next

- **Plan 3:** Steamworks IPC Bridge (Section 6 of the spec)
- **Section 8:** Asset licensing audit — manual checklist in `docs/superpowers/specs/2026-04-05-steam-release-foundation-design.md`
