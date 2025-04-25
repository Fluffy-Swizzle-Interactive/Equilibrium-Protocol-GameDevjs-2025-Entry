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
        // Tougher but slower enemies
        this.speed = 0.4;
        this.size = 18;
        this.color = 0x0000ff; // Blue color
        this.health = 20;
        this.baseHealth = 20;
        this.damage = 40;
        this.scoreValue = 25;
        
        // Dash attack properties
        this.dashSpeed = 2.0;
        this.chargeTime = 1500;
        this.dashTime = 500;
        this.dashCooldownTime = 5000;
        this.dashDirection = { x: 0, y: 0 };
        this.dashStartTime = 0;
    }
    
    /**
     * Override the reset method to reset dash state
     * @override
     */
    reset(x, y, options = {}) {
        super.reset(x, y, options);
        
        // Reset dash state
        this.dashCooldown = 0;
        this.dashState = 'ready';
    }
    
    /**
     * Custom movement pattern - charges at player after delay
     * @param {Object} playerPos - The player's position {x, y}
     * @override
     */
    moveTowardsPlayer(playerPos) {
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        const currentTime = this.scene.time.now;
        
        // Handle dash states - only activate dash if player is in medium range
        if (this.dashState === 'ready' && distance < 250 && distance > 100 && this.dashCooldown < currentTime) {
            // Start charging dash when player is within specific range
            this.dashState = 'charging';
            this.dashDirection = { x: dx / distance, y: dy / distance };
            this.dashStartTime = currentTime;
            
            // Visual charge-up effect
            if (this.graphics.setFillStyle) {
                this.graphics.setFillStyle(0xff0000);
            } else if (this.graphics.setTint) {
                this.graphics.setTint(0xff0000);
            }
            
        } else if (this.dashState === 'charging') {
            // During charge phase, slow movement and prepare for dash
            if (currentTime > this.dashStartTime + this.chargeTime) {
                // Switch to dash state
                this.dashState = 'dashing';
                this.dashStartTime = currentTime;
                
                // Visual indicator for dash
                if (this.graphics.setFillStyle) {
                    this.graphics.setFillStyle(0xff6600);
                } else if (this.graphics.setTint) {
                    this.graphics.setTint(0xff6600);
                }
            } else {
                // Minimal movement during charging
                // Use the physics body if available
                if (this.graphics.body) {
                    const velocity = this.speed * 60 * 0.3; // 30% normal speed
                    this.graphics.body.setVelocity(
                        this.dashDirection.x * velocity,
                        this.dashDirection.y * velocity
                    );
                } else {
                    // Fallback to direct position manipulation
                    const dirX = dx / distance;
                    const dirY = dy / distance;
                    this.graphics.x += dirX * (this.speed * 0.3);
                    this.graphics.y += dirY * (this.speed * 0.3);
                }
            }
            
        } else if (this.dashState === 'dashing') {
            // Execute dash
            // Use the physics body if available
            if (this.graphics.body) {
                const dashVelocity = this.dashSpeed * 60; // Convert to pixels per second
                this.graphics.body.setVelocity(
                    this.dashDirection.x * dashVelocity,
                    this.dashDirection.y * dashVelocity
                );
            } else {
                // Fallback to direct position manipulation
                this.graphics.x += this.dashDirection.x * this.dashSpeed;
                this.graphics.y += this.dashDirection.y * this.dashSpeed;
            }
            
            if (currentTime > this.dashStartTime + this.dashTime) {
                // End dash
                this.dashState = 'ready';
                this.dashCooldown = currentTime + this.dashCooldownTime;
                
                // Reset visual
                if (this.graphics.setFillStyle) {
                    this.graphics.setFillStyle(this.color);
                } else if (this.graphics.setTint) {
                    this.graphics.clearTint();
                }
            }
            
        } else if (distance > 0) {
            // Normal movement when not dashing
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Use the physics body if available
            if (this.graphics.body) {
                const velocity = this.speed * 60; // Convert to pixels per second
                this.graphics.body.setVelocity(
                    dirX * velocity,
                    dirY * velocity
                );
            } else {
                // Fallback to direct position manipulation
                this.graphics.x += dirX * this.speed;
                this.graphics.y += dirY * this.speed;
            }
        }
    }
}