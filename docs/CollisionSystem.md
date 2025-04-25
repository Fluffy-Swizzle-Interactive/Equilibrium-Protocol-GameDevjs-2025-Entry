# Collision System

The collision system in the game handles various interactions between game objects, including player-enemy collisions, bullet-enemy collisions, and player-collectible collisions.

## Spatial Grid Optimization

The game uses a spatial grid optimization technique to efficiently detect collisions without checking every object against every other object.

```javascript
updateSpatialGrid() {
    // Reset the spatial grid
    this.spatialGrid = {};
    
    // Add enemies to the grid
    this.enemyManager.getActiveEnemies().forEach(enemy => {
        if (!enemy.active) return;
        
        // Get the enemy's grid cell
        const cellX = Math.floor(enemy.graphics.x / this.gridCellSize);
        const cellY = Math.floor(enemy.graphics.y / this.gridCellSize);
        const cellKey = `${cellX},${cellY}`;
        
        // Create cell array if it doesn't exist
        if (!this.spatialGrid[cellKey]) {
            this.spatialGrid[cellKey] = [];
        }
        
        // Add enemy to this cell
        this.spatialGrid[cellKey].push(enemy.graphics);
    });
}
```

## Hybrid Collision Detection System

The game uses a hybrid collision detection system that supports both traditional distance-based collision detection and physics-based collision detection:

### Physics-Based Collision Detection
Used for sprite-based enemies that have physics bodies. Utilizes Phaser's built-in physics system for more accurate collision detection.

### Distance-Based Collision Detection
Used as a fallback for enemies without physics bodies or for simple circular collisions.

```javascript
// Method 1: Phaser Physics body detection (for sprite-based enemies)
if (enemyGraphics.body) {
    // If enemy has a physics body, use Phaser's physics overlap check
    const bulletCircle = new Phaser.Geom.Circle(bullet.x, bullet.y, bullet.radius || 5);
    const enemyBounds = enemyGraphics.getBounds();
    
    hasCollision = Phaser.Geom.Intersects.CircleToRectangle(
        bulletCircle,
        enemyBounds
    );
} 
// Method 2: Traditional distance-based detection (fallback)
else {
    const distance = Phaser.Math.Distance.Between(
        bullet.x, bullet.y,
        enemyGraphics.x, enemyGraphics.y
    );
    
    // Get enemy size and bullet properties
    const enemySize = targetEnemy ? targetEnemy.size/2 : 12; // Default fallback size
    const bulletSize = bullet.radius || this.player.caliber || 5;
    
    hasCollision = distance < (bulletSize + enemySize);
}
```

## Sprite Enemy Collision System

Sprite-based enemies have the following collision features:

1. **Physics Bodies**: Each sprite enemy has a circle physics body for collision detection.
2. **Hit Effects**: Visual feedback when enemies are hit includes flashing and particle effects.
3. **Death Animations**: When an enemy's health reaches zero, a death animation is played.

## Death Animation Handling

When an enemy is killed, the system:

1. Plays the appropriate death animation
2. Creates particle effects for visual feedback
3. Disables collision detection during the death animation
4. Cleans up the enemy object after the animation completes

```javascript
die() {
    // Skip if already dead or no graphics object
    if (!this.active || !this.graphics) {
        super.die();
        return;
    }

    // Disable player targeting and physics collisions
    this._targetingDisabled = true;
    this._collisionDisabled = true;
    
    // Stop any ongoing movement by setting velocity to zero
    if (this.graphics.body) {
        this.graphics.body.setVelocity(0, 0);
        this.graphics.body.enable = false; // Disable physics body
    }
    
    // Play death animation and handle cleanup
    this.playAnimation('death', false);
    
    // Create death effect particles
    this.scene.spritePool.createDeathEffect(this.graphics.x, this.graphics.y);
}
```

## Bullet-Enemy Collision Logic

The bullet-enemy collision system includes features for:

1. **Damage Calculation**: Support for critical hits and damage multipliers
2. **Bullet Penetration**: Bullets can pierce through multiple enemies based on their penetration value
3. **Visual Feedback**: Bullets flash when hitting an enemy
4. **Collision Optimization**: Using the spatial grid to limit collision checks

## Debugging Collision Detection

For debugging purposes, the collision detection system can be visualized in development mode:

```javascript
debugCollisionDetection() {
    // Draw enemy collision bodies
    this.debugGraphics.clear();
    this.debugGraphics.lineStyle(1, 0xff0000);
    
    this.enemyManager.getActiveEnemies().forEach(enemy => {
        if (enemy.graphics && enemy.graphics.body) {
            // For physics bodies
            const bounds = enemy.graphics.body.getBounds();
            this.debugGraphics.strokeRect(
                bounds.x, bounds.y, 
                bounds.width, bounds.height
            );
        } else if (enemy.graphics) {
            // For circular collisions
            this.debugGraphics.strokeCircle(
                enemy.graphics.x, 
                enemy.graphics.y, 
                enemy.size / 2
            );
        }
    });
}
```

## Troubleshooting

If collision detection issues occur:

1. Verify that all sprite assets are loaded correctly with proper paths
2. Check that enemy physics bodies are properly sized
3. Ensure death animations are properly defined and playing
4. Verify that the spatial grid cell size is appropriate for your game world