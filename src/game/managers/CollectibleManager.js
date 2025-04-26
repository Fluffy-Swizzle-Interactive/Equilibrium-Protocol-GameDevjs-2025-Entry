import { EventBus } from '../EventBus';

/**
 * CollectibleManager class
 * Centralized manager for handling all collectible pickups (XP, cash, power-ups, etc.)
 * Reduces code duplication and standardizes collection logic across different pickup types
 */
export class CollectibleManager {
    /**
     * Create a new collectible manager
     * @param {Phaser.Scene} scene - The scene this collectible manager belongs to
     * @param {Object} options - Configuration options
     */
    constructor(scene, options = {}) {
        this.scene = scene;

        // Register with scene for easier access
        scene.collectibleManager = this;

        // Managers this collectible manager will interact with
        this.managers = {};

        // Collection configuration for different types
        this.collectionConfig = {
            xp_pickup: {
                radius: options.xpCollectionRadius || 40,
                processMethod: this.processXPCollection.bind(this),
                manager: 'xpManager',
                soundKey: 'xp_collect',
                fallbackSoundKey: 'shoot_minigun',
                soundConfig: {
                    detune: 1200,
                    volume: 0.3
                },
                particleColor: 0x44FF44 // Green
            },
            cash_pickup: {
                radius: options.cashCollectionRadius || 40,
                processMethod: this.processCashCollection.bind(this),
                manager: 'cashManager',
                soundKey: 'cash_pickup',
                fallbackSoundKey: 'laserShoot',
                soundConfig: {
                    detune: 600,
                    volume: 0.3
                },
                particleColor: 0xFFD700 // Gold
            },
            health_pickup: {
                radius: options.healthCollectionRadius || 40,
                processMethod: this.processHealthCollection.bind(this),
                manager: null, // Direct to player
                soundKey: 'health_pickup',
                fallbackSoundKey: 'laserShoot',
                soundConfig: {
                    detune: 900,
                    volume: 0.4
                },
                particleColor: 0xFF0000 // Red - used for particle effects
            }
            // Additional collectible types can be added here
        };

        // Collection timing interval & management
        this.lastCollectionTime = 0;
        this.collectionInterval = options.collectionInterval || 100; // 100ms

        // Register event listeners
        EventBus.on('collectible-collected', this.onCollectibleCollected, this);
    }

    /**
     * Register a manager with the collectible system
     * @param {string} type - The type of manager (e.g., 'xpManager', 'cashManager')
     * @param {Object} manager - The manager instance
     */
    registerManager(type, manager) {
        if (!manager) {
            console.warn(`Cannot register null manager for type: ${type}`);
            return;
        }

        this.managers[type] = manager;
    }

    /**
     * Check for collectibles around the player or at a specific position
     * @param {Object} position - Position to check from (usually the player) with x,y properties
     * @param {Array} collectibleTypes - Types of collectibles to check for (defaults to all types)
     * @returns {Array} Collected items
     */
    checkCollectibles(position, collectibleTypes = null) {
        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
            console.warn('CollectibleManager: Invalid position for collectible check');
            return [];
        }

        if (!this.scene.spritePool) {
            console.warn('CollectibleManager: No SpritePool found in scene');
            return [];
        }

        const currentTime = this.scene.time.now;

        // Only check at the specified interval to optimize performance
        if (currentTime - this.lastCollectionTime < this.collectionInterval) {
            return [];
        }

        this.lastCollectionTime = currentTime;

        const typesToCheck = collectibleTypes || Object.keys(this.collectionConfig);
        const allCollected = [];

        // Process each collectible type
        typesToCheck.forEach(type => {
            const config = this.collectionConfig[type];
            if (!config) return;

            const collected = this.scene.spritePool.checkCollision(
                position.x,
                position.y,
                config.radius,
                (sprite) => this.processCollection(sprite, type),
                type // Only check this specific type
            );

            if (collected && collected.length) {
                allCollected.push(...collected);
            }
        });

        return allCollected;
    }

    /**
     * Process a collected item based on its type
     * @param {Object} sprite - The collected sprite
     * @param {string} type - Collectible type
     * @returns {boolean} Whether the sprite should be removed
     */
    processCollection(sprite, type) {
        if (!sprite || !sprite.customData) return true;

        const config = this.collectionConfig[type];
        if (!config) return true;

        let processed = false;

        // Use the appropriate processing method based on type
        if (config.processMethod) {
            processed = config.processMethod(sprite);
        }

        // Play sound effect if available
        this.playCollectionSound(config);

        // Create particle effect if enabled
        this.createCollectionEffect(sprite, config);

        // Emit collectible-collected event
        EventBus.emit('collectible-collected', {
            type,
            value: sprite.customData.value,
            position: { x: sprite.x, y: sprite.y }
        });

        // Return true to indicate this sprite should be removed
        return true;
    }

    /**
     * Process XP collection
     * @param {Object} sprite - The collected XP sprite
     * @returns {boolean} Whether processing was successful
     */
    processXPCollection(sprite) {
        if (!sprite.customData || typeof sprite.customData.value !== 'number') {
            return false;
        }

        const xpManager = this.managers.xpManager || this.scene.xpManager;

        if (!xpManager || !xpManager.addXP) {
            console.warn('CollectibleManager: Cannot process XP - no valid XPManager found');
            return false;
        }

        // Add XP to the player
        const amount = sprite.customData.value;
        const leveledUp = xpManager.addXP(amount);

        // Show floating text if UI manager exists
        if (this.scene.uiManager && this.scene.uiManager.showFloatingText) {
            this.scene.uiManager.showFloatingText(
                sprite.x, sprite.y, `+${amount} XP`, 0x44FF44
            );
        }

        return true;
    }

    /**
     * Process cash collection
     * @param {Object} sprite - The collected cash sprite
     * @returns {boolean} Whether processing was successful
     */
    processCashCollection(sprite) {
        if (!sprite.customData || typeof sprite.customData.value !== 'number') {
            return false;
        }

        const cashManager = this.managers.cashManager || this.scene.cashManager;

        if (!cashManager || !cashManager.addCash) {
            console.warn('CollectibleManager: Cannot process cash - no valid CashManager found');
            return false;
        }

        // Add cash to the player
        const amount = sprite.customData.value;
        cashManager.addCash(amount);

        // Show floating text if UI manager exists
        if (this.scene.uiManager && this.scene.uiManager.showFloatingText) {
            this.scene.uiManager.showFloatingText(
                sprite.x, sprite.y, `+$${amount}`, 0xFFD700
            );
        }

        return true;
    }

    /**
     * Process health collection
     * @param {Object} sprite - The collected health sprite
     * @returns {boolean} Whether processing was successful
     */
    processHealthCollection(sprite) {
        if (!sprite.customData || typeof sprite.customData.value !== 'number') {
            return false;
        }

        // Get the health amount from the sprite
        const amount = sprite.customData.value;
        let healedAmount = 0;

        // Try different ways to access the health system
        // 1. First try scene.playerHealth (centralized health system in WaveGame)
        if (this.scene.playerHealth && typeof this.scene.playerHealth.heal === 'function') {
            healedAmount = this.scene.playerHealth.heal(amount);
            if (this.scene.isDev) console.debug('Health pickup: Used scene.playerHealth to heal', amount);
        }
        // 2. Then try player.healthSystem (attached health system)
        else if (this.scene.player && this.scene.player.healthSystem &&
                 typeof this.scene.player.healthSystem.heal === 'function') {
            healedAmount = this.scene.player.healthSystem.heal(amount);
            if (this.scene.isDev) console.debug('Health pickup: Used player.healthSystem to heal', amount);
        }
        // 3. Finally try direct player.heal method
        else if (this.scene.player && typeof this.scene.player.heal === 'function') {
            this.scene.player.heal(amount);
            healedAmount = amount; // Assume full healing for UI purposes
            if (this.scene.isDev) console.debug('Health pickup: Used player.heal to heal', amount);
        }
        else {
            console.warn('CollectibleManager: Cannot process health - no valid health system found');
            return false;
        }

        // Show floating text if UI manager exists and actually healed
        if (this.scene.uiManager && this.scene.uiManager.showFloatingText) {
            this.scene.uiManager.showFloatingText(
                sprite.x, sprite.y, `+${amount} HP`, 0xFF0000
            );
        }

        // Play healing sound if available
        if (this.scene.soundManager) {
            const soundKey = this.scene.soundManager.hasSound('health_pickup')
                ? 'health_pickup'
                : 'laserShoot';

            this.scene.soundManager.playSoundEffect(soundKey, {
                detune: 900,
                volume: 0.4
            });
        }

        // Show healing visual effect on player
        this.showHealingEffect();

        return true;
    }

    /**
     * Show visual effect when player is healed
     */
    showHealingEffect() {
        // Get player sprite if available
        const playerSprite = this.scene.player?.graphics;
        if (!playerSprite) return;

        // Flash player green
        playerSprite.setTint(0x00ff00); // Green flash for healing

        // Return to normal after flash duration
        this.scene.time.delayedCall(200, () => {
            playerSprite.clearTint();
        });

        // Create healing particles around player
        if (this.scene.add && this.scene.add.particles) {
            const particles = this.scene.add.particles(playerSprite.x, playerSprite.y, 'particle_texture', {
                speed: { min: 30, max: 80 },
                scale: { start: 0.2, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 500,
                blendMode: 'ADD',
                quantity: 8,
                tint: 0x00ff00, // Green particles for healing
                angle: { min: 0, max: 360 }
            });

            particles.setDepth(100);

            // Auto-destroy after short time
            this.scene.time.delayedCall(500, () => {
                particles.destroy();
            });
        }
    }

    /**
     * Play the appropriate sound for a collectible
     * @param {Object} config - The collectible type configuration
     * @private
     */
    playCollectionSound(config) {
        if (!this.scene.soundManager) return;

        const soundKey = this.scene.soundManager.hasSound(config.soundKey)
            ? config.soundKey
            : config.fallbackSoundKey;

        if (!soundKey) return;

        try {
            this.scene.soundManager.playSoundEffect(soundKey, config.soundConfig);
        } catch (error) {
            console.warn(`CollectibleManager: Error playing sound ${soundKey}`, error);
        }
    }

    /**
     * Create a visual effect when collecting an item
     * @param {Object} sprite - The collected sprite
     * @param {Object} config - The collectible type configuration
     * @private
     */
    createCollectionEffect(sprite, config) {
        if (!sprite || !config.particleColor) return;

        // Create particles using the current Phaser API
        if (this.scene.add && this.scene.add.particles) {
            const particleManager = this.scene.add.particles(sprite.x, sprite.y, 'particle_texture', {
                speed: { min: 30, max: 60 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.3, end: 0 },
                blendMode: 'ADD',
                lifespan: 200,
                gravityY: 0,
                quantity: 5,
                tint: config.particleColor
            });

            // Auto-destroy particles after short time
            this.scene.time.delayedCall(200, () => {
                particleManager.destroy();
            });
        }
    }

    /**
     * Handle collectible-collected event
     * @param {Object} data - Event data
     * @private
     */
    onCollectibleCollected(data) {
        // Additional global logic on collection can go here
        // For example, tracking stats, achievements, etc.
    }

    /**
     * Update method called each frame
     * @param {number} time - Current time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        // If we have a player, automatically check for collectibles around them
        if (this.scene.player && this.scene.player.getPosition) {
            const playerPos = this.scene.player.getPosition();
            if (playerPos) {
                this.checkCollectibles(playerPos);
            }
        }
    }

    /**
     * Update the collection radius for a specific collectible type
     * @param {string} type - The collectible type (e.g., 'xp_pickup', 'cash_pickup')
     * @param {number} multiplier - Multiplier to apply to the current radius
     * @returns {boolean} Whether the update was successful
     */
    updateCollectionRadius(type, multiplier) {
        if (!this.collectionConfig || !this.collectionConfig[type]) {
            console.warn(`CollectibleManager: Cannot update radius for unknown type: ${type}`);
            return false;
        }

        // Update the radius
        this.collectionConfig[type].radius *= multiplier;

        if (this.scene.isDev) {
            console.debug(`Updated ${type} collection radius to: ${this.collectionConfig[type].radius}`);
        }

        return true;
    }

    /**
     * Update all collection radii by the same multiplier
     * @param {number} multiplier - Multiplier to apply to all collection radii
     */
    updateAllCollectionRadii(multiplier) {
        if (!this.collectionConfig) return;

        Object.keys(this.collectionConfig).forEach(type => {
            this.updateCollectionRadius(type, multiplier);
        });
    }

    /**
     * Clean up resources when destroying
     */
    destroy() {
        // Unsubscribe from events
        EventBus.off('collectible-collected', this.onCollectibleCollected, this);

        // Clean up references
        this.scene = null;
        this.managers = {};
    }
}