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

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
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
        this.load.image('scifi_tiles', 'assets/scifi_tiles.png');
        this.load.tilemapTiledJSON('map', 'assets/map.json');
    }

    create ()
    {
        EventBus.emit('preloader-complete', this);

        this.scene.start('MainMenu');
    }
}
