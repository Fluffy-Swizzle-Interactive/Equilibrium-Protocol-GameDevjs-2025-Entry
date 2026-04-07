# Steamworks IPC Bridge

The game uses **steamworks.js** (a Node.js wrapper around the Steamworks C SDK) in the Electron main process. The renderer cannot call it directly, so all Steam functionality crosses the `contextBridge` via IPC.

## Architecture

```
Renderer (React / Phaser)          Main Process (Node.js)
─────────────────────────          ─────────────────────
window.steamAPI.<method>()
    └─ ipcRenderer.invoke(channel) ──► ipcMain.handle(channel)
                                            └─ steamworks.js
◄─────────────── { success, data?, error? } ──────────────┘
```

**Files:**

| File | Purpose |
|------|---------|
| `electron/preload.cjs` | Exposes `window.steamAPI` via `contextBridge` |
| `electron/ipc/steam.cjs` | Registers all `ipcMain.handle` handlers |
| `electron/ipc/index.cjs` | Calls `registerSteamHandlers()` on app ready |

## Initialisation

Steam is initialised at two points:

1. **App startup** — `initSteam()` is called from `electron/ipc/index.cjs` when the app is ready. If Steam is not running the call fails silently and the game continues without Steam features.
2. **Renderer request** — the renderer may call `window.steamAPI.init()` to retry or confirm availability.

`initSteam()` is **idempotent**: subsequent calls return `true` immediately without re-running the SDK init.

The app ID is read from (in order):
1. `STEAM_APP_ID` environment variable
2. `steam_appid.txt` next to the executable (packaged builds)
3. `steam_appid.txt` in `process.cwd()` (development)

## Response Envelope

Every `steamAPI` method returns a `Promise<SteamResult>`:

```ts
type SteamResult<T = any> = 
  | { success: true;  data: T }
  | { success: false; error: string }
```

When Steam is unavailable the error is always `"Steam not available"`.

## API Reference

### Connection

| Method | IPC Channel | Returns |
|--------|-------------|---------|
| `init()` | `steam:init` | `SteamResult` — success once SDK is ready |
| `isAvailable()` | `steam:is-available` | `SteamResult<boolean>` — true if SDK is initialised |

### Player Info

| Method | IPC Channel | Returns |
|--------|-------------|---------|
| `getPlayerName()` | `steam:get-player-name` | `SteamResult<string>` — display name |
| `getSteamId()` | `steam:get-steam-id` | `SteamResult<string>` — SteamID64 as decimal string |
| `getPlayerLevel()` | `steam:get-player-level` | `SteamResult<number>` — Steam level |

### Achievements

| Method | IPC Channel | Returns |
|--------|-------------|---------|
| `unlockAchievement(achievementId)` | `steam:unlock-achievement` | `SteamResult<true>` |
| `getAchievement(achievementId)` | `steam:get-achievement` | `SteamResult<boolean>` — true if unlocked |

Achievement IDs match the names defined in the Steamworks Partner dashboard (e.g. `'ACH_WIN_10'`).

### Leaderboards

| Method | IPC Channel | Returns |
|--------|-------------|---------|
| `submitScore(leaderboardName, score)` | `steam:submit-score` | `SteamResult<true>` — uses KeepBest policy |
| `getLeaderboard(leaderboardName, count?)` | `steam:get-leaderboard` | `SteamResult<Object[]>` — global top entries, default 10 |

Leaderboards are created automatically via `findOrCreate` (Descending, Numeric display).

### Steam Cloud

| Method | IPC Channel | Returns |
|--------|-------------|---------|
| `cloudIsEnabled()` | `steam:cloud-is-enabled` | `SteamResult<boolean>` |
| `cloudWrite(filename, data)` | `steam:cloud-write` | `SteamResult<true>` — data is JSON-serialised |
| `cloudRead(filename)` | `steam:cloud-read` | `SteamResult<Object\|null>` — null if file absent |

Cloud saves complement the local IPC save system (`electronAPI.saveData` / `loadData`). The `SaveManager` currently uses local IPC; cloud sync is opt-in via these methods.

### Overlay

| Method | IPC Channel | Returns |
|--------|-------------|---------|
| `activateOverlay(page?)` | `steam:activate-overlay` | `SteamResult<true>` — default page: `'Achievements'` |

Valid page strings include `'Achievements'`, `'Community'`, `'Friends'`, `'Stats'`, `'Store'`. See the [Steamworks overlay docs](https://partner.steamgames.com/doc/features/overlay) for the full list.

## Graceful Degradation

All handlers return `{ success: false, error: 'Steam not available' }` when the SDK is not initialised. Game code should always check `success` before using `data`:

```js
const result = await window.steamAPI.getPlayerName()
if (result.success) {
  showWelcome(result.data)
}
```

## Development Without Steam

During local development Steam does not need to be running. Features gated on `isAvailable()` are silently skipped. The `steam_appid.txt` file (value `480`, Valve's SpaceWar test app) is committed to the repo so developers can test with a real Steam client if desired.
