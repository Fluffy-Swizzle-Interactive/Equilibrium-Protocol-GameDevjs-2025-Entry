import { DEPTHS } from '../constants';
import { PlayerHealth } from './PlayerHealth';
import { SETTINGS } from '../constants';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Initialize core properties
        this.SETTINGS = SETTINGS;
        this.initPhysicsProperties();
        this.initWeaponProperties(scene.gameMode || 'minigun');
        this.initGraphics(x, y);
        this.initSounds();
        this.createAnimations();
        
        
        // Initialize health system
        this.healthSystem = new PlayerHealth(scene, {
            maxHealth: 100,
            invulnerabilityTime: 1000
        });
        
        // Cash collection properties
        this.cashCollectionRadius = 40;
        this.lastCashCollectionTime = 0;
        this.cashCollectionInterval = 100; // Check for cash pickups every 100ms
        
        // Timing properties
        this.lastFireTime = 0;
        this.lastMovementTime = 0;
    }

    // Add a takeDamage method that delegates to the health system
    /**
     * Apply damage to the player
     * @param {number} amount - Amount of damage to take
     * @returns {boolean} Whether the player died from this damage
     */
    takeDamage(amount) {
        if (this.healthSystem) {
            return this.healthSystem.takeDamage(amount);
        }
        return false;
    }
    
    /**
     * Initialize physics-related properties
     */
    initPhysicsProperties() {
        this.speed = this.SETTINGS.PLAYER_SPEED;
        this.velX = 0;
        this.velY = 0;
        this.friction = this.SETTINGS.PLAYER_FRICTION;
        this.acceleration = this.SETTINGS.PLAYER_ACCELERATION;
        this.radius = this.SETTINGS.PLAYER_RADIUS; // Still need this for collision detection
        
        // Aiming properties
        this.maxMouseDistance = 300;
        this.targetX = null;
        this.targetY = null;

        // Direction enum for 4-way sprite animation
        this.directions = {
            DOWN: 'down',
            RIGHT: 'right',
            UP: 'up',
            LEFT: 'left'
        };
        
        // Current direction (default: DOWN)
        this.currentDirection = this.directions.DOWN;
        
        // Track movement status for animation control
        this.isMoving = false;
        this.animationSpeed = 8; // Frames per second for walk animation
    }
    
    /**
     * Initialize weapon-specific properties based on game mode
     * @param {string} gameMode - The weapon mode ('minigun' or 'shotgun')
     */
    initWeaponProperties(gameMode) {
        this.gameMode = gameMode;
        
        if (this.gameMode === 'minigun') {
            this.fireRate = this.SETTINGS.MINIGUN_FIRE_RATE;
            this.caliber = this.SETTINGS.MINIGUN_BULLET_CALIBER;
            this.bulletSpeed = this.SETTINGS.MINIGUN_BULLET_SPEED;
            this.bulletDamage = this.SETTINGS.MINIGUN_BULLET_DAMAGE;
            this.bulletColor = 0xffff00; // Yellow
            this.bulletHealth = this.SETTINGS.MINIGUN_BULLET_HEALTH; // Health of the bullet
        } else if (this.gameMode === 'shotgun') {
            this.fireRate = this.SETTINGS.SHOTGUN_FIRE_RATE;
            this.caliber = this.SETTINGS.SHOTGUN_BULLET_CALIBER;
            this.bulletSpeed = this.SETTINGS.SHOTGUN_BULLET_SPEED;
            this.bulletDamage = this.SETTINGS.SHOTGUN_BULLET_DAMAGE;
            this.bulletColor = 0xff6600; // Orange
            this.spreadAngle = this.SETTINGS.SHOTGUN_SPREAD_ANGLE;
            this.bulletCount = this.SETTINGS.SHOTGUN_BULLET_COUNT;
            this.bulletHealth = this.SETTINGS.SHOTGUN_BULLET_HEALTH; // Health of the bullet
        }
    }
    
    /**
     * Initialize visual elements for the player
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    initGraphics(x, y) {
        // First check if the texture atlas exists
        if (!this.scene.textures.exists('player')) {
            console.warn('Player atlas texture not found. Will attempt to use individual sprites.');
            this.useAtlas = false;
        } else {
            this.useAtlas = true;
        }
        
        // Create the player sprite using the best available option
        if (this.useAtlas) {
            // Use the atlas
            this.graphics = this.scene.add.sprite(x, y, 'player');
        } else {
            // Fall back to individual images
            this.graphics = this.scene.add.sprite(x, y, 'down1');
        }
        
        this.graphics.setDepth(DEPTHS.PLAYER);
        
        // Calculate appropriate scale based on collision radius
        this.adjustSpriteScale();
        
        // Create line and cursor for aiming
        this.line = this.scene.add.graphics();
        this.line.setDepth(DEPTHS.PLAYER_UI);
        
        this.cursorCircle = this.scene.add.graphics();
        this.cursorCircle.setDepth(DEPTHS.PLAYER_UI);
        
        // Make these graphics follow the camera
        this.line.setScrollFactor(1);
        this.cursorCircle.setScrollFactor(1);
    }
    
    /**
     * Adjust sprite scale based on available textures and collision radius
     */
    adjustSpriteScale() {
        let baseWidth, baseHeight;
        
        if (this.useAtlas) {
            const baseFrame = this.scene.textures.getFrame('player', 'down1.png');
            if (baseFrame) {
                baseWidth = baseFrame.width;
                baseHeight = baseFrame.height;
            }
        } else if (this.scene.textures.exists('down1')) {
            const baseFrame = this.scene.textures.getFrame('down1');
            if (baseFrame) {
                baseWidth = baseFrame.width;
                baseHeight = baseFrame.height;
            }
        }
        
        if (baseWidth && baseHeight) {
            // Scale to match collision radius, with some adjustment for visual size
            const scaleValue = (this.radius * 2.5) / Math.min(baseWidth, baseHeight);
            this.graphics.setScale(scaleValue);
        } else {
            // Fallback scale if we can't get frame dimensions
            this.graphics.setScale(0.25);
        }
    }

    /**
     * Create player animations from the sprite atlas or individual frames
     */
    createAnimations() {
        const anims = this.scene.anims;
        const frameRate = this.animationSpeed;

        // Helper function to check if we can create an animation
        const canCreateAnimation = (key, frames) => {
            if (anims.exists(key)) return false;
            
            // Check if all frames are available
            if (this.useAtlas) {
                return frames.every(frame => 
                    this.scene.textures.getFrame('player', frame.frame || frame) !== null
                );
            } else {
                return frames.every(key => this.scene.textures.exists(key));
            }
        };
        
        // Helper function to create animation with proper frame references
        const createAnimation = (key, frameNames, options = {}) => {
            try {
                if (this.useAtlas) {
                    // Using the atlas
                    anims.create({
                        key,
                        frames: frameNames.map(frame => ({ key: 'player', frame })),
                        frameRate: options.frameRate || frameRate,
                        repeat: options.repeat !== undefined ? options.repeat : -1
                    });
                } else {
                    // Using individual images
                    anims.create({
                        key,
                        frames: frameNames.map(frame => ({ key: frame.replace('.png', '') })),
                        frameRate: options.frameRate || frameRate,
                        repeat: options.repeat !== undefined ? options.repeat : -1
                    });
                }
                
                if (this.scene.isDev) {
                    console.debug(`Created animation: ${key}`);
                }
            } catch (error) {
                console.warn(`Failed to create animation ${key}:`, error);
            }
        };

        // Define all frame sequences
        const animations = {
            'player-walk-down': ['down1.png', 'down2.png', 'down3.png', 'down4.png'],
            'player-walk-up': ['up1.png', 'up2.png', 'up3.png', 'up4.png'],
            'player-walk-left': ['left1.png', 'left2.png', 'left3.png', 'left4.png'],
            'player-walk-right': ['right1.png', 'right2.png', 'right3.png', 'right4.png'],
            
            // Idle animations (single frame)
            'player-idle-down': ['down1.png'],
            'player-idle-up': ['up1.png'],
            'player-idle-left': ['left1.png'],
            'player-idle-right': ['right1.png']
        };
        
        // Create all animations
        Object.entries(animations).forEach(([key, frames]) => {
            // Check if the animation can be created (frames exist)
            if (canCreateAnimation(key, frames)) {
                // Create with appropriate options (idle animations don't repeat)
                const isIdle = key.includes('idle');
                createAnimation(key, frames, { 
                    frameRate: isIdle ? 1 : frameRate,
                    repeat: isIdle ? 0 : -1
                });
            } else if (!anims.exists(key)) {
                console.warn(`Cannot create animation ${key}: frames not available`);
            }
        });

        // Start with idle animation
        this.graphics.play('player-idle-down');
    }
    
    /**
     * Initialize sound effects for the player
     */
    initSounds() {
        // Check if soundManager exists - it should be created in the Game scene
        if (!this.scene.soundManager) {
            console.warn('SoundManager not found in scene. Weapon sounds will not be played.');
            return;
        }

        // Use the sound effects that have already been initialized by the scene
        if (this.gameMode === 'minigun') {
            this.soundKey = 'shoot_minigun';
        } else if (this.gameMode === 'shotgun') {
            this.soundKey = 'shoot_shotgun';
        }
    }
    
    update() {
        this.updateMovement();
        this.updateAiming();
        this.updateAnimation();
        this.checkXPCollection();
        this.checkCashCollection();
    }
    
    /**
     * Check for and collect nearby XP pickups
     */
    checkXPCollection() {
        const currentTime = this.scene.time.now;
        
        // Only check for XP pickups at the specified interval
        if (currentTime - this.lastXpCollectionTime < this.xpCollectionInterval) {
            return;
        }
        
        this.lastXpCollectionTime = currentTime;
        
        // Make sure we have access to required objects
        if (!this.scene.spritePool || !this.scene.xpManager) {
            return;
        }
        
        // Check for XP pickups within collection radius
        this.scene.spritePool.checkCollision(
            this.graphics.x, 
            this.graphics.y, 
            this.xpCollectionRadius, 
            (xpSprite) => {
                if (xpSprite && xpSprite.customData && xpSprite.customData.value) {
                    // Add XP to player
                    this.scene.xpManager.addXP(xpSprite.customData.value);
                    
                    // Play XP collection sound
                    if (this.scene.soundManager) {
                        // Use existing sound effect if available, otherwise use a fallback
                        const soundKey = this.scene.soundManager.hasSound('xp_collect') 
                            ? 'xp_collect' 
                            : 'shoot_minigun'; // Fallback to an existing sound

                        this.scene.soundManager.playSoundEffect(soundKey, {
                            detune: 1200, // Higher pitch for XP collection
                            volume: 0.3
                        });
                    }
                }
                
                // Return true to confirm this pickup should be removed
                return true;
            },
            'xp_pickup' // Type of sprite to check for
        );
    }

    /**
     * Check for and collect nearby cash pickups
     */
    checkCashCollection() {
        const currentTime = this.scene.time.now;
        
        // Only check for cash pickups at the specified interval
        if (currentTime - this.lastCashCollectionTime < this.cashCollectionInterval) {
            return;
        }
        
        this.lastCashCollectionTime = currentTime;
        
        // Make sure we have access to required objects
        if (!this.scene.spritePool || !this.scene.cashManager) {
            console.warn('Missing required components for cash collection:', 
                         !this.scene.spritePool ? 'spritePool' : '', 
                         !this.scene.cashManager ? 'cashManager' : '');
            return;
        }
        
        // Check for cash pickups within collection radius
        const collectedItems = this.scene.spritePool.checkCollision(
            this.graphics.x, 
            this.graphics.y, 
            this.cashCollectionRadius, 
            (cashSprite) => {
                if (cashSprite && cashSprite.customData) {
                    // Verify this is a cash pickup
                    if (cashSprite.customData.type === 'cash_pickup' && cashSprite.customData.value) {
                        const amount = cashSprite.customData.value;
                        
                        // Add cash to player
                        this.scene.cashManager.addCash(amount);
                        
                        // Play cash collection sound
                        if (this.scene.soundManager) {
                            const soundKey = this.scene.soundManager.hasSound('cash_pickup') 
                                ? 'cash_pickup' 
                                : 'laserShoot';
                                
                            this.scene.soundManager.playSoundEffect(soundKey, {
                                detune: 600,
                                volume: 0.3
                            });
                        }
                    }
                }
                
                // Return true to confirm this pickup should be removed
                return true;
            }
        );
    }
    
    updateMovement() {
        // Get keyboard references from scene
        const keys = this.scene.wasd;
        
        // Track previous velocity to detect if we just started/stopped moving
        const prevVelX = this.velX;
        const prevVelY = this.velY;
        
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
        
        // Update movement state for animation purposes
        const isMovingNow = Math.abs(this.velX) > 0.1 || Math.abs(this.velY) > 0.1;
        if (isMovingNow !== this.isMoving) {
            this.isMoving = isMovingNow;
        }
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
        
        // Update sprite direction based on angle
        this.updateSpriteDirection(angle);
        
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

    /**
     * Update sprite direction based on the angle to target
     * @param {number} angle - Angle in radians from player to target
     */
    updateSpriteDirection(angle) {
        // Convert angle to degrees
        const degrees = Phaser.Math.RadToDeg(angle);
        
        // Determine direction based on angle
        let newDirection;
        
        // Right quadrant (315° to 45°)
        if (degrees >= -45 && degrees < 45) {
            newDirection = this.directions.RIGHT;
        } 
        // Down quadrant (45° to 135°)
        else if (degrees >= 45 && degrees < 135) {
            newDirection = this.directions.DOWN;
        } 
        // Left quadrant (135° to 225°)
        else if ((degrees >= 135 && degrees <= 180) || (degrees >= -180 && degrees < -135)) {
            newDirection = this.directions.LEFT;
        } 
        // Up quadrant (225° to 315°)
        else {
            newDirection = this.directions.UP;
        }
        
        // Update the direction if it has changed
        if (newDirection !== this.currentDirection) {
            this.currentDirection = newDirection;
            // Animation will be updated in updateAnimation()
        }
    }
    
    /**
     * Update player animation based on movement and direction
     */
    updateAnimation() {
        // Check if animations are available in the scene
        if (!this.scene.anims || Object.keys(this.scene.anims.anims.entries).length === 0) {
            return;
        }
        
        let animKey;
        
        // Choose animation based on movement state and direction
        if (this.isMoving) {
            animKey = `player-walk-${this.currentDirection}`;
        } else {
            animKey = `player-idle-${this.currentDirection}`;
        }
        
        // Make sure the animation exists before trying to play it
        if (this.scene.anims.exists(animKey) && this.graphics.anims.currentAnim?.key !== animKey) {
            this.graphics.play(animKey);
        } else if (!this.scene.anims.exists(animKey)) {
            // If animation doesn't exist, try to use a fallback frame instead
            if (this.useAtlas) {
                const frameName = `${this.currentDirection}1.png`;
                if (this.scene.textures.getFrame('player', frameName)) {
                    this.graphics.setTexture('player', frameName);
                }
            } else {
                const frameKey = `${this.currentDirection}1`;
                if (this.scene.textures.exists(frameKey)) {
                    this.graphics.setTexture(frameKey);
                }
            }
        }
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
        // Use bullet pool instead of direct creation
        if (this.scene.bulletPool) {
            return this.scene.bulletPool.createMinigunBullet(
                spawnX, spawnY, dirX, dirY,
                this.bulletSpeed, this.bulletHealth,
                this.bulletColor, this.caliber
            );
        } else {
            // Fallback to old method if bulletPool not available
            const bullet = this.scene.add.circle(spawnX, spawnY, this.caliber, this.bulletColor);
            
            // Add bullet properties
            bullet.dirX = dirX;
            bullet.dirY = dirY;
            bullet.speed = this.bulletSpeed;
            bullet.health = this.bulletHealth;
            
            // Add bullet to group
            this.scene.bullets.add(bullet);
            return bullet;
        }
    }

    createShotgunBullets(spawnX, spawnY, dirX, dirY) {
        // Use bullet pool instead of direct creation
        if (this.scene.bulletPool) {
            return this.scene.bulletPool.createShotgunBullets(
                spawnX, spawnY, dirX, dirY,
                this.bulletSpeed, this.bulletHealth,
                this.bulletColor, this.caliber,
                this.bulletCount, this.spreadAngle
            );
        } else {
            // Fallback to old method if bulletPool not available
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
                bullet.health = this.bulletHealth;
                
                // Add bullet to group
                this.scene.bullets.add(bullet);
                bullets.push(bullet);
            }
            
            return bullets;
        }
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
        
        // Play shooting sound using SoundManager
        this.playWeaponSound();
        
        return true; // Successfully shot
    }

    /**
     * Play the weapon sound with error handling
     * @private
     */
    playWeaponSound() {
        // Don't try to play sounds if soundManager or soundKey aren't available
        if (!this.scene.soundManager || !this.soundKey) return;
        
        try {
            // Add slight pitch variation for more realistic sound
            const detune = Math.random() * 200 - 100; // Random detune between -100 and +100
            
            // If this is the first shot, force an unlock of the audio context
            if (!this.hasPlayedSound && this.scene.sound.locked) {
                this.scene.sound.unlock();
            }
            
            this.scene.soundManager.playSoundEffect(this.soundKey, { detune });
            this.hasPlayedSound = true;
        } catch (error) {
            console.warn('Error playing weapon sound:', error);
        }
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
    
    /**
     * Set the player's position
     * @param {number} x - New X position
     * @param {number} y - New Y position
     */
    setPosition(x, y) {
        if (this.graphics) {
            this.graphics.x = x;
            this.graphics.y = y;
            
            // Reset velocity to prevent momentum carrying over to new map
            this.velX = 0;
            this.velY = 0;
        }
    }
    
    getPosition() {
        return {
            x: this.graphics.x,
            y: this.graphics.y
        };
    }

    /**
     * Clean up player resources
     * Called when the player is being removed or reinitialized
     */
    destroy() {
        // Clean up graphics objects
        if (this.graphics) {
            this.graphics.destroy();
        }
        
        if (this.line) {
            this.line.destroy();
        }
        
        if (this.cursorCircle) {
            this.cursorCircle.destroy();
        }
        
        // Clean up any active tweens related to this player
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this.graphics);
        }
        
        // Reset properties to avoid memory leaks
        this.velX = 0;
        this.velY = 0;
        this.targetX = null;
        this.targetY = null;
    }
}
