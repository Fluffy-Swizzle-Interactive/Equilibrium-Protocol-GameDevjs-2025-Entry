# Collectible System

## Overview

The Collectible System centralizes the management of all pickup items in the game, including XP orbs, cash, health, and power-ups. It standardizes the collection logic, sound effects, particle effects, and notification display when a player collects various items.

## Core Components

### CollectibleManager

The central manager that processes all collectible items and dispatches them to the appropriate subsystems.

**Key Features:**
- Single point of collection detection for all pickup types
- Standardized collision detection and processing
- Centralized sound and particle effects
- Event-based architecture for extensibility
- Performance optimization with collection interval timing

### SpritePool Integration

Collectibles are implemented using the SpritePool system for performance optimization:
- Object pooling for efficient memory usage
- Automatic pickup cleanup
- Type-specific visual representation

## Implementation

### CollectibleManager Class

**Location:** `src/game/managers/CollectibleManager.js`

**Constructor Parameters:**
- `scene` - The Phaser scene this manager belongs to
- `options` - Configuration options including:
  - `xpCollectionRadius` - Radius for XP pickup collection (default: 40)
  - `cashCollectionRadius` - Radius for cash pickup collection (default: 40)
  - `healthCollectionRadius` - Radius for health pickup collection (default: 30)
  - `collectionInterval` - Time in ms between collection checks (default: 100)

**Methods:**
- `registerManager(type, manager)` - Register a subsystem manager (XPManager, CashManager, etc.)
- `checkCollectibles(position, collectibleTypes)` - Check for collectibles at a position
- `processCollection(sprite, type)` - Process a collected sprite based on its type
- `update(time, delta)` - Update method that checks for collectibles near the player
- `destroy()` - Clean up resources when destroying the manager

### Collection Configuration

Each collectible type is configured with specific parameters:

```javascript
collectionConfig = {
    xp_pickup: {
        radius: 40,
        processMethod: this.processXPCollection.bind(this),
        manager: 'xpManager',
        soundKey: 'xp_collect',
        fallbackSoundKey: 'shoot_minigun',
        soundConfig: {
            detune: 1200,
            volume: 0.3
        },
        particleColor: 0x44FF44 // Green
    },
    cash_pickup: {
        radius: 40,
        processMethod: this.processCashCollection.bind(this),
        manager: 'cashManager',
        soundKey: 'cash_pickup',
        fallbackSoundKey: 'laserShoot',
        soundConfig: {
            detune: 600,
            volume: 0.3
        },
        particleColor: 0xFFD700 // Gold
    }
    // Additional collectible types...
}
```

## Adding New Collectible Types

To add a new collectible type:

1. Add a new entry to the `collectionConfig` in the CollectibleManager constructor
2. Implement a processing method (e.g., `processNewItemCollection`)
3. Create appropriate sprite creation methods in the SpritePool
4. Register any needed manager with `registerManager()`

Example for a new power-up collectible:

```javascript
// In CollectibleManager constructor
this.collectionConfig.power_pickup = {
    radius: 35,
    processMethod: this.processPowerUpCollection.bind(this),
    manager: 'powerUpManager',
    soundKey: 'powerup_collect',
    fallbackSoundKey: 'laserShoot',
    soundConfig: {
        detune: 800,
        volume: 0.5
    },
    particleColor: 0x8800FF // Purple
};

// Add a new processing method
processPowerUpCollection(sprite) {
    if (!sprite.customData || !sprite.customData.powerType) {
        return false;
    }
    
    const powerUpManager = this.managers.powerUpManager || this.scene.powerUpManager;
    if (!powerUpManager) return false;
    
    // Activate the power-up
    return powerUpManager.activatePowerUp(sprite.customData.powerType);
}
```

## Usage in Game

### Initialization

```javascript
// In Game.jsx create method
this.collectibleManager = new CollectibleManager(this, {
    xpCollectionRadius: 40,
    cashCollectionRadius: 40,
    healthCollectionRadius: 30,
    collectionInterval: 100
});

// Register managers
this.collectibleManager.registerManager('xpManager', this.xpManager);
this.collectibleManager.registerManager('cashManager', this.cashManager);
```

### Automatic Collection

The CollectibleManager automatically checks for collectibles near the player during its update cycle. In the Game scene's update method:

```javascript
update(time, delta) {
    // Update all managers
    this.collectibleManager.update(time, delta);
}
```

### Manual Collection Check

You can also manually check for collectibles at any position:

```javascript
// Check for collectibles at a specific position
const position = { x: 100, y: 200 };
const collected = this.collectibleManager.checkCollectibles(position);

// Or check for specific types only
const healthOnly = this.collectibleManager.checkCollectibles(position, ['health_pickup']);
```

## Integration with Player

The Player class now defers collection to the CollectibleManager:

```javascript
update() {
    // Movement, animations, etc.
    
    // Collectibles are handled by the collectible manager
    // The old methods are kept as fallbacks for backward compatibility
    if (!this.scene.collectibleManager) {
        this.checkXPCollection();
        this.checkCashCollection();
    }
}
```

## Event System

The CollectibleManager emits events when collectibles are collected:

```javascript
// Listen for collectible events
EventBus.on('collectible-collected', (data) => {
    console.log(`Collected ${data.type} with value ${data.value}`);
});
```

## Performance Considerations

- **Interval-Based Checking**: Collection checks are performed on a fixed interval (default: 100ms) to optimize performance
- **Type-Specific Filtering**: Collection checks can be limited to specific collectible types
- **Spatial Partitioning**: A future enhancement could implement spatial partitioning for very large numbers of collectibles

## Future Enhancements

- **Magnetic Collection**: Implement attraction of collectibles toward the player
- **Collection Upgrades**: Allow players to upgrade collection radius
- **Special Effects**: More elaborate collection effects based on collectible value
- **Spatial Grid Integration**: Use the same spatial grid system as enemy collision for optimized collectible detection