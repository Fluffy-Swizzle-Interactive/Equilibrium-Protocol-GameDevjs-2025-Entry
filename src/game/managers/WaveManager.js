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
        this.maxWaves = options.maxWaves || 20;
        this.baseEnemyCount = options.baseEnemyCount || 20;
        this.enemyCountGrowth = options.enemyCountGrowth || 1.2;
        this.bossWaveInterval = options.bossWaveInterval || 5;
        // Add a maximum cap on enemies per wave to prevent excessive numbers
        this.maxEnemiesPerWave = options.maxEnemiesPerWave || 300;

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

        // Emit wave start event on both scene events and EventBus
        const eventData = {
            wave: this.currentWave,
            isBossWave,
            enemyCount: this.enemiesToSpawn
        };

        this.scene.events.emit('wave-start', eventData);

        // Also emit on EventBus for consistency with wave-completed
        if (EventBus) {
            EventBus.emit('wave-start', eventData);

            if (this.scene.isDev) {
                console.debug('Wave start event emitted on EventBus', eventData);
            }
        }

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

        // Clamp enemy count to maximum allowed
        enemyCount = Math.min(enemyCount, this.maxEnemiesPerWave);

        // Set the number of enemies to spawn this wave
        this.enemiesToSpawn = enemyCount;
        
        // Log information about the wave in dev mode
        if (this.scene.isDev) {
            console.debug(`[WaveManager] Wave ${this.currentWave} calculated enemy count: ${enemyCount} (capped at ${this.maxEnemiesPerWave})`);
            console.debug(`[WaveManager] Raw count before cap: ${Math.round(this.baseEnemyCount * Math.pow(this.enemyCountGrowth, this.currentWave - 1))}`);
        }
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

                // Emit boss-spawned event for other systems to react to
                EventBus.emit('boss-spawned', {
                    bossType: bossType,
                    x: x,
                    y: y,
                    boss: boss
                });

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
        // Capture chosen enemy type for debugging
        let chosenType;
        
        if (this.currentWave < 5) {
            // Early waves only have basic enemies
            chosenType = 'enemy1';
        } else if (this.currentWave < 10) {
            // Mid waves introduce enemy2 with increasing probability
            const enemy2Chance = (this.currentWave - 5) / 10;
            chosenType = Math.random() < enemy2Chance ? 'enemy2' : 'enemy1';
        } else if (this.currentWave < 15) {
            // Waves 10-14 introduce enemy3 with small probability
            const roll = Math.random();
            if (roll < 0.1) {
                chosenType = 'enemy3'; // 10% chance for enemy3
            } else if (roll < 0.4) {
                chosenType = 'enemy2'; // 30% chance for enemy2
            } else {
                chosenType = 'enemy1'; // 60% chance for enemy1
            }
        } else {
            // Later waves have all three enemy types with higher chance of advanced enemies
            const roll = Math.random();
            if (roll < 0.25) {
                chosenType = 'enemy3'; // 25% chance for enemy3
            } else if (roll < 0.65) {
                chosenType = 'enemy2'; // 40% chance for enemy2
            } else {
                chosenType = 'enemy1'; // 35% chance for enemy1
            }
        }
        
        // Debug log enemy selection when on wave 10 or higher
        if (this.currentWave >= 10 && this.scene.isDev) {
            // Check if enemy3 is registered in the enemy manager
            const isEnemy3Registered = this.scene.enemyManager && 
                this.scene.enemyManager.enemyRegistry && 
                this.scene.enemyManager.enemyRegistry.getConstructor('enemy3');
                
            console.debug(`[WaveManager] Wave ${this.currentWave} selected enemy: ${chosenType}. Enemy3 registered: ${isEnemy3Registered ? 'YES' : 'NO'}`);
        }
        
        return chosenType;
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
        // Debug log the kill if in dev mode
        if (this.scene.isDev) {
            console.debug(`[WaveManager] Enemy killed: ${enemyType}, isBoss: ${isBoss}, active enemies remaining: ${this.activeEnemies - 1}, active bosses: ${isBoss ? this.activeBosses - 1 : this.activeBosses}`);
        }

        // Ensure counts never go below zero to prevent the bug
        if (this.activeEnemies > 0) {
            this.activeEnemies--;
        } else {
            // Log issue but correct the counter
            console.warn('[WaveManager] Attempted to decrease activeEnemies below zero');
            this.activeEnemies = 0;
        }

        // If it was a boss, also decrease boss count
        if (isBoss) {
            if (this.activeBosses > 0) {
                this.activeBosses--;
            } else {
                console.warn('[WaveManager] Attempted to decrease activeBosses below zero');
                this.activeBosses = 0;
            }
        }

        // Check if wave is complete:
        // For boss waves: all regular enemies and bosses must be defeated
        // For regular waves: all enemies must be defeated
        const allEnemiesSpawned = this.enemiesSpawned >= this.enemiesToSpawn;
        const isBossWave = this.currentWave % this.bossWaveInterval === 0;

        if (this.isWaveActive && allEnemiesSpawned) {
            if (isBossWave && this.hasBoss) {
                // For boss waves, make sure BOTH regular enemies AND bosses are defeated
                if (this.activeEnemies === 0 && this.activeBosses === 0) {
                    if (this.scene.isDev) {
                        console.debug('[WaveManager] Boss wave completed via onEnemyKilled');
                    }
                    this.completeWave();
                }
            } else {
                // For regular waves, just check if all enemies are defeated
                if (this.activeEnemies <= 0) {
                    if (this.scene.isDev) {
                        console.debug('[WaveManager] Regular wave completed via onEnemyKilled');
                    }
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

        // Call registered end of round callbacks
        if (this._endOfRoundCallbacks && this._endOfRoundCallbacks.length > 0) {
            for (const callback of this._endOfRoundCallbacks) {
                try {
                    callback(eventData);
                } catch (error) {
                    console.error('[WaveManager] Error executing end of round callback', error);
                }
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

        // If wave is active, periodically verify enemy counts match reality
        if (this.isWaveActive && this.scene.enemyManager) {
            // Every 2 seconds, verify enemy count matches reality
            const now = this.scene.time.now;
            if (!this._lastVerifyTime || now - this._lastVerifyTime > 2000) {
                this._lastVerifyTime = now;
                this.verifyEnemyCount();
            }
        }
    }

    /**
     * Verify that tracked enemy count matches actual enemies in the scene
     * This helps prevent waves getting stuck due to tracking errors
     * @private
     */
    verifyEnemyCount() {
        if (!this.scene.enemyManager || !this.isWaveActive) return;

        // First, clean up any inactive enemies that might still be counted
        const cleanedUpCount = this.cleanupInactiveEnemies();

        // Get the actual count from enemy manager
        const actualEnemyCount = this.scene.enemyManager.getEnemyCount();
        const actualBossCount = this.scene.enemyManager.getEnemyCount('boss1');

        // Log any discrepancies in dev mode
        if (this.scene.isDev && (actualEnemyCount !== this.activeEnemies || actualBossCount !== this.activeBosses)) {
            console.debug(`[WaveManager] Enemy count mismatch! Tracked: ${this.activeEnemies} (bosses: ${this.activeBosses}), Actual: ${actualEnemyCount} (bosses: ${actualBossCount})`);
        }

        // Check for negative values (error condition) and fix them
        if (this.activeEnemies < 0) {
            console.warn('[WaveManager] Negative activeEnemies count detected, resetting to actual count');
            this.activeEnemies = 0;
        }

        if (this.activeBosses < 0) {
            console.warn('[WaveManager] Negative activeBosses count detected, resetting to actual count');
            this.activeBosses = 0;
        }

        // If there's a mismatch, always update our tracking to match reality
        if (actualEnemyCount !== this.activeEnemies || actualBossCount !== this.activeBosses) {
            // Update our tracking to match reality
            this.activeEnemies = actualEnemyCount;
            this.activeBosses = actualBossCount;
        }

        // MODIFIED: Check if the target number of enemies has been surpassed (not requiring exact count)
        // This makes wave completion more reliable with multiple spawning systems
        const enemySpawnThresholdMet = this.enemiesSpawned >= this.enemiesToSpawn;
        const isBossWave = this.currentWave % this.bossWaveInterval === 0;

        // Enhanced debugging to track why waves aren't completing
        if (this.scene.isDev) {
            console.debug(`[WaveManager] Wave completion check:
                - Wave: ${this.currentWave}
                - Enemy spawn threshold met: ${enemySpawnThresholdMet} (${this.enemiesSpawned}/${this.enemiesToSpawn})
                - Active enemies: ${this.activeEnemies}
                - Is boss wave: ${isBossWave}
                - Active bosses: ${this.activeBosses}
                - Wave active: ${this.isWaveActive}
                - Wave state: ${this.isPaused ? 'Paused' : 'Active'}`);
        }

        // Force verification of boss spawn state
        if (isBossWave && enemySpawnThresholdMet && !this.spawnTimer && this.hasBoss && this.activeBosses === 0) {
            // All regular enemies spawned and no boss active, check if boss was ever spawned
            if (this.lastBossWave < this.currentWave) {
                // Boss wasn't spawned yet but should have been - trigger boss spawn
                if (this.scene.isDev) {
                    console.debug('[WaveManager] Forcing boss spawn for boss wave');
                }
                this.spawnBoss();
                this.lastBossWave = this.currentWave;
                return;
            }
        }

        // Check if the wave should be completed - FORCING COMPLETION IF THRESHOLD MET AND NO ENEMIES
        // This is a more aggressive approach to ensure waves complete
        if (enemySpawnThresholdMet && this.activeEnemies === 0) {
            if (isBossWave) {
                // For boss wave, ensure both regular enemies and boss are defeated
                if (this.activeBosses === 0) {
                    // Don't call completeWave if wave is already completed
                    if (this.isWaveActive) {
                        if (this.scene.isDev) {
                            console.debug('[WaveManager] Boss wave completed via verifyEnemyCount');
                        }
                        this.completeWave();
                    }
                }
            } else {
                // For regular waves, all enemies must be defeated
                if (this.isWaveActive) {
                    if (this.scene.isDev) {
                        console.debug('[WaveManager] Regular wave completed via verifyEnemyCount');
                    }
                    this.completeWave();
                }
            }
        } else if (this.scene.isDev && this.isWaveActive) {
            // If wave isn't completing, explain why
            let reason = "";
            if (!enemySpawnThresholdMet) {
                reason = `Enemy spawn threshold not met: ${this.enemiesSpawned}/${this.enemiesToSpawn}`;
            } else if (this.activeEnemies > 0) {
                reason = `Active enemies still present: ${this.activeEnemies}`;
            } else if (isBossWave && this.activeBosses > 0) {
                reason = `Boss still active: ${this.activeBosses}`;
            }

            if (reason) {
                console.debug(`[WaveManager] Wave not completing because: ${reason}`);
            }
        }
    }

    /**
     * Force cleanup of any inactive enemies to prevent counting issues
     * Call this before wave completion checks
     * @private
     */
    cleanupInactiveEnemies() {
        if (!this.scene.enemyManager) return;

        let inactiveCount = 0;

        // Loop through enemy manager's enemies
        for (let i = this.scene.enemyManager.enemies.length - 1; i >= 0; i--) {
            const enemy = this.scene.enemyManager.enemies[i];

            // Check if this enemy is inactive or missing graphics
            if (!enemy || !enemy.active || !enemy.graphics || !enemy.graphics.active) {
                // Release back to pool to ensure it's properly removed from tracking
                this.scene.enemyManager.releaseEnemy(enemy);
                inactiveCount++;
            }
            else if(enemy.killCounted) {
                // Release back to pool to ensure it's properly removed from tracking
                this.scene.enemyManager.releaseEnemy(enemy);
                inactiveCount++;
            }
            else if (enemy.health <= 0) {
                // Release back to pool to ensure it's properly removed from tracking
                this.scene.enemyManager.releaseEnemy(enemy);
                inactiveCount++;
            }
        }

        // Log cleanup results if any enemies were cleaned up
        if (inactiveCount > 0 && this.scene.isDev) {
            console.debug(`[WaveManager] Cleaned up ${inactiveCount} inactive enemies`);
        }

        return inactiveCount;

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
     * Reset the wave manager
     * Called when starting a new game or restarting
     */
    reset() {
        this.isWaveActive = false;
        this.waveCompleted = false;
        this.isPaused = false;
        this.isWaitingForNextWave = false;
        
        this.currentWave = 0;
        
        this.enemiesToSpawn = 0;
        this.enemiesSpawned = 0;
        this.activeEnemies = 0;
        this.activeBosses = 0;
        
        this.hasBoss = false;

        // Don't reset boss counter to maintain progressive difficulty
        // this.lastBossWave = 0;
        
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }
        
        if (this.scene.isDev) {
            console.debug('[WaveManager] Reset completed');
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

    /**
     * Register enemies that are spawned by external systems
     * This method allows systems like FactionBattleManager to notify WaveManager
     * about enemies they spawn outside normal wave spawning
     *
     * @param {number} count - Number of enemies spawned externally
     */
    registerExternalEnemySpawn(count) {
        if (typeof count !== 'number' || count <= 0) return;

        // Track these as part of our spawn counts
        this.enemiesSpawned += count;
        this.activeEnemies += count;

        if (this.scene.isDev) {
            console.debug(`[WaveManager] Registered ${count} external enemy spawns. New totals: Spawned=${this.enemiesSpawned}, Active=${this.activeEnemies}`);
        }
    }

    /**
     * Register a callback function to be called at the end of each round
     * Used by systems like ShopManager to integrate with wave completion
     * @param {Function} callback - The function to call when a wave is completed
     */
    registerEndOfRoundCallback(callback) {
        if (!this._endOfRoundCallbacks) {
            this._endOfRoundCallbacks = [];
        }

        if (!this._endOfRoundCallbacks.includes(callback)) {
            this._endOfRoundCallbacks.push(callback);

            if (this.scene.isDev) {
                console.debug('[WaveManager] End of round callback registered');
            }
        }
    }

    /**
     * Unregister a previously registered end of round callback
     * @param {Function} callback - The callback to unregister
     */
    unregisterEndOfRoundCallback(callback) {
        if (!this._endOfRoundCallbacks) return;

        const index = this._endOfRoundCallbacks.indexOf(callback);
        if (index !== -1) {
            this._endOfRoundCallbacks.splice(index, 1);

            if (this.scene.isDev) {
                console.debug('[WaveManager] End of round callback unregistered');
            }
        }
    }
}