import { EventBus } from '../EventBus';

/**
 * WaveManager class
 * Manages wave-based gameplay including wave progression, enemy spawning,
 * wave completion, and pause phases between waves
 */
export class WaveManager {
    /**
     * Create a new wave manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {Object} options - Configuration options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Wave configuration
        this.currentWave = options.currentWave || 0;
        this.maxWaves = options.maxWaves || 40;
        this.baseEnemyCount = options.baseEnemyCount || 20;
        this.enemyCountGrowth = options.enemyCountGrowth || 1.2;
        this.bossWaveInterval = options.bossWaveInterval || 10;
        
        // Wave state
        this.isPaused = false;
        this.isWaveActive = false;
        this.activeEnemies = 0;
        this.activeBosses = 0; // Track active boss enemies separately
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        this.pauseBetweenWaves = options.pauseBetweenWaves !== false;
        
        // UI reference (will be set in init)
        this.uiManager = null;

        // Spawn configuration
        this.baseSpawnDelay = options.baseSpawnDelay || 150;
        this.minSpawnDelay = options.minSpawnDelay || 50;
        this.spawnDelayReduction = options.spawnDelayReduction || 50;
        this.lastBossWave = 0;
        
        // Timers
        this.spawnTimer = null;
        
        // Register this manager with the scene
        scene.waveManager = this;
    }
    
    /**
     * Initialize the wave manager with reference to UI
     * @param {UIManager} uiManager - The UI manager for this scene
     */
    init(uiManager) {
        this.uiManager = uiManager;
        
        // Update UI with initial wave information
        if (this.uiManager) {
            this.uiManager.updateWaveUI(this.currentWave, this.maxWaves);
        }
    }
    
    /**
     * Start the next wave of enemies
     */
    startNextWave() {
        // Increment wave counter
        this.currentWave++;
        
        // Update UI
        if (this.uiManager) {
            this.uiManager.updateWaveUI(this.currentWave, this.maxWaves);
        }
        
        // Calculate if this is a boss wave
        const isBossWave = this.currentWave % this.bossWaveInterval === 0;
        
        // Calculate number of enemies to spawn this wave
        this.calculateWaveEnemies(isBossWave);
        
        // Set wave as active
        this.isWaveActive = true;
        this.isPaused = false;
        this.enemiesSpawned = 0;
        this.activeEnemies = 0;
        this.activeBosses = 0; // Reset boss counter
        
        // Show wave start UI
        if (this.uiManager) {
            this.uiManager.showWaveStartBanner(this.currentWave, isBossWave);
        }
        
        // Emit wave start event
        this.scene.events.emit('wave-start', {
            wave: this.currentWave,
            isBossWave,
            enemyCount: this.enemiesToSpawn
        });
        
        // Start spawning enemies after a delay
        this.scene.time.delayedCall(2000, () => {
            this.startEnemySpawning();
        });
    }
    
    /**
     * Calculate the number of enemies for this wave
     * @param {boolean} isBossWave - Whether this is a boss wave
     */
    calculateWaveEnemies(isBossWave) {
        // Base formula for regular waves: baseEnemyCount * (enemyCountGrowth ^ (wave-1))
        let enemyCount = Math.round(this.baseEnemyCount * Math.pow(this.enemyCountGrowth, this.currentWave - 1));
        
        // Boss waves have fewer regular enemies but include a boss
        if (isBossWave) {
            enemyCount = Math.round(enemyCount * 0.7); // 70% of normal count
            this.hasBoss = true;
        } else {
            this.hasBoss = false;
        }
        
        // Set the number of enemies to spawn this wave
        this.enemiesToSpawn = enemyCount;
    }
    
    /**
     * Start spawning enemies at intervals
     */
    startEnemySpawning() {
        // Calculate spawn delay based on wave number
        const spawnDelay = Math.max(
            this.minSpawnDelay,
            this.baseSpawnDelay - (this.currentWave - 1) * this.spawnDelayReduction
        );
        
        // Create a timer that spawns enemies at regular intervals
        this.spawnTimer = this.scene.time.addEvent({
            delay: spawnDelay,
            callback: this.spawnNextEnemy,
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * Spawn the next enemy in the wave
     */
    spawnNextEnemy() {
        if (!this.isWaveActive || this.isPaused) return;
        
        // Stop spawning if we've reached the limit for this wave
        if (this.enemiesSpawned >= this.enemiesToSpawn) {
            if (this.spawnTimer) {
                this.spawnTimer.destroy();
                this.spawnTimer = null;
            }
            
            // Spawn boss if this is a boss wave and we haven't spawned one yet
            if (this.hasBoss && this.lastBossWave < this.currentWave) {
                this.spawnBoss();
                this.lastBossWave = this.currentWave;
            }
            return;
        }
        
        // Determine enemy type based on wave number
        const enemyType = this.getEnemyTypeForWave();
        
        // Determine which group this enemy should be from (using GroupManager)
        let groupId = null;
        if (this.scene.groupManager) {
            groupId = this.scene.groupManager.getNextSpawnGroup();
        }
        
        // Determine spawn location
        const mapDimensions = this.scene.mapDimensions;
        if (!mapDimensions) return;
        
        // Calculate spawn position (off-screen)
        const spawnPosition = this.getRandomSpawnPosition(mapDimensions);
        
        // Spawn enemy using scene's enemy manager with group assignment
        if (this.scene.enemyManager) {
            const enemyOptions = groupId ? { groupId } : {};
            
            // Spawn the enemy with the determined group
            const enemy = this.scene.enemyManager.spawnEnemy(
                enemyType, 
                spawnPosition.x, 
                spawnPosition.y, 
                enemyOptions
            );
            
            // If enemy spawned successfully, increase counters
            if (enemy) {
                this.enemiesSpawned++;
                this.activeEnemies++;
            }
            
            // Occasionally spawn enemies in groups (higher chance in later waves)
            if (Math.random() < 0.05 + (this.currentWave / 100)) {
                const groupSize = Math.min(3 + Math.floor(this.currentWave / 10), 8);
                this.spawnEnemyGroup(spawnPosition.x, spawnPosition.y, groupSize, enemyType, groupId);
            }
        }
        
        // Update UI if available
        if (this.uiManager) {
            this.uiManager.updateDebugInfo();
        }
    }
    
    /**
     * Spawn a group of enemies at a location
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} groupSize - Number of enemies in the group
     * @param {string} enemyType - Type of enemies to spawn
     * @param {string} groupId - Optional group ID to assign to enemies
     */
    spawnEnemyGroup(x, y, groupSize, enemyType, groupId = null) {
        if (!this.scene.enemyManager) return;
        
        const spreadRadius = 100;
        const enemyOptions = groupId ? { groupId } : {};
        
        const enemies = this.scene.enemyManager.spawnEnemyGroup(
            enemyType, x, y, groupSize, spreadRadius, enemyOptions
        );
        
        // Update counters for each successfully spawned enemy
        if (enemies && enemies.length) {
            this.enemiesSpawned += enemies.length;
            this.activeEnemies += enemies.length;
        }
    }
    
    /**
     * Spawn a boss enemy
     */
    spawnBoss() {
        // Get the player's position
        if (!this.scene.player) return;
        const playerPos = this.scene.player.getPosition();
        
        // Spawn boss at a medium distance from player
        const spawnDistance = 500;
        const randomAngle = Math.random() * Math.PI * 2;
        const spawnX = playerPos.x + Math.cos(randomAngle) * spawnDistance;
        const spawnY = playerPos.y + Math.sin(randomAngle) * spawnDistance;
        
        // Clamp to map boundaries
        const mapDimensions = this.scene.mapDimensions;
        const x = Phaser.Math.Clamp(spawnX, 100, mapDimensions.width - 100);
        const y = Phaser.Math.Clamp(spawnY, 100, mapDimensions.height - 100);
        
        // Determine boss type - currently simplified to use the only boss type
        const bossType = 'boss1';
        
        // Spawn boss using scene's enemy manager
        if (this.scene.enemyManager) {
            // Bosses don't get assigned to a group as they're special enemies
            const boss = this.scene.enemyManager.spawnEnemy(bossType, x, y);
            
            if (boss) {
                this.activeEnemies++;
                this.activeBosses++; // Increment boss counter
                
                // Play boss spawn sound if available
                if (this.scene.soundManager) {
                    this.scene.soundManager.playSoundEffect('shoot_shotgun', { volume: 1.0 });
                }
                
                // Create boss spawn effect
                this.createBossSpawnEffect(x, y);
            }
        }
    }
    
    /**
     * Create visual effect for boss spawning
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createBossSpawnEffect(x, y) {
        // Create a shockwave effect
        const circle1 = this.scene.add.circle(x, y, 5, 0xff0000, 0.7);
        const circle2 = this.scene.add.circle(x, y, 10, 0xff0000, 0.5);
        
        circle1.setDepth(100);
        circle2.setDepth(99);
        
        // Animate the circles outward
        this.scene.tweens.add({
            targets: circle1,
            radius: 150,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.Out',
            onComplete: () => circle1.destroy()
        });
        
        this.scene.tweens.add({
            targets: circle2,
            radius: 200,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.Out',
            onComplete: () => circle2.destroy()
        });
        
        // Add camera shake
        this.scene.cameras.main.shake(500, 0.01);
    }
    
    /**
     * Determine enemy type based on wave number
     * Higher waves introduce stronger enemy types
     * @returns {string} Enemy type identifier
     */
    getEnemyTypeForWave() {
        if (this.currentWave < 5) {
            // Early waves only have basic enemies
            return 'enemy1';
        } else if (this.currentWave < 15) {
            // Mid waves introduce enemy2 with increasing probability
            const enemy2Chance = (this.currentWave - 5) / 20;
            return Math.random() < enemy2Chance ? 'enemy2' : 'enemy1';
        } else {
            // Later waves have more enemy2 than enemy1
            const enemy2Chance = Math.min(0.7, (this.currentWave - 15) / 30);
            return Math.random() < enemy2Chance ? 'enemy2' : 'enemy1';
        }
    }
    
    /**
     * Get a random off-screen spawn position
     * @param {Object} mapDimensions - The map dimensions
     * @returns {Object} Spawn position {x, y}
     */
    getRandomSpawnPosition(mapDimensions) {
        const camera = this.scene.cameras.main;
        const margin = 100;
        
        // Determine spawn location type
        const spawnType = Math.random();
        
        // Edge spawn (80% chance)
        if (spawnType < 0.8) {
            // Choose which edge to spawn on (0: top, 1: right, 2: bottom, 3: left)
            const edge = Math.floor(Math.random() * 4);
            
            switch (edge) {
                case 0: // Top
                    return {
                        x: Phaser.Math.Between(margin, mapDimensions.width - margin),
                        y: -margin
                    };
                case 1: // Right
                    return {
                        x: mapDimensions.width + margin,
                        y: Phaser.Math.Between(margin, mapDimensions.height - margin)
                    };
                case 2: // Bottom
                    return {
                        x: Phaser.Math.Between(margin, mapDimensions.width - margin),
                        y: mapDimensions.height + margin
                    };
                case 3: // Left
                    return {
                        x: -margin,
                        y: Phaser.Math.Between(margin, mapDimensions.height - margin)
                    };
            }
        }
        // Corner spawn (20% chance)
        else {
            // Choose which corner to spawn in (0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left)
            const corner = Math.floor(Math.random() * 4);
            
            switch (corner) {
                case 0: // Top-left
                    return {
                        x: -margin,
                        y: -margin
                    };
                case 1: // Top-right
                    return {
                        x: mapDimensions.width + margin,
                        y: -margin
                    };
                case 2: // Bottom-right
                    return {
                        x: mapDimensions.width + margin,
                        y: mapDimensions.height + margin
                    };
                case 3: // Bottom-left
                    return {
                        x: -margin,
                        y: mapDimensions.height + margin
                    };
            }
        }
        
        // Fallback (should not reach here)
        return {
            x: -margin,
            y: -margin
        };
    }
    
    /**
     * Handle when an enemy is killed
     * @param {boolean} isBoss - Whether the killed enemy was a boss
     * @param {string} enemyType - The type of enemy that was killed
     */
    onEnemyKilled(isBoss, enemyType) {
        // Ensure counts never go below zero to prevent the bug
        if (this.activeEnemies > 0) {
            this.activeEnemies--;
        } else {
            // Log issue but correct the counter
            console.warn('WaveManager: Attempted to decrease activeEnemies below zero');
            this.activeEnemies = 0;
        }
        
        // If it was a boss, also decrease boss count
        if (isBoss) {
            if (this.activeBosses > 0) {
                this.activeBosses--;
            } else {
                console.warn('WaveManager: Attempted to decrease activeBosses below zero');
                this.activeBosses = 0;
            }
        }
        
        // Check if wave is complete:
        // For boss waves: all regular enemies and bosses must be defeated
        // For regular waves: all enemies must be defeated
        const allEnemiesSpawned = this.enemiesSpawned >= this.enemiesToSpawn;
        const isBossWave = this.currentWave % this.bossWaveInterval === 0;
        
        if (this.isWaveActive && allEnemiesSpawned) {
            if (isBossWave) {
                // For boss waves, make sure BOTH regular enemies AND bosses are defeated
                if (this.activeEnemies === 0 && this.activeBosses === 0) {
                    this.completeWave();
                }
            } else {
                // For regular waves, just check if all enemies are defeated
                if (this.activeEnemies <= 0) {
                    this.completeWave();
                }
            }
        }
    }
    
    /**
     * Complete the current wave
     */
    completeWave() {
        // Mark wave as complete
        this.isWaveActive = false;
        
        // Check for game completion
        const isLastWave = this.currentWave >= this.maxWaves;
        
        if (isLastWave) {
            // Player has won the game
            this.gameVictory();
        } else {
            // Enter pause phase between waves
            this.enterPausePhase();
        }
        
        // Emit wave completed event on both the scene events and EventBus
        // This ensures all listeners receive the event
        const eventData = {
            wave: this.currentWave,
            isLastWave
        };
        
        this.scene.events.emit('wave-completed', eventData);
        
        // Also emit on EventBus to ensure ShopManager receives it
        if (EventBus) {
            EventBus.emit('wave-completed', eventData);
            
            if (this.scene.isDev) {
                console.debug('Wave completed event emitted on EventBus', eventData);
            }
        }
    }
    
    /**
     * Enter pause phase between waves
     */
    enterPausePhase() {
        // Only enter pause phase if configured to do so
        if (!this.pauseBetweenWaves) {
            this.startNextWave();
            return;
        }
        
        this.isPaused = true;
        
        // Show wave complete UI
        if (this.uiManager) {
            this.uiManager.showWaveCompleteUI();
        }
    }
    
    /**
     * Handle game victory (all waves completed)
     */
    gameVictory() {
        // Emit victory event
        this.scene.events.emit('victory');
    }
    
    /**
     * Update method called each frame
     */
    update() {
        // Skip updates if game is paused
        if (this.scene.isPaused) return;
        
        // Basic update checks - nothing needed for now
    }
    
    /**
     * Get current wave number
     * @returns {number} Current wave number
     */
    getCurrentWave() {
        return this.currentWave;
    }
    
    /**
     * Get number of active enemies
     * @returns {number} Active enemy count
     */
    getActiveEnemyCount() {
        return this.activeEnemies;
    }
    
    /**
     * Check if the wave manager is in pause phase between waves
     * @returns {boolean} True if in pause phase
     */
    isInPausePhase() {
        return !this.isWaveActive && this.isPaused;
    }
    
    /**
     * Reset the wave manager state
     */
    reset() {
        this.currentWave = 0;
        this.isPaused = false;
        this.isWaveActive = false;
        this.activeEnemies = 0; // Reset to 0
        this.activeBosses = 0;  // Reset to 0
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        this.hasBoss = false;
        this.lastBossWave = 0;
        
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }
        
        // Reset GroupManager counts if it exists
        if (this.scene.groupManager) {
            this.scene.groupManager.reset();
        }
        
        // Update UI with initial wave information
        if (this.uiManager) {
            this.uiManager.updateWaveUI(this.currentWave, this.maxWaves);
        }
    }
    
    /**
     * Debug the current state of wave tracking
     * @returns {Object} Current state of enemy tracking
     */
    debugState() {
        return {
            wave: this.currentWave,
            isActive: this.isWaveActive,
            isPaused: this.isPaused,
            enemiesSpawned: this.enemiesSpawned,
            enemiesToSpawn: this.enemiesToSpawn,
            activeEnemies: this.activeEnemies, 
            activeBosses: this.activeBosses,
            hasBoss: this.hasBoss,
            lastBossWave: this.lastBossWave
        };
    }
}