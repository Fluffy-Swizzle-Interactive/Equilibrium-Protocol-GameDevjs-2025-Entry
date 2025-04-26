# Game Entities

## Overview

This document describes the various game entities in Fluffy-Swizz Interactive, including the player, enemies, projectiles, and other interactive objects.

## Player

The player is the main character controlled by the user.

### `Player.js`

**Properties:**
- `health` - Current health points
- `maxHealth` - Maximum health points
- `speed` - Movement speed
- `gameMode` - Selected weapon mode ('minigun' or 'shotgun')
- `fireRate` - Rate of fire (shots per second)
- `damage` - Base damage per projectile
- `level` - Current player level
- `xp` - Current experience points
- `cash` - Current cash amount

**Methods:**
- `update(time, delta)` - Updates player state each frame
- `move(cursors)` - Handles player movement based on input
- `aim(pointer)` - Rotates player to face mouse pointer
- `fire()` - Fires the current weapon
- `takeDamage(amount)` - Reduces player health
- `heal(amount)` - Increases player health
- `addXP(amount)` - Adds experience points
- `levelUp()` - Increases player level and stats
- `addCash(amount)` - Adds cash to player's total

**Events Emitted:**
- `player-damage` - When player takes damage
- `player-death` - When player health reaches zero
- `player-level-up` - When player gains a level
- `player-cash-change` - When player cash amount changes

## Enemies

Enemies are the hostile entities that attack the player.

### `Enemy.js`

**Properties:**
- `health` - Current health points
- `maxHealth` - Maximum health points
- `speed` - Movement speed
- `damage` - Damage dealt to player on collision
- `scoreValue` - Points awarded when defeated
- `xpValue` - XP awarded when defeated
- `cashValue` - Cash awarded when defeated
- `type` - Enemy type (basic, fast, tank, boss)

**Methods:**
- `update(time, delta)` - Updates enemy state each frame
- `move(playerPosition)` - Moves enemy toward player
- `takeDamage(amount)` - Reduces enemy health
- `die()` - Handles enemy death (drops, effects)
- `playAnimation(key)` - Plays specified animation

**Enemy Types:**
- **Basic** - Standard enemy with balanced stats
- **Fast** - Quick but fragile enemy
- **Tank** - Slow but durable enemy
- **Boss** - Powerful enemy with special abilities

## Projectiles

Projectiles are fired by the player and enemies.

### `BulletPool.js`

Manages bullet objects for efficient reuse.

**Methods:**
- `createBullet(x, y, options)` - Creates a bullet at specified position
- `releaseBullet(bullet)` - Returns a bullet to the pool
- `update(time, delta)` - Updates all active bullets

**Bullet Properties:**
- `damage` - Damage dealt on hit
- `speed` - Travel speed
- `lifespan` - How long the bullet exists
- `owner` - Who fired the bullet (player or enemy)
- `piercing` - Whether the bullet can hit multiple targets

## Pickups and Effects

Various pickups and visual effects in the game.

### `SpritePool.js`

Manages sprite objects like effects and pickups.

**Methods:**
- `createSprite(x, y, options)` - Creates a sprite at specified position
- `createDeathEffect(x, y, options)` - Creates death animation effect
- `createXPPickup(x, y, options)` - Creates XP pickup
- `createCashPickup(x, y, options)` - Creates cash pickup
- `releaseSprite(sprite)` - Returns a sprite to the pool
- `update(time, delta)` - Updates all active sprites
- `checkCollision(x, y, radius, onCollect, type)` - Checks for collision with collectible sprites

**Pickup Types:**
- **XP Orbs** - Provide experience points
- **Cash** - Provides in-game currency
- **Health** - Restores player health
- **Power-up** - Temporary stat boost

## Collision System

The game uses Phaser's Arcade Physics for collision detection.

**Collision Groups:**
- Player
- Enemies
- PlayerBullets
- EnemyBullets
- Pickups
- Walls

**Collision Handling:**
```javascript
// Example: Setting up player-enemy collision
this.physics.add.collider(
    this.player, 
    this.enemyGroup,
    this.handlePlayerEnemyCollision,
    null,
    this
);

// Example: Setting up bullet-enemy collision
this.physics.add.overlap(
    this.bulletPool.getGroup(),
    this.enemyGroup,
    this.handleBulletEnemyCollision,
    null,
    this
);
```

## Entity Creation Patterns

### Factory Pattern

The game uses factory methods to create entities with consistent configuration:

```javascript
// Example: Enemy factory method
createEnemy(type, x, y) {
    const config = this.enemyConfigs[type];
    const enemy = this.enemyPool.get();
    
    if (enemy) {
        enemy.setPosition(x, y);
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.setData('type', type);
        enemy.setData('health', config.health);
        enemy.setData('speed', config.speed);
        // Additional setup...
        
        return enemy;
    }
    
    return null;
}
```

### Object Pooling

Entities are managed through object pools for performance optimization:

```javascript
// Example: Getting a bullet from the pool
const bullet = this.bulletPool.getBullet(
    this.x, 
    this.y, 
    {
        angle: this.angle,
        speed: 500,
        damage: this.damage
    }
);
```

## Group Management

The GroupManager class handles tracking and organizing game entities by their faction or group.

### Group Manager Methods

- `register(enemy, groupId)`: Registers an enemy with a specific group and applies group modifiers
- `registerEntity(entity, groupId)`: Alias for register method, provides compatibility with entity systems
- `deregister(enemy, groupId)`: Removes an enemy from a group (typically when defeated)
- `getGroupCount(groupId)`: Returns the count of active enemies in a specific group
- `getAllGroupCounts()`: Returns counts for all groups
- `getEntitiesInGroup(groupId)`: Returns an array of all entities belonging to a specific group
- `findNearestHostileEnemy(sourceEnemy, maxDistance)`: Finds the closest enemy that is hostile to the source enemy
- `getHostileEnemiesInRange(groupId, x, y, range)`: Returns all enemies hostile to a group within a specified range

## Entity Lifecycle

1. **Creation** - Entity is created or retrieved from pool
2. **Initialization** - Entity properties are set
3. **Update** - Entity is updated each frame
4. **Destruction** - Entity is returned to pool when no longer needed

## Player Drone

### Overview
PlayerDrone is a companion entity that orbits around the player and can attack enemies. Drones are managed by the WeaponManager and provide support to the player during combat.

### Properties
- `orbitRadius`: Distance from player (default: 120px)
- `orbitSpeed`: Rotation speed around player
- `radius`: Collision radius

### Graphics
- Uses the 'drone' sprite atlas with a 6-frame hover animation
- Frames are named 'drone_0.png' through 'drone_5.png'
- Has fallback rendering options if sprite assets fail to load

### Animation
- `drone_hover`: Continuous hover animation loop
- 10 FPS playback rate

### Behavior
- Orbits around the player at a fixed radius with slight variation
- Distributed evenly around player when multiple drones exist
- Rotates to face the direction of orbit
- Can fire projectiles through the WeaponSystem

### Class Location
`src/game/entities/PlayerDrone.js`

### Related Systems
- WeaponManager handles drone creation and weapons
- Integrates with player XP/leveling system for upgrades

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
