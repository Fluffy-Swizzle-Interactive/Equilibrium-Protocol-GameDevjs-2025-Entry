import { BaseEnemy } from './BaseEnemy';

/**
 * Enemy1 - Basic enemy type 
 * Fast but weak enemies that chase the player
 */
export class Enemy1 extends BaseEnemy {
    /**
     * Create a new Enemy1 instance
     * @param {Phaser.Scene} scene - The scene this enemy belongs to
     * @param {number} x - Initial x coordinate
     * @param {number} y - Initial y coordinate
     * @param {boolean} fromPool - Whether this enemy is from an object pool
     */
    constructor(scene, x, y, fromPool = false) {
        super(scene, x, y, fromPool);
        this.type = 'enemy1';
    }
    
    /**
     * Initialize enemy properties
     * @override
     */
    initProperties() {
        // Fast but weak enemies
        this.speed = 0.7; // Faster than base
        this.size = 12;   // Smaller than base
        this.color = 0x00ff00; // Green color
        this.health = 10;  // Less health
        this.baseHealth = 10;
        this.damage = 30;
        this.scoreValue = 10;
    }
    
    /**
     * Custom movement pattern - slight zigzag approach
     * @param {Object} playerPos - The player's position {x, y}
     * @override
     */
    moveTowardsPlayer(playerPos) {
        // Calculate direction to player
        const dx = playerPos.x - this.graphics.x;
        const dy = playerPos.y - this.graphics.y;
        
        // Normalize the direction
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Only move if not at the player's position
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Add very subtle zigzag motion effect based on time (significantly reduced)
            const offset = Math.sin(this.scene.time.now / 400) * 0.15;
            
            // Apply zigzag perpendicular to movement direction
            const perpX = -dirY;
            const perpY = dirX;
            
            // Move toward player with subtle zigzag
            this.graphics.x += (dirX + perpX * offset) * this.speed;
            this.graphics.y += (dirY + perpY * offset) * this.speed;
        }
    }
}