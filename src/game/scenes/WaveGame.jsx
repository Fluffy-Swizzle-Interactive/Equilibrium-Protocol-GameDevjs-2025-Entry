// Wave-based Game Mode Scene
import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { SoundManager } from '../managers/SoundManager';
import { GameObjectManager } from '../managers/GameObjectManager';
import { EnemyManager } from '../managers/EnemyManager';
import { BulletPool } from '../entities/BulletPool';
import { MapManager } from '../managers/MapManager';
import { WaveManager } from '../managers/WaveManager';
import { UIManager } from '../managers/UIManager';
import { PlayerHealth } from '../entities/PlayerHealth';
import { GroupManager } from '../managers/GroupManager';
import { ChaosManager } from '../managers/ChaosManager';
import { DEPTHS, CHAOS } from '../constants';

/**
 * WaveGame scene
 * Implements a 40-wave survival mode with boss waves every 10th wave
 */
export class WaveGame extends Scene {
    constructor() {
        super({ key: 'WaveGame' });
        
        // Initialize game state properties
        this.gameTime = 0; // Track game time for difficulty scaling
        this.enemyList = []; // Track all active enemies
        this.killCount = 0; // Track number of enemies killed (total)
        this.regularKillCount = 0; // Track number of regular enemies killed
        this.bossesKilled = 0; // Track number of boss enemies killed
        
        // Available maps in the game
        this.availableMaps = ['level1', 'darkcave'];
        
        // Check if we're in development mode
        this.isDev = import.meta.env.DEV;
        
        // Spatial grid for collision optimization
        this.gridCellSize = 100; // Size of each grid cell in pixels
        this.spatialGrid = {}; // Will store enemies by grid cell for faster collision checks
        this.gridCache = new Map(); // Cache grid calculations
        this.lastGridUpdate = 0; // Time of last grid update
        this.gridUpdateInterval = 100; // ms between grid updates
    }

    init(data) {
        // Store the weapon type received from menu selection
        this.weaponType = data.weaponType || 'minigun'; 
        this.startWave = data.startWave || 0;
        
        // Reset game state for new game
        this.resetGameState();
    }

    /**
     * Reset all game state variables for a new game
     */
    resetGameState() {
        this.killCount = 0;
        this.regularKillCount = 0;
        this.bossesKilled = 0;
        this.gameTime = 0;
        this.survivalTime = 0;
        this.enemyList = [];
        this.isPaused = false;
        this.isGameOver = false;
    }

    create() {
        this.setupMap();
        this.setupSoundManager(); // Initialize sound manager first
        this.setupObjectManager(); // Initialize object pooling system
        this.setupGroupManager(); // Initialize group management system
        this.setupChaosManager(); // Initialize chaos management system
        this.setupUIManager(); // Setup UI before game objects
        this.setupGameObjects(); // Then create player and other objects
        this.setupWaveManager(); // Setup wave manager after other systems
        this.setupInput();
        
        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Set up the sound manager and start ambient music
     */
    setupSoundManager() {
        // Create sound manager
        this.soundManager = new SoundManager(this);
        
        // Initialize ambient music
        this.soundManager.initBackgroundMusic('ambient_music', {
            volume: 0.4,  // Slightly lower volume for ambient music
            loop: true
        });
        
        // Initialize sound effects
        this.soundManager.initSoundEffect('shoot_minigun', {
            volume: 0.5,
            rate: 1.0
        });
        
        this.soundManager.initSoundEffect('shoot_shotgun', {
            volume: 0.6,
            rate: 0.9
        });
        
        // Try to unlock audio context as early as possible
        if (this.sound.locked) {
            console.debug('Audio system is locked. Attempting to unlock...');
            this.sound.once('unlocked', () => {
                console.debug('Audio system unlocked successfully');
                // Start playing ambient music with fade in once audio is unlocked
                this.soundManager.playMusic('ambient_music', {
                    fadeIn: 2000  // 2 second fade in
                });
            });
        } else {
            // Sound already unlocked, play immediately
            this.soundManager.playMusic('ambient_music', {
                fadeIn: 2000  // 2 second fade in
            });
        }
    }

    /**
     * Set up the global object manager for pooling game objects
     */
    setupObjectManager() {
        // Create the global object manager
        this.gameObjectManager = new GameObjectManager(this);
        
        // Create groups for game objects
        this.bullets = this.add.group();
        this.enemies = this.add.group();
        
        // Initialize the bullet pool
        this.bulletPool = new BulletPool(this, {
            initialSize: 50,
            maxSize: 500,
            growSize: 20
        });
        
        // Initialize the enemy manager with pools for different enemy types
        this.enemyManager = new EnemyManager(this, {
            initialSize: 20,
            maxSize: 500,
            growSize: 5
        });
    }
    
    /**
     * Set up the group manager to track enemy factions
     */
    setupGroupManager() {
        // Create the group manager to track enemy factions
        this.groupManager = new GroupManager(this);
    }
    
    /**
     * Set up the chaos manager for chaos mechanics
     */
    setupChaosManager() {
        // Create the chaos manager with default settings
        this.chaosManager = new ChaosManager(this, {
            initialValue: CHAOS.DEFAULT_VALUE,
            autoAdjust: false // Start with auto-adjust disabled
        });
    }

    /**
     * Set up the UI manager for HUD elements
     */
    setupUIManager() {
        this.uiManager = new UIManager(this);
        this.uiManager.init({
            showDebug: this.isDev // Only show debug info in development mode
        });
    }

    /**
     * Set up the wave manager to handle wave progression
     */
    setupWaveManager() {
        const startWave = this.startWave;
        if (this.startWave !== undefined && this.startWave > 0) {
            // For non-zero starting waves, configure the wave manager to start at that wave
            this.waveManager = new WaveManager(this, {
                maxWaves: 40,
                baseEnemyCount: 50,
                enemyCountGrowth: 1.2,
                bossWaveInterval: 10
            });
            
            // Override the currentWave in the manager after creation
            this.waveManager.currentWave = startWave;
            
            // Initialize the wave manager with UI reference
            this.waveManager.init(this.uiManager);
            
            // Update UI immediately to show starting at a later wave
            if (this.uiManager) {
                this.uiManager.updateWaveUI(this.startWave, this.waveManager.maxWaves);
            }
        } else {
            // Default case - start from wave 0
            this.waveManager = new WaveManager(this, {
                maxWaves: 40,
                baseEnemyCount: 50,
                enemyCountGrowth: 1.2,
                bossWaveInterval: 10
            });
            
            // Initialize the wave manager with UI reference
            this.waveManager.init(this.uiManager);
        }
        
        // Listen for wave events
        this.events.on('wave-start', this.onWaveStart, this);
        this.events.on('wave-completed', this.onWaveComplete, this);
        this.events.on('victory', this.onVictory, this);
        
        // Show the Next Wave button at game start to initiate the first wave
        if (this.uiManager) {
            // Display welcome banner first
            this.uiManager.elements.waveBannerBg.setFillStyle(0x000066, 0.8);
            this.uiManager.elements.waveBannerText.setText('Wave Mode\nClick "Start Next Wave" to begin!');
            this.uiManager.elements.waveBannerBg.setVisible(true);
            this.uiManager.elements.waveBannerText.setVisible(true);
            
            // Animate the banner
            this.tweens.add({
                targets: [this.uiManager.elements.waveBannerBg, this.uiManager.elements.waveBannerText],
                y: { from: this.cameras.main.height * 0.2, to: this.cameras.main.height * 0.3 },
                alpha: { from: 0, to: 1 },
                duration: 800,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Show next wave button after the banner animation
                    this.uiManager.showNextWaveButton();
                    
                    // Hide the banner after a delay
                    this.time.delayedCall(3000, () => {
                        this.tweens.add({
                            targets: [this.uiManager.elements.waveBannerBg, this.uiManager.elements.waveBannerText],
                            y: this.cameras.main.height * 0.2,
                            alpha: 0,
                            duration: 800,
                            ease: 'Back.easeIn',
                            onComplete: () => {
                                this.uiManager.elements.waveBannerBg.setVisible(false);
                                this.uiManager.elements.waveBannerText.setVisible(false);
                            }
                        });
                    });
                }
            });
        }
    }

    /**
     * Set up the game map and boundaries
     */
    setupMap() {
        // Initialize map manager
        this.mapManager = new MapManager(this, {
            scaleFactor: 1.5,
            enablePhysics: true
        });
        
        // Register available maps
        this.mapManager.registerMaps([
            {
                key: 'level1',
                tilemapKey: 'map',
                tilesets: [
                    {
                        key: 'level1',
                        name: 'level1'
                    }
                ],
                layers: [
                    {
                        name: 'Tile Layer 1',
                        tilesetKey: 'level1',
                        depth: 0
                    }
                ]
            },
            {
                key: 'darkcave',
                tilemapKey: 'darkcavemap',
                tilesets: [
                    {
                        key: 'darkcavenet',
                        name: 'DarkNetCaveSet'
                    }
                ],
                layers: [
                    {
                        name: 'Ground',
                        tilesetKey: 'darkcavenet',
                        depth: 0
                    },
                    {
                        name: 'Walls',
                        tilesetKey: 'darkcavenet',
                        depth: 1,
                    },
                    {
                        name: 'Spawner',
                        tilesetKey: 'darkcavenet',
                        depth: 0,
                        visible: true
                    }
                ],
                // Configure collision layers
                collisionLayers: ['Walls'],
                // Additional settings for dark cave map
                options: {
                    scaleFactor: 1.4
                }
            }
        ]);
        
        // Load the initial map (level1)
        const mapData = this.mapManager.loadMap('darkcave');
        
        // Store the ground layer for easy access
        this.groundLayer = this.mapManager.getLayer('Tile Layer 1');
        
        // Get map dimensions from the map manager
        this.mapDimensions = this.mapManager.getMapDimensions();
        
        // Debug info for development mode
        if (this.isDev) {
            console.debug(`Map loaded: ${this.mapManager.currentMapKey}`);
            console.debug(`Map dimensions: ${this.mapDimensions.width}x${this.mapDimensions.height}`);
        }
    }

    /**
     * Set up game objects including player, enemies, and bullets
     */
    setupGameObjects() {
        // Create player instance (in center of map)
        const playerX = this.mapDimensions.width / 2;
        const playerY = this.mapDimensions.height / 2;
        this.player = new Player(this, playerX, playerY);
        
        // Initialize player's weapon
        this.player.initWeaponProperties(this.weaponType);
        
        // Setup player health system
        this.playerHealth = new PlayerHealth(this, {
            maxHealth: 100,
            hitDamage: 34 // Dies in 3 hits
        });
        
        // Setup camera to follow player
        this.setupCamera();
    }

    /**
     * Set up the camera to follow the player
     */
    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.mapDimensions.width, this.mapDimensions.height);
        this.cameras.main.startFollow(this.player.graphics, true, 0.09, 0.09);
        this.cameras.main.setZoom(0.7);
    }

    /**
     * Set up input handlers for keyboard and mouse
     */
    setupInput() {
        // Track mouse position
        this.input.on('pointermove', (pointer) => {
            this.mouseX = pointer.worldX;
            this.mouseY = pointer.worldY;
        });
        
        // Track mouse states
        this.input.on('pointerdown', () => {
            this.isMouseDown = true;
        });
        
        this.input.on('pointerup', () => {
            this.isMouseDown = false;
        });
        
        // Set up WASD keys
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Set up spacebar for pause
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    /**
     * Handle start of a new wave
     * @param {object} data - Wave data including wave number and boss flag
     */
    onWaveStart(data) {
        // Log wave start
        if (this.isDev) {
            console.debug(`Wave ${data.wave} started. Boss wave: ${data.isBossWave}`);
        }
    }

    /**
     * Handle completion of a wave
     * @param {object} data - Wave data including wave number and last wave flag
     */
    onWaveComplete(data) {
        // Log wave completion
        if (this.isDev) {
            console.debug(`Wave ${data.wave} completed. Last wave: ${data.isLastWave}`);
        }
    }

    /**
     * Handle game victory (all waves completed)
     */
    onVictory() {
        if (this.isDev) {
            console.debug('Victory! All waves completed.');
        }
        
        // Show victory UI
        this.uiManager.showVictoryUI();
        
        // Set game over state
        this.isGameOver = true;
    }

    /**
     * Handle pause state
     * @param {boolean} isPaused - Whether to pause or unpause
     * @param {string} reason - Reason for pause state change
     */
    setPauseState(isPaused, reason = 'toggle') {
        this.isPaused = isPaused;
        
        // Show/hide pause overlay based on reason
        this.uiManager.elements.pauseOverlay?.setVisible(isPaused && reason === 'toggle');
        this.uiManager.elements.pauseText?.setVisible(isPaused && reason === 'toggle');
        
        // Don't pause game if in wave pause phase (between waves)
        if (this.waveManager && this.waveManager.isInPausePhase()) return;
        
        // Pause/resume all physics and timers
        if (isPaused) {
            this.physics.pause();
            
            // Pause ambient music
            if (this.soundManager) {
                this.soundManager.pauseMusic();
            }
        } else {
            this.physics.resume();
            
            // Resume ambient music
            if (this.soundManager) {
                this.soundManager.resumeMusic();
            }
        }
    }

    togglePause() {
        if (this.isGameOver) return; // Don't allow pausing if game is over
        this.setPauseState(!this.isPaused, 'toggle');
    }

    update(time, delta) {
        // Handle pause state
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            this.togglePause();
        }
        
        // If game is paused or over, don't update game logic
        if (this.isPaused || this.isGameOver) {
            return;
        }
        
        // Update game timers
        this.updateGameTimers(delta);
        
        // Update player, bullets, and enemies
        this.updateGameObjects();
        
        // Update wave manager
        if (this.waveManager) {
            this.waveManager.update();
        }
        
        // Update UI manager
        if (this.uiManager) {
            this.uiManager.update();
        }
        
        // Check for collisions
        this.checkCollisions();
    }

    /**
     * Update game time and survival time
     * @param {number} delta - Time since last frame in ms
     */
    updateGameTimers(delta) {
        // Update game time for difficulty scaling
        this.gameTime += delta;
        
        // Update survival time
        this.survivalTime += delta / 1000;
    }

    /**
     * Update all game objects (player, bullets, enemies)
     */
    updateGameObjects() {
        // Update player
        this.player.update();
        
        // Attempt to shoot if mouse is held down
        if (this.isMouseDown) {
            this.player.shoot();
        }
        
        // Update bullets using the pooling system
        this.updateBullets();
        
        // Update enemies using the enemy manager
        if (this.enemyManager) {
            this.enemyManager.update();
        }
    }

    updateBullets() {
        // Use the bullet pool to update and cull bullets
        this.bulletPool.updateBullets(
            // Custom update function - not needed since standard movement is applied in the pool
            null,
            // Culling function - return true to release the bullet back to the pool
            (bullet) => {
                // Get distance from player
                const playerPos = this.player.getPosition();
                const dx = bullet.x - playerPos.x;
                const dy = bullet.y - playerPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Return true if bullet should be culled (too far or too old)
                return distance > 1000 || bullet.lifetime > 3000;
            }
        );
    }

    checkCollisions() {
        this.checkBulletEnemyCollisions();
        this.checkPlayerEnemyCollisions();
    }

    checkBulletEnemyCollisions() {
        // Update spatial grid
        this.updateSpatialGrid();
        
        // Check collisions with spatial optimization
        this.bullets.getChildren().forEach(bullet => {
            if (!bullet.active) return;
            
            // Get bullet's cell and adjacent cells
            const cellX = Math.floor(bullet.x / this.gridCellSize);
            const cellY = Math.floor(bullet.y / this.gridCellSize);
            
            // Check only enemies in relevant cells
            for (let x = cellX - 1; x <= cellX + 1; x++) {
                for (let y = cellY - 1; y <= cellY + 1; y++) {
                    const cellKey = `${x},${y}`;
                    const enemiesInCell = this.spatialGrid[cellKey] || [];
                    
                    // Check collisions with enemies in this cell
                    enemiesInCell.forEach(enemyGraphics => {
                        if (!enemyGraphics.active || !bullet.active) return;
                        
                        const distance = Phaser.Math.Distance.Between(
                            bullet.x, bullet.y,
                            enemyGraphics.x, enemyGraphics.y
                        );
                        
                        if (distance < (this.player.caliber + enemyGraphics.parentEnemy.size/2)) {
                            // Damage enemy with bullet's damage value
                            enemyGraphics.parentEnemy.takeDamage(this.player.bulletDamage);
                            
                            // Reduce bullet health
                            bullet.health--;
                            
                            // Visual feedback - make bullet flash
                            const originalColor = this.player.bulletColor;
                            bullet.fillColor = 0xffffff;
                            
                            // Reset bullet color after a short delay if it still exists
                            this.time.delayedCall(50, () => {
                                if (bullet && bullet.active) {
                                    bullet.fillColor = originalColor;
                                }
                            });
                            
                            // Only release bullet back to pool if its health is depleted
                            if (bullet.health <= 0) {
                                this.bulletPool.releaseBullet(bullet);
                            }
                        }
                    });
                }
            }
        });
    }
    
    /**
     * Check for collisions between player and enemies
     */
    checkPlayerEnemyCollisions() {
        if (!this.player || !this.playerHealth) return;
        
        // Skip if player is invulnerable
        if (this.playerHealth.getInvulnerable()) return;
        
        const playerPos = this.player.getPosition();
        const playerRadius = this.player.radius;
        
        // Use the enemy manager's active enemies list
        const activeEnemies = this.enemyManager ? this.enemyManager.enemies : [];
        
        for (const enemy of activeEnemies) {
            if (!enemy || !enemy.active || !enemy.graphics || !enemy.graphics.active) continue;
            
            // Calculate distance between player and enemy
            const distance = Phaser.Math.Distance.Between(
                playerPos.x, playerPos.y,
                enemy.graphics.x, enemy.graphics.y
            );
            const enemyDamage = enemy.damage
            // Check for collision
            if (distance < (playerRadius + enemy.size/2)) {
                // Player takes damage
                const died = this.playerHealth.takeDamage(enemyDamage);
                
                if (died == true) {
                    // Player died, handle game over
                    return;
                }
                
                // Push player away from enemy for better gameplay feel
                const angle = Phaser.Math.Angle.Between(
                    enemy.graphics.x, enemy.graphics.y,
                    playerPos.x, playerPos.y
                );
                
                // Apply knockback
                const knockbackDistance = 30;
                const knockbackX = Math.cos(angle) * knockbackDistance;
                const knockbackY = Math.sin(angle) * knockbackDistance;
                
                // Set player velocity
                this.player.velX = knockbackX * 0.2;
                this.player.velY = knockbackY * 0.2;
                
                break; // Process only one collision per frame
            }
        }
    }
    
    /**
     * Update the spatial grid for efficient collision detection
     */
    updateSpatialGrid() {
        const now = this.time.now;
        if (now - this.lastGridUpdate < this.gridUpdateInterval) {
            return; // Use cached grid
        }

        this.spatialGrid = {};
        this.enemies.getChildren().forEach(enemy => {
            const cellX = Math.floor(enemy.x / this.gridCellSize);
            const cellY = Math.floor(enemy.y / this.gridCellSize);
            const cellKey = `${cellX},${cellY}`;
            
            if (!this.spatialGrid[cellKey]) {
                this.spatialGrid[cellKey] = [];
            }
            this.spatialGrid[cellKey].push(enemy);
        });

        this.lastGridUpdate = now;
    }

    /**
     * Handle player death
     * Called when player health reaches 0
     */
    playerDeath() {
        // Player is already dead
        if (this.isGameOver) return;
        
        // Set game over state
        this.isGameOver = true;
        
        // Stop any active waves
        if (this.waveManager) {
            // Reset wave state but don't start new wave
            this.waveManager.isPaused = true;
            this.waveManager.isWaveActive = false;
            
            // Stop any ongoing enemy spawns
            if (this.waveManager.spawnTimer) {
                this.waveManager.spawnTimer.destroy();
                this.waveManager.spawnTimer = null;
            }
        }
        
        // Stop ambient music with fade out
        if (this.soundManager) {
            this.soundManager.stopMusic(1000); // 1s fade out
        }

        // Show game over UI
        if (this.uiManager) {
            this.time.delayedCall(1500, () => {
                this.uiManager.showGameOverUI();
            });
        }
    }

    /**
     * Method called when an enemy is killed
     * @param {boolean} isBoss - Whether the killed enemy was a boss
     */
    onEnemyKilled(isBoss, x, y, enemyType) {
        // Increment total kill count
        this.killCount++;
        
        // Update the kill counter UI
        if (this.uiManager) {
            this.uiManager.updateScoreUI(this.killCount);
        }
        
        // Create death effect at enemy position
        if (x !== undefined && y !== undefined) {
            this.createEnemyDeathEffect(x, y);
        }
        
        if (isBoss) {
            // If a boss was killed, increment the boss kill counter
            this.bossesKilled++;
            
            // Create special effects for boss death
            if (x !== undefined && y !== undefined) {
                this.createBossDeathEffect(x, y);
            }
        } else {
            // If a regular enemy was killed, increment the regular kill counter
            this.regularKillCount++;
        }
        
        // IMPORTANT: Notify the WaveManager about the killed enemy
        if (this.waveManager) {
            this.waveManager.onEnemyKilled(isBoss, enemyType);
        }
    }
    
    /**
     * Create particle effect for enemy death
     */
    createEnemyDeathEffect(x, y) {
        // Create a particle emitter
        const particles = this.add.particles(x, y, 'particle_texture', {
            speed: { min: 50, max: 200 },
            scale: { start: 0.15, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 100,
            blendMode: 'ADD',
            quantity: 5,
            angle: { min: 0, max: 360 }
        });
        
        // Auto-destroy the emitter after it's done
        particles.setDepth(50);
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }
    
    /**
     * Create special effect for boss death
     */
    createBossDeathEffect(x, y) {
        // Create a large explosion effect
        for (let i = 0; i < 5; i++) {
            // Stagger the explosions for dramatic effect
            this.time.delayedCall(i * 100, () => {
                // Randomize positions slightly for each explosion
                const offsetX = Phaser.Math.Between(-30, 30);
                const offsetY = Phaser.Math.Between(-30, 30);
                
                // Create a particle emitter
                const particles = this.add.particles(x + offsetX, y + offsetY, 'particle_texture', {
                    speed: { min: 100, max: 300 },
                    scale: { start: 0.4, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 600,
                    blendMode: 'ADD',
                    quantity: 30,
                    angle: { min: 0, max: 360 }
                });
                
                // Auto-destroy the emitter after it's done
                particles.setDepth(200);
                this.time.delayedCall(1000, () => {
                    particles.destroy();
                });
            });
        }
    }
}