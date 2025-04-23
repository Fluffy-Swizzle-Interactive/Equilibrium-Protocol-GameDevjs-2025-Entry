import { DEPTHS, SETTINGS } from '../constants';
import { EventBus } from '../EventBus';
import { PlayerDrone } from '../entities/PlayerDrone';

/**
 * WeaponManager class
 * Manages weapon systems, firing logic, and drones for the player
 */
export class WeaponManager {
    /**
     * Create a new weapon manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {Player} player - Reference to the player
     * @param {Object} options - Configuration options
     */
    constructor(scene, player, options = {}) {
        this.scene = scene;
        this.player = player;
        this.SETTINGS = SETTINGS;

        // Initialize weapon properties
        this.weaponType = options.weaponType || 'minigun';
        this.fireRate = 0;
        this.caliber = 0;
        this.bulletSpeed = 0;
        this.bulletDamage = 0;
        this.bulletColor = 0;
        this.bulletHealth = 0;
        this.bulletPierce = 1; // Default pierce value
        this.bulletCount = 1;
        this.spreadAngle = 0;
        this.bulletRange = options.bulletRange || 600;

        // Critical hit properties
        this.criticalHitChance = options.criticalHitChance || 5; // 5% default
        this.criticalDamageMultiplier = options.criticalDamageMultiplier || 1.5;

        // AOE properties
        this.bulletAoeRadius = options.bulletAoeRadius || 0;
        this.bulletAoeDamage = options.bulletAoeDamage || 0;

        // Homing properties
        this.bulletHoming = options.bulletHoming || false;
        this.homingForce = options.homingForce || 0.05;

        // Timing properties
        this.lastFireTime = 0;

        // Initialize drones array
        this.drones = [];
        this.maxDrones = options.maxDrones || 0;

        // Set initial weapon properties
        this.initWeaponProperties(this.weaponType);

        // Register with the scene
        scene.weaponManager = this;
    }

    /**
     * Initialize weapon-specific properties based on weapon type
     * @param {string} weaponType - The weapon type ('minigun' or 'shotgun')
     */
    initWeaponProperties(weaponType) {
        this.weaponType = weaponType;

        if (this.weaponType === 'minigun') {
            this.fireRate = this.SETTINGS.MINIGUN_FIRE_RATE;
            this.caliber = this.SETTINGS.MINIGUN_BULLET_CALIBER;
            this.bulletSpeed = this.SETTINGS.MINIGUN_BULLET_SPEED;
            this.bulletDamage = this.SETTINGS.MINIGUN_BULLET_DAMAGE;
            this.bulletColor = 0xffff00; // Yellow
            this.bulletHealth = this.SETTINGS.MINIGUN_BULLET_HEALTH;
        } else if (this.weaponType === 'shotgun') {
            this.fireRate = this.SETTINGS.SHOTGUN_FIRE_RATE;
            this.caliber = this.SETTINGS.SHOTGUN_BULLET_CALIBER;
            this.bulletSpeed = this.SETTINGS.SHOTGUN_BULLET_SPEED;
            this.bulletDamage = this.SETTINGS.SHOTGUN_BULLET_DAMAGE;
            this.bulletColor = 0xff6600; // Orange
            this.spreadAngle = this.SETTINGS.SHOTGUN_SPREAD_ANGLE;
            this.bulletCount = this.SETTINGS.SHOTGUN_BULLET_COUNT;
            this.bulletHealth = this.SETTINGS.SHOTGUN_BULLET_HEALTH;
        }
    }

    /**
     * Add a drone to the player's arsenal
     * @returns {PlayerDrone} The created drone
     */
    addDrone() {
        if (this.drones.length >= this.maxDrones) {
            return null; // Max drones reached
        }

        const playerPos = this.player.getPosition();
        const drone = new PlayerDrone(
            this.scene,
            playerPos.x,
            playerPos.y,
            this.player,
            this.drones.length
        );

        this.drones.push(drone);

        // Recalculate orbit positions for all drones to ensure they're evenly distributed
        this.recalculateDronePositions();

        // Emit event for drone added
        EventBus.emit('drone-added', {
            drone: drone,
            count: this.drones.length
        });

        return drone;
    }

    /**
     * Recalculate orbit positions for all drones to ensure even spacing
     */
    recalculateDronePositions() {
        const totalDrones = this.drones.length;

        // Skip if no drones
        if (totalDrones === 0) return;

        // For each drone, update its orbit offset and angle
        for (let i = 0; i < totalDrones; i++) {
            const drone = this.drones[i];
            if (drone) {
                // Calculate new offset based on total drones and this drone's index
                const newOffset = (2 * Math.PI / totalDrones) * i;

                // Update drone's orbit offset and current angle
                drone.orbitOffset = newOffset;
                drone.angle = newOffset;
            }
        }
    }

    /**
     * Increase maximum drones count and add a new drone
     * @returns {PlayerDrone} The created drone or null if unsuccessful
     */
    upgradeDrones() {
        this.maxDrones++;
        return this.addDrone();
    }

    /**
     * Update all drones and their positions
     */
    updateDrones() {
        for (let i = 0; i < this.drones.length; i++) {
            if (this.drones[i] && this.drones[i].update) {
                this.drones[i].update();
            }
        }
    }

    /**
     * Fire a shot from the weapon if cooldown has elapsed
     * @param {number} targetX - X coordinate to fire toward
     * @param {number} targetY - Y coordinate to fire toward
     * @returns {boolean} Whether a shot was fired
     */
    shoot(targetX, targetY) {
        const currentTime = this.scene.time.now;

        // Check if enough time has passed since last shot (fire rate)
        if (currentTime - this.lastFireTime < this.fireRate) {
            return false; // Can't shoot yet
        }

        // Update last fire time
        this.lastFireTime = currentTime;

        const playerPos = this.player.getPosition();

        // Calculate direction vector to target
        const dx = targetX - playerPos.x;
        const dy = targetY - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction vector
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Calculate spawn position (edge of player circle)
        const spawnX = playerPos.x + dirX * this.player.radius;
        const spawnY = playerPos.y + dirY * this.player.radius;

        // Create bullets based on weapon type
        let bullets;
        if (this.weaponType === 'minigun') {
            bullets = this.createMinigunBullet(spawnX, spawnY, dirX, dirY);
        } else if (this.weaponType === 'shotgun') {
            bullets = this.createShotgunBullets(spawnX, spawnY, dirX, dirY);
        }

        // Play weapon sound
        this.playWeaponSound();

        return true;
    }

    /**
     * Fire a shot from each drone
     * @param {number} targetX - X coordinate to fire toward
     * @param {number} targetY - Y coordinate to fire toward
     */
    shootDrones(targetX, targetY) {
        for (let i = 0; i < this.drones.length; i++) {
            if (this.drones[i] && this.drones[i].shoot) {
                // Each drone fires in the same direction but from its own position
                const dronePos = this.drones[i].getPosition();

                // Calculate direction from drone to target
                const dx = targetX - dronePos.x;
                const dy = targetY - dronePos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Only fire if target is outside the drone's orbit radius
                // This prevents drones from firing when the cursor is too close
                const droneOrbitRadius = this.drones[i].orbitRadius ||
                                        this.drones[i].radius * 3 ||
                                        50; // Fallback value

                if (distance <= droneOrbitRadius) {
                    continue; // Skip this drone if target is inside its circle
                }

                // Normalize direction vector
                const dirX = dx / distance;
                const dirY = dy / distance;

                // Create bullets based on weapon type
                this.createBulletFromDrone(this.drones[i], dirX, dirY);
            }
        }
    }

    /**
     * Create a bullet from a drone
     * @param {PlayerDrone} drone - The drone that's shooting
     * @param {number} dirX - X direction component
     * @param {number} dirY - Y direction component
     */
    createBulletFromDrone(drone, dirX, dirY) {
        const dronePos = drone.getPosition();

        // Calculate spawn position (edge of drone)
        const spawnX = dronePos.x + dirX * drone.radius;
        const spawnY = dronePos.y + dirY * drone.radius;

        // Create bullets based on weapon type
        if (this.weaponType === 'minigun') {
            this.createMinigunBullet(spawnX, spawnY, dirX, dirY, 0.7); // Drones do 70% damage
        } else if (this.weaponType === 'shotgun') {
            // For shotguns, drones fire fewer bullets
            const droneBulletCount = Math.max(3, Math.floor(this.bulletCount / 2));
            this.createShotgunBullets(spawnX, spawnY, dirX, dirY, 0.7, droneBulletCount);
        }
    }

    /**
     * Create a minigun bullet
     * @param {number} spawnX - Spawn X position
     * @param {number} spawnY - Spawn Y position
     * @param {number} dirX - Direction X component
     * @param {number} dirY - Direction Y component
     * @param {number} damageMultiplier - Optional damage multiplier
     * @returns {Phaser.GameObjects.Arc} The bullet object
     */
    createMinigunBullet(spawnX, spawnY, dirX, dirY, damageMultiplier = 1.0) {
        // Use bullet pool instead of direct creation
        if (this.scene.bulletPool) {
            const bullet = this.scene.bulletPool.createMinigunBullet(
                spawnX, spawnY, dirX, dirY,
                this.bulletSpeed, this.bulletHealth,
                this.bulletColor, this.caliber
            );

            if (bullet) {
                // Add additional properties to the bullet
                bullet.damage = this.bulletDamage * damageMultiplier;
                bullet.pierce = this.bulletPierce;
                bullet.range = this.bulletRange;
                bullet.penetratedEnemies = [];

                // Add critical hit chance
                bullet.canCrit = Math.random() < (this.criticalHitChance / 100);
                bullet.critMultiplier = this.criticalDamageMultiplier;

                // Add AOE properties if applicable
                if (this.bulletAoeRadius > 0) {
                    bullet.aoeRadius = this.bulletAoeRadius;
                    bullet.aoeDamage = this.bulletAoeDamage;
                }

                // Add homing properties if applicable
                if (this.bulletHoming) {
                    bullet.homing = true;
                    bullet.homingForce = this.homingForce;
                }
            }

            return bullet;
        }

        return null;
    }

    /**
     * Create multiple shotgun bullets with spread
     * @param {number} spawnX - Spawn X position
     * @param {number} spawnY - Spawn Y position
     * @param {number} dirX - Base direction X component
     * @param {number} dirY - Base direction Y component
     * @param {number} damageMultiplier - Optional damage multiplier
     * @param {number} overrideBulletCount - Optional override for bullet count
     * @returns {Array} Array of created bullets
     */
    createShotgunBullets(spawnX, spawnY, dirX, dirY, damageMultiplier = 1.0, overrideBulletCount) {
        const count = overrideBulletCount || this.bulletCount;

        // Use bullet pool instead of direct creation
        if (this.scene.bulletPool) {
            const bullets = this.scene.bulletPool.createShotgunBullets(
                spawnX, spawnY, dirX, dirY,
                this.bulletSpeed, this.bulletHealth,
                this.bulletColor, this.caliber,
                count, this.spreadAngle
            );

            // Add additional properties to each bullet
            bullets.forEach(bullet => {
                if (bullet) {
                    bullet.damage = this.bulletDamage * damageMultiplier;
                    bullet.pierce = this.bulletPierce;
                    bullet.range = this.bulletRange;
                    bullet.penetratedEnemies = [];

                    // Add critical hit chance
                    bullet.canCrit = Math.random() < (this.criticalHitChance / 100);
                    bullet.critMultiplier = this.criticalDamageMultiplier;

                    // Add AOE properties if applicable
                    if (this.bulletAoeRadius > 0) {
                        bullet.aoeRadius = this.bulletAoeRadius;
                        bullet.aoeDamage = this.bulletAoeDamage;
                    }

                    // Add homing properties if applicable
                    if (this.bulletHoming) {
                        bullet.homing = true;
                        bullet.homingForce = this.homingForce;
                    }
                }
            });

            return bullets;
        }

        return [];
    }

    /**
     * Play the weapon sound with error handling
     * @private
     */
    playWeaponSound() {
        // Don't try to play sounds if soundManager or soundKey aren't available
        if (!this.scene.soundManager) return;

        const soundKey = this.weaponType === 'minigun'
            ? 'shoot_minigun'
            : 'shoot_shotgun';

        try {
            // Add slight pitch variation for more realistic sound
            const detune = Math.random() * 200 - 100; // Random detune between -100 and +100

            // If this is the first shot, force an unlock of the audio context
            if (this.scene.sound && this.scene.sound.locked) {
                this.scene.sound.unlock();
            }

            this.scene.soundManager.playSoundEffect(soundKey, { detune });
        } catch (error) {
            console.warn('Error playing weapon sound:', error);
        }
    }

    /**
     * Apply a weapon upgrade
     * @param {Object} upgrade - Weapon upgrade to apply
     */
    applyUpgrade(upgrade) {
        if (!upgrade || !upgrade.stats) return;

        // Apply each stat change from the upgrade
        Object.entries(upgrade.stats).forEach(([stat, value]) => {
            switch (stat) {
                case 'damage':
                    this.bulletDamage *= value;
                    break;

                case 'fireRate':
                    // For fire rate, values < 1 make firing faster (reduce delay)
                    // For values > 1, we need to invert the effect to still make firing faster
                    if (value < 1) {
                        this.fireRate *= value; // Reduce delay between shots
                    } else {
                        // If value > 1, we need to decrease fire rate (make it faster)
                        // by dividing instead of multiplying
                        this.fireRate /= value;
                    }
                    break;

                case 'bulletRange':
                    this.bulletRange *= value;
                    break;

                case 'bulletSpeed':
                    this.bulletSpeed *= value;
                    break;

                case 'bulletPierce':
                    this.bulletPierce += value;
                    break;

                case 'criticalChance':
                    this.criticalHitChance += value;
                    break;

                case 'criticalDamageMultiplier':
                    this.criticalDamageMultiplier += value;
                    break;

                case 'aoeRadius':
                    this.bulletAoeRadius += value;
                    break;

                case 'aoeDamage':
                    this.bulletAoeDamage += value;
                    break;

                case 'homing':
                    this.bulletHoming = value;
                    break;

                case 'homingForce':
                    this.homingForce = value;
                    break;

                default:
                    console.warn(`Unknown weapon stat: ${stat}`);
            }
        });

        // Emit event for weapon upgrade
        EventBus.emit('weapon-upgraded', {
            upgrade: upgrade,
            newStats: {
                damage: this.bulletDamage,
                fireRate: this.fireRate,
                range: this.bulletRange,
                speed: this.bulletSpeed,
                pierce: this.bulletPierce,
                criticalChance: this.criticalHitChance,
                criticalDamage: this.criticalDamageMultiplier
            }
        });
    }

    /**
     * Update method called each frame
     */
    update() {
        // Update drones
        this.updateDrones();
    }

    /**
     * Get the current weapon statistics
     * @returns {Object} Current weapon stats
     */
    getStats() {
        return {
            type: this.weaponType,
            damage: this.bulletDamage,
            fireRate: this.fireRate,
            range: this.bulletRange,
            speed: this.bulletSpeed,
            pierce: this.bulletPierce,
            criticalChance: this.criticalHitChance,
            criticalDamage: this.criticalDamageMultiplier,
            droneCount: this.drones.length,
            maxDrones: this.maxDrones
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Clean up all drones
        this.drones.forEach(drone => {
            if (drone && drone.destroy) {
                drone.destroy();
            }
        });

        // Clear references
        this.drones = [];
        this.player = null;
        this.scene = null;
    }
}