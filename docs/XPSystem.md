# XP System

## Overview

This document describes the experience points (XP) system in Fluffy-Swizz Interactive, including how XP is earned, level progression, and rewards.

## Core Concepts

The XP system provides a progression mechanic that rewards players for defeating enemies and surviving longer. As players gain XP, they level up and become more powerful.

### XP Sources

Players can earn XP from:

- **Defeating enemies** - Primary source of XP
- **Collecting XP orbs** - Dropped by defeated enemies
- **Completing waves** - Bonus XP awarded in wave mode
- **Survival time** - Small passive XP gain over time

### Level Progression

The amount of XP required for each level follows this formula:

```javascript
// XP required for next level
getXPForNextLevel(currentLevel) {
    return Math.floor(100 * Math.pow(currentLevel, 1.5));
}
```

This creates an exponential curve where each level requires more XP than the last.

## Implementation

### XP Manager

The XP system is managed by the `XPManager` class.

#### `XPManager.js`

**Methods:**
- `constructor(scene, player)` - Initializes the XP manager
- `init(options)` - Sets up with configuration options
- `addXP(amount)` - Adds XP to the player
- `levelUp()` - Handles level-up logic
- `getXPForNextLevel(level)` - Calculates XP needed for a level
- `getCurrentLevel()` - Returns current player level
- `getCurrentXP()` - Returns current XP amount
- `getXPToNextLevel()` - Returns XP needed for next level
- `getXPProgress()` - Returns progress to next level (0-1)
- `createXPPickup(x, y, amount)` - Creates an XP pickup at position
- `update(time, delta)` - Updates XP system each frame

**Properties:**
- `scene` - Reference to the current scene
- `player` - Reference to the player object
- `currentXP` - Current XP amount
- `currentLevel` - Current player level
- `xpMultiplier` - Multiplier for XP gains
- `levelUpCallbacks` - Functions to call on level up

### XP Pickups

XP pickups are created when enemies are defeated:

```javascript
// In Enemy.js
die() {
    // Create death effect
    this.scene.spritePool.createDeathEffect(this.x, this.y);
    
    // Drop XP based on enemy type
    const xpAmount = this.xpValue;
    this.scene.xpManager.createXPPickup(this.x, this.y, xpAmount);
    
    // Additional death logic...
}
```

XP pickups are implemented using the `SpritePool` system:

```javascript
// In XPManager.js
createXPPickup(x, y, amount) {
    // Create XP pickup sprite
    const xpPickup = this.scene.spritePool.createXPPickup(x, y, {
        value: amount,
        tint: 0x44FF44, // Green color
        scale: 0.4 + (amount / 100) * 0.3, // Size based on value
        lifespan: 15000 // 15 seconds before disappearing
    });
    
    return xpPickup;
}
```

### Collecting XP

XP is collected when the player touches XP pickups:

```javascript
// In Game.js update method
// Check for XP pickup collisions
this.spritePool.checkCollision(
    this.player.x, 
    this.player.y, 
    50, // Collection radius
    (sprite) => {
        // Add XP to player
        const xpAmount = sprite.customData.value;
        this.xpManager.addXP(xpAmount);
        
        // Play pickup sound
        this.soundManager.playSound('pickup_xp', {
            volume: 0.5 + (xpAmount / 50) * 0.5 // Volume based on value
        });
        
        // Show floating text
        this.uiManager.showFloatingText(
            sprite.x, 
            sprite.y, 
            `+${xpAmount} XP`, 
            0x44FF44
        );
    },
    'xp_pickup' // Only check XP pickups
);
```

### Level-Up Process

When the player gains enough XP, they level up:

```javascript
// In XPManager.js
addXP(amount) {
    // Apply XP multiplier
    const adjustedAmount = amount * this.xpMultiplier;
    
    // Add to current XP
    this.currentXP += adjustedAmount;
    
    // Check for level up
    const xpForNextLevel = this.getXPForNextLevel(this.currentLevel);
    
    if (this.currentXP >= xpForNextLevel) {
        // Subtract XP needed for this level
        this.currentXP -= xpForNextLevel;
        
        // Increase level
        this.currentLevel++;
        
        // Call level up method
        this.levelUp();
        
        // Check for multiple level ups (rare but possible)
        if (this.currentXP >= this.getXPForNextLevel(this.currentLevel)) {
            this.addXP(0); // Recursive call to handle additional level ups
        }
    }
    
    // Update UI
    this.scene.events.emit('xp-update', {
        currentXP: this.currentXP,
        nextLevelXP: this.getXPForNextLevel(this.currentLevel),
        currentLevel: this.currentLevel
    });
}

levelUp() {
    // Play level up sound
    this.scene.soundManager.playSound('level_up');
    
    // Show level up animation
    this.scene.uiManager.showLevelUpAnimation(this.currentLevel);
    
    // Apply level up benefits to player
    this.player.maxHealth += 10;
    this.player.health = this.player.maxHealth; // Heal to full on level up
    this.player.damage *= 1.05; // 5% damage increase
    this.player.speed *= 1.03; // 3% speed increase
    
    // Call any registered callbacks
    for (const callback of this.levelUpCallbacks) {
        callback(this.currentLevel);
    }
    
    // Emit level up event
    this.scene.events.emit('player-level-up', {
        level: this.currentLevel,
        player: this.player
    });
}
```

## UI Integration

The XP system integrates with the UI to show player progression:

### XP Bar

A visual representation of progress toward the next level:

```javascript
// In UIManager.js
createXPBar() {
    // Background bar
    this.xpBarBg = this.scene.add.rectangle(
        512, 750, 400, 15, 0x333333
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    
    // Foreground bar (green)
    this.xpBar = this.scene.add.rectangle(
        312, 750, 400, 15, 0x44FF44
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
    
    // Level text
    this.levelText = this.scene.add.text(
        512, 735, 'Level 1', 
        { fontFamily: 'Arial', fontSize: 14, color: '#ffffff' }
    ).setOrigin(0.5, 1).setScrollFactor(0).setDepth(102);
    
    // XP text
    this.xpText = this.scene.add.text(
        512, 765, '0/100 XP', 
        { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102);
}

updateXPUI(currentXP, nextLevelXP, currentLevel) {
    // Calculate XP percentage
    const xpPercent = currentXP / nextLevelXP;
    
    // Update bar width
    this.xpBar.width = 400 * xpPercent;
    
    // Update text
    this.levelText.setText(`Level ${currentLevel}`);
    this.xpText.setText(`${currentXP}/${nextLevelXP} XP`);
}
```

### Level-Up Animation

When the player levels up, an animation is displayed:

```javascript
// In UIManager's showLevelUpAnimation method
showLevelUpAnimation(level) {
    // Create level-up text
    const levelUpText = this.scene.add.text(
        512, 384, `LEVEL UP!\nLevel ${level}`,
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
    const particles = this.scene.add.particles('particle_texture');
    const emitter = particles.createEmitter({
        x: 512,
        y: 384,
        speed: { min: 100, max: 200 },
        scale: { start: 0.5, end: 0 },
        lifespan: 1000,
        blendMode: 'ADD',
        tint: 0x00ff99
    });
    
    // Animate text appearance and fade out
    this.scene.tweens.add({
        targets: levelUpText,
        scale: { from: 0, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 500,
        ease: 'Back.easeOut',
        yoyo: true,
        hold: 1000,
        onComplete: () => {
            levelUpText.destroy();
            emitter.stop();
            particles.destroy();
        }
    });
}
```

## Balance Considerations

### XP Values

XP values are balanced based on enemy difficulty:

| Enemy Type | Base XP Value | Notes |
|------------|---------------|-------|
| Basic      | 10 XP         | Common enemy |
| Fast       | 15 XP         | Quicker but fragile |
| Tank       | 25 XP         | Slow but durable |
| Boss       | 100 XP        | Rare, powerful enemy |

### Level Scaling

The benefits of leveling up are designed to keep pace with increasing enemy difficulty:

- **Health increase**: +10 per level
- **Damage increase**: +5% per level
- **Speed increase**: +3% per level
- **Fire rate increase**: +2% per level

### XP Multipliers

The game includes XP multipliers that can be applied in certain situations:

- **Wave completion bonus**: 1.5x XP for 30 seconds after completing a wave
- **Low health bonus**: 1.2x XP when below 30% health (risk/reward)
- **Streak bonus**: Up to 1.5x XP for consecutive kills without taking damage

## Extension Points

The XP system is designed to be extensible for future features:

### Skill Trees

A planned extension is to add skill trees that unlock at specific levels:

```javascript
// Example skill tree integration
class SkillTreeManager {
    constructor(xpManager) {
        this.xpManager = xpManager;
        this.unlockedSkills = new Set();
        
        // Register for level up events
        this.xpManager.levelUpCallbacks.push((level) => {
            this.checkSkillUnlocks(level);
        });
    }
    
    checkSkillUnlocks(level) {
        // Check for skills that unlock at this level
        const newSkills = this.skillTree.filter(
            skill => skill.requiredLevel === level
        );
        
        // Notify about new skills
        if (newSkills.length > 0) {
            this.showSkillUnlockNotification(newSkills);
        }
    }
    
    // Additional methods...
}
```

### Prestige System

A future extension could include a prestige system that resets level but provides permanent bonuses:

```javascript
// Example prestige system
prestige() {
    // Store current level as prestige level
    this.prestigeLevel = this.currentLevel;
    
    // Reset level and XP
    this.currentLevel = 1;
    this.currentXP = 0;
    
    // Apply prestige bonuses
    this.xpMultiplier = 1 + (this.prestigeLevel * 0.1); // +10% XP per prestige
    
    // Additional prestige rewards...
}
```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
