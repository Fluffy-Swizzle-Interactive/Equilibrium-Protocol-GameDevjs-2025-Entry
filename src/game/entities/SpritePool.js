import { GameObjectManager } from '../managers/GameObjectManager';

/**
 * SpritePool - A specialized pool for managing sprite objects like death effects and XP pickups
 * Integrates with GameObjectManager for efficient sprite recycling
 */
export class SpritePool {
    /**
     * Create a new sprite pool
     * @param {Phaser.Scene} scene - The scene this pool belongs to
     * @param {Object} options - Configuration options for the pool
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.gameObjectManager = scene.gameObjectManager || new GameObjectManager(scene);
        this.sprites = [];
        this.defaultOptions = {
            initialSize: 30,      // Start with 30 sprites
            maxSize: 200,         // Allow up to 200 sprites
            growSize: 10,         // Add 10 at a time when needed
            defaultTexture: 'particle_texture',
            defaultFrame: 0,
            defaultSize: 16,
            defaultColor: 0xFFFFFF
        };
        
        // Merge provided options with defaults
        this.options = { ...this.defaultOptions, ...options };

        // Check if the default texture exists, create a fallback if needed
        this.ensureTextureExists(this.options.defaultTexture);
        
        // Register this pool with the scene for easy access
        this.scene.spritePool = this;
        
        // Initialize the sprite pool
        this.initPool();
    }
    
    /**
     * Make sure a texture exists, create a fallback if it doesn't
     * @param {string} textureKey - The texture key to check
     * @returns {string} The texture key (original or fallback)
     */
    ensureTextureExists(textureKey) {
        if (!textureKey || !this.scene.textures.exists(textureKey)) {
            console.warn(`Texture "${textureKey}" not found, creating fallback`);
            this.createFallbackTexture(textureKey || 'fallback_texture');
            return textureKey || 'fallback_texture';
        }
        return textureKey;
    }
    
    /**
     * Create a fallback texture when needed
     * @param {string} key - The key to use for the fallback texture
     */
    createFallbackTexture(key) {
        // Create a white square as fallback
        const graphics = this.scene.make.graphics();
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture(key, 16, 16);
        graphics.destroy();
    }
    
    /**
     * Initialize the sprite pool
     */
    initPool() {
        // Create pool for sprites
        this.gameObjectManager.createPool('sprite',
            // Create function - creates sprite instance without initialization
            () => {
                // Make sure texture exists
                const textureKey = this.ensureTextureExists(this.options.defaultTexture);
                
                // Create a sprite (or image if no frames)
                const sprite = this.scene.add.sprite(0, 0, textureKey);
                
                // Set default properties
                sprite.setVisible(false);
                sprite.setActive(false);
                sprite.setAlpha(0);
                sprite.setScale(0);
                sprite.setDepth(50); // Above most objects, below UI
                sprite.customData = {}; // For storing custom data like type, value, etc.
                
                // Return the sprite
                return sprite;
            },
            // Reset function - initializes or resets sprite properties
            (sprite, x, y, options = {}) => {
                // Default options
                const spriteOptions = {
                    texture: this.options.defaultTexture,
                    frame: this.options.defaultFrame,
                    scale: 1,
                    alpha: 1,
                    tint: this.options.defaultColor,
                    lifespan: 3000, // Default 3 second lifespan
                    rotation: 0,
                    velocityX: 0,
                    velocityY: 0,
                    angularVelocity: 0,
                    collectible: false, // Whether this is a collectible (XP, etc.)
                    value: 1, // Default value (for XP, etc.)
                    depth: 50,
                    onExpire: null, // Callback when sprite expires
                    gravity: 0, // Optional gravity for items that should fall
                    bounce: 0, // Bounce factor for physics-enabled sprites
                    drag: 0, // Drag factor for physics-enabled sprites
                    ...options
                };
                
                // Check if texture exists before setting
                const textureKey = this.ensureTextureExists(spriteOptions.texture);
                
                // Set sprite position and texture
                sprite.setPosition(x, y);
                sprite.setTexture(textureKey, spriteOptions.frame);
                sprite.setScale(spriteOptions.scale);
                sprite.setAlpha(spriteOptions.alpha);
                sprite.setTint(spriteOptions.tint);
                sprite.setAngle(spriteOptions.rotation);
                sprite.setDepth(spriteOptions.depth);
                sprite.setVisible(true);
                sprite.setActive(true);
                
                // Store velocities and properties
                sprite.velocityX = spriteOptions.velocityX;
                sprite.velocityY = spriteOptions.velocityY;
                sprite.angularVelocity = spriteOptions.angularVelocity;
                
                // Reset or initialize lifetime tracking
                sprite.lifespan = spriteOptions.lifespan;
                sprite.lifetime = 0;
                
                // Store custom data
                sprite.customData = {
                    collectible: spriteOptions.collectible,
                    value: spriteOptions.value,
                    onExpire: spriteOptions.onExpire,
                    type: spriteOptions.type || 'generic'
                };
                
                // Setup physics properties if enabled
                if (spriteOptions.enablePhysics) {
                    this.scene.physics.world.enable(sprite);
                    sprite.body.setGravity(0, spriteOptions.gravity);
                    sprite.body.setBounce(spriteOptions.bounce);
                    sprite.body.setDrag(spriteOptions.drag);
                }
                
                // Add to tracking list if not already there
                if (!this.sprites.includes(sprite)) {
                    this.sprites.push(sprite);
                }
            },
            // Custom configuration
            {
                initialSize: this.options.initialSize,
                maxSize: this.options.maxSize,
                growSize: this.options.growSize
            }
        );
    }
    
    /**
     * Create a new sprite at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Sprite configuration options
     * @returns {Phaser.GameObjects.Sprite} - The created sprite
     */
    createSprite(x, y, options = {}) {
        // Get a sprite from the pool
        const sprite = this.gameObjectManager.get('sprite', x, y, options);
        
        // If we got a sprite from the pool, return it
        if (sprite) {
            return sprite;
        }
        
        // If the pool couldn't provide a sprite (e.g., reached maxSize), create one manually
        console.warn('Sprite pool maxSize reached - creating sprite outside pool');
        
        // Ensure texture exists
        const textureKey = this.ensureTextureExists(options.texture || this.options.defaultTexture);
        
        const manualSprite = this.scene.add.sprite(x, y, textureKey);
        
        // Set properties
        manualSprite.setScale(options.scale || 1);
        manualSprite.setAlpha(options.alpha || 1);
        manualSprite.setDepth(options.depth || 50);
        
        return manualSprite;
    }
    
    /**
     * Create a death sprite effect at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Custom options for the death effect
     * @returns {Phaser.GameObjects.Sprite} - The created death sprite
     */
    createDeathEffect(x, y, options = {}) {
        const deathOptions = {
            texture: 'particle_texture',
            scale: 0.5,
            tint: 0xFF6666, // Red tint
            lifespan: 800,
            rotation: Math.random() * 360,
            angularVelocity: Math.random() * 200 - 100,
            velocityX: Math.random() * 100 - 50,
            velocityY: Math.random() * 100 - 50,
            type: 'death_effect',
            ...options
        };
        
        // Create the sprite
        const sprite = this.createSprite(x, y, deathOptions);
        
        // Optional: Apply a fade-out effect
        if (this.scene.tweens && sprite) {
            this.scene.tweens.add({
                targets: sprite,
                alpha: { from: 1, to: 0 },
                scale: { from: deathOptions.scale, to: 0 },
                duration: deathOptions.lifespan,
                ease: 'Power2'
            });
        }
        
        return sprite;
    }
    
    /**
     * Create an XP pickup sprite at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Custom options for the XP pickup
     * @returns {Phaser.GameObjects.Sprite} - The created XP pickup sprite
     */
    createXPPickup(x, y, options = {}) {
        const xpOptions = {
            texture: 'particle_texture',
            scale: 0.4,
            tint: 0x44FF44, // Green tint for XP
            lifespan: 15000, // Longer lifespan for pickups
            rotation: 0,
            angularVelocity: 50, // Slow spin
            velocityX: Math.random() * 40 - 20,
            velocityY: Math.random() * 40 - 20,
            type: 'xp_pickup',
            collectible: true,
            value: options.value || 1,
            enablePhysics: true,
            gravity: 50,
            bounce: 0.5,
            drag: 50,
            ...options
        };
        
        // Create the sprite
        const sprite = this.createSprite(x, y, xpOptions);
        
        // Optional: Apply a pulsating effect
        if (this.scene.tweens && sprite) {
            this.scene.tweens.add({
                targets: sprite,
                scale: { from: xpOptions.scale, to: xpOptions.scale * 1.2 },
                yoyo: true,
                repeat: -1,
                duration: 1000,
                ease: 'Sine.easeInOut'
            });
        }
        
        return sprite;
    }

    /**
     * Create a cash pickup sprite at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Custom options for the cash pickup
     * @returns {Phaser.GameObjects.Sprite} - The created cash pickup sprite
     */
    createCashPickup(x, y, options = {}) {
        const cashOptions = {
            texture: 'particle_texture',
            scale: 0.5,
            tint: 0xFFD700, // Gold color
            lifespan: 10000, // 10 seconds lifespan
            rotation: 0,
            angularVelocity: 0,
            velocityX: 0,
            velocityY: 0,
            type: 'cash_pickup',
            collectible: true,
            value: options.value || 1,
            enablePhysics: false,
            depth: 40,
            ...options
        };

        // Create the sprite
        const sprite = this.createSprite(x, y, cashOptions);
        
        // Add fade-out tween that starts near the end of lifespan
        if (this.scene.tweens && sprite) {
            // Start fade out 2 seconds before death
            const fadeDelay = cashOptions.lifespan - 2000;
            
            this.scene.tweens.add({
                targets: sprite,
                alpha: { from: 1, to: 0 },
                scale: { from: cashOptions.scale, to: 0 },
                duration: 2000, // 2 second fade
                ease: 'Power2',
                delay: fadeDelay,
                onComplete: () => {
                    this.releaseSprite(sprite);
                }
            });

            // If there's a text object associated with the sprite, fade it too
            if (sprite.textObject) {
                this.scene.tweens.add({
                    targets: sprite.textObject,
                    alpha: { from: 1, to: 0 },
                    scale: { from: 1, to: 0 },
                    duration: 2000,
                    ease: 'Power2',
                    delay: fadeDelay
                });
            }
        }

        return sprite;
    }
    
    /**
     * Release a sprite back to the pool
     * @param {Phaser.GameObjects.Sprite} sprite - The sprite to release
     */
    releaseSprite(sprite) {
        if (!sprite || !sprite.active) {
            return;
        }
        
        // If using tweens, stop any active tweens
        if (this.scene.tweens) {
            this.scene.tweens.killTweensOf(sprite);
            
            // Also kill tweens on any associated text object
            if (sprite.textObject) {
                this.scene.tweens.killTweensOf(sprite.textObject);
            }
        }
        
        // If physics were enabled, disable them
        if (sprite.body) {
            this.scene.physics.world.disable(sprite);
        }
        
        // Clean up text object if it exists (for cash pickups)
        if (sprite.textObject) {
            sprite.textObject.destroy();
            sprite.textObject = null;
        }
        
        // Reset the sprite
        sprite.setVisible(false);
        sprite.setActive(false);
        sprite.setPosition(-1000, -1000); // Move off-screen
        sprite.setAlpha(0);
        sprite.setScale(0);
        
        // Release back to pool
        this.gameObjectManager.release('sprite', sprite);
        
        // Remove from tracking array
        const index = this.sprites.indexOf(sprite);
        if (index !== -1) {
            this.sprites.splice(index, 1);
        }
    }
    
    /**
     * Update all active sprites
     * @param {number} time - Current time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        // Update and potentially cull sprites
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            const sprite = this.sprites[i];
            
            // Skip inactive sprites
            if (!sprite || !sprite.active) {
                // Clean up the array if we have inactive sprites
                if (sprite) {
                    this.sprites.splice(i, 1);
                }
                continue;
            }
            
            // Update lifetime
            sprite.lifetime += delta;
            
            // Apply movement if not using physics
            if (!sprite.body) {
                sprite.x += sprite.velocityX * (delta / 1000);
                sprite.y += sprite.velocityY * (delta / 1000);
                sprite.angle += sprite.angularVelocity * (delta / 1000);
            }
            
            // Check if sprite should be culled (exceeded lifespan)
            if (sprite.lifetime >= sprite.lifespan) {
                // Call onExpire callback if provided
                if (sprite.customData.onExpire) {
                    sprite.customData.onExpire(sprite);
                }
                
                // Release the sprite
                this.releaseSprite(sprite);
            }
        }
    }
    
    /**
     * Check collision between a point (e.g., player) and collectible sprites
     * @param {number} x - X position to check
     * @param {number} y - Y position to check
     * @param {number} radius - Collision radius
     * @param {Function} onCollect - Callback when a collectible is collected
     * @param {string} [type] - Optional type of sprite to filter for 
     * @returns {Array} - Array of collected sprites
     */
    checkCollision(x, y, radius, onCollect, type) {
        const collected = [];
        
        // Check each sprite
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            const sprite = this.sprites[i];
            
            // Skip inactive sprites
            if (!sprite || !sprite.active) {
                continue;
            }

            // Skip non-collectible sprites
            if (!sprite.customData || !sprite.customData.collectible) {
                continue;
            }
            
            // If type is provided, only check sprites of that type
            if (type && sprite.customData.type !== type) {
                continue;
            }
            
            // Check distance
            const distance = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
            
            // If within collection radius, collect it
            if (distance < radius) {
                collected.push(sprite);
                
                // Call onCollect callback if provided
                if (onCollect) {
                    onCollect(sprite);
                }
                
                // Release the sprite
                this.releaseSprite(sprite);
            }
        }
        
        return collected;
    }
}
