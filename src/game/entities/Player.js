export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Initialize core properties
        this.initPhysicsProperties();
        this.initWeaponProperties(scene.gameMode || 'minigun');
        this.initGraphics(x, y);
        
        // Timing properties
        this.lastFireTime = 0;
    }
    
    /**
     * Initialize physics-related properties
     */
    initPhysicsProperties() {
        this.speed = 3;
        this.velX = 0;
        this.velY = 0;
        this.friction = 0.9;
        this.acceleration = 0.3;
        this.radius = 20;
        
        // Aiming properties
        this.maxMouseDistance = 300;
        this.targetX = null;
        this.targetY = null;
    }
    
    /**
     * Initialize weapon-specific properties based on game mode
     * @param {string} gameMode - The weapon mode ('minigun' or 'shotgun')
     */
    initWeaponProperties(gameMode) {
        this.gameMode = gameMode;
        
        if (this.gameMode === 'minigun') {
            this.fireRate = 10;
            this.caliber = 5;
            this.bulletSpeed = 10;
            this.bulletDamage = 30;
            this.bulletColor = 0xffff00; // Yellow
        } else if (this.gameMode === 'shotgun') {
            this.fireRate = 40;
            this.caliber = 3;
            this.bulletSpeed = 12;
            this.bulletDamage = 20;
            this.bulletColor = 0xff6600; // Orange
            this.spreadAngle = 30;
            this.bulletCount = 10;
        }
    }
    
    /**
     * Initialize visual elements for the player
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    initGraphics(x, y) {
        // Create the player circle
        this.graphics = this.scene.add.circle(x, y, this.radius, 0xff0000);
        
        // Create line and cursor for aiming
        this.line = this.scene.add.graphics();
        this.cursorCircle = this.scene.add.graphics();
        
        // Make these graphics follow the camera
        this.line.setScrollFactor(1);
        this.cursorCircle.setScrollFactor(1);
    }
    
    update() {
        this.updateMovement();
        this.updateAiming();
    }
    
    updateMovement() {
        // Get keyboard references from scene
        const keys = this.scene.wasd;
        
        // Apply acceleration based on keys
        if (keys.up.isDown) {
            this.velY -= this.acceleration;
        }
        if (keys.down.isDown) {
            this.velY += this.acceleration;
        }
        if (keys.left.isDown) {
            this.velX -= this.acceleration;
        }
        if (keys.right.isDown) {
            this.velX += this.acceleration;
        }
        
        // Apply maximum velocity
        this.velX = Phaser.Math.Clamp(this.velX, -this.speed, this.speed);
        this.velY = Phaser.Math.Clamp(this.velY, -this.speed, this.speed);
        
        // Apply friction
        this.velX *= this.friction;
        this.velY *= this.friction;
        
        // Stop completely if velocity is very small
        if (Math.abs(this.velX) < 0.01) this.velX = 0;
        if (Math.abs(this.velY) < 0.01) this.velY = 0;
        
        // Calculate new position
        let newX = this.graphics.x + this.velX;
        let newY = this.graphics.y + this.velY;
        
        // Constrain to world bounds
        const worldBounds = this.scene.physics.world.bounds;
        newX = Phaser.Math.Clamp(newX, worldBounds.x + this.radius, worldBounds.right - this.radius);
        newY = Phaser.Math.Clamp(newY, worldBounds.y + this.radius, worldBounds.bottom - this.radius);
        
        // Apply new position
        this.graphics.x = newX;
        this.graphics.y = newY;
    }
    
    updateAiming() {
        const mouseX = this.scene.mouseX;
        const mouseY = this.scene.mouseY;
        
        // Skip if no mouse position is available
        if (mouseX === undefined || mouseY === undefined) return;
        
        // Calculate direction from player to mouse
        const dx = mouseX - this.graphics.x;
        const dy = mouseY - this.graphics.y;
        const angle = Math.atan2(dy, dx);
        
        // Calculate distance between player and mouse
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limit mouse position to maxMouseDistance
        let targetX = mouseX;
        let targetY = mouseY;
        
        if (distance > this.maxMouseDistance) {
            // If mouse is too far, use the angle to place cursor at max distance
            targetX = this.graphics.x + Math.cos(angle) * this.maxMouseDistance;
            targetY = this.graphics.y + Math.sin(angle) * this.maxMouseDistance;
        }
        
        // Store current target for shooting
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Calculate point on the edge of the circle
        const startX = this.graphics.x + Math.cos(angle) * this.radius;
        const startY = this.graphics.y + Math.sin(angle) * this.radius;
        
        // Clear previous graphics
        this.line.clear();
        this.cursorCircle.clear();
        
        // Draw the line
        this.line.lineStyle(2, 0xFFFFFF);
        this.line.beginPath();
        this.line.moveTo(startX, startY);
        this.line.lineTo(targetX, targetY);
        this.line.strokePath();
        
        // Draw hollow circle at limited mouse position
        this.cursorCircle.lineStyle(2, 0xFFFFFF);
        this.cursorCircle.strokeCircle(targetX, targetY, 10);
    }
    
    createBullet(spawnX, spawnY, dirX, dirY) {
        // Create a single bullet based on current weapon type
        if (this.gameMode === 'minigun') {
            return this.createMinigunBullet(spawnX, spawnY, dirX, dirY);
        } else if (this.gameMode === 'shotgun') {
            return this.createShotgunBullets(spawnX, spawnY, dirX, dirY);
        }
    }

    createMinigunBullet(spawnX, spawnY, dirX, dirY) {
        const bullet = this.scene.add.circle(spawnX, spawnY, this.caliber, this.bulletColor);
        
        // Add bullet properties
        bullet.dirX = dirX;
        bullet.dirY = dirY;
        bullet.speed = this.bulletSpeed;
        bullet.health = this.bulletDamage;
        
        // Add bullet to group
        this.scene.bullets.add(bullet);
        return bullet;
    }

    createShotgunBullets(spawnX, spawnY, dirX, dirY) {
        const bullets = [];
        const baseAngle = Math.atan2(dirY, dirX);
        
        for (let i = 0; i < this.bulletCount; i++) {
            // Calculate spread angle
            const spreadRadians = (Math.random() * this.spreadAngle - this.spreadAngle/2) * (Math.PI / 180);
            const angle = baseAngle + spreadRadians;
            
            // Calculate new direction with spread
            const newDirX = Math.cos(angle);
            const newDirY = Math.sin(angle);
            
            // Create bullet with spread
            const bullet = this.scene.add.circle(spawnX, spawnY, this.caliber, this.bulletColor);
            
            // Add bullet properties
            bullet.dirX = newDirX;
            bullet.dirY = newDirY;
            bullet.speed = this.bulletSpeed;
            bullet.health = this.bulletDamage;
            
            // Add bullet to group
            this.scene.bullets.add(bullet);
            bullets.push(bullet);
        }
        
        return bullets;
    }

    /**
     * Shoot a bullet or multiple bullets based on weapon type
     * @returns {boolean} Whether a shot was successfully fired
     */
    shoot() {
        const currentTime = this.scene.time.now;
        
        // Check if enough time has passed since last shot (fire rate)
        if (currentTime - this.lastFireTime < this.fireRate) {
            return false; // Can't shoot yet
        }
        
        // Update last fire time
        this.lastFireTime = currentTime;
        
        // Make sure we have a target
        if (!this.targetX || !this.targetY) return false;
        
        // Calculate direction vector to target
        const directionVector = this.calculateDirectionVector();
        
        // Calculate spawn position (edge of player circle)
        const spawnX = this.graphics.x + directionVector.x * this.radius;
        const spawnY = this.graphics.y + directionVector.y * this.radius;
        
        // Create bullets using the dedicated methods
        this.createBullet(spawnX, spawnY, directionVector.x, directionVector.y);
        
        return true; // Successfully shot
    }
    
    /**
     * Calculate normalized direction vector from player to target
     * @returns {Object} Object with x and y properties representing direction
     */
    calculateDirectionVector() {
        // Calculate direction from player to target
        const dx = this.targetX - this.graphics.x;
        const dy = this.targetY - this.graphics.y;
        
        // Normalize direction vector
        const distance = Math.sqrt(dx * dx + dy * dy);
        return {
            x: dx / distance,
            y: dy / distance
        };
    }
    
    getPosition() {
        return {
            x: this.graphics.x,
            y: this.graphics.y
        };
    }
}
