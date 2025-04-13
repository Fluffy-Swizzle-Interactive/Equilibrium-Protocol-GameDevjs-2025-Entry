import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    init(data)
    {
        // Store the survival time received from the Game scene
        this.survivalTime = data.survivalTime || 0;
        // Store the kill count received from the Game scene
        this.killCount = data.killCount || 0;
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0xff0000);

        this.add.image(512, 384, 'background').setAlpha(0.5);

        // Main Game Over text
        this.add.text(512, 300, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        // Display survival time
        this.add.text(512, 380, `You survived for ${this.survivalTime} seconds`, {
            fontFamily: 'Arial', fontSize: 28, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        // Display kill count
        this.add.text(512, 420, `Enemies killed: ${this.killCount}`, {
            fontFamily: 'Arial', fontSize: 28, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        // Back to menu text
        this.add.text(512, 480, 'Click to Return to Menu', {
            fontFamily: 'Arial', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100).setInteractive().on('pointerdown', this.changeScene, this);

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
