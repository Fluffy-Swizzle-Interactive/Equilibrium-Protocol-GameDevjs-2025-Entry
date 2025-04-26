import { DEPTHS } from '../constants';

/**
 * PlayerDrone class
 * A companion drone that orbits the player and fires projectiles
 */
export class PlayerDrone {
    /**
     * Create a new player drone
     * @param {Phaser.Scene} scene - The scene this drone belongs to
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position 
     * @param {Player} player - Reference to the player
     * @param {number} index - Index of this drone in the drone array
     */
    constructor(scene, x, y, player, index = 0) {
        this.scene = scene;
        this.player = player;
        this.index = index;
        
        // Configuration
        this.orbitRadius = 120;  // Base orbit radius around player
        this.orbitSpeed = 0.003; // Speed of orbit rotation
        
        // Calculate the total number of drones (including this one)
        const totalDrones = scene.weaponManager ? 
                           (scene.weaponManager.drones ? scene.weaponManager.drones.length + 1 : 1) : 
                           1;
        
        // Calculate angle offset to distribute drones evenly around the orbit
        this.orbitOffset = (2 * Math.PI / totalDrones) * index;
        
        this.radius = 12;       // Drone collision radius
        
        // Initialize graphics
        this.initGraphics(x, y);
        
        // Add custom properties for tracking orbit
        this.angle = this.orbitOffset;
        this.targetX = x;
        this.targetY = y;
        
        // Register with scene for updating
        if (!scene.drones) {
            scene.drones = [];
        }
        scene.drones.push(this);
    }
    
    /**
     * Initialize drone graphics
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     */
    initGraphics(x, y) {
        // Use drone sprite atlas for our drone
        if (this.scene.textures.exists('drone')) {
            this.graphics = this.scene.add.sprite(x, y, 'drone');
            
            // Create drone animation if it doesn't exist
            if (!this.scene.anims.exists('drone_hover')) {
                this.scene.anims.create({
                    key: 'drone_hover',
                    frames: this.scene.anims.generateFrameNames('drone', {
                        prefix: 'drone_',
                        start: 0,
                        end: 5,
                        suffix: '.png'
                    }),
                    frameRate: 12,
                    repeat: -1
                });
            }
            
            // Play the hover animation
            this.graphics.play('drone_hover');
            
            // Scale to an appropriate size (increased by 75% from 0.5)
            this.graphics.setScale(0.8);
            
            // Use appropriate depth to appear below player but above bullets
            this.graphics.setDepth(DEPTHS.PLAYER - 1);
        } else {
            // Fallback to testplayer sprite if drone texture not available
            if (this.scene.textures.exists('testplayer')) {
                this.graphics = this.scene.add.sprite(x, y, 'testplayer');
                this.graphics.setScale(0.05);
            } else {
                // Fallback to a simple circle if no textures available
                this.graphics = this.scene.add.circle(x, y, this.radius, 0x00ffff);
            }
            this.graphics.setDepth(DEPTHS.PLAYER - 1);
        }
        
        // Add orbit visualization (for debug purposes)
        if (this.scene.isDev) {
            this.debugOrbit = this.scene.add.graphics();
            this.debugOrbit.lineStyle(1, 0x00ffff, 0.3);
            this.debugOrbit.strokeCircle(x, y, this.orbitRadius);
            this.debugOrbit.setDepth(DEPTHS.EFFECTS_LOW);
        }
    }
    
    /**
     * Update drone position and behavior
     */
    update() {
        const playerPos = this.player.getPosition();
        
        // Update angle based on orbit speed
        this.angle += this.orbitSpeed;
        
        // Calculate position in orbit around player
        const orbitDistance = this.orbitRadius + (Math.sin(this.angle * 5) * 5); // Small orbit radius variation
        const targetX = playerPos.x + (Math.cos(this.angle) * orbitDistance);
        const targetY = playerPos.y + (Math.sin(this.angle) * orbitDistance);
        
        // Apply position
        this.graphics.x = targetX;
        this.graphics.y = targetY;
        
        // Store target position
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Update debug orbit visualization if present
        if (this.debugOrbit) {
            this.debugOrbit.clear();
            this.debugOrbit.lineStyle(1, 0x00ffff, 0.3);
            this.debugOrbit.strokeCircle(playerPos.x, playerPos.y, this.orbitRadius);
        }
        
        // Update drone rotation to face orbit direction
        const facingAngle = this.angle + (Math.PI / 2);
        this.graphics.rotation = facingAngle;
        
        // Check if cursor is within minimum shooting range and update tint
        this.updateShootingRangeTint();
    }
    
    /**
     * Update the drone's tint based on whether it can shoot at the current target
     * A red tint indicates the drone cannot shoot (target too close)
     */
    updateShootingRangeTint() {
        if (!this.scene.input || !this.scene.input.activePointer) return;
        
        // Get the current cursor position (target)
        const targetX = this.scene.input.activePointer.worldX;
        const targetY = this.scene.input.activePointer.worldY;
        
        // Calculate distance from drone to cursor/target
        const dx = targetX - this.graphics.x;
        const dy = targetY - this.graphics.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Minimum distance check - same logic used in WeaponManager.shootDrones
        const minShootDistance = this.orbitRadius;
        
        if (distance <= minShootDistance) {
            // Target too close - cannot shoot - apply red tint
            this.graphics.setTint(0xff6666); // Light red tint
        } else {
            // Can shoot - clear tint
            this.graphics.clearTint();
        }
    }
    
    /**
     * Get the drone's current position
     * @returns {Object} Object containing x and y coordinates
     */
    getPosition() {
        return {
            x: this.graphics.x,
            y: this.graphics.y
        };
    }
    
    /**
     * Shoot a projectile in the specified direction
     * This method will be called by WeaponManager
     * @param {number} dirX - X direction component
     * @param {number} dirY - Y direction component
     */
    shoot(dirX, dirY) {
        // The actual bullet creation is handled by WeaponManager.createBulletFromDrone
        // This method is here for potential future functionality
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.graphics) {
            this.graphics.destroy();
        }
        
        if (this.debugOrbit) {
            this.debugOrbit.destroy();
        }
        
        // Remove from scene's drone list if present
        if (this.scene && this.scene.drones) {
            const index = this.scene.drones.indexOf(this);
            if (index !== -1) {
                this.scene.drones.splice(index, 1);
            }
        }
        
        // Clear references
        this.player = null;
        this.scene = null;
    }
}