import { SpriteEnemy } from './SpriteEnemy';

/**
 * SpriteEnemy1 - Sprite-based implementation of the basic enemy type
 * A simple melee enemy that chases the player
 */
export class SpriteEnemy1 extends SpriteEnemy {
    /**
     * Create a new SpriteEnemy1 instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        // Configure the sprite settings for Enemy1
        const spriteConfig = {
            key: 'enemy1',
            scale: 1.2,
            animations: {
                idle: {
                    frames: [0, 1, 2, 3].map(i => `enemy1_idle_${i}`),
                    frameRate: 5,
                    repeat: -1
                },
                run: {
                    frames: [0, 1, 2, 3].map(i => `enemy1_run_${i}`),
                    frameRate: 8,
                    repeat: -1
                },
                death: {
                    frames: [0, 1, 2, 3, 4, 5, 6, 7].map(i => `enemy1_death_${i}`),
                    frameRate: 10,
                    repeat: 0
                },
                shoot: {
                    frames: [0, 1, 2, 3].map(i => `enemy1_shoot_${i}`),
                    frameRate: 8,
                    repeat: 0
                }
            }
        };
        
        super(scene, x, y, fromPool, spriteConfig);
        this.type = 'enemy1';
    }
    
    /**
     * Initialize enemy properties
     * @override
     */
    initProperties() {
        // Basic enemy stats
        this.speed = 0.6;
        this.size = 14;
        this.health = 20;
        this.damage = 10;
        this.scoreValue = 10;
    }
}