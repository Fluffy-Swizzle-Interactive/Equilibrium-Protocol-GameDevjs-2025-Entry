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
                // Create a sprite instead of a circle
                const bullet = scene.add.sprite(0, 0, 'bullet');
                scene.bullets.add(bullet);  // Add to existing bullets group
                bullet.setDepth(DEPTHS.BULLETS); // Set consistent depth using constants
                
                // Set origin to center for proper rotation
                bullet.setOrigin(0.5, 0.5);
                
                // Store original scale for reference
                bullet.originalScale = 1;

                // Add trail emitter for homing bullets (will be enabled only when homing is active)
                bullet.trailEmitter = null;

                return bullet;
            },
            // Reset function - configures bullet properties
            (bullet, x, y, dirX, dirY, speed, health, color, size) => {
                bullet.setPosition(x, y);
                
                // Set tint instead of fill style for sprites
                bullet.setTint(color);
                
                // Set scale based on size (caliber)
                const scale = size / 10; // Adjust based on your sprite size
                bullet.setScale(scale);
                bullet.originalScale = scale;
                
                // Store movement properties
                bullet.dirX = dirX;
                bullet.dirY = dirY;
                bullet.speed = speed;
                bullet.health = health;
                bullet.lifetime = 0;
                
                // Rotate sprite to match direction of travel
                bullet.rotation = Math.atan2(dirY, dirX);

                // Ensure depth is set on reset in case it was changed
                bullet.setDepth(DEPTHS.BULLETS);
                
                // Make the bullet visible
                bullet.setVisible(true);
                bullet.setActive(true);

                // Clean up any existing trail emitter
                if (bullet.trailEmitter) {
                    try {
                        // First stop the emitter
                        bullet.trailEmitter.stop();

                        // Then destroy it
                        if (typeof bullet.trailEmitter.destroy === 'function') {
                            bullet.trailEmitter.destroy();
                        } else if (typeof bullet.trailEmitter.remove === 'function') {
                            // Fallback for older Phaser versions
                            bullet.trailEmitter.remove();
                        }
                    } catch (err) {
                        console.warn('Error cleaning up trail emitter during reset:', err);
                    } finally {
                        // Always null out the reference
                        bullet.trailEmitter = null;
                    }
                }
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
     * @returns {Phaser.GameObjects.Sprite} The bullet object
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
     * @param {Phaser.GameObjects.Sprite} bullet - The bullet to release
     */
    releaseBullet(bullet) {
        try {
            // Clean up trail emitter if it exists
            if (bullet.trailEmitter) {
                try {
                    // First stop the emitter
                    bullet.trailEmitter.stop();

                    // Then destroy it
                    if (typeof bullet.trailEmitter.destroy === 'function') {
                        bullet.trailEmitter.destroy();
                    } else if (typeof bullet.trailEmitter.remove === 'function') {
                        // Fallback for older Phaser versions
                        bullet.trailEmitter.remove();
                    }
                } catch (err) {
                    console.warn('Error cleaning up trail emitter:', err);
                } finally {
                    // Always null out the reference
                    bullet.trailEmitter = null;
                }
            }

            // Release the bullet back to the pool
            this.objectManager.release('bullet', bullet);
        } catch (err) {
            console.warn('Error releasing bullet:', err);
        }
    }

    /**
     * Update all active bullets
     * @param {Function} updateFunc - Custom update function
     * @param {Function} cullFunc - Function that determines if a bullet should be released
     */
    updateBullets(updateFunc, cullFunc) {
        this.objectManager.updatePool('bullet', (bullet) => {
            // Apply homing behavior if enabled
            if (bullet.homing && bullet.homingForce > 0) {
                this.applyHomingBehavior(bullet);
            }

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
     * Apply homing behavior to a bullet
     * @param {Phaser.GameObjects.Sprite} bullet - The bullet to apply homing to
     * @private
     */
    applyHomingBehavior(bullet) {
        // Skip if no enemy manager
        if (!this.scene.enemyManager) return;

        // Find the closest enemy
        const closestEnemy = this.findClosestEnemy(bullet);

        // If no valid enemy found, continue with current direction
        if (!closestEnemy) return;

        // Calculate direction to enemy
        const dx = closestEnemy.graphics.x - bullet.x;
        const dy = closestEnemy.graphics.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Skip if too close (avoid division by zero)
        if (distance < 1) return;

        // Normalize direction vector
        const targetDirX = dx / distance;
        const targetDirY = dy / distance;

        // Gradually adjust bullet direction towards target
        // homingForce controls how quickly the bullet turns (0.05 = 5% adjustment per frame)
        bullet.dirX += (targetDirX - bullet.dirX) * bullet.homingForce;
        bullet.dirY += (targetDirY - bullet.dirY) * bullet.homingForce;

        // Renormalize direction vector to maintain consistent speed
        const newMagnitude = Math.sqrt(bullet.dirX * bullet.dirX + bullet.dirY * bullet.dirY);
        if (newMagnitude > 0) {
            bullet.dirX /= newMagnitude;
            bullet.dirY /= newMagnitude;
            
            // Update bullet rotation to match new direction
            bullet.rotation = Math.atan2(bullet.dirY, bullet.dirX);
        }

        // Create or update trail effect for homing bullets
        this.updateHomingTrail(bullet, closestEnemy);

        // Optional: Add visual effect for homing bullets
        if (this.scene.isDev && Math.random() < 0.1) {
            // Only show in dev mode and only 10% of frames to avoid console spam
            console.debug('Homing bullet tracking enemy:', closestEnemy.id);
        }
    }

    /**
     * Create or update the visual trail effect for homing bullets
     * @param {Phaser.GameObjects.Sprite} bullet - The bullet to add trail to
     * @param {BaseEnemy} targetEnemy - The enemy being targeted
     * @private
     */
    updateHomingTrail(bullet, targetEnemy) {
        try {
            // Create trail emitter if it doesn't exist
            if (!bullet.trailEmitter && this.scene.add && this.scene.add.particles) {
                try {
                    // Get bullet color for the trail
                    const trailColor = bullet.tint || 0xffff00;

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
                    bullet.trailEmitter.setDepth(DEPTHS.BULLETS - 1);
                } catch (err) {
                    console.warn('Error creating homing bullet trail:', err);
                    // Ensure we don't try to create it again
                    bullet.trailEmitter = null;
                }
            }

            // Update trail emitter position
            if (bullet.trailEmitter) {
                bullet.trailEmitter.setPosition(bullet.x, bullet.y);

                // Draw a line from bullet to target for visual feedback
                if (this.scene.isDev && targetEnemy && targetEnemy.graphics) {
                    // Only in dev mode to avoid performance impact
                    const graphics = this.scene.add.graphics();
                    graphics.lineStyle(1, 0xffff00, 0.3);
                    graphics.lineBetween(bullet.x, bullet.y, targetEnemy.graphics.x, targetEnemy.graphics.y);

                    // Auto-destroy after a short time
                    this.scene.time.delayedCall(50, () => {
                        graphics.destroy();
                    });
                }
            }
        } catch (err) {
            console.warn('Error updating homing bullet trail:', err);
        }
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
     * Find the closest enemy to a bullet
     * @param {Phaser.GameObjects.Sprite} bullet - The bullet to find the closest enemy for
     * @returns {BaseEnemy|null} The closest enemy or null if none found
     * @private
     */
    findClosestEnemy(bullet) {
        // Get active enemies from enemy manager
        const activeEnemies = this.scene.enemyManager.enemies;
        if (!activeEnemies || activeEnemies.length === 0) return null;

        let closestEnemy = null;
        let closestDistance = Number.MAX_VALUE;

        // Check each enemy
        for (const enemy of activeEnemies) {
            // Skip inactive enemies or enemies without graphics
            if (!enemy || !enemy.active || !enemy.graphics || !enemy.graphics.active) continue;

            // Skip enemies that have already been hit by this bullet (for pierce bullets)
            if (bullet.penetratedEnemies && bullet.penetratedEnemies.includes(enemy.id)) continue;

            // Calculate distance to enemy
            const dx = enemy.graphics.x - bullet.x;
            const dy = enemy.graphics.y - bullet.y;
            const distance = dx * dx + dy * dy; // Use squared distance for efficiency

            // Update closest enemy if this one is closer
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        return closestEnemy;
    }

    /**
     * Get statistics about bullet usage
     * @returns {object} Pool statistics
     */
    getStats() {
        return this.objectManager.getStats().bullet;
    }
}