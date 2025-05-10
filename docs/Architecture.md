# Architecture

## Overview

This document outlines the architecture of the Fluffy-Swizz Interactive game, including the project structure, core components, and how different systems interact.

## Project Structure

The project follows a modular architecture with clear separation between React components and Phaser game logic:

```
src/
├── App.jsx                # Main React entry point
├── main.jsx               # React initialization
└── game/                  # Game logic
    ├── EventBus.js        # Events communication system
    ├── main.js            # Phaser game initialization
    ├── PhaserGame.jsx     # React-Phaser integration
    ├── constants/         # Game constants and configuration
    │   ├── PlayerUpgrades.js # Player upgrade definitions
    │   └── WeaponUpgrades.js # Weapon upgrade definitions
    ├── debug/             # Debug tools
    │   └── DebugPanel.jsx # In-game debug panel
    ├── entities/          # Game objects
    │   ├── ai/            # Enemy AI states and behaviors
    │   │   ├── PanicFleeState.js # Fleeing behavior
    │   │   └── RageState.js # Aggressive behavior
    │   ├── BaseEnemy.js   # Base enemy class
    │   ├── Enemy1.js      # Basic enemy type
    │   ├── Enemy2.js      # Fast enemy type
    │   ├── Enemy3.js      # Tank enemy type
    │   ├── Boss1.js       # Boss enemy type
    │   ├── Player.js      # Player entity
    │   ├── PlayerDrone.js # Player's combat drone companion
    │   ├── PlayerHealth.js # Player health component
    │   ├── BulletPool.js  # Bullet pool implementation
    │   └── SpritePool.js  # Sprite object pool (effects, pickups)
    ├── managers/          # Game system managers
    │   ├── AnimationManager.js # Animation handling
    │   ├── CashManager.js # In-game currency system
    │   ├── ChaosManager.js # Dynamic difficulty system
    │   ├── CollectibleManager.js # Pickup item management
    │   ├── EnemyManager.js # Enemy spawning and management
    │   ├── GameObjectManager.js # Centralized object manager
    │   ├── GroupManager.js # Entity group management
    │   ├── ShopManager.js # Upgrade shop system
    │   ├── SoundManager.js # Centralized audio system
    │   ├── UIManager.js   # UI components manager
    │   ├── UpgradeManager.js # Player and weapon upgrades
    │   ├── WaveManager.js # Wave-based gameplay manager
    │   ├── WeaponManager.js # Weapon systems and drones
    │   └── XPManager.js   # Experience and leveling system
    ├── mapping/           # Tile map handling
    │   └── MapManager.js  # Map creation and handling
    ├── systems/           # Core game systems
    ├── ui/                # UI components and helpers
    ├── utils/             # Utility functions
    │   └── ButtonSoundHelper.js # Sound effects for buttons
    └── scenes/            # Game screens
        ├── Boot.js        # Initial loading
        ├── GameOver.js    # End screen
        ├── MainMenu.js    # Menu screen
        ├── PreSpawn.js    # Game instructions screen
        ├── Preloader.js   # Asset loading
        ├── ShopMenuScene.js # Upgrade shop between waves
        └── WaveGame.jsx   # Main gameplay scene with wave-based mechanics
```

## Core Components

### React Integration

The game uses React for UI components and Phaser for the game engine. The integration is handled through:

#### `PhaserGame.jsx`

React component that initializes and manages the Phaser game instance.

**Methods:**
- `initializeGame()` - Creates a new Phaser game instance
- `cleanupGame()` - Destroys the game instance when unmounting
- `setupEventListeners()` - Sets up EventBus listeners
- `handleSceneReady(currentScene)` - Handles scene initialization events

**Props:**
- `ref` - Forwarded ref to access game and scene objects

### Phaser Game Configuration

#### `main.js`

Initializes the Phaser game with appropriate configuration.

**Configuration Options:**
- `width: 1024` - Game canvas width
- `height: 768` - Game canvas height
- `physics: { default: 'arcade' }` - Physics engine
- `fps: { target: 60 }` - Target framerate
- `backgroundColor: '#028af8'` - Default background color

**Game Scenes:**
- `Boot` - Initial loading
- `Preloader` - Asset loading
- `MainMenu` - Game menu
- `PreSpawn` - Instructions and preparation before gameplay
- `WaveGame` - Main gameplay scene with wave-based mechanics
- `ShopMenuScene` - Upgrade shop between waves
- `GameOver` - End screen

## Communication System

### `EventBus.js`

Communication system between React components and Phaser scenes using Phaser's built-in event emitter.

**Methods:**
- `initialize(game)` - Sets up the event system
- `emit(event, data)` - Emits an event with optional data
- `on(event, callback, context)` - Registers an event listener
- `off(event, callback, context)` - Removes an event listener

**Key Events:**
- `scene-ready` - Fired when a scene is fully initialized
- `game-over` - Fired when the player dies
- `score-update` - Fired when the player's score changes
- `wave-complete` - Fired when a wave is completed
- `player-level-up` - Fired when the player levels up

## Scene Flow

The game follows a specific scene flow:

1. **Boot Scene** - Initial loading and setup
2. **Preloader Scene** - Loads all game assets
3. **MainMenu Scene** - Player selects game mode
4. **PreSpawn Scene** - Displays instructions and controls
5. **WaveGame Scene** - Main gameplay
6. **ShopMenuScene** - Between waves for purchasing upgrades
7. **GameOver Scene** - Displays results when player dies

The typical gameplay loop is:
WaveGame (complete wave) → ShopMenuScene (purchase upgrades) → WaveGame (next wave)

### Scene Transitions

Scenes transition between each other using Phaser's scene management:

```javascript
// Example: Transitioning from MainMenu to WaveGame scene
this.scene.start('WaveGame', { gameMode: 'minigun' });

// Example: Transitioning to GameOver with stats
this.scene.start('GameOver', {
    survivalTime: this.survivalTime,
    killCount: this.killCount
});
```

## Object Pooling Architecture

The game uses object pooling for performance optimization, particularly for frequently created/destroyed objects:

### `GameObjectManager.js`

Central manager for object pools.

**Methods:**
- `createPool(type, createFunc, resetFunc, options)` - Creates a new object pool
- `get(type, ...args)` - Gets an object from a pool
- `release(type, object)` - Returns an object to its pool

### Specialized Pools

- `BulletPool.js` - Manages bullet objects
- `SpritePool.js` - Manages sprite objects (effects, pickups)

## Development Patterns

The codebase follows these key patterns:

1. **Singleton Managers** - Core systems like SoundManager are implemented as singletons
2. **Event-Driven Communication** - Components communicate via the EventBus
3. **Object Pooling** - Reuse objects instead of creating/destroying them
4. **Scene Encapsulation** - Each scene is responsible for its own logic and cleanup

## Performance Considerations

- Object pooling for frequently created/destroyed objects
- Asset preloading to prevent in-game loading delays
- Texture atlas usage for sprite animations
- Efficient collision detection using spatial partitioning

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
