import { SpriteEnemy } from './SpriteEnemy';

/**
 * SpriteEnemy2 - Sprite-based implementation of the tank enemy type
 * A slower but stronger enemy that can perform charging attacks
 */
export class SpriteEnemy2 extends SpriteEnemy {
    /**
     * Create a new SpriteEnemy2 instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        // Configure the sprite settings for Enemy2
        const spriteConfig = {
            key: 'enemy2',
            scale: 1.6,
            animations: {
                idle: {
                    frames: [0, 1, 2, 3].map(i => `enemy2_idle_${i}.png`),
                    frameRate: 4,
                    repeat: -1
                },
                run: {
                    frames: [0, 1, 2, 3].map(i => `enemy2_run_${i}.png`),
                    frameRate: 6,
                    repeat: -1
                },
                death: {
                    frames: [0, 1, 2, 3, 4, 5, 6, 7].map(i => `enemy2_death_${i}.png`),
                    frameRate: 8,
                    repeat: 0
                },
                activate: {
                    frames: [0, 1, 2, 3, 4].map(i => `enemy2_activate_${i}.png`),
                    frameRate: 8,
                    repeat: 0
                },
                shoot: {
                    frames: [0, 1, 2, 3].map(i => `enemy2_shoot_${i}.png`),
                    frameRate: 8,
                    repeat: 0
                }
            }
        };
        
        super(scene, x, y, fromPool, spriteConfig);
        this.type = 'enemy2';
        
        // Tank-specific properties
        this.isCharging = false;
        this.chargeTimer = 0;
        this.chargeCooldown = 0;
        this.chargeDirection = { x: 0, y: 0 };
        this.normalSpeed = 0.4; // Store normal speed for reference
        this.chargeSpeed = 1.5;  // Speed during charge attack
    }
    
    /**
     * Initialize enemy properties
     * @override
     */
    initProperties() {
        // Tank enemy stats - slower, but more health
        this.speed = 0.4;
        this.size = 24;
        this.health = 80;
        this.damage = 20;
        this.scoreValue = 25;
        
        // Charge attack properties
        this.chargeRange = 250;       // Range at which to consider charging
        this.chargeDuration = 1000;   // Duration of charge in ms
        this.chargeCooldownTime = 5000; // Time between charges
    }
    
    /**
     * Update enemy position and behavior each frame
     * @override
     */
    update() {
        if (!this.active || !this.graphics || !this.graphics.active) return;
        
        // Get player position
        const playerPos = this.scene.player?.getPosition();
        if (!playerPos) return;
        
        const currentTime = this.scene.time.now;
        
        // Handle charging state
        if (this.isCharging) {
            // Check if charge has ended
            if (currentTime > this.chargeTimer) {
                this.endCharge();
            } else {
                // Continue moving in charge direction
                this.graphics.x += this.chargeDirection.x * this.chargeSpeed;
                this.graphics.y += this.chargeDirection.y * this.chargeSpeed;
            }
        } else {
            // Normal behavior - try to charge if cooldown is over
            if (currentTime > this.chargeCooldown) {
                // Get distance to player
                const dx = playerPos.x - this.graphics.x;
                const dy = playerPos.y - this.graphics.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If within charge range, initiate charge
                if (distance < this.chargeRange && distance > 50) {
                    this.startCharge(playerPos);
                }
            }
            
            // Use normal movement if not charging
            if (!this.isCharging) {
                this.moveTowardsPlayer(playerPos);
            }
        }
        
        // Update animation based on movement
        this.updateAnimation();
        
        // Store position for next frame
        this.lastX = this.graphics.x;
        this.lastY = this.graphics.y;
        
        // Update faction outline color
        this.updateFactionDisplay();
    }
    
    /**
     * Update animation based on current state
     */
    updateAnimation() {
        if (!this.graphics || !this.graphics.anims) return;
        
        // Skip if death animation is playing
        if (this.graphics.anims.currentAnim?.key.includes('death')) return;
        
        if (this.isCharging) {
            // Use charge animation when charging
            if (!this.graphics.anims.currentAnim?.key.includes('charge')) {
                this.playAnimation('charge', false);
            }
        } else {
            // Check if moving
            const dx = this.graphics.x - this.lastX;
            const dy = this.graphics.y - this.lastY;
            const isMoving = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;
            
            // Use run animation when moving, idle when stationary
            if (isMoving && !this.graphics.anims.currentAnim?.key.includes('run')) {
                this.playAnimation('run', false);
            } else if (!isMoving && !this.graphics.anims.currentAnim?.key.includes('idle')) {
                this.playAnimation('idle', false);
            }
            
            // Flip sprite based on movement direction
            if (dx < -0.01) {
                this.graphics.setFlipX(false);
            } else if (dx > 0.01) {
                this.graphics.setFlipX(true);
            }
        }
    }
    
    /**
     * Start a charging attack
     * @param {Object} playerPos - Player position {x, y}
     */
    startCharge(playerPos) {
        if (!this.active || !this.graphics || this.isCharging) return;
        
        // Set charging state
        this.isCharging = true;
        this.chargeTimer = this.scene.time.now + this.chargeDuration;
        
        // Calculate and store charge direction
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.chargeDirection = {
                x: dx / distance,
                y: dy / distance
            };
        } else {
            this.chargeDirection = { x: 0, y: 0 };
        }
        
        // Play charge animation
        this.playAnimation('charge', false);
        
        // Determine which way to face
        if (this.chargeDirection.x < 0) {
            this.graphics.setFlipX(false);
        } else {
            this.graphics.setFlipX(true);
        }
    }
    
    /**
     * End the charging attack
     */
    endCharge() {
        this.isCharging = false;
        this.chargeCooldown = this.scene.time.now + this.chargeCooldownTime;
        
        // Reset to normal animation
        this.playAnimation('idle', false);
    }
    
    /**
     * Take damage from player and show feedback
     * @param {number} amount - Amount of damage to take
     * @override
     */
    takeDamage(amount) {
        // Take reduced damage while charging (simulating armor)
        if (this.isCharging) {
            amount = Math.max(1, amount * 0.5); // Minimum 1 damage, max 50% reduction
        }
        
        // Call parent implementation with adjusted damage
        super.takeDamage(amount);
    }
}