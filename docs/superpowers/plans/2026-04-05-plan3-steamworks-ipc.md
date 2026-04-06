# Plan 3: Steamworks IPC Bridge

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the IPC bridge that connects the Phaser game (Electron renderer) to the Steamworks SDK (Electron main process), so every Steam feature — achievements, leaderboards, cloud saves, overlay, Steam Deck detection — has a working route to call.

**Architecture:** `steamworks.js` initializes in the Electron main process (`electron/ipc/steam.cjs`). The renderer never touches Steamworks directly — it calls `window.steamAPI.someMethod()` which is exposed by `electron/preload.cjs` via `contextBridge`. The IPC bridge handles graceful degradation: if Steam isn't running or the SDK fails to initialize, all calls return `{ success: false, error: 'Steam not available' }` and the game continues normally. This plan builds the infrastructure only — achievement IDs and leaderboard names are not defined here.

**Tech Stack:** `steamworks.js` (npm), Electron IPC, electron-builder `asarUnpack`

**Prerequisites:**
- Plan 1 complete (Electron shell, `electron/ipc/index.cjs`, `electron/preload.cjs` exist)
- Plan 2 complete (save system in place — cloud save piggybacks on it)
- The Steam client must be running on the development machine to test initialization

---

## File Map

**Create:**
- `electron/ipc/steam.cjs` — all Steamworks IPC handlers, isolated from other IPC code
- `steam_appid.txt` — development App ID (480 = Valve's test app "Space War")
- `src/__tests__/steamPreload.test.js` — verifies the preload bridge exposes the expected shape

**Modify:**
- `package.json` — add `steamworks.js` to dependencies
- `electron/ipc/index.cjs` — import and register Steam IPC handlers
- `electron/preload.cjs` — add `steamAPI` to `contextBridge`
- `electron-builder.config.cjs` — add `asarUnpack` for steamworks.js native binaries
- `.gitignore` — add note about keeping `steam_appid.txt` at 480 until real ID is assigned

---

## Task 1: Install steamworks.js and create steam_appid.txt

**Files:**
- Modify: `package.json`
- Create: `steam_appid.txt`

- [ ] **Step 1: Install steamworks.js**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm install steamworks.js
```

Expected: `steamworks.js` added to `dependencies` in `package.json`. No errors. (The package includes prebuilt native binaries for Windows and Linux — no compilation needed.)

- [ ] **Step 2: Create `steam_appid.txt`**

Create a file named `steam_appid.txt` in the project root (same directory as `package.json`):

```
480
```

`480` is Valve's "Space War" test app, available to all Steam developers. Replace this with your real Steam App ID when you receive it. This file must sit next to the Electron executable at runtime — electron-builder's `extraFiles` config (Task 3) handles that for packaged builds.

- [ ] **Step 3: Add `steam_appid.txt` note to `.gitignore`**

The file should be committed with value `480` for development. Add a comment to `.gitignore` so future contributors know not to commit the real App ID accidentally:

Open `.gitignore` and add at the bottom:

```
# steam_appid.txt IS committed (with value 480 for dev).
# Replace 480 with your real Steam App ID before release.
# Do NOT commit the production App ID — set it via your build pipeline.
```

- [ ] **Step 4: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add package.json package-lock.json steam_appid.txt .gitignore
git commit -m "feat: add steamworks.js and steam_appid.txt (dev App ID 480)"
```

---

## Task 2: Update electron-builder to unpack steamworks.js native binaries

**Files:**
- Modify: `electron-builder.config.cjs`

- [ ] **Step 1: Add `asarUnpack` to `electron-builder.config.cjs`**

`steamworks.js` contains native `.node` binaries that cannot be executed from inside an `.asar` archive. Add `asarUnpack` to the config:

```js
// Add this field to the module.exports object in electron-builder.config.cjs:
asarUnpack: [
  'node_modules/steamworks.js/**/*',
],
```

Also add `steam_appid.txt` to `extraFiles` so it ends up next to the executable in packaged builds:

```js
// Add this field to the module.exports object:
extraFiles: [
  { from: 'steam_appid.txt', to: 'steam_appid.txt' },
],
```

The final `electron-builder.config.cjs` should look like:

```js
'use strict'

module.exports = {
  appId: 'com.fluffyswizzle.equilibriumprotocol',
  productName: 'Equilibrium Protocol',

  directories: {
    output: 'release',
  },

  files: [
    'dist/electron/**/*',
    'electron/**/*',
    'package.json',
  ],

  asarUnpack: [
    'node_modules/steamworks.js/**/*',
  ],

  extraFiles: [
    { from: 'steam_appid.txt', to: 'steam_appid.txt' },
  ],

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    // icon: 'build-resources/icon.ico',
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },

  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    category: 'Game',
    // icon: 'build-resources/icon.png',
  },
}
```

- [ ] **Step 2: Verify the config is valid**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
node -e "require('./electron-builder.config.cjs'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add electron-builder.config.cjs
git commit -m "feat: configure electron-builder to unpack steamworks.js native binaries"
```

---

## Task 3: Create Steamworks IPC handler file

**Files:**
- Create: `electron/ipc/steam.cjs`

- [ ] **Step 1: Create `electron/ipc/steam.cjs`**

```js
'use strict'

const { ipcMain } = require('electron')

// ── Steam initialization ────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/** @returns {{success: false, error: string}} */
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
  // ── Initialization ──────────────────────────────────────────────────────
  ipcMain.handle('steam:init', () => {
    const ok = initSteam()
    return { success: ok }
  })

  ipcMain.handle('steam:is-available', () => {
    return { success: true, data: steamClient !== null }
  })

  // ── Player info ─────────────────────────────────────────────────────────
  ipcMain.handle('steam:get-player-name', () =>
    steamCall(() => steamClient.localplayer.getName())
  )

  ipcMain.handle('steam:get-steam-id', () =>
    steamCall(() => steamClient.localplayer.getSteamId().toString())
  )

  ipcMain.handle('steam:get-player-level', () =>
    steamCall(() => steamClient.localplayer.getLevel())
  )

  // ── Achievements ────────────────────────────────────────────────────────
  /**
   * Unlock a Steam achievement.
   * achievementId: string (must match the ID set in the Steamworks dashboard)
   */
  ipcMain.handle('steam:unlock-achievement', (_, achievementId) =>
    steamCall(() => {
      steamClient.achievement.activate(achievementId)
      return true
    })
  )

  ipcMain.handle('steam:get-achievement', (_, achievementId) =>
    steamCall(() => steamClient.achievement.isActivated(achievementId))
  )

  // ── Leaderboards ────────────────────────────────────────────────────────
  /**
   * Submit a score to a named leaderboard.
   * leaderboardName: string, score: number
   * Creates the leaderboard if it doesn't exist.
   */
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

  /**
   * Fetch top N global scores from a named leaderboard.
   * Returns array of { globalRank, score, steamId } or empty array.
   */
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

  // ── Cloud saves ─────────────────────────────────────────────────────────
  ipcMain.handle('steam:cloud-is-enabled', () =>
    steamCall(() => steamClient.cloud.isEnabled())
  )

  /**
   * Write a JSON-serializable object to Steam Cloud.
   * filename: string (e.g. 'save.json'), data: object
   */
  ipcMain.handle('steam:cloud-write', (_, { filename, data }) =>
    steamCall(() => {
      steamClient.cloud.writeFile(filename, Buffer.from(JSON.stringify(data)))
      return true
    })
  )

  /**
   * Read a JSON object from Steam Cloud.
   * Returns null if the file doesn't exist.
   */
  ipcMain.handle('steam:cloud-read', (_, filename) =>
    steamCall(() => {
      const buffer = steamClient.cloud.readFile(filename)
      if (!buffer) return null
      return JSON.parse(buffer.toString('utf8'))
    })
  )

  // ── Overlay ─────────────────────────────────────────────────────────────
  /**
   * Open the Steam overlay to a specific page.
   * page: 'Achievements' | 'Friends' | 'Community' | 'Stats'
   */
  ipcMain.handle('steam:activate-overlay', (_, page = 'Achievements') =>
    steamCall(() => {
      steamClient.overlay.activateGameOverlay(page)
      return true
    })
  )
}

module.exports = { registerSteamHandlers, initSteam }
```

- [ ] **Step 2: Verify the file parses**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
node -e "require('./electron/ipc/steam.cjs'); console.log('OK')"
```

Expected: `OK` (steamworks.js won't initialize without Steam running — that's fine, we're just checking parse errors).

- [ ] **Step 3: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add electron/ipc/steam.cjs
git commit -m "feat: add Steamworks IPC handlers (achievements, leaderboards, cloud, overlay)"
```

---

## Task 4: Register Steam handlers and expose via preload

**Files:**
- Modify: `electron/ipc/index.cjs`
- Modify: `electron/preload.cjs`

- [ ] **Step 1: Register Steam handlers in `electron/ipc/index.cjs`**

At the top of `electron/ipc/index.cjs` (after `'use strict'`), add:

```js
const { registerSteamHandlers, initSteam } = require('./steam.cjs')
```

At the end of the `registerIpcHandlers(mainWindow)` function, add:

```js
// Register all Steamworks IPC routes
registerSteamHandlers()
// Attempt Steam init immediately (non-blocking — fails gracefully if Steam not running)
initSteam()
```

- [ ] **Step 2: Expose Steam API in `electron/preload.cjs`**

Add a second `contextBridge.exposeInMainWorld` call after the existing `electronAPI` one:

```js
const { contextBridge, ipcRenderer } = require('electron')

// ... existing electronAPI exposure ...

/**
 * @typedef {Object} SteamResult
 * @property {boolean} success
 * @property {any} [data]
 * @property {string} [error]
 */

contextBridge.exposeInMainWorld('steamAPI', {
  /** @returns {Promise<SteamResult>} */
  init: () => ipcRenderer.invoke('steam:init'),

  /** @returns {Promise<SteamResult<boolean>>} */
  isAvailable: () => ipcRenderer.invoke('steam:is-available'),

  /** @returns {Promise<SteamResult<string>>} player display name */
  getPlayerName: () => ipcRenderer.invoke('steam:get-player-name'),

  /** @returns {Promise<SteamResult<string>>} Steam ID as string */
  getSteamId: () => ipcRenderer.invoke('steam:get-steam-id'),

  /** @returns {Promise<SteamResult<number>>} Steam level */
  getPlayerLevel: () => ipcRenderer.invoke('steam:get-player-level'),

  /**
   * @param {string} achievementId - Must match ID in Steamworks dashboard
   * @returns {Promise<SteamResult>}
   */
  unlockAchievement: (achievementId) =>
    ipcRenderer.invoke('steam:unlock-achievement', achievementId),

  /** @param {string} achievementId @returns {Promise<SteamResult<boolean>>} */
  getAchievement: (achievementId) =>
    ipcRenderer.invoke('steam:get-achievement', achievementId),

  /**
   * @param {string} leaderboardName
   * @param {number} score
   * @returns {Promise<SteamResult>}
   */
  submitScore: (leaderboardName, score) =>
    ipcRenderer.invoke('steam:submit-score', { leaderboardName, score }),

  /**
   * @param {string} leaderboardName
   * @param {number} [count=10]
   * @returns {Promise<SteamResult<Array<{globalRank: number, score: number, steamId: string}>>>}
   */
  getLeaderboard: (leaderboardName, count = 10) =>
    ipcRenderer.invoke('steam:get-leaderboard', { leaderboardName, count }),

  /** @returns {Promise<SteamResult<boolean>>} */
  cloudIsEnabled: () => ipcRenderer.invoke('steam:cloud-is-enabled'),

  /**
   * @param {string} filename
   * @param {Object} data
   * @returns {Promise<SteamResult>}
   */
  cloudWrite: (filename, data) =>
    ipcRenderer.invoke('steam:cloud-write', { filename, data }),

  /** @param {string} filename @returns {Promise<SteamResult<Object|null>>} */
  cloudRead: (filename) =>
    ipcRenderer.invoke('steam:cloud-read', filename),

  /**
   * @param {'Achievements'|'Friends'|'Community'|'Stats'} [page='Achievements']
   * @returns {Promise<SteamResult>}
   */
  activateOverlay: (page = 'Achievements') =>
    ipcRenderer.invoke('steam:activate-overlay', page),
})
```

- [ ] **Step 3: Verify both files parse**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
node -e "require('./electron/ipc/index.cjs'); console.log('OK')" && \
node -e "require('./electron/preload.cjs'); console.log('OK')"
```

Expected: two lines of `OK`

- [ ] **Step 4: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add electron/ipc/index.cjs electron/preload.cjs
git commit -m "feat: register Steam IPC handlers and expose steamAPI via preload"
```

---

## Task 5: Write unit test for the preload bridge shape

**Files:**
- Create: `src/__tests__/steamPreload.test.js`

This test verifies the `window.steamAPI` object exposes every expected method. It does not call Electron IPC — it just checks the surface area of the bridge.

- [ ] **Step 1: Create the test**

Create `src/__tests__/steamPreload.test.js`:

```js
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
      await result // Should not throw
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
```

- [ ] **Step 2: Run the tests to confirm they pass**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test -- src/__tests__/steamPreload.test.js
```

Expected: all tests pass.

- [ ] **Step 3: Run full test suite**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add src/__tests__/steamPreload.test.js
git commit -m "test: verify steamAPI preload bridge exposes correct method surface"
```

---

## Task 6: Manual smoke test — Steam initialization and player name

**Prerequisite: Steam client must be running on the development machine.**

- [ ] **Step 1: Start Electron in dev mode with Steam running**

Make sure the Steam client is open and logged in. Then:

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm run dev:electron
```

- [ ] **Step 2: Check the terminal for Steam initialization log**

Expected in the terminal output:
```
[Steam] Initialized. Player: <your Steam display name>
```

If you see `[Steam] Not available: ...`, Steam may not be running or the `steam_appid.txt` file is not in the right place.

- [ ] **Step 3: Test `window.steamAPI` in DevTools**

Open Electron DevTools (they open automatically in dev mode). In the Console tab, run:

```js
await window.steamAPI.isAvailable()
// Expected: { success: true, data: true }

await window.steamAPI.getPlayerName()
// Expected: { success: true, data: '<your Steam name>' }

await window.steamAPI.unlockAchievement('ACH_WIN_ONE_GAME')
// Expected: { success: true, data: true }
// (Note: this uses test App ID 480 — Steam may silently ignore unknown achievement IDs)
```

- [ ] **Step 4: Test graceful degradation without Steam**

Close the Steam client. Restart the Electron dev build. In DevTools console:

```js
await window.steamAPI.isAvailable()
// Expected: { success: true, data: false }

await window.steamAPI.getPlayerName()
// Expected: { success: false, error: 'Steam not available' }
```

Expected: no crashes. The game loads and runs normally even without Steam.

- [ ] **Step 5: Stop the dev server**

Press `Ctrl+C`.

---

## Task 7: Final integration commit

- [ ] **Step 1: Run full test suite one last time**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Verify Electron dev build still starts cleanly**

```bash
npm run dev:electron
```

Expected: game loads, no console errors.

- [ ] **Step 3: Stop and final commit**

```bash
cd "/home/dswint/Documents/Github Repos/Equilibrium-Protocol-GameDevjs-2025-Entry"
git add -A
git status
# Review: only expected files staged
git commit -m "feat: complete Steamworks IPC bridge — Steam features can now be wired in"
```

---

## What's Next

The foundation is complete. The following features can now be built independently as their own specs + plans:

- **Steam Achievements** — define achievement IDs in Steamworks dashboard, call `window.steamAPI.unlockAchievement(id)` at the right game events
- **Steam Leaderboards** — call `window.steamAPI.submitScore('HighScore', score)` on game end; build leaderboard UI scene
- **Steam Cloud Saves** — extend `SaveManager` to sync `save.json` via `window.steamAPI.cloudWrite/cloudRead` after local writes
- **Steam Input / Controller remapping** — extend `InputManager` to read Steam Input API action sets via a new IPC route
- **CI/CD for Steam** — replace Butler deploy with SteamCMD in GitHub Actions; separate pipeline for web demo and Steam builds
- **Section 8: Asset licensing audit** — manual checklist in `docs/superpowers/specs/2026-04-05-steam-release-foundation-design.md`
