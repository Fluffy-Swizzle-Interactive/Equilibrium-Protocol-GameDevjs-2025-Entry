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
        
        // Initialize animation state tracking
        this.currentAnimationKey = null;
        
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
        
        // Reset animation state
        this.currentAnimationKey = null;

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
            this.playAnimation('idle');
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
            this.playAnimation('idle');
            
            // Set consistent depth to ensure proper layering
            this.sprite.setDepth(DEPTHS.ENEMIES);
            
            // Store reference to parent in sprite for collision detection
            this.sprite.parentEnemy = this;
            
            // Store reference to sprite as graphics for compatibility with existing code
            // This creates the standardized reference that other code can rely on
            this.graphics = this.sprite;
            
            // Add to physics system if needed
            this.scene.physics.add.existing(this.sprite);
        } else {
            // Fallback to rectangle if sprite not available
            this.graphics = this.scene.add.rectangle(x, y, this.size, this.size, this.color);
            this.graphics.setDepth(DEPTHS.ENEMIES);
            this.graphics.parentEnemy = this;
            
            // Also store as sprite for standardized reference (even though it's a rectangle)
            this.sprite = this.graphics;
            
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

        // Use sprite as the standard visual reference
        if (!this.sprite) return;

        const barWidth = this.size * 2;
        const barHeight = 5;
        const barY = this.sprite.y - this.size - 10;

        // Background bar (black)
        this.healthBarBg = this.scene.add.rectangle(
            this.sprite.x,
            barY,
            barWidth,
            barHeight,
            0x000000
        ).setDepth(DEPTHS.ENEMY_HEALTH_BAR_BG);

        // Health bar (red)
        this.healthBar = this.scene.add.rectangle(
            this.sprite.x - barWidth/2,
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

        // Use sprite as the standard visual reference
        if (!this.sprite) return;

        // Update health bar position
        this.healthBarBg.x = this.sprite.x;
        this.healthBarBg.y = this.sprite.y - this.size - 10;

        // Update health bar width based on remaining health percentage
        const healthPercent = Math.max(0, this.health / this.baseHealth);
        const barWidth = this.size * 2;
        this.healthBar.width = barWidth * healthPercent;
        this.healthBar.x = this.sprite.x - barWidth/2;
        this.healthBar.y = this.sprite.y - this.size - 10;
    }

    /**
     * Play an animation on this enemy
     * @param {string} animType - The animation type (idle, run, death, etc.)
     * @param {boolean} ignoreIfPlaying - If true, won't restart the animation if it's already playing
     * @returns {boolean} Whether the animation was successfully started
     */
    playAnimation(animType, ignoreIfPlaying = false) {
        // Skip if enemy is not active or sprite doesn't exist
        if (!this.active || !this.sprite || !this.sprite.anims) return false;
        
        // Skip for the base enemy type (which has no animations)
        if (this.type === 'base') return false;
        
        // Construct animation key
        const key = `${this.type}_${animType}`;
        
        // Don't restart if already playing this animation
        if (ignoreIfPlaying && 
            this.sprite.anims.currentAnim && 
            this.sprite.anims.currentAnim.key === key) {
            return true;
        }
        
        // Try to play using AnimationManager if available
        if (this.scene.animationManager) {
            const success = this.scene.animationManager.playAnimation(this.sprite, key, ignoreIfPlaying);
            if (success) {
                this.currentAnimationKey = key;
                return true;
            }
        }
        
        // Fallback to direct play - but first check if animation exists
        if (!this.scene.anims.exists(key)) {
            return false;
        }
        
        // Play the animation directly
        this.sprite.play(key, ignoreIfPlaying);
        this.currentAnimationKey = key;
        return true;
    }

    /**
     * Update enemy position and behavior each frame
     */
    update() {
        // Skip if not active
        if (!this.active || !this.sprite || !this.sprite.active) {
            return;
        }

        // Skip movement and behavior updates if dying (when playing death animation)
        if (this.currentAnimationKey && this.currentAnimationKey.includes('death')) {
            // Only update health bar if needed
            if (this.hasHealthBar) {
                this.updateHealthBar();
            }
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
                x: this.sprite ? this.sprite.x : 0,
                y: this.sprite ? this.sprite.y : 0
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
            if (this.sprite && !this.isNeutral) {
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
        
        // Skip if sprite doesn't exist
        if (!this.sprite) return;
        
        // Skip if playing death animation
        if (this.currentAnimationKey && this.currentAnimationKey.includes('death')) {
            return;
        }

        // Calculate direction to player
        const dx = playerPos.x - this.sprite.x;
        const dy = playerPos.y - this.sprite.y;
        
        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move toward player
            this.sprite.x += dirX * this.speed;
            this.sprite.y += dirY * this.speed;
            
            // Update animation based on direction - use run animation when moving
            this.playAnimation('run', true);
            
            // Flip sprite based on horizontal direction
            if (dirX !== 0 && this.sprite.anims) {
                this.sprite.setFlipX(dirX < 0);
            }
        } else {
            // If not moving, play idle animation
            this.playAnimation('idle', true);
        }
    }

    /**
     * Check if the enemy is colliding with the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    checkPlayerCollision(playerPos) {
        // Skip if enemy is neutralized
        if (this.isNeutral) return;
        
        // Skip if sprite doesn't exist
        if (!this.sprite) return;

        // Simple circular collision check
        const dx = playerPos.x - this.sprite.x;
        const dy = playerPos.y - this.sprite.y;
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
        
        // Flash the sprite to indicate damage
        if (this.sprite) {
            this.sprite.setTint(0xffffff);
            this.scene.time.delayedCall(100, () => {
                if (this.active && this.sprite && !this.isEnraged() && !this.isNeutral) {
                    this.sprite.clearTint();
                }
            });
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
        
        // Store the current position before marking as inactive
        // This ensures the death position is preserved even after cleanup
        const lastPosition = this.sprite ? { 
            x: this.sprite.x, 
            y: this.sprite.y 
        } : null;
        
        // Mark as inactive immediately to prevent further damage
        this.active = false;
        
        // Play death animation if available
        if (this.playAnimation('death')) {
            // Listen for animation completion to clean up
            const onDeathAnimComplete = (animation, frame, sprite) => {
                if (sprite === this.sprite && animation.key === `${this.type}_death`) {
                    // Remove the event listener to prevent memory leaks
                    if (this.sprite && this.sprite.off) {
                        this.sprite.off('animationcomplete', onDeathAnimComplete);
                    }
                    this.completeCleanup();
                }
            };
            
            // Add event listener for animation completion
            if (this.sprite && this.sprite.on) {
                this.sprite.on('animationcomplete', onDeathAnimComplete);
            }
            
            // Also set a timer as fallback if animation doesn't complete
            // Use the animation duration if available, otherwise use a fixed delay
            let deathAnimDuration = 1000; // Default fallback
            
            if (this.sprite && 
                this.sprite.anims && 
                this.sprite.anims.currentAnim) {
                // Calculate the actual duration of the death animation
                const framerate = this.sprite.anims.currentAnim.frameRate || 12;
                const frameCount = this.sprite.anims.currentAnim.frames.length;
                deathAnimDuration = Math.ceil((1000 * frameCount) / framerate) + 100; // Add a small buffer
            }
            
            this.scene.time.delayedCall(deathAnimDuration, () => {
                this.completeCleanup();
            });
        } else {
            // No sprite or animation available, clean up immediately
            this.completeCleanup();
        }
        
        // Notify the scene about the enemy death - use stored position instead of potentially destroyed sprite
        this.scene.onEnemyKilled(
            this.isBossEnemy(), 
            lastPosition ? lastPosition.x : 0,
            lastPosition ? lastPosition.y : 0,
            this.type,
            this
        );
    }
    
    /**
     * Complete cleanup after death animation
     */
    completeCleanup() {
        // Skip if already destroyed
        if (!this.active && (!this.sprite && !this.graphics)) return;
        
        // Mark as inactive
        this.active = false;
        
        // Remove from scene
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        
        // If graphics is different from sprite (which shouldn't happen with our standardization),
        // also clean it up
        if (this.graphics && this.graphics !== this.sprite) {
            this.graphics.destroy();
            this.graphics = null;
        } else {
            this.graphics = null;
        }
        
        // Clean up health bar if it exists
        this.cleanupHealthBar();
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

    /**
     * Destroy this enemy instance and clean up resources
     * This ensures all references are properly cleaned up to prevent memory leaks
     * and counting issues
     */
    destroy() {
        // Mark as inactive
        this.active = false;
        
        // If we have a group ID, deregister from GroupManager
        if (this.groupId && this.scene.groupManager) {
            this.scene.groupManager.deregister(this, this.groupId);
            this.groupId = null;
        }
        
        // Destroy visual components if they exist
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        
        // If graphics is different from sprite, also clean it up
        if (this.graphics && this.graphics !== this.sprite) {
            this.graphics.destroy();
            this.graphics = null;
        } else {
            this.graphics = null;
        }
        
        // Clean up healthbar
        this.cleanupHealthBar();
        
        // Nullify references
        this._originalStats = null;
        this.currentAnimationKey = null;
        this.rageState = null;
        
        // Emit destroyed event
        EventBus.emit('enemy-destroyed', { enemy: this });
    }
}
