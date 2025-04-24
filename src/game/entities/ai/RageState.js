/**
 * RageState.js
 * Implements rage behavior for enemies when a faction is being overwhelmed.
 * Causes enemies to aggressively rush towards the player with increased speed and damage.
 */

import { CHAOS, GroupId } from '../../constants';
import { EventBus } from '../../EventBus';

/**
 * RageState
 * Handles the behavior for enemies in a rage state, making them
 * rush aggressively towards the player with increased speed and damage.
 */
export class RageState {
    /**
     * Create a new RageState
     * @param {BaseEnemy} enemy - The enemy to control
     */
    constructor(enemy) {
        this.enemy = enemy;
        this.scene = enemy.scene;
        this.lastStateUpdateTime = 0;
        this.stateDuration = CHAOS.PANIC_DURATION; // Reusing the same duration constant
        
        // Store original stats to restore later
        this.originalStats = {
            speed: enemy.speed,
            damage: enemy.damage
        };
        
        // Boost factors for rage state
        this.speedBoost = 1.8;  // Move 80% faster
        this.damageBoost = 1.5; // Deal 50% more damage
    }
    
    /**
     * Enter this state - runs once when state is activated
     */
    enter() {
        // Apply stat boosts
        this.enemy.speed *= this.speedBoost;
        this.enemy.damage *= this.damageBoost;
        
        // Visual indicator for rage (red outline glow)
        if (this.enemy.graphics) {
            // Create an outline graphic as a child of the enemy
            this.createRageOutline();
            
            // Add scale pulsing for extra rage effect
            this._scaleTween = this.scene.tweens.add({
                targets: this.enemy.graphics,
                scaleX: { from: 1, to: 1.15 },
                scaleY: { from: 1, to: 1.15 },
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        }
        
        // Start the rage timer
        this.lastStateUpdateTime = this.scene.time.now;
        
        // Emit an event that this enemy has entered rage state
        EventBus.emit('enemy-rage-started', {
            enemy: this.enemy,
            groupId: this.enemy.groupId,
            position: {
                x: this.enemy.graphics ? this.enemy.graphics.x : 0,
                y: this.enemy.graphics ? this.enemy.graphics.y : 0
            }
        });
    }
    
    /**
     * Create a glowing red outline around the enemy
     * @private
     */
    createRageOutline() {
        // Remove any existing outline
        this.removeRageOutline();
        
        // Create a slightly larger rectangle with red color for the outline
        const outlineSize = this.enemy.size + 4; // Make outline 4px larger than the enemy
        
        // Create outline as a separate game object that follows the enemy
        this._outlineGfx = this.scene.add.rectangle(
            this.enemy.graphics.x,
            this.enemy.graphics.y,
            outlineSize,
            outlineSize,
            0xff0000
        );
        
        // Set depth to be behind the enemy
        this._outlineGfx.setDepth(this.enemy.graphics.depth - 1);
        
        // Create pulsing/flashing effect on the outline
        this._outlineTween = this.scene.tweens.add({
            targets: this._outlineGfx,
            alpha: { from: 0.9, to: 0.3 },
            duration: 200,
            yoyo: true,
            repeat: -1
        });
    }
    
    /**
     * Remove the rage outline graphic
     * @private
     */
    removeRageOutline() {
        if (this._outlineTween) {
            this._outlineTween.stop();
            this._outlineTween = null;
        }
        
        if (this._outlineGfx) {
            this._outlineGfx.destroy();
            this._outlineGfx = null;
        }
    }
    
    /**
     * Execute the state behavior - runs every frame
     * @param {number} delta - Time since last update
     */
    execute(delta) {
        const currentTime = this.scene.time.now;
        
        // Check if rage state should end
        if (currentTime - this.lastStateUpdateTime > this.stateDuration) {
            return false; // Return false to indicate state can exit
        }
        
        // Execute rage behavior - rush towards player
        this.rushTowardsPlayer();
        
        return true; // Stay in this state
    }
    
    /**
     * Rush towards the player with increased aggression
     * @private
     */
    rushTowardsPlayer() {
        if (!this.enemy.graphics || !this.scene.player) {
            return;
        }
        
        const playerPos = this.scene.player.getPosition();
        
        // Calculate direction to player
        const dx = playerPos.x - this.enemy.graphics.x;
        const dy = playerPos.y - this.enemy.graphics.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Move directly toward player
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // More aggressive movement
            this.enemy.graphics.x += dirX * this.enemy.speed;
            this.enemy.graphics.y += dirY * this.enemy.speed;
            
            // Add slight zigzag for more aggressive feel
            if (this.scene.time.now % 30 < 15) {
                // Slight perpendicular movement to create zigzag
                this.enemy.graphics.x += -dirY * this.enemy.speed * 0.2;
                this.enemy.graphics.y += dirX * this.enemy.speed * 0.2;
            } else {
                this.enemy.graphics.x += dirY * this.enemy.speed * 0.2;
                this.enemy.graphics.y += -dirX * this.enemy.speed * 0.2;
            }
            
            // Update outline position to follow enemy
            if (this._outlineGfx) {
                this._outlineGfx.x = this.enemy.graphics.x;
                this._outlineGfx.y = this.enemy.graphics.y;
            }
        }
    }
    
    /**
     * Exit this state - runs once when state is deactivated
     */
    exit() {
        // Restore original stats
        this.enemy.speed = this.originalStats.speed;
        this.enemy.damage = this.originalStats.damage;
        
        // Restore original appearance
        if (this.enemy.graphics) {
            // Remove outline
            this.removeRageOutline();
            
            // Stop scale tween
            if (this._scaleTween) {
                this._scaleTween.stop();
                this._scaleTween = null;
                
                // Reset scale
                this.enemy.graphics.setScale(1);
            }
        }
        
        // Emit an event that this enemy has exited rage state
        EventBus.emit('enemy-rage-ended', {
            enemy: this.enemy,
            groupId: this.enemy.groupId,
            position: {
                x: this.enemy.graphics ? this.enemy.graphics.x : 0,
                y: this.enemy.graphics ? this.enemy.graphics.y : 0
            }
        });
    }
    
    /**
     * Check if the enemy should enter rage state
     * @param {BaseEnemy} enemy - The enemy to check
     * @returns {boolean} True if the enemy should enter rage state
     * @static
     */
    static shouldRage(enemy) {
        if (!enemy.scene.chaosManager || !enemy.groupId) {
            return false;
        }
        
        // Use the isEnraged method rather than isPanicking
        return enemy.scene.chaosManager.isEnraged(enemy.groupId);
    }
}