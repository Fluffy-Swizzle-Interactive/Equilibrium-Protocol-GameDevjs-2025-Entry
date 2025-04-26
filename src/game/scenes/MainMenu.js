import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { SoundManager } from '../managers/SoundManager';
import { DEPTHS } from '../constants';

/**
 * MainMenu scene
 * Handles the main menu display and game mode options
 */
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


        // Add Wave Mode button with a special highlight
        const waveButton = this.add.text(512, 500, 'START GAME', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#39C66B',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5).setInteractive().on('pointerdown', () => this.startGame('wave'), this);

        // Add a glow effect to the wave mode button to attract attention
        this.tweens.add({
            targets: waveButton,
            alpha: 0.8,
            yoyo: true,
            repeat: -1,
            duration: 1000
        });

        // Setup sound manager and start menu music
        this.setupSoundManager();

        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Set up the sound manager and start menu music
     */
    setupSoundManager() {
        // Create sound manager
        this.soundManager = new SoundManager(this);

        // Initialize menu music
        this.soundManager.initBackgroundMusic('menu_music', {
            volume: 0.4,  // Set appropriate volume for menu music
            loop: true
        });

        // Initialize UI sound effects
        this.soundManager.initSoundEffect('button_click', {
            volume: 0.6,
            rate: 1.0
        });

        // Start playing menu music with fade in
        this.soundManager.playMusic('menu_music', {
            fadeIn: 2000  // 2 second fade in for menu music
        });
    }

    /**
     * Start the selected game mode
     * @param {string} mode - Game mode to start (wave or adventure)
     */
    startGame(mode) {
        // Transition effect
        this.cameras.main.fadeOut(500, 0, 0, 0);

        // Note: We don't stop the music here anymore
        // The crossfade will be handled in the WaveGame scene

        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (this.logoTween) {
                this.logoTween.stop();
                this.logoTween = null;
            }

            // Start the PreSpawn scene instead of going directly to WaveGame
            if (mode === 'wave') {
                // Pass relevant data to PreSpawn scene
                this.scene.start('PreSpawn', {
                    startWave: 0 // Default to wave 0 in regular mode
                });
            } else {
                // For other modes (maintaining compatibility)
                this.scene.start('PreSpawn', { startWave: 0 });
            }
        });
    }

    /**
     * Legacy method for backward compatibility
     */
    changeScene(sceneKey, gameMode) {
        // Map to the new startGame method
        if (sceneKey === 'WaveGame') {
            this.selectedWeapon = gameMode;
            this.startGame('wave');
        } else {
            this.selectedWeapon = gameMode;
            this.startGame('adventure');
        }
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
