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
        this.objectManager = scene.gameObjectManager || new GameObjectManager(scene);
        
        // Create the bullet pool
        this.objectManager.createPool('bullet', 
            // Create function - creates an empty bullet object
            () => {
                const bullet = scene.add.circle(0, 0, 5, 0xffff00);
                scene.bullets.add(bullet);  // Add to existing bullets group
                bullet.setDepth(DEPTHS.BULLETS); // Set consistent depth using constants
                return bullet;
            },
            // Reset function - configures bullet properties
            (bullet, x, y, dirX, dirY, speed, health, color, size) => {
                bullet.setPosition(x, y);
                bullet.setFillStyle(color);
                bullet.setRadius(size);
                bullet.dirX = dirX;
                bullet.dirY = dirY;
                bullet.speed = speed;
                bullet.health = health;
                bullet.lifetime = 0;
                
                // Ensure depth is set on reset in case it was changed
                bullet.setDepth(DEPTHS.BULLETS);
            }, 
            // Custom configuration
            options
        );
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
     * @returns {Phaser.GameObjects.Arc} The bullet object
     */
    createMinigunBullet(x, y, dirX, dirY, speed, health, color, size) {
        return this.objectManager.get('bullet', x, y, dirX, dirY, speed, health, color, size);
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
     * @returns {Array} Array of created bullets
     */
    createShotgunBullets(x, y, dirX, dirY, speed, health, color, size, count, spreadAngle) {
        const bullets = [];
        const baseAngle = Math.atan2(dirY, dirX);
        
        for (let i = 0; i < count; i++) {
            // Calculate spread angle
            const spreadRadians = (Math.random() * spreadAngle - spreadAngle/2) * (Math.PI / 180);
            const angle = baseAngle + spreadRadians;
            
            // Calculate new direction with spread
            const newDirX = Math.cos(angle);
            const newDirY = Math.sin(angle);
            
            // Get bullet from pool
            const bullet = this.objectManager.get('bullet', x, y, newDirX, newDirY, speed, health, color, size);
            
            if (bullet) {
                bullets.push(bullet);
            }
        }
        
        return bullets;
    }

    /**
     * Release a bullet back to the pool
     * @param {Phaser.GameObjects.Arc} bullet - The bullet to release
     */
    releaseBullet(bullet) {
        this.objectManager.release('bullet', bullet);
    }

    /**
     * Update all active bullets
     * @param {Function} updateFunc - Custom update function
     * @param {Function} cullFunc - Function that determines if a bullet should be released
     */
    updateBullets(updateFunc, cullFunc) {
        this.objectManager.updatePool('bullet', (bullet) => {
            // Apply standard movement
            bullet.x += bullet.dirX * bullet.speed;
            bullet.y += bullet.dirY * bullet.speed;
            
            // Track lifetime
            bullet.lifetime += this.scene.time.physicsFrameDelta;
            
            // Ensure bullet maintains proper depth - fixing z-index issues after map switching
            if (bullet.depth !== DEPTHS.BULLETS) {
                bullet.setDepth(DEPTHS.BULLETS);
            }
            
            // Apply custom update logic if provided
            if (updateFunc) {
                updateFunc(bullet);
            }
            
            // Check if bullet should be culled
            if (cullFunc && cullFunc(bullet)) {
                this.releaseBullet(bullet);
            }
        });
    }

    /**
     * Get statistics about bullet usage
     * @returns {object} Pool statistics
     */
    getStats() {
        return this.objectManager.getStats().bullet;
    }
}