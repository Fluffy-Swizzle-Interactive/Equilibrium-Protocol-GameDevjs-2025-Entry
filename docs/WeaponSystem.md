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
  createMinigunBullet(x, y, dirX, dirY, speed, health, color, size)
  createShotgunBullets(x, y, dirX, dirY, speed, health, color, size, count, spreadAngle)
  releaseBullet(bullet)
  updateBullets(updateFunc, cullFunc)
  getStats()
}
```

BulletPool implements object pooling for bullets to optimize performance by:
- Reusing bullet objects instead of creating new ones
- Managing different bullet types (minigun, shotgun)
- Handling bullet lifecycle (creation, updating, destruction)

## Weapon Types

### Minigun
- Fast firing single bullets
- Medium damage per shot
- High rate of fire
- Yellow bullet color

### Shotgun
- Multiple bullets fired in a spread pattern
- Lower damage per individual bullet
- Lower rate of fire
- Orange bullet color

## Drone System

Drones are combat companions that:
1. Orbit the player in a circular pattern
2. Fire automatically at the same target as the player
3. Use the same weapon type as the player but with reduced damage (70%)
4. Can be acquired through shop upgrades

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

## Integration with Other Systems

The weapon system integrates with:
- **Shop System** - For purchasing upgrades
- **Sound System** - For weapon and drone sound effects
- **Enemy System** - For collision detection and damage application
- **UI System** - For displaying weapon stats and drone count