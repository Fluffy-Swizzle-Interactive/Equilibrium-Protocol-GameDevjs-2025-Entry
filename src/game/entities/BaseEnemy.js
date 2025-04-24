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
        this.type = 'base'; // Base type identifier
        this.hasHealthBar = false; // Whether this enemy has a health bar

        // Initialize group properties
        this.groupId = null; // Will be set when registered with GroupManager
        this._originalStats = null; // Will store original stats when group modifiers are applied

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

        // Reset group and original stats
        this.groupId = null;
        this._originalStats = null;

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
            this.scene.groupManager.register(this, groupId);
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
            // Disable AI targeting
            this._targetingDisabled = true;

            // Disable player collision
            this._collisionDisabled = true;

            // Apply visual indicator of neutral state (slightly transparent)
            if (this.graphics) {
                this.graphics.setAlpha(0.7);
            }

            // Emit neutralized event for game systems to react
            EventBus.emit('enemy-neutralized', {
                enemy: this,
                position: {
                    x: this.graphics ? this.graphics.x : 0,
                    y: this.graphics ? this.graphics.y : 0
                }
            });
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

        // Check if we should be enraged
        this.checkRageState();

        // If currently in rage state, execute that behavior
        if (this.rageState) {
            if (this.rageState.execute()) {
                // Rage state handling movement, skip usual movement

                // Still check player collision
                const playerPos = this.scene.player.getPosition();
                this.checkPlayerCollision(playerPos);

                // Update health bar if needed
                if (this.hasHealthBar) {
                    this.updateHealthBar();
                }

                return;
            } else {
                // Rage state finished, exit it
                this.exitRageState();
            }
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
        // If not in rage state but should be, enter it
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

        // Emit rage started event
        EventBus.emit('enemy-rage-started', {
            enemy: this,
            groupId: this.groupId,
            position: {
                x: this.graphics ? this.graphics.x : 0,
                y: this.graphics ? this.graphics.y : 0
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

            // Emit rage ended event
            EventBus.emit('enemy-rage-ended', {
                enemy: this,
                groupId: this.groupId,
                position: {
                    x: this.graphics ? this.graphics.x : 0,
                    y: this.graphics ? this.graphics.y : 0
                }
            });
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
        if (this._targetingDisabled) return;

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
        // Skip if collision is disabled (neutralized enemy)
        if (this._collisionDisabled) return;

        const playerDistance = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            playerPos.x, playerPos.y
        );

        // If enemy touches player (sum of radii), apply damage
        const playerRadius = this.scene.player.radius;
        if (playerDistance < (this.size/2 + playerRadius)) {
            // Apply damage using health system if available
            if (this.scene.playerHealth) {
                // Scene has centralized health system (typically in WaveGame)
                this.scene.playerHealth.takeDamage(this.damage);
            } else if (this.scene.player.healthSystem) {
                // Player has attached health system
                this.scene.player.healthSystem.takeDamage(this.damage);
            } else if (this.scene.player.takeDamage) {
                // Player has own damage method
                this.scene.player.takeDamage(this.damage);
            } else {
                // Fallback to original behavior if no health system is found
                console.warn('No player health system found in BaseEnemy collision, falling back to direct death');
                this.scene.playerDeath();
            }
        }
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

        // Store the current fill style before flashing
        const currentFill = this.graphics.fillColor;

        // Flash the enemy to white to indicate hit
        this.graphics.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.active && this.graphics && this.graphics.active) {
                // Always restore to the original color even during rage state
                // Since rage now uses an outline instead of color change
                this.graphics.setFillStyle(currentFill);
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
        // Exit rage state if active
        if (this.rageState) {
            this.exitRageState();
        }

        // Skip if already marked inactive to prevent double-counting
        if (!this.active) return;

        // Make inactive
        this.active = false;

        // Deregister from GroupManager if needed
        if (this.scene.groupManager && this.groupId) {
            this.scene.groupManager.deregister(this, this.groupId);
        }

        // Determine if this is a boss enemy
        const isBoss = this.isBossEnemy();

        // Spawn cash pickup based on enemy value (30% chance for regular enemies, always for bosses)
        if (this.scene.cashManager && this.graphics) {
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
                    this.graphics.x,
                    this.graphics.y,
                    cashValue
                );
            }

            // 5% chance to spawn a health pickup (independent of cash drop)
            if (Math.random() < 0.05 && this.scene.spritePool) {
                // Create health pickup
                this.scene.spritePool.createHealthPickup(
                    this.graphics.x,
                    this.graphics.y,
                    { value: 20 } // Health amount to restore
                );
            }
        }

        // Call the central kill handling method in the Game scene
        if (this.scene.onEnemyKilled) {
            // Pass enemy type and position for effects
            this.scene.onEnemyKilled(
                isBoss,
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