/**
 * Animation Manager
 * Centralizes animation creation and management for game entities
 * Addresses issues with inconsistent animation key construction and repetitive animation logic
 */
export class AnimationManager {
    /**
     * Create a new animation manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.createdAnimations = new Set(); // Track which animations have been created
    }

    /**
     * Check if an animation can be created
     * @param {string} key - The animation key
     * @returns {boolean} Whether the animation can be created
     */
    canCreateAnimation(key) {
        // Don't recreate existing animations
        return !this.scene.anims.exists(key) && !this.createdAnimations.has(key);
    }

    /**
     * Create a standard animation from atlas frames
     * @param {string} key - The animation key
     * @param {string} textureKey - The texture atlas key
     * @param {string} prefix - Frame name prefix
     * @param {string} suffix - Frame name suffix (typically .png)
     * @param {number} startFrame - Starting frame number
     * @param {number} endFrame - Ending frame number
     * @param {object} options - Additional animation options
     * @returns {Phaser.Animations.Animation|null} The created animation or null if failed
     */
    createAnimation(key, textureKey, prefix, suffix, startFrame, endFrame, options = {}) {
        // Skip if animation already exists
        if (!this.canCreateAnimation(key)) {
            return null;
        }

        try {
            // Default animation options
            const defaultOptions = {
                frameRate: 10,
                repeat: -1, // Loop by default
                yoyo: false,
                hideOnComplete: false
            };

            // Merge default options with provided options
            const animOptions = { ...defaultOptions, ...options };
            
            // Generate frame names using Phaser's pattern
            const config = {
                key: key,
                frames: this.scene.anims.generateFrameNames(textureKey, {
                    prefix: prefix,
                    suffix: suffix,
                    start: startFrame,
                    end: endFrame
                }),
                frameRate: animOptions.frameRate,
                repeat: animOptions.repeat,
                yoyo: animOptions.yoyo,
                hideOnComplete: animOptions.hideOnComplete
            };

            // Create the animation
            const animation = this.scene.anims.create(config);
            
            // Track that we've created this animation
            if (animation) {
                this.createdAnimations.add(key);
            }
            
            return animation;
        } catch (error) {
            console.error(`Failed to create animation: ${key}`, error);
            return null;
        }
    }

    /**
     * Create an animation with explicit frame names
     * @param {string} key - The animation key
     * @param {string} textureKey - The texture atlas key
     * @param {string[]} frameNames - Array of frame names
     * @param {object} options - Additional animation options
     * @returns {Phaser.Animations.Animation|null} The created animation or null if failed
     */
    createAnimationWithFrames(key, textureKey, frameNames, options = {}) {
        // Skip if animation already exists
        if (!this.canCreateAnimation(key)) {
            return null;
        }

        try {
            // Default animation options
            const defaultOptions = {
                frameRate: 10,
                repeat: 0, // Don't loop by default for explicit frames
                yoyo: false,
                hideOnComplete: false
            };

            // Merge default options with provided options
            const animOptions = { ...defaultOptions, ...options };
            
            // Create the animation config with explicit frame names
            const config = {
                key: key,
                frames: this.scene.anims.generateFrameNames(textureKey, {
                    frames: frameNames
                }),
                frameRate: animOptions.frameRate,
                repeat: animOptions.repeat,
                yoyo: animOptions.yoyo,
                hideOnComplete: animOptions.hideOnComplete
            };

            // Create the animation
            const animation = this.scene.anims.create(config);
            
            // Track that we've created this animation
            if (animation) {
                this.createdAnimations.add(key);
            }
            
            return animation;
        } catch (error) {
            console.error(`Failed to create animation with frames: ${key}`, error);
            return null;
        }
    }

    /**
     * Create a set of standard enemy animations for a given enemy type
     * @param {string} enemyType - The type of enemy (e.g., 'enemy1', 'boss1')
     * @param {object} config - Configuration for the enemy's animations
     */
    createEnemyAnimations(enemyType, config = {}) {
        // Default configuration
        const defaultConfig = {
            idle: { start: 0, end: 3, frameRate: 8, repeat: -1 },
            run: { start: 0, end: 3, frameRate: 10, repeat: -1 },
            death: { start: 0, end: 7, frameRate: 12, repeat: 0 },
            shoot: { start: 0, end: 3, frameRate: 12, repeat: 0 },
            attack: null // Not all enemies have attack animations
        };

        // Merge with provided config
        const animConfig = { ...defaultConfig, ...config };
        
        // Create each animation type if configured
        for (const [animType, settings] of Object.entries(animConfig)) {
            if (!settings) continue; // Skip null configurations
            
            const key = `${enemyType}_${animType}`;
            
            // Check if we have explicit frames defined (for death animations with irregular frame sequences)
            if (settings.frames) {
                this.createAnimationWithFrames(
                    key,
                    enemyType,
                    settings.frames,
                    {
                        frameRate: settings.frameRate,
                        repeat: settings.repeat
                    }
                );
            } else {
                // Standard sequential frames
                this.createAnimation(
                    key,
                    enemyType,
                    `${enemyType}_${animType}_`,
                    '.png',
                    settings.start,
                    settings.end,
                    {
                        frameRate: settings.frameRate,
                        repeat: settings.repeat
                    }
                );
            }
        }
    }

    /**
     * Safely play an animation on a sprite if it exists
     * @param {Phaser.GameObjects.Sprite} sprite - The sprite to animate
     * @param {string} key - Animation key to play
     * @param {boolean} ignoreIfPlaying - If true, won't restart the animation if it's already playing
     * @returns {boolean} Whether the animation was successfully started
     */
    playAnimation(sprite, key, ignoreIfPlaying = false) {
        if (!sprite || !sprite.anims) return false;
        
        // Check if animation exists
        if (!this.scene.anims.exists(key)) {
            // console.warn(`Animation not found: ${key}`);
            return false;
        }
        
        // Don't restart if already playing this animation
        if (ignoreIfPlaying && sprite.anims.currentAnim && sprite.anims.currentAnim.key === key) {
            return true;
        }
        
        // Play the animation
        sprite.play(key, ignoreIfPlaying);
        return true;
    }
}