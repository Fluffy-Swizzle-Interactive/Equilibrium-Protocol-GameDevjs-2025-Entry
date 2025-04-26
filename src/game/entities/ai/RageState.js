/**
 * RageState.js
 * Implements rage behavior for enemies when a faction is being overwhelmed.
 * Causes enemies to aggressively rush towards the player with increased speed and damage.
 */

import { DEPTHS, GroupId } from '../../constants';
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
        
        // Save original stats
        this.originalStats = {
            speed: enemy.speed,
            damage: enemy.damage,
            color: enemy.color
        };
        
        // Store original animation speed if applicable
        if (enemy.sprite && enemy.sprite.anims && enemy.sprite.anims.currentAnim) {
            this.originalStats.animSpeed = enemy.sprite.anims.currentAnim.frameRate;
        }
        
        // Rage effects
        this.speedMultiplier = 1.7;  // 70% faster
        this.damageMultiplier = 1.5; // 50% more damage
        
        // Outline graphic for visual indicator
        this.outlineGraphic = null;
        
        // Graphics for rage particles
        this.particles = null;
        this.emitter = null;
    }
    
    /**
     * Enter this state - runs once when state is activated
     */
    enter() {
        // Apply rage effects
        this.enemy.speed = this.originalStats.speed * this.speedMultiplier;
        this.enemy.damage = this.originalStats.damage * this.damageMultiplier;
        
        // Get reference to enemy's visual representation
        const visual = this.enemy.sprite || this.enemy.graphics;
        
        // Create rage visual effects
        this.createRageOutline();
        
        // Change sprite appearance if this is a sprite-based enemy
        if (this.enemy.sprite) {
            // Apply red tint to sprite (keep this for compatibility)
            this.enemy.sprite.setTint(0xff4040);
            
            // Add pulsing effect using a tween
            this.pulseTween = this.scene.tweens.add({
                targets: this.enemy.sprite,
                scaleX: { from: 1.5, to: 1.7 }, // Slightly larger than default scale
                scaleY: { from: 1.5, to: 1.7 },
                duration: 200,
                yoyo: true,
                repeat: -1
            });
            
            // Speed up animations if applicable - using a different approach for compatibility
            if (this.enemy.sprite.anims && this.enemy.sprite.anims.currentAnim) {
                // Get current animation key
                const currentAnimKey = this.enemy.sprite.anims.currentAnim.key;
                
                // Store current frame
                const currentFrame = this.enemy.sprite.anims.currentFrame;
                
                // Restart the animation with increased speed by manually setting the duration
                // This is more compatible than using setTimeScale which might not exist
                const frameRate = this.originalStats.animSpeed || 24;  // Default to 24fps if not set
                this.enemy.sprite.anims.stop();
                this.enemy.sprite.play({
                    key: currentAnimKey,
                    frameRate: frameRate * 1.3,  // 30% faster animation
                    repeat: -1
                });
            }
        } else if (this.enemy.graphics) {
            // Change color for geometry-based enemies
            this.enemy.graphics.setFillStyle(0xff0000); // Bright red
        }
        
        // Emit rage event for sound effects and other systems
        EventBus.emit('enemy-rage-started', {
            enemy: this.enemy,
            position: visual ? { x: visual.x, y: visual.y } : null
        });
    }
    
    /**
     * Create a glowing white outline around the enemy
     * @private
     */
    createRageOutline() {
        // Get the enemy visual representation
        const visual = this.enemy.sprite || this.enemy.graphics;
        if (!visual) return;
        
        // Create particle emitter for rage effect if particle system exists
        if (this.scene.particles) {
            // Create particle emitter following the enemy
            this.particles = this.scene.add.particles(visual.x, visual.y, 'particle_texture', {
                scale: { start: 0.1, end: 0 },
                speed: { min: 5, max: 20 },
                alpha: { start: 0.6, end: 0 },
                tint: 0xff0000,
                lifespan: 300,
                blendMode: 'ADD',
                frequency: 20
            });
            
            // Make sure particles are at correct depth
            this.particles.setDepth(visual.depth - 1);
            
            // Set up to follow the enemy
            this.scene.tweens.add({
                targets: this.particles,
                x: visual.x,
                y: visual.y,
                duration: 0,
                ease: 'Linear',
                loop: -1,
                onUpdate: () => {
                    if (this.particles && visual.active) {
                        this.particles.setPosition(visual.x, visual.y);
                    }
                }
            });
        } else {
            // Fallback if particle system not available: create outline graphic
            const outlineSize = this.enemy.size * 1.2;
            this.outlineGraphic = this.scene.add.circle(
                visual.x, visual.y, 
                outlineSize / 2, // Convert diameter to radius
                0xff0000, 0.3
            );
            this.outlineGraphic.setStrokeStyle(2, 0xff0000);
            
            // Put outline behind enemy
            this.outlineGraphic.setDepth(visual.depth - 1);
        }
    }
    
    /**
     * Remove the rage outline graphic
     * @private
     */
    removeRageOutline() {
        // Clean up particle emitter if it exists
        if (this.particles) {
            this.particles.destroy();
            this.particles = null;
        }
        
        // Clean up outline graphic if it exists
        if (this.outlineGraphic) {
            this.outlineGraphic.destroy();
            this.outlineGraphic = null;
        }
    }
    
    /**
     * Execute the state behavior - runs every frame
     * @param {number} delta - Time since last update
     */
    update(delta) {
        // Update outline position to follow enemy
        const visual = this.enemy.sprite || this.enemy.graphics;
        if (visual && this.outlineGraphic) {
            this.outlineGraphic.setPosition(visual.x, visual.y);
        }
        
        // Nothing else to update in rage state - using enemy's normal update
        // with enhanced stats
    }
    
    /**
     * Rush towards the player with increased aggression
     * @private
     */
    rushTowardsPlayer() {
        // This method is optional - we're modifying speed in base enemy
        // implementation instead
    }
    
    /**
     * Exit this state - runs once when state is deactivated
     */
    exit() {
        // Restore original stats
        this.enemy.speed = this.originalStats.speed;
        this.enemy.damage = this.originalStats.damage;
        
        // Remove rage visual effects
        this.removeRageOutline();
        
        // Restore normal sprite appearance
        if (this.enemy.sprite) {
            this.enemy.sprite.clearTint();
            
            // Stop the pulse tween if it exists
            if (this.pulseTween) {
                this.pulseTween.stop();
                this.pulseTween = null;
                // Reset scale to normal
                this.enemy.sprite.setScale(1.5);
            }
            
            // Reset animation speed
            if (this.enemy.sprite.anims && this.enemy.sprite.anims.currentAnim) {
                // Get current animation key
                const currentAnimKey = this.enemy.sprite.anims.currentAnim.key;
                
                // Restore animation with original speed
                const frameRate = this.originalStats.animSpeed || 24; // Default to 24fps if not available
                this.enemy.sprite.anims.stop();
                this.enemy.sprite.play({
                    key: currentAnimKey,
                    frameRate: frameRate,
                    repeat: -1
                });
            }
        } else if (this.enemy.graphics) {
            // Restore original color
            this.enemy.graphics.setFillStyle(this.originalStats.color);
        }
    }
    
    /**
     * Static method to determine if an enemy should enter rage state
     * @param {BaseEnemy} enemy - The enemy to check
     * @returns {boolean} Whether the enemy should enter rage state
     */
    static shouldRage(enemy) {
        // Should rage if:
        // 1. Enemy belongs to a faction/group
        // 2. There's a ChaosManager that indicates the faction is under stress
        // 3. The faction balance is heavily skewed against this faction
        
        // If enemy is neutral or has no group, it can't rage
        if (!enemy.groupId || enemy.isNeutral) return false;
        
        // If there's no chaos manager, can't determine faction balance
        if (!enemy.scene.chaosManager) return false;
        
        // Get faction balance from chaos manager
        const factionBalance = enemy.scene.chaosManager.getFactionBalance();
        
        // Check if this group is weakened according to the chaos manager
        return enemy.scene.chaosManager.isGroupWeakened(enemy.groupId);
    }
}