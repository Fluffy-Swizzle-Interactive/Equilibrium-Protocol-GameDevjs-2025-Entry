# Cash System

## Overview

The Cash System handles all in-game currency, including collecting, spending, and displaying cash values. It provides visual feedback when cash is collected and supports purchasing upgrades in the shop.

## Components

### CashManager Class
Core class that handles all cash operations and state management.

#### Key Properties:
- `currentCash`: Current cash amount the player has
- `cashMultiplier`: Multiplier applied to all cash pickups (upgradeable)
- `accumulatedCash`: Temporary storage for animation purposes

#### Key Methods:
- `addCash(amount)`: Adds cash to the player's total with visual effects
- `spendCash(amount)`: Removes cash and returns success/failure
- `setCash(amount)`: Directly sets the cash to a specific amount (used by shop and save systems)
- `getCurrentCash()`: Returns current cash amount
- `spawnCashPickup(x, y, amount)`: Creates a collectible cash entity at the given position
- `showCashCollectAnimation(amount)`: Displays visual feedback for cash collection

## Integration

The Cash System integrates with:

- **UI System**: Displays current cash
- **Shop System**: Handles purchases of upgrades
- **Enemy System**: Drops cash on enemy defeat
- **Event System**: Emits events when cash changes
- **Save System**: Persists cash between game sessions

## Enemy Cash Drops

When enemies are defeated, they have a chance to drop cash pickups:

- **Regular enemies**: 40% chance to drop cash
- **Elite enemies** (types 2 and 3): 40% chance to drop cash with 1.5x multiplier
- **Boss enemies**: Always drop cash with 2.0x multiplier

Cash value is calculated based on the enemy's base score value multiplied by the appropriate type multiplier. These drops only appear after the enemy's death animation completes.

### Drop Mechanics:
- Cash pickups spawn at the position of the defeated enemy
- Cash value is calculated as: `cashValue = Math.ceil(enemy.scoreValue * cashMultiplier)`
- Enemies also have a small chance (5%) to drop health pickups when they die, independent of cash drops

### Implementation
The cash drop system is implemented in the `completeCleanup()` method of the BaseEnemy class, which is called after the death animation completes:

```javascript
// From BaseEnemy.completeCleanup():
if (this.scene.cashManager) {
    // Always drop cash for bosses, 40% chance for regular enemies
    const shouldDropCash = isBoss || Math.random() < 0.4;
    
    if (shouldDropCash) {
        // Calculate cash value based on enemy type
        let cashMultiplier = 1.0; // Regular enemy
        
        if (isBoss) {
            cashMultiplier = 2.0; // Boss enemies drop more cash
        } else if (this.type === 'enemy2' || this.type === 'enemy3') {
            cashMultiplier = 1.5; // Elite enemies (types 2 and 3) drop more cash
        }
        
        const cashValue = Math.ceil(this.scoreValue * cashMultiplier);
        
        // Spawn cash pickup at enemy position
        this.scene.cashManager.spawnCashPickup(
            position.x,
            position.y,
            cashValue
        );
    }
}
```

## Events

- `cash-updated`: Emitted when cash amount changes with data `{ cash: number }`

## Cash Pickups

Cash pickups have the following properties:
- Visual representation (gold coin sprite)
- Value (modified by cash multiplier)
- Collection radius (player must be within this range to collect)
- Magnetism (cash moves toward player when near)

## Usage Examples

### Adding Cash
```javascript
// Add 50 cash to the player
scene.cashManager.addCash(50);
```

### Spending Cash
```javascript
// Try to spend 100 cash
const success = scene.cashManager.spendCash(100);
if (success) {
  // Purchase successful
} else {
  // Not enough cash
}
```

### Setting Cash Directly
```javascript
// Set cash to exactly 1000 (for shop, dev tools, etc.)
scene.cashManager.setCash(1000);
```

### Creating Cash Drops
```javascript
// Create a cash pickup worth 25 when an enemy dies
scene.cashManager.spawnCashPickup(enemy.x, enemy.y, 25);
```
