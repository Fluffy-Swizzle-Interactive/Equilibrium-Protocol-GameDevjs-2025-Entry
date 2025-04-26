# Wave Game Mode

## Overview

This document describes the wave-based game mode in Fluffy-Swizz Interactive, including wave mechanics, progression, and implementation details.

## Core Concepts

The wave game mode provides a structured gameplay experience with defined waves of enemies. Unlike the endless survival mode, wave mode has a clear beginning and end, with specific enemy compositions for each wave.

### Key Features

- Fixed number of waves (typically 20)
- Predefined enemy types and counts for each wave
- Break periods between waves
- Boss encounters at milestone waves
- Victory condition upon completing all waves

## Implementation

### Wave Manager

The wave system is managed by the `WaveManager` class.

#### `WaveManager.js`

**Methods:**
- `constructor(scene)` - Initializes the wave manager
- `init(options)` - Sets up with configuration options
- `startWave(waveNumber)` - Starts a specific wave
- `endWave()` - Ends the current wave
- `completeAllWaves()` - Handles victory when all waves are completed
- `getWaveConfig(waveNumber)` - Gets configuration for a specific wave
- `spawnEnemiesForWave(waveNumber)` - Spawns enemies based on wave config
- `spawnBoss(bossType)` - Spawns a boss enemy
- `getCurrentWave()` - Returns the current wave number
- `getTotalWaves()` - Returns the total number of waves
- `getRemainingEnemies()` - Returns count of remaining enemies
- `update(time, delta)` - Updates wave system each frame

**Properties:**
- `scene` - Reference to the current scene
- `currentWave` - Current wave number
- `totalWaves` - Total number of waves
- `waveConfigs` - Configuration for each wave
- `waveState` - Current state (preparing, active, complete)
- `enemiesRemaining` - Number of enemies left in current wave
- `waveStartTime` - When the current wave started
- `breakBetweenWaves` - Whether to pause between waves

### Wave Scene

The wave mode is implemented in its own scene:

#### `WaveGame.jsx`

**Methods:**
- `init(data)` - Initializes the scene with provided data
- `create()` - Sets up the wave game scene
- `setupPlayer(gameMode)` - Creates and configures the player
- `setupWaveManager()` - Initializes the wave manager
- `setupUI()` - Creates wave-specific UI elements
- `startNextWave()` - Starts the next wave
- `handleWaveComplete()` - Handles end of a wave
- `handleVictory()` - Handles completion of all waves
- `update(time, delta)` - Updates the scene each frame

**Properties:**
- `player` - Reference to the player object
- `waveManager` - Reference to the wave manager
- `uiManager` - Reference to the UI manager
- `gameMode` - Selected weapon mode
- `score` - Current player score
- `survivalTime` - Total survival time

## Wave Configuration

Each wave has a specific configuration defining its enemies and difficulty:

```javascript
// Example wave configuration
this.waveConfigs = [
    // Wave 1 - Tutorial wave
    {
        enemies: [
            { type: 'basic', count: 5 }
        ],
        spawnDelay: 1000, // 1 second between spawns
        spawnRadius: 800, // Spawn distance from player
        bossWave: false
    },
    
    // Wave 2 - Slightly harder
    {
        enemies: [
            { type: 'basic', count: 8 }
        ],
        spawnDelay: 800,
        spawnRadius: 800,
        bossWave: false
    },
    
    // Wave 3 - Introduce fast enemies
    {
        enemies: [
            { type: 'basic', count: 6 },
            { type: 'fast', count: 3 }
        ],
        spawnDelay: 800,
        spawnRadius: 800,
        bossWave: false
    },
    
    // Wave 4 - More enemies
    {
        enemies: [
            { type: 'basic', count: 8 },
            { type: 'fast', count: 5 }
        ],
        spawnDelay: 700,
        spawnRadius: 800,
        bossWave: false
    },
    
    // Wave 5 - First boss wave
    {
        enemies: [
            { type: 'basic', count: 5 },
            { type: 'fast', count: 3 }
        ],
        boss: { type: 'boss1' },
        spawnDelay: 1000,
        spawnRadius: 800,
        bossWave: true
    },
    
    // Waves 6-20 follow similar patterns with increasing difficulty
    // ...
];
```

### Enemy Spawning

Enemies are spawned based on the wave configuration:

```javascript
// In WaveManager.js
spawnEnemiesForWave(waveNumber) {
    const config = this.getWaveConfig(waveNumber);
    if (!config) return;
    
    // Reset enemies remaining counter
    this.enemiesRemaining = 0;
    
    // Count total enemies
    for (const enemyGroup of config.enemies) {
        this.enemiesRemaining += enemyGroup.count;
    }
    
    // If boss wave, add boss to count
    if (config.bossWave && config.boss) {
        this.enemiesRemaining += 1;
    }
    
    // Spawn regular enemies
    for (const enemyGroup of config.enemies) {
        this.spawnEnemyGroup(
            enemyGroup.type,
            enemyGroup.count,
            config.spawnDelay,
            config.spawnRadius
        );
    }
    
    // Spawn boss if boss wave
    if (config.bossWave && config.boss) {
        // Delay boss spawn until regular enemies are engaged
        this.scene.time.delayedCall(
            config.enemies.length * config.spawnDelay * 2,
            () => this.spawnBoss(config.boss.type),
            [],
            this
        );
    }
    
    // Update UI
    this.scene.events.emit('wave-enemies-update', {
        remaining: this.enemiesRemaining,
        total: this.enemiesRemaining
    });
}

spawnEnemyGroup(type, count, delay, radius) {
    // Spawn enemies with delay between each
    for (let i = 0; i < count; i++) {
        this.scene.time.delayedCall(
            i * delay,
            () => {
                // Calculate spawn position (random position around player)
                const angle = Math.random() * Math.PI * 2;
                const x = this.scene.player.x + Math.cos(angle) * radius;
                const y = this.scene.player.y + Math.sin(angle) * radius;
                
                // Spawn enemy
                const enemy = this.scene.enemyFactory.createEnemy(type, x, y);
                
                // Register enemy death event
                enemy.on('died', this.handleEnemyDeath, this);
            },
            [],
            this
        );
    }
}

spawnBoss(bossType) {
    // Play boss warning sound
    this.scene.soundManager.playSound('boss_warning');
    
    // Show boss incoming message
    this.scene.uiManager.showBossWarning();
    
    // Calculate spawn position (opposite side from player facing direction)
    const angle = this.scene.player.rotation + Math.PI;
    const x = this.scene.player.x + Math.cos(angle) * 800;
    const y = this.scene.player.y + Math.sin(angle) * 800;
    
    // Spawn boss with delay after warning
    this.scene.time.delayedCall(
        3000, // 3 second warning
        () => {
            // Create boss
            const boss = this.scene.enemyFactory.createBoss(bossType, x, y);
            
            // Play boss music
            this.scene.soundManager.crossFadeMusic(
                'gameplay_music',
                'boss_music',
                2000
            );
            
            // Register boss death event
            boss.on('died', this.handleBossDeath, this);
        },
        [],
        this
    );
}
```

### Wave Progression

The wave system tracks enemy deaths and progresses to the next wave:

```javascript
// In WaveManager.js
handleEnemyDeath(enemy) {
    // Decrement enemies remaining
    this.enemiesRemaining--;
    
    // Update UI
    this.scene.events.emit('wave-enemies-update', {
        remaining: this.enemiesRemaining,
        total: this.getWaveConfig(this.currentWave).totalEnemies
    });
    
    // Check if wave is complete
    if (this.enemiesRemaining <= 0) {
        this.endWave();
    }
}

endWave() {
    // Set wave state to complete
    this.waveState = 'complete';
    
    // Play wave complete sound
    this.scene.soundManager.playSound('wave_complete');
    
    // Show wave complete message
    this.scene.uiManager.showWaveBanner(`Wave ${this.currentWave} Complete!`);
    
    // Award wave completion bonus
    this.awardWaveCompletionBonus();
    
    // If this was the last wave, trigger victory
    if (this.currentWave >= this.totalWaves) {
        this.completeAllWaves();
        return;
    }
    
    // If break between waves is enabled, show next wave button
    if (this.breakBetweenWaves) {
        this.scene.uiManager.showNextWaveButton();
    } else {
        // Otherwise, automatically start next wave after delay
        this.scene.time.delayedCall(
            5000, // 5 second delay
            () => this.startWave(this.currentWave + 1),
            [],
            this
        );
    }
    
    // Emit wave complete event
    this.scene.events.emit('wave-complete', {
        waveNumber: this.currentWave,
        nextWave: this.currentWave + 1,
        isLastWave: this.currentWave >= this.totalWaves
    });
}

startWave(waveNumber) {
    // Set current wave
    this.currentWave = waveNumber;
    
    // Set wave state to active
    this.waveState = 'active';
    
    // Record start time
    this.waveStartTime = this.scene.time.now;
    
    // Hide next wave button if visible
    this.scene.uiManager.hideNextWaveButton();
    
    // Play wave start sound
    this.scene.soundManager.playSound('wave_start');
    
    // Show wave start message
    this.scene.uiManager.showWaveBanner(`Wave ${waveNumber} Start!`);
    
    // Spawn enemies for this wave
    this.spawnEnemiesForWave(waveNumber);
    
    // Update UI
    this.scene.events.emit('wave-start', {
        waveNumber: waveNumber,
        totalWaves: this.totalWaves
    });
}

completeAllWaves() {
    // Play victory music
    this.scene.soundManager.crossFadeMusic(
        'gameplay_music',
        'victory_music',
        2000
    );
    
    // Show victory screen
    this.scene.uiManager.showVictoryScreen({
        score: this.scene.score,
        survivalTime: this.scene.survivalTime,
        wavesCompleted: this.totalWaves
    });
    
    // Emit game complete event
    this.scene.events.emit('game-complete', {
        score: this.scene.score,
        survivalTime: this.scene.survivalTime,
        wavesCompleted: this.totalWaves
    });
}
```

### Wave Completion Logic

The WaveManager uses a flexible approach to determine when a wave is complete:

```javascript
// In WaveManager.js - verifyEnemyCount method
// Check if the target number of enemies has been surpassed (not requiring exact count)
const enemySpawnThresholdMet = this.enemiesSpawned >= this.enemiesToSpawn;

// Check if the wave should be completed
if (enemySpawnThresholdMet && this.activeEnemies === 0) {
    if (isBossWave) {
        // For boss wave, ensure both regular enemies and boss are defeated
        if (this.activeBosses === 0) {
            this.completeWave();
        }
    } else {
        // For regular waves, all enemies must be defeated
        this.completeWave();
    }
}
```

This flexible completion logic ensures:

1. **Threshold-based completion**: Wave ends when we've spawned *at least* the required number of enemies (not requiring an exact match)
2. **All enemies defeated**: All active enemies must be defeated for the wave to end
3. **Boss wave handling**: For boss waves, both regular enemies and the boss must be defeated
4. **Resiliency**: The system handles unexpected additional enemies from external systems

This approach makes the wave system more robust when integrated with other systems that might spawn additional enemies.

## UI Integration

The wave mode integrates with the UI to show wave information:

### Wave Information Display

Shows the current wave and total waves:

```javascript
// In UIManager.js
createWaveInfo() {
    // Wave text
    this.waveText = this.scene.add.text(
        512, 30, 'Wave 1/20', 
        { fontFamily: 'Arial', fontSize: 24, color: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    
    // Enemies remaining text
    this.enemiesText = this.scene.add.text(
        512, 60, 'Enemies: 0', 
        { fontFamily: 'Arial', fontSize: 18, color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
}

updateWaveUI(currentWave, totalWaves) {
    this.waveText.setText(`Wave ${currentWave}/${totalWaves}`);
}

updateEnemiesUI(remaining, total) {
    this.enemiesText.setText(`Enemies: ${remaining}/${total}`);
}
```

### Next Wave Button

Button that appears between waves:

```javascript
// In UIManager.js
createNextWaveButton() {
    // Button background
    this.nextWaveButton = this.scene.add.rectangle(
        512, 400, 200, 60, 0x0066ff
    ).setScrollFactor(0).setDepth(100).setInteractive()
    .on('pointerdown', () => {
        this.scene.startNextWave();
    })
    .on('pointerover', () => {
        this.nextWaveButton.fillColor = 0x4499ff;
    })
    .on('pointerout', () => {
        this.nextWaveButton.fillColor = 0x0066ff;
    });
    
    // Button text
    this.nextWaveText = this.scene.add.text(
        512, 400, 'Next Wave', 
        { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    
    // Hide by default
    this.hideNextWaveButton();
}

showNextWaveButton() {
    this.nextWaveButton.setVisible(true);
    this.nextWaveText.setVisible(true);
}

hideNextWaveButton() {
    this.nextWaveButton.setVisible(false);
    this.nextWaveText.setVisible(false);
}
```

### Wave Banner

Displays wave start/complete messages:

```javascript
// In UIManager.js
showWaveBanner(text) {
    // Create banner background
    const banner = this.scene.add.rectangle(
        512, -50, 400, 80, 0x000000, 0.7
    ).setScrollFactor(0).setDepth(150);
    
    // Create banner text
    const bannerText = this.scene.add.text(
        512, -50, text,
        { fontFamily: 'Arial', fontSize: 32, color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(151);
    
    // Animate banner in and out
    this.scene.tweens.add({
        targets: [banner, bannerText],
        y: 100,
        duration: 500,
        ease: 'Back.easeOut',
        yoyo: true,
        hold: 2000,
        onComplete: () => {
            banner.destroy();
            bannerText.destroy();
        }
    });
}
```

### Boss Warning

Displays a warning when a boss is about to spawn:

```javascript
// In UIManager.js
showBossWarning() {
    // Create warning background (flashing red)
    const warningBg = this.scene.add.rectangle(
        512, 384, 1024, 768, 0xff0000, 0.3
    ).setScrollFactor(0).setDepth(140);
    
    // Create warning text
    const warningText = this.scene.add.text(
        512, 384, 'BOSS INCOMING', 
        { fontFamily: 'Arial', fontSize: 48, color: '#ff0000', stroke: '#000000', strokeThickness: 6 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(141);
    
    // Flash the warning
    this.scene.tweens.add({
        targets: [warningBg, warningText],
        alpha: { from: 1, to: 0 },
        yoyo: true,
        repeat: 5,
        duration: 300,
        onComplete: () => {
            warningBg.destroy();
            warningText.destroy();
        }
    });
}
```

### Victory Screen

Displayed when the player completes all waves:

```javascript
// In UIManager.js
showVictoryScreen(stats) {
    // Create victory panel
    this.victoryPanel = this.scene.add.rectangle(
        512, 384, 600, 500, 0x000000, 0.8
    ).setScrollFactor(0).setDepth(150);
    
    // Create victory title
    this.victoryTitle = this.scene.add.text(
        512, 200, 'VICTORY!', 
        { fontFamily: 'Arial', fontSize: 48, color: '#ffff00', stroke: '#000000', strokeThickness: 6 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(151);
    
    // Create stats text
    this.victoryStats = this.scene.add.text(
        512, 300, 
        `Score: ${stats.score}\n` +
        `Time: ${this.formatTime(stats.survivalTime)}\n` +
        `Waves Completed: ${stats.wavesCompleted}`,
        { fontFamily: 'Arial', fontSize: 24, color: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(151);
    
    // Create buttons
    this.createButton(
        512, 450, 'Play Again', 
        () => this.scene.scene.restart()
    ).setScrollFactor(0).setDepth(151);
    
    this.createButton(
        512, 520, 'Main Menu', 
        () => this.scene.scene.start('MainMenu')
    ).setScrollFactor(0).setDepth(151);
    
    // Pause game
    this.scene.physics.pause();
}
```

## Integration with Existing Systems

The wave mode integrates with existing game systems:

### XP System

Players earn XP bonuses for completing waves:

```javascript
// In WaveManager.js
awardWaveCompletionBonus() {
    // Base XP for completing a wave
    const baseXP = 50 + (this.currentWave * 10);
    
    // Apply wave number multiplier
    const xpBonus = Math.floor(baseXP * (1 + (this.currentWave * 0.1)));
    
    // Add XP to player
    this.scene.xpManager.addXP(xpBonus);
    
    // Show XP bonus message
    this.scene.uiManager.showFloatingText(
        this.scene.player.x,
        this.scene.player.y - 50,
        `Wave Bonus: +${xpBonus} XP`,
        0x44FF44
    );
}
```

### Cash System

Players earn cash bonuses for completing waves:

```javascript
// In WaveManager.js
awardWaveCompletionBonus() {
    // Base cash for completing a wave
    const baseCash = 25 + (this.currentWave * 5);
    
    // Apply wave number multiplier
    const cashBonus = Math.floor(baseCash * (1 + (this.currentWave * 0.1)));
    
    // Add cash to player
    this.scene.cashManager.addCash(cashBonus);
    
    // Show cash bonus message
    this.scene.uiManager.showFloatingText(
        this.scene.player.x,
        this.scene.player.y - 80,
        `Wave Bonus: +$${cashBonus}`,
        0xFFD700
    );
}
```

### Enemy Difficulty Scaling

Enemy stats scale with wave number:

```javascript
// In EnemyFactory.js
createEnemy(type, x, y) {
    // Get base stats for enemy type
    const baseStats = this.enemyStats[type];
    
    // Get current wave number
    const waveNumber = this.scene.waveManager.getCurrentWave();
    
    // Calculate scaling factor based on wave
    const scalingFactor = 1 + (waveNumber * 0.1);
    
    // Apply scaling to stats
    const scaledStats = {
        health: Math.floor(baseStats.health * scalingFactor),
        speed: baseStats.speed * (1 + (waveNumber * 0.05)),
        damage: Math.floor(baseStats.damage * scalingFactor),
        scoreValue: Math.floor(baseStats.scoreValue * (1 + (waveNumber * 0.2))),
        xpValue: Math.floor(baseStats.xpValue * (1 + (waveNumber * 0.2))),
        cashValue: Math.floor(baseStats.cashValue * (1 + (waveNumber * 0.2)))
    };
    
    // Create enemy with scaled stats
    const enemy = this.enemyPool.get();
    if (enemy) {
        enemy.setPosition(x, y);
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.setData('type', type);
        enemy.setData('health', scaledStats.health);
        enemy.setData('maxHealth', scaledStats.health);
        enemy.setData('speed', scaledStats.speed);
        enemy.setData('damage', scaledStats.damage);
        enemy.setData('scoreValue', scaledStats.scoreValue);
        enemy.setData('xpValue', scaledStats.xpValue);
        enemy.setData('cashValue', scaledStats.cashValue);
        
        // Additional setup...
        
        return enemy;
    }
    
    return null;
}
```

## Balance Considerations

### Wave Difficulty Curve

The wave difficulty follows a curve designed to challenge players while remaining fair:

- **Waves 1-5**: Introduction and learning curve
- **Waves 6-10**: Moderate challenge
- **Waves 11-15**: Significant challenge
- **Waves 16-19**: High difficulty
- **Wave 20**: Final boss challenge

### Boss Encounters

Boss waves occur at regular intervals:

- **Wave 5**: First boss (introductory)
- **Wave 10**: Second boss (moderate challenge)
- **Wave 15**: Third boss (significant challenge)
- **Wave 20**: Final boss (maximum challenge)

### Player Progression

The wave system is balanced with player progression in mind:

- XP and cash rewards scale with wave number
- Player should reach approximately level 10 by wave 10
- Player should reach approximately level 20 by wave 20
- Upgrades and power-ups should be affordable at appropriate intervals

## Weapon System Integration

The wave game mode integrates with the unified weapon system:

### Weapon Initialization

The player's weapon is initialized during scene setup:

```javascript
// In WaveGame.jsx - setupGameObjects()
setupGameObjects() {
    // Create player instance (in center of map)
    const playerX = this.mapDimensions.width / 2;
    const playerY = this.mapDimensions.height / 2;
    this.player = new Player(this, playerX, playerY);

    // Initialize player's weapon system
    this.player.initWeaponSystem();

    // Setup player health system
    this.playerHealth = new PlayerHealth(this, {
        maxHealth: 100,
        hitDamage: 34, // Dies in 3 hits
        damageResistance: 0 // Start with 0% defense
    });

    // Setup collision with map layers
    this.setupPlayerCollisions();

    // Setup camera to follow player
    this.setupCamera();
}
```

### Weapon Sound Effects

The sound manager initializes a single weapon sound effect:

```javascript
// In WaveGame.jsx - setupSoundManager()
setupSoundManager() {
    // Create sound manager
    this.soundManager = new SoundManager(this);

    // Initialize ambient music
    this.soundManager.initBackgroundMusic('ambient_music', {
        volume: 0.4,  // Slightly lower volume for ambient music
        loop: true
    });

    // Initialize weapon sound effect
    this.soundManager.initSoundEffect('shoot_weapon', {
        volume: 0.5,
        rate: 1.0
    });

    // Initialize additional sound effects...
}
```

### Weapon Upgrades

The shop system offers weapon upgrades compatible with the unified weapon system:

```javascript
// In WaveGame.jsx - setupShopManager()
setupShopManager() {
    // Create RNG for generating upgrades
    const rng = {
        pick: (array) => {
            return array[Math.floor(Math.random() * array.length)];
        },
        range: (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    };

    // Create weapon reference for upgrades
    const weapon = {
        type: 'Standard',
        damage: this.player.bulletDamage || 10,
        fireRate: this.player.fireRate || 0.1,
        pierce: this.player.bulletPierce || 1
    };

    // Initialize shop manager
    this.shopManager = new ShopManager(this, this.player, weapon, rng);

    // Initialize player credits if not already set
    if (this.player.credits === undefined) {
        this.player.credits = 100; // Starting credits

        // Update cash display
        if (this.cashManager) {
            this.cashManager.setCash(this.player.credits);
        }
    }
}
```

### Player Weapon Usage

During gameplay, the player's weapon is fired when the mouse button is pressed:

```javascript
// In WaveGame.jsx - updateGameObjects()
updateGameObjects() {
    // Update player
    this.player.update();

    // Attempt to shoot if mouse is held down
    if (this.isMouseDown) {
        this.player.shoot();
    }

    // Update other game objects...
}
```

## Integration with Enemy Management Systems

### External Enemy Spawning

The wave system properly integrates with other managers that can spawn enemies:

```javascript
// In WaveManager.js
/**
 * Register enemies that are spawned by external systems
 * This method allows systems like FactionBattleManager to notify WaveManager
 * about enemies they spawn outside normal wave spawning
 * 
 * @param {number} count - Number of enemies spawned externally
 */
registerExternalEnemySpawn(count) {
    if (typeof count !== 'number' || count <= 0) return;
    
    // Track these as part of our spawn counts
    this.enemiesSpawned += count;
    this.activeEnemies += count;
    
    if (this.scene.isDev) {
        console.debug(`[WaveManager] Registered ${count} external enemy spawns. New totals: Spawned=${this.enemiesSpawned}, Active=${this.activeEnemies}`);
    }
}
```

Systems that spawn enemies externally (such as FactionBattleManager and ChaosManager) call this method to ensure proper tracking:

```javascript
// Example from FactionBattleManager
triggerFactionSurge(factionId) {
    if (!this.groupWeightManager) return;
    
    // Get WaveManager reference to track any extra spawns
    const waveManager = this.scene.waveManager;
    
    // Calculate potential surge enemies
    const surgeEnemiesCount = Math.floor(Math.random() * 3) + 1; // 1-3 enemies
    
    // Register these potential enemy spawns with WaveManager
    if (waveManager && typeof waveManager.registerExternalEnemySpawn === 'function') {
        waveManager.registerExternalEnemySpawn(surgeEnemiesCount);
    }
    
    // Continue with faction surge logic...
}
```

This ensures that all enemies are properly tracked in the wave system, regardless of which manager spawned them.

### Enemy Count Verification

To prevent waves from getting stuck due to inconsistent enemy counts, the WaveManager periodically verifies its internal tracking against the actual number of enemies in the scene:

```javascript
verifyEnemyCount() {
    if (!this.scene.enemyManager || !this.isWaveActive) return;
    
    // Get the actual count from enemy manager
    const actualEnemyCount = this.scene.enemyManager.getEnemyCount();
    const actualBossCount = this.scene.enemyManager.getEnemyCount('boss1');
    
    // If there's a mismatch, update our tracking to match reality
    if (actualEnemyCount !== this.activeEnemies || actualBossCount !== this.activeBosses) {
        // Update our tracking to match reality
        this.activeEnemies = actualEnemyCount;
        this.activeBosses = actualBossCount;
    }
    
    // Check if wave should complete
    // ...
}
```

This mechanism ensures accurate enemy counting and proper wave progression.

## End of Wave Shop Integration

The wave system is designed to integrate seamlessly with the shop system between waves. This integration happens automatically through:

1. Event-based communication via `EventBus`
2. Direct callback registration via the WaveManager

### Event-Based Integration

When a wave is completed, the WaveManager emits both scene events and EventBus events:

```javascript
// In WaveManager.js - completeWave method
completeWave() {
    // Mark wave as complete
    this.isWaveActive = false;
    
    // ...other code...
    
    // Emit wave completed event on both scene events and EventBus
    const eventData = {
        wave: this.currentWave,
        isLastWave
    };
    
    this.scene.events.emit('wave-completed', eventData);
    
    // Also emit on EventBus to ensure ShopManager receives it
    EventBus.emit('wave-completed', eventData);
}
```

The ShopManager listens for these events:

```javascript
// In ShopManager.js
constructor(scene, player, weapon, rng) {
    // ...other initialization...
    
    // Listen for wave completed events
    EventBus.on('wave-completed', this.onWaveCompleted);
}
```

### Direct Callback Registration

For more robust integration, systems like the ShopManager can register callbacks directly with the WaveManager:

```javascript
// In ShopManager.js
constructor(scene, player, weapon, rng) {
    // ...other initialization...
    
    // Direct integration with WaveManager
    if (scene.waveManager) {
        scene.waveManager.registerEndOfRoundCallback(this.onWaveCompleted);
    }
    
    // Clean up when scene is destroyed
    this.scene.events.once('shutdown', () => {
        if (this.scene.waveManager) {
            this.scene.waveManager.unregisterEndOfRoundCallback(this.onWaveCompleted);
        }
    });
}
```

This ensures the shop is displayed at the end of each wave, allowing players to spend their earned currency on upgrades before proceeding to the next wave.

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
