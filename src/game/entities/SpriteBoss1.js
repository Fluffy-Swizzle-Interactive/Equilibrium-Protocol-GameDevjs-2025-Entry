import { SpriteEnemy } from './SpriteEnemy';
import { DEPTHS } from '../constants';

/**
 * SpriteBoss1 - Sprite-based implementation of Boss1 enemy
 * A powerful boss enemy with multiple attack patterns and phases
 */
export class SpriteBoss1 extends SpriteEnemy {
    /**
     * Create a new SpriteBoss1 instance
     * @param {Phaser.Scene} scene - The scene this boss belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this boss is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        // Configure the sprite settings for Boss1
        const spriteConfig = {
            key: 'boss1',
            scale: 2.0,
            animations: {
                idle: {
                    frames: [0, 1, 2, 3].map(i => `boss1_idle_${i}`),
                    frameRate: 4,
                    repeat: -1
                },
                run: {
                    frames: [0, 1, 2, 3, 4, 5].map(i => `boss1_run_${i}`),
                    frameRate: 7,
                    repeat: -1
                },
                death: {
                    frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `boss1_death_${i}`),
                    frameRate: 6,
                    repeat: 0
                },
                attack1: {
                    frames: [0, 1, 2, 3, 4].map(i => `boss1_attack1_${i}`),
                    frameRate: 10,
                    repeat: 0
                },
                attack2: {
                    frames: [0, 1, 2, 3, 4, 5].map(i => `boss1_attack2_${i}`),
                    frameRate: 8,
                    repeat: 0
                },
                special: {
                    frames: [0, 1, 2, 3, 4, 5, 6, 7].map(i => `boss1_special_${i}`),
                    frameRate: 10,
                    repeat: 0
                }
            },
            outlineThickness: 3 // Thicker outline for boss
        };
        
        super(scene, x, y, fromPool, spriteConfig);
        this.type = 'boss1';
        
        // Boss-specific attack properties
        this.attackPhase = 'idle';
        this.attackCooldown = 0;
        this.dashCooldown = 0;
        this.specialCooldown = 0;
        
        // Store original health for health bar calculations
        this.baseHealth = this.health;
        this.healthSegments = 3;
        this.currentSegment = 0;
        
        // Create health bar
        this.createHealthBar();
    }
    
    /**
     * Initialize boss properties
     * @override
     */
    initProperties() {
        // Boss stats - slow but very powerful
        this.speed = 0.25;
        this.size = 40;
        this.health = 1000;
        this.damage = 40;
        this.scoreValue = 500;
        
        // Attack properties
        this.attackRange = 300;
        this.attackCooldownTime = 3000;
        this.specialAttackCooldownTime = 15000;
        this.dashCooldownTime = 8000;
        this.dashTime = 1000;
        this.dashSpeed = 1.8;
    }
    
    /**
     * Create a visual health bar for the boss
     */
    createHealthBar() {
        // Background bar
        this.healthBarBg = this.scene.add.rectangle(
            this.graphics.x,
            this.graphics.y - this.size - 10,
            80, 
            8,
            0x000000
        );
        this.healthBarBg.setDepth(DEPTHS.ENEMY_HEALTH_BAR_BG);
        
        // Foreground bar (actual health)
        this.healthBarFg = this.scene.add.rectangle(
            this.healthBarBg.x - this.healthBarBg.width / 2 + 40,
            this.healthBarBg.y,
            80,
            6,
            0x00FF00
        );
        this.healthBarFg.setOrigin(0, 0.5);
        this.healthBarFg.setDepth(DEPTHS.ENEMY_HEALTH_BAR_FG);
    }
    
    /**
     * Update boss position, behavior and health bar each frame
     * @override
     */
    update() {
        if (!this.active || !this.graphics || !this.graphics.active) return;
        
        // Get player position
        const playerPos = this.scene.player?.getPosition();
        if (!playerPos) return;
        
        // Update health bar position
        this.updateHealthBar();
        
        // Skip everything if targeting is disabled
        if (this._targetingDisabled) return;
        
        // Try to perform attacks if cooldowns are over
        this.tryPerformAttack(playerPos);
        
        // Only move if not in special attack phase
        if (this.attackPhase !== 'special' && this.attackPhase !== 'dash') {
            this.moveTowardsPlayer(playerPos);
            
            // Update animation based on movement
            if (!this.graphics.anims.currentAnim?.key.includes('attack') && 
                !this.graphics.anims.currentAnim?.key.includes('special') &&
                !this.graphics.anims.currentAnim?.key.includes('death')) {
                
                const dx = this.graphics.x - this.lastX;
                const dy = this.graphics.y - this.lastY;
                const isMoving = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;
                
                if (isMoving && !this.graphics.anims.currentAnim?.key.includes('run')) {
                    this.playAnimation('run', false);
                } else if (!isMoving && !this.graphics.anims.currentAnim?.key.includes('idle')) {
                    this.playAnimation('idle', false);
                }
                
                // Set orientation based on player direction
                if (playerPos.x < this.graphics.x) {
                    this.graphics.setFlipX(false);
                } else {
                    this.graphics.setFlipX(true);
                }
            }
        }
        
        // Store position for next frame
        this.lastX = this.graphics.x;
        this.lastY = this.graphics.y;
        
        // Update faction outline color
        this.updateFactionDisplay();
    }
    
    /**
     * Update the health bar position and color
     */
    updateHealthBar() {
        if (!this.healthBarBg || !this.healthBarFg) return;
        
        // Position the health bar above the boss
        this.healthBarBg.x = this.graphics.x;
        this.healthBarBg.y = this.graphics.y - this.size - 10;
        this.healthBarFg.x = this.healthBarBg.x - this.healthBarBg.width / 2;
        this.healthBarFg.y = this.healthBarBg.y;
        
        // Update health bar width based on current health percentage
        const healthPercent = this.health / this.baseHealth;
        this.healthBarFg.width = 80 * healthPercent;
        
        // Change color based on health
        if (healthPercent < 0.3) {
            this.healthBarFg.fillColor = 0xFF0000; // Red when low health
        } else if (healthPercent < 0.6) {
            this.healthBarFg.fillColor = 0xFFAA00; // Orange when medium health
        } else {
            this.healthBarFg.fillColor = 0x00FF00; // Green when high health
        }
    }
    
    /**
     * Try to perform an attack if conditions are right
     * @param {Object} playerPos - Player position {x, y}
     */
    tryPerformAttack(playerPos) {
        if (!this.active || !this.graphics) return;
        
        const currentTime = this.scene.time.now;
        
        // Calculate distance to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Choose attack type based on cooldowns and distance
        if (currentTime > this.specialCooldown && this.health < (this.baseHealth * 0.6)) {
            // Special attack when below 60% health and cooldown is over
            this.specialCooldown = currentTime + this.specialAttackCooldownTime;
            this.attackPhase = 'special';
            this.performSpecialAttack(playerPos);
            
        } else if (currentTime > this.dashCooldown && distance > 150 && this.health < (this.baseHealth * 0.8)) {
            // Dash attack when below 80% health and not too close
            this.dashCooldown = currentTime + this.dashCooldownTime;
            this.attackPhase = 'dash';
            this.performDashAttack(playerPos);
            
        } else if (currentTime > this.attackCooldown && distance <= this.attackRange) {
            // Normal attack when within range and cooldown is over
            this.attackCooldown = currentTime + this.attackCooldownTime;
            this.attackPhase = 'attack';
            this.performNormalAttack(playerPos);
        }
    }
    
    /**
     * Perform a normal attack (multiple projectiles)
     * @param {Object} playerPos - Player position {x, y}
     */
    performNormalAttack(playerPos) {
        // Play attack animation
        this.playAnimation('attack1', false);
        
        // Determine which way to face
        if (playerPos.x < this.graphics.x) {
            this.graphics.setFlipX(false);
        } else {
            this.graphics.setFlipX(true);
        }
        
        // Calculate angle to player
        const angle = Phaser.Math.Angle.Between(
            this.graphics.x, this.graphics.y,
            playerPos.x, playerPos.y
        );
        
        // Fire multiple projectiles in a spread pattern
        this.scene.time.delayedCall(600, () => {
            if (!this.active || !this.graphics) return;
            
            // Fire 5 projectiles in a spread pattern
            const spreadAngle = Math.PI / 12; // 15 degrees
            
            for (let i = -2; i <= 2; i++) {
                const projectileAngle = angle + (i * spreadAngle);
                
                if (this.scene.enemyManager && typeof this.scene.enemyManager.spawnProjectile === 'function') {
                    this.scene.enemyManager.spawnProjectile(
                        this.graphics.x,
                        this.graphics.y,
                        {
                            angle: projectileAngle,
                            speed: 2.0,
                            damage: this.damage * 0.5, // Half damage per projectile
                            color: 0xFF00FF, // Purple projectile
                            lifespan: 3000,
                            scale: 1.5
                        }
                    );
                }
            }
            
            // Reset attack phase
            this.attackPhase = 'idle';
        });
    }
    
    /**
     * Perform a dash attack (charge at player)
     * @param {Object} playerPos - Player position {x, y}
     */
    performDashAttack(playerPos) {
        // Play attack animation
        this.playAnimation('attack2', false);
        
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Determine which way to face
            if (dirX < 0) {
                this.graphics.setFlipX(false);
            } else {
                this.graphics.setFlipX(true);
            }
            
            // Dash towards player
            const dashTween = this.scene.tweens.add({
                targets: this.graphics,
                x: this.graphics.x + (dirX * 250), // Dash distance
                y: this.graphics.y + (dirY * 250),
                duration: this.dashTime,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    this.attackPhase = 'idle';
                    this.playAnimation('idle', false);
                }
            });
        } else {
            // If somehow distance is 0, reset
            this.attackPhase = 'idle';
        }
    }
    
    /**
     * Perform special area attack
     * @param {Object} playerPos - Player position {x, y}
     */
    performSpecialAttack(playerPos) {
        // Play special animation
        this.playAnimation('special', false);
        
        // Create visual effect expanding circle
        const circle = this.scene.add.circle(
            this.graphics.x, 
            this.graphics.y,
            10,
            0xFF00FF,
            0.3
        );
        circle.setDepth(DEPTHS.EFFECTS_MID);
        
        // Expand circle outward
        this.scene.tweens.add({
            targets: circle,
            radius: 200,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                circle.destroy();
            }
        });
        
        // After animation delay, damage nearby players and spawn minions
        this.scene.time.delayedCall(1000, () => {
            if (!this.active || !this.graphics) return;
            
            // Check if player is within range
            if (this.scene.player) {
                const playerPos = this.scene.player.getPosition();
                const dx = playerPos.x - this.graphics.x;
                const dy = playerPos.y - this.graphics.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    // Damage player if within blast radius
                    this.scene.player.takeDamage(this.damage);
                    
                    // Create impact visual at player
                    const impact = this.scene.add.circle(
                        playerPos.x, playerPos.y,
                        20,
                        0xFF00FF,
                        0.5
                    );
                    impact.setDepth(DEPTHS.EFFECTS_HIGH);
                    
                    // Fade out impact
                    this.scene.tweens.add({
                        targets: impact,
                        radius: 40,
                        alpha: 0,
                        duration: 300,
                        ease: 'Cubic.easeOut',
                        onComplete: () => {
                            impact.destroy();
                        }
                    });
                }
            }
            
            // Spawn minions around the boss
            if (this.scene.enemyManager) {
                // Spawn 3 basic enemies around the boss
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2) / 3;
                    const spawnX = this.graphics.x + Math.cos(angle) * 50;
                    const spawnY = this.graphics.y + Math.sin(angle) * 50;
                    
                    this.scene.enemyManager.spawnEnemy(
                        'enemy1',
                        spawnX,
                        spawnY
                    );
                }
            }
            
            // Reset attack phase
            this.attackPhase = 'idle';
            this.playAnimation('idle', false);
        });
    }
    
    /**
     * Custom movement pattern for boss
     * @param {Object} playerPos - Player position {x, y}
     * @override
     */
    moveTowardsPlayer(playerPos) {
        // Skip if targeting is disabled
        if (this._targetingDisabled) return;
        
        // Skip movement during attacks
        if (this.attackPhase !== 'idle') return;
        
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Calculate target distance based on health percentage
            // Boss gets more aggressive as health decreases
            const healthPercent = this.health / this.baseHealth;
            const targetDistance = 100 + (healthPercent * 150); // 250 at full health, 100 at 0 health
            
            if (distance > targetDistance) {
                // Move towards player if too far
                this.graphics.x += dirX * this.speed;
                this.graphics.y += dirY * this.speed;
            } else if (distance < targetDistance - 50) {
                // Move away from player if too close
                this.graphics.x -= dirX * this.speed * 0.5;
                this.graphics.y -= dirY * this.speed * 0.5;
            } else {
                // Strafe sideways if at ideal distance
                const perpX = -dirY;
                const perpY = dirX;
                
                // Strafe direction alternates based on time
                const strafeDir = Math.floor(this.scene.time.now / 4000) % 2 === 0 ? 1 : -1;
                
                this.graphics.x += perpX * this.speed * strafeDir * 0.7;
                this.graphics.y += perpY * this.speed * strafeDir * 0.7;
            }
        }
    }
    
    /**
     * Take damage and update health bar
     * @param {number} amount - Amount of damage to take
     * @override
     */
    takeDamage(amount) {
        super.takeDamage(amount);
        
        // Update health bar
        this.updateHealthBar();
        
        // Check for phase transitions based on health percentage
        const healthPercent = this.health / this.baseHealth;
        const segment = Math.floor(healthPercent * this.healthSegments);
        
        // If we've dropped to a new segment, trigger special attack phase
        if (segment < this.currentSegment) {
            this.currentSegment = segment;
            this.specialCooldown = 0; // Reset special cooldown to allow immediate special attack
        }
    }
    
    /**
     * Handle boss death with special effects
     * @override
     */
    die() {
        // Play death animation
        this.playAnimation('death', false);
        
        // Create explosion effect
        const explosion = this.scene.add.circle(
            this.graphics.x, 
            this.graphics.y,
            30,
            0xFF00FF,
            0.7
        );
        explosion.setDepth(DEPTHS.EFFECTS_HIGH);
        
        // Expand and fade explosion
        this.scene.tweens.add({
            targets: explosion,
            radius: 150,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Remove health bar
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
            this.healthBarBg = null;
        }
        if (this.healthBarFg) {
            this.healthBarFg.destroy();
            this.healthBarFg = null;
        }
        
        // Delayed clean-up after death animation
        this.scene.time.delayedCall(1500, () => {
            super.die();
        });
    }
    
    /**
     * Clean up resources
     * @override
     */
    destroy() {
        // Clean up health bar
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
            this.healthBarBg = null;
        }
        if (this.healthBarFg) {
            this.healthBarFg.destroy();
            this.healthBarFg = null;
        }
        
        super.destroy();
    }
}