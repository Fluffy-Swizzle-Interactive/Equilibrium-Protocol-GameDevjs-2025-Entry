# Cash System

## Overview

This document describes the in-game currency (cash) system in Fluffy-Swizz Interactive, including how cash is earned, spent, and the economy balance.

## Core Concepts

The cash system provides an in-game economy that allows players to purchase upgrades, power-ups, and other items to enhance their gameplay experience.

### Cash Sources

Players can earn cash from:

- **Defeating enemies** - Primary source of cash
- **Collecting cash pickups** - Dropped by defeated enemies
- **Completing waves** - Bonus cash awarded in wave mode
- **Survival milestones** - Bonus cash for surviving certain time periods

### Cash Usage

Cash can be spent on:

- **Permanent upgrades** - Lasting improvements to player stats
- **Temporary power-ups** - Short-term boosts
- **Extra lives** - Continue playing after death (wave mode)
- **Special weapons** - Unlock additional weapon options

## Implementation

### Cash Manager

The cash system is managed by the `CashManager` class.

#### `CashManager.js`

**Methods:**
- `constructor(scene, player)` - Initializes the cash manager
- `init(options)` - Sets up with configuration options
- `addCash(amount)` - Adds cash to the player's total
- `spendCash(amount)` - Deducts cash from the player's total
- `hasSufficientCash(amount)` - Checks if player has enough cash
- `getCurrentCash()` - Returns current cash amount
- `createCashPickup(x, y, amount)` - Creates a cash pickup at position
- `purchaseUpgrade(upgradeId)` - Purchases a permanent upgrade
- `purchasePowerUp(powerUpId)` - Purchases a temporary power-up
- `purchaseExtraLife()` - Purchases an extra life (wave mode)
- `update(time, delta)` - Updates cash system each frame

**Properties:**
- `scene` - Reference to the current scene
- `player` - Reference to the player object
- `currentCash` - Current cash amount
- `cashMultiplier` - Multiplier for cash gains
- `availableUpgrades` - List of purchasable upgrades
- `availablePowerUps` - List of purchasable power-ups
- `extraLifeCost` - Cost of an extra life

### Cash Pickups

Cash pickups are created when enemies are defeated:

```javascript
// In Enemy.js
die() {
    // Create death effect
    this.scene.spritePool.createDeathEffect(this.x, this.y);
    
    // Drop cash based on enemy type
    const cashAmount = this.cashValue;
    this.scene.cashManager.createCashPickup(this.x, this.y, cashAmount);
    
    // Additional death logic...
}
```

Cash pickups are implemented using the `SpritePool` system:

```javascript
// In CashManager.js
createCashPickup(x, y, amount) {
    // Create cash pickup sprite
    const cashPickup = this.scene.spritePool.createCashPickup(x, y, {
        value: amount,
        tint: 0xFFD700, // Gold color
        scale: 0.5,
        lifespan: 10000 // 10 seconds before disappearing
    });
    
    // Add text showing the amount
    cashPickup.textObject = this.scene.add.text(
        x, y - 15, `$${amount}`,
        { fontFamily: 'Arial', fontSize: 14, color: '#FFD700', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0.5).setDepth(cashPickup.depth + 1);
    
    return cashPickup;
}
```

### Collecting Cash

Cash is collected when the player touches cash pickups:

```javascript
// In Game.js update method
// Check for cash pickup collisions
this.spritePool.checkCollision(
    this.player.x, 
    this.player.y, 
    50, // Collection radius
    (sprite) => {
        // Add cash to player
        const cashAmount = sprite.customData.value;
        this.cashManager.addCash(cashAmount);
        
        // Play pickup sound
        this.soundManager.playSound('pickup_cash', {
            volume: 0.5 + (cashAmount / 20) * 0.5 // Volume based on value
        });
        
        // Show floating text
        this.uiManager.showFloatingText(
            sprite.x, 
            sprite.y, 
            `+$${cashAmount}`, 
            0xFFD700
        );
    },
    'cash_pickup' // Only check cash pickups
);
```

### Upgrade System

Players can purchase permanent upgrades using cash:

```javascript
// In CashManager.js
purchaseUpgrade(upgradeId) {
    // Find the upgrade
    const upgrade = this.availableUpgrades.find(u => u.id === upgradeId);
    
    if (!upgrade) {
        console.error(`Upgrade with ID ${upgradeId} not found`);
        return false;
    }
    
    // Check if player has enough cash
    if (!this.hasSufficientCash(upgrade.cost)) {
        console.log(`Not enough cash for upgrade: ${upgrade.name}`);
        return false;
    }
    
    // Check if upgrade is already at max level
    if (upgrade.currentLevel >= upgrade.maxLevel) {
        console.log(`Upgrade already at max level: ${upgrade.name}`);
        return false;
    }
    
    // Spend cash
    this.spendCash(upgrade.cost);
    
    // Apply upgrade effect
    upgrade.effect(this.player);
    
    // Increase upgrade level
    upgrade.currentLevel++;
    
    // Update cost for next level
    upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(1.5, upgrade.currentLevel));
    
    // Play purchase sound
    this.scene.soundManager.playSound('upgrade_purchase');
    
    // Show upgrade notification
    this.scene.uiManager.showUpgradeNotification(upgrade);
    
    // Emit upgrade event
    this.scene.events.emit('player-upgrade', {
        upgrade: upgrade,
        player: this.player
    });
    
    return true;
}
```

### Power-Up System

Players can purchase temporary power-ups using cash:

```javascript
// In CashManager.js
purchasePowerUp(powerUpId) {
    // Find the power-up
    const powerUp = this.availablePowerUps.find(p => p.id === powerUpId);
    
    if (!powerUp) {
        console.error(`Power-up with ID ${powerUpId} not found`);
        return false;
    }
    
    // Check if player has enough cash
    if (!this.hasSufficientCash(powerUp.cost)) {
        console.log(`Not enough cash for power-up: ${powerUp.name}`);
        return false;
    }
    
    // Spend cash
    this.spendCash(powerUp.cost);
    
    // Apply power-up effect
    powerUp.activate(this.player);
    
    // Schedule deactivation after duration
    this.scene.time.delayedCall(
        powerUp.duration,
        () => powerUp.deactivate(this.player),
        [],
        this
    );
    
    // Play purchase sound
    this.scene.soundManager.playSound('powerup_purchase');
    
    // Show power-up notification
    this.scene.uiManager.showPowerUpNotification(powerUp);
    
    // Emit power-up event
    this.scene.events.emit('player-powerup', {
        powerUp: powerUp,
        player: this.player
    });
    
    return true;
}
```

## UI Integration

The cash system integrates with the UI to show player's cash and available purchases:

### Cash Display

Shows the player's current cash amount:

```javascript
// In UIManager.js
createCashDisplay() {
    // Cash icon
    this.cashIcon = this.scene.add.image(
        900, 50, 'cash_icon'
    ).setScrollFactor(0).setDepth(100).setScale(0.5);
    
    // Cash text
    this.cashText = this.scene.add.text(
        920, 50, '$0', 
        { fontFamily: 'Arial', fontSize: 24, color: '#FFD700', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
}

updateCashUI(cash) {
    this.cashText.setText(`$${cash}`);
    
    // Optional animation for significant changes
    if (this._lastCash && cash > this._lastCash + 50) {
        this.scene.tweens.add({
            targets: this.cashText,
            scale: { from: 1.5, to: 1 },
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    this._lastCash = cash;
}
```

### Shop UI

Interface for purchasing upgrades and power-ups:

```javascript
// In UIManager.js
createShopUI() {
    // Shop background
    this.shopPanel = this.scene.add.rectangle(
        512, 384, 600, 500, 0x333333, 0.9
    ).setScrollFactor(0).setDepth(150).setVisible(false);
    
    // Shop title
    this.shopTitle = this.scene.add.text(
        512, 184, 'SHOP', 
        { fontFamily: 'Arial', fontSize: 32, color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(151).setVisible(false);
    
    // Close button
    this.shopCloseButton = this.createButton(
        762, 184, 'X', () => this.hideShop()
    ).setVisible(false);
    
    // Tabs for different shop sections
    this.createShopTabs();
    
    // Content container for shop items
    this.shopContent = this.scene.add.container(512, 384)
        .setScrollFactor(0).setDepth(151).setVisible(false);
}

showShop() {
    // Show shop elements
    this.shopPanel.setVisible(true);
    this.shopTitle.setVisible(true);
    this.shopCloseButton.setVisible(true);
    this.shopContent.setVisible(true);
    
    // Pause game while shop is open
    this.scene.physics.pause();
    
    // Populate shop with current items
    this.populateShopItems();
}

hideShop() {
    // Hide shop elements
    this.shopPanel.setVisible(false);
    this.shopTitle.setVisible(false);
    this.shopCloseButton.setVisible(false);
    this.shopContent.setVisible(false);
    
    // Resume game
    this.scene.physics.resume();
}

populateShopItems() {
    // Clear previous items
    this.shopContent.removeAll();
    
    // Get available upgrades and power-ups
    const upgrades = this.scene.cashManager.availableUpgrades;
    const powerUps = this.scene.cashManager.availablePowerUps;
    
    // Create item cards for each upgrade
    let y = -150;
    for (const upgrade of upgrades) {
        this.createShopItemCard(
            0, y, 
            upgrade.name, 
            `Level ${upgrade.currentLevel}/${upgrade.maxLevel}`, 
            upgrade.description, 
            `$${upgrade.cost}`,
            () => this.scene.cashManager.purchaseUpgrade(upgrade.id)
        );
        y += 100;
    }
    
    // Additional shop UI logic...
}
```

## Economy Balance

### Cash Values

Cash values are balanced based on enemy difficulty:

| Enemy Type | Base Cash Value | Notes |
|------------|----------------|-------|
| Basic      | 5 cash         | Common enemy |
| Fast       | 8 cash         | Quicker but fragile |
| Tank       | 15 cash        | Slow but durable |
| Boss       | 50 cash        | Rare, powerful enemy |

### Upgrade Costs

Upgrade costs increase exponentially with each level:

```javascript
// Cost formula for upgrades
upgradeCost = baseCost * Math.pow(1.5, currentLevel);
```

| Upgrade | Base Cost | Max Level | Effect per Level |
|---------|-----------|-----------|------------------|
| Health  | 50 cash   | 5         | +20 max health   |
| Damage  | 75 cash   | 5         | +10% damage      |
| Speed   | 60 cash   | 3         | +15% speed       |
| Fire Rate | 100 cash | 3        | +20% fire rate   |
| Pickup Range | 40 cash | 3      | +25% pickup range |

### Power-Up Costs

Power-ups provide temporary but powerful effects:

| Power-Up | Cost | Duration | Effect |
|----------|------|----------|--------|
| Shield   | 30 cash | 10 seconds | Invulnerability |
| Rapid Fire | 25 cash | 8 seconds | Double fire rate |
| Mega Damage | 35 cash | 5 seconds | Triple damage |
| Speed Boost | 20 cash | 12 seconds | Double speed |
| Magnet | 15 cash | 15 seconds | Auto-collect all pickups |

### Extra Life

In wave mode, players can purchase extra lives:

```javascript
// In CashManager.js
purchaseExtraLife() {
    // Check if player has enough cash
    if (!this.hasSufficientCash(this.extraLifeCost)) {
        console.log(`Not enough cash for extra life`);
        return false;
    }
    
    // Spend cash
    this.spendCash(this.extraLifeCost);
    
    // Add extra life
    this.player.lives++;
    
    // Increase cost for next life
    this.extraLifeCost = Math.floor(this.extraLifeCost * 2);
    
    // Play purchase sound
    this.scene.soundManager.playSound('extralife_purchase');
    
    // Show notification
    this.scene.uiManager.showExtraLifeNotification();
    
    return true;
}
```

## Cash Multipliers

The game includes cash multipliers that can be applied in certain situations:

- **Wave completion bonus**: 1.5x cash for completing a wave
- **No-damage bonus**: 1.2x cash when completing a wave without taking damage
- **Streak bonus**: Up to 2x cash for consecutive kills without taking damage

## Extension Points

The cash system is designed to be extensible for future features:

### Daily Rewards

A planned extension is to add daily login rewards:

```javascript
// Example daily reward system
class DailyRewardSystem {
    constructor(cashManager) {
        this.cashManager = cashManager;
        this.lastLoginDate = null;
        this.consecutiveDays = 0;
        this.rewards = [
            { day: 1, cash: 50 },
            { day: 2, cash: 100 },
            { day: 3, cash: 150 },
            { day: 4, cash: 200 },
            { day: 5, cash: 250 },
            { day: 6, cash: 300 },
            { day: 7, cash: 500 }
        ];
    }
    
    checkDailyReward() {
        const today = new Date().toDateString();
        
        // Load last login from storage
        this.loadLoginData();
        
        // If first time or new day
        if (!this.lastLoginDate || this.lastLoginDate !== today) {
            // Check if consecutive
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const isConsecutive = this.lastLoginDate === yesterday.toDateString();
            
            if (isConsecutive) {
                this.consecutiveDays++;
            } else {
                this.consecutiveDays = 1;
            }
            
            // Cap at 7 days
            if (this.consecutiveDays > 7) {
                this.consecutiveDays = 1;
            }
            
            // Give reward
            this.giveReward();
            
            // Update login date
            this.lastLoginDate = today;
            this.saveLoginData();
        }
    }
    
    giveReward() {
        const reward = this.rewards.find(r => r.day === this.consecutiveDays);
        if (reward) {
            this.cashManager.addCash(reward.cash);
            // Show notification
        }
    }
    
    // Storage methods...
}
```

### Achievement Rewards

Future extension to reward players for completing achievements:

```javascript
// Example achievement reward system
class AchievementSystem {
    constructor(cashManager) {
        this.cashManager = cashManager;
        this.achievements = [
            { 
                id: 'kill_100',
                name: 'Exterminator',
                description: 'Kill 100 enemies',
                target: 100,
                progress: 0,
                completed: false,
                reward: 200
            },
            // More achievements...
        ];
    }
    
    updateProgress(achievementId, amount) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.completed) {
            achievement.progress += amount;
            
            // Check if completed
            if (achievement.progress >= achievement.target) {
                this.completeAchievement(achievement);
            }
        }
    }
    
    completeAchievement(achievement) {
        achievement.completed = true;
        
        // Give cash reward
        this.cashManager.addCash(achievement.reward);
        
        // Show notification
        // ...
    }
}
```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
