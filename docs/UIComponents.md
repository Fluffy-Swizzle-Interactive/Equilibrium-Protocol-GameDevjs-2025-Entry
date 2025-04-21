# UI Components

## Overview

This document describes the user interface components in Fluffy-Swizz Interactive, including in-game HUD elements, menus, and their implementation.

## UI Manager

The UI system is centralized through the `UIManager` class.

### `UIManager.js`

**Methods:**
- `constructor(scene)` - Creates UI manager for a specific scene
- `init(options)` - Initializes all UI elements
- `createHealthBar()` - Creates player health display
- `createAmmoDisplay()` - Creates ammo/energy display
- `createScoreDisplay()` - Creates score display
- `createWaveInfo()` - Creates wave counter display
- `createLevelDisplay()` - Creates player level display
- `createCashDisplay()` - Creates cash display
- `createNextWaveButton()` - Creates button to trigger next wave
- `createWaveBanner()` - Creates banner for wave notifications
- `updateHealthUI(current, max)` - Updates health bar display
- `updateAmmoUI(current, max)` - Updates ammo/energy display
- `updateScoreUI(score)` - Updates score display
- `updateWaveUI(currentWave, maxWaves)` - Updates wave information
- `updateLevelUI(level, currentXP, nextLevelXP)` - Updates level display
- `updateCashUI(cash)` - Updates cash display
- `showLevelUpAnimation(level)` - Shows level-up animation
- `showGameOverScreen(stats)` - Shows game over screen with stats
- `showVictoryScreen(stats)` - Shows victory screen with stats

## HUD Elements

### Health Bar

Displays the player's current health as a percentage of maximum health.

**Properties:**
- Position: Top-left corner
- Color: Green (full health) to red (low health)
- Updates dynamically as player takes damage or heals

**Implementation:**
```javascript
createHealthBar() {
    // Background bar (gray)
    this.healthBarBg = this.scene.add.rectangle(
        20, 20, 200, 20, 0x333333
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    
    // Foreground bar (green)
    this.healthBar = this.scene.add.rectangle(
        20, 20, 200, 20, 0x00ff00
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
    
    // Health text
    this.healthText = this.scene.add.text(
        125, 20, '100/100', 
        { fontFamily: 'Arial', fontSize: 14, color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(102);
}

updateHealthUI(current, max) {
    // Calculate health percentage
    const healthPercent = Math.max(0, current) / max;
    
    // Update bar width
    this.healthBar.width = 200 * healthPercent;
    
    // Update bar color based on health percentage
    if (healthPercent > 0.6) {
        this.healthBar.fillColor = 0x00ff00; // Green
    } else if (healthPercent > 0.3) {
        this.healthBar.fillColor = 0xffff00; // Yellow
    } else {
        this.healthBar.fillColor = 0xff0000; // Red
    }
    
    // Update text
    this.healthText.setText(`${current}/${max}`);
}
```

### Ammo/Energy Display

Shows the current ammo or energy available for the selected weapon.

**Properties:**
- Position: Bottom-right corner
- Updates based on weapon type and usage
- Recharges over time

### Score Display

Shows the player's current score.

**Properties:**
- Position: Top-right corner
- Updates when enemies are defeated

### Wave Information

Displays the current wave number and total waves (in wave mode).

**Properties:**
- Position: Top-center
- Shows "Wave X of Y" in wave mode
- Shows "Wave X" in endless mode

### Level Display

Shows the player's current level and XP progress.

**Properties:**
- Position: Bottom-left corner
- Includes XP bar showing progress to next level
- Updates when player gains XP

### Cash Display

Shows the player's current cash amount.

**Properties:**
- Position: Top-right corner (below score)
- Updates when player collects cash

## Menu Screens

### Main Menu

The game's starting screen.

**Elements:**
- Game logo
- Game mode selection buttons
- Options button
- Credits button

**Implementation:**
```javascript
create() {
    // Add background
    this.add.image(512, 384, 'bg').setScale(1.2);
    
    // Add logo
    this.logo = this.add.image(512, 200, 'logo').setScale(0.8);
    
    // Add game mode buttons
    this.createButton(512, 350, 'Minigun Mode', () => {
        this.startGame('minigun');
    });
    
    this.createButton(512, 420, 'Shotgun Mode', () => {
        this.startGame('shotgun');
    });
    
    this.createButton(512, 490, 'Wave Mode', () => {
        this.startWaveGame();
    });
    
    // Add options button
    this.createButton(512, 560, 'Options', () => {
        this.showOptions();
    });
}

createButton(x, y, text, callback) {
    // Create button background
    const button = this.add.rectangle(x, y, 200, 50, 0x0066ff)
        .setInteractive()
        .on('pointerdown', callback)
        .on('pointerover', () => button.fillColor = 0x4499ff)
        .on('pointerout', () => button.fillColor = 0x0066ff);
    
    // Create button text
    this.add.text(x, y, text, {
        fontFamily: 'Arial',
        fontSize: 20,
        color: '#ffffff'
    }).setOrigin(0.5);
    
    return button;
}
```

### Game Over Screen

Displayed when the player dies.

**Elements:**
- "Game Over" text
- Final score
- Survival time
- Enemies defeated
- Restart button
- Main menu button

### Victory Screen

Displayed when the player completes all waves in wave mode.

**Elements:**
- "Victory" text
- Final score
- Completion time
- Enemies defeated
- Restart button
- Main menu button

## Notifications and Feedback

### Wave Banner

Displays wave start/complete notifications.

**Implementation:**
```javascript
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

### Level-Up Animation

When the player levels up, an animation is displayed:

```javascript
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

### Damage Numbers

Floating numbers that appear when enemies take damage.

**Implementation:**
```javascript
showDamageNumber(x, y, amount, isCritical = false) {
    // Create text with damage amount
    const damageText = this.scene.add.text(
        x, y, amount.toString(),
        { 
            fontFamily: 'Arial', 
            fontSize: isCritical ? 24 : 16, 
            color: isCritical ? '#ff0000' : '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }
    ).setOrigin(0.5).setDepth(60);
    
    // Animate text floating upward and fading out
    this.scene.tweens.add({
        targets: damageText,
        y: y - 50,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
            damageText.destroy();
        }
    });
}
```

## Debug Panel

A special UI component for development purposes.

### `DebugPanel.jsx`

React component displaying real-time game metrics.

**Props:**
- `gameRef` - Reference to the PhaserGame component

**State:**
- `debugInfo` - Object containing current game metrics

**Displayed Information:**
- FPS
- Enemy count
- Bullet count
- Player position
- Mouse position
- Kill count
- Game mode
- Survival time

**Debug Actions:**
- `Open Shop` - Opens the in-game shop interface for testing purposes

**Implementation:**
```javascript
/**
 * Open the shop from debug panel
 */
const openShop = () => {
    if (gameRef.current?.scene?.shopManager) {
        gameRef.current.scene.shopManager.openShop();
    } else {
        console.warn('ShopManager not found in current scene');
    }
};

// Rendering debug actions section
{renderSection("Debug Actions", <>
    {renderActionButton("Open Shop", openShop)}
</>)}
```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
