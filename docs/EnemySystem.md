# Enemy System

## Overview

This document describes the enemy system in Fluffy-Swizz Interactive, including enemy types, behaviors, spawning mechanics, and AI.

## Core Concepts

The enemy system provides the primary challenge for players through various enemy types with different behaviors and abilities. Enemies are managed through a combination of factory pattern and object pooling for performance optimization.

### Enemy Types

The game features several enemy types with distinct characteristics:

- **Basic** - Standard enemy with balanced stats
- **Fast** - Quick but fragile enemy
- **Tank** - Slow but durable enemy
- **Boss** - Powerful enemy with special abilities

## Implementation

### Enemy Class

The base `Enemy` class provides common functionality for all enemy types.

#### `Enemy.js`

**Methods:**
- `constructor(scene, x, y, type)` - Creates a new enemy
- `init(config)` - Initializes enemy with configuration
- `update(time, delta)` - Updates enemy state each frame
- `move(playerPosition)` - Handles enemy movement
- `takeDamage(amount)` - Reduces enemy health
- `die()` - Handles enemy death
- `playAnimation(key)` - Plays specified animation
- `setTarget(target)` - Sets enemy's target (usually the player)
- `getDistanceToTarget()` - Gets distance to current target
- `getAngleToTarget()` - Gets angle to current target
- `isAlive()` - Returns whether enemy is alive

**Properties:**
- `scene` - Reference to the current scene
- `type` - Enemy type (basic, fast, tank, boss)
- `health` - Current health points
- `maxHealth` - Maximum health points
- `speed` - Movement speed
- `damage` - Damage dealt to player on collision
- `scoreValue` - Points awarded when defeated
- `xpValue` - XP awarded when defeated
- `cashValue` - Cash awarded when defeated
- `target` - Current target (usually the player)
- `state` - Current behavior state
- `stunned` - Whether enemy is currently stunned
- `lastAttackTime` - Time of last attack

### Enemy Factory

The `EnemyFactory` class manages enemy creation and configuration.

#### `EnemyFactory.js`

**Methods:**
- `constructor(scene)` - Initializes the factory
- `init(options)` - Sets up with configuration options
- `createEnemy(type, x, y)` - Creates an enemy of specified type
- `createBoss(bossType, x, y)` - Creates a boss enemy
- `getEnemyConfig(type)` - Gets configuration for enemy type
- `getBossConfig(bossType)` - Gets configuration for boss type
- `releaseEnemy(enemy)` - Returns an enemy to the pool
- `getActiveEnemies()` - Gets all active enemies
- `getActiveEnemyCount()` - Gets count of active enemies
- `clearAllEnemies()` - Removes all active enemies

**Properties:**
- `scene` - Reference to the current scene
- `enemyPool` - Object pool for enemies
- `enemyConfigs` - Configuration for each enemy type
- `bossConfigs` - Configuration for each boss type
- `activeEnemies` - Collection of currently active enemies

### Enemy Configuration

Enemies are configured with specific properties:

```javascript
// Example enemy configuration
this.enemyConfigs = {
    'basic': {
        sprite: 'enemy_basic',
        health: 100,
        speed: 100,
        damage: 10,
        scoreValue: 10,
        xpValue: 10,
        cashValue: 5,
        scale: 1,
        attackRate: 1, // Attacks per second
        detectionRadius: 500,
        behavior: 'chase',
        animations: {
            idle: { frames: [0, 1, 2, 3], frameRate: 8 },
            move: { frames: [4, 5, 6, 7], frameRate: 12 },
            attack: { frames: [8, 9, 10, 11], frameRate: 15 },
            die: { frames: [12, 13, 14, 15], frameRate: 10 }
        }
    },
    'fast': {
        sprite: 'enemy_fast',
        health: 60,
        speed: 180,
        damage: 8,
        scoreValue: 15,
        xpValue: 15,
        cashValue: 8,
        scale: 0.8,
        attackRate: 1.5,
        detectionRadius: 600,
        behavior: 'circle',
        animations: {
            idle: { frames: [0, 1, 2, 3], frameRate: 10 },
            move: { frames: [4, 5, 6, 7], frameRate: 15 },
            attack: { frames: [8, 9, 10, 11], frameRate: 18 },
            die: { frames: [12, 13, 14, 15], frameRate: 12 }
        }
    },
    'tank': {
        sprite: 'enemy_tank',
        health: 250,
        speed: 60,
        damage: 20,
        scoreValue: 25,
        xpValue: 25,
        cashValue: 15,
        scale: 1.2,
        attackRate: 0.5,
        detectionRadius: 400,
        behavior: 'chase',
        animations: {
            idle: { frames: [0, 1, 2, 3], frameRate: 6 },
            move: { frames: [4, 5, 6, 7], frameRate: 8 },
            attack: { frames: [8, 9, 10, 11], frameRate: 10 },
            die: { frames: [12, 13, 14, 15], frameRate: 8 }
        }
    }
};

// Example boss configuration
this.bossConfigs = {
    'boss1': {
        sprite: 'boss1',
        health: 1500,
        speed: 80,
        damage: 30,
        scoreValue: 100,
        xpValue: 100,
        cashValue: 50,
        scale: 1.5,
        attackRate: 0.8,
        detectionRadius: 600,
        behavior: 'boss',
        abilities: ['summonMinions', 'chargeAttack', 'aoeAttack'],
        animations: {
            idle: { frames: [0, 1, 2, 3], frameRate: 6 },
            move: { frames: [4, 5, 6, 7], frameRate: 8 },
            attack: { frames: [8, 9, 10, 11], frameRate: 10 },
            special: { frames: [16, 17, 18, 19], frameRate: 12 },
            die: { frames: [20, 21, 22, 23], frameRate: 8 }
        }
    }
};
```

### Creating Enemies

Enemies are created using the factory pattern:

```javascript
// In EnemyFactory.js
createEnemy(type, x, y) {
    // Get enemy configuration
    const config = this.getEnemyConfig(type);
    if (!config) {
        console.error(`Enemy type not found: ${type}`);
        return null;
    }
    
    // Get enemy from pool
    const enemy = this.enemyPool.get();
    
    if (enemy) {
        // Position the enemy
        enemy.setPosition(x, y);
        enemy.setActive(true);
        enemy.setVisible(true);
        
        // Initialize with configuration
        enemy.init({
            type: type,
            health: config.health,
            maxHealth: config.health,
            speed: config.speed,
            damage: config.damage,
            scoreValue: config.scoreValue,
            xpValue: config.xpValue,
            cashValue: config.cashValue,
            scale: config.scale,
            attackRate: config.attackRate,
            detectionRadius: config.detectionRadius,
            behavior: config.behavior
        });
        
        // Set up animations if they exist
        if (config.animations) {
            for (const animKey in config.animations) {
                const anim = config.animations[animKey];
                const fullAnimKey = `${type}_${animKey}`;
                
                // Create animation if it doesn't exist
                if (!this.scene.anims.exists(fullAnimKey)) {
                    this.scene.anims.create({
                        key: fullAnimKey,
                        frames: this.scene.anims.generateFrameNumbers(
                            config.sprite,
                            { frames: anim.frames }
                        ),
                        frameRate: anim.frameRate,
                        repeat: animKey === 'die' ? 0 : -1
                    });
                }
            }
            
            // Play idle animation by default
            enemy.play(`${type}_idle`);
        }
        
        // Set target to player
        enemy.setTarget(this.scene.player);
        
        // Add to active enemies list
        this.activeEnemies.push(enemy);
        
        // Emit enemy created event
        this.scene.events.emit('enemy-created', {
            enemy: enemy,
            type: type
        });
        
        return enemy;
    }
    
    return null;
}
```

### Enemy Behavior

Enemies use a state machine for behavior:

```javascript
// In Enemy.js
update(time, delta) {
    // Skip if not active
    if (!this.active) return;
    
    // Skip if stunned
    if (this.stunned) {
        this.stunTime -= delta;
        if (this.stunTime <= 0) {
            this.stunned = false;
        }
        return;
    }
    
    // Update behavior based on current state
    switch (this.state) {
        case 'idle':
            this.updateIdleState(time, delta);
            break;
            
        case 'chase':
            this.updateChaseState(time, delta);
            break;
            
        case 'attack':
            this.updateAttackState(time, delta);
            break;
            
        case 'circle':
            this.updateCircleState(time, delta);
            break;
            
        case 'retreat':
            this.updateRetreatState(time, delta);
            break;
            
        case 'boss':
            this.updateBossState(time, delta);
            break;
    }
    
    // Update health bar position
    if (this.healthBar) {
        this.healthBar.x = this.x - 20;
        this.healthBar.y = this.y - 30;
        this.healthBarBg.x = this.x - 20;
        this.healthBarBg.y = this.y - 30;
    }
}

updateChaseState(time, delta) {
    // Check if target exists
    if (!this.target || !this.target.active) {
        this.setState('idle');
        return;
    }
    
    // Get distance to target
    const distance = this.getDistanceToTarget();
    
    // If close enough to attack
    if (distance < 50) {
        this.setState('attack');
        return;
    }
    
    // Move toward target
    this.moveTowardTarget(delta);
    
    // Play move animation if not already playing
    if (this.anims.currentAnim.key !== `${this.type}_move`) {
        this.play(`${this.type}_move`);
    }
}

moveTowardTarget(delta) {
    // Calculate direction to target
    const angle = this.getAngleToTarget();
    
    // Calculate velocity
    const velocityX = Math.cos(angle) * this.speed * (delta / 1000);
    const velocityY = Math.sin(angle) * this.speed * (delta / 1000);
    
    // Move enemy
    this.x += velocityX;
    this.y += velocityY;
    
    // Rotate to face target
    this.rotation = angle;
}
```

### Boss Behavior

Boss enemies have special abilities and phases:

```javascript
// In Enemy.js
updateBossState(time, delta) {
    // Check if target exists
    if (!this.target || !this.target.active) {
        this.setState('idle');
        return;
    }
    
    // Update boss phase based on health percentage
    const healthPercent = this.health / this.maxHealth;
    
    if (healthPercent < 0.3 && this.phase !== 'rage') {
        this.enterRagePhase();
    } else if (healthPercent < 0.6 && this.phase !== 'defensive') {
        this.enterDefensivePhase();
    }
    
    // Update behavior based on current phase
    switch (this.phase) {
        case 'normal':
            this.updateBossNormalPhase(time, delta);
            break;
            
        case 'defensive':
            this.updateBossDefensivePhase(time, delta);
            break;
            
        case 'rage':
            this.updateBossRagePhase(time, delta);
            break;
    }
}

updateBossNormalPhase(time, delta) {
    // Get distance to target
    const distance = this.getDistanceToTarget();
    
    // Choose action based on distance and cooldowns
    if (distance < 100) {
        // Close range - melee attack
        if (time > this.lastAttackTime + (1000 / this.attackRate)) {
            this.performMeleeAttack();
            this.lastAttackTime = time;
        } else {
            // Move away to maintain distance
            this.moveAwayFromTarget(delta);
        }
    } else if (distance < 300) {
        // Medium range - charge attack if available
        if (this.canUseAbility('chargeAttack')) {
            this.useAbility('chargeAttack');
        } else {
            // Otherwise move toward target
            this.moveTowardTarget(delta);
        }
    } else {
        // Long range - summon minions if available
        if (this.canUseAbility('summonMinions')) {
            this.useAbility('summonMinions');
        } else {
            // Otherwise move toward target
            this.moveTowardTarget(delta);
        }
    }
}

useAbility(abilityName) {
    // Set ability on cooldown
    this.abilityCooldowns[abilityName] = this.abilityConfig[abilityName].cooldown;
    
    // Execute ability based on name
    switch (abilityName) {
        case 'summonMinions':
            this.summonMinions();
            break;
            
        case 'chargeAttack':
            this.performChargeAttack();
            break;
            
        case 'aoeAttack':
            this.performAOEAttack();
            break;
    }
    
    // Play special animation
    this.play(`${this.type}_special`);
    
    // Emit ability used event
    this.scene.events.emit('boss-ability-used', {
        boss: this,
        ability: abilityName
    });
}
```

### Boss Scaling Mechanics

Bosses scale in difficulty based on the current wave number rather than the number of bosses defeated:

```javascript
// Calculate boss number based on wave instead of bossCounter
let calculatedBossNumber = Math.floor(currentWave / bossWaveInterval);
calculatedBossNumber = Math.max(1, calculatedBossNumber);

// Calculate difficulty multiplier using wave-based boss number
const difficultyMultiplier = calculatedBossNumber <= 1 ? 
    1 : Math.pow(bossScalingFactor, calculatedBossNumber - 1);
```

This ensures that:
- Players starting the game at a later wave via the debug menu receive appropriately scaled bosses
- Boss #1 (wave 5) has a 1x multiplier (base stats)
- Boss #2 (wave 10) has a 2.5x multiplier on health, damage and score
- Boss #3 (wave 15) has a 6.25x multiplier (2.5²)
- Boss #4 (wave 20) has a 15.625x multiplier (2.5³)

The multipliers are applied to:
- `baseHealth`: Boss maximum health points
- `damage`: Amount of damage dealt to player
- `scoreValue`: Points awarded for defeating the boss
- `speed`: Movement speed (scaled less aggressively using square root)
- `size`: Visual size scales slightly with each boss level

## Spawning System

### Wave-Based Spawning

In wave mode, enemies are spawned based on wave configuration:

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
}
```

### Continuous Spawning

In endless mode, enemies are spawned continuously:

```javascript
// In Game.js
setupEnemySpawning() {
    // Set initial spawn rate
    this.enemySpawnRate = 2000; // 2 seconds between spawns
    
    // Create spawn timer
    this.enemySpawnTimer = this.time.addEvent({
        delay: this.enemySpawnRate,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true
    });
    
    // Increase difficulty over time
    this.difficultyTimer = this.time.addEvent({
        delay: 60000, // Every minute
        callback: this.increaseDifficulty,
        callbackScope: this,
        loop: true
    });
}

spawnEnemy() {
    // Calculate spawn position (random position around player)
    const spawnRadius = 800; // Spawn distance from player
    const angle = Math.random() * Math.PI * 2;
    const x = this.player.x + Math.cos(angle) * spawnRadius;
    const y = this.player.y + Math.sin(angle) * spawnRadius;
    
    // Determine enemy type based on difficulty
    let enemyType = 'basic';
    const roll = Math.random();
    
    if (this.difficultyLevel > 5) {
        // After 5 minutes, chance for tank enemies
        if (roll < 0.2) {
            enemyType = 'tank';
        } else if (roll < 0.5) {
            enemyType = 'fast';
        }
    } else if (this.difficultyLevel > 2) {
        // After 2 minutes, chance for fast enemies
        if (roll < 0.3) {
            enemyType = 'fast';
        }
    }
    
    // Spawn boss every 5 minutes
    if (this.difficultyLevel % 5 === 0 && this.difficultyLevel > 0 && !this.bossSpawned) {
        this.spawnBoss();
        this.bossSpawned = true;
    } else if (this.difficultyLevel % 5 !== 0) {
        this.bossSpawned = false;
    }
    
    // Create enemy
    this.enemyFactory.createEnemy(enemyType, x, y);
}

increaseDifficulty() {
    // Increment difficulty level
    this.difficultyLevel++;
    
    // Increase spawn rate (reduce delay)
    this.enemySpawnRate = Math.max(500, this.enemySpawnRate - 200);
    
    // Update spawn timer
    this.enemySpawnTimer.delay = this.enemySpawnRate;
    
    // Increase enemy stats
    this.enemyFactory.scaleEnemyStats(1.05); // 5% increase
    
    // Emit difficulty increase event
    this.events.emit('difficulty-increase', {
        level: this.difficultyLevel,
        spawnRate: this.enemySpawnRate
    });
}
```

### Spawn Position Validation

The enemy spawning system now includes collision validation to prevent enemies from spawning inside walls or obstacles:

```javascript
// In EnemyManager.js
validateSpawnPosition(x, y, radius = 32) {
    // Check if we have a map manager to validate against
    if (!this.scene.mapManager || !this.scene.mapManager.currentMapData) {
        // Fallback to basic bounds checking
        const mapDimensions = this.scene.mapDimensions || { width: 1920, height: 1080 };
        const clampedX = Math.max(radius, Math.min(mapDimensions.width - radius, x));
        const clampedY = Math.max(radius, Math.min(mapDimensions.height - radius, y));
        return { x: clampedX, y: clampedY };
    }
    
    // Check collision with walls, props, and other obstacles
    const collisionLayers = ['Walls', 'Props', 'Props1'];
    
    // If spawn position is invalid, search for a nearby valid position
    // Falls back to map center if no valid position found within search radius
}

// Used in all spawn methods:
spawnEnemiesAtEdges(type, count = 1) {
    // ... calculate spawn position ...
    
    // Validate spawn position to avoid walls/obstacles
    const validatedPosition = this.validateSpawnPosition(x, y, 32);
    
    // Spawn the enemy at validated position
    this.spawnEnemy(type, validatedPosition.x, validatedPosition.y);
}
```

This prevents the issue where enemies could spawn inside walls and become unreachable, causing waves to never complete.

## Enemy Health Display

Enemies display health bars above them:

```javascript
// In Enemy.js
createHealthBar() {
    // Create health bar background
    this.healthBarBg = this.scene.add.rectangle(
        this.x - 20,
        this.y - 30,
        40, 5,
        0x000000
    ).setOrigin(0, 0.5).setDepth(this.depth - 1);
    
    // Create health bar foreground
    this.healthBar = this.scene.add.rectangle(
        this.x - 20,
        this.y - 30,
        40, 5,
        0xff0000
    ).setOrigin(0, 0.5).setDepth(this.depth);
}

updateHealthBar() {
    // Skip if no health bar
    if (!this.healthBar) return;
    
    // Calculate health percentage
    const healthPercent = this.health / this.maxHealth;
    
    // Update health bar width
    this.healthBar.width = 40 * healthPercent;
    
    // Update color based on health
    if (healthPercent > 0.6) {
        this.healthBar.fillColor = 0x00ff00; // Green
    } else if (healthPercent > 0.3) {
        this.healthBar.fillColor = 0xffff00; // Yellow
    } else {
        this.healthBar.fillColor = 0xff0000; // Red
    }
}
```

## Enemy Death

When enemies are defeated, they drop rewards and play effects:

```javascript
// In Enemy.js
die() {
    // Set state to dead
    this.state = 'dead';
    this.active = false;
    
    // Play death animation
    this.play(`${this.type}_die`);
    
    // Create death effect
    this.scene.spritePool.createDeathEffect(this.x, this.y, {
        tint: 0xff6666,
        scale: this.scale,
        lifespan: 800
    });
    
    // Play death sound
    this.scene.soundManager.playSound('enemy_death');
    
    // Drop XP
    if (this.xpValue > 0) {
        this.scene.xpManager.createXPPickup(this.x, this.y, this.xpValue);
    }
    
    // Drop cash
    if (this.cashValue > 0) {
        this.scene.cashManager.createCashPickup(this.x, this.y, this.cashValue);
    }
    
    // Increment kill count
    this.scene.killCount++;
    
    // Add to score
    this.scene.score += this.scoreValue;
    
    // Update UI
    this.scene.events.emit('score-update', {
        score: this.scene.score,
        killCount: this.scene.killCount
    });
    
    // Destroy health bar
    if (this.healthBar) {
        this.healthBar.destroy();
        this.healthBarBg.destroy();
    }
    
    // Wait for death animation to complete
    this.once('animationcomplete', () => {
        // Release enemy back to pool
        this.scene.enemyFactory.releaseEnemy(this);
    });
    
    // Emit died event
    this.emit('died', this);
}
```

## Enemy Difficulty Scaling

Enemy stats scale with game progression:

```javascript
// In EnemyFactory.js
scaleEnemyStats(multiplier) {
    // Scale stats for all enemy types
    for (const type in this.enemyConfigs) {
        const config = this.enemyConfigs[type];
        
        // Scale health, speed, and damage
        config.health = Math.floor(config.health * multiplier);
        config.speed = Math.floor(config.speed * multiplier);
        config.damage = Math.floor(config.damage * multiplier);
        
        // Scale rewards
        config.scoreValue = Math.floor(config.scoreValue * multiplier);
        config.xpValue = Math.floor(config.xpValue * multiplier);
        config.cashValue = Math.floor(config.cashValue * multiplier);
    }
    
    // Scale stats for all active enemies
    for (const enemy of this.activeEnemies) {
        if (enemy.active) {
            enemy.maxHealth = Math.floor(enemy.maxHealth * multiplier);
            enemy.health = Math.floor(enemy.health * multiplier);
            enemy.speed = Math.floor(enemy.speed * multiplier);
            enemy.damage = Math.floor(enemy.damage * multiplier);
            enemy.scoreValue = Math.floor(enemy.scoreValue * multiplier);
            enemy.xpValue = Math.floor(enemy.xpValue * multiplier);
            enemy.cashValue = Math.floor(enemy.cashValue * multiplier);
        }
    }
}
```

## Enemy Registry

The game maintains a registry of all enemy types:

```javascript
// In EnemyRegistry.js
class EnemyRegistry {
    constructor() {
        this.enemyTypes = {};
        this.bossTypes = {};
    }
    
    registerEnemyType(type, config) {
        this.enemyTypes[type] = config;
    }
    
    registerBossType(type, config) {
        this.bossTypes[type] = config;
    }
    
    getEnemyConfig(type) {
        return this.enemyTypes[type];
    }
    
    getBossConfig(type) {
        return this.bossTypes[type];
    }
    
    getAllEnemyTypes() {
        return Object.keys(this.enemyTypes);
    }
    
    getAllBossTypes() {
        return Object.keys(this.bossTypes);
    }
}

// Usage
const enemyRegistry = new EnemyRegistry();

// Register basic enemy types
enemyRegistry.registerEnemyType('basic', {
    sprite: 'enemy_basic',
    health: 100,
    speed: 100,
    // Additional properties...
});

// Register boss types
enemyRegistry.registerBossType('boss1', {
    sprite: 'boss1',
    health: 1000,
    abilities: ['summonMinions', 'chargeAttack', 'aoeAttack'],
    // Additional properties...
});
```

## Performance Considerations

### Object Pooling

Enemies are managed through object pooling for performance:

```javascript
// In EnemyFactory.js
initEnemyPool() {
    // Create pool for enemies
    this.scene.gameObjectManager.createPool('enemy',
        // Create function
        () => {
            // Create enemy sprite
            const enemy = this.scene.physics.add.sprite(0, 0, 'enemy_basic');
            
            // Set up physics body
            enemy.body.setSize(32, 32);
            
            // Add custom properties
            enemy.health = 0;
            enemy.maxHealth = 0;
            enemy.speed = 0;
            enemy.damage = 0;
            enemy.scoreValue = 0;
            enemy.xpValue = 0;
            enemy.cashValue = 0;
            enemy.type = '';
            enemy.state = 'idle';
            enemy.target = null;
            
            // Add methods
            enemy.init = this.enemyInit;
            enemy.takeDamage = this.enemyTakeDamage;
            enemy.die = this.enemyDie;
            enemy.setState = this.enemySetState;
            enemy.setTarget = this.enemySetTarget;
            enemy.getDistanceToTarget = this.enemyGetDistanceToTarget;
            enemy.getAngleToTarget = this.enemyGetAngleToTarget;
            enemy.moveTowardTarget = this.enemyMoveTowardTarget;
            enemy.moveAwayFromTarget = this.enemyMoveAwayFromTarget;
            enemy.update = this.enemyUpdate;
            
            // Set inactive by default
            enemy.setActive(false);
            enemy.setVisible(false);
            
            return enemy;
        },
        // Reset function
        (enemy) => {
            // Reset position off-screen
            enemy.setPosition(-1000, -1000);
            
            // Reset properties
            enemy.health = 0;
            enemy.maxHealth = 0;
            enemy.speed = 0;
            enemy.damage = 0;
            enemy.scoreValue = 0;
            enemy.xpValue = 0;
            enemy.cashValue = 0;
            enemy.type = '';
            enemy.state = 'idle';
            enemy.target = null;
            
            // Reset physics
            enemy.body.reset(-1000, -1000);
            
            // Reset visibility
            enemy.setActive(false);
            enemy.setVisible(false);
        },
        // Pool options
        {
            initialSize: 50,
            maxSize: 200,
            growSize: 20
        }
    );
}
```

### Spatial Partitioning

For large numbers of enemies, spatial partitioning improves performance:

```javascript
// In EnemyManager.js
class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.grid = {};
        this.cellSize = 200; // Size of each grid cell
    }
    
    addEnemy(enemy) {
        // Calculate grid cell
        const cellX = Math.floor(enemy.x / this.cellSize);
        const cellY = Math.floor(enemy.y / this.cellSize);
        const cellKey = `${cellX},${cellY}`;
        
        // Create cell if it doesn't exist
        if (!this.grid[cellKey]) {
            this.grid[cellKey] = [];
        }
        
        // Add enemy to cell
        this.grid[cellKey].push(enemy);
        
        // Store cell key on enemy
        enemy.cellKey = cellKey;
    }
    
    removeEnemy(enemy) {
        // Get cell key
        const cellKey = enemy.cellKey;
        
        // Remove from cell
        if (this.grid[cellKey]) {
            const index = this.grid[cellKey].indexOf(enemy);
            if (index !== -1) {
                this.grid[cellKey].splice(index, 1);
            }
        }
    }
    
    updateEnemyCell(enemy) {
        // Calculate new cell
        const cellX = Math.floor(enemy.x / this.cellSize);
        const cellY = Math.floor(enemy.y / this.cellSize);
        const newCellKey = `${cellX},${cellY}`;
        
        // If cell changed, update
        if (newCellKey !== enemy.cellKey) {
            this.removeEnemy(enemy);
            enemy.cellKey = newCellKey;
            this.addEnemy(enemy);
        }
    }
    
    getEnemiesNearPosition(x, y, radius) {
        // Calculate cell range to check
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerCellX = Math.floor(x / this.cellSize);
        const centerCellY = Math.floor(y / this.cellSize);
        
        // Collect enemies from nearby cells
        const nearbyEnemies = [];
        
        for (let cellX = centerCellX - cellRadius; cellX <= centerCellX + cellRadius; cellX++) {
            for (let cellY = centerCellY - cellRadius; cellY <= centerCellY + cellRadius; cellY++) {
                const cellKey = `${cellX},${cellY}`;
                
                // Add enemies from this cell
                if (this.grid[cellKey]) {
                    for (const enemy of this.grid[cellKey]) {
                        // Check actual distance
                        const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                        if (distance <= radius) {
                            nearbyEnemies.push(enemy);
                        }
                    }
                }
            }
        }
        
        return nearbyEnemies;
    }
}
```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
