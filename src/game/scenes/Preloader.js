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
        
        // Load bullet sprite
        this.load.image('bullet', 'assets/sprites/BULLETS/bullet_7.png');

        // Load pickup images
        this.load.image('cash_pickup', 'assets/images/cash_pickup.png');
        this.load.image('health_pickup', 'assets/images/health_pickup.png');

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

        // Load enemy sprite atlases
        this.load.atlas('enemy1', 'assets/sprites/ENEMY1.png', 'assets/sprites/ENEMY1.json');
        this.load.atlas('enemy2', 'assets/sprites/ENEMY2.png', 'assets/sprites/ENEMY2.json');
        this.load.atlas('enemy3', 'assets/sprites/ENEMY3.png', 'assets/sprites/ENEMY3.json');
        this.load.atlas('boss1', 'assets/sprites/BOSS1.png', 'assets/sprites/BOSS1.json');

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

        // Load all map assets
        this.loadMapAssets();

        // Load sound effects
        this.load.audio('shoot_weapon', 'assets/audio/laserShoot.wav');
        //TEMP REMOVE OR REPLACE
        this.load.audio('button_click', 'assets/audio/laserShoot.wav');

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
        this.load.plugin('AnimatedTiles', 'https://cdn.rawgit.com/PhaserEditor2D/AnimatedTiles/master/dist/AnimatedTiles.js', true);

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

        EventBus.emit('preloader-complete', this);

        this.scene.start('MainMenu');
    }
}
