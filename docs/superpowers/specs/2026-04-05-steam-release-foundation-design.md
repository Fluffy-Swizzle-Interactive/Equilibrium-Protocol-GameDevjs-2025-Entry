# Steam Release Foundation — Design Spec

**Date:** 2026-04-05  
**Status:** Approved  
**Author:** Derrick Swint  
**Scope:** Foundational codebase changes required before implementing any Steam-specific features

---

## Overview

Equilibrium Protocol is currently a browser-based Phaser 3 + React game deployed to itch.io. This spec covers the foundational engineering work required to ship it on Steam as a desktop application targeting **Windows and Linux** (which includes Steam Deck support via Linux).

This is not a spec for Steam features (achievements, leaderboards, cloud saves). Those are built on top of this foundation. Nothing in this spec touches gameplay logic.

**Chosen approach:** Electron Shell First — add Electron as a desktop wrapper, establish all supporting systems, and migrate Steam features on top. TypeScript migration is explicitly deferred; JSDoc annotations are used at IPC/save boundaries for type safety without migration cost.

**Distribution strategy:**
- Steam: primary channel, full game, all updates
- itch.io: demo version only, web build

---

## Section 1: Architecture Shift

The game transitions from a **web app** to a **desktop app** using Electron as the container.

```
CURRENT:  Browser → Vite bundle → Phaser/React game

FUTURE:   Electron (main process / Node.js)
               ↕ IPC bridge
          Electron (renderer process / Chromium) → Phaser/React game
```

The Phaser/React game code is minimally changed. All new structural work lives in the Electron layer.

**Build outputs:**

| Command | Output | Target |
|---|---|---|
| `npm run build:web` | Static HTML/JS in `dist/web` | itch.io demo |
| `npm run build:win` | `.exe` installer | Steam (Windows) |
| `npm run build:linux` | `.AppImage` / `.deb` | Steam (Linux / Steam Deck) |

---

## Section 2: Electron Packaging & Asset Paths

### New project structure

```
electron/
├── main.js          # Electron entry point, creates BrowserWindow
├── preload.js       # Secure contextBridge between main and renderer
└── ipc/
    └── index.js     # IPC route handlers (grows as Steam features are added)
```

### Vite config split

- `vite.config.web.js` — existing web build, base path `./`, outputs to `dist/web`
- `vite.config.electron.js` — renderer build for Electron, outputs to `dist/electron`

### Asset path strategy

Assets currently load via relative paths (`./assets/...`) which break inside Electron's `.asar` package. Fix by registering a custom protocol in the main process:

```js
// electron/main.js
protocol.registerFileProtocol('game', (request, callback) => {
  const filePath = request.url.replace('game://', '')
  callback(path.join(__dirname, filePath))
})
```

Assets load via `game://assets/...` in Electron builds. The web build continues using `./assets/...`. This change is isolated to `boot-asset-pack.json` and `preload-asset-pack.json` — Phaser game code does not change.

### Packaging

`electron-builder` handles cross-platform packaging. Primary Steam-submittable formats:
- Windows: `.exe` (NSIS installer)
- Linux: `.AppImage`

---

## Section 3: Save & Settings Persistence System

Currently the game has no persistence. This must exist before Steam Cloud Saves, achievements, or leaderboards can be implemented.

### Data categories

| Category | Examples |
|---|---|
| Settings | Volume levels, fullscreen state, keybindings |
| Game State | High score, highest wave reached, total kills |

### Storage location

Electron's `app.getPath('userData')` resolves to the correct OS path automatically:
- Windows: `%APPDATA%/EquilibriumProtocol/`
- Linux: `~/.config/EquilibriumProtocol/`

```
userData/
├── settings.json
└── save.json
```

### SaveManager

A new `SaveManager` class is added alongside the existing 19 managers. Responsibilities:
- Read/write/validate `settings.json` and `save.json`
- Expose load/save methods to game scenes via EventBus
- Route file system calls through the IPC bridge (renderers cannot access the file system directly)

### JSDoc types at the IPC boundary

```js
/**
 * @typedef {Object} SaveData
 * @property {number} highScore
 * @property {number} highestWave
 * @property {number} totalKills
 */

/**
 * @typedef {Object} SettingsData
 * @property {number} musicVolume
 * @property {number} sfxVolume
 * @property {boolean} fullscreen
 */
```

The `SaveData` shape becomes the Steam Cloud Saves payload later with no redesign.

---

## Section 4: Resolution, Fullscreen & Window Management

### Phaser scale config

Replace hardcoded `1024×768` in `src/game/main.js` with Phaser's scale manager:

```js
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: 1024,
  height: 768,
}
```

`FIT` mode letterboxes the game at any window size while preserving the 1024×768 internal coordinate space. UI positions, gameplay logic, and scene code are unaffected. Correct on Steam Deck (1280×800) out of the box.

**Required QA pass:** After applying this change, run a full playthrough in dev mode to catch any UI elements positioned relative to camera/window edges rather than the game world. Any hardcoded `1024` or `768` values used for positioning logic must be replaced with `this.scale.width` / `this.scale.height`.

### Electron BrowserWindow config

```js
new BrowserWindow({
  width: 1280,
  height: 720,
  minWidth: 1024,
  minHeight: 768,
  frame: false,
  fullscreenable: true
})
```

### In-game controls

- `F11` toggles fullscreen (standard desktop expectation)
- Fullscreen button in settings/pause UI
- Fullscreen state persisted via `SaveManager` (Section 3)

---

## Section 5: Input Abstraction Layer

### Problem

Input is currently wired directly — raw keyboard/mouse events in `Player.js` and scenes. Steam Deck is controller-first. Steam Input API requires named actions, not raw key bindings.

### Solution

Add an `InputManager` that sits between hardware input and game code:

```
CURRENT:  Scene/Player → Phaser keyboard/mouse directly

FUTURE:   Scene/Player → InputManager → Phaser keyboard/mouse/gamepad
```

Game code asks `"is move-up pressed?"` instead of `"is W down?"`. `InputManager` handles translation. Default bindings are identical to current behavior — no gameplay feel change.

### Phaser gamepad support

Phaser 3 has built-in gamepad support. Enable in game config and route through `InputManager`. No third-party library required.

### Files requiring audit

- `src/game/entities/Player.js` — primary raw key usage
- Any scene with keyboard-driven menu navigation
- `src/game/utils/ButtonSoundHelper.js` — mouse click assumptions

### What this unlocks

Steam Input API integration and controller remapping are additive routes added to `InputManager` later. Architecture does not change.

---

## Section 6: Steamworks IPC Bridge

### Why this is needed

`steamworks.js` (Steamworks SDK wrapper) runs in Node.js — Electron's main process only. The game runs in the renderer process (Chromium). They cannot share memory, so they communicate via IPC.

### Architecture

```
Renderer (game)            Main Process (Node.js)
───────────────────        ──────────────────────────────
"unlock achievement"  →    → steamworks.activateAchievement()
"submit score"        →    → steamworks.uploadLeaderboardScore()
"get player name"    ←     ← steamworks.getFriendPersonaName()
```

### Implementation

**`electron/preload.js`** — exposes typed API to the renderer via `contextBridge`:

```js
/**
 * @param {string} achievementId
 * @returns {Promise<void>}
 */
unlockAchievement: (id) => ipcRenderer.invoke('steam:unlock-achievement', id),

/** @returns {Promise<string>} */
getPlayerName: () => ipcRenderer.invoke('steam:get-player-name'),
```

**`electron/ipc/index.js`** — handles calls in main process using `steamworks.js`. New Steam features = new handlers added here. Architecture never changes.

### What this unlocks

Every Steam feature is a new IPC route. Achievements, leaderboards, cloud saves, overlay, Steam Deck detection — all plug into this bridge.

---

## Section 7: Error Handling & Crash Reporting

Web games fail silently. Desktop Steam games need crash logs and graceful failure.

### Three layers

**Electron main process** — catches Node.js-level errors, writes to log file:

```js
process.on('uncaughtException', (error) => {
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${error.stack}\n`)
})
```

**React error boundary** — wraps the `PhaserGame` component. Catches renderer-level errors and shows a recoverable error screen instead of a blank canvas.

**Electron `crashReporter`** (optional post-launch) — sends minidumps on hard renderer crashes.

### Log location

Follows `userData` path from Section 3:
- Windows: `%APPDATA%/EquilibriumProtocol/logs/`
- Linux: `~/.config/EquilibriumProtocol/logs/`

All new files — no changes to existing game logic.

---

## Section 8: Asset Licensing Audit

**This is a hard blocker for Steam.** Valve requires commercial rights to all game content. Itch.io does not enforce this; Steam does.

### Required action

Verify every asset is licensed for **commercial use**. "Free to use" and "free for commercial use" are not the same thing. CC NC (non-commercial) licenses block Steam distribution.

### Asset inventory checklist

- [ ] `public/assets/audio/music/actionTrack1.mp3`
- [ ] `public/assets/audio/music/mainMenu.mp3`
- [ ] `public/assets/audio/music/track1.mp3`
- [ ] `public/assets/audio/ambient/ambient_loop.mp3`
- [ ] `public/assets/audio/sfx/bossAlert.mp3`
- [ ] `public/assets/audio/sfx/bossDefeat.mp3`
- [ ] `public/assets/audio/sfx/btnClick.mp3`
- [ ] `public/assets/audio/sfx/explosion1.wav`
- [ ] `public/assets/audio/sfx/hitHurt.wav`
- [ ] `public/assets/audio/sfx/laserShoot.wav`
- [ ] `public/assets/audio/sfx/levelUp.wav`
- [ ] `public/assets/audio/sfx/pickupCash.wav`
- [ ] `public/assets/audio/sfx/shopUpgrade.wav`
- [ ] `public/assets/audio/sfx/waveEnd/` (all 8 variations)
- [ ] `public/assets/sprites/BOSS1.json` + associated images
- [ ] `public/assets/sprites/DRONE.json` + associated images
- [ ] `public/assets/sprites/ENEMY1.json` + associated images
- [ ] `public/assets/sprites/ENEMY2.json` + associated images
- [ ] `public/assets/sprites/ENEMY3.json` + associated images
- [ ] `public/assets/sprites/TESTPLAYER1.json` + associated images
- [ ] `public/assets/maps/` — all tileset `.png` files
- [ ] `public/assets/images/` — all image files

### Output required

Create `LICENSES.md` in the repo root documenting each asset's source and license. Any asset that cannot be verified as commercially licensed must be replaced before Steam submission.

---

## Implementation Order

These sections have dependencies. Recommended order:

1. **Section 2** — Electron packaging + asset paths (everything else needs this)
2. **Section 4** — Resolution/fullscreen (low-risk, good early QA signal)
3. **Section 3** — Save system (needed before Section 6 features)
4. **Section 5** — Input abstraction (can be parallelized with Section 3)
5. **Section 6** — Steamworks IPC bridge (needs Section 3 save shapes)
6. **Section 7** — Error handling (can be done anytime after Section 2)
7. **Section 8** — Asset audit (non-code, can be done in parallel with any section)

---

## Out of Scope

The following are **not** covered by this spec and require their own specs:

- Steam achievements design and implementation
- Steam leaderboard integration
- Steam Cloud Saves wiring
- Steam Deck UI/UX optimizations
- Controller UI navigation
- Steam store page, capsule art, and marketing assets
- CI/CD pipeline update for SteamCMD deployment
