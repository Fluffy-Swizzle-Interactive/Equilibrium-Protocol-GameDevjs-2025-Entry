# Implement Enemy Cash Drop System

## Context
- Game uses Phaser.js with React
- Existing enemy death handling in `BaseEnemy.js` and `WaveGame.jsx`
- SpritePool system already handles pickups (as seen with XP system)
- Enemy scoring system exists with `scoreValue` property
- Object pooling pattern established in `EnemyManager.js`

## Requirements
Create a cash drop system where:
1. Create CashManager class in `src/game/managers/CashManager.js`
2. Implement cash drops on enemy death
3. Add cash collection to player
4. Update UI to show current cash amount

## Implementation Guidelines

### CashManager Class Structure
```javascript
export class CashManager {
    constructor(scene) {
        this.scene = scene;
        this.currentCash = 0;
        this.cashMultiplier = 1.0;
    }

    addCash(amount) {
        // Similar to XPManager.addXP pattern
    }

    spawnCashPickup(x, y, amount) {
        // Use existing spritePool pattern
    }
}
```

### Cash Pickup Properties
- Sprite: Create cash sprite asset (16x16 pixels)
- Collection radius: 40 units (match XP pickup radius)
- Tint color: 0xFFD700 (gold)
- Float animation: Similar to XP orbs
- Magnetic behavior towards player

### BaseEnemy Class Updates
```javascript
die() {
    // Existing death logic...
    
    // Spawn cash based on enemy value
    if (this.scene.cashManager) {
        const cashValue = Math.ceil(this.scoreValue * 0.5);
        this.scene.cashManager.spawnCashPickup(
            this.graphics.x,
            this.graphics.y,
            cashValue
        );
    }
}
```

### Player Collection Logic
```javascript
update() {
    // Existing update logic...
    
    // Check for cash pickups
    this.scene.spritePool.checkCollision(
        this.graphics.x,
        this.graphics.y,
        this.cashCollectionRadius,
        this.collectCash.bind(this)
    );
}
```

### UI Requirements
- Add cash counter to existing UI
- Show cash pickup amounts (+10, +25, etc.)
- Animate cash increase
- Use existing font system

## Cash Balance Guidelines
- Regular enemy: scoreValue * 1.0
- Elite enemy: scoreValue * 1.5
- Boss enemy: scoreValue * 2.0
- Round up to nearest integer
- Apply cashMultiplier from CashManager

## Sound Effects
```javascript
// Add to SoundManager
this.addSound('cash_pickup', {
    volume: 0.3,
    rate: 1.0,
    detune: 600
});
```

## Example Implementation Flow
1. Enemy dies
2. CashManager spawns pickup
3. Player collects within radius
4. UI updates with animation
5. Sound effect plays
6. Cash value added to total

## Integration Points
- WaveGame.jsx: Initialize CashManager
- BaseEnemy.js: Add cash drop logic
- Player.js: Add collection logic
- UIManager.js: Add cash display
- SpritePool.js: Add cash pickup type

## Testing Checklist
- [ ] Cash drops on enemy death
- [ ] Correct amounts based on enemy type
- [ ] Collection radius works
- [ ] UI updates properly
- [ ] Sound plays on collection
- [ ] Cleanup on scene change

## Performance Considerations
- Use object pooling for cash pickups
- Batch UI updates
- Limit particle effects
- Cache calculations

## Code Style
- Follow existing manager patterns
- Use consistent event naming
- Maintain proper cleanup
- Add JSDoc comments

## Example Usage
```javascript
// In WaveGame scene setup
this.cashManager = new CashManager(this);

// In enemy death handler
onEnemyKilled(isBoss, x, y, enemyType, enemy) {
    // Existing kill logic...
    
    if (enemy && enemy.scoreValue) {
        const cashMultiplier = isBoss ? 1.0 : 0.5;
        const cashValue = Math.ceil(enemy.scoreValue * cashMultiplier);
        this.cashManager.spawnCashPickup(x, y, cashValue);
    }
}

// In UI update
updateCashDisplay(amount) {
    this.cashText.setText(`$${amount.toLocaleString()}`);
}
```

## Documentation Updates
Update:
- ProjectDoc(VS).md: Add cash system section
- GameBalance.md: Add cash values
- UIComponents.md: Add cash display

## Error Handling
- Validate cash amounts
- Check for negative values
- Handle scene transitions
- Manage cleanup properly

## Future Considerations
1. Cash multiplier powerups
2. Cash bonus events
3. Cash shop integration (OOS)
4. Save/load cash amounts
5. Cash achievements