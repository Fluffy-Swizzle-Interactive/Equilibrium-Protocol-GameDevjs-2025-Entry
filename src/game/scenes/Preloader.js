import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');
    }

    preload ()
    {
        // Add a simple loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Loading bar
        const progressBar = this.add.rectangle(width / 2, height / 2, 400, 30, 0x666666);
        const progressFill = this.add.rectangle(width / 2 - 200 + 5, height / 2, 10, 20, 0xffffff);

        // Loading text
        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Update progress bar as assets load
        this.load.on('progress', (value) => {
            progressFill.width = 390 * value;
            progressFill.x = width / 2 - 195 + (390 * value / 2);
        });

        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('background', 'assets/images/bg.png');

        // Make sure particle texture loads correctly by checking for errors
        this.load.image('particle_texture', 'assets/images/star.png');
        this.load.on('fileerror', (key, file) => {
            console.error('Failed to load asset:', key, file);
            // If particle_texture fails to load, use a fallback
            if (key === 'particle_texture') {
                console.warn('Creating fallback texture for particle_texture');
                this.createFallbackParticleTexture();
            }
        });

        // Load player sprite atlas
        this.load.atlas('player', 'assets/sprites/TESTPLAYER1.png', 'assets/sprites/TESTPLAYER1.json');

        // Also load individual sprite frames as fallback
        // This ensures we can load the individual frames if the atlas doesn't work
        this.load.image('down1', 'assets/sprites/PLAYER1/down1.png');
        this.load.image('down2', 'assets/sprites/PLAYER1/down2.png');
        this.load.image('down3', 'assets/sprites/PLAYER1/down3.png');
        this.load.image('down4', 'assets/sprites/PLAYER1/down4.png');
        this.load.image('up1', 'assets/sprites/PLAYER1/up1.png');
        this.load.image('up2', 'assets/sprites/PLAYER1/up2.png');
        this.load.image('up3', 'assets/sprites/PLAYER1/up3.png');
        this.load.image('up4', 'assets/sprites/PLAYER1/up4.png');
        this.load.image('left1', 'assets/sprites/PLAYER1/left1.png');
        this.load.image('left2', 'assets/sprites/PLAYER1/left2.png');
        this.load.image('left3', 'assets/sprites/PLAYER1/left3.png');
        this.load.image('left4', 'assets/sprites/PLAYER1/left4.png');
        this.load.image('right1', 'assets/sprites/PLAYER1/right1.png');
        this.load.image('right2', 'assets/sprites/PLAYER1/right2.png');
        this.load.image('right3', 'assets/sprites/PLAYER1/right3.png');
        this.load.image('right4', 'assets/sprites/PLAYER1/right4.png');

        // Also keep the legacy testplayer for compatibility
        this.load.atlas('testplayer', 'assets/sprites/testplayer.png', 'assets/sprites/testplayer.json');

        // Load enemy sprite atlases
        this.loadEnemySprites();

        // Load all map assets
        this.loadMapAssets();

        // Load sound effects
        this.load.audio('shoot_minigun', 'assets/audio/laserShoot.wav');
        this.load.audio('shoot_shotgun', 'assets/audio/laserShoot.wav');

        // Load ambient background music
        this.load.audio('ambient_music', 'assets/audio/ambient_loop.mp3');
    }

    /**
     * Creates a fallback texture when particle_texture fails to load
     * This ensures the game won't crash with the glTexture error
     */
    createFallbackParticleTexture() {
        // Create a small circle texture as fallback
        const graphics = this.make.graphics();
        graphics.fillStyle(0xFFFFFF);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('particle_texture', 16, 16);
        graphics.destroy();
    }

    /**
     * Load all enemy sprite assets
     * Loads sprite sheets for different enemy types
     */
    loadEnemySprites() {
        // Load Enemy1 sprite atlas
        this.load.atlas('enemy1', 'assets/sprites/ENEMY1.png', 'assets/sprites/ENEMY1.json');
        
        // Load Enemy2 sprite atlas
        this.load.atlas('enemy2', 'assets/sprites/ENEMY2.png', 'assets/sprites/ENEMY2.json');
        
        // Load Enemy3 sprite atlas
        this.load.atlas('enemy3', 'assets/sprites/ENEMY3.png', 'assets/sprites/ENEMY3.json');
        
        // Load Boss1 sprite atlas
        this.load.atlas('boss1', 'assets/sprites/BOSS1.png', 'assets/sprites/BOSS1.json');
        
        // Handle error fallbacks for enemy sprites
        this.load.on('fileerror', (key, file) => {
            if (key.startsWith('enemy') || key === 'boss1') {
                console.warn(`Failed to load ${key} sprite. Creating fallback.`);
                this.createFallbackEnemySprite(key);
            }
        });
    }
    
    /**
     * Create fallback sprites for enemies when original assets can't load
     * @param {string} key - The texture key to create a fallback for
     */
    createFallbackEnemySprite(key) {
        // Create a colored circle as fallback based on enemy type
        const graphics = this.make.graphics();
        
        // Choose color based on enemy type
        let color = 0xFFFFFF;
        switch(key) {
            case 'enemy1':
                color = 0x00FF00; // Green for enemy1
                break;
            case 'enemy2':
                color = 0x0000FF; // Blue for enemy2
                break;
            case 'enemy3':
                color = 0xFF6600; // Orange for enemy3
                break;
            case 'boss1':
                color = 0xFF0000; // Red for boss
                break;
        }
        
        // Draw a circle with the enemy color
        graphics.fillStyle(color);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
        
        // Add some basic frame definitions to prevent animation errors
        this.textures.get(key).add('idle_0', 0, 0, 0, 32, 32);
        this.textures.get(key).add('run_0', 0, 0, 0, 32, 32);
        this.textures.get(key).add('death_0', 0, 0, 0, 32, 32);
    }

    /**
     * Load all map-related assets
     * This keeps map loading organized and centralized
     */
    loadMapAssets() {
        // Load tilemap for level 1
        this.load.image('level1', 'assets/maps/level1.png');
        this.load.tilemapTiledJSON('map', 'assets/maps/level1.json');

        // Load the Level1-REDUX tilemap
        this.load.image('tileset_x1', 'assets/maps/tileset x1.png');
        this.load.image('props_and_items_x1', 'assets/maps/props and items x1.png');
        this.load.tilemapTiledJSON('level1redux', 'assets/maps/Level1-REDUX.json');

        // Load the Animated Tiles plugin from assets directory
        console.log('Loading AnimatedTiles plugin from assets directory...');
        this.load.plugin('AnimatedTiles', 'assets/plugins/AnimatedTiles.min.js', true);

        // Add event listeners to track plugin loading
        this.load.on('filecomplete-plugin-AnimatedTiles', () => {
            console.log('AnimatedTiles plugin loaded successfully');
        });

        this.load.on('fileerror-plugin-AnimatedTiles', (_, __, error) => {
            console.error('Failed to load AnimatedTiles plugin:', error);
        });

        // Keep the Dark Cave Net tilemap for backward compatibility
        this.load.image('darkcavenet', 'assets/maps/darkcavenet.png');
        this.load.tilemapTiledJSON('darkcavemap', 'assets/maps/darkcavenet.json');
    }

    create ()
    {
        // Double check if particle_texture was loaded, if not create a fallback
        if (!this.textures.exists('particle_texture')) {
            this.createFallbackParticleTexture();
        }
        
        // Verify that enemy sprite atlases were loaded correctly, create fallbacks if needed
        ['enemy1', 'enemy2', 'enemy3', 'boss1'].forEach(key => {
            if (!this.textures.exists(key)) {
                console.warn(`Creating fallback texture for ${key}`);
                this.createFallbackEnemySprite(key);
            }
        });

        // Verify that the AnimatedTiles plugin was loaded correctly
        if (this.sys.plugins.get('AnimatedTiles')) {
            console.log('AnimatedTiles plugin is available in the scene');

            // Log plugin details
            const plugin = this.sys.plugins.get('AnimatedTiles');
            console.log('Plugin details:', {
                name: plugin.name,
                active: plugin.active,
                visible: plugin.visible,
                mapping: plugin.mapping
            });
        } else {
            console.warn('AnimatedTiles plugin is NOT available in the scene');

            // List all available plugins
            const plugins = Object.keys(this.sys.plugins.plugins);
            console.log('Available plugins:', plugins);
        }

        EventBus.emit('preloader-complete', this);

        this.scene.start('MainMenu');
    }
}
