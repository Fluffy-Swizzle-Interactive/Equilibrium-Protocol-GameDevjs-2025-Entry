export class Enemy {
    constructor(scene, x, y, isBoss = false) {
        this.scene = scene;
        this.isBoss = isBoss;
        
        // Initialize enemy properties based on type
        this.initProperties();
        
        // Create visual representation
        this.createVisuals(x, y);
        
        // Add to scene's enemy group
        scene.enemies.add(this.graphics);
        
        // Connect enemy object to its graphics object
        this.graphics.parentEnemy = this;
        
        // Create health bar for bosses
        if (isBoss) {
            this.createHealthBar();
        }
    }
    
    /**
     * Initialize enemy properties based on type (boss or regular)
     */
    initProperties() {
        if (this.isBoss) {
            // Boss properties
            this.speed = 0.3; // Slower but more powerful
            this.size = 50; // Larger size
            this.color = 0xff0000; // Red color
            this.health = 10000; // Boss health
            this.baseHealth = 10000; // For health bar calculations
        } else {
            // Regular enemy properties
            this.speed = 0.5; // Movement speed
            this.size = 15; // Size of the enemy square
            this.color = 0x00ff00; // Green color
            this.health = 10; // Standard health
            this.baseHealth = 10; // For health bar calculations
        }
    }
    
    /**
     * Create the visual representation of the enemy
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    createVisuals(x, y) {
        // Create the visual representation (square)
        this.graphics = this.scene.add.rectangle(x, y, this.size, this.size, this.color);
    }
    
    /**
     * Manage the health bar for boss enemies
     * @param {boolean} create - Whether to create a new health bar or update an existing one
     */
    manageHealthBar(create = false) {
        if (!this.isBoss) return;
        
        if (create) {
            const barWidth = this.size * 2;
            const barHeight = 5;
            const barY = this.graphics.y - this.size - 10;
            
            // Background bar (black)
            this.healthBarBg = this.scene.add.rectangle(
                this.graphics.x, 
                barY, 
                barWidth, 
                barHeight, 
                0x000000
            ).setDepth(100);
            
            // Health bar (red)
            this.healthBar = this.scene.add.rectangle(
                this.graphics.x - barWidth/2, 
                barY, 
                barWidth, 
                barHeight, 
                0xff0000
            ).setOrigin(0, 0.5).setDepth(101);
        } else {
            // Update health bar position
            this.healthBarBg.x = this.graphics.x;
            this.healthBarBg.y = this.graphics.y - this.size - 10;
            
            // Update health bar width based on remaining health percentage
            const healthPercent = this.health / this.baseHealth;
            const barWidth = this.size * 2;
            this.healthBar.width = barWidth * healthPercent;
            this.healthBar.x = this.graphics.x - barWidth/2;
            this.healthBar.y = this.graphics.y - this.size - 10;
        }
    }
    
    createHealthBar() {
        this.manageHealthBar(true);
    }
    
    updateHealthBar() {
        this.manageHealthBar(false);
    }
    
    /**
     * Update enemy position and behavior each frame
     */
    update() {
        const playerPos = this.scene.player.getPosition();
        
        // Move towards player
        this.moveTowardsPlayer(playerPos);
        
        // Check collision with player
        this.checkPlayerCollision(playerPos);
    }
    
    /**
     * Move the enemy towards the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    moveTowardsPlayer(playerPos) {
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Only move if not at the player's position
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move toward player
            this.graphics.x += dirX * this.speed;
            this.graphics.y += dirY * this.speed;
            
            // Update health bar for boss
            if (this.isBoss) {
                this.updateHealthBar();
            }
        }
    }
    
    /**
     * Check if the enemy is colliding with the player
     * @param {Object} playerPos - The player's position {x, y}
     */
    checkPlayerCollision(playerPos) {
        const playerDistance = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            playerPos.x, playerPos.y
        );
        
        // If enemy touches player (sum of radii), player dies
        const playerRadius = this.scene.player.radius;
        if (playerDistance < (this.size/2 + playerRadius)) {
            this.scene.playerDeath();
        }
    }
    
    /**
     * Apply damage to the enemy
     * @param {number} damage - Amount of damage to apply
     */
    takeDamage(damage) {
        this.health -= damage;
        
        // Flash the enemy to white to indicate hit
        this.graphics.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (this.graphics) {
                this.graphics.setFillStyle(this.color);
            }
        });
        
        // If health depleted, die
        if (this.health <= 0) {
            this.die();
        } else if (this.isBoss) {
            // Update health bar if this is a boss
            this.updateHealthBar();
        }
    }
    
    /**
     * Handle enemy death
     */
    die() {
        // Increment the game's kill counter
        this.scene.killCount++;
        
        // Update the kill counter UI
        this.scene.killText.setText(`Kills: ${this.scene.killCount}`);
        
        // Check if boss defeated
        if (this.isBoss) {
            // Destroy health bar
            if (this.healthBar) this.healthBar.destroy();
            if (this.healthBarBg) this.healthBarBg.destroy();
            
            // Maybe add special effects or rewards for boss defeat
            this.scene.createBossDeathEffect(this.graphics.x, this.graphics.y);
        }
        
        // Check if we should spawn a boss based on kill count
        if (this.scene.killCount % 1000 === 0 && !this.isBoss) {
            this.scene.spawnBoss();
        }
        
        // Remove from scene
        this.graphics.destroy();
    }
}
