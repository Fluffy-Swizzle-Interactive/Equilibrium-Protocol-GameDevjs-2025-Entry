/**
 * PanicFleeState.js
 * Implements panic behavior for enemies when a faction is being overwhelmed.
 * Causes enemies to flee from the opposing faction's enemies.
 */

import { CHAOS, GroupId } from '../../constants';

/**
 * PanicFleeState
 * Handles the behavior for enemies in a panic state, making them
 * flee from opposing faction enemies rather than attacking the player.
 */
export class PanicFleeState {
    /**
     * Create a new PanicFleeState
     * @param {BaseEnemy} enemy - The enemy to control
     */
    constructor(enemy) {
        this.enemy = enemy;
        this.scene = enemy.scene;
        this.lastPathUpdateTime = 0;
        this.pathUpdateInterval = CHAOS.PANIC_DURATION; // How long panic movement persists
        this.fleeTarget = null; // The enemy we're fleeing from
        this.opposingGroupId = this.getOpposingGroupId();
    }
    
    /**
     * Get the opposing faction group ID
     * @returns {string} The opposing group ID or null if neutral
     * @private
     */
    getOpposingGroupId() {
        if (this.enemy.groupId === GroupId.AI) {
            return GroupId.CODER;
        } else if (this.enemy.groupId === GroupId.CODER) {
            return GroupId.AI;
        }
        return null;
    }
    
    /**
     * Find the nearest enemy of the opposing faction to flee from
     * @returns {Object|null} The target to flee from or null if none found
     * @private
     */
    findNearestOpposingEnemy() {
        // Skip if no group manager or no opposing group
        if (!this.scene.groupManager || !this.opposingGroupId) {
            return null;
        }
        
        // Get enemies of the opposing faction
        const opposingEnemies = this.scene.groupManager.getEntitiesInGroup(this.opposingGroupId);
        
        // If no enemies, nothing to flee from
        if (!opposingEnemies || opposingEnemies.length === 0) {
            return null;
        }
        
        let nearestEnemy = null;
        let nearestDistance = Number.MAX_SAFE_INTEGER;
        
        // Find the nearest enemy
        for (const enemy of opposingEnemies) {
            // Skip inactive enemies
            if (!enemy.active || !enemy.graphics || !enemy.graphics.active) {
                continue;
            }
            
            const distance = Phaser.Math.Distance.Between(
                this.enemy.graphics.x, this.enemy.graphics.y,
                enemy.graphics.x, enemy.graphics.y
            );
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        return nearestEnemy;
    }
    
    /**
     * Enter this state - runs once when state is activated
     */
    enter() {
        // Visual indicator for panic (fast blinking)
        if (this.enemy.graphics) {
            // Store the original color for restore
            this._originalColor = this.enemy.color;
            
            // Start blinking
            this._blinkTween = this.scene.tweens.add({
                targets: this.enemy.graphics,
                alpha: { from: 1, to: 0.5 },
                duration: 150,
                yoyo: true,
                repeat: -1
            });
        }
        
        // Find initial flee target
        this.updateFleeTarget();
    }
    
    /**
     * Update the flee target
     * @private
     */
    updateFleeTarget() {
        this.fleeTarget = this.findNearestOpposingEnemy();
        this.lastPathUpdateTime = this.scene.time.now;
    }
    
    /**
     * Execute the state behavior - runs every frame
     * @param {number} delta - Time since last update
     */
    execute(delta) {
        const currentTime = this.scene.time.now;
        
        // Check if we need to update our flee target
        if (currentTime - this.lastPathUpdateTime > this.pathUpdateInterval) {
            this.updateFleeTarget();
        }
        
        // If no flee target, fall back to default movement
        if (!this.fleeTarget) {
            return false; // Return false to indicate state can exit
        }
        
        // Execute panic behavior - flee from the target
        this.fleeFromTarget();
        
        return true; // Stay in this state
    }
    
    /**
     * Flee from the current target
     * @private
     */
    fleeFromTarget() {
        if (!this.fleeTarget || !this.fleeTarget.graphics || !this.enemy.graphics) {
            return;
        }
        
        // Calculate direction from threat to self (to flee in opposite direction)
        const dx = this.enemy.graphics.x - this.fleeTarget.graphics.x;
        const dy = this.enemy.graphics.y - this.fleeTarget.graphics.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Flee faster when closer to the threat
            const urgencyFactor = Math.max(1.0, 3.0 - (distance / 200)); // More urgency when threat is closer
            const fleeSpeed = this.enemy.speed * 1.5 * urgencyFactor; // Fleeing is faster than normal movement
            
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move away from threat
            this.enemy.graphics.x += dirX * fleeSpeed;
            this.enemy.graphics.y += dirY * fleeSpeed;
        }
    }
    
    /**
     * Exit this state - runs once when state is deactivated
     */
    exit() {
        // Restore original appearance
        if (this.enemy.graphics) {
            // Stop blinking
            if (this._blinkTween) {
                this._blinkTween.stop();
                this._blinkTween = null;
            }
            
            // Restore original alpha and color
            this.enemy.graphics.setAlpha(1);
            this.enemy.graphics.setFillStyle(this._originalColor || this.enemy.color);
        }
    }
    
    /**
     * Check if the enemy should enter panic state
     * @param {BaseEnemy} enemy - The enemy to check
     * @returns {boolean} True if the enemy should enter panic state
     * @static
     */
    static shouldPanic(enemy) {
        if (!enemy.scene.chaosManager || !enemy.groupId) {
            return false;
        }
        
        return enemy.scene.chaosManager.isPanicking(enemy.groupId);
    }
}