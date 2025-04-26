import { EventBus } from '../EventBus';
import { GroupId } from '../constants';

/**
 * FactionBattleManager
 * Manages battles between enemy factions when they are in close proximity
 * and chaos levels are high enough. This creates dynamic battlefield scenarios
 * where enemies can fight each other without player intervention.
 */
export class FactionBattleManager {
    /**
     * Create a new Faction Battle Manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {Object} options - Configuration options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Configuration
        this.config = {
            enabled: options.enabled ?? true,                    // Enable/disable faction battles
            chaosThreshold: options.chaosThreshold ?? 45,        // Increased from 40% to 45% for less frequent battles
            requiredEnemiesPerFaction: options.requiredEnemiesPerFaction ?? 4, // Increased from 3 to 4 for less frequent battles
            totalEnemiesRequired: options.totalEnemiesRequired ?? 10, // Total enemies needed (combined)
            detectionRadius: options.detectionRadius ?? 350,     // Detection radius for enemies (px)
            battleCheckInterval: options.battleCheckInterval ?? 2000, // Increased from 1500ms to 2000ms for less frequent checks
            victoryChance: options.victoryChance ?? 0.5,         // 50% chance for either side to win
            battleCooldown: options.battleCooldown ?? 15000,     // Increased from 10s to 15s cooldown between battles
            maxSimultaneousBattles: options.maxSimultaneousBattles ?? 1 // Reduced from 2 to 1 for less battles
        };
        
        // State tracking
        this.activeBattles = [];
        this.lastBattleTimestamp = 0;
        
        // Debug mode
        this.isDev = options.isDev ?? scene.isDev ?? false;
        
        // Register with scene for easy access
        scene.factionBattleManager = this;
        
        // Set up timer for periodic battle checks
        this.battleDetectionTimer = null;
        
        // Required references
        this.groupManager = null;
        this.chaosManager = null;
        
        // Listen to events
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     * @private
     */
    setupEventListeners() {
        EventBus.on('chaos-changed', this.onChaosChanged, this);
    }
    
    /**
     * Handle chaos changes to adjust battle probability
     * @param {Object} data - Chaos change event data
     * @private
     */
    onChaosChanged(data) {
        // Only care about significant changes
        if (Math.abs(data.newValue - data.oldValue) < 5) return;
        
        const absoluteChaos = Math.abs(data.newValue);
        
        // Start battle detection if chaos crosses threshold
        if (absoluteChaos >= this.config.chaosThreshold && !this.battleDetectionTimer) {
            this.startBattleDetection();
        }
        // Stop battle detection if chaos drops below threshold
        else if (absoluteChaos < this.config.chaosThreshold && this.battleDetectionTimer) {
            this.stopBattleDetection();
        }
    }
    
    /**
     * Initialize required manager references
     * Called after all managers are created
     */
    initialize() {
        // Get references to required managers
        this.groupManager = this.scene.groupManager;
        this.chaosManager = this.scene.chaosManager;
        
        if (!this.groupManager || !this.chaosManager) {
            console.error('FactionBattleManager requires GroupManager and ChaosManager');
            return;
        }
        
        // Check initial chaos level to see if we should start detection
        const currentChaos = Math.abs(this.chaosManager.getChaos());
        if (currentChaos >= this.config.chaosThreshold) {
            this.startBattleDetection();
        }
        
        if (this.isDev) {
            console.debug('FactionBattleManager initialized');
        }
    }
    
    /**
     * Start the battle detection system
     */
    startBattleDetection() {
        if (this.battleDetectionTimer) return;
        
        this.battleDetectionTimer = this.scene.time.addEvent({
            delay: this.config.battleCheckInterval,
            callback: this.checkForPotentialBattles,
            callbackScope: this,
            loop: true
        });
        
        if (this.isDev) {
            console.debug('Faction battle detection started');
        }
    }
    
    /**
     * Stop the battle detection system
     */
    stopBattleDetection() {
        if (!this.battleDetectionTimer) return;
        
        this.battleDetectionTimer.remove();
        this.battleDetectionTimer = null;
        
        if (this.isDev) {
            console.debug('Faction battle detection stopped');
        }
    }
    
    /**
     * Check for potential battles between enemy factions
     * Called by the battle detection timer
     * @private
     */
    checkForPotentialBattles() {
        // Skip if system is disabled or we don't have required managers
        if (!this.config.enabled || !this.groupManager || !this.chaosManager) return;
        
        // Check if chaos level is high enough
        const absoluteChaos = Math.abs(this.chaosManager.getChaos());
        if (absoluteChaos < this.config.chaosThreshold) return;
        
        // Check cooldown
        const currentTime = Date.now();
        if (currentTime - this.lastBattleTimestamp < this.config.battleCooldown) return;
        
        // Check if we have enough active battles already
        if (this.activeBattles.length >= this.config.maxSimultaneousBattles) return;
        
        // Find potential battle locations
        const battleClusters = this.findEnemyClusters();
        if (battleClusters.length === 0) return;
        
        // Select a random cluster to start a battle
        const selectedCluster = battleClusters[Math.floor(Math.random() * battleClusters.length)];
        
        // Start battle at the selected location
        this.startBattle(selectedCluster);
        
        // Update timestamp
        this.lastBattleTimestamp = currentTime;
    }
    
    /**
     * Find clusters of enemies where opposing factions are near each other
     * @returns {Array} Array of potential battle clusters
     * @private
     */
    findEnemyClusters() {
        if (!this.groupManager) return [];
        
        const clusters = [];
        const grid = {};
        const cellSize = this.config.detectionRadius;
        
        // Get all enemies from both factions
        const aiEnemies = this.groupManager.getEntitiesInGroup(GroupId.AI);
        const coderEnemies = this.groupManager.getEntitiesInGroup(GroupId.CODER);
        
        if (this.isDev) {
            console.debug(`Checking for battles: AI enemies: ${aiEnemies.length}, CODER enemies: ${coderEnemies.length}`);
            console.debug(`Thresholds: Need ${this.config.requiredEnemiesPerFaction} of each faction, detection radius: ${this.config.detectionRadius}px`);
        }
        
        // Early return if either faction doesn't have enough enemies
        if (aiEnemies.length < this.config.requiredEnemiesPerFaction || 
            coderEnemies.length < this.config.requiredEnemiesPerFaction) {
            return [];
        }
        
        // Place enemies in grid cells based on position
        this.populateGrid(grid, aiEnemies, coderEnemies, cellSize);
        
        // Find cells that have enough enemies from both factions
        for (const cellKey in grid) {
            const cell = grid[cellKey];
            
            // Check if this cell has enough enemies from each faction
            if (cell.ai.length >= this.config.requiredEnemiesPerFaction && 
                cell.coder.length >= this.config.requiredEnemiesPerFaction) {
                
                clusters.push({
                    position: {
                        x: cell.center.x,
                        y: cell.center.y
                    },
                    aiEnemies: cell.ai,
                    coderEnemies: cell.coder,
                    totalEnemies: cell.ai.length + cell.coder.length
                });
                
                if (this.isDev) {
                    console.debug(`Found potential battle cluster with ${cell.ai.length} AI and ${cell.coder.length} CODER enemies at cell ${cellKey}`);
                }
            }
        }
        
        return clusters;
    }
    
    /**
     * Populate the grid with enemies for cluster detection
     * @param {Object} grid - The grid to populate
     * @param {Array} aiEnemies - Array of AI faction enemies
     * @param {Array} coderEnemies - Array of CODER faction enemies
     * @param {number} cellSize - Size of each grid cell
     * @private
     */
    populateGrid(grid, aiEnemies, coderEnemies, cellSize) {
        // Process AI enemies
        for (const enemy of aiEnemies) {
            if (!enemy || !enemy.graphics) continue;
            
            const cellX = Math.floor(enemy.graphics.x / cellSize);
            const cellY = Math.floor(enemy.graphics.y / cellSize);
            const cellKey = `${cellX},${cellY}`;
            
            if (!grid[cellKey]) {
                grid[cellKey] = {
                    ai: [],
                    coder: [],
                    center: { x: 0, y: 0 },
                    totalAdded: 0
                };
            }
            
            grid[cellKey].ai.push(enemy);
            
            // Update center position as running average
            const count = ++grid[cellKey].totalAdded;
            grid[cellKey].center.x = ((grid[cellKey].center.x * (count - 1)) + enemy.graphics.x) / count;
            grid[cellKey].center.y = ((grid[cellKey].center.y * (count - 1)) + enemy.graphics.y) / count;
        }
        
        // Process CODER enemies
        for (const enemy of coderEnemies) {
            if (!enemy || !enemy.graphics) continue;
            
            const cellX = Math.floor(enemy.graphics.x / cellSize);
            const cellY = Math.floor(enemy.graphics.y / cellSize);
            const cellKey = `${cellX},${cellY}`;
            
            if (!grid[cellKey]) {
                grid[cellKey] = {
                    ai: [],
                    coder: [],
                    center: { x: 0, y: 0 },
                    totalAdded: 0
                };
            }
            
            grid[cellKey].coder.push(enemy);
            
            // Update center position as running average
            const count = ++grid[cellKey].totalAdded;
            grid[cellKey].center.x = ((grid[cellKey].center.x * (count - 1)) + enemy.graphics.x) / count;
            grid[cellKey].center.y = ((grid[cellKey].center.y * (count - 1)) + enemy.graphics.y) / count;
        }
    }
    
    /**
     * Start a battle between enemy factions
     * @param {Object} cluster - The enemy cluster to battle
     * @private
     */
    startBattle(cluster) {
        if (!cluster) return;
        
        // Create teams with equal size
        const teamSize = Math.min(
            cluster.aiEnemies.length,
            cluster.coderEnemies.length,
            this.config.requiredEnemiesPerFaction
        );
        
        // Select random enemies for each team to ensure variety
        const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);
        const aiTeam = shuffleArray([...cluster.aiEnemies]).slice(0, teamSize);
        const coderTeam = shuffleArray([...cluster.coderEnemies]).slice(0, teamSize);
        
        // Create battle ID
        const battleId = `battle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Create battle object
        const battle = {
            id: battleId,
            position: cluster.position,
            aiTeam,
            coderTeam,
            startTime: Date.now(),
            pairings: [],
            status: 'active',
            victoryResult: null
        };
        
        // Add to active battles array
        this.activeBattles.push(battle);
        
        // Create pairings between enemies (1v1 matchups)
        this.createBattlePairings(battle);
        
        // Emit event for battle start
        EventBus.emit('FACTION_BATTLE_START', {
            battleId: battle.id,
            position: battle.position,
            aiCount: aiTeam.length,
            coderCount: coderTeam.length
        });
        
        // Create visual effect
        this.createBattleEffect(battle);
        
        // Schedule resolution
        this.scene.time.delayedCall(3000, () => {
            this.resolveBattle(battle);
        });
        
        if (this.isDev) {
            console.debug(`Faction battle started at (${battle.position.x}, ${battle.position.y})`,
                { aiTeam: aiTeam.length, coderTeam: coderTeam.length });
        }
    }
    
    /**
     * Create 1v1 pairings between enemies for battle
     * @param {Object} battle - The battle to create pairings for
     * @private
     */
    createBattlePairings(battle) {
        const { aiTeam, coderTeam } = battle;
        const pairs = [];
        
        // Create pairings (1 AI vs 1 CODER)
        for (let i = 0; i < Math.min(aiTeam.length, coderTeam.length); i++) {
            pairs.push({
                ai: aiTeam[i],
                coder: coderTeam[i],
                resolved: false,
                winner: null
            });
        }
        
        battle.pairings = pairs;
    }
    
    /**
     * Create visual effects for the battle
     * @param {Object} battle - The battle to create effects for
     * @private
     */
    createBattleEffect(battle) {
        // Create particle effects if particles system exists
        if (this.scene.add && this.scene.add.particles) {
            const x = battle.position.x;
            const y = battle.position.y;
            
            // Create central battle effect using updated Phaser API
            const particleManager = this.scene.add.particles(x, y, 'particle_texture', {
                speed: { min: -200, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.25, end: 0 },  // Reduced from 0.4 to 0.25
                blendMode: 'ADD',
                lifespan: 800,  // Reduced from 1500 to 800ms
                quantity: 15,   // Reduced from 20 to 15 particles
                tint: [0xff0000, 0x0000ff]
            });
            
            // Stop after a short time (reduced from 2000 to 1000ms)
            this.scene.time.delayedCall(1000, () => {
                particleManager.destroy();
            });
        }
        
        // Add battle text indicator
        const text = this.scene.add.text(
            battle.position.x,
            battle.position.y - 50,
            'FACTION BATTLE!',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // Animate text (reduced duration from 2000 to 1500ms)
        this.scene.tweens.add({
            targets: text,
            y: text.y - 20,
            alpha: { from: 1, to: 0 },
            ease: 'Power2',
            duration: 1500,
            onComplete: () => text.destroy()
        });
    }
    
    /**
     * Resolve the battle outcome
     * @param {Object} battle - The battle to resolve
     * @private
     */
    resolveBattle(battle) {
        if (!battle) return;
        
        // Resolve each pairing with 50% chance
        let aiWins = 0;
        let coderWins = 0;
        
        for (const pair of battle.pairings) {
            // 50% chance for either side to win
            const aiWon = Math.random() < this.config.victoryChance;
            
            pair.resolved = true;
            pair.winner = aiWon ? 'ai' : 'coder';
            
            if (aiWon) {
                aiWins++;
                
                // Apply damage to CODER enemy
                if (pair.coder && pair.coder.takeDamage) {
                    pair.coder.takeDamage(1000); // Instant kill
                }
            } else {
                coderWins++;
                
                // Apply damage to AI enemy
                if (pair.ai && pair.ai.takeDamage) {
                    pair.ai.takeDamage(1000); // Instant kill
                }
            }
        }
        
        // Determine overall winner
        const overallWinner = aiWins > coderWins ? GroupId.AI : GroupId.CODER;
        battle.victoryResult = {
            winningFaction: overallWinner,
            aiWins,
            coderWins
        };
        
        // Mark battle as resolved
        battle.status = 'resolved';
        
        // Apply chaos change based on battle outcome
        if (this.chaosManager) {
            // Battle outcome affects chaos (AI win: -10, CODER win: +10)
            const chaosChange = overallWinner === GroupId.AI ? -10 : 10;
            this.chaosManager.adjustChaos(chaosChange);
        }
        
        // Create victory effect
        this.createBattleVictoryEffect(battle, overallWinner);
        
        // Apply stat boost to winning faction survivors
        this.applyVictoryBoosts(battle, overallWinner);
        
        // Emit battle end event
        EventBus.emit('FACTION_BATTLE_END', {
            battleId: battle.id,
            position: battle.position,
            winningFaction: overallWinner,
            aiWins,
            coderWins
        });
        
        // Remove battle from active list after a delay
        this.scene.time.delayedCall(5000, () => {
            const index = this.activeBattles.findIndex(b => b.id === battle.id);
            if (index !== -1) {
                this.activeBattles.splice(index, 1);
            }
        });
        
        if (this.isDev) {
            console.debug(`Faction battle resolved: ${overallWinner} faction won`, 
                { aiWins, coderWins });
        }
    }
    
    /**
     * Create visual effects for battle victory
     * @param {Object} battle - The resolved battle
     * @param {string} winningFaction - The faction that won
     * @private
     */
    createBattleVictoryEffect(battle, winningFaction) {
        const { x, y } = battle.position;
        
        // Create color based on winning faction
        const color = winningFaction === GroupId.AI ? 0x0000ff : 0xff0000;
        
        // Create victory particles using the updated Phaser API
        if (this.scene.add && this.scene.add.particles) {
            // Create particle manager with emitter config
            const particleManager = this.scene.add.particles(x, y, 'particle_texture', {
                speed: { min: 70, max: 250 },  // Increased speed for faster movement
                angle: { min: 0, max: 360 },
                scale: { start: 0.4, end: 0 },  // Reduced from 0.6 to 0.4
                blendMode: 'ADD',
                lifespan: 1200,  // Reduced from 2000 to 1200ms
                quantity: 20,    // Reduced from 30 to 20 particles
                tint: color
            });
            
            // Remove particle manager after a shorter delay (reduced from 2500 to 1500ms)
            this.scene.time.delayedCall(1500, () => {
                particleManager.destroy();
            });
        }
        
        // Add victory text
        const text = this.scene.add.text(
            x,
            y - 40,
            winningFaction === GroupId.AI ? 'AI VICTORY!' : 'CODER VICTORY!',
            {
                fontFamily: 'Arial',
                fontSize: '26px',
                color: winningFaction === GroupId.AI ? '#0000ff' : '#ff0000',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // Animate victory text (reduced animation duration from 3000 to 2000ms)
        this.scene.tweens.add({
            targets: text,
            y: text.y - 40,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }
    
    /**
     * Apply victory stat boosts to surviving enemies
     * @param {Object} battle - The resolved battle
     * @param {string} winningFaction - The winning faction
     * @private
     */
    applyVictoryBoosts(battle, winningFaction) {
        // Get surviving enemies from the winning faction
        const survivors = winningFaction === GroupId.AI 
            ? battle.aiTeam.filter(enemy => enemy && enemy.active && !enemy.isDead)
            : battle.coderTeam.filter(enemy => enemy && enemy.active && !enemy.isDead);
        
        // Apply stat boosts to survivors
        for (const enemy of survivors) {
            if (enemy && enemy.applyTemporaryStatBoost) {
                // 25% boost to speed and damage for 7 seconds
                enemy.applyTemporaryStatBoost('speed', 1.25, 7000);
                enemy.applyTemporaryStatBoost('damage', 1.25, 7000);
                
                // Create visual indicator
                this.createVictoryAura(enemy);
            }
        }
    }
    
    /**
     * Create visual aura around winning enemies
     * @param {BaseEnemy} enemy - The enemy to add aura to
     * @private
     */
    createVictoryAura(enemy) {
        if (!enemy || !enemy.graphics) return;
        
        // Create aura effect if scene has particles
        if (this.scene.particles) {
            const aura = this.scene.particles.createEmitter({
                follow: enemy.graphics,
                scale: { start: 0.2, end: 0 },
                speed: 20,
                lifespan: 600,
                blendMode: 'ADD',
                frequency: 50,
                quantity: 1,
                tint: enemy.groupId === GroupId.AI ? 0x0088ff : 0xff3300
            });
            
            // Remove after boost duration
            this.scene.time.delayedCall(7000, () => {
                aura.stop();
                this.scene.time.delayedCall(600, () => aura.remove());
            });
        }
        
        // Store both the original tint and the proper faction tint
        const originalTint = enemy.graphics.tint;
        const factionTint = enemy.groupId === GroupId.AI ? 0x3498db : 0xe74c3c;
        // Store the faction tint on the enemy for future reference
        enemy.factionTint = factionTint;
        
        const pulseColor = enemy.groupId === GroupId.AI ? 0x00ffff : 0xff6666;
        
        // Set up pulse tween
        const tween = this.scene.tweens.add({
            targets: enemy.graphics,
            tint: pulseColor,
            duration: 400,
            yoyo: true,
            repeat: 8, // 8 pulses (roughly 7 seconds)
            onComplete: () => {
                // Reset tint to faction color (not original) when done
                if (enemy && enemy.graphics) {
                    enemy.graphics.tint = factionTint;
                    
                    // Also apply to any nested sprite components
                    if (enemy.graphics.list && Array.isArray(enemy.graphics.list)) {
                        enemy.graphics.list.forEach(child => {
                            if (child && child.setTint) {
                                child.setTint(factionTint);
                            }
                        });
                    }
                    
                    // Apply to sprite if it exists
                    if (enemy.sprite && enemy.sprite.setTint) {
                        enemy.sprite.setTint(factionTint);
                    }
                }
            }
        });
        
        // Store tween reference on enemy for cleanup
        enemy._victoryTween = tween;
    }
    
    /**
     * Get all active battles
     * @returns {Array} Array of active battles
     */
    getActiveBattles() {
        return [...this.activeBattles];
    }
    
    /**
     * Force-trigger a battle at a specific location (for debugging/testing)
     * @param {number} x - X position for battle
     * @param {number} y - Y position for battle
     * @param {number} radius - Radius to search for enemies
     * @returns {boolean} Whether battle was triggered successfully
     */
    forceBattle(x, y, radius = 300) {
        // Skip if system is disabled or managers are missing
        if (!this.config.enabled || !this.groupManager) return false;
        
        // Find enemies near the target location
        const aiEnemies = this.groupManager.getEntitiesInGroup(GroupId.AI).filter(enemy => {
            if (!enemy || !enemy.graphics) return false;
            const distance = Phaser.Math.Distance.Between(
                x, y, enemy.graphics.x, enemy.graphics.y);
            return distance <= radius;
        });
        
        const coderEnemies = this.groupManager.getEntitiesInGroup(GroupId.CODER).filter(enemy => {
            if (!enemy || !enemy.graphics) return false;
            const distance = Phaser.Math.Distance.Between(
                x, y, enemy.graphics.x, enemy.graphics.y);
            return distance <= radius;
        });
        
        // Check if we have enough enemies
        if (aiEnemies.length < 2 || coderEnemies.length < 2) {
            if (this.isDev) {
                console.debug('Not enough enemies in range for forced battle');
            }
            return false;
        }
        
        // Create and start the battle
        const battleCluster = {
            position: { x, y },
            aiEnemies,
            coderEnemies,
            totalEnemies: aiEnemies.length + coderEnemies.length
        };
        
        this.startBattle(battleCluster);
        this.lastBattleTimestamp = Date.now();
        return true;
    }
    
    /**
     * Check if a specific enemy is currently in battle
     * @param {BaseEnemy} enemy - The enemy to check
     * @returns {boolean} True if enemy is in an active battle
     */
    isEnemyInBattle(enemy) {
        if (!enemy) return false;
        
        for (const battle of this.activeBattles) {
            // Check AI team
            if (battle.aiTeam.includes(enemy)) return true;
            
            // Check CODER team
            if (battle.coderTeam.includes(enemy)) return true;
        }
        
        return false;
    }
    
    /**
     * Enable or disable the faction battle system
     * @param {boolean} enabled - Whether to enable battles
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        
        if (enabled) {
            // Check if we should start battle detection
            if (this.chaosManager && Math.abs(this.chaosManager.getChaos()) >= this.config.chaosThreshold) {
                this.startBattleDetection();
            }
        } else {
            // Stop battle detection if running
            this.stopBattleDetection();
        }
    }
    
    /**
     * Update faction battle manager (called each frame)
     * @param {number} time - Current time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        // Draw debug visualizations if in dev mode
        if (this.isDev && this.scene.input && this.scene.input.keyboard) {
            // Create debug key if doesn't exist yet (K key to toggle debug visualization)
            if (!this._debugKey) {
                this._debugKey = this.scene.input.keyboard.addKey('K');
                this._debugKey.on('down', () => {
                    this._showDebugVisuals = !this._showDebugVisuals;
                    console.debug(`Faction battle debug visuals: ${this._showDebugVisuals ? 'ON' : 'OFF'}`);
                });
                this._showDebugVisuals = false;
                this._debugGraphics = this.scene.add.graphics();
            }
            
            // Draw debug visualizations if enabled
            if (this._showDebugVisuals) {
                this.drawDebugVisuals();
            }
            
            // Show chaos value and threshold in upper left if debug is on
            if (this._showDebugVisuals && this.chaosManager) {
                if (!this._debugText) {
                    this._debugText = this.scene.add.text(10, 10, '', {
                        font: '16px Arial',
                        fill: '#ffffff', 
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setScrollFactor(0).setDepth(999);
                }
                
                const chaosValue = Math.abs(this.chaosManager.getChaos());
                const threshold = this.config.chaosThreshold;
                const status = chaosValue >= threshold ? 'ENABLED' : 'DISABLED';
                this._debugText.setText(
                    `Faction Battles: ${status}\n` +
                    `Chaos: ${Math.round(chaosValue)}% (Threshold: ${threshold}%)\n` +
                    `Active Battles: ${this.activeBattles.length}\n` + 
                    `AI: ${this.groupManager?.getEntitiesInGroup(GroupId.AI)?.length || 0}\n` + 
                    `CODER: ${this.groupManager?.getEntitiesInGroup(GroupId.CODER)?.length || 0}\n` +
                    `Last Battle: ${Date.now() - this.lastBattleTimestamp}ms ago\n` +
                    `Press D to toggle debug, B to force battle`
                );
            } else if (this._debugText) {
                this._debugText.setVisible(false);
            }
        }
    }
    
    /**
     * Draw debug visualization for faction battles
     * @private
     */
    drawDebugVisuals() {
        // Clear previous graphics
        if (this._debugGraphics) {
            this._debugGraphics.clear();
        } else {
            return;
        }
        
        // Draw detection radius around player for reference
        const player = this.scene.player;
        const detectionRadius = this.config.detectionRadius;
        
        if (player && player.getPosition) {
            const playerPos = player.getPosition();
            this._debugGraphics.lineStyle(2, 0xffff00, 0.5);
            this._debugGraphics.strokeCircle(playerPos.x, playerPos.y, detectionRadius);
        }
        
        // Visualize active battles
        for (const battle of this.activeBattles) {
            const { position, status } = battle;
            
            // Draw battle area
            this._debugGraphics.lineStyle(3, 0xffffff, 0.8);
            this._debugGraphics.strokeCircle(position.x, position.y, detectionRadius * 0.7);
            
            // Draw status indicator
            const color = status === 'active' ? 0x00ff00 : 0xffff00;
            this._debugGraphics.lineStyle(2, color, 1);
            this._debugGraphics.strokeCircle(position.x, position.y, 30);
            
            // Draw connecting lines to all enemies in battle
            this._debugGraphics.lineStyle(1, 0xff0000, 0.5);
            for (const enemy of battle.coderTeam) {
                if (enemy && enemy.graphics) {
                    this._debugGraphics.lineBetween(
                        position.x, position.y,
                        enemy.graphics.x, enemy.graphics.y
                    );
                }
            }
            
            this._debugGraphics.lineStyle(1, 0x0000ff, 0.5);
            for (const enemy of battle.aiTeam) {
                if (enemy && enemy.graphics) {
                    this._debugGraphics.lineBetween(
                        position.x, position.y,
                        enemy.graphics.x, enemy.graphics.y
                    );
                }
            }
        }
        
        // Highlight potential battle areas
        if (this.chaosManager && Math.abs(this.chaosManager.getChaos()) >= this.config.chaosThreshold) {
            const clusters = this.findEnemyClusters();
            for (const cluster of clusters) {
                const { position } = cluster;
                
                // Draw potential battle area
                this._debugGraphics.lineStyle(2, 0x00ff00, 0.6);
                this._debugGraphics.strokeCircle(position.x, position.y, detectionRadius * 0.7);
                
                // Draw text showing enemy counts
                if (!this._clusterTexts) this._clusterTexts = [];
                
                // Create or reuse text object
                let clusterText = this._clusterTexts.find(t => !t.visible);
                if (!clusterText) {
                    clusterText = this.scene.add.text(0, 0, '', {
                        font: '12px Arial',
                        fill: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 3
                    }).setDepth(999);
                    this._clusterTexts.push(clusterText);
                }
                
                // Set text content and position
                clusterText.setText(`AI: ${cluster.aiEnemies.length}\nCODER: ${cluster.coderEnemies.length}`);
                clusterText.setPosition(position.x - 20, position.y - 20);
                clusterText.setVisible(true);
            }
            
            // Hide unused text objects
            if (this._clusterTexts) {
                const usedCount = clusters.length;
                for (let i = usedCount; i < this._clusterTexts.length; i++) {
                    this._clusterTexts[i].setVisible(false);
                }
            }
        } else if (this._clusterTexts) {
            // Hide all cluster texts if chaos is too low
            for (const text of this._clusterTexts) {
                text.setVisible(false);
            }
        }
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Stop battle detection
        this.stopBattleDetection();
        
        // Remove event listeners
        EventBus.off('chaos-changed', this.onChaosChanged, this);
        
        // Clear references
        this.scene = null;
        this.groupManager = null;
        this.chaosManager = null;
        this.activeBattles = [];
    }
}