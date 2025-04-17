import { BaseEnemy } from './BaseEnemy';

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
        this.size = 50;   // Much larger
        this.color = 0xff0000; // Red color
        this.health = 100000;
        this.baseHealth = 100000;
        this.damage = 5;
        this.scoreValue = 500;
        
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
    }
    
    /**
     * Override update to include boss-specific behavior
     * @override
     */
    update() {
        // Skip if not active
        if (!this.active || !this.graphics || !this.graphics.active) {
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
            this.graphics.setStrokeStyle(2, 0xffff00);
            
            // If it's a summon attack, immediately spawn minions
            if (pattern.name === 'summon') {
                this.summonMinions(playerPos);
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
                this.graphics.setStrokeStyle(0); // Remove visual indicator
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
        
        // Position on orbit
        this.graphics.x = playerPos.x + Math.cos(angle) * orbitRadius;
        this.graphics.y = playerPos.y + Math.sin(angle) * orbitRadius;
        
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
        
        // First 1000ms: pause and telegraph attack
        if (elapsedTime < 1000) {
            // Flash to indicate charging
            if (elapsedTime % 200 < 100) {
                this.graphics.setFillStyle(0xffff00); // Yellow when charging
            } else {
                this.graphics.setFillStyle(this.color);
            }
            return;
        }
        
        // Execute charge after telegraph
        if (!this.chargeDirection) {
            // Calculate direction to player at start of charge
            const dx = playerPos.x - this.graphics.x;
            const dy = playerPos.y - this.graphics.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.chargeDirection = {
                x: dx / distance,
                y: dy / distance
            };
            
            // Set to red during charge
            this.graphics.setFillStyle(0xff0000);
        }
        
        // Move in the charge direction
        const chargeSpeed = 3.0; // Much faster than normal movement
        this.graphics.x += this.chargeDirection.x * chargeSpeed;
        this.graphics.y += this.chargeDirection.y * chargeSpeed;
        
        // Reset charge direction when attack completes
        if (elapsedTime >= this.attackDuration - 100) {
            this.chargeDirection = null;
            this.graphics.setFillStyle(this.color);
        }
    }
    
    /**
     * Spawn minions around the boss
     * @param {Object} playerPos - The player's position {x, y}
     */
    summonMinions(playerPos) {
        // Request the EnemyManager to spawn minions around the boss
        if (this.scene.enemyManager) {
            // Boss location
            const x = this.graphics.x;
            const y = this.graphics.y;
            
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
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Create projectile if available in scene
        if (this.scene.enemyManager) {
            this.scene.enemyManager.spawnProjectile(
                this.graphics.x, 
                this.graphics.y,
                dirX, dirY, 2.0
            );
        }
    }
    
    /**
     * Override die method to include boss-specific death effects
     * @override
     */
    die() {
        // Create spectacular death effect
        if (this.scene.createBossDeathEffect && this.graphics) {
            this.scene.createBossDeathEffect(this.graphics.x, this.graphics.y);
        }
        
        // Call base die implementation
        super.die();
    }
}