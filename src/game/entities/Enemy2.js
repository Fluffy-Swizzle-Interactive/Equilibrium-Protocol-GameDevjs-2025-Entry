import { BaseEnemy } from './BaseEnemy';

/**
 * Enemy2 - Tougher enemy type
 * Slower but tougher enemies with more health
 */
export class Enemy2 extends BaseEnemy {
    /**
     * Create a new Enemy2 instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        super(scene, x, y, fromPool);
        this.type = 'enemy2';
        this.dashCooldown = 0;
        this.dashState = 'ready'; // ready, charging, dashing
    }
    
    /**
     * Initialize enemy properties
     * @override
     */
    initProperties() {
        // Slower but tougher
        this.speed = 0.4; // Slower than base
        this.size = 18;   // Larger than base
        this.color = 0x0000ff; // Blue color
        this.health = 20;  // More health
        this.baseHealth = 20;
        this.damage = 40;
        this.scoreValue = 25;
        this.dashSpeed = 2.0; // Speed during dash
        this.chargeTime = 1500; // Increased time to prepare dash
        this.dashTime = 500; // Dash duration in ms
        this.dashCooldownTime = 5000; // Increased time between dashes
    }
    
    /**
     * Override the reset method to reset dash state
     * @override
     */
    reset(x, y, options = {}) {
        super.reset(x, y, options);
        this.dashCooldown = 0;
        this.dashState = 'ready';
    }
    
    /**
     * Custom movement pattern - charges at player after delay
     * @param {Object} playerPos - The player's position {x, y}
     * @override
     */
    moveTowardsPlayer(playerPos) {
        // Skip if targeting is disabled (neutralized enemy)
        if (this.isNeutral) return;
        
        // Skip if playing death animation
        if (this.currentAnimationKey && this.currentAnimationKey.includes('death')) {
            return;
        }
        
        // Get reference to visual representation
        const visual = this.sprite || this.graphics;
        if (!visual) return;
        
        // Calculate direction to player
        const dx = playerPos.x - visual.x;
        const dy = playerPos.y - visual.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        const currentTime = this.scene.time.now;
        
        // Handle dash states - only activate dash if player is in medium range
        if (this.dashState === 'ready' && distance < 250 && distance > 100 && this.dashCooldown < currentTime) {
            // Start charging dash when player is within specific range
            this.dashState = 'charging';
            this.dashDirection = { x: dx / distance, y: dy / distance };
            this.dashTarget = { x: playerPos.x, y: playerPos.y };
            this.chargeStartTime = currentTime;
            
            // Visual indicators for charging
            if (this.sprite) {
                // Play activation animation when starting to charge
                this.sprite.play('enemy2_activate');
                this.sprite.setTint(0xffff00); // Yellow tint when charging
            } else if (this.graphics) {
                this.graphics.setFillStyle(0xffff00); // Yellow when charging
            }
            
        } else if (this.dashState === 'charging') {
            // Hold position while charging
            if (currentTime > this.chargeStartTime + this.chargeTime) {
                // Start dash after charge time
                this.dashState = 'dashing';
                this.dashStartTime = currentTime;
                
                if (this.sprite) {
                    // Play run animation at faster rate during dash
                    this.sprite.play('enemy2_run', true);
                    
                    // Use frameRate instead of setTimeScale to control animation speed
                    if (this.sprite.anims && this.sprite.anims.currentAnim) {
                        this.sprite.anims.currentAnim.frameRate = 20; // Increase frame rate for faster animation
                    }
                    this.sprite.setTint(0xff0000); // Red during dash
                } else if (this.graphics) {
                    this.graphics.setFillStyle(0xff0000); // Red during dash
                }
            } else {
                // Move very slowly while charging
                const dirX = dx / distance;
                const dirY = dy / distance;
                visual.x += dirX * (this.speed * 0.3);
                visual.y += dirY * (this.speed * 0.3);
                
                // Keep the activation animation playing during charge
                if (this.sprite && 
                    (!this.sprite.anims.isPlaying || 
                     this.sprite.anims.currentAnim.key !== 'enemy2_activate')) {
                    this.sprite.play('enemy2_idle', true);
                }
            }
            
        } else if (this.dashState === 'dashing') {
            // Execute dash
            visual.x += this.dashDirection.x * this.dashSpeed;
            visual.y += this.dashDirection.y * this.dashSpeed;
            
            if (currentTime > this.dashStartTime + this.dashTime) {
                // End dash
                this.dashState = 'ready';
                this.dashCooldown = currentTime + this.dashCooldownTime;
                
                if (this.sprite) {
                    // Reset animation speed using frameRate
                    if (this.sprite.anims && this.sprite.anims.currentAnim) {
                        this.sprite.anims.currentAnim.frameRate = 10; // Reset to normal frame rate
                    }
                    this.sprite.clearTint();
                    // Return to idle animation after dash
                    this.sprite.play('enemy2_idle', true);
                } else if (this.graphics) {
                    this.graphics.setFillStyle(this.color); // Reset color
                }
            }
            
        } else if (distance > 0) {
            // Normal movement when not dashing
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move toward player
            visual.x += dirX * this.speed;
            visual.y += dirY * this.speed;
            
            // Update animation for normal movement
            if (this.sprite && 
                (!this.sprite.anims.isPlaying || 
                 (this.sprite.anims.currentAnim && 
                  !this.sprite.anims.currentAnim.key.includes('death')))) {
                
                this.sprite.play('enemy2_run', true);
                
                // Flip sprite based on horizontal direction
                if (dirX !== 0) {
                    this.sprite.setFlipX(dirX < 0);
                }
            }
        }
    }
}