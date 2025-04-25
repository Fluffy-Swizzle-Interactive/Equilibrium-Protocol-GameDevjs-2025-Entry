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

### Base Enemy Class

The base `BaseEnemy` class provides common functionality for all enemy types.

#### `BaseEnemy.js`

**Methods:**
- `constructor(scene, x, y, fromPool)` - Creates a new enemy
- `update()` - Updates enemy state each frame
- `moveTowardsPlayer(playerPosition)` - Handles enemy movement
- `takeDamage(amount)` - Reduces enemy health
- `die()` - Handles enemy death
- `setGroupId(groupId)` - Sets the enemy's faction/group ID
- `disableTargeting(disabled)` - Enables/disables enemy targeting behavior
- `getPosition()` - Gets the enemy's position
- `destroy()` - Cleans up resources when destroying the enemy

**Properties:**
- `scene` - Reference to the current scene
- `type` - Enemy type (enemy1, enemy2, enemy3, boss1)
- `health` - Current health points
- `speed` - Movement speed
- `damage` - Damage dealt to player on collision
- `scoreValue` - Points awarded when defeated
- `size` - Collision size
- `groupId` - Faction/group ID used for enemy interactions
- `active` - Whether the enemy is active
- `graphics` - Visual representation of the enemy

### Sprite-Based Enemy System

The sprite-based enemy system enhances enemies with animated sprites and faction-based colored outlines.

#### `SpriteEnemy.js`

The `SpriteEnemy` class extends `BaseEnemy` and adds sprite animation support and faction-based outline coloring.

**Methods:**
- `constructor(scene, x, y, fromPool, spriteConfig)` - Creates a new sprite-based enemy
- `initProperties()` - Initializes enemy properties
- `createVisuals(x, y)` - Creates the sprite and sets up animations
- `createOutlineEffect()` - Creates faction-based outline shader effect
- `createAnimations()` - Sets up sprite animations
- `playAnimation(key, ignoreIfPlaying)` - Plays a specific animation
- `onAnimationComplete(animation, frame)` - Handles animation completion
- `update()` - Updates enemy position, animation, and outline color
- `moveTowardsPlayer(playerPos)` - Moves towards the player
- `updateFactionDisplay()` - Updates outline color based on faction
- `takeDamage(amount)` - Takes damage with visual feedback
- `die()` - Handles death with animation
- `setGroupId(groupId)` - Sets faction with visual update
- `disableTargeting(disabled)` - Enables/disables targeting with animation updates
- `getPosition()` - Gets current position
- `destroy()` - Cleans up resources

**Properties:**
- All properties from BaseEnemy
- `spriteConfig` - Configuration for sprites and animations
- `lastX/lastY` - Previous position for movement detection
- `originalPipeline` - Original rendering pipeline

### Enemy Registry

The `EnemyRegistry` class manages and creates different enemy types.

#### `EnemyRegistry.js`

**Methods:**
- `constructor(scene)` - Creates a new enemy registry
- `registerDefaultEnemies()` - Registers default enemy types
- `registerEnemyType(type, enemyClass)` - Registers a regular enemy type
- `registerBossType(type, bossClass)` - Registers a boss enemy type
- `createEnemy(type, x, y, fromPool)` - Creates an enemy of the specified type
- `createBoss(type, x, y, fromPool)` - Creates a boss of the specified type
- `getRandomEnemyType(weights)` - Gets a random enemy type based on weights
- `getRandomBossType()` - Gets a random boss type

**Properties:**
- `scene` - Reference to the current scene
- `enemyTypes` - Map of regular enemy types to class constructors
- `bossTypes` - Map of boss types to class constructors

### Specialized Enemy Types

#### `SpriteEnemy1.js` - Basic Melee Enemy

A simple melee enemy that chases the player.

**Properties:**
- `speed: 0.6` - Medium movement speed
- `size: 14` - Medium collision size
- `health: 20` - Low health
- `damage: 10` - Medium damage
- `scoreValue: 10` - Low score value

#### `SpriteEnemy2.js` - Tank Enemy

A slower but stronger enemy with a charging attack.

**Methods:**
- `update()` - Overrides update with charge attack behavior
- `updateAnimation()` - Updates animation based on state
- `startCharge(playerPos)` - Initiates charging attack
- `endCharge()` - Ends charging attack
- `takeDamage(amount)` - Takes reduced damage while charging

**Properties:**
- `speed: 0.4` - Slow movement speed
- `size: 24` - Large collision size
- `health: 80` - High health
- `damage: 20` - High damage
- `scoreValue: 25` - Medium score value
- `isCharging` - Whether currently performing charge attack
- `chargeRange: 250` - Range to consider charging
- `chargeDuration: 1000` - Duration of charge in ms
- `chargeCooldownTime: 5000` - Time between charges
- `chargeSpeed: 1.5` - Speed during charge

#### `SpriteEnemy3.js` - Ranged Enemy

A ranged enemy that keeps distance from player and fires projectiles.

**Methods:**
- `update()` - Overrides update with ranged attack behavior
- `updateAnimation()` - Updates animation based on state
- `moveStrategically(playerPos, distance)` - Maintains optimal distance
- `tryRangedAttack(playerPos, distance)` - Attempts to perform ranged attack

**Properties:**
- `speed: 0.5` - Medium movement speed
- `size: 16` - Medium collision size
- `health: 30` - Medium health
- `damage: 8` - Low damage per projectile
- `scoreValue: 15` - Medium score value
- `attackRange: 300` - Range at which to attack
- `preferredDistance: 200` - Distance enemy tries to maintain
- `attackCooldownTime: 2000` - Time between attacks
- `projectileSpeed: 2.0` - Speed of projectiles

#### `SpriteBoss1.js` - Boss Enemy

A powerful boss enemy with multiple attack patterns and a health bar.

**Methods:**
- `initProperties()` - Initialize boss properties
- `createVisuals(x, y)` - Create boss with health bar
- `update()` - Update boss behavior and health bar
- `updateHealthBar()` - Update health bar position and color
- `tryPerformAttack()` - Choose between different attacks
- `performNormalAttack(playerPos)` - Fire projectiles in a spread pattern
- `performDashAttack(playerPos)` - Charge at the player
- `performSpecialAttack(playerPos)` - Area effect attack
- `moveTowardsPlayer(playerPos)` - Custom movement pattern
- `takeDamage(amount)` - Take damage with phase transitions
- `die()` - Handle boss death with special effects

**Properties:**
- `speed: 0.25` - Very slow base movement speed
- `size: 40` - Very large collision size
- `health: 1000` - Extremely high health
- `damage: 40` - Very high damage
- `scoreValue: 500` - Very high score value
- `attackPhase` - Current attack phase (normal, charging, special)
- `attackRange: 300` - Range for normal attacks
- `attackCooldownTime: 3000` - Time between normal attacks
- `specialAttackCooldownTime: 15000` - Time between special attacks
- `dashCooldownTime: 8000` - Time between dash attacks
- `dashSpeed: 1.8` - Speed during dash
- `dashTime: 1000` - Duration of dash
- `healthSegments: 3` - Number of health phases

### Faction-Based Outline System

Enemies display colored outlines based on their faction, making it easy to identify allies and enemies at a glance.

#### `OutlinePipeline.js`

A WebGL pipeline for rendering sprites with colored outlines.

**Methods:**
- `constructor(game)` - Creates the shader pipeline

**Outline Colors:**
- `GROUP_IDS.FRIENDLY` - Green outline
- `GROUP_IDS.HOSTILE` - Red outline
- `GROUP_IDS.NEUTRAL` - Yellow outline
- `GROUP_IDS.FACTION_A` - Blue outline
- `GROUP_IDS.FACTION_B` - Orange outline
- `GROUP_IDS.FACTION_C` - Purple outline

### Creating Enemies

Enemies are created using the registry and factory pattern:

```javascript
// Create the enemy registry
const enemyRegistry = new EnemyRegistry(scene);

// Create specific enemy types
const basicEnemy = enemyRegistry.createEnemy('enemy1', x, y);
const tankEnemy = enemyRegistry.createEnemy('enemy2', x, y);
const rangedEnemy = enemyRegistry.createEnemy('enemy3', x, y);

// Create a boss
const boss = enemyRegistry.createBoss('boss1', x, y);

// Set enemy faction
enemy.setGroupId(GROUP_IDS.FACTION_A);
```

### Enemy Behavior

Enemies use different behaviors based on their type:

- **SpriteEnemy1 (Basic)**: Simple chase behavior
- **SpriteEnemy2 (Tank)**: Charge attacks when in range
- **SpriteEnemy3 (Ranged)**: Maintains distance and fires projectiles
- **SpriteBoss1 (Boss)**: Multiple attack patterns and phases

### Enemy Health Display

Boss enemies display health bars above them:

```javascript
// In SpriteBoss1.js
updateHealthBar() {
    // Position the health bar above the boss
    this.healthBarBg.x = this.graphics.x;
    this.healthBarBg.y = this.graphics.y - this.size - 10;
    
    // Update health bar width based on current health percentage
    const healthPercent = this.health / this.baseHealth;
    this.healthBarFg.width = 80 * healthPercent;
    
    // Change color based on health
    if (healthPercent < 0.3) {
        this.healthBarFg.fillColor = 0xFF0000; // Red when low health
    } else if (healthPercent < 0.6) {
        this.healthBarFg.fillColor = 0xFFAA00; // Orange when medium health
    } else {
        this.healthBarFg.fillColor = 0x00FF00; // Green when high health
    }
}
```

## Enemy Death

When enemies are defeated, they play death animations and may drop rewards:

```javascript
// In SpriteEnemy.js
die() {
    // Play death animation if available
    if (this.graphics && !this.graphics.anims.currentAnim?.key.includes('death')) {
        // Try to play death animation
        this.playAnimation('death', false);
        
        // Check if death animation exists
        if (this.graphics.anims.currentAnim?.key.includes('death')) {
            // If death animation exists, wait for it to complete
            this.scene.time.delayedCall(1000, () => {
                super.die();
            });
            return;
        }
    }
    
    // If no death animation, just die immediately
    super.die();
}
```
