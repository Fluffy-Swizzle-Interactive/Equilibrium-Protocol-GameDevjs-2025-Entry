import { GameObjectManager } from './GameObjectManager';
import { BaseEnemy } from '../entities/BaseEnemy';
import { EnemyRegistry } from './EnemyRegistry';
import { GroupId } from '../constants';
import { GroupWeightManager } from './GroupWeightManager';

/**
 * EnemyManager class
 * Handles creation, pooling, and management of all enemy types
 */
export class EnemyManager {
    /**
     * Create a new enemy manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {Object} options - Configuration options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.gameObjectManager = scene.gameObjectManager || new GameObjectManager(scene);
        this.enemies = [];
        this.enemyPools = {};
        this.projectiles = [];
        
        // Create the enemy registry
        this.enemyRegistry = new EnemyRegistry(scene);
        
        // Initialize group weight manager for randomized enemy spawning
        this.groupWeightManager = new GroupWeightManager(scene, {
            initialWeights: options.initialGroupWeights || { 'ai': 50, 'coder': 50 },
            volatility: options.groupVolatility || 0.2
        });
        
        // Boss progression tracking
        this.bossCounter = 0;
        this.bossScalingFactor = options.bossScalingFactor || 2.5;
        
        // Register this manager with the scene for easy access
        scene.enemyManager = this;
        
        // Initialize enemy pools
        this.initializePools(options);
        
        // Debug properties
        this.isDev = this.scene.isDev || false;
    }
    
    /**
     * Initialize pools for each enemy type
     * @param {Object} options - Pool configuration options
     * @private
     */
    initializePools(options) {
        // Default pool options
        const defaultOptions = {
            initialSize: 20,
            maxSize: 300, 
            growSize: 5
        };
        
        // Merge provided options with defaults
        const poolOptions = { ...defaultOptions, ...options };
        
        // Get all registered enemy types
        const enemyTypes = this.enemyRegistry.getRegisteredTypes();
        
        // Create a pool for each registered enemy type
        enemyTypes.forEach(typeId => {
            const Constructor = this.enemyRegistry.getConstructor(typeId);
            const typeConfig = this.enemyRegistry.getConfig(typeId);
            const typePoolOptions = this.enemyRegistry.getPoolOptions(typeId);
            
            // Merge default poolOptions with type-specific ones
            const mergedPoolOptions = { ...poolOptions, ...typePoolOptions };
            
            this.createEnemyPool(typeId, Constructor, mergedPoolOptions);
        });
        
        // Create pool for projectiles
        this.createProjectilePool(poolOptions);
    }
    
    /**
     * Create a pool for a specific enemy type
     * @param {string} poolKey - Key for the pool
     * @param {class} EnemyClass - Enemy class to instantiate
     * @param {Object} options - Pool configuration options
     * @private
     */
    createEnemyPool(poolKey, EnemyClass, options) {
        this.gameObjectManager.createPool(poolKey,
            // Create function - creates enemy instance without initialization
            () => {
                // Create basic enemy object structure but don't position it yet
                const enemyInstance = new EnemyClass(this.scene, 0, 0, true);
                
                // Return the instance
                return enemyInstance;
            },
            // Reset function - initializes or resets enemy properties
            (enemy, x, y, options = {}) => {
                // Reset killCounted flag to ensure recycled enemies get counted correctly
                enemy.killCounted = false;
                
                // Set position and activate enemy
                enemy.reset(x, y, options);
                
                // Add to tracking list if not already there
                if (!this.enemies.includes(enemy)) {
                    this.enemies.push(enemy);
                }
            },
            // Custom configuration
            options
        );
        
        // Add the pool key to our supported enemy types
        if (!this.enemyPools[poolKey]) {
            this.enemyPools[poolKey] = true;
        }
    }
    
    /**
     * Create a pool for projectiles
     * @param {Object} options - Pool configuration options
     * @private
     */
    createProjectilePool(options) {
        this.gameObjectManager.createPool('projectile',
            // Create function
            () => {
                const projectile = {
                    graphics: this.scene.add.circle(0, 0, 5, 0xff0000),
                    active: false,
                    speed: 0,
                    directionX: 0,
                    directionY: 0,
                    damage: 1,
                    lifetime: 0,
                    maxLifetime: 3000
                };
                
                // Make sure graphics are not visible when created
                projectile.graphics.setActive(false);
                projectile.graphics.setVisible(false);
                
                return projectile;
            },
            // Reset function
            (projectile, x, y, options = {}) => {
                // Set position and attributes
                projectile.graphics.setPosition(x, y);
                projectile.graphics.setActive(true);
                projectile.graphics.setVisible(true);
                
                // Set properties
                projectile.directionX = options.directionX || 0;
                projectile.directionY = options.directionY || 0;
                projectile.speed = options.speed || 2;
                projectile.damage = options.damage || 1;
                projectile.lifetime = 0;
                projectile.maxLifetime = options.maxLifetime || 3000;
                projectile.active = true;
                
                // Add to tracking list
                if (!this.projectiles.includes(projectile)) {
                    this.projectiles.push(projectile);
                }
            },
            // Custom configuration
            {
                initialSize: options.initialSize || 30,
                maxSize: options.maxSize || 100,
                growSize: options.growSize || 10
            }
        );
    }
    
    /**
     * Spawn a specific enemy type at the given position
     * @param {string} type - Enemy type key ('enemy1', 'enemy2', 'boss1')
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Optional enemy configuration
     * @returns {BaseEnemy} The spawned enemy instance
     */
    spawnEnemy(type, x, y, options = {}) {
        // Validate enemy type
        if (!this.enemyPools[type]) {
            console.warn(`Enemy type '${type}' not found in enemy pools`);
            return null;
        }
        
        // If no group ID is specified in options, use weighted random selection
        if (!options.groupId) {
            // Use GroupWeightManager to determine the group/faction
            const selectedGroup = this.groupWeightManager.pickRandomGroup();
            options.groupId = selectedGroup;
            
            if (this.isDev) {
                console.debug(`Spawning enemy with dynamically selected group: ${selectedGroup}`);
            }
        }
        
        // Get enemy from pool
        const enemy = this.gameObjectManager.get(type, x, y, options);
        
        if (!enemy) {
            return null;
        }

        // Make sure enemy has the correct group ID set
        if (options.groupId && enemy.setGroup) {
            enemy.setGroup(options.groupId);
            
            // Ensure the group's modifiers (including tint) are applied
            // Some enemies might not get their tint from the setGroup method
            if (this.scene.groupManager && enemy.groupId) {
                this.scene.groupManager.applyModifiers(enemy, enemy.groupId);
            }
        }
        
        // Make sure the enemy has its faction tint applied, especially for chaos and boss spawns
        if (enemy.groupId && enemy.graphics) {
            const tintColors = {
                'ai': 0x3498db,    // Blue tint for AI faction
                'coder': 0xe74c3c  // Red tint for CODER faction
            };
            
            const tintColor = tintColors[enemy.groupId];
            if (tintColor) {
                // Store the faction tint on the enemy
                enemy.factionTint = tintColor;
                
                // Apply tint to the main graphics object
                if (enemy.graphics.setTint) {
                    enemy.graphics.setTint(tintColor);
                }
                
                // Apply tint to any nested sprite components
                if (enemy.graphics.list && Array.isArray(enemy.graphics.list)) {
                    enemy.graphics.list.forEach(child => {
                        if (child && child.setTint) {
                            child.setTint(tintColor);
                        }
                    });
                }
                
                // Apply to sprite if it exists
                if (enemy.sprite && enemy.sprite.setTint) {
                    enemy.sprite.setTint(tintColor);
                }
            }
        }
        
        // Mark this enemy as tracked by the WaveManager if it's created through normal spawning
        // This prevents double counting by both GroupManager and WaveManager
        if (!options.externalSpawn) {
            enemy._registeredWithWaveManager = true;
        }
        
        return enemy;
    }
    
    /**
     * Register a new enemy type
     * @param {string} typeId - Unique identifier for this enemy type
     * @param {class} Constructor - Enemy class constructor
     * @param {object} config - Default configuration for this enemy type
     * @param {object} poolOptions - Object pooling options for this enemy type
     */
    registerEnemyType(typeId, Constructor, config = {}, poolOptions = {}) {
        // Register in the registry first
        this.enemyRegistry.registerEnemyType(typeId, Constructor, config, poolOptions);
        
        // Create a pool for the new enemy type
        this.createEnemyPool(typeId, Constructor, poolOptions);
        
        return this;
    }
    
    /**
     * Registers a kill with the group weight manager to adjust future spawning probabilities
     * @param {String} groupId - The group ID of the killed enemy
     */
    registerKill(groupId) {
        if (this.groupWeightManager) {
            this.groupWeightManager.registerKill(groupId);
        }
    }
    
    /**
     * Get the current group weights/probabilities for enemy spawning
     * @returns {Object} Object containing group weights and probabilities
     */
    getGroupDistribution() {
        if (!this.groupWeightManager) return { weights: {}, probabilities: {} };
        
        return {
            weights: {...this.groupWeightManager.groupWeights},
            probabilities: this.groupWeightManager.getProbabilities(),
            killPercentages: this.getKillPercentages()
        };
    }
    
    /**
     * Get the current kill percentages
     * @returns {Object} Object with group IDs as keys and kill percentages as values
     */
    getKillPercentages() {
        if (!this.groupWeightManager || !this.groupWeightManager.killHistory) {
            return {};
        }
        
        const killHistory = this.groupWeightManager.killHistory;
        const totalKills = Object.values(killHistory).reduce((sum, kills) => sum + kills, 0);
        
        if (totalKills === 0) return {};
        
        const killPercentages = {};
        for (const groupId in killHistory) {
            killPercentages[groupId] = killHistory[groupId] / totalKills;
        }
        
        return killPercentages;
    }
    
    /**
     * Check and fix any extreme imbalance in group weights
     * @returns {boolean} True if weights were rebalanced
     */
    checkAndRebalanceGroupWeights() {
        if (!this.groupWeightManager) return false;
        
        // Call the GroupWeightManager's rebalance method
        const wasRebalanced = this.groupWeightManager.forceRebalanceWeights();
        
        if (wasRebalanced && this.isDev) {
            console.debug('Enemy group weights were rebalanced due to extreme imbalance');
        }
        
        return wasRebalanced;
    }

    /**
     * Set the volatility factor for group weight adjustments
     * @param {Number} value - Volatility value (0-1)
     */
    setGroupVolatility(value) {
        if (this.groupWeightManager) {
            this.groupWeightManager.setVolatility(value);
        }
    }

    /**
     * Manually adjust the weight of a specific group
     * @param {String} groupId - Group ID to adjust
     * @param {Number} weight - New weight value
     */
    setGroupWeight(groupId, weight) {
        if (this.groupWeightManager) {
            this.groupWeightManager.setWeight(groupId, weight);
        }
    }
    
    /**
     * Check if enemy type is registered
     * @param {string} typeId - Enemy type to check
     * @returns {boolean} True if the enemy type exists
     */
    hasEnemyType(typeId) {
        return this.enemyPools[typeId] === true;
    }
    
    /**
     * Get information about a specific enemy type
     * @param {string} typeId - Enemy type to get info for
     * @returns {object|null} Enemy type information or null if not found
     */
    getEnemyTypeInfo(typeId) {
        if (!this.enemyRegistry.getConstructor(typeId)) {
            return null;
        }
        
        return {
            config: this.enemyRegistry.getConfig(typeId),
            poolOptions: this.enemyRegistry.getPoolOptions(typeId)
        };
    }
    
    /**
     * Spawn a projectile
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {number} directionX - X direction vector component
     * @param {number} directionY - Y direction vector component
     * @param {number} speed - Projectile speed
     * @param {number} damage - Damage amount
     * @returns {Object} The spawned projectile
     */
    spawnProjectile(x, y, directionX, directionY, speed = 2, damage = 1) {
        return this.gameObjectManager.get('projectile', x, y, {
            directionX,
            directionY,
            speed,
            damage
        });
    }
    
    /**
     * Spawn a group of enemies around a central point
     * @param {string} type - Enemy type key ('enemy1', 'enemy2', 'boss1')
     * @param {number} baseX - Center X position for the group
     * @param {number} baseY - Center Y position for the group
     * @param {number} groupSize - Number of enemies in the group
     * @param {number} spreadRadius - How spread out the group is
     * @param {Object} options - Optional enemy configuration
     * @returns {Array} Array of spawned enemies
     */
    spawnEnemyGroup(type, baseX, baseY, groupSize = 3, spreadRadius = 100, options = {}) {
        const enemies = [];
        const mapDimensions = this.scene.mapDimensions || {
            width: this.scene.game.config.width,
            height: this.scene.game.config.height
        };
        
        for (let i = 0; i < groupSize; i++) {
            // Random offset within the spread radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * spreadRadius;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            // Calculate final spawn position with offset and clamp to map
            const x = Math.max(50, Math.min(mapDimensions.width - 50, baseX + offsetX));
            const y = Math.max(50, Math.min(mapDimensions.height - 50, baseY + offsetY));
            
            // Create enemy from pool
            const enemy = this.spawnEnemy(type, x, y, options);
            
            if (enemy) {
                enemies.push(enemy);
            }
        }
        
        return enemies;
    }
    
    /**
     * Spawn enemies at map edges (used for regular enemy spawning)
     * @param {string} type - Enemy type to spawn
     * @param {number} count - Number of enemies to spawn
     */
    spawnEnemiesAtEdges(type, count = 1) {
        const cam = this.scene.cameras.main;
        const playerPos = this.scene.player.getPosition();
        const mapDimensions = this.scene.mapDimensions;
        
        // Increased margin for spawning further outside the view
        const minMargin = 150; // Minimum spawn distance from view edge
        const maxMargin = 400; // Maximum spawn distance from view edge
        
        for (let i = 0; i < count; i++) {
            // Choose spawn location type with weighted randomness
            const spawnType = Math.random() * 100;
            let x, y;
            
            if (spawnType < 80) {
                // Standard edge spawn (80% chance)
                const side = Math.floor(Math.random() * 4);
                const margin = minMargin + Math.random() * (maxMargin - minMargin);
                
                switch(side) {
                    case 0: // Top
                        x = playerPos.x + (Math.random() * cam.width - cam.width/2);
                        y = Math.max(50, playerPos.y - cam.height/2 - margin);
                        break;
                    case 1: // Right
                        x = Math.min(mapDimensions.width - 50, playerPos.x + cam.width/2 + margin);
                        y = playerPos.y + (Math.random() * cam.height - cam.height/2);
                        break;
                    case 2: // Bottom
                        x = playerPos.x + (Math.random() * cam.width - cam.width/2);
                        y = Math.min(mapDimensions.height - 50, playerPos.y + cam.height/2 + margin);
                        break;
                    case 3: // Left
                        x = Math.max(50, playerPos.x - cam.width/2 - margin);
                        y = playerPos.y + (Math.random() * cam.height - cam.height/2);
                        break;
                }
            } else {
                // Corner spawn (20% chance)
                const corner = Math.floor(Math.random() * 4);
                const cornerMargin = maxMargin * 1.2; // Slightly further for corners
                
                switch(corner) {
                    case 0: // Top-Left
                        x = Math.max(50, playerPos.x - cam.width/2 - cornerMargin);
                        y = Math.max(50, playerPos.y - cam.height/2 - cornerMargin);
                        break;
                    case 1: // Top-Right
                        x = Math.min(mapDimensions.width - 50, playerPos.x + cam.width/2 + cornerMargin);
                        y = Math.max(50, playerPos.y - cam.height/2 - cornerMargin);
                        break;
                    case 2: // Bottom-Right
                        x = Math.min(mapDimensions.width - 50, playerPos.x + cam.width/2 + cornerMargin);
                        y = Math.min(mapDimensions.height - 50, playerPos.y + cam.height/2 + cornerMargin);
                        break;
                    case 3: // Bottom-Left
                        x = Math.max(50, playerPos.x - cam.width/2 - cornerMargin);
                        y = Math.min(mapDimensions.height - 50, playerPos.y + cam.height/2 + cornerMargin);
                        break;
                }
            }
            
            // Ensure spawn is within map bounds
            x = Math.max(50, Math.min(mapDimensions.width - 50, x));
            y = Math.max(50, Math.min(mapDimensions.height - 50, y));
            
            // Spawn the enemy
            this.spawnEnemy(type, x, y);
        }
    }
    
    /**
     * Spawn a boss enemy at a strategic location
     * @param {string} bossType - Boss type to spawn (default: 'boss1')
     */
    spawnBoss(bossType = 'boss1') {
        const cam = this.scene.cameras.main;
        const playerPos = this.scene.player.getPosition();
        const mapDimensions = this.scene.mapDimensions;
        
        // Make the boss spawn very far from the player, but visible
        const bossMargin = 600; // Very far away
        const angle = Math.random() * Math.PI * 2;
        
        // Calculate spawn position in random direction
        let x = playerPos.x + Math.cos(angle) * bossMargin;
        let y = playerPos.y + Math.sin(angle) * bossMargin;
        
        // Ensure spawn is within map bounds
        x = Math.max(50, Math.min(mapDimensions.width - 50, x));
        y = Math.max(50, Math.min(mapDimensions.height - 50, y));
        
        // Increment boss counter - each boss gets progressively harder
        this.bossCounter++;
        
        // NEW: Calculate boss number based on wave instead of bossCounter
        // This ensures proper scaling even when starting from a later wave
        let calculatedBossNumber = 1; // Default to first boss
        
        // If we have access to WaveManager, use wave number to calculate appropriate boss difficulty
        if (this.scene.waveManager) {
            const currentWave = this.scene.waveManager.getCurrentWave();
            const bossWaveInterval = this.scene.waveManager.bossWaveInterval || 5;
            
            // Calculate how many boss waves should have occurred by this point
            // Example: if bosses appear every 5 waves, and we're on wave 17:
            // Math.floor(17 / 5) = 3 bosses should have appeared (waves 5, 10, 15)
            calculatedBossNumber = Math.floor(currentWave / bossWaveInterval);
            
            // Ensure at least boss #1 (avoid division by zero issues)
            calculatedBossNumber = Math.max(1, calculatedBossNumber);
            
            if (this.isDev) {
                console.debug(`[EnemyManager] Wave ${currentWave}: Calculated boss number: ${calculatedBossNumber}`);
            }
        }
        
        // Use the wave-based boss number for difficulty scaling instead of boss counter
        const difficultyMultiplier = calculatedBossNumber <= 1 ? 
            1 : Math.pow(this.bossScalingFactor, calculatedBossNumber - 1);
        
        if (this.isDev) {
            console.debug(`[EnemyManager] Spawning boss #${calculatedBossNumber} with difficulty multiplier: ${difficultyMultiplier}x`);
        }
        
        // Spawn the boss with scaled properties
        const boss = this.spawnEnemy(bossType, x, y, {
            healthMultiplier: difficultyMultiplier,
            damageMultiplier: difficultyMultiplier,
            speedMultiplier: Math.sqrt(difficultyMultiplier) * 0.5, // Square root for less extreme speed increase
            scoreMultiplier: difficultyMultiplier,
            isBossEncounter: true,
            bossCounter: calculatedBossNumber // Use calculated value instead of bossCounter
        });
        
        // If we successfully spawned a boss, apply scaling
        if (boss) {
            // Scale boss attributes directly for immediate effect
            boss.baseHealth *= difficultyMultiplier;
            boss.health = boss.baseHealth; // Set current health to the new max
            boss.damage *= difficultyMultiplier;
            boss.scoreValue *= difficultyMultiplier;
            
            // Apply moderate speed increase (don't make them too fast)
            boss.speed *= Math.min(2, Math.sqrt(difficultyMultiplier) * 0.5);
            
            // Scale visual size slightly with each boss
            const sizeScale = 1 + Math.min(1, Math.log10(difficultyMultiplier) * 0.3);
            if (boss.sprite) {
                const currentScale = boss.sprite.scale;
                boss.sprite.setScale(currentScale * sizeScale);
            }
            
            // Add simplified, guaranteed boss spawn console log with health
            console.log(`BOSS SPAWNED - Health: ${boss.health}`);
            
            // NEW: Comprehensive console log of boss stats for debugging
            console.log('%c🔥 BOSS SPAWNED 🔥', 'font-size: 14px; color: red; font-weight: bold;');
            console.log({
                name: `Boss #${calculatedBossNumber}`,
                wave: this.scene.waveManager ? this.scene.waveManager.getCurrentWave() : 'unknown',
                difficultyMultiplier: `${difficultyMultiplier.toFixed(2)}x`,
                health: {
                    base: boss.baseHealth / difficultyMultiplier, // Original health before multiplier
                    current: boss.health,
                    multiplied: `${difficultyMultiplier.toFixed(2)}x`,
                },
                damage: {
                    value: boss.damage,
                    multiplied: `${difficultyMultiplier.toFixed(2)}x`,
                },
                speed: {
                    value: boss.speed,
                    multiplied: `${Math.min(2, Math.sqrt(difficultyMultiplier) * 0.5).toFixed(2)}x`,
                },
                visualScale: sizeScale.toFixed(2),
                scoreValue: boss.scoreValue,
                position: { x, y },
                bossType,
                fullObject: boss
            });
            
            // Display boss number and difficulty
            const bossText = `BOSS #${calculatedBossNumber}`; // Use calculated boss number
            const difficultyText = `POWER: ${difficultyMultiplier.toFixed(1)}x`;
            
            // Create floating text above boss
            if (boss.sprite) {
                const bossLabel = this.scene.add.text(
                    boss.sprite.x, 
                    boss.sprite.y - 60,
                    bossText,
                    { 
                        fontFamily: 'Arial', 
                        fontSize: '20px', 
                        color: '#ff0000',
                        stroke: '#000000',
                        strokeThickness: 3
                    }
                ).setOrigin(0.5);
                
                const powerLabel = this.scene.add.text(
                    boss.sprite.x, 
                    boss.sprite.y - 40,
                    difficultyText,
                    { 
                        fontFamily: 'Arial', 
                        fontSize: '16px', 
                        color: '#ffff00',
                        stroke: '#000000',
                        strokeThickness: 3
                    }
                ).setOrigin(0.5);
                
                // Make text follow boss
                this.scene.time.addEvent({
                    delay: 100,
                    loop: true,
                    callback: () => {
                        if (boss && boss.sprite && boss.active) {
                            bossLabel.setPosition(boss.sprite.x, boss.sprite.y - 60);
                            powerLabel.setPosition(boss.sprite.x, boss.sprite.y - 40);
                        } else {
                            bossLabel.destroy();
                            powerLabel.destroy();
                        }
                    }
                });
            }
        }
        
        // Show boss warning message
        if (this.scene.showBossWarning) {
            this.scene.showBossWarning(calculatedBossNumber, difficultyMultiplier);
        } else {
            // Fallback warning if scene method not available
            this.showBossWarning(calculatedBossNumber, difficultyMultiplier);
        }
        
        return boss;
    }
    
    /**
     * Show boss warning message (fallback if scene doesn't have this method)
     * @private
     */
    showBossWarning() {
        // Create warning text
        const warningText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 3,
            'BOSS INCOMING!',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // Animate the warning text
        this.scene.tweens.add({
            targets: warningText,
            alpha: { from: 1, to: 0 },
            scaleX: { from: 1, to: 1.5 },
            scaleY: { from: 1, to: 1.5 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                warningText.destroy();
            }
        });
    }
    
    /**
     * Release an enemy back to its pool
     * @param {BaseEnemy} enemy - The enemy to release
     */
    releaseEnemy(enemy) {
        if (!enemy) {
            console.warn('Attempted to release null or undefined enemy');
            return;
        }
        
        // Remove from tracking array
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.enemies.splice(index, 1);
            
            // Notify WaveManager of this removal if it hasn't already been counted via onEnemyKilled
            if (this.scene.waveManager && !enemy.killCounted) {
                // Determine if this is a boss
                const isBoss = enemy.isBossEnemy ? enemy.isBossEnemy() : enemy.type.includes('boss');
                
                // Notify WaveManager directly - this ensures accurate enemy counting
                this.scene.waveManager.onEnemyKilled(isBoss, enemy.type);
                
                // Mark as counted
                enemy.killCounted = true;
            }
        }
        
        // Deregister from group if applicable
        if (enemy.groupId && this.scene.groupManager) {
            this.scene.groupManager.deregister(enemy, enemy.groupId);
        }
        
        // Release back to appropriate pool based on type
        this.gameObjectManager.release(enemy.getType(), enemy);
    }
    
    /**
     * Release a projectile back to its pool
     * @param {Object} projectile - The projectile to release
     */
    releaseProjectile(projectile) {
        // Remove from tracking array
        const index = this.projectiles.indexOf(projectile);
        if (index !== -1) {
            this.projectiles.splice(index, 1);
        }
        
        // Release back to pool
        if (projectile.graphics) {
            projectile.graphics.setActive(false);
            projectile.graphics.setVisible(false);
        }
        
        projectile.active = false;
        this.gameObjectManager.release('projectile', projectile);
    }
    
    /**
     * Update all active enemies
     */
    update() {
        // Update enemies
        this.updateEnemies();
        
        // Update projectiles
        this.updateProjectiles();
    }
    
    /**
     * Update all active enemies
     * @private
     */
    updateEnemies() {
        // Loop through all tracked enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Skip inactive enemies
            if (!enemy || !enemy.active) continue;
            
            // Update enemy
            enemy.update();
            
            // Check if enemy was destroyed
            if (!enemy.active || !enemy.graphics || !enemy.graphics.active) {
                // Release back to pool
                this.releaseEnemy(enemy);
            }
        }
    }
    
    /**
     * Update all active projectiles
     * @private
     */
    updateProjectiles() {
        // Loop through all tracked projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Skip inactive projectiles
            if (!projectile || !projectile.active) continue;
            
            // Update projectile position
            projectile.graphics.x += projectile.directionX * projectile.speed;
            projectile.graphics.y += projectile.directionY * projectile.speed;
            
            // Update lifetime
            projectile.lifetime += this.scene.game.loop.delta;
            
            // Check if projectile should be culled (too old)
            if (projectile.lifetime > projectile.maxLifetime) {
                this.releaseProjectile(projectile);
                continue;
            }
            
            // Check for projectile-player collision
            const playerPos = this.scene.player.getPosition();
            const distance = Phaser.Math.Distance.Between(
                projectile.graphics.x, projectile.graphics.y,
                playerPos.x, playerPos.y
            );
            
            if (distance < (5 + this.scene.player.radius)) {
                // Hit player - access the player's health system properly
                if (this.scene.player.healthSystem) {
                    // Direct reference to PlayerHealth instance
                    this.scene.player.healthSystem.takeDamage(projectile.damage);
                } else {
                    // Fallback to direct takeDamage method if it exists on player
                    if (this.scene.player.takeDamage) {
                        this.scene.player.takeDamage(projectile.damage);
                    } else {
                        console.warn('Player health system not found, damage not applied');
                    }
                }
                this.releaseProjectile(projectile);
            }
        }
    }
    
    /**
     * Get enemy count of specific type
     * @param {string} type - Enemy type to count (optional)
     * @returns {number} Count of active enemies
     */
    getEnemyCount(type = null) {
        if (type) {
            return this.enemies.filter(e => e.getType() === type).length;
        }
        return this.enemies.length;
    }
    
    /**
     * Get statistics about enemy pools
     * @returns {object} Pool statistics
     */
    getStats() {
        const stats = {
            totalActive: this.enemies.length,
            projectiles: this.projectiles.length,
            byType: {}
        };
        
        // Count by type
        for (const enemy of this.enemies) {
            const type = enemy.getType();
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        }
        
        return stats;
    }
    
    /**
     * Get a list of all available enemy types
     * @returns {Array<string>} Array of enemy type IDs
     */
    getAvailableEnemyTypes() {
        return this.enemyRegistry.getRegisteredTypes();
    }
    
    /**
     * Clear all active enemies
     * Useful when switching maps or resetting the game
     */
    clearAllEnemies() {
        // Release all enemies back to their respective pools
        this.enemies.forEach(enemy => {
            // If enemy has an associated pool, use it to release the enemy
            if (enemy.fromPool && enemy.poolKey && this.enemyPools[enemy.poolKey]) {
                this.enemyPools[enemy.poolKey].releaseEnemy(enemy);
            } else {
                // Otherwise destroy manually
                if (enemy.graphics) enemy.graphics.destroy();
                if (enemy.destroy) enemy.destroy();
            }
        });
        
        // Clear the enemy list
        this.enemies = [];
        
        // Clear any active projectiles
        this.projectiles.forEach(projectile => {
            if (projectile.graphics) projectile.graphics.destroy();
        });
        this.projectiles = [];
    }
}