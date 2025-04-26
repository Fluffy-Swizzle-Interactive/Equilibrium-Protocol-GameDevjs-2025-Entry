import { DEPTHS, GroupId } from '../constants';
import { EventBus } from '../EventBus';
import { RageState } from './ai/RageState';

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
        this.type = 'base';
        this.hasHealthBar = false;
        // Initialize group properties
        this.groupId = null;
        this._originalStats = null;
        // Initialize enemy properties
        this.initProperties();

        // Create visual representation if not using pooling
        if (!fromPool) {
            this.createVisuals(x, y);
            
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

        // Reset group and original stats
        this.groupId = null;
        this._originalStats = null;

        // Apply options if needed
        this.applyOptions(options);

        // Reinitialize properties
        this.initProperties();

        // Create or reposition visuals
        if (!this.sprite) {
            this.createVisuals(x, y);
        } else {
            this.sprite.setPosition(x, y);
            this.sprite.setActive(true);
            this.sprite.setVisible(true);
            
            // Play idle animation if available
            if (this.sprite.anims && this.type !== 'base') {
                this.sprite.play(`${this.type}_idle`);
            }
        }

        // Create or update health bar if needed
        if (this.hasHealthBar) {
            this.cleanupHealthBar();
            this.createHealthBar();
        }

        // Set group if provided in options
        if (options.groupId) {
            this.setGroup(options.groupId);
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
        this.color = 0x999999;
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
        if (this.type !== 'base' && this.scene.textures.exists(this.type)) {
            // Create sprite with proper atlas texture
            this.sprite = this.scene.add.sprite(x, y, this.type);
            this.sprite.setScale(1.5); // Adjust scale as needed for your game
            
            // Play idle animation if available
            this.sprite.play(`${this.type}_idle`);
            
            // Set consistent depth to ensure proper layering
            this.sprite.setDepth(DEPTHS.ENEMIES);
            
            // Store reference to parent in sprite for collision detection
            this.sprite.parentEnemy = this;
            
            // Store reference to sprite as graphics for compatibility with existing code
            this.graphics = this.sprite;
            
            // Add to physics system if needed
            this.scene.physics.add.existing(this.sprite);
        } else {
            // Fallback to rectangle if sprite not available
            this.graphics = this.scene.add.rectangle(x, y, this.size, this.size, this.color);
            this.graphics.setDepth(DEPTHS.ENEMIES);
            this.graphics.parentEnemy = this;
            
            // Add to physics system
            this.scene.physics.add.existing(this.graphics);
        }
        
        // Add to enemies group
        if (this.scene.enemies) {
            this.scene.enemies.add(this.graphics);
        }
    }

    /**
     * Set the enemy's group and apply appropriate modifiers
     * @param {string} groupId - The group ID from GroupId enum
     * @returns {boolean} Whether the group was successfully set
     */
    setGroup(groupId) {
        // Skip if this enemy already belongs to this group
        if (this.groupId === groupId) {
            return false;
        }

        const oldGroupId = this.groupId;
        this.groupId = groupId;

        // Register with GroupManager if it exists
        if (this.scene.groupManager) {
            this.scene.groupManager.registerEntity(this, groupId);
        }

        // Emit group changed event
        EventBus.emit('enemy-group-changed', {
            enemy: this,
            oldGroupId: oldGroupId,
            newGroupId: groupId
        });

        return true;
    }

    /**
     * Set enemy to neutral group and modify behavior
     * This completely neutralizes the enemy by:
     * - Setting it to the NEUTRAL group
     * - Disabling AI targeting of the player
     * - Disabling collision with the player
     * @returns {boolean} Whether the enemy was successfully neutralized
     */
    setNeutral() {
        // Set enemy to neutral group
        const success = this.setGroup(GroupId.NEUTRAL);

        // Additional neutralization behavior
        if (success) {
            this.isNeutral = true;
            
            // Change visual appearance - tint sprite or graphic to gray
            if (this.sprite) {
                this.sprite.setTint(0xaaaaaa);
            } else if (this.graphics) {
                this.graphics.setFillStyle(0x999999);
            }
        }

        return success;
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

        // Get the reference to the visual representation (sprite or graphics)
        const visual = this.sprite || this.graphics;
        if (!visual) return;

        const barWidth = this.size * 2;
        const barHeight = 5;
        const barY = visual.y - this.size - 10;

        // Background bar (black)
        this.healthBarBg = this.scene.add.rectangle(
            visual.x,
            barY,
            barWidth,
            barHeight,
            0x000000
        ).setDepth(DEPTHS.ENEMY_HEALTH_BAR_BG);

        // Health bar (red)
        this.healthBar = this.scene.add.rectangle(
            visual.x - barWidth/2,
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

        // Get the reference to the visual representation (sprite or graphics)
        const visual = this.sprite || this.graphics;
        if (!visual) return;

        // Update health bar position
        this.healthBarBg.x = visual.x;
        this.healthBarBg.y = visual.y - this.size - 10;

        // Update health bar width based on remaining health percentage
        const healthPercent = Math.max(0, this.health / this.baseHealth);
        const barWidth = this.size * 2;
        this.healthBar.width = barWidth * healthPercent;
        this.healthBar.x = visual.x - barWidth/2;
        this.healthBar.y = visual.y - this.size - 10;
    }

    /**
     * Update enemy position and behavior each frame
     */
    update() {
        // Skip if not active
        const visual = this.sprite || this.graphics;
        if (!this.active || !visual || !visual.active) {
            return;
        }

        // Check if we should be enraged
        this.checkRageState();

        // If currently in rage state, execute that behavior
        if (this.rageState) {
            this.rageState.update();
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
     * Check if this enemy should enter or exit rage state
     * @private
     */
    checkRageState() {
        const shouldRage = RageState.shouldRage(this);

        // If already in rage state and should not be, exit it
        if (this.rageState && !shouldRage) {
            this.exitRageState();
        }
        else if (!this.rageState && shouldRage) {
            this.enterRageState();
        }
    }

    /**
     * Enter rage state
     * @private
     */
    enterRageState() {
        // Create new rage state
        this.rageState = new RageState(this);
        this.rageState.enter();

        // Change appearance when enraged
        if (this.sprite) {
            this.sprite.setTint(0xff6666); // Reddish tint
        }

        // Emit rage started event
        EventBus.emit('enemy-rage-started', {
            enemy: this,
            groupId: this.groupId,
            position: {
                x: this.sprite ? this.sprite.x : (this.graphics ? this.graphics.x : 0),
                y: this.sprite ? this.sprite.y : (this.graphics ? this.graphics.y : 0)
            }
        });
    }

    /**
     * Exit rage state
     * @private
     */
    exitRageState() {
        if (this.rageState) {
            this.rageState.exit();
            this.rageState = null;
            
            // Remove rage tint
            if (this.sprite) {
                this.sprite.clearTint();
            }
        }
    }

    /**
     * Check if this enemy is currently enraged
     * @returns {boolean} True if in rage state
     */
    isEnraged() {
        return !!this.rageState;
    }

    /**
     * Move the enemy towards the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    moveTowardsPlayer(playerPos) {
        // Skip if targeting is disabled (neutralized enemy)
        if (this.isNeutral) return;
        
        // Get reference to visual representation
        const visual = this.sprite || this.graphics;
        if (!visual) return;

        // Calculate direction to player
        const dx = playerPos.x - visual.x;
        const dy = playerPos.y - visual.y;
        
        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move toward player
            visual.x += dirX * this.speed;
            visual.y += dirY * this.speed;
            
            // If using sprite animations, update animation based on direction
            if (this.sprite && this.type !== 'base' && !this.sprite.anims.isPlaying) {
                // Play run animation
                this.sprite.play(`${this.type}_run`, true);
                
                // Flip sprite based on horizontal direction
                if (dirX !== 0) {
                    this.sprite.setFlipX(dirX < 0);
                }
            }
        }
    }

    /**
     * Check if the enemy is colliding with the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    checkPlayerCollision(playerPos) {
        // Skip if enemy is neutralized
        if (this.isNeutral) return;
        
        // Get reference to visual
        const visual = this.sprite || this.graphics;
        if (!visual) return;

        // Simple circular collision check
        const dx = playerPos.x - visual.x;
        const dy = playerPos.y - visual.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Collision occurs when distance is less than sum of radii
        if (distance < (this.size/2 + this.scene.player.radius)) {
            // Notify scene of collision - if needed
        }
    }

    /**
     * Apply damage to the enemy
     * @param {number} damage - Amount of damage to apply
     */
    takeDamage(damage) {
        // Skip if already inactive
        if (!this.active) return;
        
        // Apply damage
        this.health -= damage;
        
        // Flash the sprite/graphics to indicate damage
        const visual = this.sprite || this.graphics;
        if (visual) {
            if (this.sprite) {
                this.sprite.setTint(0xffffff);
                this.scene.time.delayedCall(100, () => {
                    if (this.active && this.sprite && !this.isEnraged()) {
                        this.sprite.clearTint();
                    }
                });
            } else {
                const originalColor = this.color;
                this.graphics.setFillStyle(0xffffff);
                this.scene.time.delayedCall(100, () => {
                    if (this.active && this.graphics) {
                        this.graphics.setFillStyle(originalColor);
                    }
                });
            }
        }
        
        // Check if enemy is dead
        if (this.health <= 0) {
            this.die();
        }
    }

    /**
     * Handle enemy death
     */
    die() {
        // Skip if already inactive
        if (!this.active) return;
        
        // Mark as inactive immediately to prevent further damage
        this.active = false;
        
        // Play death animation if available
        if (this.sprite && this.type !== 'base') {
            this.sprite.play(`${this.type}_death`);
            
            // Wait for death animation to complete before removing
            this.sprite.on('animationcomplete', (anim) => {
                if (anim.key === `${this.type}_death`) {
                    this.completeCleanup();
                }
            });
            
            // Also set a timer as fallback if animation doesn't complete
            this.scene.time.delayedCall(1000, () => {
                this.completeCleanup();
            });
        } else {
            // No sprite or animation, clean up immediately
            this.completeCleanup();
        }
        
        // Notify the scene about the enemy death
        const visual = this.sprite || this.graphics;
        const position = visual ? { x: visual.x, y: visual.y } : null;
        
        // Pass the enemy instance directly to avoid duplicate lookups
        this.scene.onEnemyKilled(
            this.isBossEnemy(), 
            position ? position.x : 0,
            position ? position.y : 0,
            this.type,
            this
        );
    }
    
    /**
     * Complete cleanup after death animation
     */
    completeCleanup() {
        // Mark as inactive
        this.active = false;
        
        // Remove from scene
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
        
        // Clean up health bar if it exists
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
     * Get the score value for this enemy
     * @returns {number} The score value
     */
    getScoreValue() {
        return this.scoreValue || 10;
    }

    /**
     * Get the enemy type
     * @returns {string} The enemy type
     */
    getType() {
        return this.type;
    }

    /**
     * Get the enemy group
     * @returns {string|null} The enemy group ID
     */
    getGroup() {
        return this.groupId;
    }

    /**
     * Check if this enemy is a boss
     * @returns {boolean} True if this is a boss enemy
     */
    isBossEnemy() {
        return this.type.includes('boss');
    }
}
