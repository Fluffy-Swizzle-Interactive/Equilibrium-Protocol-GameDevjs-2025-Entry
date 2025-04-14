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

        this.load.image('logo', 'assets/logo.png');
        this.load.image('background', 'assets/bg.png');
        
        // Load tilemap and tileset
        this.load.image('level1', 'assets/level1.png');
        this.load.tilemapTiledJSON('map', 'assets/level1.json');
        
        // Load sound effects
        this.load.audio('shoot_minigun', 'assets/audio/laserShoot.wav');
        this.load.audio('shoot_shotgun', 'assets/audio/laserShoot.wav');
        
        // Load ambient background music
        this.load.audio('ambient_music', 'assets/audio/ambient_loop.mp3');
    }

    create ()
    {
        EventBus.emit('preloader-complete', this);

        this.scene.start('MainMenu');
    }
}
