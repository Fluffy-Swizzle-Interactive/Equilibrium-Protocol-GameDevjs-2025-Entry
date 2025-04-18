# Fluffy-Swizz Interactive Game Project Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Core Components](#core-components)
- [Game Entities](#game-entities)
- [Scene Management](#scene-management)
- [Event System](#event-system)
- [UI Components](#ui-components)
- [Sound System](#sound-system)
- [Game Mechanics](#game-mechanics)
- [XP System](#xp-system)
- [Object Pooling System](#object-pooling-system)
- [Wave-Based Game Mode](#wave-based-game-mode)
- [Mapping System](#mapping-system)
- [Enemy Registry System](#enemy-registry-system)
- [Enemy Grouping & Chaos System](#enemy-grouping--chaos-system)
- [Development Guidelines](#development-guidelines)
- [Asset Management](#asset-management)
- [Troubleshooting](#troubleshooting)

## Project Overview

A top-down shooter game built with Phaser 3 and React. Players can choose between two weapon modes (minigun or shotgun) and must survive as long as possible against increasingly difficult waves of enemies.

### Tech Stack
- **Game Engine**: Phaser 3.88.2
- **UI Framework**: React 18.3.1
- **Build Tool**: Vite 5.3.1

### Key Game Features
- Two distinct weapon systems
- Two game modes - Endless Survival and Wave-based Survival
- Enemy wave management with increasing difficulty
- Boss enemy encounters
- Debug panel for development

---

## Architecture

### Project Structure

```
src/
├── App.jsx                # Main React entry point
├── main.jsx               # React initialization
└── game/                  # Game logic
    ├── EventBus.js        # Events communication system
    ├── main.js            # Phaser game initialization
    ├── PhaserGame.jsx     # React-Phaser integration
    ├── debug/             # Debug tools
    │   └── DebugPanel.jsx # In-game debug panel
    ├── entities/          # Game objects
    │   ├── Enemy.js       # Enemy entity
    │   ├── Player.js      # Player entity
    │   ├── BulletPool.js  # Bullet pool implementation
    │   └── SpritePool.js  # Sprite object pool (effects, pickups)
    ├── managers/          # Game system managers
    │   ├── GameObjectManager.js # Centralized object manager
    │   ├── SoundManager.js # Centralized audio system
    │   ├── UIManager.js   # UI components manager
    │   └── WaveManager.js # Wave-based gameplay manager
    ├── mapping/           # Tile map handling
    │   └── TileMapManager.js # Map creation and handling
    └── scenes/            # Game screens
        ├── Boot.js        # Initial loading
        ├── Game.jsx       # Main gameplay (Endless mode)
        ├── GameOver.js    # End screen
        ├── MainMenu.js    # Menu screen
        ├── Preloader.js   # Asset loading
        └── WaveGame.jsx   # Wave-based gameplay mode
```

---

## Core Components

### `PhaserGame.jsx`

React component that initializes and manages the Phaser game instance.

#### Methods
- `initializeGame()` - Creates a new Phaser game instance
- `cleanupGame()` - Destroys the game instance when unmounting
- `setupEventListeners()` - Sets up EventBus listeners
- `handleSceneReady(currentScene)` - Handles scene initialization events

#### Props
- `ref` - Forwarded ref to access game and scene objects

### `main.js`

Initializes the Phaser game with appropriate configuration.

#### Configuration Options
- `width: 1024` - Game canvas width
- `height: 768` - Game canvas height
- `physics: { default: 'arcade' }` - Physics engine
- `fps: { target: 60 }` - Target framerate
- `backgroundColor: '#028af8'` - Default background color

#### Game Scenes
- `Boot` - Initial loading
- `Preloader` - Asset loading
- `MainMenu` - Game menu
- `Game` - Main gameplay
- `GameOver` - End screen
- `WaveGame` - Wave-based gameplay mode

### `EventBus.js`

Communication system between React components and Phaser scenes using Phaser's built-in event emitter.

#### Methods
- `EventBus.emit(key, data)` - Trigger an event with optional data
- `EventBus.on(key, callback, context)` - Listen for events
- `EventBus.removeListener(key, callback, context)` - Remove event listeners

#### Key Events
- `'current-scene-ready'` - Emitted when a scene is fully initialized
- `'preloader-complete'` - Emitted when asset loading is finished

---

## Game Entities

### `Player` Class (`Player.js`)

Manages the player character, including movement, weapons, shooting, and sprite animations.

#### Properties
- `speed: 3` - Movement speed
- `radius: 20` - Player collision radius
- `health: 100` - Player health
- `gameMode` - Current weapon type ('minigun' or 'shotgun')
- `isMoving` - Whether the player is currently moving
- `currentDirection` - Current facing direction ('up', 'down', 'left', 'right')
- `animationSpeed` - Frames per second for walking animation

#### Methods
- `constructor(scene, x, y)` - Creates player at specified position
- `initPhysicsProperties()` - Sets up movement-related properties
- `initWeaponProperties(gameMode)` - Configures weapon based on game mode
- `initGraphics(x, y)` - Creates visual elements with sprite
- `createAnimations()` - Sets up animation sequences for the player
- `update()` - Called each frame to update player state
- `updateMovement()` - Handles player movement
- `updateAiming()` - Updates aim direction based on mouse
- `updateSpriteDirection(angle)` - Changes sprite direction based on aim angle
- `updateAnimation()` - Updates sprite animation based on movement and direction
- `shoot()` - Fires weapon based on current mode
- `createBullet(spawnX, spawnY, dirX, dirY)` - Creates appropriate bullet type
- `createMinigunBullet(spawnX, spawnY, dirX, dirY)` - Creates single bullet
- `createShotgunBullets(spawnX, spawnY, dirX, dirY)` - Creates spread of bullets
- `calculateDirectionVector()` - Gets normalized direction to target
- `getPosition()` - Returns current coordinates

#### Animations
The player has the following animation states:
- **Walking animations** - Four-directional movement animations
  - `player-walk-up` - Plays when moving upwards
  - `player-walk-down` - Plays when moving downwards
  - `player-walk-left` - Plays when moving left
  - `player-walk-right` - Plays when moving right
- **Idle animations** - Four-directional idle animations
  - `player-idle-up` - Played when standing still facing up
  - `player-idle-down` - Played when standing still facing down
  - `player-idle-left` - Played when standing still facing left
  - `player-idle-right` - Played when standing still facing right

#### Sprite Direction Logic
The player's sprite direction updates based on the angle to the mouse cursor, dividing 360 degrees into four quadrants:
```javascript
// Right quadrant (315° to 45°)
if (degrees >= -45 && degrees < 45) {
    newDirection = this.directions.RIGHT;
} 
// Down quadrant (45° to 135°)
else if (degrees >= 45 && degrees < 135) {
    newDirection = this.directions.DOWN;
} 
// Left quadrant (135° to 225°)
else if ((degrees >= 135 && degrees <= 180) || (degrees >= -180 && degrees < -135)) {
    newDirection = this.directions.LEFT;
} 
// Up quadrant (225° to 315°)
else {
    newDirection = this.directions.UP;
}
```

#### Weapon Types
- **Minigun**
  - Fast fire rate (10ms)
  - Medium damage (30)
  - Yellow bullets
- **Shotgun**
  - Slow fire rate (40ms)
  - Multiple bullets per shot (10)
  - 30-degree spread
  - Orange bullets

#### Audio Integration

The Player class integrates with the SoundManager to play appropriate weapon sounds when shooting:

```javascript
// In Player.js - initSounds method
initSounds() {
    // Check if soundManager exists
    if (!this.scene.soundManager) {
        console.warn('SoundManager not found in scene. Weapon sounds will not be played.');
        return;
    }

    // Use the sound effects that have already been initialized by the scene
    if (this.gameMode === 'minigun') {
        this.soundKey = 'shoot_minigun';
    } else if (this.gameMode === 'shotgun') {
        this.soundKey = 'shoot_shotgun';
    }
}

// In the shoot method
playWeaponSound() {
    if (!this.scene.soundManager || !this.soundKey) return;
    
    try {
        const detune = Math.random() * 200 - 100;
        
        // Force unlock on first shot if needed
        if (!this.hasPlayedSound && this.scene.sound.locked) {
            this.scene.sound.unlock();
        }
        
        this.scene.soundManager.playSoundEffect(this.soundKey, { detune });
        this.hasPlayedSound = true;
    } catch (error) {
        console.warn('Error playing weapon sound:', error);
    }
}
```

---

### BaseEnemy Class

The base class for all enemy types in the game.

```javascript
class BaseEnemy {
  constructor(scene, x, y, fromPool);
  reset(x, y, options);                // Reset enemy for reuse from the pool
  initProperties();                    // Initialize enemy properties (override in subclasses)
  createVisuals(x, y);                 // Create visual representation
  setGroup(groupId);                   // Set enemy's group and apply modifiers
  setNeutral();                        // Convert enemy to neutral group, disabling AI and collisions
  update();                            // Update enemy position and behavior each frame
  moveTowardsPlayer(playerPos);        // Move the enemy towards the player
  takeDamage(damage);                  // Apply damage to the enemy
  die();                               // Handle enemy death
  
  // Player Collision Handling
  checkPlayerCollision(playerPos);     // Check for collisions with player and apply damage
                                       // Compatible with various health system implementations:
                                       // - scene.playerHealth.takeDamage()
                                       // - player.healthSystem.takeDamage()
                                       // - player.takeDamage()
  
  getScoreValue();                     // Get the score value for this enemy
  getType();                           // Get the enemy type
  getGroup();                          // Get the enemy group
  isBossEnemy();                       // Check if this is a boss enemy
}
```

BaseEnemy provides shared functionality for all enemy types, including:

- Health management
- Movement toward player
- Group assignment and modifiers
- Health bar display
- Player collision detection and damage application
- Death handling and event emission

---

## Scene Management

### `Boot` Scene (`Boot.js`)

Initial scene that loads minimal assets required for the preloader.

#### Methods
- `preload()` - Loads background image
- `create()` - Transitions to Preloader scene

### `Preloader` Scene (`Preloader.js`)

Handles loading of all game assets with a progress bar.

#### Methods
- `init()` - Sets up loading screen
- `preload()` - Loads all game assets
- `create()` - Transitions to MainMenu scene

#### Assets Loaded
- Game images (logo, background)
- Tilemap data
- Tileset images

### `MainMenu` Scene (`MainMenu.js`)

Game start screen with weapon selection options.

#### Methods
- `create()` - Sets up menu UI elements
- `changeScene(gameMode)` - Starts game with selected weapon mode
- `moveLogo(reactCallback)` - Animates logo (demo feature)

### `Game` Scene (`Game.jsx`)

Main gameplay scene handling game loop, entities, and mechanics.

#### Properties
- `gameMode` - Selected weapon type
- `enemySpawnRate` - Time between enemy spawns (decreases over time)
- `enemyList` - Array of active enemies
- `killCount` - Number of enemies defeated
- `survivalTime` - Time survived in seconds

#### Methods
- `init(data)` - Initializes scene with selected game mode
- `resetGameState()` - Resets game variables for new game
- `create()` - Sets up the map, player, and systems
- `setupMap()` - Creates and scales the game map
- `setupGameObjects()` - Creates player and entity groups
- `setupCamera()` - Configures camera to follow player
- `setupUI()` - Creates UI elements
- `setupInput()` - Sets up keyboard and mouse input
- `update(time, delta)` - Main game loop
- `updateGameTimers(delta)` - Updates time-based metrics
- `updateGameObjects()` - Updates player, bullets, enemies
- `updateBullets()` - Manages bullet movement and lifetime
- `updateEnemies()` - Manages enemy behavior
- `checkCollisions()` - Detects and handles collisions
- `spawnEnemy()` - Creates new enemy at appropriate position
- `spawnEnemyGroup()` - Creates group of 3-6 enemies together
- `spawnBoss()` - Creates boss enemy
- `updateDifficulty()` - Increases difficulty over time
- `playerDeath()` - Handles player death
- `setPauseState(isPaused, reason)` - Manages game pause functionality
- `togglePause()` - Toggles pause state
- `createEnemyDeathEffect(x, y)` - Visual effects for enemy death
- `createBossDeathEffect(x, y)` - Visual effects for boss death
- `showBossWarning()` - Displays boss warning message

### `GameOver` Scene (`GameOver.js`)

End screen showing game results and offering restart option.

#### Methods
- `init(data)` - Receives survival time and kill count
- `create()` - Sets up game over UI
- `changeScene()` - Returns to main menu

---

## UI Components

### `DebugPanel` Component (`DebugPanel.jsx`)

React component displaying real-time game metrics for development.

#### Props
- `gameRef` - Reference to the PhaserGame component

#### State
- `debugInfo` - Object containing current game metrics

#### Methods
- `updateDebugInfo()` - Updates displayed metrics
- `renderSection(title, children)` - Helper to render UI sections
- `renderInfoItem(label, value)` - Helper to render individual metrics

#### Displayed Information
- FPS
- Enemy count
- Bullet count
- Player position
- Mouse position
- Kill count
- Game mode
- Survival time

---

## Sound System

Handles audio playback for game events and background music.

### `SoundManager` Class (`sound/SoundManager.js`)

Centralized audio system that manages both background music and sound effects.

#### Properties
- `musicTracks` - Object storing all background music tracks
- `soundEffects` - Object storing all sound effects
- `currentMusic` - Reference to the currently playing music track
- `musicVolume` - Volume level for background music (0-1)
- `effectsVolume` - Volume level for sound effects (0-1)
- `isMuted` - Boolean flag for mute state

#### Methods
- `constructor(scene)` - Initializes sound manager for a specific scene
- `initBackgroundMusic(key, options)` - Registers a music track with options
- `playMusic(key, options)` - Plays a music track with optional crossfade
- `startNewMusic(key, fadeInDuration, delay)` - Starts new music with fade in
- `stopMusic(fadeOutDuration)` - Stops current music with optional fade out
- `pauseMusic()` - Pauses current music playback
- `resumeMusic()` - Resumes paused music
- `setMute(mute)` - Sets the mute state for all audio
- `toggleMute()` - Toggles between muted and unmuted states
- `setMusicVolume(volume)` - Sets volume level for all music tracks
- `setEffectsVolume(volume)` - Sets volume level for sound effects
- `initSoundEffect(key, options)` - Registers a sound effect with options
- `playSoundEffect(key, options)` - Plays a sound effect with options
- `hasSound(key)` - Checks if a sound effect exists in the manager
- `destroy()` - Cleans up all audio resources

#### Usage Example

```javascript
// Create sound manager in a scene
this.soundManager = new SoundManager(this);

// Register background music
this.soundManager.initBackgroundMusic('ambient_music', {
    volume: 0.4,
    loop: true
});

// Play music with fade in
this.soundManager.playMusic('ambient_music', {
    fadeIn: 2000  // 2 second fade in
});

// Register sound effect
this.soundManager.initSoundEffect('explosion', {
    volume: 0.7,
    rate: 1.2
});

// Check if a sound exists before playing
if (this.soundManager.hasSound('explosion')) {
    // Play sound effect with options
    this.soundManager.playSoundEffect('explosion', {
        detune: Math.random() * 200 - 100
    });
}
```

### Audio Pause Handling

The audio system has been enhanced with an improved implementation for handling background music when the game is paused:

```javascript
pauseMusic() {
    if (this.currentMusic) {
        // Store the current music state and position
        this._musicWasPlaying = this.currentMusic.isPlaying;
        
        if (this._musicWasPlaying) {
            // Store information needed to resume properly
            this._originalVolume = this.currentMusic.volume;
            this._musicKey = this._getMusicKeyByTrack(this.currentMusic);
            this._seekPosition = this.currentMusic.seek; // Store current position
            
            // Cancel any existing volume tweens to prevent conflicts
            this.scene.tweens.killTweensOf(this.currentMusic);
            
            // Stop the music completely
            this.currentMusic.stop();
            
            // For extra safety, directly pause the WebAudio node
            if (this.scene.sound.context && !this.scene.sound.context.suspended) {
                this.scene.sound.pauseAll();
            }
        }
    }
}

resumeMusic() {
    // Only resume if we specifically paused the music
    if (this._musicPaused && this._musicWasPlaying && this._musicKey) {
        // Resume the WebAudio context if it was suspended
        if (this.scene.sound.context && this.scene.sound.context.suspended) {
            this.scene.sound.resumeAll();
        }
        
        // Get the track and restart it from where it was paused
        const track = this.musicTracks[this._musicKey];
        if (track) {
            this.currentMusic = track;
            this.currentMusic.play({
                loop: true,
                volume: this._originalVolume || this.musicVolume,
                seek: this._seekPosition || 0
            });
        }
        
        // Clear the pause state
        this._musicPaused = false;
        this._musicWasPlaying = false;
        this._originalVolume = null;
        this._seekPosition = 0;
        this._musicKey = null;
    }
}
```

This implementation ensures that background music properly stops during game pause and resumes from the exact position when the game is unpaused:

1. **Position tracking**: The system now tracks the exact playback position when pausing
2. **WebAudio API integration**: Uses Phaser's lower-level audio APIs for more reliable control
3. **State management**: Properly manages state across pause/resume cycles
4. **Error handling**: Provides graceful fallbacks if tracks can't be found
5. **Tween cleanup**: Prevents volume tween conflicts when rapidly pausing/resuming

### Audio Implementation

#### Main Menu
The `MainMenu` scene initializes the ambient music that continues throughout the game:

1. **Scene Initialization Order**:
   ```javascript
   setupSoundManager() {
       this.soundManager = new SoundManager(this);
       this.soundManager.initBackgroundMusic('ambient_music', {
        volume: 0.3,
        loop: true
    });
    this.soundManager.playMusic('ambient_music', {
        fadeIn: 3000
    });}


2.  **The `Game` scene continues the ambient music and handles pausing during gameplay**: 

   ```javascript
   setupSoundManager() {
       this.soundManager = new SoundManager(this);
       
       // Initialize audio assets
       this.soundManager.initBackgroundMusic('ambient_music', {
           volume: 0.4,
           loop: true
       });
       
       this.soundManager.initSoundEffect('shoot_minigun', {
           volume: 0.5,
           rate: 1.0
       });
       
       this.soundManager.initSoundEffect('shoot_shotgun', {
           volume: 0.6,
           rate: 0.9
       });
       
       // Handle audio context locking
       if (this.sound.locked) {
           console.debug('Audio system is locked. Attempting to unlock...');
           this.sound.once('unlocked', () => {
               this.soundManager.playMusic('ambient_music', {
                   fadeIn: 2000
               });
           });
       } else {
           this.soundManager.playMusic('ambient_music', {
               fadeIn: 2000
           });
       }
   }
   ```

3. **Robust Sound Playback**:
   The SoundManager's `playSoundEffect` method includes comprehensive error handling to ensure reliable sound playback across browsers:

   ```javascript
   playSoundEffect(key, options = {}) {
       // On-demand initialization for missing sounds
       if (!this.soundEffects[key] && this.scene.cache.audio.exists(key)) {
           this.initSoundEffect(key, { volume: this.effectsVolume, rate: 1.0 });
       }

       // Handle locked audio context
       if (this.scene.sound.locked) {
           this.scene.sound.once('unlocked', () => {
               if (this.soundEffects[key]) {
                   this.soundEffects[key].play(options);
               }
           });
           this.scene.sound.unlock();
           return null;
       }
       
       // Safe playback with try/catch
       try {
           return this.soundEffects[key].play(options);
       } catch (error) {
           console.warn(`Error playing sound "${key}":`, error);
           return null;
       }
   }
   ```

These implementation details ensure that sounds play reliably across different browsers and handle common edge cases like audio context locking.

---

## Game Mechanics

### Weapon Systems

#### Minigun
- Fast firing rate (100 shots/sec)
- Lower damage per shot (30 damage)
- Good for consistent damage output
- Yellow projectiles
- Sound effect: rapid fire sound with slight pitch variation

#### Shotgun
- Slower firing rate (25 shots/sec)
- 10 projectiles per shot
- 30-degree spread pattern
- Higher burst damage (each pellet deals 20 damage)
- Good for close encounters
- Orange projectiles
- Sound effect: powerful blast with bass emphasis

### Enemy Spawning

Enemies spawn at increasing rates as the game progresses:

- **Endless Mode**:
  - Initial spawn rate: 2000ms
  - Minimum spawn rate: 500ms
  - Decrease: 50ms every 10 seconds

- **Wave-Based Mode**:
  - Calculated based on wave number: `baseEnemyCount * Math.pow(enemyCountGrowth, waveNumber - 1)`
  - Base enemy count: 5 enemies in wave 1
  - Growth factor: 1.2 (20% increase per wave)
  - Boss waves (every 10th wave) reduce regular enemy count by 40% to compensate for boss difficulty

### Collision System

The game uses simple circular collision detection:
- Player-Enemy: Game over when enemy touches player
- Bullet-Enemy: Damage applied to enemy

### Scoring System

Score is determined by:
- Survival time (in seconds)
- Kill count

---

## XP System

The XP (experience points) system manages player progression through levels, with enemies directly awarding XP when defeated.

### `XPManager` Class (`managers/XPManager.js`)

Manages the player's experience points, level, and level-up progression.

#### Properties
- `scene` - Reference to the Phaser scene
- `currentXP` - Current XP amount
- `currentLevel` - Current player level
- `baseXPRequirement` - Base XP required for the first level-up
- `levelMultiplier` - Multiplier for XP requirements per level
- `xpToNextLevel` - XP required to reach the next level

#### Methods
- `constructor(scene, initialXP, initialLevel, baseXPRequirement, levelMultiplier)` - Creates a new XP manager
- `calculateXPForLevel(level)` - Calculates XP required for a specific level
- `addXP(amount)` - Adds XP and handles level-up if threshold reached
- `levelUp()` - Increases level and recalculates XP requirements
- `emitXPUpdate()` - Emits event with current XP status
- `getXPProgress()` - Returns progress percentage towards next level (0-1)
- `getCurrentLevel()` - Returns current level
- `getCurrentXP()` - Returns current XP amount
- `getXPToNextLevel()` - Returns XP required for next level

#### XP Calculation Formula

The XP required for each level uses an exponential growth formula:
```javascript
xpRequired = baseXP * Math.pow(multiplier, level - 1)
```

For example, with default values (`baseXP = 100`, `multiplier = 1.2`):
- Level 1 to 2: 100 XP
- Level 2 to 3: 120 XP
- Level 3 to 4: 144 XP
- ...and so on with 20% increase per level

#### Events Emitted
- `xp-updated` - Emitted when XP changes, includes level, current XP, and XP required for next level
- `level-up` - Emitted when player levels up, includes new level and XP details

#### Usage Example
```javascript
// Initialize XP manager
this.xpManager = new XPManager(this);

// Add XP when enemy is defeated
this.xpManager.addXP(enemy.scoreValue);

// Listen for level-up events
EventBus.on('level-up', (data) => {
    console.log(`Player reached level ${data.level}!`);
    // Apply level-up rewards here
});
```

### XP Reward System

XP is awarded instantly when enemies are defeated, with the amount based on the enemy's score value.

#### XP Award Implementation
When an enemy is killed, XP is directly added to the player's total:
```javascript
// In onEnemyKilled method
if (this.xpManager && enemy && enemy.scoreValue) {
    // Calculate XP value based on enemy type and score
    const xpValue = enemy.scoreValue * this.xpMultiplier;
    
    // Award XP directly to the player
    this.xpManager.addXP(xpValue);
    
    // Play XP gain sound effect
    if (this.soundManager) {
        this.soundManager.playSoundEffect('xp_collect', {
            detune: 1200, // Higher pitch for XP collection
            volume: 0.3
        });
    }
}
```

#### Boss XP Rewards
Boss enemies award extra XP as a bonus when defeated:
```javascript
// Bosses give extra XP as a bonus
if (isBoss && this.xpManager && enemy && enemy.scoreValue) {
    const bonusXP = enemy.scoreValue * 0.8 * this.xpMultiplier;
    this.xpManager.addXP(bonusXP);
}
```

### UI Integration

The XP system integrates with the UI to show player progression:

#### XP Bar
The XP progress is displayed as a bar at the bottom of the screen, showing progress towards the next level.
```javascript
// In UIManager's updateXPUI method
updateXPUI(data) {
    const { level, xp, xpToNext } = data;
    
    // Update level text
    this.elements.levelText.setText(level.toString());
    
    // Update XP bar width based on progress
    const maxWidth = this.scene.cameras.main.width - 40;
    const progress = (xp / xpToNext) || 0;
    this.elements.xpBar.width = Math.max(0, maxWidth * progress);
    
    // Update XP text
    this.elements.xpText.setText(`${xp}/${xpToNext} XP`);
}
```

#### Level-Up Animation
When the player levels up, an animation is displayed:
```javascript
// In UIManager's showLevelUpAnimation method
showLevelUpAnimation(level) {
    // Create level-up text
    const levelUpText = this.scene.add.text(
        width / 2, height / 2, `LEVEL UP!\nLevel ${level}`,
        { 
            fontFamily: 'Arial', 
            fontSize: 48, 
            color: '#00ff99',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4
        }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(150);
    
    // Create particle effect
    // ...
    
    // Animate text appearance and fade out
    // ...
}
```

### XP Balancing

The XP system is balanced with the following considerations:

1. **XP Values**: Enemy XP values are tied to their score values, with more difficult enemies giving more XP
2. **Boss Rewards**: Boss enemies provide substantial XP rewards with an additional bonus (80% of their base value)
3. **Level Scaling**: XP requirements increase by 20% per level, creating a smooth progression curve
4. **XP Multiplier**: A global XP multiplier (`xpMultiplier`) can be adjusted for balancing

### Integration with Other Systems

The XP system integrates with several other game systems:

1. **Enemy Death**: The `onEnemyKilled` method directly awards XP when enemies are defeated
2. **Event System**: The EventBus is used to communicate XP updates and level-up events
3. **UI System**: The UIManager displays XP progress and level-up animations
4. **Sound System**: Sound effects play when gaining XP and leveling up

### Future Expansion

The XP system provides a foundation for additional progression features:

1. **Skill Points**: Awarding skill points on level-up for player upgrades
2. **Abilities**: Unlocking new abilities at specific level thresholds
3. **Player Stats**: Automatically increasing player stats (health, damage) with levels
4. **Equipment**: Unlocking better equipment options at higher levels

---

## Object Pooling System

### `GameObjectManager` Class (`managers/GameObjectManager.js`)

A centralized manager for object pooling that improves performance by recycling game objects instead of creating and destroying them repeatedly. This significantly reduces garbage collection overhead and improves game performance.

#### Properties
- `pools` - Object storing all active object pools by type
- `defaultConfigs` - Default configurations for different object types
- `stats` - Statistics for tracking pool usage

#### Methods
- `constructor(scene)` - Initializes the manager for a specific scene
- `createPool(type, createFunc, resetFunc, options)` - Creates a new object pool
- `populate(type, count)` - Adds a specific number of objects to a pool
- `get(type, ...args)` - Gets an object from a pool, creating new ones if needed
- `release(type, obj)` - Returns an object to its pool
- `getStats()` - Gets statistics about pool usage
- `destroy()` - Cleans up all pooled objects
- `updatePool(type, updateFunc)` - Updates all active objects in a pool

#### Usage Example

```javascript

// Create the global object manager
this.gameObjectManager = new GameObjectManager(this);

// Create a bullet pool
this.gameObjectManager.createPool('bullet',
    // Create function - called when a new bullet needs to be created
    () => {
        return this.add.circle(0, 0, 5, 0xffff00);
    },
    // Reset function - called when an object is retrieved from the pool
    (bullet, x, y, dirX, dirY, speed) => {
        bullet.setPosition(x, y);
        bullet.dirX = dirX;
        bullet.dirY = dirY;
        bullet.speed = speed;
    }
);

// Get a bullet from the pool
const bullet = this.gameObjectManager.get('bullet', x, y, dirX, dirY, speed);

// Release a bullet back to the pool when done
this.gameObjectManager.release('bullet', bullet);
```

### `SpritePool` Class (`entities/SpritePool.js`)

A specialized pool for managing sprite objects like death effects and XP pickups, which integrates with the GameObjectManager for efficient sprite recycling.

#### Properties
- `scene` - Reference to the Phaser scene
- `gameObjectManager` - Reference to the GameObjectManager
- `sprites` - Array of active sprites
- `options` - Configuration options for the pool

#### Methods
- `constructor(scene, options = {})` - Creates a new sprite pool with customizable options
- `initPool()` - Initializes the sprite pool with the GameObjectManager
- `createSprite(x, y, options = {})` - Creates a new sprite from the pool
- `createDeathEffect(x, y, options = {})` - Creates a death effect sprite
- `createXPPickup(x, y, options = {})` - Creates an XP pickup sprite
- `releaseSprite(sprite)` - Returns a sprite to the pool
- `update(time, delta)` - Updates all active sprites, handling movement and lifespans
- `checkCollision(x, y, radius, onCollect)` - Checks for collisions with collectible sprites

#### Death Effects

The SpritePool efficiently manages death effects that previously used Phaser's particle system:

- Uses pooled sprites instead of particle emitters for better control
- Configurable properties like color, scale, rotation, and velocity
- Automatic lifespan management and cleanup
- Integration with tweens for fade-out effects

```javascript
// Example: Creating a death effect
spritePool.createDeathEffect(enemy.x, enemy.y, {
    scale: 0.6,
    tint: 0xFF0000,
    lifespan: 1000
});
```

#### XP Collection System

The SpritePool provides built-in support for the XP collection system:

- Enemy deaths can spawn collectible XP items
- XP items have physics properties, including gravity and bounce
- Player can collect XP by moving close to them
- Configurable value, appearance, and behavior

```javascript
// Example: Creating an XP pickup when enemy dies
spritePool.createXPPickup(enemy.x, enemy.y, {
    value: enemy.xpValue,
    tint: 0x00FF66,
    scale: 0.5
});

// Example: Checking for XP collection in player update
this.scene.spritePool.checkCollision(
    this.x, 
    this.y, 
    40, // Collection radius
    (xpSprite) => {
        // Increase player XP
        this.addXP(xpSprite.customData.value);
        // Play collection sound
        this.scene.soundManager.playSoundEffect('xp_collect');
    }
);
```

---

## Wave-Based Game Mode

### Overview

The Wave-Based Game Mode is a structured survival mode with 40 progressively difficult waves. Each wave spawns a growing number of enemies, with every 10th wave featuring a boss enemy. Players must manually trigger each new wave after a short pause. If the player dies, the game resets to wave 1.

### Key Classes

#### `WaveManager` Class (`managers/WaveManager.js`)

Manages wave progression, enemy spawning, and wave state transitions.

##### Properties
- `currentWave` - Current wave number (1-40)
- `maxWaves` - Total number of waves (40)
- `isPaused` - Whether the game is in pause phase between waves
- `isWaveActive` - Whether a wave is currently active
- `activeEnemies` - Array of currently active enemies
- `waveConfig` - Configuration for wave difficulty scaling
- `enemyTypeRegistry` - Registry of enemy types available per wave

##### Methods
- `constructor(scene, options)` - Creates wave manager with custom options
- `init(uiManager)` - Initializes manager with UI reference
- `reset()` - Resets to initial state (wave 0)
- `startNextWave()` - Starts the next wave
- `spawnWaveEnemies(enemyCount, isBossWave)` - Spawns enemies for current wave
- `spawnEnemy()` - Spawns a single enemy
- `spawnBoss()` - Spawns a boss enemy
- `update()` - Updates wave state each frame
- `onWaveCompleted()` - Handles wave completion 
- `onFinalWaveCompleted()` - Handles completion of all waves
- `registerEnemy(enemy)` - Registers an enemy for tracking
- `unregisterEnemy(enemy)` - Unregisters an enemy from tracking
- `clearRemainingEnemies()` - Clears all active enemies
- `getCurrentWave()` - Returns the current wave number
- `isBossWave()` - Returns whether current wave is a boss wave
- `isInPausePhase()` - Returns whether in pause phase between waves
- `getActiveEnemyCount()` - Returns number of active enemies
- `calculateEnemyCountForWave(waveNumber)` - Calculates enemies for a specific wave

##### Wave Structure
- **Waves 1-9**: Mild exponential growth in enemy count
- **Wave 10**: First boss wave with mini-boss and minions
- **Waves 11-19**: Higher difficulty curve with more enemy types
- **Wave 20**: Second boss wave with tougher mini-boss
- **Waves 21-29**: Sharp exponential growth in enemy count
- **Wave 30**: Third boss wave with mini-boss and more minions
- **Waves 31-39**: Maximum difficulty scaling with floods of enemies
- **Wave 40**: Final boss wave with endgame challenge

#### `UIManager` Class (`managers/UIManager.js`)

Manages all UI elements for the game, including wave information and player controls.

##### Properties
- `elements` - Object containing all UI element references
- `width/height` - Screen dimensions for UI positioning
- `scene` - Reference to the Phaser scene

##### Methods
- `constructor(scene)` - Creates UI manager for a specific scene
- `init(options)` - Initializes all UI elements
- `createWaveInfo()` - Creates wave counter display
- `createPlayerHealth()` - Creates health bar display
- `createScoreDisplay()` - Creates score display
- `createNextWaveButton()` - Creates button to trigger next wave
- `createWaveBanner()` - Creates banner for wave notifications
- `showNextWaveButton()` - Shows the next wave button
- `hideNextWaveButton()` - Hides the next wave button
- `updateWaveUI(currentWave, maxWaves)` - Updates wave information display
- `updateHealthUI(current, max)` - Updates health bar display
- `updateScoreUI(score)` - Updates score display
- `showWaveStartBanner(waveNumber, isBossWave)` - Shows wave start notification
- `showWaveCompleteUI()` - Shows wave complete notification
- `showVictoryUI()` - Shows victory screen when all waves complete
- `showGameOverUI()` - Shows game over screen when player dies
- `onNextWaveButtonClicked()` - Handles next wave button click
- `update()` - Updates UI elements each frame

#### `PlayerHealth` Class (`entities/PlayerHealth.js`)

Manages player's health, damage, and death handling.

##### Properties
- `maxHealth` - Maximum player health points
- `currentHealth` - Current player health points
- `hitDamage` - Standard damage from enemy hits
- `isInvulnerable` - Whether player is temporarily invulnerable
- `invulnerabilityTime` - Duration of invulnerability after hit

##### Methods
- `constructor(scene, options)` - Creates health manager for player
- `takeDamage(amount)` - Applies damage to player
- `setInvulnerable()` - Makes player temporarily invulnerable
- `showDamageEffect()` - Shows visual feedback when damaged
- `onDeath()` - Handles player death
- `showDeathAnimation()` - Shows death animation effect
- `heal(amount)` - Heals the player
- `reset()` - Resets health to maximum
- `getHealthPercent()` - Returns health as percentage
- `getInvulnerable()` - Returns invulnerability state

#### `WaveGame` Scene (`scenes/WaveGame.jsx`)

Main scene for the wave-based game mode that integrates all components.

##### Properties
- `gameTime` - Tracks game time for difficulty scaling
- `killCount` - Number of enemies defeated
- `regularKillCount` - Number of regular enemies killed
- `bossesKilled` - Number of boss enemies killed
- `weaponType` - Selected weapon type
- `isPaused` - Whether game is paused
- `isGameOver` - Whether game is over

##### Methods
- `constructor()` - Initializes wave game scene
- `init(data)` - Sets up initial game state
- `resetGameState()` - Resets game variables for new game
- `create()` - Sets up all game systems
- `setupMap()` - Creates and configures the game map
- `setupSoundManager()` - Sets up sound system
- `setupObjectManager()` - Sets up object pooling system
- `setupUIManager()` - Sets up UI elements
- `setupWaveManager()` - Sets up wave management system
- `setupGameObjects()` - Creates player and other entities
- `setupCamera()` - Configures camera to follow player
- `setupInput()` - Sets up keyboard and mouse input
- `onWaveStart(data)` - Handles wave start event
- `onWaveComplete(data)` - Handles wave completion event
- `onVictory()` - Handles completion of all waves
- `setPauseState(isPaused, reason)` - Manages game pause state
- `update(time, delta)` - Main update loop
- `updateGameTimers(delta)` - Updates time-based metrics
- `updateGameObjects()` - Updates player, bullets, enemies
- `checkCollisions()` - Detects and handles collisions
- `playerDeath()` - Handles player death

### Game Flow

The wave-based game follows this flow:

1. **Game Start**
   - Player selects Wave Mode from main menu
   - WaveGame scene loads with wave 0
   - Player must press "Start Next Wave" button to begin

2. **Wave Active Phase**
   - WaveManager spawns enemies according to wave number
   - Player fights enemies until all are defeated
   - Wave ends when all enemies are eliminated

3. **Pause Phase**
   - Between waves, game enters pause phase
   - Player can catch breath and prepare
   - "Next Wave" button appears for player to trigger next wave

4. **Boss Waves**
   - Every 10th wave (10, 20, 30, 40) is a boss wave
   - Boss waves feature a stronger boss enemy plus regular enemies
   - Special banner appears with warning message

5. **Victory**
   - If player defeats all 40 waves, victory screen appears
   - Shows total score and kill count
   - Player can replay from main menu

6. **Game Over**
   - If player dies, game over screen appears
   - Shows wave reached and kill count
   - Player can restart from main menu

### Enemy Difficulty Scaling

Enemy count per wave increases exponentially:
```javascript
enemyCount = Math.floor(baseEnemyCount * Math.pow(enemyCountGrowth, waveNumber - 1));
```

- Base enemy count starts at 5
- Default growth factor is 1.2 (20% increase per wave)
- Boss waves reduce regular enemy count by 40%

### Player Health System

The player health system is balanced for the wave mode:
- Default health is 100 points
- Default damage from enemies is 34 points per hit
- This results in player death after 3 hits
- Player flashes red when damaged
- Brief invulnerability period after taking damage

### UI Elements

The wave mode includes specialized UI elements:

1. **Wave Counter** - Shows current wave and total waves
2. **Player Health Bar** - Shows current health percentage
3. **Score Display** - Shows total kill count
4. **Wave Banner** - Displays wave start/complete messages
5. **Next Wave Button** - Allows player to start next wave
6. **Game Over Screen** - Shows final statistics when player dies
7. **Victory Screen** - Shows completion statistics when all waves defeated

### Integration with Existing Systems

The wave mode integrates with existing game systems:

1. **ObjectPooling** - Reuses EnemyManager and BulletPool for efficient object management
2. **Sound System** - Uses SoundManager for ambient music and sound effects
3. **Mapping** - Leverages the MapManager for map generation and management
4. **Player Control** - Uses the same Player class and controls as the regular mode

### Configurable Options

The wave system is highly configurable:

```javascript
this.waveManager = new WaveManager(this, {
    maxWaves: 40,
    baseEnemyCount: 5,
    enemyCountGrowth: 1.2,
    minSpawnDelay: 500,
    maxSpawnDelay: 3000,
    spawnDelayReduction: 50,
    bossWaveInterval: 10
});
```

These options can be easily adjusted for balance tweaking or to create alternative wave modes with different difficulty curves.

---

## Mapping System

### `TileMapManager` Class (`mapping/TileMapManager.js`)

A centralized manager for handling tilemaps, including loading, switching, and procedural generation.

#### Properties
- `scene` - Reference to the Phaser scene
- `mapConfigs` - Configuration for all available maps
- `currentMap` - Reference to the active tilemap
- `layers` - Object storing references to all map layers
- `dimensions` - Dimensions of the current map
- `tileset` - Reference to the active tileset

#### Methods
- `constructor(scene)` - Initializes the manager for a specific scene
- `preloadMaps()` - Preloads all configured maps
- `createMapFromTiled(key, options)` - Creates a map from Tiled JSON data
- `createMapFromArray(data, tilesetKey, options)` - Creates a map from a 2D array
- `generateSequentialMap(width, height)` - Generates a sequential map for testing
- `switchMap(key, options)` - Switches to a new map
- `getAvailableMaps()` - Returns a list of all available maps
- `getMapDimensions()` - Returns dimensions of the current map
- `destroy()` - Cleans up all map resources

#### Usage Example

```javascript
// In Preloader scene
preload() {
    // Initialize manager
    this.tileMapManager = new TileMapManager(this);
    
    // Preload all configured maps
    this.tileMapManager.preloadMaps();
}

// In MainMenu scene
create() {
    // Get available maps for selection
    this.tileMapManager = new TileMapManager(this);
    const maps = this.tileMapManager.getAvailableMaps();
    
    // Create UI elements to let user select maps
    // ... 
}

// In Game scene
setupMap() {
    // Create the map with options
    const mapData = this.tileMapManager.createMapFromTiled(this.selectedMap, {
        scale: 1.5,
        setCollision: false
    });
    
    // Store references to map components
    this.map = mapData.map;
    this.groundLayer = mapData.layers["Tile Layer 1"];
    this.tileset = mapData.tileset;
    
    // Set physics world bounds based on map dimensions
    this.physics.world.setBounds(0, 0, mapData.dimensions.width, mapData.dimensions.height);
}

// Switch maps during gameplay
changeLevel() {
    this.tileMapManager.switchMap('new_map_key', {
        scale: 1.5,
        setCollision: true,
        collisionIndices: [5, 6, 7, 8]
    });
}
```

#### Map Generation Functionality
The TileMapManager can also generate maps programmatically:

```javascript
// Generate a sequential map (useful for testing)
const levelData = this.tileMapManager.generateSequentialMap(24, 24);

// Create a tilemap from the generated data
const mapData = this.tileMapManager.createMapFromArray(levelData, 'tileset_key', {
    tileWidth: 32,
    tileHeight: 32
});
```

#### Map Switching with EventBus
Maps can be switched through the EventBus system:

```javascript
// Request a map switch from anywhere in the application
EventBus.emit('request-map-switch', {
    key: 'green_arena',
    scale: 1.2,
    setCollision: true,
    collisionIndices: [1, 2, 3]
});
```

The Game scene listens for this event and handles the map switching process.

#### Error Handling and Fallback Mechanisms

The TileMapManager includes several layers of error handling to ensure maps load correctly even with problematic Tiled files:

```javascript
// Multiple fallback approaches for tileset loading
try {
    // Standard approach
    tileset = this.currentMap.addTilesetImage(config.tilesetName, config.tilesetKey);
} catch (tilesetError) {
    // Alternative approach using map tilesets directly
    const matchingTileset = tiledTilesets.find(ts => ts.name === config.tilesetName);
    tileset = this.currentMap.addTilesetImage(
        matchingTileset.name, 
        config.tilesetKey,
        matchingTileset.tileWidth || 32,
        matchingTileset.tileHeight || 32
    );
}
```

**Robust Layer Creation**

For problematic tilemaps that cause index errors, the system uses a three-tiered approach:
1. Standard layer creation via `createLayer()`
2. If that fails, attempt manual layer creation with `createBlankLayer()` and populate it
3. As a last resort, generate a completely new procedural map

This ensures the game will always have a playable map, even when loading malformed tilemap data.

#### Handling External Tileset References

The manager properly handles both embedded tilesets and external tileset references (TSX files) by:

1. Reading the tileset properties directly from the map data
2. Applying appropriate first GID offsets to tile indices
3. Supporting manual tile placement when standard methods fail

This makes the system compatible with various Tiled export formats and workflows.

### Adding New Maps to the Game

Adding a new map to the game involves several steps:

#### 1. Prepare Map Assets

1. Create your Tiled map (.json) file and tileset image (.png)
2. Place these files in the appropriate directories:
   - Map JSON: `public/assets/` or `public/assets/tileMaps/`
   - Tileset image: `public/assets/` or `public/assets/tileMaps/`

#### 2. Update Preloader.js

In `src/game/scenes/Preloader.js`, ensure the TileMapManager is initialized and configured:

```javascript
init() {
    // Initialize TileMapManager
    this.tileMapManager = new TileMapManager(this);
}

preload() {
    // ...existing preload code...
    
    // Load all maps using the TileMapManager
    this.tileMapManager.preloadMaps();
    
    // ...remaining preload code...
}
```

#### 3. Add Map Configuration to TileMapManager

In `src/game/mapping/tileMapManager.jsx`, add your new map to the `mapConfigs` object:

```javascript
this.mapConfigs = {
    // ...existing maps...
    
    'new_map_key': {
        key: 'new_map_json_key',
        tilesetKey: 'new_map_tileset_key',
        tilesetName: 'tileset_name_in_json',
        path: 'assets/tileMaps/new_map.json',
        tilesetImagePath: 'assets/tileMaps/new_map_tileset.png',
        primaryLayerName: 'main_layer_name' // The primary layer name in your Tiled map
    }
};
```

#### 4. Update Game.jsx

In `src/game/scenes/Game.jsx`, update the `setupMap` method (around lines 102-103) to properly handle the primary layer name from your map configuration:

```javascript
// Get the correct primary layer name from the config
const mapConfig = this.tileMapManager.mapConfigs[this.selectedMap];
const primaryLayerName = mapConfig?.primaryLayerName || "Tile Layer 1";

// First try to get the primary layer from config
if (mapData.layers[primaryLayerName]) {
    this.groundLayer = mapData.layers[primaryLayerName];
    if (this.isDev) console.debug(`Using primary layer: ${primaryLayerName}`);
} 
// Fall back to first available layer if primary not found
else {
    const layerNames = Object.keys(mapData.layers);
    if (layerNames.length > 0) {
        const firstLayerName = layerNames[0];
        console.warn(`Primary layer '${primaryLayerName}' not found, using '${firstLayerName}' instead`);
        this.groundLayer = mapData.layers[firstLayerName];
    }
}
```

#### 5. Update MainMenu.js (Optional)

If you want to make the new map selectable from the main menu, update the MainMenu scene to include the new map option.

#### Example: Complete Map Addition Workflow

Here's a complete example workflow for adding a new desert-themed map:

1. **Add files**:
   - Add `desert_map.json` to `public/assets/tileMaps/`
   - Add `desert_tileset.png` to `public/assets/tileMaps/`

2. **Configure in TileMapManager**:
   ```javascript
   'desert_arena': {
       key: 'desert_map',
       tilesetKey: 'desert_tileset',
       tilesetName: 'desert',
       path: 'assets/tileMaps/desert_map.json',
       tilesetImagePath: 'assets/tileMaps/desert_tileset.png',
       primaryLayerName: 'Desert_Ground'
   }
   ```

3. **Verify Game.jsx** handles the primary layer name correctly on lines 102-103

4. **Run and test** the game to ensure the map loads properly

#### Troubleshooting Common Map Issues

1. **"Failed to load map" error**:
   - Check that the map JSON path is correct
   - Ensure the tileset image path is correct
   - Verify JSON validity with a JSON validator

2. **"Cannot access property X" error**:
   - This typically means the layer's tile indices don't match the tileset
   - Verify that the firstgid in your tileset configuration matches what's in the map JSON

3. **"This.groundLayer is null" error**:
   - Ensure the primaryLayerName matches exactly what's in your Tiled map
   - Check the Game.jsx code to ensure it properly handles layer name lookup

---

## Enemy Registry System

### `EnemyRegistry` Class (`managers/EnemyRegistry.js`)

A centralized registry for all enemy types in the game that provides a single source of truth for enemy configurations and factory methods.

#### Properties
- `scene` - Reference to the Phaser scene
- `enemyConstructors` - Map of enemy type IDs to their constructor classes
- `enemyConfigs` - Map of enemy type IDs to their default configurations
- `poolOptions` - Map of enemy type IDs to their pooling options

#### Methods
- `constructor(scene)` - Creates a new enemy registry for a scene
- `registerDefaultEnemies()` - Registers all built-in enemy types
- `registerEnemyType(typeId, Constructor, config, poolOptions)` - Registers a new enemy type
- `getConstructor(typeId)` - Gets the constructor for a specific enemy type
- `getConfig(typeId)` - Gets the configuration for a specific enemy type
- `getPoolOptions(typeId)` - Gets pooling options for a specific enemy type
- `createEnemy(typeId, x, y, fromPool, overrideConfig)` - Creates an enemy instance
- `getRegisteredTypes()` - Gets all registered enemy type IDs
- `getEnemyTypeSummary()` - Gets summary information about all enemy types

#### Usage Example

```javascript
// Access the enemy registry from the EnemyManager
const registry = this.scene.enemyManager.enemyRegistry;

// Get all available enemy types
const enemyTypes = registry.getRegisteredTypes(); // ['enemy1', 'enemy2', 'enemy3', 'boss1']

// Get configuration for a specific enemy type
const enemy2Config = registry.getConfig('enemy2');
console.log(`Enemy2 health: ${enemy2Config.health}`); // "Enemy2 health: 20"

// Create an enemy instance directly (without pooling)
const boss = registry.createEnemy('boss1', 500, 300, false);

// Register a custom enemy type
class CustomEnemy extends BaseEnemy {
    // Custom enemy implementation
}

registry.registerEnemyType('custom_enemy', CustomEnemy, {
    speed: 1.0,
    size: 25,
    color: 0xff00ff,
    health: 50
}, {
    initialSize: 5,
    maxSize: 20
});
```

### Integration with `EnemyManager`

The EnemyRegistry is integrated with the EnemyManager, which handles the creation and management of enemy instances using object pooling.

#### Updated EnemyManager Methods
- `constructor(scene, options)` - Now creates an EnemyRegistry instance
- `initializePools(options)` - Uses the registry to set up pools for all enemy types
- `registerEnemyType(typeId, Constructor, config, poolOptions)` - Registers a new enemy type with both registry and pool
- `spawnEnemy(type, x, y, options)` - Spawns an enemy of the specified type
- `hasEnemyType(typeId)` - Checks if an enemy type is registered
- `getEnemyTypeInfo(typeId)` - Gets information about a specific enemy type
- `getAvailableEnemyTypes()` - Gets all available enemy type IDs

### Enemy Types

The game includes several enemy types with distinct behaviors:

#### Enemy1 (Green)
- **Behavior**: Fast but weak enemies that chase the player with zigzag movement
- **Stats**:
  - Speed: 0.7
  - Health: 10
  - Damage: 30
  - Score Value: 10

#### Enemy2 (Blue)
- **Behavior**: Slower but tougher enemies with a dash attack
- **Stats**: 
  - Speed: 0.4
  - Health: 20
  - Damage: 40
  - Score Value: 25
  - Dash Speed: 2.0
  - Dash Cooldown: 5000ms

#### Enemy3 (Orange)
- **Behavior**: Ranged enemies that maintain distance and shoot projectiles
- **Stats**:
  - Speed: 0.3
  - Health: 15
  - Damage: 20
  - Score Value: 20
  - Attack Range: 350
  - Preferred Range: 250
  - Attack Cooldown: 2000ms

#### Boss1 (Red)
- **Behavior**: Powerful boss with multiple attack patterns and health bar
- **Stats**:
  - Speed: 0.3
  - Health: 10000
  - Damage: 5
  - Score Value: 500
  - Attack Patterns: Orbit, Charge, Summon

### Adding New Enemy Types

To add a new enemy type:

1. Create a new enemy class extending BaseEnemy
```javascript
// src/game/entities/NewEnemy.js
import { BaseEnemy } from './BaseEnemy';

export class NewEnemy extends BaseEnemy {
    constructor(scene, x, y, fromPool = false) {
        super(scene, x, y, fromPool);
        this.type = 'new_enemy';
    }
    
    initProperties() {
        // Define enemy properties
        this.speed = 0.6;
        this.size = 16;
        this.color = 0xff00ff;
        this.health = 25;
        this.baseHealth = 25;
        this.damage = 35;
        this.scoreValue = 30;
    }
    
    // Override movement or add custom behavior
    moveTowardsPlayer(playerPos) {
        // Custom movement implementation
    }
}
```

2. Register the enemy type with the EnemyRegistry
```javascript
// In src/game/managers/EnemyRegistry.js
import { NewEnemy } from '../entities/NewEnemy';

// In registerDefaultEnemies() method, add:
this.registerEnemyType('new_enemy', NewEnemy, {
    speed: 0.6,
    size: 16,
    color: 0xff00ff,
    health: 25,
    damage: 35,
    scoreValue: 30
}, {
    initialSize: 10,
    maxSize: 50,
    growSize: 3
});
```

3. Use the enemy in your game
```javascript
// In game scene
const enemyPosition = this.getRandomSpawnPosition();
this.enemyManager.spawnEnemy('new_enemy', enemyPosition.x, enemyPosition.y);
```

### Benefits of the EnemyRegistry

1. **Centralized Management**: All enemy types are defined in one place
2. **Type Safety**: Prevents typos in enemy type strings
3. **Configuration**: Easy adjustment of enemy properties
4. **Documentation**: Self-documenting system for enemy types
5. **Extensibility**: Simple process for adding new enemy types
6. **Integration**: Works seamlessly with the object pooling system

---

## Enemy Grouping & Chaos System

The Enemy Grouping system organizes enemies into logical factions with different behaviors and statistics, while the Chaos system provides a global game state that affects gameplay dynamics.

### GroupManager Class (`managers/GroupManager.js`)

Manages enemy groups, tracking counts and applying modifiers based on faction.

#### Properties
- `scene` - Reference to the Phaser scene
- `counts` - Object tracking enemy counts by group
- `enemiesByGroup` - Object containing arrays of enemies by group
- `modifiers` - Group-specific stat modifiers

#### Methods
- `constructor(scene)` - Initializes the group manager for a scene
- `register(enemy, groupId)` - Register an enemy with a specific group
- `deregister(enemy, groupId)` - Deregister an enemy from its group
- `getGroupCount(groupId)` - Get count of enemies in a specific group
- `getAllGroupCounts()` - Get all group counts
- `applyModifiers(enemy, groupId)` - Apply group-specific modifiers to an enemy
- `getNextSpawnGroup()` - Get the next group that should spawn (maintains balance)
- `getTotalCount()` - Get total count of all enemies across groups
- `getGroupPercentage(groupId)` - Get percentage of enemies in a specific group
- `getGroupColor(groupId)` - Get color associated with a group

#### Group Types (GroupId Enum)
- `AI` - Artificial Intelligence faction (red)
- `CODER` - Programmer faction (blue)
- `NEUTRAL` - Neutralized enemies (green)

#### Usage Example
```javascript
// Register an enemy with the AI group
this.scene.groupManager.register(enemy, GroupId.AI);

// Get the next group to spawn (for balanced spawning)
const nextGroup = this.scene.groupManager.getNextSpawnGroup();

// Apply group modifiers to an enemy
const modifiers = this.scene.groupManager.applyModifiers(enemy, GroupId.CODER);
```

### ChaosManager Class (`managers/ChaosManager.js`)

Manages a global chaos value that affects gameplay and represents the balance between factions.

#### Properties
- `scene` - Reference to the Phaser scene
- `chaos` - Current chaos value (-100 to 100)
- `defaultChaos` - Starting chaos value
- `autoAdjust` - Whether chaos auto-adjusts based on group balance
- `options` - Configuration options

#### Methods
- `constructor(scene, options)` - Creates a new chaos manager
- `getChaos()` - Get current chaos value (-100 to 100)
- `getNormalizedChaos()` - Get normalized chaos value (0-1)
- `getPolarity()` - Get chaos polarity (-1, 0, or 1)
- `getAbsoluteChaos()` - Get absolute chaos value (0-100)
- `getChaosPercentage()` - Get chaos as percentage with sign (+/-%)
- `setChaos(value, emitEvent)` - Set chaos to specific value
- `adjustChaos(amount, emitEvent)` - Adjust chaos by relative amount
- `setAutoAdjust(enabled)` - Enable/disable auto-adjustment of chaos
- `update(time, delta)` - Update chaos based on group balance
- `reset()` - Reset chaos to default value

#### Usage Example
```javascript
// Get current chaos value
const chaosValue = this.scene.chaosManager.getChaos();

// Adjust chaos when an AI enemy is defeated
this.scene.chaosManager.adjustChaos(-5);

// Check if chaos is heavily favoring CODER faction
if (this.scene.chaosManager.getPolarity() < -0.5) {
    // Spawn more AI enemies to balance
}
```

### BaseEnemy Integration

The `BaseEnemy` class has been updated with group-related properties and methods:

#### New Properties
- `groupId` - Current group ID (AI, CODER, or NEUTRAL)
- `_targetingDisabled` - Whether AI targeting is disabled
- `_collisionDisabled` - Whether player collision is disabled

#### New Methods
- `setGroup(groupId)` - Set enemy's group and apply modifiers
- `getGroup()` - Get enemy's current group
- `setNeutral()` - Set enemy to neutral group and modify behavior

#### Neutralization System

The `setNeutral()` method provides a complete neutralization API:
- Sets enemy to the NEUTRAL group
- Disables AI targeting of the player
- Disables collision with the player
- Applies visual indicator (transparency)
- Emits event for other systems to react

### Game Flow Integration

The grouping and chaos systems integrate with other game systems:

1. **Enemy Creation**: When an enemy is created, it's assigned to either AI or CODER group
2. **Wave Spawning**: The `WaveManager` uses `GroupManager.getNextSpawnGroup()` to maintain balance
3. **Enemy Death**: When an enemy dies, chaos is adjusted based on its group
4. **UI Display**: Group counts and chaos level are displayed in the game UI
5. **Game Balance**: Chaos affects gameplay mechanics like enemy speed, damage, and spawn rates

### Chaos Effects on Gameplay

The chaos value affects various gameplay elements:

1. **Enemy Stats**: Enemies get stat bonuses based on chaos polarity
2. **Spawn Rates**: Higher chaos values increase spawn rates for the dominant faction
3. **Player Effects**: Extreme chaos values can affect player movement and weapon effectiveness
4. **Visual Feedback**: UI elements change color based on chaos polarity
5. **Special Events**: Extreme chaos can trigger special events or enemy behaviors

The UI displays chaos polarity using color-coding:
- Positive values: Red (increasing intensity with value)
- Negative values: Blue (increasing intensity with absolute value)
- Zero: Green (neutral)

---

## Development Guidelines

### Adding a New Enemy Type

1. Extend the Enemy class with your new enemy type
2. Override `initProperties()` to set specific attributes
3. Add spawn logic in Game.jsx's enemy spawning system
4. Add collision detection if needed

### Implementing a New Weapon

1. Add a new weapon type in MainMenu.jsx UI
2. Extend Player.js `initWeaponProperties()` for the new weapon
3. Create a custom bullet creation method
4. Add weapon-specific effects if needed

### Creating a New Power-Up

1. Create a new class for the power-up
2. Add spawn logic in Game.jsx
3. Implement collision detection with player
4. Add effect application to player properties

### Debugging Tips

1. Use the Debug Panel to monitor game state
2. Add temporary visual indicators for hitboxes during development
3. Use `console.log()` with descriptive tags for tracking specific systems
4. Test performance with different enemy counts to find bottlenecks

---

## Asset Management

### Required Assets

- `logo.png` - Game logo
- `bg.png` - Background image
- `scifi_tiles.png` - Tileset for the map
- `map.json` - Tilemap data
- `favicon.png` - Browser tab icon
- `particle_texture.png` - Texture for particle effects

---

## Troubleshooting

### Audio Issues

#### Weapon Sounds Not Playing

If weapon sounds aren't playing on initial scene load but work after reloading:

1. **Check initialization order**:
   - SoundManager must be initialized before Player objects are created
   - Check the sequence in Game.jsx's `create()` method

2. **Audio context locking**:
   - Many browsers require user interaction before playing sounds
   - The SoundManager includes unlocking logic to handle this
   - If sounds still don't play, ensure the unlock mechanism is working:
   ```javascript
   if (this.scene.sound.locked) {
       this.scene.sound.unlock();
   }
   ```

3. **Debugging audio issues**:
   - Check the browser console for warnings from SoundManager
   - Verify that audio assets are properly loaded in Preloader.js
   - Test with different browsers to isolate browser-specific issues

#### Background Music Issues

If background music isn't playing or cuts out unexpectedly:

1. **Check for pause states**:
   - The game automatically pauses music when the game is paused
   - Verify that `resumeMusic()` is called when unpausing

2. **Multiple music tracks**:
   - The SoundManager handles crossfading between tracks
   - Ensure only one music track is playing at a time

3. **Audio format support**:
   - Different browsers support different audio formats
   - Consider providing both MP3 and OGG versions of audio files

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
