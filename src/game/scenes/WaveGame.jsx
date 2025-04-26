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
import { GroupWeightManager } from '../managers/GroupWeightManager';
import { XPManager } from '../managers/XPManager';
import { CashManager } from '../managers/CashManager';
import { SpritePool } from '../entities/SpritePool';
import { CollectibleManager } from '../managers/CollectibleManager';
import { FactionBattleManager } from '../managers/FactionBattleManager';
import ShopManager from '../managers/ShopManager';
import { HealthRegenerationSystem } from '../systems/HealthRegenerationSystem';
import { AnimationManager } from '../managers/AnimationManager';
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
        this.availableMaps = ['level1', 'darkcave', 'level1redux'];

        // Check if we're in development mode
        this.isDev = import.meta.env.DEV;

        // Debug options
        this.showHitboxes = false; // Debug option to show hitboxes

        // Spatial grid for collision optimization
        this.gridCellSize = 100; // Size of each grid cell in pixels
        this.spatialGrid = {}; // Will store enemies by grid cell for faster collision checks
        this.gridCache = new Map(); // Cache grid calculations
        this.lastGridUpdate = 0; // Time of last grid update
        this.gridUpdateInterval = 100; // ms between grid updates
    }

    init(data) {
        // Remove weapon type selection since we're using a single weapon
        this.startWave = data.startWave || 0;

        // Store whether music has been faded out in the previous scene
        this.musicFadedOut = data.musicFadedOut || false;

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
        // Force stop all audio when entering the game scene
        // This is necessary to ensure the menu music stops completely
        this.sound.stopAll();

        this.setupMap();
        this.setupSoundManager(); // Initialize sound manager first
        this.setupObjectManager(); // Initialize object pooling system
        this.setupGroupManager(); // Initialize group management system
        this.setupChaosManager(); // Initialize chaos management system
        this.setupGroupWeightManager(); // Initialize group weight management system
        this.setupUIManager(); // Setup UI before game objects
        this.setupGameObjects(); // Then create player and other objects
        this.setupWaveManager(); // Setup wave manager after other systems
        this.setupCollectibleManager(); // Setup collectible manager
        this.setupShopManager(); // Setup shop system
        this.setupFactionBattleManager(); // Setup faction battle manager
        this.setupHealthRegenerationSystem(); // Setup health regeneration system
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

        // Initialize shop music
        this.soundManager.initBackgroundMusic('shop_music', {
            volume: 0.4,  // Same volume as ambient music
            loop: true
        });

        // Initialize action music for wave gameplay
        this.soundManager.initBackgroundMusic('action_music', {
            volume: 0.4,  // Same volume as other music
            loop: true
        });

        // Initialize sound effects
        this.soundManager.initSoundEffect('shoot_weapon', {
            volume: 0.5,
            rate: 1.0
        });

        this.soundManager.initSoundEffect('level_up', {
            volume: 0.7,
            rate: 1.0
        });

        // Initialize cash pickup sound effect
        this.soundManager.initSoundEffect('cash_pickup', {
            volume: 0.5,
            rate: 1.0
        });

        // Initialize player hit sound effect
        this.soundManager.initSoundEffect('player_hit', {
            volume: 0.6,
            rate: 1.0
        });

        // Initialize player death sound effect
        this.soundManager.initSoundEffect('player_death', {
            volume: 0.7,
            rate: 1.0
        });

        // Initialize shop upgrade sound effect
        this.soundManager.initSoundEffect('shop_upgrade', {
            volume: 0.6,
            rate: 1.1,
            detune: -100
        });

        // Initialize boss alert sound effect
        this.soundManager.initSoundEffect('boss_alert', {
            volume: 0.8,
            rate: 1.0
        });

        // Initialize boss defeat sound effect
        this.soundManager.initSoundEffect('boss_defeat', {
            volume: 0.8,
            rate: 1.0
        });

        // Initialize explosion sound effect for explosive shots (with reduced volume)
        this.soundManager.initSoundEffect('explosion', {
            volume: 0.15, // Reduced volume to make explosions quieter
            rate: 1.0
        });

        // Initialize wave end sound effects (7 variations)
        for (let i = 1; i <= 7; i++) {
            this.soundManager.initSoundEffect(`waveEnd${i}`, {
                volume: 0.7,
                rate: 1.0
            });
        }

        // Start playing shop music with fade in
        this.soundManager.playMusic('shop_music', {
            fadeIn: 2000  // 2 second fade in
        });
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

        // Initialize SpritePool for pickups and effects
        this.spritePool = new SpritePool(this, {
            initialSize: 50,
            maxSize: 300,
            growSize: 20
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
     * Set up the group weight manager for faction weights
     */
    setupGroupWeightManager() {
        // Create the group weight manager
        this.groupWeightManager = new GroupWeightManager(this);

        // Connect the group weight manager with the chaos manager
        if (this.chaosManager) {
            this.chaosManager.setGroupWeightManager(this.groupWeightManager);
        }
    }

    /**
     * Set up the UI manager for HUD elements
     */
    setupUIManager() {
        this.uiManager = new UIManager(this);
        this.uiManager.init({
            showDebug: this.isDev // Only show debug info in development mode
        });

        // Initialize XP Manager
        this.xpManager = new XPManager(this);

        // Initialize Cash Manager
        this.cashManager = new CashManager(this, 0, 1.0);

        // Subscribe to XP events to update UI
        EventBus.on('xp-updated', (data) => {
            if (this.uiManager) {
                this.uiManager.updateXPUI(data);
            }
        });

        EventBus.on('level-up', (data) => {
            if (this.uiManager) {
                this.uiManager.showLevelUpAnimation(data.level);
            }

            // Play level up sound when player levels up
            if (this.soundManager) {
                this.soundManager.playSoundEffect('level_up', {
                    volume: 0.7
                });
            }
        });

        // Listen for wave-completed events on the EventBus to play sound and switch music
        EventBus.on('wave-completed', () => {
            if (this.soundManager) {
                // Play wave end sound
                this.soundManager.playRandomWaveEndSound();

                // Switch to shop music with crossfade
                this.soundManager.playMusic('shop_music', {
                    fadeIn: 2000,  // 2 second fade in
                    fadeOut: 2000  // 2 second fade out for current music
                });
            }
        });

        // Listen for collectible-collected events on the EventBus to play appropriate sounds
        EventBus.on('collectible-collected', (data) => {
            if (this.soundManager && data && data.type === 'cash_pickup') {
                this.soundManager.playSoundEffect('cash_pickup', {
                    volume: 0.5,
                    detune: Math.random() * 100 - 50 // Random detune between -50 and +50 for variety
                });
            }
        });

        // Listen for player-damaged events on the EventBus to play hit sound
        EventBus.on('player-damaged', () => {
            if (this.soundManager) {
                this.soundManager.playSoundEffect('player_hit', {
                    volume: 0.6,
                    detune: Math.random() * 100 - 50 // Random detune between -50 and +50 for variety
                });
            }
        });

        // Listen for player-death events on the EventBus to play death sound
        EventBus.on('player-death', () => {
            if (this.soundManager) {
                this.soundManager.playSoundEffect('player_death', {
                    volume: 0.7,
                    detune: Math.random() * 50 - 25 // Slight random detune for variety
                });
            }
        });

        // Listen for shop-upgrade-click events on the EventBus to play upgrade sound
        EventBus.on('shop-upgrade-click', (data) => {
            if (this.soundManager) {
                this.soundManager.playSoundEffect('shop_upgrade', {
                    volume: data?.volume || 0.6,
                    detune: (data?.detune || -100) + (Math.random() * 50 - 25), // Add slight random variation
                    rate: data?.rate || 1.1
                });
            }
        });

        // Listen for boss-spawned events on the EventBus to play boss alert sound
        EventBus.on('boss-spawned', (data) => {
            if (this.soundManager) {
                this.soundManager.playSoundEffect('boss_alert', {
                    volume: 0.8,
                    // No detune or rate variation to keep the alert sound consistent
                });

                // Show boss warning message if UI manager is available
                if (this.uiManager && this.uiManager.showBossWarning) {
                    this.uiManager.showBossWarning(data?.bossType || 'boss1');
                }
            }
        });

        // Listen for boss-defeated events on the EventBus to play boss defeat sound
        EventBus.on('boss-defeated', (data) => {
            if (this.soundManager) {
                this.soundManager.playSoundEffect('boss_defeat', {
                    volume: 0.8,
                    // No detune or rate variation to keep the defeat sound consistent
                });

                // Show boss defeated message if UI manager is available
                if (this.uiManager && this.uiManager.showBossDefeatedMessage) {
                    this.uiManager.showBossDefeatedMessage(data?.bossType || 'boss1');
                }
            }
        });

        // Listen for wave-start events on the EventBus
        // Note: The actual music change is handled in the onWaveStart method
        EventBus.on('wave-start', () => {
            // This listener is kept for consistency and potential future use
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
     * Set up collisions between player and map layers
     */
     setupPlayerCollisions() {
        // Get collision layers from the map manager
        if (this.mapManager && this.mapManager.currentMapKey) {
            // Get the map configuration directly from the maps Map in the MapManager
            const mapConfig = this.mapManager.maps.get(this.mapManager.currentMapKey);

            if (mapConfig && mapConfig.collisionLayers) {
                console.log(`Setting up collisions for map: ${this.mapManager.currentMapKey}`);
                console.log(`Collision layers: ${mapConfig.collisionLayers.join(', ')}`);

                // Set up collisions for each layer
                mapConfig.collisionLayers.forEach(layerName => {
                    const layer = this.mapManager.getLayer(layerName);
                    if (layer) {
                        console.log(`Adding collider for layer: ${layerName}`);

                        // Add collision between player and this layer
                        const collider = this.physics.add.collider(
                            this.player.graphics,
                            layer,
                            null, // No callback needed
                            null, // No process callback needed
                            this
                        );

                        // Store the collider for reference
                        if (!this.playerColliders) {
                            this.playerColliders = [];
                        }
                        this.playerColliders.push(collider);

                        // Debug visualization removed
                    } else {
                        console.warn(`Layer not found: ${layerName}`);
                    }
                });
            } else {
                console.warn('No collision layers defined for current map');
            }
        } else {
            console.warn('Map manager or current map key not available');
        }
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
     * Set up game objects including player, enemies, and bullets
     */
    setupGameObjects() {
        // Create player instance (in center of map)
        const playerX = this.mapDimensions.width / 2;
        const playerY = this.mapDimensions.height / 2;
        this.player = new Player(this, playerX, playerY);

        // Initialize player's weapon system
        this.player.initWeaponSystem();

        // Setup player health system
        this.playerHealth = new PlayerHealth(this, {
            maxHealth: 100,
            hitDamage: 34, // Dies in 3 hits
            damageResistance: 0 // Start with 0% defense
        });

        // Create animations for enemies
        this.createEnemyAnimations();

        // Setup collision with map layers
        this.setupPlayerCollisions();

        // Setup camera to follow player
        this.setupCamera();
    }

    /**
     * Create animations for all enemy types
     */
    createEnemyAnimations() {
        // Initialize the animation manager if not already done
        if (!this.animationManager) {
            this.animationManager = new AnimationManager(this);
        }

        // Enemy1 animations (fast green enemy)
        this.animationManager.createEnemyAnimations('enemy1', {
            idle: { start: 0, end: 3, frameRate: 8, repeat: -1 },
            run: { start: 0, end: 3, frameRate: 10, repeat: -1 },
            // Fix death animation - explicitly define frame sequence since frames aren't sequential in JSON
            death: {
                frames: [
                    'enemy1_death_0.png',
                    'enemy1_death_1.png',
                    'enemy1_death_2.png',
                    'enemy1_death_3.png',
                    'enemy1_death_4.png',
                    'enemy1_death_5.png',
                    'enemy1_death_6.png',
                    'enemy1_death_7.png'
                ],
                frameRate: 10,
                repeat: 0
            },
            shoot: { start: 0, end: 3, frameRate: 12, repeat: 0 }
        });

        // Enemy2 animations (slower blue enemy)
        this.animationManager.createEnemyAnimations('enemy2', {
            idle: { start: 0, end: 7, frameRate: 8, repeat: -1 },
            run: { start: 0, end: 3, frameRate: 8, repeat: -1 },
            death: { start: 0, end: 7, frameRate: 12, repeat: 0 },
            shoot: { start: 0, end: 3, frameRate: 12, repeat: 0 }
        });

        // Add special activate animation for enemy2
        this.animationManager.createAnimation(
            'enemy2_activate',
            'enemy2',
            'enemy2_activate_',
            '.png',
            0,
            4,
            { frameRate: 10, repeat: 0 }
        );

        // Enemy3 animations (ranged orange enemy)
        this.animationManager.createEnemyAnimations('enemy3', {
            idle: { start: 0, end: 2, frameRate: 6, repeat: -1 },
            run: { start: 0, end: 3, frameRate: 10, repeat: -1 },
            death: { start: 0, end: 7, frameRate: 12, repeat: 0 },
            shoot: { start: 0, end: 3, frameRate: 10, repeat: 0 }
        });

        // Boss1 animations - Always try to create regardless of texture check
        // AnimationManager will handle the case where textures don't exist
        this.animationManager.createEnemyAnimations('boss1', {
            idle: { start: 0, end: 3, frameRate: 6, repeat: -1 },
            run: { start: 0, end: 5, frameRate: 12, repeat: -1 },
            death: { start: 0, end: 7, frameRate: 8, repeat: 0 },
            shoot: { start: 0, end: 4, frameRate: 14, repeat: 0 },
            attack: { start: 0, end: 5, frameRate: 10, repeat: 0 }
        });
    }

    /**
     * Set up the collectible manager for handling collectibles
     */
    setupCollectibleManager() {
        // Initialize CollectibleManager with configuration options
        this.collectibleManager = new CollectibleManager(this, {
            xpCollectionRadius: 40,
            cashCollectionRadius: 40,
            healthCollectionRadius: 30,
            collectionInterval: 100 // Check collectibles every 100ms
        });

        // Register all managers with the collectible manager
        if (this.xpManager) {
            this.collectibleManager.registerManager('xpManager', this.xpManager);
        }

        if (this.cashManager) {
            this.collectibleManager.registerManager('cashManager', this.cashManager);
        }

        // Log initialization in dev mode
        if (this.isDev) {
            console.debug('CollectibleManager initialized with XP and Cash managers');
        }
    }

    /**
     * Set up the shop manager for upgrades between waves
     */
    setupShopManager() {
        // Create RNG for generating upgrades
        const rng = {
            pick: (array) => {
                return array[Math.floor(Math.random() * array.length)];
            },
            range: (min, max) => {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        };

        // Create weapon reference for upgrades
        const weapon = {
            type: 'Standard',
            damage: this.player.bulletDamage || 10,
            fireRate: this.player.fireRate || 0.1,
            pierce: this.player.bulletPierce || 1
        };

        // Initialize shop manager
        this.shopManager = new ShopManager(this, this.player, weapon, rng);

        // Initialize player credits if not already set
        if (this.player.credits === undefined) {
            this.player.credits = 100; // Starting credits

            // Update cash display
            if (this.cashManager) {
                this.cashManager.setCash(this.player.credits);
            }
        }

        // Log initialization in dev mode
        if (this.isDev) {
            console.debug('ShopManager initialized');
        }
    }

    /**
     * Set up the faction battle manager
     * Manages battles between enemy factions when chaos levels are high
     */
    setupFactionBattleManager() {
        // Initialize faction battle manager with configuration
        this.factionBattleManager = new FactionBattleManager(this, {
            chaosThreshold: 40, // Start battles at 40% chaos
            requiredEnemiesPerFaction: 3, // Reduced from 5 to make battles more likely
            detectionRadius: 400, // Increased from 300 to catch more enemies
            battleCheckInterval: 1500, // Reduced from 3000 to check more frequently
            enabled: true,
            isDev: this.isDev // Pass dev mode flag for additional logging
        });

        // Set up particles system for battle effects if not already available
        if (!this.particles) {
            this.particles = this.add.particles('particle_texture');
        }

        // Initialize manager after creation
        this.factionBattleManager.initialize();

        // Add a debug key to force battles (dev only)
        if (this.isDev) {
            this.input.keyboard.addKey('B').on('down', () => {
                if (this.factionBattleManager) {
                    // Get player position to use as center
                    const pos = this.player.getPosition();
                    // Try to force a battle at player position with large radius
                    const result = this.factionBattleManager.forceBattle(pos.x, pos.y, 800);
                    console.debug(`Forced battle attempt: ${result ? 'SUCCESS' : 'FAILED - Not enough enemies nearby'}`);
                }
            });

            console.debug('FactionBattleManager initialized. Press B to force battles.');
        }
    }

    /**
     * Set up the health regeneration system
     */
    setupHealthRegenerationSystem() {
        // Initialize health regeneration system
        this.healthRegenSystem = new HealthRegenerationSystem(this);

        // Initialize player health regen to 0
        if (this.player && this.player.healthRegen === undefined) {
            this.player.healthRegen = 0;
        }

        // Log initialization in dev mode
        if (this.isDev) {
            console.debug('HealthRegenerationSystem initialized');
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
                key: 'level1redux',
                tilemapKey: 'level1redux',
                tilesets: [
                    {
                        key: 'tileset_x1',
                        name: 'tileset x1'
                    },
                    {
                        key: 'props_and_items_x1',
                        name: 'props and items x1'
                    }
                ],
                layers: [
                    {
                        name: 'Floor',
                        tilesetKey: 'tileset_x1',
                        depth: 0
                    },
                    {
                        name: 'Walls',
                        tilesetKey: 'tileset_x1',
                        depth: 1
                    },
                    {
                        name: 'Wall Decals',
                        tilesetKey: 'tileset_x1',
                        depth: 2
                    },
                    {
                        name: 'Props1',
                        tilesetKey: 'props_and_items_x1',
                        depth: 15 // Under the player (DEPTHS.PLAYER is 20)
                    },
                    {
                        name: 'Props',
                        tilesetKey: 'props_and_items_x1',
                        depth: 25 // Over the player (DEPTHS.PLAYER is 20)
                    }
                ],
                // Configure collision layers
                collisionLayers: ['Walls', 'Props', 'Props1'],
                // Additional settings for Level1-REDUX map
                options: {
                    scaleFactor: 1.2
                }
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

        // Load the initial map (Level1-REDUX)
        const mapData = this.mapManager.loadMap('level1redux');

        // Store the ground layer for easy access
        this.groundLayer = this.mapManager.getLayer('Floor');

        // Get map dimensions from the map manager
        this.mapDimensions = this.mapManager.getMapDimensions();

        // Debug info for development mode
        if (this.isDev) {
            console.debug(`Map loaded: ${this.mapManager.currentMapKey}`);
            console.debug(`Map dimensions: ${this.mapDimensions.width}x${this.mapDimensions.height}`);
        }
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


        // Set up volume control keys (9 for volume down, 0 for volume up)
        this.volumeDownKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
        this.volumeUpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);


        // DEV ONLY: Add debug key "V" to force verification of enemy counts
        if (this.isDev) {
            this.input.keyboard.addKey('V').on('down', () => {
                if (this.waveManager) {
                    console.log('[DEBUG] Manually triggering enemy count verification');
                    this.waveManager.verifyEnemyCount();
                }
            });

            // Add debug key "F" to force wave completion
            this.input.keyboard.addKey('F').on('down', () => {
                if (this.waveManager && this.waveManager.isWaveActive) {
                    console.log('[DEBUG] Manually forcing wave completion');
                    this.waveManager.completeWave();
                }
            });

            // Add debug key "C" to debug and print all current enemies
            this.input.keyboard.addKey('C').on('down', () => {
                if (this.enemyManager) {
                    console.log('[DEBUG] Current enemies:', this.enemyManager.enemies.length);
                    this.enemyManager.enemies.forEach((enemy, i) => {
                        console.log(`Enemy ${i}:`, enemy.type, enemy.groupId,
                                    'active:', enemy.active,
                                    'position:', enemy.graphics ?
                                        {x: enemy.graphics.x, y: enemy.graphics.y} : 'no graphics');
                    });
                }
            });

            // Toggle hitbox visualization
            this.input.keyboard.addKey('U').on('down', () => {
                this.showHitboxes = !this.showHitboxes;
                this.enemies.getChildren().forEach(enemy => {
                    if (enemy.graphics) {
                        enemy.graphics.setStrokeStyle(this.showHitboxes ? 1 : 0, 0xff0000);
                    }
                });
                console.log('[DEBUG] Hitbox visualization', this.showHitboxes ? 'enabled' : 'disabled');
            });
        }

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

        // Switch to action music when a wave starts
        if (this.soundManager) {
            this.soundManager.playMusic('action_music', {
                fadeIn: 2000,  // 2 second fade in
                fadeOut: 2000  // 2 second fade out for current music
            });
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

        // Play a random wave end sound
        if (this.soundManager) {
            this.soundManager.playRandomWaveEndSound();
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

    /**
     * Handle volume control keys (9 for volume down, 0 for volume up)
     */
    handleVolumeControls() {
        if (!this.soundManager) return;

        const volumeStep = 0.05; // 5% volume change per key press
        let volumeChanged = false;
        let newVolume = this.soundManager.musicVolume;

        // Check for volume down key (9)
        if (Phaser.Input.Keyboard.JustDown(this.volumeDownKey)) {
            newVolume = Math.max(0, newVolume - volumeStep);
            volumeChanged = true;
        }

        // Check for volume up key (0)
        if (Phaser.Input.Keyboard.JustDown(this.volumeUpKey)) {
            newVolume = Math.min(1, newVolume + volumeStep);
            volumeChanged = true;
        }

        // Update volume if changed
        if (volumeChanged) {
            this.soundManager.setMusicVolume(newVolume);
            this.soundManager.setEffectsVolume(newVolume);

            // Show volume indicator
            this.showVolumeIndicator(newVolume);
        }
    }

    /**
     * Show a temporary volume indicator on screen
     * @param {number} volume - Current volume level (0-1)
     */
    showVolumeIndicator(volume) {
        // Remove existing volume indicator if present
        if (this.volumeIndicator) {
            this.volumeIndicator.destroy();
        }

        // Calculate percentage for display
        const volumePercent = Math.round(volume * 100);

        // Get camera dimensions
        const camera = this.cameras.main;
        const width = camera.width;
        const height = camera.height;

        // Create container for volume indicator
        // Position at bottom center of the camera view
        this.volumeIndicator = this.add.container(camera.scrollX + width / 2, camera.scrollY + height - 50).setDepth(200);

        // Create background
        const bgWidth = 200;
        const bgHeight = 40;

        const bg = this.add.rectangle(
            0, // Centered in container
            0, // Centered in container
            bgWidth,
            bgHeight,
            0x000000,
            0.7
        ).setOrigin(0.5);

        // Create volume text
        const text = this.add.text(
            0, // Centered in container
            0, // Centered in container
            `Volume: ${volumePercent}%`,
            {
                fontFamily: 'Arial',
                fontSize: 18,
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Add to container
        this.volumeIndicator.add([bg, text]);

        // Auto-destroy after a short delay
        this.time.delayedCall(1500, () => {
            if (this.volumeIndicator) {
                this.volumeIndicator.destroy();
                this.volumeIndicator = null;
            }
        });
    }

    update(time, delta) {
        // Handle pause state
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            this.togglePause();
        }

        // Handle volume control keys (always active, even when paused)
        this.handleVolumeControls();

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

        // Update collectible manager
        if (this.collectibleManager) {
            this.collectibleManager.update();
        }

        // Update health regeneration system
        if (this.healthRegenSystem) {
            this.healthRegenSystem.update(time, delta);
        }

        // Update faction battle manager
        if (this.factionBattleManager) {
            this.factionBattleManager.update(time, delta);
        }

        // Check for collisions
        this.checkCollisions();

        // Draw hitboxes if debug option is enabled (DEV MODE ONLY)
        if (this.isDev && this.showHitboxes) {
            this.drawHitboxes();
        }
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

        // Update cash animation position if cash manager exists
        if (this.cashManager) {
            this.cashManager.updateCashAnimationPosition();
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

                        // Get enemy size and bullet properties
                        const enemySize = enemyGraphics.parentEnemy ? enemyGraphics.parentEnemy.size / 2 : 12;

                        // Get bullet properties - either from the bullet itself or from the player's weapon
                        const bulletSize = bullet.radius || this.player.caliber || 5;
                        const bulletDamage = bullet.damage ||
                            (this.player.weaponManager ?
                                this.player.weaponManager.getDamage() :
                                this.player.bulletDamage || 10);

                        // Check if bullet hits enemy
                        if (distance < (bulletSize + enemySize)) {
                            // Check for critical hit
                            let finalDamage = bulletDamage;
                            let isCritical = false;

                            // Apply critical hit if bullet has critical properties
                            if (bullet.canCrit && bullet.critMultiplier) {
                                isCritical = true;
                                finalDamage *= bullet.critMultiplier;

                                // Create critical hit effect
                                this.createCriticalHitEffect(enemyGraphics.x, enemyGraphics.y, finalDamage);
                            }

                            // Damage enemy with bullet's damage value (potentially critical)
                            if (enemyGraphics.parentEnemy && typeof enemyGraphics.parentEnemy.takeDamage === 'function') {
                                enemyGraphics.parentEnemy.takeDamage(finalDamage);

                                // Check if bullet has AOE properties and create explosion
                                if (bullet.aoeRadius && bullet.aoeDamage) {
                                    this.createExplosion(bullet.x, bullet.y, bullet.aoeRadius, bullet.damage * bullet.aoeDamage);
                                }
                            }

                            // Reduce bullet health/pierce
                            if (bullet.aoeRadius && bullet.aoeDamage) {
                                // Explosive bullets always destroy after one hit
                                bullet.health = 0;
                                bullet.pierce = 0;
                            } else if (bullet.pierce !== undefined) {
                                // Decrement pierce value by 0.5 (100% scaling means pierce 1 = 2 enemies)
                                bullet.pierce -= 0.5;

                                // Track already hit enemies for bullets with pierce
                                if (bullet.pierce > 0 && bullet.penetratedEnemies) {
                                    bullet.penetratedEnemies.push(enemyGraphics.parentEnemy.id);
                                }
                            } else if (bullet.health !== undefined) {
                                bullet.health--;
                            }

                            // Visual feedback - make bullet flash but preserve enemy faction tint
                            const originalColor = bullet.fillColor || 0xffffff;
                            bullet.fillColor = 0xffffff;

                            // Create a flash effect on the enemy but keep faction tint
                            if (enemyGraphics.parentEnemy && enemyGraphics.parentEnemy.factionTint) {
                                // Store current tint
                                const enemyTint = enemyGraphics.parentEnemy.factionTint;

                                // Apply white flash (or lighter version of faction tint)
                                const flashTint = 0xffffff; // Pure white flash
                                if (enemyGraphics.setTint) {
                                    enemyGraphics.setTint(flashTint);
                                }

                                // Reset to faction tint after a short delay
                                this.time.delayedCall(50, () => {
                                    if (enemyGraphics && enemyGraphics.active && enemyGraphics.setTint) {
                                        enemyGraphics.setTint(enemyTint);
                                    }
                                });
                            }

                            // Reset bullet color after a short delay if it still exists
                            this.time.delayedCall(50, () => {
                                if (bullet && bullet.active) {
                                    bullet.fillColor = originalColor;
                                }
                            });

                            // Only release bullet back to pool if its health/pierce is depleted
                            if ((bullet.pierce !== undefined && bullet.pierce <= 0) ||
                                (bullet.health !== undefined && bullet.health <= 0)) {
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

        // Use the enemy manager's active enemies list
        const activeEnemies = this.enemyManager ? this.enemyManager.enemies : [];

        for (const enemy of activeEnemies) {
            if (!enemy || !enemy.active || !enemy.graphics || !enemy.graphics.active) continue;

            // Use Phaser's built-in physics overlap check
            // Adjust the player's collision circle to match the physics body position (bottom half of player)
            const isOverlapping = Phaser.Geom.Intersects.CircleToCircle(
                new Phaser.Geom.Circle(
                    this.player.graphics.x,
                    this.player.graphics.y + 20, // Offset by 20 pixels to match physics body position
                    this.player.radius
                ),
                new Phaser.Geom.Circle(
                    enemy.graphics.x,
                    enemy.graphics.y,
                    enemy.size / 2
                )
            );

            if (isOverlapping) {
                // Player takes damage
                const enemyDamage = enemy.damage;
                const died = this.playerHealth.takeDamage(enemyDamage);

                if (died == true) {
                    // Player died, handle game over
                    return;
                }

                // Push player away from enemy for better gameplay feel
                const angle = Phaser.Math.Angle.Between(
                    enemy.graphics.x, enemy.graphics.y,
                    this.player.graphics.x, this.player.graphics.y
                );

                // Apply knockback
                const knockbackX = Math.cos(angle) * 30;
                const knockbackY = Math.sin(angle) * 30;

                // Set player velocity
                this.player.velX = knockbackX * 0.2;
                this.player.velY = knockbackY * 0.2;

                // Apply to physics body
                this.player.graphics.body.setVelocity(
                    this.player.velX,
                    this.player.velY
                );

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
     * @param {number} x - X position of the killed enemy
     * @param {number} y - Y position of the killed enemy
     * @param {string} enemyType - Type of enemy that was killed
     */
    onEnemyKilled(isBoss, x, y, enemyType, enemy) {
        // Skip if this enemy has already been counted
        if (enemy && enemy.killCounted) {
            if (this.isDev) {
                console.debug(`[WaveGame] Skipping already counted enemy: ${enemyType}`);
            }
            return;
        }

        // Mark this enemy as counted
        if (enemy) {
            enemy.killCounted = true;
        }

        // Debug logging to track kill events
        if (this.isDev) {
            console.debug(`[WaveGame] Enemy killed: ${enemyType}, isBoss: ${isBoss}, at position: ${x},${y}`);
        }

        // Increment total kill count
        this.killCount++;

        // Update the kill counter UI
        if (this.uiManager) {
            this.uiManager.updateScoreUI(this.killCount);
        }

        // Note: We're now relying on the enemy's built-in death animation
        // Death effect is handled directly by the enemy's die() method
        // Do not create additional particle effects here

        // Award XP directly based on enemy score value instead of spawning pickups
        if (this.xpManager) {
            // Find the enemy by position
            const deadEnemy = this.findEnemyByPosition(x, y, enemyType);

            // Calculate XP value based on enemy type and score
            const xpValue = deadEnemy && deadEnemy.scoreValue ?
                deadEnemy.scoreValue * (this.xpMultiplier || 1) :
                isBoss ? 500 : 100; // Default values if enemy not found

            // Award XP directly to the player
            this.xpManager.addXP(xpValue);

            // Play XP gain sound effect
            if (this.soundManager) {
                // Use existing sound with different parameters for XP collection
                const soundKey = this.soundManager.soundEffects &&
                    this.soundManager.soundEffects['xp_collect'] ?
                    'xp_collect' :
                    'shoot_weapon'; // Fallback to an existing sound

                this.soundManager.playSoundEffect(soundKey, {
                    detune: 1200, // Higher pitch for XP collection
                    volume: 0.3
                });
            }
        }

        if (isBoss) {
            // If a boss was killed, increment the boss kill counter
            this.bossesKilled++;

            // Create special effects for boss death - keep boss death effects
            if (x !== undefined && y !== undefined) {
                this.createBossDeathEffect(x, y);
            }

            // Emit boss-defeated event for other systems to react to
            EventBus.emit('boss-defeated', {
                bossType: enemyType,
                x: x,
                y: y,
                enemy: enemy
            });
        } else {
            // If a regular enemy was killed, increment the regular kill counter
            this.regularKillCount++;
        }

        // Register kill with ChaosManager
        if (this.chaosManager) {
            // Look up the enemy by position in the enemy manager, since we might not have the actual enemy object
            const deadEnemy = this.findEnemyByPosition(x, y, enemyType);

            if (deadEnemy && deadEnemy.groupId) {
                // If we found a reference to the enemy and it has a group, register the kill with that group
                this.chaosManager.registerKill(deadEnemy.groupId);
            } else {
                // Fallback: Assign a random faction for the kill if we can't find the enemy
                const randomGroup = Math.random() > 0.5 ? 'ai' : 'coder';
                this.chaosManager.registerKill(randomGroup);
            }
        }

        // IMPORTANT: Notify the WaveManager about the killed enemy
        if (this.waveManager) {
            this.waveManager.onEnemyKilled(isBoss, enemyType);

            // Manually verify enemy count after each kill to ensure wave progression
            // This adds resiliency to the wave completion system
            this.waveManager.verifyEnemyCount();
        }
    }

    /**
     * Find an enemy in the enemy list by approximate position
     * Used when we only have position data but need the enemy reference
     * @private
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} enemyType - Type of enemy
     * @returns {BaseEnemy|null} The enemy at that position, or null if not found
     */
    findEnemyByPosition(x, y, enemyType) {
        if (!this.enemyManager || !this.enemyManager.enemies) {
            return null;
        }

        // Search for enemies near this position (within a small tolerance)
        const tolerance = 5;

        for (const enemy of this.enemyManager.enemies) {
            if (enemy && enemy.graphics &&
                Math.abs(enemy.graphics.x - x) <= tolerance &&
                Math.abs(enemy.graphics.y - y) <= tolerance) {
                return enemy;
            }
        }

        return null;
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
        particles.setDepth(250);
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }

    /**
     * Create special effect for boss death
     */
    createBossDeathEffect(x, y) {
        // Create a large explosion effect
        for (let i = 0; i < 2; i++) {
            // Stagger the explosions for dramatic effect
            this.time.delayedCall(i * 100, () => {
                // Randomize positions slightly for each explosion
                const offsetX = Phaser.Math.Between(-30, 30);
                const offsetY = Phaser.Math.Between(-30, 30);

                // Create a particle emitter
                const particles = this.add.particles(x + offsetX, y + offsetY, 'particle_texture', {
                    speed: { min: 20, max: 50 },
                    scale: { start: 0.4, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 150,
                    blendMode: 'ADD',
                    quantity: 10,
                    angle: { min: 0, max: 360 }
                });

                // Auto-destroy the emitter after it's done
                particles.setDepth(200);
                this.time.delayedCall(300, () => {
                    particles.destroy();
                });
            });
        }
    }

    /**
     * Create an explosion effect that damages enemies in an area
     * @param {number} x - X position of the explosion center
     * @param {number} y - Y position of the explosion center
     * @param {number} radius - Radius of the explosion
     * @param {number} damage - Amount of damage to deal to enemies in the area
     */
    createExplosion(x, y, radius, damage) {
        // Skip if no enemy manager
        if (!this.enemyManager) return;

        // Create visual explosion effect
        this.createExplosionVisual(x, y, radius);

        // Play explosion sound (with reduced volume)
        if (this.soundManager) {
            this.soundManager.playSoundEffect('explosion', {
                volume: 0.15, // Reduced from 0.4 to make it quieter
                detune: Phaser.Math.Between(-300, 300)
            });
        }

        // Get all active enemies
        const activeEnemies = this.enemyManager.enemies;
        if (!activeEnemies || activeEnemies.length === 0) return;

        // Debug visualization of explosion radius in development mode
        if (this.isDev) {
            const debugCircle = this.add.circle(x, y, radius, 0xff0000, 0.2);
            debugCircle.setStrokeStyle(2, 0xff0000, 0.8);
            debugCircle.setDepth(DEPTHS.BULLETS + 20);

            // Auto-destroy after a short time
            this.time.delayedCall(300, () => {
                debugCircle.destroy();
            });
        }

        // Track how many enemies were damaged for debugging
        let enemiesDamaged = 0;

        // Check each enemy for distance to explosion
        for (const enemy of activeEnemies) {
            // Skip inactive enemies or enemies without graphics
            if (!enemy || !enemy.active || !enemy.graphics || !enemy.graphics.active) continue;

            // Calculate distance to enemy
            const dx = enemy.graphics.x - x;
            const dy = enemy.graphics.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If enemy is within explosion radius, damage it
            if (distance <= radius) {
                // Calculate damage falloff based on distance (full damage at center, less at edges)
                const falloff = 1 - (distance / radius);
                const explosionDamage = Math.max(1, Math.floor(damage * falloff));

                // Apply damage to enemy
                if (typeof enemy.takeDamage === 'function') {
                    enemy.takeDamage(explosionDamage);
                    enemiesDamaged++;

                    // Create small hit effect on each affected enemy
                    this.createExplosionHitEffect(enemy.graphics.x, enemy.graphics.y);
                }
            }
        }

        // Log how many enemies were damaged in development mode
        if (this.isDev && enemiesDamaged > 0) {
            console.debug(`Explosion at (${Math.floor(x)},${Math.floor(y)}) with radius ${radius} damaged ${enemiesDamaged} enemies`);
        }
    }

    /**
     * Create visual explosion effect
     * @param {number} x - X position of the explosion
     * @param {number} y - Y position of the explosion
     * @param {number} radius - Radius of the explosion
     */
    createExplosionVisual(x, y, radius) {
        // Create a circle to represent the explosion area
        const explosionCircle = this.add.circle(x, y, radius, 0xffaa00, 0.4);
        explosionCircle.setStrokeStyle(3, 0xff6600, 0.7); // Add a stroke to make the radius more visible
        explosionCircle.setDepth(DEPTHS.BULLETS - 1);

        // Create a smaller, brighter inner circle for the explosion core
        const innerCircle = this.add.circle(x, y, radius * 0.5, 0xffff00, 0.7);
        innerCircle.setDepth(DEPTHS.BULLETS);

        // Animate the explosion circles
        this.tweens.add({
            targets: explosionCircle,
            alpha: 0,
            scale: 1.3,
            duration: 400, // Slightly longer duration to match damage application
            ease: 'Power2',
            onComplete: () => {
                explosionCircle.destroy();
            }
        });

        this.tweens.add({
            targets: innerCircle,
            alpha: 0,
            scale: 1.8,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                innerCircle.destroy();
            }
        });

        // Create particle effect for the explosion
        const particles = this.add.particles(x, y, 'particle_texture', {
            speed: { min: 50, max: 250 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            quantity: 30, // More particles for a more dramatic effect
            tint: [0xffff00, 0xff6600, 0xff4400],
            angle: { min: 0, max: 360 }
        });

        // Create a shockwave ring effect
        const shockwave = this.add.circle(x, y, 5, 0xffffff, 0.7);
        shockwave.setDepth(DEPTHS.BULLETS + 5);

        this.tweens.add({
            targets: shockwave,
            radius: radius * 1.2,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.Out',
            onComplete: () => {
                shockwave.destroy();
            }
        });

        // Auto-destroy the emitter after it's done
        particles.setDepth(DEPTHS.BULLETS + 10);
        this.time.delayedCall(600, () => {
            particles.destroy();
        });
    }

    /**
     * Create a small hit effect when an enemy is damaged by an explosion
     * @param {number} x - X position of the hit
     * @param {number} y - Y position of the hit
     */
    createExplosionHitEffect(x, y) {
        // Create a small flash circle at the hit point
        const hitFlash = this.add.circle(x, y, 10, 0xffffff, 0.8);
        hitFlash.setDepth(DEPTHS.BULLETS + 15);

        // Animate the flash
        this.tweens.add({
            targets: hitFlash,
            alpha: 0,
            scale: 1.5,
            duration: 150,
            ease: 'Power2',
            onComplete: () => {
                hitFlash.destroy();
            }
        });

        // Create a small particle burst
        const particles = this.add.particles(x, y, 'particle_texture', {
            speed: { min: 30, max: 100 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 250,
            blendMode: 'ADD',
            quantity: 8, // More particles for better visibility
            tint: [0xff6600, 0xff8800], // Orange-yellow for fire effect
            angle: { min: 0, max: 360 }
        });

        // Auto-destroy the emitter after it's done
        particles.setDepth(DEPTHS.BULLETS + 5);
        this.time.delayedCall(300, () => {
            particles.destroy();
        });

        // Optional: Add a small damage number
        if (Math.random() < 0.3) { // Only show for 30% of hits to avoid clutter
            const damageText = this.add.text(
                x + Phaser.Math.Between(-10, 10),
                y - 15,
                '!',
                {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    fontStyle: 'bold',
                    color: '#ff8800',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            );
            damageText.setOrigin(0.5);
            damageText.setDepth(DEPTHS.BULLETS + 20);

            // Animate the text
            this.tweens.add({
                targets: damageText,
                y: y - 30,
                alpha: 0,
                scale: 1.2,
                duration: 300,
                ease: 'Power1',
                onComplete: () => {
                    damageText.destroy();
                }
            });
        }
    }

    /**
     * Create visual effect for critical hits
     * @param {number} x - X position of the hit
     * @param {number} y - Y position of the hit
     * @param {number} damage - Amount of damage dealt
     */
    createCriticalHitEffect(x, y, damage) {
        // Create a text effect showing the critical damage
        const damageText = this.add.text(
            x,
            y - 20, // Position slightly above the enemy
            `CRIT! ${Math.floor(damage)}`,
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#ff0000', // Red color for critical hits
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        );

        // Set depth to ensure it's visible above other elements
        damageText.setDepth(150);

        // Animate the text (float up and fade out)
        this.tweens.add({
            targets: damageText,
            y: y - 50, // Float upward
            alpha: 0,
            scale: 1.5, // Grow slightly
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });

        // Create a small particle burst for additional visual feedback
        const particles = this.add.particles(x, y, 'particle_texture', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            quantity: 8,
            tint: 0xff0000, // Red particles for critical hits
            angle: { min: 0, max: 360 }
        });

        // Auto-destroy the emitter after it's done
        particles.setDepth(100);
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
    }

    /**

     * Clean up resources when the scene is shut down
     */
    shutdown() {
        // Clean up event listeners to prevent memory leaks
        EventBus.off('xp-updated');
        EventBus.off('level-up');
        EventBus.off('wave-completed');
        EventBus.off('collectible-collected');
        EventBus.off('player-damaged');
        EventBus.off('player-death');
        EventBus.off('wave-start');
        EventBus.off('shop-upgrade-click');
        EventBus.off('boss-spawned');
        EventBus.off('boss-defeated');

        // Call parent shutdown method
        super.shutdown();
    }


     /* Draw hitboxes for enemies and bullets when debug option is enabled
     * DEV MODE ONLY - This is only called when isDev && showHitboxes are both true
     */
    drawHitboxes() {
        // Create graphics object if it doesn't exist
        if (!this.hitboxGraphics) {
            this.hitboxGraphics = this.add.graphics();
            this.hitboxGraphics.setDepth(1000); // Very high depth to render above everything
        }

        // Clear previous frame's drawings
        this.hitboxGraphics.clear();

        // Set styles for different hitbox types
        const enemyStyle = { lineWidth: 1, lineColor: 0xff0000, lineAlpha: 0.8 }; // Red for enemies
        const bulletStyle = { lineWidth: 1, lineColor: 0x00ff00, lineAlpha: 0.8 }; // Green for bullets

        // Draw enemy hitboxes
        if (this.enemyManager && this.enemyManager.enemies) {
            this.enemyManager.enemies.forEach(enemy => {
                if (enemy && enemy.active && enemy.graphics && enemy.graphics.active) {
                    // Set enemy hitbox style
                    this.hitboxGraphics.lineStyle(enemyStyle.lineWidth, enemyStyle.lineColor, enemyStyle.lineAlpha);

                    // Draw circle for enemy hitbox
                    this.hitboxGraphics.strokeCircle(
                        enemy.graphics.x,
                        enemy.graphics.y,
                        enemy.size / 2
                    );

                    // Draw a small cross at the center for better visibility
                    const crossSize = 3;
                    this.hitboxGraphics.lineBetween(
                        enemy.graphics.x - crossSize,
                        enemy.graphics.y,
                        enemy.graphics.x + crossSize,
                        enemy.graphics.y
                    );
                    this.hitboxGraphics.lineBetween(
                        enemy.graphics.x,
                        enemy.graphics.y - crossSize,
                        enemy.graphics.x,
                        enemy.graphics.y + crossSize
                    );
                }
            });
        }

        // Draw bullet hitboxes
        if (this.bullets) {
            this.bullets.getChildren().forEach(bullet => {
                if (bullet && bullet.active) {
                    // Set bullet hitbox style
                    this.hitboxGraphics.lineStyle(bulletStyle.lineWidth, bulletStyle.lineColor, bulletStyle.lineAlpha);

                    // Get bullet size - either from the bullet itself or from the player's weapon
                    const bulletSize = bullet.radius || this.player.caliber || 5;

                    // Draw circle for bullet hitbox
                    this.hitboxGraphics.strokeCircle(
                        bullet.x,
                        bullet.y,
                        bulletSize
                    );
                }
            });
        }
    }
}

