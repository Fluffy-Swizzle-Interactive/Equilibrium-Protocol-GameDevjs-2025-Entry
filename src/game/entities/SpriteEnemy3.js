import { SpriteEnemy } from './SpriteEnemy';

/**
 * SpriteEnemy3 - Sprite-based implementation of the ranged enemy type
 * A ranged enemy that keeps distance from player and fires projectiles
 */
export class SpriteEnemy3 extends SpriteEnemy {
    /**
     * Create a new SpriteEnemy3 instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        // Configure the sprite settings for Enemy3
        const spriteConfig = {
            key: 'enemy3',
            scale: 1.3,
            animations: {
                idle: {
                    frames: [0, 1, 2, 3].map(i => `enemy3_idle_${i}.png`),
                    frameRate: 5,
                    repeat: -1
                },
                run: {
                    frames: [0, 1, 2, 3].map(i => `enemy3_run_${i}.png`),
                    frameRate: 8,
                    repeat: -1
                },
                death: {
                    frames: [0, 1, 2, 3, 4, 5, 6, 7].map(i => `enemy3_death_${i}.png`),
                    frameRate: 10,
                    repeat: 0
                },
                shoot: {
                    frames: [0, 1, 2, 3].map(i => `enemy3_shoot_${i}.png`),
                    frameRate: 12,
                    repeat: 0
                }
            }
        };
        
        super(scene, x, y, fromPool, spriteConfig);
        this.type = 'enemy3';
        
        // Ranged attack properties
        this.attackCooldown = 0;
    }
    
    /**
     * Initialize enemy properties
     * @override
     */
    initProperties() {
        // Ranged enemy stats - medium speed, low health
        this.speed = 0.5;
        this.size = 16;
        this.health = 30;
        this.damage = 8;
        this.scoreValue = 15;
        
        // Attack properties
        this.attackRange = 300;           // Range at which to attack
        this.preferredDistance = 200;     // Distance enemy tries to maintain from player
        this.attackCooldownTime = 2000;   // Time between attacks in ms
        this.projectileSpeed = 2.0;       // Speed of projectiles
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
        
        // Calculate distance to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Try to fire if within attack range
        this.tryRangedAttack(playerPos, distance);
        
        // Move towards or away from player based on distance
        this.moveStrategically(playerPos, distance);
        
        // Update animation based on movement
        this.updateAnimation();
        
        // Store position for next frame
        this.lastX = this.graphics.x;
        this.lastY = this.graphics.y;
        
        // Update faction outline color
        this.updateFactionDisplay();
    }
    
    /**
     * Update animation based on current state and movement
     */
    updateAnimation() {
        if (!this.graphics || !this.graphics.anims) return;
        
        // Skip if death animation is playing
        if (this.graphics.anims.currentAnim?.key.includes('death')) return;
        // Skip if shoot animation is playing (let it complete)
        if (this.graphics.anims.currentAnim?.key.includes('shoot') && 
            !this.graphics.anims.getProgress() >= 1) return;
        
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
        
        // Set orientation based on player direction
        const playerPos = this.scene.player?.getPosition();
        if (playerPos) {
            if (playerPos.x < this.graphics.x) {
                this.graphics.setFlipX(false);
            } else {
                this.graphics.setFlipX(true);
            }
        }
    }
    
    /**
     * Move towards or away from player depending on current distance
     * @param {Object} playerPos - Player position {x, y}
     * @param {number} distance - Current distance to player
     */
    moveStrategically(playerPos, distance) {
        // Skip if targeting is disabled
        if (this._targetingDisabled) return;
        
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            if (distance > this.preferredDistance + 50) {
                // Too far - move closer
                this.graphics.x += dirX * this.speed;
                this.graphics.y += dirY * this.speed;
            } else if (distance < this.preferredDistance - 50) {
                // Too close - back away
                this.graphics.x -= dirX * this.speed;
                this.graphics.y -= dirY * this.speed;
            } else {
                // In the sweet spot - strafe perpendicular to player
                const perpX = -dirY;
                const perpY = dirX;
                
                // Strafe direction alternates based on time
                const strafeDir = Math.floor(this.scene.time.now / 3000) % 2 === 0 ? 1 : -1;
                
                this.graphics.x += perpX * this.speed * strafeDir * 0.6;
                this.graphics.y += perpY * this.speed * strafeDir * 0.6;
            }
        }
    }
    
    /**
     * Try to perform a ranged attack if conditions are right
     * @param {Object} playerPos - Player position {x, y}
     * @param {number} distance - Current distance to player
     */
    tryRangedAttack(playerPos, distance) {
        if (!this.active || !this.graphics || this._targetingDisabled) return;
        
        const currentTime = this.scene.time.now;
        
        // Check if within attack range and cooldown is over
        if (distance <= this.attackRange && currentTime > this.attackCooldown) {
            // Reset cooldown
            this.attackCooldown = currentTime + this.attackCooldownTime;
            
            // Play shoot animation
            this.playAnimation('shoot', false);
            
            // Calculate angle to player
            const angle = Phaser.Math.Angle.Between(
                this.graphics.x, this.graphics.y,
                playerPos.x, playerPos.y
            );
            
            // Fire projectile after animation delay
            this.scene.time.delayedCall(400, () => {
                if (!this.active || !this.graphics) return;
                
                // Fire projectile if enemy manager exists
                if (this.scene.enemyManager && typeof this.scene.enemyManager.spawnProjectile === 'function') {
                    this.scene.enemyManager.spawnProjectile(
                        this.graphics.x,
                        this.graphics.y,
                        {
                            angle,
                            speed: this.projectileSpeed,
                            damage: this.damage,
                            color: 0x00ffff, // Cyan projectile
                            lifespan: 2000
                        }
                    );
                }
            });
        }
    }
}