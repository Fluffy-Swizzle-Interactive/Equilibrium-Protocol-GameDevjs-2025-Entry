import { GameObjectManager } from './GameObjectManager';
import { BaseEnemy } from '../entities/BaseEnemy';
import { Enemy1 } from '../entities/Enemy1';
import { Enemy2 } from '../entities/Enemy2';
import { Boss1 } from '../entities/Boss1';

/**
 * EnemyManager class
 * Handles creation, pooling, and management of all enemy types
 */
export class EnemyManager {
    /**
     * Create a new enemy manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {Object} options - Configuration options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.gameObjectManager = scene.gameObjectManager || new GameObjectManager(scene);
        this.enemies = [];
        this.enemyPools = {};
        this.projectiles = [];
        
        // Register this manager with the scene for easy access
        scene.enemyManager = this;
        
        // Initialize enemy pools
        this.initializePools(options);
    }
    
    /**
     * Initialize pools for each enemy type
     * @param {Object} options - Pool configuration options
     * @private
     */
    initializePools(options) {
        // Default pool options
        const defaultOptions = {
            initialSize: 20,
            maxSize: 100,
            growSize: 5
        };
        
        // Merge provided options with defaults
        const poolOptions = { ...defaultOptions, ...options };
        
        // Create pool for Enemy1
        this.createEnemyPool('enemy1', Enemy1, {
            initialSize: poolOptions.initialSize,
            maxSize: poolOptions.maxSize,
            growSize: poolOptions.growSize
        });
        
        // Create pool for Enemy2
        this.createEnemyPool('enemy2', Enemy2, {
            initialSize: Math.ceil(poolOptions.initialSize / 2),
            maxSize: Math.ceil(poolOptions.maxSize / 2),
            growSize: Math.ceil(poolOptions.growSize / 2)
        });
        
        // Create pool for Boss1 (smaller pool since bosses are rare)
        this.createEnemyPool('boss1', Boss1, {
            initialSize: 2,
            maxSize: 5,
            growSize: 1
        });
        
        // Create pool for projectiles
        this.createProjectilePool(poolOptions);
    }
    
    /**
     * Create a pool for a specific enemy type
     * @param {string} poolKey - Key for the pool
     * @param {class} EnemyClass - Enemy class to instantiate
     * @param {Object} options - Pool configuration options
     * @private
     */
    createEnemyPool(poolKey, EnemyClass, options) {
        this.gameObjectManager.createPool(poolKey,
            // Create function - creates enemy instance without initialization
            () => {
                // Create basic enemy object structure but don't position it yet
                const enemyInstance = new EnemyClass(this.scene, 0, 0, true);
                
                // Return the instance
                return enemyInstance;
            },
            // Reset function - initializes or resets enemy properties
            (enemy, x, y, options = {}) => {
                // Set position and activate enemy
                enemy.reset(x, y, options);
                
                // Add to tracking list if not already there
                if (!this.enemies.includes(enemy)) {
                    this.enemies.push(enemy);
                }
            },
            // Custom configuration
            options
        );
        
        // Add the pool key to our supported enemy types
        if (!this.enemyPools[poolKey]) {
            this.enemyPools[poolKey] = true;
        }
    }
    
    /**
     * Create a pool for projectiles
     * @param {Object} options - Pool configuration options
     * @private
     */
    createProjectilePool(options) {
        this.gameObjectManager.createPool('projectile',
            // Create function
            () => {
                const projectile = {
                    graphics: this.scene.add.circle(0, 0, 5, 0xff0000),
                    active: false,
                    speed: 0,
                    directionX: 0,
                    directionY: 0,
                    damage: 1,
                    lifetime: 0,
                    maxLifetime: 3000
                };
                
                // Make sure graphics are not visible when created
                projectile.graphics.setActive(false);
                projectile.graphics.setVisible(false);
                
                return projectile;
            },
            // Reset function
            (projectile, x, y, options = {}) => {
                // Set position and attributes
                projectile.graphics.setPosition(x, y);
                projectile.graphics.setActive(true);
                projectile.graphics.setVisible(true);
                
                // Set properties
                projectile.directionX = options.directionX || 0;
                projectile.directionY = options.directionY || 0;
                projectile.speed = options.speed || 2;
                projectile.damage = options.damage || 1;
                projectile.lifetime = 0;
                projectile.maxLifetime = options.maxLifetime || 3000;
                projectile.active = true;
                
                // Add to tracking list
                if (!this.projectiles.includes(projectile)) {
                    this.projectiles.push(projectile);
                }
            },
            // Custom configuration
            {
                initialSize: options.initialSize || 30,
                maxSize: options.maxSize || 100,
                growSize: options.growSize || 10
            }
        );
    }
    
    /**
     * Spawn a specific enemy type at the given position
     * @param {string} type - Enemy type key ('enemy1', 'enemy2', 'boss1')
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Optional enemy configuration
     * @returns {BaseEnemy} The spawned enemy instance
     */
    spawnEnemy(type, x, y, options = {}) {
        // Validate enemy type
        if (!this.enemyPools[type]) {
            console.warn(`Enemy type '${type}' not found in enemy pools`);
            return null;
        }
        
        // Get enemy from pool
        return this.gameObjectManager.get(type, x, y, options);
    }
    
    /**
     * Spawn a projectile
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {number} directionX - X direction vector component
     * @param {number} directionY - Y direction vector component
     * @param {number} speed - Projectile speed
     * @param {number} damage - Damage amount
     * @returns {Object} The spawned projectile
     */
    spawnProjectile(x, y, directionX, directionY, speed = 2, damage = 1) {
        return this.gameObjectManager.get('projectile', x, y, {
            directionX,
            directionY,
            speed,
            damage
        });
    }
    
    /**
     * Spawn a group of enemies around a central point
     * @param {string} type - Enemy type key ('enemy1', 'enemy2', 'boss1')
     * @param {number} baseX - Center X position for the group
     * @param {number} baseY - Center Y position for the group
     * @param {number} groupSize - Number of enemies in the group
     * @param {number} spreadRadius - How spread out the group is
     * @param {Object} options - Optional enemy configuration
     * @returns {Array} Array of spawned enemies
     */
    spawnEnemyGroup(type, baseX, baseY, groupSize = 3, spreadRadius = 100, options = {}) {
        const enemies = [];
        const mapDimensions = this.scene.mapDimensions || {
            width: this.scene.game.config.width,
            height: this.scene.game.config.height
        };
        
        for (let i = 0; i < groupSize; i++) {
            // Random offset within the spread radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spreadRadius;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            // Calculate final spawn position with offset and clamp to map
            const x = Math.max(50, Math.min(mapDimensions.width - 50, baseX + offsetX));
            const y = Math.max(50, Math.min(mapDimensions.height - 50, baseY + offsetY));
            
            // Create enemy from pool
            const enemy = this.spawnEnemy(type, x, y, options);
            
            if (enemy) {
                enemies.push(enemy);
            }
        }
        
        return enemies;
    }
    
    /**
     * Spawn enemies at map edges (used for regular enemy spawning)
     * @param {string} type - Enemy type to spawn
     * @param {number} count - Number of enemies to spawn
     */
    spawnEnemiesAtEdges(type, count = 1) {
        const cam = this.scene.cameras.main;
        const playerPos = this.scene.player.getPosition();
        const mapDimensions = this.scene.mapDimensions;
        
        // Increased margin for spawning further outside the view
        const minMargin = 150; // Minimum spawn distance from view edge
        const maxMargin = 400; // Maximum spawn distance from view edge
        
        for (let i = 0; i < count; i++) {
            // Choose spawn location type with weighted randomness
            const spawnType = Math.random() * 100;
            let x, y;
            
            if (spawnType < 80) {
                // Standard edge spawn (80% chance)
                const side = Math.floor(Math.random() * 4);
                const margin = minMargin + Math.random() * (maxMargin - minMargin);
                
                switch(side) {
                    case 0: // Top
                        x = playerPos.x + (Math.random() * cam.width - cam.width/2);
                        y = Math.max(50, playerPos.y - cam.height/2 - margin);
                        break;
                    case 1: // Right
                        x = Math.min(mapDimensions.width - 50, playerPos.x + cam.width/2 + margin);
                        y = playerPos.y + (Math.random() * cam.height - cam.height/2);
                        break;
                    case 2: // Bottom
                        x = playerPos.x + (Math.random() * cam.width - cam.width/2);
                        y = Math.min(mapDimensions.height - 50, playerPos.y + cam.height/2 + margin);
                        break;
                    case 3: // Left
                        x = Math.max(50, playerPos.x - cam.width/2 - margin);
                        y = playerPos.y + (Math.random() * cam.height - cam.height/2);
                        break;
                }
            } else {
                // Corner spawn (20% chance)
                const corner = Math.floor(Math.random() * 4);
                const cornerMargin = maxMargin * 1.2; // Slightly further for corners
                
                switch(corner) {
                    case 0: // Top-Left
                        x = Math.max(50, playerPos.x - cam.width/2 - cornerMargin);
                        y = Math.max(50, playerPos.y - cam.height/2 - cornerMargin);
                        break;
                    case 1: // Top-Right
                        x = Math.min(mapDimensions.width - 50, playerPos.x + cam.width/2 + cornerMargin);
                        y = Math.max(50, playerPos.y - cam.height/2 - cornerMargin);
                        break;
                    case 2: // Bottom-Right
                        x = Math.min(mapDimensions.width - 50, playerPos.x + cam.width/2 + cornerMargin);
                        y = Math.min(mapDimensions.height - 50, playerPos.y + cam.height/2 + cornerMargin);
                        break;
                    case 3: // Bottom-Left
                        x = Math.max(50, playerPos.x - cam.width/2 - cornerMargin);
                        y = Math.min(mapDimensions.height - 50, playerPos.y + cam.height/2 + cornerMargin);
                        break;
                }
            }
            
            // Ensure spawn is within map bounds
            x = Math.max(50, Math.min(mapDimensions.width - 50, x));
            y = Math.max(50, Math.min(mapDimensions.height - 50, y));
            
            // Spawn the enemy
            this.spawnEnemy(type, x, y);
        }
    }
    
    /**
     * Spawn a boss enemy at a strategic location
     * @param {string} bossType - Boss type to spawn (default: 'boss1')
     */
    spawnBoss(bossType = 'boss1') {
        const cam = this.scene.cameras.main;
        const playerPos = this.scene.player.getPosition();
        const mapDimensions = this.scene.mapDimensions;
        
        // Make the boss spawn very far from the player, but visible
        const bossMargin = 600; // Very far away
        const angle = Math.random() * Math.PI * 2;
        
        // Calculate spawn position in random direction
        let x = playerPos.x + Math.cos(angle) * bossMargin;
        let y = playerPos.y + Math.sin(angle) * bossMargin;
        
        // Ensure spawn is within map bounds
        x = Math.max(50, Math.min(mapDimensions.width - 50, x));
        y = Math.max(50, Math.min(mapDimensions.height - 50, y));
        
        // Spawn the boss
        const boss = this.spawnEnemy(bossType, x, y);
        
        // Show boss warning message
        if (this.scene.showBossWarning) {
            this.scene.showBossWarning();
        } else {
            // Fallback warning if scene method not available
            this.showBossWarning();
        }
        
        return boss;
    }
    
    /**
     * Show boss warning message (fallback if scene doesn't have this method)
     * @private
     */
    showBossWarning() {
        // Create warning text
        const warningText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 3,
            'BOSS INCOMING!',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // Animate the warning text
        this.scene.tweens.add({
            targets: warningText,
            alpha: { from: 1, to: 0 },
            scaleX: { from: 1, to: 1.5 },
            scaleY: { from: 1, to: 1.5 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                warningText.destroy();
            }
        });
    }
    
    /**
     * Release an enemy back to its pool
     * @param {BaseEnemy} enemy - The enemy to release
     */
    releaseEnemy(enemy) {
        // Remove from tracking array
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.enemies.splice(index, 1);
        }
        
        // Release back to appropriate pool based on type
        this.gameObjectManager.release(enemy.getType(), enemy);
    }
    
    /**
     * Release a projectile back to its pool
     * @param {Object} projectile - The projectile to release
     */
    releaseProjectile(projectile) {
        // Remove from tracking array
        const index = this.projectiles.indexOf(projectile);
        if (index !== -1) {
            this.projectiles.splice(index, 1);
        }
        
        // Release back to pool
        if (projectile.graphics) {
            projectile.graphics.setActive(false);
            projectile.graphics.setVisible(false);
        }
        
        projectile.active = false;
        this.gameObjectManager.release('projectile', projectile);
    }
    
    /**
     * Update all active enemies
     */
    update() {
        // Update enemies
        this.updateEnemies();
        
        // Update projectiles
        this.updateProjectiles();
    }
    
    /**
     * Update all active enemies
     * @private
     */
    updateEnemies() {
        // Loop through all tracked enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Skip inactive enemies
            if (!enemy || !enemy.active) continue;
            
            // Update enemy
            enemy.update();
            
            // Check if enemy was destroyed
            if (!enemy.active || !enemy.graphics || !enemy.graphics.active) {
                // Release back to pool
                this.releaseEnemy(enemy);
            }
        }
    }
    
    /**
     * Update all active projectiles
     * @private
     */
    updateProjectiles() {
        // Loop through all tracked projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Skip inactive projectiles
            if (!projectile || !projectile.active) continue;
            
            // Update projectile position
            projectile.graphics.x += projectile.directionX * projectile.speed;
            projectile.graphics.y += projectile.directionY * projectile.speed;
            
            // Update lifetime
            projectile.lifetime += this.scene.game.loop.delta;
            
            // Check if projectile should be culled (too old)
            if (projectile.lifetime > projectile.maxLifetime) {
                this.releaseProjectile(projectile);
                continue;
            }
            
            // Check for projectile-player collision
            const playerPos = this.scene.player.getPosition();
            const distance = Phaser.Math.Distance.Between(
                projectile.graphics.x, projectile.graphics.y,
                playerPos.x, playerPos.y
            );
            
            if (distance < (5 + this.scene.player.radius)) {
                // Hit player
                this.scene.playerDeath();
                this.releaseProjectile(projectile);
            }
        }
    }
    
    /**
     * Get enemy count of specific type
     * @param {string} type - Enemy type to count (optional)
     * @returns {number} Count of active enemies
     */
    getEnemyCount(type = null) {
        if (type) {
            return this.enemies.filter(e => e.getType() === type).length;
        }
        return this.enemies.length;
    }
    
    /**
     * Get statistics about enemy pools
     * @returns {object} Pool statistics
     */
    getStats() {
        const stats = {
            totalActive: this.enemies.length,
            projectiles: this.projectiles.length,
            byType: {}
        };
        
        // Count by type
        for (const enemy of this.enemies) {
            const type = enemy.getType();
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        }
        
        return stats;
    }
}