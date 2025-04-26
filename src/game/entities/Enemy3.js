import { BaseEnemy } from './BaseEnemy';
import { EventBus } from '../EventBus';

/**
 * Enemy3 - Ranged attacker enemy type
 * Stays at distance and fires projectiles at the player
 */
export class Enemy3 extends BaseEnemy {
    /**
     * Create a new Enemy3 instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        super(scene, x, y, fromPool);
        this.type = 'enemy3';
        this.attackCooldown = 0;
    }
    
    /**
     * Initialize enemy properties
     * @override
     */
    initProperties() {
        // Ranged attacker
        this.speed = 0.3;          // Slower than base
        this.size = 14;            // Medium size
        this.color = 0xff6600;     // Orange color
        this.health = 15;          // Medium health
        this.baseHealth = 15;
        this.damage = 20;
        this.scoreValue = 20;
        
        // Ranged attack properties
        this.attackRange = 350;    // Range at which it starts attacking
        this.preferredRange = 250; // Distance it tries to maintain from player
        this.retreatRange = 150;   // Distance at which it moves away from player
        this.attackCooldownTime = 2000;   // Time between attacks (ms)
    }
    
    /**
     * Override reset method to reset attack cooldown
     * @override
     */
    reset(x, y, options = {}) {
        super.reset(x, y, options);
        this.attackCooldown = 0;
    }
    
    /**
     * Custom movement pattern - maintain distance and fire projectiles
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
        
        // Get reference to visual
        const visual = this.sprite || this.graphics;
        if (!visual) return;
        
        // Calculate direction and distance to player
        const dx = playerPos.x - visual.x;
        const dy = playerPos.y - visual.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = distance > 0 ? dx / distance : 0;
        const dirY = distance > 0 ? dy / distance : 0;
        
        // Check if it's time to attack
        const currentTime = this.scene.time.now;
        if (distance <= this.attackRange && currentTime > this.attackCooldown) {
            this.fireProjectile(playerPos);
            this.attackCooldown = currentTime + this.attackCooldownTime;
        }
        
        // Movement behavior based on distance
        if (distance < this.retreatRange) {
            // Too close - back away
            visual.x -= dirX * this.speed * 1.2; // Move away faster
            visual.y -= dirY * this.speed * 1.2;
            
            // Update animation
            if (this.sprite && 
                (!this.sprite.anims.isPlaying || 
                 (this.sprite.anims.currentAnim && 
                  !this.sprite.anims.currentAnim.key.includes('death') &&
                  !this.sprite.anims.currentAnim.key.includes('shoot')))) {
                
                this.sprite.play('enemy3_run', true);
                // Flip based on direction of retreat (opposite of player)
                this.sprite.setFlipX(dirX > 0);
            }
            
        } else if (distance > this.preferredRange) {
            // Too far - approach slowly
            visual.x += dirX * this.speed * 0.8; // Move towards more slowly
            visual.y += dirY * this.speed * 0.8;
            
            // Update animation
            if (this.sprite && 
                (!this.sprite.anims.isPlaying || 
                 (this.sprite.anims.currentAnim && 
                  !this.sprite.anims.currentAnim.key.includes('death') &&
                  !this.sprite.anims.currentAnim.key.includes('shoot')))) {
                
                this.sprite.play('enemy3_run', true);
                // Flip based on direction of approach
                this.sprite.setFlipX(dirX < 0);
            }
            
        } else {
            // At preferred range - strafe sideways
            const perpX = -dirY;
            const perpY = dirX;
            
            // Strafe direction changes every few seconds
            const strafeDir = Math.floor(currentTime / 3000) % 2 === 0 ? 1 : -1;
            
            visual.x += perpX * this.speed * strafeDir;
            visual.y += perpY * this.speed * strafeDir;
            
            // Update animation - use idle when strafing
            if (this.sprite && 
                (!this.sprite.anims.isPlaying || 
                 (this.sprite.anims.currentAnim && 
                  !this.sprite.anims.currentAnim.key.includes('death') &&
                  !this.sprite.anims.currentAnim.key.includes('shoot')))) {
                
                this.sprite.play('enemy3_idle', true);
                // Flip to face player
                this.sprite.setFlipX(dirX < 0);
            }
        }
    }
    
    /**
     * Fire a projectile at the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    fireProjectile(playerPos) {
        if (!this.scene.enemyManager) return;
        
        // Get reference to visual
        const visual = this.sprite || this.graphics;
        if (!visual) return;
        
        // Calculate direction to player
        const dx = playerPos.x - visual.x;
        const dy = playerPos.y - visual.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Play shooting animation if available
        if (this.sprite) {
            this.sprite.play('enemy3_shoot');
            // Make sure the sprite is facing the player
            this.sprite.setFlipX(dirX < 0);
            
            // Listen for animation completion to go back to idle
            this.sprite.once('animationcomplete', (anim) => {
                if (anim.key === 'enemy3_shoot') {
                    this.sprite.play('enemy3_idle', true);
                }
            });
        } else {
            // Flash the graphics to indicate firing
            this.graphics.setFillStyle(0xffff00);
            this.scene.time.delayedCall(100, () => {
                if (this.active && this.graphics && this.graphics.active) {
                    this.graphics.setFillStyle(this.color);
                }
            });
        }
        
        // Emit event for sound and visual effects
        EventBus.emit('enemy-attack', {
            type: 'ranged',
            enemyType: this.type,
            position: { x: visual.x, y: visual.y }
        });
        
        // Spawn the projectile
        this.scene.enemyManager.spawnProjectile(
            visual.x, 
            visual.y,
            dirX, 
            dirY, 
            3.0, // Faster projectile
            this.damage / 2 // Less damage per hit
        );
    }
}