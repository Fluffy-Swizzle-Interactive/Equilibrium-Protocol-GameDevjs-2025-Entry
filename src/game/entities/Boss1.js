import { BaseEnemy } from './BaseEnemy';
import { DEPTHS } from '../constants';

/**
 * Boss1 - First boss enemy type
 * Powerful enemy with special attacks and health bar
 */
export class Boss1 extends BaseEnemy {
    /**
     * Create a new Boss1 instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        super(scene, x, y, fromPool);
        this.type = 'boss1';
        this.hasHealthBar = true;
        this.attackPhase = 0;
        this.phaseTime = 0;
    }
    
    /**
     * Initialize enemy properties
     * @override
     */
    initProperties() {
        // Boss properties
        this.speed = 0.3; // Slower
        this.size = 80;   // Much larger
        this.color = 0xff0000; // Red color
        this.health = 1500;
        this.baseHealth = 1500;
        this.damage = 40;
        this.scoreValue = 100;
        
        // Attack patterns
        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.isAttacking = false;
        this.attackPhase = 0;
        this.attackPatterns = [
            { name: 'orbit', duration: 5000, cooldown: 2000 },
            { name: 'charge', duration: 2000, cooldown: 3000 },
            { name: 'summon', duration: 1000, cooldown: 7000 }
        ];
    }
    
    /**
     * Override reset method to reset boss-specific state
     * @override
     */
    reset(x, y, options = {}) {
        super.reset(x, y, options);
        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.isAttacking = false;
        this.attackPhase = 0;
        this.phaseTime = 0;
        this.chargeDirection = null;
    }
    
    /**
     * Create visual representation with proper scale for boss
     * @override
     */
    createVisuals(x, y) {
        if (this.scene.textures.exists(this.type)) {
            // Create sprite with proper atlas texture
            this.sprite = this.scene.add.sprite(x, y, this.type);
            this.sprite.setScale(2.5); // Larger scale for boss
            
            // Play idle animation if available
            this.sprite.play(`${this.type}_idle`);
            
            // Set consistent depth to ensure proper layering
            this.sprite.setDepth(DEPTHS.ENEMIES);
            
            // Store reference to parent in sprite for collision detection
            this.sprite.parentEnemy = this;
            
            // Store reference to sprite as graphics for compatibility with existing code
            this.graphics = this.sprite;
            
            // Add to physics system if needed
            this.scene.physics.add.existing(this.sprite);
        } else {
            // Fallback to circle if sprite not available
            this.graphics = this.scene.add.circle(x, y, this.size / 2, this.color);
            this.graphics.setStrokeStyle(4, 0xffff00); // Gold outline for boss
            this.graphics.setDepth(DEPTHS.ENEMIES);
            this.graphics.parentEnemy = this;
            
            // Add to physics system
            this.scene.physics.add.existing(this.graphics);
        }
        
        // Add to enemies group
        if (this.scene.enemies) {
            this.scene.enemies.add(this.graphics);
        }
    }
    
    /**
     * Override update to include boss-specific behavior
     * @override
     */
    update() {
        // Skip if not active
        const visual = this.sprite || this.graphics;
        if (!this.active || !visual || !visual.active) {
            return;
        }
        
        const playerPos = this.scene.player.getPosition();
        
        // Update health bar
        this.updateHealthBar();
        
        // Handle attack patterns
        this.updateBossAttackPattern(playerPos);
        
        // Check collision with player
        this.checkPlayerCollision(playerPos);
    }
    
    /**
     * Update boss attack patterns
     * @param {Object} playerPos - The player's position {x, y}
     */
    updateBossAttackPattern(playerPos) {
        const currentTime = this.scene.time.now;
        
        // If not attacking and cooldown expired, start new attack
        if (!this.isAttacking && currentTime > this.attackCooldown) {
            // Choose attack pattern (cycle through them)
            this.attackPhase = (this.attackPhase + 1) % this.attackPatterns.length;
            const pattern = this.attackPatterns[this.attackPhase];
            
            this.isAttacking = true;
            this.attackStartTime = currentTime;
            this.attackDuration = pattern.duration;
            this.currentPattern = pattern;
            
            // Visual indicator for attack start
            if (this.sprite) {
                // Check if animation exists before trying to play it
                const attackAnimKey = pattern.name === 'charge' ? `${this.type}_run` : `${this.type}_attack`;
                
                if (this.scene.textures.exists(this.type) && 
                    this.scene.anims.exists(attackAnimKey) &&
                    this.scene.anims.get(attackAnimKey).frames.length > 0) {
                    try {
                        this.sprite.play(attackAnimKey);
                    } catch(e) {
                        console.warn(`Failed to play animation '${attackAnimKey}': ${e.message}`);
                        // Fallback to just setting the tint without animation
                        this.sprite.setTint(0xffff00);
                    }
                } else {
                    // Just set tint if animation doesn't exist
                    this.sprite.setTint(0xffff00); // Yellow tint when charging attack
                }
            } else if (this.graphics) {
                this.graphics.setStrokeStyle(2, 0xffff00);
            }
            
            // If it's a summon attack, immediately spawn minions
            if (pattern.name === 'summon') {
                this.summonMinions();
            }
            
        } else if (this.isAttacking) {
            // Execute current attack pattern
            if (this.currentPattern.name === 'orbit') {
                this.executeOrbitAttack(playerPos, currentTime);
            } else if (this.currentPattern.name === 'charge') {
                this.executeChargeAttack(playerPos, currentTime);
            }
            
            // Check if attack is finished
            if (currentTime > this.attackStartTime + this.attackDuration) {
                this.isAttacking = false;
                this.attackCooldown = currentTime + this.currentPattern.cooldown;
                
                if (this.sprite) {
                    this.sprite.clearTint();
                    // Check if idle animation exists before trying to play it
                    const idleAnimKey = `${this.type}_idle`;
                    if (this.scene.anims.exists(idleAnimKey) &&
                        this.scene.anims.get(idleAnimKey).frames.length > 0) {
                        try {
                            this.sprite.play(idleAnimKey);
                        } catch(e) {
                            console.warn(`Failed to play animation '${idleAnimKey}': ${e.message}`);
                        }
                    }
                } else if (this.graphics) {
                    this.graphics.setStrokeStyle(0); // Remove visual indicator
                }
            }
        } else {
            // Standard movement when not attacking
            this.moveTowardsPlayer(playerPos);
        }
    }
    
    /**
     * Execute orbit attack pattern - boss circles around player
     * @param {Object} playerPos - The player's position {x, y}
     * @param {number} currentTime - Current game time
     */
    executeOrbitAttack(playerPos, currentTime) {
        // Calculate orbit parameters
        const orbitRadius = 200;
        const orbitSpeed = 0.002; // radians per ms
        const elapsedTime = currentTime - this.attackStartTime;
        const angle = orbitSpeed * elapsedTime;
        
        // Get visual representation
        const visual = this.sprite || this.graphics;
        
        // Position on orbit
        visual.x = playerPos.x + Math.cos(angle) * orbitRadius;
        visual.y = playerPos.y + Math.sin(angle) * orbitRadius;
        
        // If using sprite, update flip based on orbit direction
        if (this.sprite) {
            const movingLeft = Math.sin(angle + Math.PI/2) > 0;
            this.sprite.setFlipX(movingLeft);
        }
        
        // Spawn projectiles periodically
        if (elapsedTime % 500 < 20) { // Every 500ms
            this.spawnProjectile(playerPos);
        }
    }
    
    /**
     * Execute charge attack pattern - boss charges at player
     * @param {Object} playerPos - The player's position {x, y}
     * @param {number} currentTime - Current game time
     */
    executeChargeAttack(playerPos, currentTime) {
        const elapsedTime = currentTime - this.attackStartTime;
        const visual = this.sprite || this.graphics;
        
        // First 1000ms: pause and telegraph attack
        if (elapsedTime < 1000) {
            // Flash to indicate charging
            if (elapsedTime % 200 < 100) {
                if (this.sprite) {
                    this.sprite.setTint(0xffff00); // Yellow when charging
                } else {
                    this.graphics.setFillStyle(0xffff00);
                }
            } else {
                if (this.sprite) {
                    this.sprite.setTint(0xff0000); // Red when not flashing
                } else {
                    this.graphics.setFillStyle(this.color);
                }
            }
            return;
        }
        
        // Execute charge after telegraph
        if (!this.chargeDirection) {
            // Calculate direction to player at start of charge
            const dx = playerPos.x - visual.x;
            const dy = playerPos.y - visual.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.chargeDirection = {
                x: dx / distance,
                y: dy / distance
            };
            
            // Set appearance during charge
            if (this.sprite) {
                this.sprite.setTint(0xff0000); // Red during charge
                // Set sprite direction based on charge
                this.sprite.setFlipX(this.chargeDirection.x < 0);
                
                // Play charge/run animation if available
                if (this.scene.anims.exists(`${this.type}_run`)) {
                    this.sprite.play(`${this.type}_run`, true);
                    
                    // Only attempt to set time scale if the anims object and method exists
                    if (this.sprite.anims && typeof this.sprite.anims.setTimeScale === 'function') {
                        this.sprite.anims.setTimeScale(2); // Speed up animation
                    }
                }
            } else {
                this.graphics.setFillStyle(0xff0000);
            }
        }
        
        // Move in the charge direction
        const chargeSpeed = 3.0; // Much faster than normal movement
        visual.x += this.chargeDirection.x * chargeSpeed;
        visual.y += this.chargeDirection.y * chargeSpeed;
        
        // Reset charge direction when attack completes
        if (elapsedTime >= this.attackDuration - 100) {
            this.chargeDirection = null;
            if (this.sprite) {
                this.sprite.clearTint();
                // Only attempt to reset time scale if the anims object and method exists
                if (this.sprite.anims && typeof this.sprite.anims.setTimeScale === 'function') {
                    this.sprite.anims.setTimeScale(1); // Reset animation speed
                }
            } else if (this.graphics) {
                this.graphics.setFillStyle(this.color);
            }
        }
    }
    
    /**
     * Spawn minions around the boss
     */
    summonMinions() {
        // Request the EnemyManager to spawn minions around the boss
        if (this.scene.enemyManager) {
            const visual = this.sprite || this.graphics;
            
            // Boss location
            const x = visual.x;
            const y = visual.y;
            
            // Spawn 3-5 minions in a circle around the boss
            const count = Math.floor(3 + Math.random() * 3);
            
            this.scene.enemyManager.spawnEnemyGroup('enemy1', x, y, count, 100);
            
            // Visual effect for summoning - create initial circle with alpha
            const initialCircle = this.scene.add.circle(x, y, 100, 0xffff00, 0.3)
                .setDepth(90)
                .setAlpha(0.7);
            
            // Animate the initial circle to fade out
            this.scene.tweens.add({
                targets: initialCircle,
                alpha: 0,
                radius: 140,
                duration: 700,
                ease: 'Cubic.Out',
                onComplete: (tween, targets) => {
                    // Clean up the initial circle when animation completes
                    targets[0].destroy();
                }
            });
            
            // Create and animate a second expanding circle for additional effect
            const expandingCircle = this.scene.add.circle(x, y, 10, 0xffff00, 0.1).setDepth(90);
            this.scene.tweens.add({
                targets: expandingCircle,
                radius: 120,
                alpha: 0,
                duration: 500,
                ease: 'Cubic.Out',
                onComplete: (tween, targets) => {
                    // Clean up the expanding circle when animation completes
                    targets[0].destroy();
                }
            });
        }
    }
    
    /**
     * Spawn a projectile targeting the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    spawnProjectile(playerPos) {
        const visual = this.sprite || this.graphics;
        
        // Play shoot animation if available - with better error handling
        if (this.sprite) {
            const shootAnimKey = `${this.type}_shoot`;
            // Verify the animation exists AND has frames before trying to play it
            if (this.scene.anims.exists(shootAnimKey) && 
                this.scene.anims.get(shootAnimKey) && 
                this.scene.anims.get(shootAnimKey).frames && 
                this.scene.anims.get(shootAnimKey).frames.length > 0) {
                try {
                    // Only change animation if not already playing death animation
                    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== `${this.type}_death`) {
                        this.sprite.play(shootAnimKey);
                    }
                } catch(e) {
                    console.warn(`Failed to play ${shootAnimKey} animation: ${e.message}`);
                    // Continue with projectile spawn even if animation fails
                }
            }
        }
        
        // Calculate direction to player
        const dx = playerPos.x - visual.x;
        const dy = playerPos.y - visual.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Create projectile if available in scene
        if (this.scene.enemyManager) {
            this.scene.enemyManager.spawnProjectile(
                visual.x, 
                visual.y,
                dirX, 
                dirY, 
                2.0,
                this.damage / 10
            );
        }
    }
    
    /**
     * Override moveTowardsPlayer to add boss-specific movement
     * @override
     * @param {Object} playerPos - The player's position {x, y}
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
        
        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move toward player with slower speed for boss
            visual.x += dirX * this.speed;
            visual.y += dirY * this.speed;
            
            // If using sprite animations, update based on direction
            if (this.sprite) {
                // Play idle or run animation
                const animKey = distance > 100 ? `${this.type}_run` : `${this.type}_idle`;
                if (this.sprite.anims.currentAnim?.key !== animKey &&
                    !this.sprite.anims.currentAnim?.key.includes('attack') &&
                    !this.sprite.anims.currentAnim?.key.includes('death')) {
                    this.sprite.play(animKey, true);
                }
                
                // Flip sprite based on horizontal direction
                if (dirX !== 0) {
                    this.sprite.setFlipX(dirX < 0);
                }
            }
        }
    }
    
    /**
     * Override die method to include boss-specific death effects
     * @override
     */
    die() {
        // Play death animation if available
        if (this.sprite && this.scene.anims.exists(`${this.type}_death`)) {
            this.sprite.play(`${this.type}_death`);
            
            // Wait for death animation to complete before removing
            this.sprite.on('animationcomplete', (anim) => {
                if (anim.key === `${this.type}_death`) {
                    this.completeCleanup();
                }
            });
            
            // Also set a timer as fallback if animation doesn't complete
            this.scene.time.delayedCall(1500, () => {
                this.completeCleanup();
            });
        } else {
           
            // No animation, clean up immediately
            this.completeCleanup();
        }
        
        // Notify the scene about the boss death
        const visual = this.sprite || this.graphics;
        const position = visual ? { x: visual.x, y: visual.y } : null;
        
        this.scene.onEnemyKilled(
            true, // isBoss is true
            position ? position.x : 0,
            position ? position.y : 0,
            this.type
        );
    }
}