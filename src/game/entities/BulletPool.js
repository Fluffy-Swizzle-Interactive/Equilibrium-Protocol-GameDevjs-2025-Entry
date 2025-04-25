import { GameObjectManager } from '../managers/GameObjectManager';
import { DEPTHS } from '../constants';

/**
 * Specialized class for managing bullet pools
 * Extends the core GameObjectManager functionality with bullet-specific methods
 */
export class BulletPool {
    /**
     * Create a new bullet pool
     * @param {Phaser.Scene} scene - The scene this pool belongs to
     * @param {Object} options - Configuration options for the bullet pool
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            initialSize: options.initialSize || 50,
            maxSize: options.maxSize || 200,
            growSize: options.growSize || 10
        };
        
        this.activeCount = 0;
        this.totalCreated = 0;
        this.bulletList = [];
        
        // Configure bullet sprites
        this.bulletSprites = {
            'bullet_1': { scale: 0.8, radius: 4 },
            'bullet_2': { scale: 0.8, radius: 5 },
            'bullet_3': { scale: 0.7, radius: 5 },
            'bullet_4': { scale: 0.7, radius: 6 },
            'bullet_5': { scale: 0.8, radius: 5 },
            'bullet_6': { scale: 0.9, radius: 6 },
            'bullet_7': { scale: 0.7, radius: 5 },
            'bullet_8': { scale: 0.8, radius: 7 },
            'bullet_9': { scale: 0.8, radius: 6 },
            'bullet_10': { scale: 0.9, radius: 8 }
        };
        
        // Map weapon types to bullet sprites
        this.weaponBulletMap = {
            'minigun': ['bullet_1', 'bullet_4', 'bullet_7'],
            'shotgun': ['bullet_2', 'bullet_5', 'bullet_8'],
            'plasma': ['bullet_3', 'bullet_6', 'bullet_9', 'bullet_10']
        };
        
        // Initialize bullet pool
        this.initPool();
        
        console.debug(`BulletPool initialized with ${this.options.initialSize} bullets`);
    }
    
    /**
     * Initialize the bullet pool
     */
    initPool() {
        // Create function - creates a bullet object (sprite or circle fallback)
        const createBullet = () => {
            let bullet;
            
            // Check if any bullet textures are available in the scene
            const bulletKeys = Object.keys(this.bulletSprites);
            let spritesAvailable = false;
            let availableBulletKey = null;
            
            // Find the first available bullet texture
            for (const key of bulletKeys) {
                if (this.scene.textures.exists(key)) {
                    spritesAvailable = true;
                    availableBulletKey = key;
                    break;
                }
            }
            
            if (spritesAvailable && availableBulletKey) {
                // Create sprite-based bullet
                const spriteConfig = this.bulletSprites[availableBulletKey];
                bullet = this.scene.add.sprite(0, 0, availableBulletKey);
                bullet.setScale(spriteConfig.scale || 0.8);
                bullet.isSprite = true;
                bullet.radius = spriteConfig.radius || 5;
                
                // Add physics body for possible map collisions
                if (this.scene.physics && this.scene.physics.add) {
                    this.scene.physics.add.existing(bullet);
                    bullet.body.setCircle(bullet.radius);
                }
            } else {
                // Fallback to circle if textures aren't available
                console.warn('Bullet textures not found, using circle fallback');
                bullet = this.scene.add.circle(0, 0, 5, 0xffff00);
                bullet.isSprite = false;
                bullet.radius = 5;
            }
            
            // Add to scene's bullets group
            if (this.scene.bullets) {
                this.scene.bullets.add(bullet);
            }
            
            // Set initial state
            bullet.setActive(false);
            bullet.setVisible(false);
            
            // Track in our list
            this.bulletList.push(bullet);
            this.totalCreated++;
            
            return bullet;
        };
        
        // Create initial bullets
        for (let i = 0; i < this.options.initialSize; i++) {
            createBullet();
        }
    }
    
    /**
     * Get an inactive bullet from the pool or create a new one if needed
     * @param {number} x - X position to place the bullet
     * @param {number} y - Y position to place the bullet
     * @param {Object} options - Bullet configuration options
     * @returns {Object} The bullet object
     */
    getBullet(x, y, options = {}) {
        // Find an inactive bullet
        let bullet = this.bulletList.find(b => !b.active);
        
        // If no inactive bullets and we haven't hit max size, create a new one
        if (!bullet && this.bulletList.length < this.options.maxSize) {
            // Grow the pool
            for (let i = 0; i < this.options.growSize; i++) {
                const newBullet = this.scene.add.circle(0, 0, 5, 0xffff00);
                newBullet.setActive(false);
                newBullet.setVisible(false);
                newBullet.isSprite = false;
                newBullet.radius = 5;
                
                if (this.scene.bullets) {
                    this.scene.bullets.add(newBullet);
                }
                
                this.bulletList.push(newBullet);
                this.totalCreated++;
            }
            
            // Now use one of these new bullets
            bullet = this.bulletList.find(b => !b.active);
            
            console.debug(`Grew bullet pool by ${this.options.growSize}. Total: ${this.bulletList.length}`);
        }
        
        // Return null if still no bullet available
        if (!bullet) {
            console.warn(`Bullet pool maxed out at ${this.options.maxSize}`);
            return null;
        }
        
        // Configure bullet
        this.resetBullet(bullet, x, y, options);
        
        return bullet;
    }
    
    /**
     * Reset a bullet with new properties
     * @param {Object} bullet - The bullet to reset
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Bullet configuration
     */
    resetBullet(bullet, x, y, options = {}) {
        const {
            velocityX = 0,
            velocityY = 0,
            speed = 0,
            angle = 0,
            damage = 10,
            size = 5,
            color = 0xffff00,
            lifespan = 2000,
            target = null,
            bulletType = 'bullet_1'
        } = options;
        
        // Reset basic properties
        bullet.setPosition(x, y);
        bullet.setActive(true);
        bullet.setVisible(true);
        
        // Set velocity based on angle and speed if provided
        if (speed > 0) {
            bullet.velocityX = Math.cos(angle) * speed;
            bullet.velocityY = Math.sin(angle) * speed;
        } else {
            bullet.velocityX = velocityX;
            bullet.velocityY = velocityY;
        }
        
        // Set data properties
        bullet.damage = damage;
        bullet.lifetime = 0;
        bullet.maxLifetime = lifespan;
        bullet.target = target;
        
        // Store original values for later reference
        bullet.startX = x;
        bullet.startY = y;
        
        // Handle sprite or circle bullet appropriately
        if (bullet.isSprite) {
            // Try to set the texture to the specified bulletType
            if (this.scene.textures.exists(bulletType)) {
                bullet.setTexture(bulletType);
            } else {
                // Use weapon mapping or default to first available texture
                const mappedType = this.weaponBulletMap[bulletType] || bulletType;
                if (this.scene.textures.exists(mappedType)) {
                    bullet.setTexture(mappedType);
                }
            }
            
            // Get sprite config for the current texture
            const spriteConfig = this.bulletSprites[bullet.texture.key] || { scale: 0.8, radius: 5 };
            
            // Apply configuration
            bullet.setScale(options.scale || spriteConfig.scale);
            bullet.radius = options.size || spriteConfig.radius;
            
            // Update physics body radius if it exists
            if (bullet.body) {
                bullet.body.setCircle(bullet.radius);
            }
            
            // Apply color tint if provided
            if (color) {
                bullet.setTint(color);
            } else {
                bullet.clearTint();
            }
            
            // Set rotation to match angle
            bullet.setRotation(angle);
        } else {
            // For circle bullets
            bullet.setRadius(size);
            bullet.setFillStyle(color);
            bullet.radius = size;
        }
        
        // Add pierce and penetration tracking if enabled
        if (options.pierce && options.pierce > 0) {
            bullet.pierce = options.pierce;
            bullet.penetratedEnemies = [];
        } else {
            // Default values for health/pierce
            bullet.health = options.health || 1;
            bullet.pierce = options.pierce || 1;
            bullet.penetratedEnemies = [];
        }
        
        // Add critical hit properties if enabled
        if (options.canCrit) {
            bullet.canCrit = true;
            bullet.critChance = options.critChance || 0.1;  // 10% default
            bullet.critMultiplier = options.critMultiplier || 2.0;  // 2x default
        }
        
        // Clean any existing trails
        if (bullet.trailEmitter) {
            bullet.trailEmitter.stop();
            bullet.trailEmitter.destroy();
            bullet.trailEmitter = null;
        }
        
        // Setup trails if enabled
        if (options.trail) {
            this.setupBulletTrail(bullet, options.trail);
        }
        
        // Increment active count
        this.activeCount++;
    }
    
    /**
     * Create a minigun bullet
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     * @param {number} dirX - Direction X component
     * @param {number} dirY - Direction Y component
     * @param {number} speed - Bullet speed
     * @param {number} health - Bullet health
     * @param {number} color - Bullet color
     * @param {number} size - Bullet radius
     * @param {string} bulletType - The bullet type/texture to use
     * @param {string} weaponType - The weapon type (minigun, shotgun, etc)
     * @returns {Phaser.GameObjects.Arc|Phaser.GameObjects.Sprite} The bullet object
     */
    createMinigunBullet(x, y, dirX, dirY, speed, health, color, size, bulletType = 'bullet_1', weaponType = 'minigun') {
        // Calculate angle from direction components
        const angle = Math.atan2(dirY, dirX);
        
        // Select an appropriate bullet texture for the weapon type
        let actualBulletType = bulletType;
        if (weaponType && this.weaponBulletMap[weaponType]) {
            const possibleBullets = this.weaponBulletMap[weaponType];
            actualBulletType = possibleBullets[Math.floor(Math.random() * possibleBullets.length)];
        }
        
        // Get a bullet from the pool with proper configuration
        const bullet = this.getBullet(x, y, {
            angle,
            speed,
            damage: this.scene.player ? this.scene.player.bulletDamage || 10 : 10,
            size,
            color,
            health,
            pierce: health, // Use health as pierce value for compatibility
            bulletType: actualBulletType,
            weaponType
        });
        
        // Store dirX and dirY for compatibility with existing code
        if (bullet) {
            bullet.dirX = dirX;
            bullet.dirY = dirY;
            bullet.speed = speed;
        }
        
        return bullet;
    }
    
    /**
     * Create multiple shotgun bullets with spread
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     * @param {number} dirX - Base direction X component
     * @param {number} dirY - Base direction Y component
     * @param {number} speed - Bullet speed
     * @param {number} health - Bullet health
     * @param {number} color - Bullet color
     * @param {number} size - Bullet radius
     * @param {number} count - Number of bullets to create
     * @param {number} spreadAngle - Spread angle in degrees
     * @param {string} bulletType - Optional bullet type/texture
     * @param {string} weaponType - Optional weapon type
     * @returns {Array} Array of created bullets
     */
    createShotgunBullets(x, y, dirX, dirY, speed, health, color, size, count, spreadAngle, bulletType = 'bullet_2', weaponType = 'shotgun') {
        const bullets = [];
        const baseAngle = Math.atan2(dirY, dirX);
        
        // Select shotgun bullet textures
        let possibleBullets = ['bullet_2'];
        if (weaponType && this.weaponBulletMap[weaponType]) {
            possibleBullets = this.weaponBulletMap[weaponType];
        }

        for (let i = 0; i < count; i++) {
            // Calculate spread angle
            const spreadRadians = (Math.random() * spreadAngle - spreadAngle/2) * (Math.PI / 180);
            const angle = baseAngle + spreadRadians;

            // Calculate new direction with spread
            const newDirX = Math.cos(angle);
            const newDirY = Math.sin(angle);
            
            // Select a random bullet type from the appropriate list
            const actualBulletType = possibleBullets[Math.floor(Math.random() * possibleBullets.length)];

            // Get bullet from pool with the appropriate configuration
            const bullet = this.getBullet(x, y, {
                angle,
                speed,
                damage: this.scene.player ? this.scene.player.bulletDamage || 8 : 8,
                size,
                color,
                health,
                pierce: health,
                bulletType: actualBulletType,
                weaponType
            });

            if (bullet) {
                // Add compatibility properties
                bullet.dirX = newDirX;
                bullet.dirY = newDirY;
                bullet.speed = speed;
                
                bullets.push(bullet);
            }
        }

        return bullets;
    }
    
    /**
     * Set up a particle trail for a bullet
     * @param {Object} bullet - The bullet to add a trail to
     * @param {Object} trailOptions - Trail configuration options
     */
    setupBulletTrail(bullet, trailOptions = {}) {
        if (!this.scene.add || !this.scene.add.particles) return;
        
        // Create a particle texture if it doesn't exist
        if (!this.scene.textures.exists('particle_texture')) {
            this.createFallbackParticleTexture();
        }
        
        // Create trail emitter
        const trailColor = trailOptions.color || bullet.fillColor || 0xffff00;
        
        bullet.trailEmitter = this.scene.add.particles(bullet.x, bullet.y, 'particle_texture', {
            speed: { min: 0, max: 0 },
            scale: { start: trailOptions.scale || 0.2, end: 0 },
            alpha: { start: trailOptions.alpha || 0.6, end: 0 },
            lifespan: trailOptions.lifespan || 200,
            blendMode: trailOptions.blendMode || 'ADD',
            frequency: trailOptions.frequency || 15,
            tint: trailColor,
            emitting: true
        });
        
        // Set depth to be just below bullets
        bullet.trailEmitter.setDepth((bullet.depth || 0) - 1);
    }
    
    /**
     * Update all active bullets
     * @param {Function} updateFunc - Optional custom update function
     * @param {Function} cullFunc - Optional custom function to determine if a bullet should be released
     */
    updateBullets(updateFunc = null, cullFunc = null) {
        this.bulletList.forEach(bullet => {
            if (!bullet.active) return;
            
            // Use existing dirX/dirY properties if available (for compatibility with old code)
            if (bullet.dirX !== undefined && bullet.dirY !== undefined && bullet.speed !== undefined) {
                bullet.x += bullet.dirX * bullet.speed;
                bullet.y += bullet.dirY * bullet.speed;
            }
            // Otherwise use velocity
            else if (bullet.velocityX !== undefined && bullet.velocityY !== undefined) {
                bullet.x += bullet.velocityX;
                bullet.y += bullet.velocityY;
            }
            
            // Update bullet lifetime
            bullet.lifetime += this.scene.game.loop.delta;
            
            // Update trail emitter position if it exists
            if (bullet.trailEmitter) {
                bullet.trailEmitter.setPosition(bullet.x, bullet.y);
            }
            
            // Update homing behavior if targeting an enemy
            if (bullet.target && bullet.target.active) {
                this.updateHomingBullet(bullet);
            }
            
            // Custom update function if provided
            if (updateFunc && typeof updateFunc === 'function') {
                updateFunc(bullet);
            }
            
            // Check if bullet should be released back to the pool
            let shouldCull = bullet.lifetime >= (bullet.maxLifetime || 3000);
            
            // Use custom cull function if provided
            if (cullFunc && typeof cullFunc === 'function') {
                shouldCull = shouldCull || cullFunc(bullet);
            }
            
            if (shouldCull) {
                this.releaseBullet(bullet);
            }
        });
    }
    
    /**
     * Update homing bullet behavior
     * @param {Object} bullet - The bullet to update
     */
    updateHomingBullet(bullet) {
        const target = bullet.target;
        if (!target || !target.active || !target.graphics) return;
        
        // Calculate direction to target
        const dx = target.graphics.x - bullet.x;
        const dy = target.graphics.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Calculate homing strength based on distance
            const homingStrength = bullet.homingStrength || 0.03;
            
            // Gradually adjust velocity toward target
            bullet.velocityX += dx / distance * homingStrength;
            bullet.velocityY += dy / distance * homingStrength;
            
            // Normalize velocity to maintain speed
            const speed = Math.sqrt(bullet.velocityX * bullet.velocityX + bullet.velocityY * bullet.velocityY);
            if (speed > 0) {
                const normalizedSpeed = bullet.speed || Math.sqrt(bullet.velocityX * bullet.velocityX + bullet.velocityY * bullet.velocityY);
                bullet.velocityX = (bullet.velocityX / speed) * normalizedSpeed;
                bullet.velocityY = (bullet.velocityY / speed) * normalizedSpeed;
            }
            
            // Update visual trail
            this.updateHomingTrail(bullet, target);
            
            // Update sprite rotation if it's a sprite bullet
            if (bullet.isSprite) {
                bullet.setRotation(Math.atan2(bullet.velocityY, bullet.velocityX));
            }
        }
    }
    
    /**
     * Create or update the visual trail effect for homing bullets
     * @param {Object} bullet - The bullet to add trail to
     * @param {Object} targetEnemy - The enemy being targeted
     * @private
     */
    updateHomingTrail(bullet, targetEnemy) {
        try {
            // Create trail emitter if it doesn't exist
            if (!bullet.trailEmitter && this.scene.add && this.scene.add.particles) {
                try {
                    // Get bullet color for the trail
                    const trailColor = bullet.fillColor || 0xffff00;

                    // Check if particle texture exists
                    if (!this.scene.textures.exists('particle_texture')) {
                        // Create a fallback texture if needed
                        this.createFallbackParticleTexture();
                    }

                    // Create particle emitter for the trail
                    bullet.trailEmitter = this.scene.add.particles(bullet.x, bullet.y, 'particle_texture', {
                        speed: { min: 0, max: 0 },
                        scale: { start: 0.2, end: 0 },
                        alpha: { start: 0.6, end: 0 },
                        lifespan: 200,
                        blendMode: 'ADD',
                        frequency: 15, // Emit a particle every 15ms
                        tint: trailColor,
                        emitting: true
                    });
                    
                    // Set depth to be just below bullets
                    bullet.trailEmitter.setDepth((bullet.depth || 0) - 1);
                } catch (err) {
                    console.warn('Error creating homing bullet trail:', err);
                    // Ensure we don't try to create it again
                    bullet.trailEmitter = null;
                }
            }

            // Update trail emitter position
            if (bullet.trailEmitter) {
                bullet.trailEmitter.setPosition(bullet.x, bullet.y);
            }
        } catch (err) {
            console.warn('Error updating homing bullet trail:', err);
        }
    }
    
    /**
     * Release a bullet back to the pool
     * @param {Object} bullet - The bullet to release
     */
    releaseBullet(bullet) {
        if (!bullet || !bullet.active) return;
        
        // Clean up trail emitter if it exists
        if (bullet.trailEmitter) {
            bullet.trailEmitter.stop();
            bullet.trailEmitter.destroy();
            bullet.trailEmitter = null;
        }
        
        // Reset bullet
        bullet.setActive(false);
        bullet.setVisible(false);
        
        // Clear any references
        bullet.target = null;
        
        // Clear penetrated enemies list
        if (bullet.penetratedEnemies) {
            bullet.penetratedEnemies = [];
        }
        
        // Decrement active count
        this.activeCount--;
    }
    
    /**
     * Create a fallback particle texture if the main one doesn't exist
     * @private
     */
    createFallbackParticleTexture() {
        try {
            // Create a simple circle texture for particles
            const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffffff);
            graphics.fillCircle(8, 8, 8);
            graphics.generateTexture('particle_texture', 16, 16);
            graphics.destroy();

            console.debug('Created fallback particle texture');
        } catch (err) {
            console.warn('Failed to create fallback particle texture:', err);
        }
    }
    
    /**
     * Get bullet pool stats
     * @returns {Object} Statistics about the pool
     */
    getStats() {
        return {
            active: this.activeCount,
            total: this.bulletList.length,
            created: this.totalCreated
        };
    }
    
    /**
     * Destroy all bullets and clean up resources
     */
    destroy() {
        // Clean up all bullets
        this.bulletList.forEach(bullet => {
            if (bullet.trailEmitter) {
                bullet.trailEmitter.destroy();
            }
            bullet.destroy();
        });
        
        // Clear the list
        this.bulletList = [];
        this.activeCount = 0;
    }
}