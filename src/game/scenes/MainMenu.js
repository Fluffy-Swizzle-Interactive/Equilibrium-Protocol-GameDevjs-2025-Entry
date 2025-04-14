import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { SoundManager } from '../sound/SoundManager';

export class MainMenu extends Scene
{
    logoTween;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 300, 'logo').setDepth(100);

        this.add.text(512, 460, 'Minigun', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5).setInteractive().on('pointerdown', () => this.changeScene('minigun'), this);

        this.add.text(512, 550, 'Minigun Shotgun', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5).setInteractive().on('pointerdown', () => this.changeScene('shotgun'), this);
        
        // Setup sound manager and start ambient music
        this.setupSoundManager();
        
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
            volume: 0.3,  // Slightly lower volume for menu
            loop: true
        });
        
        // Start playing ambient music with fade in
        this.soundManager.playMusic('ambient_music', {
            fadeIn: 3000  // 3 second fade in for menu (longer for atmosphere)
        });
    }

    changeScene (gameMode)
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        // Don't stop music, it will be handled by the Game scene
        // to ensure a smooth transition

        this.scene.start('Game', { mode: gameMode });
    }

    moveLogo (reactCallback)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        }
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
