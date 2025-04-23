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
