import { BaseEnemy } from '../entities/BaseEnemy';
import { Enemy1 } from '../entities/Enemy1';
import { Enemy2 } from '../entities/Enemy2';
import { Enemy3 } from '../entities/Enemy3';
import { Boss1 } from '../entities/Boss1';
import { GroupId } from '../constants';

/**
 * EnemyRegistry - Centralized registry for all enemy types
 * Provides a single source of truth for enemy configurations and factory methods
 */
export class EnemyRegistry {
    /**
     * Create a new enemy registry
     * @param {Phaser.Scene} scene - The scene this registry belongs to
     */
    constructor(scene) {
        this.scene = scene;
        
        // Registry of available enemy types and their constructors
        this.enemyConstructors = new Map();
        
        // Registry of enemy configurations
        this.enemyConfigs = new Map();
        
        // Default pool options by enemy type
        this.poolOptions = new Map();
        
        // Register default enemy types
        this.registerDefaultEnemies();
    }
    
    /**
     * Register all default enemy types
     * @private
     */
    registerDefaultEnemies() {
        // Register Enemy1
        this.registerEnemyType('enemy1', Enemy1, {
            speed: 0.7,
            size: 12,
            color: 0x00ff00,
            health: 10,
            damage: 30,
            scoreValue: 10
        }, {
            initialSize: 20,
            maxSize: 250,
            growSize: 5
        });
        
        // Register Enemy2
        this.registerEnemyType('enemy2', Enemy2, {
            speed: 0.4,
            size: 18,
            color: 0x0000ff,
            health: 20,
            damage: 40,
            scoreValue: 25,
            dashSpeed: 2.0,
            chargeTime: 1500,
            dashTime: 500,
            dashCooldownTime: 5000
        }, {
            initialSize: 10,
            maxSize: 150,
            growSize: 3
        });
        
        // Register Enemy3
        this.registerEnemyType('enemy3', Enemy3, {
            speed: 0.3,
            size: 14,
            color: 0xff6600,
            health: 15,
            damage: 20,
            scoreValue: 20,
            attackRange: 350,
            preferredRange: 250,
            retreatRange: 150,
            attackCooldownTime: 2000
        }, {
            initialSize: 10,
            maxSize: 50,
            growSize: 3
        });
        
        // Register Boss1
        this.registerEnemyType('boss1', Boss1, {
            speed: 0.3,
            size: 50,
            color: 0xff0000,
            health: 10000,
            damage: 5,
            scoreValue: 500,
            hasHealthBar: true
        }, {
            initialSize: 2,
            maxSize: 5,
            growSize: 1
        });
    }
    
    /**
     * Register a new enemy type
     * @param {string} typeId - Unique identifier for this enemy type
     * @param {class} Constructor - Enemy class constructor
     * @param {object} config - Default configuration for this enemy type
     * @param {object} poolOptions - Object pooling options for this enemy type
     */
    registerEnemyType(typeId, Constructor, config = {}, poolOptions = {}) {
        if (this.enemyConstructors.has(typeId)) {
            console.warn(`Enemy type '${typeId}' is already registered. Overwriting.`);
        }
        
        this.enemyConstructors.set(typeId, Constructor);
        this.enemyConfigs.set(typeId, config);
        this.poolOptions.set(typeId, poolOptions);
        
        console.debug(`Registered enemy type: ${typeId}`);
    }
    
    /**
     * Get the constructor for a specific enemy type
     * @param {string} typeId - Enemy type identifier
     * @returns {class|null} The enemy constructor or null if not found
     */
    getConstructor(typeId) {
        return this.enemyConstructors.get(typeId) || null;
    }
    
    /**
     * Get the configuration for a specific enemy type
     * @param {string} typeId - Enemy type identifier
     * @returns {object|null} The enemy configuration or null if not found
     */
    getConfig(typeId) {
        return this.enemyConfigs.get(typeId) || null;
    }
    
    /**
     * Get pool options for a specific enemy type
     * @param {string} typeId - Enemy type identifier
     * @returns {object|null} Pool options or null if not found
     */
    getPoolOptions(typeId) {
        return this.poolOptions.get(typeId) || null;
    }
    
    /**
     * Create an enemy instance of the specified type
     * @param {string} typeId - Enemy type identifier
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} fromPool - Whether this is created from a pool
     * @param {object} overrideConfig - Configuration overrides
     * @returns {BaseEnemy|null} The created enemy or null if type not found
     */
    createEnemy(typeId, x, y, fromPool = false, overrideConfig = {}) {
        const Constructor = this.getConstructor(typeId);
        if (!Constructor) {
            console.warn(`Enemy type '${typeId}' not found in registry`);
            return null;
        }
        
        // Create the enemy instance
        const enemy = new Constructor(this.scene, x, y, fromPool);
        
        // Apply configuration overrides if needed
        if (Object.keys(overrideConfig).length > 0) {
            Object.assign(enemy, overrideConfig);
        }
        
        // Assign enemy to a group if GroupManager exists
        // If no group is specified, get the next group from the GroupManager
        if (this.scene.groupManager) {
            const groupId = overrideConfig.groupId || this.scene.groupManager.getNextSpawnGroup();
            enemy.setGroup(groupId);
        }
        
        return enemy;
    }
    
    /**
     * Get all registered enemy types
     * @returns {Array<string>} Array of registered enemy type IDs
     */
    getRegisteredTypes() {
        return Array.from(this.enemyConstructors.keys());
    }
    
    /**
     * Get summary information about all registered enemy types
     * @returns {object} Object containing enemy type information
     */
    getEnemyTypeSummary() {
        const summary = {};
        
        for (const [typeId, Constructor] of this.enemyConstructors.entries()) {
            const config = this.enemyConfigs.get(typeId) || {};
            const poolOptions = this.poolOptions.get(typeId) || {};
            
            summary[typeId] = {
                className: Constructor.name,
                config: { ...config },
                pooling: { ...poolOptions }
            };
        }
        
        return summary;
    }
}