import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { SoundManager } from '../managers/SoundManager';
import { DEPTHS } from '../constants';
import { VolumeSlider } from '../ui/VolumeSlider';
import { ButtonSoundHelper } from '../utils/ButtonSoundHelper';

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
        }).setDepth(100).setOrigin(0.5).setInteractive();

        // Add click handler with sound
        waveButton.on('pointerdown', () => {
            // Emit button click event for sound
            EventBus.emit('button-click', {
                volume: 0.06, // Reduced to 10% of original value (0.6 -> 0.06)
                detune: -200, // Pitch down slightly
                rate: 1.2 // Speed up slightly
            });
            // Start the game
            this.startGame('wave');
        }, this);

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

        // Add volume slider in the top right corner
        this.createVolumeSlider();

        // Setup input for volume control
        this.setupInput();

        // Setup button sound listener
        this.cleanupButtonSounds = ButtonSoundHelper.setupButtonSounds(this);

        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Create volume slider in the top right corner
     */
    createVolumeSlider() {
        // Get the width and height of the game
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create volume slider
        this.volumeSlider = new VolumeSlider(this, width - 100, 40, {
            width: 150,
            height: 10,
            trackColor: 0x444444,
            fillColor: 0x39C66B, // Match the green color of the start button
            knobColor: 0xffffff,
            knobRadius: 8,
            initialValue: this.soundManager ? this.soundManager.musicVolume : 0.5,
            depth: 100,
            label: 'Volume',
            labelStyle: {
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            },
            onChange: (value) => {
                // Update both music and effects volume
                if (this.soundManager) {
                    this.soundManager.setMusicVolume(value);
                    this.soundManager.setEffectsVolume(value);
                }
            }
        });
    }

    /**
     * Set up the sound manager and start menu music
     */
    setupSoundManager() {
        // Create sound manager
        this.soundManager = new SoundManager(this);

        // Initialize menu music
        this.soundManager.initBackgroundMusic('menu_music', {
            volume: 0.04,  // Reduced to 10% of original value (0.4 -> 0.04)
            loop: true
        });

        // Initialize UI sound effects
        this.soundManager.initSoundEffect('button_click', {
            volume: 0.06, // Reduced to 10% of original value (0.6 -> 0.06)
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

    /**
     * Set up input handlers for keyboard
     */
    setupInput() {
        // Set up volume control keys (9 for volume down, 0 for volume up)
        this.volumeDownKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
        this.volumeUpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    }

    /**
     * Update method called every frame
     */
    update() {
        // Handle volume control keys
        this.handleVolumeControls();
    }

    /**
     * Handle volume control keys (9 for volume down, 0 for volume up)
     */
    handleVolumeControls() {
        if (!this.soundManager) return;

        const volumeStep = 0.01; // 1% volume change per key press (of the 0-0.1 range)
        let volumeChanged = false;
        let newVolume = this.soundManager.musicVolume;

        // Check for volume down key (9)
        if (Phaser.Input.Keyboard.JustDown(this.volumeDownKey)) {
            newVolume = Math.max(0, newVolume - volumeStep);
            volumeChanged = true;
        }

        // Check for volume up key (0)
        if (Phaser.Input.Keyboard.JustDown(this.volumeUpKey)) {
            newVolume = Math.min(0.1, newVolume + volumeStep);
            volumeChanged = true;
        }

        // Update volume if changed
        if (volumeChanged) {
            this.soundManager.setMusicVolume(newVolume);
            this.soundManager.setEffectsVolume(newVolume);

            // Update volume slider if it exists
            if (this.volumeSlider) {
                this.volumeSlider.setValue(newVolume);
            }

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
        this.volumeIndicator = this.add.container(width / 2, height - 50).setDepth(200);

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

    /**
     * Clean up resources when the scene is shut down
     */
    shutdown() {
        // Clean up button sound event listeners
        if (this.cleanupButtonSounds) {
            this.cleanupButtonSounds();
        }

        // Call parent shutdown method
        super.shutdown();
    }
}
