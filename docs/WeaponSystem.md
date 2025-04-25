# Weapon System Documentation

## Overview
The weapon system provides player weapons, firing mechanics, and drone companions. It's implemented through the WeaponManager class which handles different weapon types, projectiles, and associated drone units.

## Core Components

### WeaponManager
```javascript
class WeaponManager {
  constructor(scene, player, options = {})
  initWeaponProperties(weaponType)
  addDrone()
  upgradeDrones()
  updateDrones()
  shoot(targetX, targetY)
  shootDrones(targetX, targetY)
  createBulletFromDrone(drone, dirX, dirY)
  createMinigunBullet(spawnX, spawnY, dirX, dirY, damageMultiplier = 1.0)
  createShotgunBullets(spawnX, spawnY, dirX, dirY, damageMultiplier = 1.0, overrideBulletCount)
  playWeaponSound()
  applyUpgrade(upgrade)
  update()
  getStats()
  destroy()
}
```

The WeaponManager is responsible for:
- Managing weapon configurations (minigun, shotgun)
- Creating and firing projectiles
- Managing drone companions
- Handling upgrades to weapons and drones
- Processing critical hits, homing bullets, and other special bullet properties

### PlayerDrone
```javascript
class PlayerDrone {
  constructor(scene, x, y, player, index = 0)
  initGraphics(x, y)
  update()
  getPosition()
  shoot(dirX, dirY)
  destroy()
}
```

PlayerDrone represents combat drones that:
- Orbit around the player
- Fire projectiles automatically
- Can be upgraded through the shop system
- Use the same weapon type as the player (minigun, shotgun)

### BulletPool
```javascript
class BulletPool {
  constructor(scene, options = {})
  createMinigunBullet(x, y, dirX, dirY, speed, health, color, size, bulletType, weaponType)
  createShotgunBullets(x, y, dirX, dirY, speed, health, color, size, count, spreadAngle, bulletType, weaponType)
  releaseBullet(bullet)
  updateBullets(updateFunc, cullFunc)
  applyHomingBehavior(bullet)
  updateHomingTrail(bullet, targetEnemy)
  createFallbackParticleTexture()
  findClosestEnemy(bullet)
  getStats()
}
```

BulletPool implements object pooling for bullets to optimize performance by:
- Reusing bullet objects instead of creating new ones
- Managing different bullet types (minigun, shotgun)
- Supporting both sprite-based and circle-based bullets
- Handling bullet lifecycle (creation, updating, destruction)

## Weapon Types

### Minigun
- Fast firing single bullets
- Medium damage per shot
- High rate of fire
- Uses blue bullet sprites (bullet_1, bullet_4, bullet_7)

### Shotgun
- Multiple bullets fired in a spread pattern
- Lower damage per individual bullet
- Lower rate of fire
- Uses red bullet sprites (bullet_2, bullet_5, bullet_8)

### Plasma (Future Expansion)
- Uses green bullet sprites (bullet_3, bullet_6, bullet_9, bullet_10)

## Bullet System

### Sprite-Based Bullets
The game now uses sprite-based bullets instead of simple colored circles. This provides:

- More visually appealing projectiles
- Better collision detection using circle-to-circle physics
- Weapon-specific bullet appearance
- Configurable collision radius for each bullet type
- Support for bullet tinting/coloring

The bullet sprite system includes:
- 10 different bullet sprites (bullet_1 through bullet_10)
- Automatic mapping of weapon types to appropriate bullet sprites
- Fallback to circle bullets if sprite assets aren't available
- Physics bodies for potential collision with map objects
- Proper rotation to match bullet direction

```javascript
// Bullet sprite configuration example
this.bulletSprites = {
  'bullet_1': { key: 'bullet_1', scale: 0.8, radius: 4 },
  'bullet_2': { key: 'bullet_2', scale: 0.8, radius: 5 },
  // etc.
};

// Mapping weapons to bullet sprites
this.weaponBulletMap = {
  'minigun': ['bullet_1', 'bullet_4', 'bullet_7'],
  'shotgun': ['bullet_2', 'bullet_5', 'bullet_8'],
  'plasma': ['bullet_3', 'bullet_6', 'bullet_9', 'bullet_10']
};
```

### Bullet Collision Detection
Bullet collisions with enemies use an optimized detection system:

- Circle-to-circle detection for more accurate sprite-based collisions
- For sprite-based enemies, uses the enemy's bodyRadius property for precise collisions
- For all other enemies, uses distance-based collision detection
- Uses spatial grid optimization to reduce collision checks

## Drone System

Drones are combat companions that:
1. Orbit the player in a circular pattern at evenly distributed positions
2. Fire automatically at the same target as the player
3. Only fire when the cursor exceeds their orbital radius (preventing short-range firing)
4. Use the same weapon type as the player but with reduced damage (70%)
5. Can be acquired through shop upgrades
6. Automatically reposition themselves when new drones are added to maintain even spacing

### Drone Positioning

The drone system features sophisticated positioning logic:
- Drones calculate their position based on the total number of active drones
- Each drone is placed at equal angular intervals around the player (2π / totalDrones)
- When a new drone is added, all existing drones recalculate their positions to maintain even spacing
- A small orbit radius variation creates subtle movement patterns

### Drone Upgrades
The shop system offers up to three drone upgrades:
- Combat Drone I - First drone companion
- Combat Drone II - Second drone companion
- Combat Drone III - Third drone companion

Each drone provides additional firepower to help the player combat waves of enemies.

## Weapon Upgrade System

Weapons can be upgraded through the shop with various enhancements:
- Damage boosts
- Fire rate increases
- Extended range
- Piercing shots
- Critical hit chance
- Area of effect damage
- Homing capabilities
- And more

## Usage Example

```javascript
// In scene creation:
this.player = new Player(this, startX, startY);
this.player.initWeaponSystem('minigun');

// In update loop:
if (this.input.activePointer.isDown) {
  this.player.shoot();
}

// Applying an upgrade:
const upgrade = {
  id: 'damage_1',
  stats: { damage: 1.2 }  // 20% damage boost
};
this.player.weaponManager.applyUpgrade(upgrade);

// Adding a drone:
this.player.weaponManager.upgradeDrones();
```

## Asset Requirements

### Bullet Sprites
The bullet system requires the following sprite assets to be loaded in the preload function:

```javascript
// In scene's preload method:
for (let i = 1; i <= 10; i++) {
  this.load.image(`bullet_${i}`, `assets/sprites/bullets/bullet_${i}.png`);
}
```

Bullets should be placed in: `public/assets/sprites/bullets/`

## Integration with Other Systems

The weapon system integrates with:
- **Shop System** - For purchasing upgrades
- **Sound System** - For weapon and drone sound effects
- **Enemy System** - For collision detection and damage application
- **UI System** - For displaying weapon stats and drone count