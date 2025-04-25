import { BaseEnemy } from './BaseEnemy';
import { DEPTHS, GROUP_IDS } from '../constants';

/**
 * SpriteEnemy - Base class for sprite-based enemies
 * Provides common functionality for all sprite-based enemies including animations and faction-based outline color
 */
export class SpriteEnemy extends BaseEnemy {
    /**
     * Create a new SpriteEnemy
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     * @param {Object} spriteConfig - Configuration for the sprite
     */
    constructor(scene, x, y, fromPool = false, spriteConfig = {}) {
        super(scene, x, y, fromPool);
        
        // Store sprite config
        this.spriteConfig = {
            key: spriteConfig.key || 'enemy1',
            scale: spriteConfig.scale || 1.0,
            animations: spriteConfig.animations || {},
            outlineThickness: spriteConfig.outlineThickness || 2
        };
        
        // Initialize properties and create visuals
        this.initProperties();
        this.createVisuals(x, y);
        
        // Add event listeners for the sprite's animation completion
        if (this.graphics && this.graphics.on) {
            this.graphics.on('animationcomplete', this.onAnimationComplete, this);
        }
    }
    
    /**
     * Initialize enemy properties
     * (To be overridden by subclasses)
     */
    initProperties() {
        this.speed = 0.5;
        this.size = 16;
        this.health = 10;
        this.damage = 10;
        this.scoreValue = 10;
    }
    
    /**
     * Create the visual representation of the enemy
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     */
    createVisuals(x, y) {
        // Create sprite
        this.graphics = this.scene.add.sprite(x, y, this.spriteConfig.key);
        this.graphics.setOrigin(0.5, 0.5);
        this.graphics.setScale(this.spriteConfig.scale);
        this.graphics.setDepth(DEPTHS.ENEMY);
        
        // Store a reference to the parent enemy
        this.graphics.parentEnemy = this;
        
        // Create animations if needed
        this.createAnimations();
        
        // Start with idle animation
        this.playAnimation('idle', true);
        
        // Add outline for faction identification (will be colored in updateFactionDisplay)
        this.createOutlineEffect();
        
        // Set up physics body if the scene has a physics system
        if (this.scene.physics && this.scene.physics.world) {
            this.scene.physics.world.enable(this.graphics);
            
            // Set circle body for better collision detection
            const bodyRadius = this.size * 0.5 * this.spriteConfig.scale;
            this.graphics.body.setCircle(bodyRadius, 
                (this.graphics.width - bodyRadius * 2) * 0.5, 
                (this.graphics.height - bodyRadius * 2) * 0.5
            );
        }
    }
    
    /**
     * Create outline effect for faction-based coloring
     */
    createOutlineEffect() {
        // Store original pipeline
        this.originalPipeline = this.graphics.pipeline;
        
        // Apply outline shader if available
        if (this.scene.renderer && this.scene.renderer.pipelines) {
            const outlinePipeline = this.scene.renderer.pipelines.get('OutlinePipeline');
            if (outlinePipeline) {
                this.graphics.setPipeline('OutlinePipeline');
                this.graphics.pipeline.setFloat2('uTextureSize', this.graphics.texture.source[0].width, this.graphics.texture.source[0].height);
                this.graphics.pipeline.setFloat1('uThickness', this.spriteConfig.outlineThickness);
                this.graphics.pipeline.setFloat3('uOutlineColor', 1.0, 1.0, 1.0); // Default white outline
            }
        }
    }
    
    /**
     * Create animations for the sprite
     */
    createAnimations() {
        // Check if animations are defined and the sprite key exists
        if (!this.spriteConfig.animations || !this.scene.textures.exists(this.spriteConfig.key)) {
            return;
        }
        
        // Create each animation
        Object.entries(this.spriteConfig.animations).forEach(([animKey, config]) => {
            // Skip if animation already exists
            const animName = `${this.spriteConfig.key}_${animKey}`;
            if (this.scene.anims.exists(animName)) return;
            
            // Create animation config
            const animConfig = {
                key: animName,
                frameRate: config.frameRate || 8,
                repeat: config.repeat !== undefined ? config.repeat : -1
            };
            
            // Handle direct frame references vs generated frames
            if (Array.isArray(config.frames) && typeof config.frames[0] === 'string') {
                // Direct frame references (e.g. ['enemy1_idle_0', 'enemy1_idle_1'])
                animConfig.frames = this.scene.anims.generateFrameNames(this.spriteConfig.key, {
                    frames: config.frames
                });
            } else if (Array.isArray(config.frames) && typeof config.frames[0] === 'number') {
                // Frame indices (e.g. [0, 1, 2, 3])
                animConfig.frames = config.frames.map(frameIndex => {
                    return { key: this.spriteConfig.key, frame: frameIndex };
                });
            } else {
                // Frame name pattern with prefix (e.g. {prefix: 'idle_', start: 0, end: 3})
                const start = config.start || 0;
                const end = config.end || 0;
                const prefix = config.prefix || '';
                const zeroPad = config.zeroPad || 0;
                
                animConfig.frames = this.scene.anims.generateFrameNames(this.spriteConfig.key, {
                    prefix: prefix,
                    start: start, 
                    end: end,
                    zeroPad: zeroPad
                });
            }
            
            // Only create animation if frames were properly generated
            if (animConfig.frames && animConfig.frames.length > 0) {
                // Create the animation
                this.scene.anims.create(animConfig);
            }
        });
    }
    
    /**
     * Play a specific animation
     * @param {string} key - Animation key (idle, run, attack, death, etc)
     * @param {boolean} ignoreIfPlaying - Whether to ignore if already playing
     */
    playAnimation(key, ignoreIfPlaying = false) {
        if (!this.graphics || !this.graphics.anims) return;
        
        const animName = `${this.spriteConfig.key}_${key}`;
        
        // Check if animation exists
        if (!this.scene.anims.exists(animName)) {
            // Fall back to idle if available
            if (key !== 'idle' && this.scene.anims.exists(`${this.spriteConfig.key}_idle`)) {
                this.graphics.play(`${this.spriteConfig.key}_idle`, ignoreIfPlaying);
            } else {
                // If no animations exist, just log a warning and return
                console.warn(`Animation ${animName} not found for ${this.spriteConfig.key}`);
            }
            return;
        }
        
        // Make sure animation is valid with frames
        const anim = this.scene.anims.get(animName);
        if (!anim || !anim.frames || anim.frames.length === 0) {
            console.warn(`Animation ${animName} has no valid frames`);
            return;
        }
        
        try {
            // Play the animation
            this.graphics.play(animName, ignoreIfPlaying);
        } catch (error) {
            console.error(`Error playing animation ${animName}:`, error);
            // Try to recover by using a default frame if available
            if (this.graphics.texture && this.graphics.texture.has(0)) {
                this.graphics.setFrame(0);
            }
        }
    }
    
    /**
     * Handle animation complete events
     * @param {Phaser.Animations.Animation} animation - The animation that completed
     * @param {Phaser.Animations.AnimationFrame} frame - The final animation frame
     */
    onAnimationComplete(animation, frame) {
        // Return to idle after non-looping animations complete
        if (animation.key.includes('attack') || 
            animation.key.includes('shoot') || 
            animation.key.includes('special')) {
            this.playAnimation('idle', false);
        }
    }
    
    /**
     * Update enemy position and behavior each frame
     */
    update() {
        if (!this.active || !this.graphics || !this.graphics.active) return;
        
        // Get player position
        const playerPos = this.scene.player?.getPosition();
        if (!playerPos) return;
        
        // Move towards player
        this.moveTowardsPlayer(playerPos);
        
        // Use run animation when moving
        if (!this.graphics.anims.currentAnim?.key.includes('death')) {
            const dx = this.graphics.x - this.lastX;
            const dy = this.graphics.y - this.lastY;
            const isMoving = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;
            
            // Only switch animation if needed
            if (isMoving && !this.graphics.anims.currentAnim?.key.includes('run')) {
                this.playAnimation('run', false);
            } else if (!isMoving && this.graphics.anims.currentAnim?.key.includes('run')) {
                this.playAnimation('idle', false);
            }
            
            // Check direction for sprite flipping
            if (dx < -0.01) {
                this.graphics.setFlipX(false);
            } else if (dx > 0.01) {
                this.graphics.setFlipX(true);
            }
        }
        
        // Store position for next frame's movement detection
        this.lastX = this.graphics.x;
        this.lastY = this.graphics.y;
        
        // Update faction outline color
        this.updateFactionDisplay();
    }
    
    /**
     * Move towards the player
     * @param {Object} playerPos - Player position {x, y}
     */
    moveTowardsPlayer(playerPos) {
        // Skip if targeting is disabled
        if (this._targetingDisabled) return;
        
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Move towards player
            this.graphics.x += dirX * this.speed;
            this.graphics.y += dirY * this.speed;
        }
    }
    
    /**
     * Update faction-based visual display (outline color)
     */
    updateFactionDisplay() {
        if (!this.graphics) return;
        
        // Color based on group ID (faction)
        const groupId = this.groupId || GROUP_IDS.NEUTRAL;
        let outlineColor = { r: 1.0, g: 1.0, b: 1.0 }; // Default white
        
        // Set outline color based on faction
        switch (groupId) {
            case GROUP_IDS.FRIENDLY:
                outlineColor = { r: 0.0, g: 1.0, b: 0.0 }; // Green
                break;
            case GROUP_IDS.HOSTILE:
                outlineColor = { r: 1.0, g: 0.0, b: 0.0 }; // Red
                break;
            case GROUP_IDS.NEUTRAL:
                outlineColor = { r: 1.0, g: 1.0, b: 0.0 }; // Yellow
                break;
            case GROUP_IDS.FACTION_A:
                outlineColor = { r: 0.0, g: 0.0, b: 1.0 }; // Blue
                break;
            case GROUP_IDS.FACTION_B:
                outlineColor = { r: 1.0, g: 0.5, b: 0.0 }; // Orange
                break;
            case GROUP_IDS.FACTION_C:
                outlineColor = { r: 0.8, g: 0.0, b: 0.8 }; // Purple
                break;
            default:
                outlineColor = { r: 1.0, g: 1.0, b: 1.0 }; // White
        }
        
        // Apply outline color if outline pipeline is active
        if (this.graphics.pipeline && this.graphics.pipeline.setFloat3) {
            this.graphics.pipeline.setFloat3('uOutlineColor', 
                outlineColor.r, outlineColor.g, outlineColor.b);
        }
    }
    
    /**
     * Take damage from player and show feedback
     * @param {number} amount - Amount of damage to take
     */
    takeDamage(amount) {
        super.takeDamage(amount);
        
        // Visual feedback for damage
        if (this.graphics) {
            // Flash white when hit
            this.graphics.setTint(0xffffff);
            
            // Clear tint after delay
            this.scene.time.delayedCall(50, () => {
                if (this.graphics && this.graphics.active) {
                    this.graphics.clearTint();
                }
            });
        }
    }
    
    /**
     * Handle death
     */
    die() {
        // Play death animation if available
        if (this.graphics && !this.graphics.anims.currentAnim?.key.includes('death')) {
            // Try to play death animation
            this.playAnimation('death', false);
            
            // Check if death animation exists
            if (this.graphics.anims.currentAnim?.key.includes('death')) {
                // If death animation exists, wait for it to complete
                this.scene.time.delayedCall(1000, () => {
                    super.die();
                });
                return;
            }
        }
        
        // If no death animation, just die immediately
        super.die();
    }
    
    /**
     * Set enemy group (faction) ID
     * @param {number} groupId - Group/faction ID
     */
    setGroupId(groupId) {
        this.groupId = groupId;
        this.updateFactionDisplay();
    }
    
    /**
     * Enable or disable targeting behavior
     * @param {boolean} disabled - Whether targeting is disabled
     */
    disableTargeting(disabled = true) {
        this._targetingDisabled = disabled;
        
        // When disabled, reset to idle animation
        if (disabled && this.graphics && this.graphics.active) {
            this.playAnimation('idle', false);
        }
    }
    
    /**
     * Get enemy position
     * @returns {Object} Position {x, y}
     */
    getPosition() {
        if (!this.graphics) return { x: 0, y: 0 };
        return { x: this.graphics.x, y: this.graphics.y };
    }
    
    /**
     * Clean up resources when destroying this enemy
     */
    destroy() {
        // Remove animation listeners
        if (this.graphics && this.graphics.off) {
            this.graphics.off('animationcomplete', this.onAnimationComplete, this);
        }
        
        super.destroy();
    }
}