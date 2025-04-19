# Chaos System

## Overview

This document describes the Chaos System in Fluffy-Swizz Interactive, a dynamic difficulty adjustment mechanism that increases challenge and unpredictability as players progress through the game.

## Core Concepts

The Chaos System introduces escalating difficulty and unpredictable elements to prevent gameplay from becoming repetitive. As the player performs well, the Chaos Meter fills, triggering various effects that make the game more challenging and dynamic.

### Chaos Meter

The Chaos Meter is a gauge that fills based on player actions:
- Killing enemies increases the meter
- Taking damage slightly decreases the meter
- The meter gradually decreases over time if no enemies are killed
- Reaching certain thresholds triggers Chaos Events

### Chaos Events

When the Chaos Meter reaches specific thresholds, Chaos Events are triggered:
- Minor Events (25% meter): Small gameplay modifications
- Moderate Events (50% meter): Significant gameplay changes
- Major Events (75% meter): Dramatic alterations to gameplay
- Critical Events (100% meter): Game-changing events

## Implementation

### Chaos Manager

The Chaos System is managed by the `ChaosManager` class.

#### `ChaosManager.js`

**Methods:**
- `constructor(scene)` - Initializes the chaos manager
- `init(options)` - Sets up with configuration options
- `update(time, delta)` - Updates chaos system each frame
- `increaseChaos(amount)` - Increases the chaos meter
- `decreaseChaos(amount)` - Decreases the chaos meter
- `getChaosLevel()` - Gets current chaos level (0-100)
- `getChaosThreshold()` - Gets current chaos threshold (0-4)
- `triggerChaosEvent()` - Triggers a chaos event based on current level
- `registerChaosEvent(threshold, event)` - Registers a new chaos event
- `resetChaos()` - Resets the chaos meter to zero

**Properties:**
- `scene` - Reference to the current scene
- `chaosLevel` - Current chaos level (0-100)
- `chaosDecayRate` - Rate at which chaos decreases over time
- `chaosEvents` - Collection of registered chaos events
- `activeEvents` - Currently active chaos events
- `lastEventTime` - Time when the last event was triggered
- `eventCooldown` - Cooldown between events

### Chaos UI

The Chaos Meter is displayed in the game UI:

```javascript
// In UIManager.js
createChaosMeter() {
    // Create container for chaos meter
    this.chaosContainer = this.scene.add.container(100, 100);
    
    // Background
    this.chaosBg = this.scene.add.image(0, 0, 'chaos_meter_bg')
        .setOrigin(0.5)
        .setScale(0.8);
    
    // Meter fill
    this.chaosFill = this.scene.add.image(0, 0, 'chaos_meter_fill')
        .setOrigin(0.5)
        .setScale(0.8);
    
    // Create mask for fill
    const fillMask = this.scene.make.graphics();
    fillMask.fillRect(
        this.chaosFill.x - this.chaosFill.displayWidth / 2,
        this.chaosFill.y - this.chaosFill.displayHeight / 2,
        this.chaosFill.displayWidth,
        this.chaosFill.displayHeight
    );
    
    // Apply mask to fill
    this.chaosFillMask = fillMask.createGeometryMask();
    this.chaosFill.setMask(this.chaosFillMask);
    
    // Icon
    this.chaosIcon = this.scene.add.image(0, 0, 'chaos_icon')
        .setOrigin(0.5)
        .setScale(0.6);
    
    // Add elements to container
    this.chaosContainer.add([this.chaosBg, this.chaosFill, this.chaosIcon]);
    
    // Set container position
    this.chaosContainer.setPosition(80, 150);
    this.chaosContainer.setScrollFactor(0);
    this.chaosContainer.setDepth(100);
}

updateChaosMeter(chaosLevel) {
    // Calculate fill height based on chaos level (0-100)
    const fillHeight = (chaosLevel / 100) * this.chaosFill.height;
    
    // Update mask to show correct fill amount
    this.chaosFillMask.geometryMask.clear();
    this.chaosFillMask.geometryMask.fillRect(
        this.chaosFill.x - this.chaosFill.displayWidth / 2,
        this.chaosFill.y + this.chaosFill.displayHeight / 2 - fillHeight,
        this.chaosFill.displayWidth,
        fillHeight
    );
    
    // Update icon color based on chaos level
    if (chaosLevel < 25) {
        this.chaosIcon.setTint(0xFFFFFF); // White
    } else if (chaosLevel < 50) {
        this.chaosIcon.setTint(0xFFFF00); // Yellow
    } else if (chaosLevel < 75) {
        this.chaosIcon.setTint(0xFF8800); // Orange
    } else {
        this.chaosIcon.setTint(0xFF0000); // Red
    }
    
    // Pulse icon if at high chaos
    if (chaosLevel >= 75 && !this.chaosIconTween) {
        this.chaosIconTween = this.scene.tweens.add({
            targets: this.chaosIcon,
            scale: { from: 0.6, to: 0.8 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    } else if (chaosLevel < 75 && this.chaosIconTween) {
        this.chaosIconTween.stop();
        this.chaosIconTween = null;
        this.chaosIcon.setScale(0.6);
    }
}
```

### Chaos Events Implementation

Chaos events are implemented as functions that modify gameplay:

```javascript
// In ChaosManager.js
initChaosEvents() {
    // Register minor events (25% chaos)
    this.registerChaosEvent(1, {
        id: 'faster_enemies',
        name: 'Speed Surge',
        description: 'Enemies move 25% faster',
        duration: 30000, // 30 seconds
        execute: () => {
            // Increase enemy speed
            this.scene.enemyFactory.modifyEnemySpeed(1.25);
            
            // Show notification
            this.scene.uiManager.showChaosEventNotification(
                'Speed Surge',
                'Enemies move 25% faster!'
            );
            
            // Return cleanup function
            return () => {
                this.scene.enemyFactory.modifyEnemySpeed(0.8); // Revert speed (1/1.25)
            };
        }
    });
    
    this.registerChaosEvent(1, {
        id: 'reduced_ammo',
        name: 'Ammo Shortage',
        description: 'Weapon energy depletes 50% faster',
        duration: 20000, // 20 seconds
        execute: () => {
            // Increase energy consumption
            this.scene.player.setEnergyCostMultiplier(1.5);
            
            // Show notification
            this.scene.uiManager.showChaosEventNotification(
                'Ammo Shortage',
                'Weapon energy depletes 50% faster!'
            );
            
            // Return cleanup function
            return () => {
                this.scene.player.setEnergyCostMultiplier(1);
            };
        }
    });
    
    // Register moderate events (50% chaos)
    this.registerChaosEvent(2, {
        id: 'enemy_swarm',
        name: 'Enemy Swarm',
        description: 'A large group of enemies appears',
        duration: 0, // Instant effect
        execute: () => {
            // Spawn a swarm of enemies
            const playerPos = {
                x: this.scene.player.x,
                y: this.scene.player.y
            };
            
            // Spawn 10-15 basic enemies in a circle around the player
            const count = Phaser.Math.Between(10, 15);
            const radius = 600; // Spawn distance
            
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const x = playerPos.x + Math.cos(angle) * radius;
                const y = playerPos.y + Math.sin(angle) * radius;
                
                this.scene.enemyFactory.createEnemy('basic', x, y);
            }
            
            // Show notification
            this.scene.uiManager.showChaosEventNotification(
                'Enemy Swarm',
                'A swarm of enemies has appeared!'
            );
            
            // No cleanup needed
            return () => {};
        }
    });
    
    this.registerChaosEvent(2, {
        id: 'toxic_pools',
        name: 'Toxic Pools',
        description: 'Toxic pools appear on the ground',
        duration: 45000, // 45 seconds
        execute: () => {
            // Create toxic pools
            const pools = [];
            const poolCount = Phaser.Math.Between(5, 8);
            
            for (let i = 0; i < poolCount; i++) {
                // Random position within camera view
                const x = this.scene.player.x + Phaser.Math.Between(-400, 400);
                const y = this.scene.player.y + Phaser.Math.Between(-300, 300);
                
                // Create pool sprite
                const pool = this.scene.add.sprite(x, y, 'toxic_pool')
                    .setScale(Phaser.Math.FloatBetween(0.8, 1.2))
                    .setAlpha(0.8)
                    .setDepth(5);
                
                // Create damage area
                const damageArea = this.scene.add.zone(x, y, 100, 100)
                    .setCircleDropZone(50);
                
                this.scene.physics.world.enable(damageArea);
                
                // Set up overlap with player
                this.scene.physics.add.overlap(
                    this.scene.player,
                    damageArea,
                    () => {
                        // Damage player when in toxic pool
                        this.scene.player.takeDamage(1);
                    }
                );
                
                // Add to pools array for cleanup
                pools.push({ sprite: pool, zone: damageArea });
            }
            
            // Show notification
            this.scene.uiManager.showChaosEventNotification(
                'Toxic Pools',
                'Watch your step! Toxic pools have formed!'
            );
            
            // Return cleanup function
            return () => {
                // Remove all pools
                for (const pool of pools) {
                    pool.sprite.destroy();
                    pool.zone.destroy();
                }
            };
        }
    });
    
    // Register major events (75% chaos)
    this.registerChaosEvent(3, {
        id: 'elite_enemies',
        name: 'Elite Enemies',
        description: 'Enemies become stronger and more resilient',
        duration: 40000, // 40 seconds
        execute: () => {
            // Enhance all active enemies
            const activeEnemies = this.scene.enemyFactory.getActiveEnemies();
            
            for (const enemy of activeEnemies) {
                // Make enemy elite
                enemy.setTint(0xFF0000); // Red tint
                enemy.maxHealth *= 1.5;
                enemy.health = enemy.maxHealth;
                enemy.damage *= 1.5;
                enemy.scoreValue *= 2;
                enemy.xpValue *= 2;
                enemy.cashValue *= 2;
                
                // Add glow effect
                const glow = this.scene.add.sprite(enemy.x, enemy.y, 'glow_effect')
                    .setScale(1.5)
                    .setAlpha(0.5)
                    .setTint(0xFF0000)
                    .setDepth(enemy.depth - 1);
                
                // Store glow reference on enemy
                enemy.glowEffect = glow;
                
                // Update enemy's update method to move glow
                const originalUpdate = enemy.update;
                enemy.update = function(time, delta) {
                    originalUpdate.call(this, time, delta);
                    if (this.glowEffect) {
                        this.glowEffect.x = this.x;
                        this.glowEffect.y = this.y;
                    }
                };
            }
            
            // Show notification
            this.scene.uiManager.showChaosEventNotification(
                'Elite Enemies',
                'Enemies have become stronger and more resilient!'
            );
            
            // Return cleanup function
            return () => {
                // Remove elite status from remaining enemies
                const remainingEnemies = this.scene.enemyFactory.getActiveEnemies();
                
                for (const enemy of remainingEnemies) {
                    // Remove elite status
                    enemy.clearTint();
                    enemy.maxHealth /= 1.5;
                    enemy.health = Math.min(enemy.health, enemy.maxHealth);
                    enemy.damage /= 1.5;
                    enemy.scoreValue /= 2;
                    enemy.xpValue /= 2;
                    enemy.cashValue /= 2;
                    
                    // Remove glow effect
                    if (enemy.glowEffect) {
                        enemy.glowEffect.destroy();
                        enemy.glowEffect = null;
                    }
                    
                    // Restore original update method
                    enemy.update = originalUpdate;
                }
            };
        }
    });
    
    this.registerChaosEvent(3, {
        id: 'weapon_malfunction',
        name: 'Weapon Malfunction',
        description: 'Primary weapon is disabled',
        duration: 15000, // 15 seconds
        execute: () => {
            // Store original weapon
            const originalWeapon = this.scene.player.currentWeapon;
            
            // Disable primary weapon
            this.scene.player.disableWeapon(originalWeapon);
            
            // Show notification
            this.scene.uiManager.showChaosEventNotification(
                'Weapon Malfunction',
                'Your primary weapon has malfunctioned!'
            );
            
            // Return cleanup function
            return () => {
                // Re-enable original weapon
                this.scene.player.enableWeapon(originalWeapon);
            };
        }
    });
    
    // Register critical events (100% chaos)
    this.registerChaosEvent(4, {
        id: 'boss_appearance',
        name: 'Boss Appearance',
        description: 'A powerful boss enemy appears',
        duration: 0, // Instant effect (boss remains until defeated)
        execute: () => {
            // Determine boss type based on game progress
            let bossType = 'boss1';
            if (this.scene.difficultyLevel > 10) {
                bossType = 'boss2';
            }
            
            // Calculate spawn position (opposite side from player facing direction)
            const angle = this.scene.player.rotation + Math.PI;
            const x = this.scene.player.x + Math.cos(angle) * 800;
            const y = this.scene.player.y + Math.sin(angle) * 800;
            
            // Play warning sound
            this.scene.soundManager.playSound('boss_warning');
            
            // Show boss warning
            this.scene.uiManager.showBossWarning();
            
            // Spawn boss after delay
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
                    
                    // Reset chaos meter
                    this.resetChaos();
                    
                    // Listen for boss death
                    boss.once('died', () => {
                        // Return to normal music
                        this.scene.soundManager.crossFadeMusic(
                            'boss_music',
                            'gameplay_music',
                            2000
                        );
                    });
                }
            );
            
            // Show notification
            this.scene.uiManager.showChaosEventNotification(
                'Boss Appearance',
                'A powerful enemy has appeared!',
                5000 // Longer display time
            );
            
            // No cleanup needed (boss handles itself)
            return () => {};
        }
    });
    
    this.registerChaosEvent(4, {
        id: 'reality_shift',
        name: 'Reality Shift',
        description: 'The game world is dramatically altered',
        duration: 60000, // 60 seconds
        execute: () => {
            // Store original game state
            const originalState = {
                timeScale: this.scene.time.timeScale,
                gravity: this.scene.physics.world.gravity.y,
                backgroundColor: this.scene.cameras.main.backgroundColor
            };
            
            // Apply visual effects
            this.scene.cameras.main.setBackgroundColor(0x330033);
            this.scene.cameras.main.setTint(0xFF00FF);
            
            // Apply gameplay changes
            this.scene.time.timeScale = 0.7; // Slow down time
            this.scene.physics.world.gravity.y = 200; // Add gravity
            
            // Add floating particles
            const particles = this.scene.add.particles('particle_texture');
            const emitter = particles.createEmitter({
                x: { min: 0, max: this.scene.game.config.width },
                y: { min: 0, max: this.scene.game.config.height },
                scale: { start: 0.5, end: 0 },
                speed: { min: 20, max: 50 },
                angle: { min: 0, max: 360 },
                rotate: { min: 0, max: 360 },
                lifespan: { min: 2000, max: 4000 },
                frequency: 50,
                tint: [0xFF00FF, 0x00FFFF, 0xFFFF00],
                blendMode: 'ADD',
                follow: this.scene.cameras.main
            });
            
            // Show notification
            this.scene.uiManager.showChaosEventNotification(
                'Reality Shift',
                'The fabric of reality has been altered!',
                5000 // Longer display time
            );
            
            // Return cleanup function
            return () => {
                // Restore original state
                this.scene.time.timeScale = originalState.timeScale;
                this.scene.physics.world.gravity.y = originalState.gravity;
                this.scene.cameras.main.clearTint();
                this.scene.cameras.main.setBackgroundColor(originalState.backgroundColor);
                
                // Destroy particles
                particles.destroy();
            };
        }
    });
}
```

### Triggering Chaos Events

Chaos events are triggered when the meter reaches thresholds:

```javascript
// In ChaosManager.js
update(time, delta) {
    // Skip if game is paused
    if (this.scene.physics.world.isPaused) return;
    
    // Gradually decrease chaos over time
    if (this.chaosLevel > 0) {
        this.chaosLevel -= this.chaosDecayRate * (delta / 1000);
        if (this.chaosLevel < 0) this.chaosLevel = 0;
    }
    
    // Update UI
    this.scene.events.emit('chaos-update', {
        level: this.chaosLevel,
        threshold: this.getChaosThreshold()
    });
    
    // Check for threshold crossing
    const currentThreshold = this.getChaosThreshold();
    if (currentThreshold > this.lastThreshold) {
        // Threshold increased, trigger event if not on cooldown
        if (time > this.lastEventTime + this.eventCooldown) {
            this.triggerChaosEvent();
            this.lastEventTime = time;
        }
    }
    this.lastThreshold = currentThreshold;
    
    // Update active events
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
        const event = this.activeEvents[i];
        
        // Check if event has expired
        if (event.endTime && time > event.endTime) {
            // Execute cleanup function
            if (event.cleanup) {
                event.cleanup();
            }
            
            // Remove from active events
            this.activeEvents.splice(i, 1);
        }
    }
}

getChaosThreshold() {
    // Convert chaos level (0-100) to threshold (0-4)
    if (this.chaosLevel >= 100) return 4; // Critical
    if (this.chaosLevel >= 75) return 3;  // Major
    if (this.chaosLevel >= 50) return 2;  // Moderate
    if (this.chaosLevel >= 25) return 1;  // Minor
    return 0; // No chaos
}

triggerChaosEvent() {
    // Get current threshold
    const threshold = this.getChaosThreshold();
    
    // Get all events for this threshold
    const availableEvents = this.chaosEvents.filter(e => e.threshold === threshold);
    
    if (availableEvents.length === 0) {
        console.warn(`No chaos events registered for threshold ${threshold}`);
        return;
    }
    
    // Select a random event
    const randomEvent = Phaser.Utils.Array.GetRandom(availableEvents);
    
    // Execute the event
    const cleanup = randomEvent.execute();
    
    // Add to active events
    this.activeEvents.push({
        id: randomEvent.id,
        endTime: randomEvent.duration > 0 ? this.scene.time.now + randomEvent.duration : null,
        cleanup: cleanup
    });
    
    // Play chaos event sound
    this.scene.soundManager.playSound('chaos_event');
    
    // Emit event triggered event
    this.scene.events.emit('chaos-event-triggered', {
        id: randomEvent.id,
        name: randomEvent.name,
        description: randomEvent.description,
        threshold: threshold
    });
    
    // If this was a critical event (100% chaos), reset the meter
    if (threshold === 4) {
        this.resetChaos();
    }
}
```

### Increasing Chaos

Chaos increases when the player kills enemies:

```javascript
// In Enemy.js
die() {
    // Existing death logic...
    
    // Increase chaos meter
    this.scene.chaosManager.increaseChaos(this.chaosValue);
    
    // Additional death logic...
}

// In ChaosManager.js
increaseChaos(amount) {
    // Scale amount based on enemy type
    const scaledAmount = amount * this.chaosMultiplier;
    
    // Add to chaos level
    this.chaosLevel += scaledAmount;
    
    // Cap at maximum (100)
    if (this.chaosLevel > 100) {
        this.chaosLevel = 100;
    }
    
    // Emit chaos update event
    this.scene.events.emit('chaos-update', {
        level: this.chaosLevel,
        threshold: this.getChaosThreshold()
    });
}
```

### Decreasing Chaos

Chaos decreases when the player takes damage:

```javascript
// In Player.js
takeDamage(amount) {
    // Existing damage logic...
    
    // Decrease chaos meter
    this.scene.chaosManager.decreaseChaos(amount * 0.5);
    
    // Additional damage logic...
}

// In ChaosManager.js
decreaseChaos(amount) {
    // Scale amount based on current chaos level
    const scaledAmount = amount * (1 + (this.chaosLevel / 100));
    
    // Subtract from chaos level
    this.chaosLevel -= scaledAmount;
    
    // Ensure not below zero
    if (this.chaosLevel < 0) {
        this.chaosLevel = 0;
    }
    
    // Emit chaos update event
    this.scene.events.emit('chaos-update', {
        level: this.chaosLevel,
        threshold: this.getChaosThreshold()
    });
}
```

## Chaos Event Notification

When chaos events are triggered, notifications are displayed:

```javascript
// In UIManager.js
showChaosEventNotification(title, description, duration = 3000) {
    // Create notification container
    const container = this.scene.add.container(512, -50)
        .setDepth(150)
        .setScrollFactor(0);
    
    // Create background
    const bg = this.scene.add.rectangle(0, 0, 400, 80, 0x000000, 0.8)
        .setStrokeStyle(2, 0xFF00FF);
    
    // Create title text
    const titleText = this.scene.add.text(0, -15, title, {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#FF00FF',
        align: 'center'
    }).setOrigin(0.5);
    
    // Create description text
    const descText = this.scene.add.text(0, 15, description, {
        fontFamily: 'Arial',
        fontSize: 16,
        color: '#FFFFFF',
        align: 'center'
    }).setOrigin(0.5);
    
    // Add elements to container
    container.add([bg, titleText, descText]);
    
    // Animate in
    this.scene.tweens.add({
        targets: container,
        y: 100,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
            // Animate out after duration
            this.scene.time.delayedCall(duration, () => {
                this.scene.tweens.add({
                    targets: container,
                    y: -50,
                    duration: 500,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                        container.destroy();
                    }
                });
            });
        }
    });
}
```

## Integration with Other Systems

### Enemy System Integration

Enemies contribute to the Chaos Meter based on their type:

```javascript
// In EnemyFactory.js
getEnemyConfig(type) {
    const config = { ...this.enemyConfigs[type] };
    
    // Add chaos value based on enemy type
    switch (type) {
        case 'basic':
            config.chaosValue = 2;
            break;
        case 'fast':
            config.chaosValue = 3;
            break;
        case 'tank':
            config.chaosValue = 5;
            break;
        default:
            config.chaosValue = 1;
    }
    
    return config;
}

getBossConfig(type) {
    const config = { ...this.bossConfigs[type] };
    
    // Bosses don't contribute to chaos (they're spawned by chaos)
    config.chaosValue = 0;
    
    return config;
}
```

### Wave System Integration

In wave mode, chaos is managed differently:

```javascript
// In WaveManager.js
startWave(waveNumber) {
    // Existing wave start logic...
    
    // Reset chaos at start of wave
    this.scene.chaosManager.resetChaos();
    
    // Increase chaos multiplier based on wave number
    this.scene.chaosManager.setChaosMultiplier(1 + (waveNumber * 0.1));
    
    // Additional wave start logic...
}

endWave() {
    // Existing wave end logic...
    
    // Clear active chaos events
    this.scene.chaosManager.clearActiveEvents();
    
    // Additional wave end logic...
}
```

### Player Upgrades Integration

Players can unlock upgrades that affect the Chaos System:

```javascript
// Example upgrade in CashManager.js
this.availableUpgrades.push({
    id: 'chaos_resistance',
    name: 'Chaos Dampener',
    description: 'Reduces chaos buildup by 20% per level',
    baseCost: 75,
    cost: 75,
    currentLevel: 0,
    maxLevel: 3,
    effect: (player) => {
        // Calculate new chaos multiplier
        const reduction = 0.2 * this.getUpgradeLevel('chaos_resistance');
        const newMultiplier = Math.max(0.2, 1 - reduction);
        
        // Apply to chaos manager
        this.scene.chaosManager.setChaosMultiplier(newMultiplier);
    }
});
```

## Balance Considerations

### Chaos Gain Values

Chaos values are balanced based on enemy difficulty:

| Enemy Type | Chaos Value | Notes |
|------------|-------------|-------|
| Basic      | 2           | Common enemy |
| Fast       | 3           | Quicker but fragile |
| Tank       | 5           | Slow but durable |
| Boss       | 0           | Bosses are spawned by chaos |

### Chaos Decay Rate

The chaos decay rate is balanced to maintain tension:

```javascript
// In ChaosManager.js constructor
this.chaosDecayRate = 2; // Lose 2 chaos points per second
```

### Event Cooldowns

Chaos events have cooldowns to prevent overwhelming the player:

```javascript
// In ChaosManager.js constructor
this.eventCooldown = 30000; // 30 seconds between events
```

## Extension Points

The Chaos System is designed to be extensible for future features:

### Custom Chaos Events

New chaos events can be added easily:

```javascript
// Example of adding a custom chaos event
chaosManager.registerChaosEvent(2, {
    id: 'custom_event',
    name: 'Custom Event',
    description: 'Description of custom event',
    duration: 20000,
    execute: () => {
        // Custom event logic
        
        // Return cleanup function
        return () => {
            // Cleanup logic
        };
    }
});
```

### Difficulty Scaling

The chaos system can be scaled based on difficulty level:

```javascript
// Example of scaling chaos based on difficulty
setChaosScaling(difficultyLevel) {
    // Adjust chaos gain multiplier
    this.chaosMultiplier = 1 + (difficultyLevel * 0.1);
    
    // Adjust chaos decay rate
    this.chaosDecayRate = Math.max(1, 3 - (difficultyLevel * 0.2));
    
    // Adjust event cooldown
    this.eventCooldown = Math.max(15000, 30000 - (difficultyLevel * 1000));
}
```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
