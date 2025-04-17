import { DEPTHS } from '../constants';

/**
 * Base class for all enemy types in the game
 * Provides common functionality that all enemy types will inherit
 */
export class BaseEnemy {
    /**
     * Create a new enemy
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        this.scene = scene;
        this.active = true;
        this.type = 'base'; // Base type identifier
        this.hasHealthBar = false; // Whether this enemy has a health bar
        
        // Initialize enemy properties
        this.initProperties();
        
        // Create visual representation if not using pooling
        if (!fromPool) {
            this.createVisuals(x, y);
            
            // Add to scene's enemy group
            scene.enemies.add(this.graphics);
            
            // Connect enemy object to its graphics object
            this.graphics.parentEnemy = this;
            
            // Create health bar if needed
            if (this.hasHealthBar) {
                this.createHealthBar();
            }
        }
    }
    
    /**
     * Reset an enemy for reuse from the pool
     * @param {number} x - X position to reset to
     * @param {number} y - Y position to reset to
     * @param {object} options - Optional configuration
     */
    reset(x, y, options = {}) {
        // Set active state
        this.active = true;
        
        // Apply options if needed
        this.applyOptions(options);
        
        // Reinitialize properties
        this.initProperties();
        
        // Create or reposition visuals
        if (!this.graphics) {
            this.createVisuals(x, y);
            
            // Add to scene's enemy group if not already there
            if (this.scene.enemies && !this.scene.enemies.contains(this.graphics)) {
                this.scene.enemies.add(this.graphics);
            }
            
            // Connect enemy object to its graphics object
            this.graphics.parentEnemy = this;
        } else {
            this.graphics.setPosition(x, y);
            this.graphics.setSize(this.size, this.size);
            this.graphics.setFillStyle(this.color);
            this.graphics.setActive(true);
            this.graphics.setVisible(true);
        }
        
        // Create or update health bar if needed
        if (this.hasHealthBar) {
            this.cleanupHealthBar();
            this.createHealthBar();
        }
    }
    
    /**
     * Apply options to enemy (to be overridden by subclasses)
     * @param {object} options - Configuration options 
     */
    applyOptions(options) {
        // Base implementation does nothing - override in subclasses
    }
    
    /**
     * Initialize enemy properties (to be overridden by subclasses)
     */
    initProperties() {
        // Default properties
        this.speed = 0.5;
        this.size = 15;
        this.color = 0x999999; // Gray for base enemy
        this.health = 10;
        this.baseHealth = 10;
        this.damage = 1;
        this.scoreValue = 10;
    }
    
    /**
     * Create the visual representation of the enemy
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    createVisuals(x, y) {
        // Create the visual representation (square by default)
        this.graphics = this.scene.add.rectangle(x, y, this.size, this.size, this.color);
        
        // Set consistent depth to ensure proper layering
        this.graphics.setDepth(DEPTHS.ENEMIES);
    }
    
    /**
     * Clean up any existing health bar elements
     */
    cleanupHealthBar() {
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        if (this.healthBarBg) {
            this.healthBarBg.destroy(); 
            this.healthBarBg = null;
        }
    }
    
    /**
     * Create health bar for enemies that need one
     */
    createHealthBar() {
        if (!this.hasHealthBar) return;
        
        const barWidth = this.size * 2;
        const barHeight = 5;
        const barY = this.graphics.y - this.size - 10;
        
        // Background bar (black)
        this.healthBarBg = this.scene.add.rectangle(
            this.graphics.x, 
            barY, 
            barWidth, 
            barHeight, 
            0x000000
        ).setDepth(DEPTHS.ENEMY_HEALTH_BAR_BG);
        
        // Health bar (red)
        this.healthBar = this.scene.add.rectangle(
            this.graphics.x - barWidth/2, 
            barY, 
            barWidth, 
            barHeight, 
            0xff0000
        ).setOrigin(0, 0.5).setDepth(DEPTHS.ENEMY_HEALTH_BAR_FG);
    }
    
    /**
     * Update the health bar position and width
     */
    updateHealthBar() {
        if (!this.hasHealthBar || !this.healthBar || !this.healthBarBg) return;
        
        // Update health bar position
        this.healthBarBg.x = this.graphics.x;
        this.healthBarBg.y = this.graphics.y - this.size - 10;
        
        // Update health bar width based on remaining health percentage
        const healthPercent = this.health / this.baseHealth;
        const barWidth = this.size * 2;
        this.healthBar.width = barWidth * healthPercent;
        this.healthBar.x = this.graphics.x - barWidth/2;
        this.healthBar.y = this.graphics.y - this.size - 10;
    }
    
    /**
     * Update enemy position and behavior each frame
     */
    update() {
        // Skip if not active
        if (!this.active || !this.graphics || !this.graphics.active) {
            return;
        }
        
        const playerPos = this.scene.player.getPosition();
        
        // Move towards player (default behavior)
        this.moveTowardsPlayer(playerPos);
        
        // Check collision with player
        this.checkPlayerCollision(playerPos);
        
        // Update health bar if needed
        if (this.hasHealthBar) {
            this.updateHealthBar();
        }
    }
    
    /**
     * Move the enemy towards the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    moveTowardsPlayer(playerPos) {
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Only move if not at the player's position
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move toward player
            this.graphics.x += dirX * this.speed;
            this.graphics.y += dirY * this.speed;
        }
    }
    
    /**
     * Check if the enemy is colliding with the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    checkPlayerCollision(playerPos) {
        const playerDistance = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            playerPos.x, playerPos.y
        );
        
        // If enemy touches player (sum of radii), player dies
        const playerRadius = this.scene.player.radius;
  //      if (playerDistance < (this.size/2 + playerRadius)) {
   //         this.scene.playerDeath();
  //      }
    }
    
    /**
     * Apply damage to the enemy
     * @param {number} damage - Amount of damage to apply
     */
    takeDamage(damage) {
        // Skip if not active
        if (!this.active || !this.graphics || !this.graphics.active) {
            return;
        }
        
        this.health -= damage;
        
        // Flash the enemy to white to indicate hit
        this.graphics.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.active && this.graphics && this.graphics.active) {
                this.graphics.setFillStyle(this.color);
            }
        });
        
        // If health depleted, die
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Handle enemy death
     */
    die() {
        // Make inactive
        this.active = false;
        
        // Call the central kill handling method in the Game scene
        if (this.scene.onEnemyKilled) {
            // Pass enemy type and position for effects
            this.scene.onEnemyKilled(
                this.isBossEnemy(), 
                this.graphics.x, 
                this.graphics.y,
                this.type
            );
        }
        
        // Cleanup health bar if exists
        if (this.hasHealthBar) {
            this.cleanupHealthBar();
        }
        
        // When using object pooling, we don't destroy the graphics
        // We just make it inactive - the pool manager will handle the rest
        if (this.graphics) {
            this.graphics.setActive(false);
            this.graphics.setVisible(false);
        }
    }
    
    /**
     * Get the score value for this enemy
     * @returns {number} The score value
     */
    getScoreValue() {
        return this.scoreValue;
    }
    
    /**
     * Get the enemy type
     * @returns {string} The enemy type
     */
    getType() {
        return this.type;
    }
    
    /**
     * Check if this enemy is a boss
     * @returns {boolean} True if this is a boss enemy
     */
    isBossEnemy() {
        return this.type.includes('boss');
    }
}