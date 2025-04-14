import { GameObjectManager } from '../managers/GameObjectManager';
import { Enemy } from './Enemy';

/**
 * Specialized class for managing enemy pools
 * Extends the core GameObjectManager functionality with enemy-specific methods
 */
export class EnemyPool {
    /**
     * Create a new enemy pool
     * @param {Phaser.Scene} scene - The scene this pool belongs to
     * @param {Object} options - Configuration options for the enemy pool
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.objectManager = scene.gameObjectManager || new GameObjectManager(scene);
        this.enemies = [];
        
        // Create the enemy pool
        this.objectManager.createPool('enemy', 
            // Create function - creates an enemy instance without initialization
            () => {
                // Create basic enemy object structure but don't position it yet
                // Using fromPool=true to avoid creating graphics until reset
                const enemyInstance = new Enemy(scene, 0, 0, false, true);
                
                // When using fromPool=true, graphics are created during reset, not here
                // We'll add to the enemies group after graphics are created in the reset function
                return enemyInstance;
            },
            // Reset function - initializes or resets enemy properties
            (enemy, x, y, options = {}) => {
                // Set position and activate enemy
                enemy.reset(x, y, options);
                
                // Now that reset has created the graphics, add to scene enemies group
                if (this.scene.enemies && enemy.graphics) {
                    // Only add if not already in the group
                    if (!this.scene.enemies.contains(enemy.graphics)) {
                        this.scene.enemies.add(enemy.graphics);
                    }
                }
                
                // Add to tracking list if not already there
                if (!this.enemies.includes(enemy)) {
                    this.enemies.push(enemy);
                }
            },
            // Custom configuration
            options
        );
    }

    /**
     * Spawn a single enemy at the given position
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     * @param {Object} options - Optional enemy configuration
     * @returns {Enemy} The spawned enemy instance
     */
    spawnEnemy(x, y, options = {}) {
        return this.objectManager.get('enemy', x, y, options);
    }

    /**
     * Spawn a group of enemies around a central point
     * @param {number} baseX - Center X position for the group
     * @param {number} baseY - Center Y position for the group
     * @param {number} groupSize - Number of enemies in the group
     * @param {number} spreadRadius - How spread out the group is
     * @param {Object} options - Optional enemy configuration
     * @returns {Array} Array of spawned enemies
     */
    spawnEnemyGroup(baseX, baseY, groupSize = 3, spreadRadius = 100, options = {}) {
        const enemies = [];
        const effectiveMapWidth = this.scene.map.widthInPixels * this.scene.groundLayer.scale;
        const effectiveMapHeight = this.scene.map.heightInPixels * this.scene.groundLayer.scale;
        
        for (let i = 0; i < groupSize; i++) {
            // Random offset within the spread radius
            const offsetX = Phaser.Math.Between(-spreadRadius, spreadRadius);
            const offsetY = Phaser.Math.Between(-spreadRadius, spreadRadius);
            
            // Calculate final spawn position with offset and clamp to map
            const x = Phaser.Math.Clamp(baseX + offsetX, 50, effectiveMapWidth - 50);
            const y = Phaser.Math.Clamp(baseY + offsetY, 50, effectiveMapHeight - 50);
            
            // Create enemy from pool
            const enemy = this.spawnEnemy(x, y, options);
            
            if (enemy) {
                enemies.push(enemy);
            }
        }
        
        return enemies;
    }

    /**
     * Release an enemy back to the pool
     * @param {Enemy} enemy - The enemy to release
     */
    releaseEnemy(enemy) {
        // Remove from tracking array
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.enemies.splice(index, 1);
        }
        
        // Release back to pool
        this.objectManager.release('enemy', enemy);
    }

    /**
     * Update all active enemies
     * @param {Function} updateFunc - Custom update function (receives enemy object)
     */
    updateEnemies(updateFunc) {
        // Loop through all tracked enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Skip inactive enemies
            if (!enemy.active) continue;
            
            // Update enemy
            enemy.update();
            
            // Apply custom update if provided
            if (updateFunc) {
                updateFunc(enemy);
            }
            
            // Check if enemy was destroyed
            if (!enemy.active || !enemy.graphics || !enemy.graphics.active) {
                // Create death effect if needed
                if (enemy.graphics && this.scene.createEnemyDeathEffect) {
                    this.scene.createEnemyDeathEffect(enemy.graphics.x, enemy.graphics.y);
                }
                
                // Release back to pool
                this.releaseEnemy(enemy);
            }
        }
    }

    /**
     * Get statistics about enemy usage
     * @returns {object} Pool statistics
     */
    getStats() {
        return {
            ...this.objectManager.getStats().enemy,
            activeTracked: this.enemies.length
        };
    }
}