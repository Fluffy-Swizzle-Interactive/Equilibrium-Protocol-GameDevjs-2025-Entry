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
     * Load all map-related assets
     * This keeps map loading organized and centralized
     */
    loadMapAssets() {
        // Load tilemap for level 1
        this.load.image('level1', 'assets/maps/level1.png');
        this.load.tilemapTiledJSON('map', 'assets/maps/level1.json');

        // Load the Dark Cave Net tilemap
        this.load.image('darkcavenet', 'assets/maps/darkcavenet.png');
        this.load.tilemapTiledJSON('darkcavemap', 'assets/maps/darkcavenet.json');

        // Load any other tilemap assets needed for additional maps
        // Example: this.load.tilemapTiledJSON('level3', 'assets/maps/level3.json');
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
