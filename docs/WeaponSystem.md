# Weapon System Documentation

## Overview
The weapon system provides player weapons, firing mechanics, and drone companions. It's implemented through the WeaponManager class which handles a unified weapon system, projectiles, and associated drone units.

## Core Components

### WeaponManager
```javascript
class WeaponManager {
  constructor(scene, player, options = {})
  initWeaponProperties()
  addDrone()
  upgradeDrones()
  updateDrones()
  shoot(targetX, targetY)
  shootDrones(targetX, targetY)
  createBulletFromDrone(drone, dirX, dirY)
  createBullet(spawnX, spawnY, dirX, dirY, damageMultiplier = 1.0)
  playWeaponSound()
  applyUpgrade(upgrade)
  update()
  getStats()
  destroy()
}
```

The WeaponManager is responsible for:
- Managing unified weapon configuration
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
- Use the same weapon system as the player

### BulletPool
```javascript
class BulletPool {
  constructor(scene, options = {})
  createBullet(x, y, dirX, dirY, speed, health, color, size)
  releaseBullet(bullet)
  updateBullets(updateFunc, cullFunc)
  getStats()
}
```

BulletPool implements object pooling for bullets to optimize performance by:
- Reusing bullet objects instead of creating new ones
- Managing bullet lifecycle (creation, updating, destruction)

## Unified Weapon System

The game uses a single unified weapon system with the following properties:
- Standard fire rate derived from SETTINGS.WEAPON_FIRE_RATE constant
- Bullet damage based on SETTINGS.WEAPON_BULLET_DAMAGE
- Bullet speed from SETTINGS.WEAPON_BULLET_SPEED
- Consistent bullet size (caliber) from SETTINGS.WEAPON_BULLET_CALIBER
- Standard yellow bullet color (0xffff00)

This unified approach simplifies code maintenance and game balance while still providing room for customization through upgrades.

## Drone System

Drones are combat companions that:
1. Orbit the player in a circular pattern at evenly distributed positions
2. Fire automatically at the same target as the player
3. Only fire when the cursor exceeds their orbital radius (preventing short-range firing)
4. Use the same weapon system as the player but with reduced damage (70%)
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
this.player.initWeaponSystem();

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