import { DEPTHS } from '../constants';
import { PlayerHealth } from './PlayerHealth';
import { SETTINGS } from '../constants';
import { EventBus } from '../EventBus';
import { WeaponManager } from '../managers/WeaponManager';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;

        // Initialize core properties
        this.SETTINGS = SETTINGS;
        this.initPhysicsProperties();
        this.initGraphics(x, y);
        this.initSounds();
        this.createAnimations();

        // Initialize health system
        this.healthSystem = new PlayerHealth(scene, {
            maxHealth: 100,
            invulnerabilityTime: 1000,
            damageResistance: 0 // Start with 0% defense
        });

        // Collection properties
        // These are now just fallbacks in case collectibleManager isn't initialized
        this.xpCollectionRadius = 40;
        this.cashCollectionRadius = 40;

        // Timing properties
        this.lastMovementTime = 0;

        // Initialize upgrade tracking
        this.upgrades = {
            health: 0,
            armor: 0,
            speed: 0,
            weaponDamage: 0,
            fireRate: 0,
            pierce: 0
        };

        // Initialize player credits
        this.credits = 100; // Starting credits
    }

    /**
     * Initialize the weapon system with the specified weapon type
     * @param {string} weaponType - The weapon type ('minigun' or 'shotgun')
     */
    initWeaponSystem(weaponType = 'minigun') {
        // Create the weapon manager
        this.weaponManager = new WeaponManager(this.scene, this, {
            weaponType: weaponType,
            maxDrones: 0, // Start with no drones
            bulletRange: 600
        });

        // Store weapon type on player for backward compatibility
        this.gameMode = weaponType;
    }

    /**
     * Apply an upgrade to the player
     * @param {Object} upgrade - The upgrade to apply
     * @returns {boolean} - Whether the upgrade was applied successfully
     */
    applyUpgrade(upgrade) {
        // Make sure the upgrade is valid
        if (!upgrade || !upgrade.type) {
            console.warn('Invalid upgrade provided:', upgrade);
            return false;
        }

        // Apply different effects based on upgrade type
        switch (upgrade.type) {
            case 'Health':
                // Increase max health by 20%
                if (this.healthSystem) {
                    const currentMax = this.healthSystem.getMaxHealth();
                    const healthIncrease = Math.round(currentMax * 0.2);
                    this.healthSystem.setMaxHealth(currentMax + healthIncrease);

                    // Also heal the player for the increase amount
                    this.healthSystem.heal(healthIncrease);

                    // Track upgrade
                    this.upgrades.health++;
                }
                break;

            case 'Armor':
                // Decrease damage taken by 15%
                if (this.healthSystem) {
                    const currentResistance = this.healthSystem.getDamageResistance() || 0;

                    // Check if already at max defense (25%)
                    if (currentResistance >= 0.25) {
                        console.log('Player already at maximum defense (25%). Upgrade not applied.');
                        return false; // Indicate upgrade wasn't applied
                    }

                    const newResistance = currentResistance + 0.15; // 15% more damage resistance
                    this.healthSystem.setDamageResistance(newResistance);

                    // Track upgrade
                    this.upgrades.armor++;
                }
                break;

            case 'Speed':
                // Increase movement speed by 15%
                this.speed *= 1.15;

                // Track upgrade
                this.upgrades.speed++;
                break;

            case 'Drone':
                // Add a drone if weapon manager exists
                if (this.weaponManager) {
                    const newDrone = this.weaponManager.upgradeDrones();
                    if (newDrone) {
                        // Track upgrade (we could add a specific drone counter if needed)
                        return true;
                    } else {
                        return false; // Failed to add drone
                    }
                }
                break;

            default:
                console.warn(`Unknown upgrade type: ${upgrade.type}`);
                return false;
        }

        // Emit event for upgrading player
        EventBus.emit('player-upgraded', {
            upgradeType: upgrade.type,
            level: this.upgrades[upgrade.type.toLowerCase()]
        });

        return true;
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
        // Sound initialization is now handled by WeaponManager
    }

    update() {
        this.updateMovement();
        this.updateAiming();
        this.updateAnimation();

        // Update weapon manager if it exists
        if (this.weaponManager) {
            this.weaponManager.update();
        }

        // Collectibles are now handled by the collectible manager
        // The old methods are kept as fallbacks for backward compatibility
        if (!this.scene.collectibleManager) {
            this.checkXPCollection();
            this.checkCashCollection();
        }
    }

    /**
     * Check for and collect nearby XP pickups
     * @deprecated Use CollectibleManager instead
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
     * @deprecated Use CollectibleManager instead
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

    /**
     * Shoot a bullet or multiple bullets based on weapon type
     * @returns {boolean} Whether a shot was successfully fired
     */
    shoot() {
        if (!this.weaponManager) return false;

        // Use the weapon manager to handle shooting
        const didShoot = this.weaponManager.shoot(this.targetX, this.targetY);

        if (didShoot) {
            // Also fire from drones
            this.weaponManager.shootDrones(this.targetX, this.targetY);
        }

        return didShoot;
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
        // Clean up weapon manager
        if (this.weaponManager) {
            this.weaponManager.destroy();
            this.weaponManager = null;
        }

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
