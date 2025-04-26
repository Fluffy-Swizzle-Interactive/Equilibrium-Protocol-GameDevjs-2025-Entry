# Game Mechanics

## Overview

This document outlines the core gameplay mechanics of Fluffy-Swizz Interactive, including player controls, combat systems, progression, and game modes.

## Player Controls

### Movement

The player moves using WASD keys:
- `W` - Move up
- `A` - Move left
- `S` - Move down
- `D` - Move right

Movement is omnidirectional and allows for diagonal movement by pressing multiple keys simultaneously.

### Aiming

Aiming is controlled with the mouse. The player character automatically rotates to face the mouse cursor position.

### Firing

- **Primary Fire**: Left mouse button
- **Weapon Switch**: Number keys (1-2) or mouse wheel
  - `1` - Minigun
  - `2` - Shotgun

## Weapon Systems

The game features two distinct weapon systems:

### Minigun

A rapid-fire weapon with moderate damage per shot.

**Properties:**
- High fire rate (10 shots per second)
- Low spread (±5 degrees)
- Moderate damage (10 per bullet)
- Long range (800 pixels)
- Low energy consumption

**Implementation:**
```javascript
// Example: Minigun firing implementation
fireMinigun() {
    if (this.time.now > this.nextFire) {
        // Calculate fire rate based on player level and upgrades
        const fireDelay = 1000 / (this.baseFireRate + (this.level * 0.5));
        
        // Create bullet from pool
        const bullet = this.bulletPool.createBullet(
            this.x, 
            this.y, 
            {
                angle: this.angle + (Math.random() * 10 - 5),
                speed: 800,
                damage: 10 + (this.level * 2),
                lifespan: 1000,
                texture: 'bullet_minigun'
            }
        );
        
        // Play sound effect
        this.scene.sound.play('minigun_fire');
        
        // Set next fire time
        this.nextFire = this.time.now + fireDelay;
    }
}
```

### Shotgun

A burst weapon that fires multiple projectiles in a spread pattern.

**Properties:**
- Low fire rate (1 shot per second)
- High spread (±20 degrees)
- High damage (8 pellets × 15 damage per pellet)
- Short range (400 pixels)
- High energy consumption

**Implementation:**
```javascript
// Example: Shotgun firing implementation
fireShotgun() {
    if (this.time.now > this.nextFire) {
        // Calculate fire rate based on player level and upgrades
        const fireDelay = 1000 / (this.baseFireRate * 0.1 + (this.level * 0.05));
        
        // Fire multiple pellets in a spread
        const pelletCount = 8;
        for (let i = 0; i < pelletCount; i++) {
            // Calculate spread angle
            const spreadAngle = this.angle + (Math.random() * 40 - 20);
            
            // Create bullet from pool
            const bullet = this.bulletPool.createBullet(
                this.x, 
                this.y, 
                {
                    angle: spreadAngle,
                    speed: 600,
                    damage: 15 + (this.level * 1.5),
                    lifespan: 500,
                    texture: 'bullet_shotgun'
                }
            );
        }
        
        // Play sound effect
        this.scene.sound.play('shotgun_fire');
        
        // Set next fire time
        this.nextFire = this.time.now + fireDelay;
    }
}
```

## Combat System

### Damage Calculation

Damage is calculated based on:
- Base weapon damage
- Player level multiplier
- Critical hit chance (random 10% chance for 2x damage)
- Enemy resistance (some enemies take reduced damage)

```javascript
// Example: Damage calculation
calculateDamage(baseDamage, targetEnemy) {
    // Apply level multiplier
    let damage = baseDamage * (1 + (this.level * 0.1));
    
    // Check for critical hit
    const isCritical = Math.random() < 0.1;
    if (isCritical) {
        damage *= 2;
        this.createCriticalHitEffect(targetEnemy.x, targetEnemy.y);
    }
    
    // Apply enemy resistance
    if (targetEnemy.data.get('resistance')) {
        damage *= (1 - targetEnemy.data.get('resistance'));
    }
    
    return Math.floor(damage);
}
```

### Hit Detection

The game uses Phaser's Arcade Physics for hit detection:

```javascript
// Example: Bullet-enemy collision detection
this.physics.add.overlap(
    this.bulletPool.getGroup(),
    this.enemyGroup,
    (bullet, enemy) => {
        // Calculate damage
        const damage = this.calculateDamage(bullet.damage, enemy);
        
        // Apply damage to enemy
        enemy.takeDamage(damage);
        
        // Create hit effect
        this.spritePool.createHitEffect(bullet.x, bullet.y);
        
        // Release bullet back to pool if not piercing
        if (!bullet.piercing) {
            this.bulletPool.releaseBullet(bullet);
        }
    },
    null,
    this
);
```

## Game Modes

### Endless Survival

- Infinite waves of enemies
- Increasing difficulty over time
- Goal: Survive as long as possible and achieve high score

**Difficulty Scaling:**
- Enemy health: +5% per minute
- Enemy speed: +3% per minute
- Enemy spawn rate: +10% per minute
- Boss spawn: Every 5 minutes

### Wave-Based Survival

- Fixed number of waves (20)
- Each wave has specific enemy types and counts
- Short break between waves
- Goal: Complete all waves

**Wave Structure:**
- Waves 1-5: Basic enemies
- Waves 6-10: Mix of basic and fast enemies
- Waves 11-15: Mix of all enemy types
- Waves 16-19: Difficult enemy combinations
- Wave 20: Final boss wave

## Progression Systems

### XP System

Players earn XP by defeating enemies:
- Basic enemy: 10 XP
- Fast enemy: 15 XP
- Tank enemy: 25 XP
- Boss enemy: 100 XP

XP required for each level follows this formula:
```
XP_Required = 100 * (level ^ 1.5)
```

### Level-Up Benefits

Each level provides:
- +5% damage
- +3% movement speed
- +10 max health
- Faster reload/fire rate

### Cash System

Players earn cash by defeating enemies:
- Basic enemy: 5 cash
- Fast enemy: 8 cash
- Tank enemy: 15 cash
- Boss enemy: 50 cash

Cash can be spent on:
- Temporary power-ups
- Permanent upgrades
- Extra lives

## Difficulty Balancing

The game's difficulty is balanced through several mechanisms:

### Dynamic Difficulty Adjustment

- Enemy spawn rate adjusts based on player performance
- Health pickups appear more frequently when player health is low
- Power-up frequency increases during difficult sections

### Spawn Control

Enemies spawn in waves with controlled composition:

```javascript
// Example: Spawn wave implementation
spawnWave(waveNumber) {
    const baseEnemyCount = 5 + (waveNumber * 2);
    const tankChance = Math.min(0.1 + (waveNumber * 0.01), 0.3);
    const fastChance = Math.min(0.2 + (waveNumber * 0.02), 0.4);
    
    // Determine enemy counts
    const tankCount = Math.floor(baseEnemyCount * tankChance);
    const fastCount = Math.floor(baseEnemyCount * fastChance);
    const basicCount = baseEnemyCount - tankCount - fastCount;
    
    // Spawn enemies
    this.spawnEnemies('basic', basicCount);
    this.spawnEnemies('fast', fastCount);
    this.spawnEnemies('tank', tankCount);
    
    // Spawn boss every 5 waves
    if (waveNumber % 5 === 0) {
        this.spawnBoss();
    }
}
```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
