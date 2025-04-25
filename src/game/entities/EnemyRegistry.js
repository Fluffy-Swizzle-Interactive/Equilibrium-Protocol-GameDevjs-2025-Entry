import { SpriteEnemy1 } from './SpriteEnemy1';
import { SpriteEnemy2 } from './SpriteEnemy2';
import { SpriteEnemy3 } from './SpriteEnemy3';
import { SpriteBoss1 } from './SpriteBoss1';

/**
 * EnemyRegistry - Registers and manages different enemy types
 * Acts as a factory for creating enemies based on type
 */
export class EnemyRegistry {
    /**
     * Create a new EnemyRegistry
     * @param {Phaser.Scene} scene - The scene this registry belongs to
     */
    constructor(scene) {
        this.scene = scene;
        
        // Initialize registry maps
        this.enemyTypes = new Map();
        this.bossTypes = new Map();
        
        // Register default enemy types
        this.registerDefaultEnemies();
    }
    
    /**
     * Register default enemy types
     */
    registerDefaultEnemies() {
        // Register regular enemies
        this.registerEnemyType('enemy1', SpriteEnemy1);
        this.registerEnemyType('enemy2', SpriteEnemy2);
        this.registerEnemyType('enemy3', SpriteEnemy3);
        
        // Register boss enemies
        this.registerBossType('boss1', SpriteBoss1);
    }
    
    /**
     * Register a new enemy type
     * @param {string} type - Enemy type identifier
     * @param {Class} enemyClass - Enemy class to instantiate
     */
    registerEnemyType(type, enemyClass) {
        this.enemyTypes.set(type, enemyClass);
    }
    
    /**
     * Register a new boss enemy type
     * @param {string} type - Boss type identifier
     * @param {Class} bossClass - Boss class to instantiate
     */
    registerBossType(type, bossClass) {
        this.bossTypes.set(type, bossClass);
    }
    
    /**
     * Create an enemy of the specified type
     * @param {string} type - Enemy type to create
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {boolean} fromPool - Whether this enemy is from a pool
     * @returns {Object} The created enemy instance
     */
    createEnemy(type, x, y, fromPool = false) {
        // Get the enemy class for this type
        const EnemyClass = this.enemyTypes.get(type);
        
        if (!EnemyClass) {
            console.warn(`Enemy type '${type}' not registered. Using default enemy1.`);
            const DefaultClass = this.enemyTypes.get('enemy1');
            return new DefaultClass(this.scene, x, y, fromPool);
        }
        
        return new EnemyClass(this.scene, x, y, fromPool);
    }
    
    /**
     * Create a boss enemy of the specified type
     * @param {string} type - Boss type to create
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {boolean} fromPool - Whether this boss is from a pool
     * @returns {Object} The created boss instance
     */
    createBoss(type, x, y, fromPool = false) {
        // Get the boss class for this type
        const BossClass = this.bossTypes.get(type);
        
        if (!BossClass) {
            console.warn(`Boss type '${type}' not registered. Using default boss1.`);
            const DefaultBossClass = this.bossTypes.get('boss1');
            return new DefaultBossClass(this.scene, x, y, fromPool);
        }
        
        return new BossClass(this.scene, x, y, fromPool);
    }
    
    /**
     * Get a random enemy type based on weights
     * @param {Object} weights - Optional weight configuration for enemy types
     * @returns {string} Random enemy type
     */
    getRandomEnemyType(weights = null) {
        // Default weights if not provided
        const typeWeights = weights || {
            enemy1: 0.6, // 60% chance for basic enemy
            enemy2: 0.25, // 25% chance for tank enemy
            enemy3: 0.15  // 15% chance for ranged enemy
        };
        
        // Validate weights include only registered types
        const validTypes = [];
        const validWeights = [];
        let totalWeight = 0;
        
        for (const [type, weight] of Object.entries(typeWeights)) {
            if (this.enemyTypes.has(type)) {
                validTypes.push(type);
                validWeights.push(weight);
                totalWeight += weight;
            }
        }
        
        if (validTypes.length === 0) {
            console.warn('No valid enemy types found. Using default enemy1.');
            return 'enemy1';
        }
        
        // Normalize weights
        for (let i = 0; i < validWeights.length; i++) {
            validWeights[i] /= totalWeight;
        }
        
        // Random selection based on weights
        const rand = Math.random();
        let cumulativeWeight = 0;
        
        for (let i = 0; i < validTypes.length; i++) {
            cumulativeWeight += validWeights[i];
            if (rand <= cumulativeWeight) {
                return validTypes[i];
            }
        }
        
        // Fallback
        return validTypes[0];
    }
    
    /**
     * Get a random boss type
     * @returns {string} Random boss type
     */
    getRandomBossType() {
        const bossTypes = Array.from(this.bossTypes.keys());
        
        if (bossTypes.length === 0) {
            console.warn('No boss types registered. Using default boss1.');
            return 'boss1';
        }
        
        // Select random boss type
        const randomIndex = Math.floor(Math.random() * bossTypes.length);
        return bossTypes[randomIndex];
    }
}