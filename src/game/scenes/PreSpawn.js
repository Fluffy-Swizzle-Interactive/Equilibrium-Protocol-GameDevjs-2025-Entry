import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { SoundManager } from '../managers/SoundManager';
import { DEPTHS } from '../constants';

/**
 * PreSpawn scene
 * Displays game instructions and information before starting the game
 */
export class PreSpawn extends Scene
{
    constructor ()
    {
        super('PreSpawn');
    }

    init(data)
    {
        // Store data passed from MainMenu
        this.startWave = data.startWave || 0;

        // Store debug mode from DEV menu if provided
        this.debugMode = data.debug !== undefined ? data.debug : false;
    }

    create ()
    {
        // Create background
        this.add.image(512, 384, 'background').setAlpha(0.7);

        // Add semi-transparent overlay
        this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.6)
            .setOrigin(0.5)
            .setDepth(DEPTHS.UI_BACKGROUND);

        // Title
        this.add.text(512, 120, 'GAME INSTRUCTIONS', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT);

        // Game instructions
        const instructions = [
            'MOVEMENT: Use WASD keys to move your character',
            'AIM: Use mouse to aim in any direction',
            'SHOOT: Hold left mouse button to fire your weapon',
            'COLLECT: Automatically gather XP and cash from defeated enemies',
            'UPGRADE: Use cash to purchase upgrades between waves',
            '',
            'SURVIVE and defeat ALL WAVES to win!'
        ];

        // Display instructions
        instructions.forEach((text, index) => {
            this.add.text(512, 220 + (index * 40), text, {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT);
        });

        // Weapon info
        this.add.text(512, 460, 'YOUR WEAPON', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT);

        // Weapon description
        this.add.text(512, 510, 'Standard blaster with balanced damage and fire rate', {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT);

        // Create a preview of the weapon bullet
        this.add.circle(512, 560, 8, 0xffff00)
            .setStrokeStyle(2, 0xffffff)
            .setDepth(DEPTHS.UI_ELEMENTS);

        // Start game button
        const startButton = this.add.rectangle(512, 650, 300, 70, 0x39C66B)
            .setOrigin(0.5)
            .setStrokeStyle(4, 0xffffff)
            .setInteractive()
            .setDepth(DEPTHS.UI_ELEMENTS);

        const startText = this.add.text(512, 650, 'START GAME', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT + 1);

        // Button hover effect
        startButton.on('pointerover', () => {
            startButton.fillColor = 0x4DD680;
            this.scale.canvas.style.cursor = 'pointer';
        });

        startButton.on('pointerout', () => {
            startButton.fillColor = 0x39C66B;
            this.scale.canvas.style.cursor = 'default';
        });

        // Button click
        startButton.on('pointerdown', () => {
            this.startGame();
        });

        // Back to menu button
        const backButton = this.add.rectangle(512, 730, 200, 50, 0x666666)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive()
            .setDepth(DEPTHS.UI_ELEMENTS);

        const backText = this.add.text(512, 730, 'BACK TO MENU', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT + 1);

        // Back button hover effect
        backButton.on('pointerover', () => {
            backButton.fillColor = 0x888888;
            this.scale.canvas.style.cursor = 'pointer';
        });

        backButton.on('pointerout', () => {
            backButton.fillColor = 0x666666;
            this.scale.canvas.style.cursor = 'default';
        });

        // Back button click
        backButton.on('pointerdown', () => {
            this.backToMainMenu();
        });

        // Setup sound manager
        this.setupSoundManager();

        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Set up the sound manager
     */
    setupSoundManager() {
        // Create sound manager
        this.soundManager = new SoundManager(this);

        // Initialize menu music to ensure we can access it
        this.soundManager.initBackgroundMusic('menu_music', {
            volume: 0.4,
            loop: true
        });

        // Initialize sound effects
        this.soundManager.initSoundEffect('button_click', {
            volume: 0.6,
            rate: 1.0
        });
    }

    /**
     * Start the wave game
     */
    startGame() {
        // Play button click sound
        if (this.soundManager) {
            this.soundManager.playSoundEffect('button_click');

            // Fade out the menu music over 1 second
            this.soundManager.stopMusic(1000);
        }

        // Transition effect
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Start the wave-based game with the stored wave number and debug setting
            this.scene.start('WaveGame', {
                startWave: this.startWave || 0,
                debug: this.debugMode,
                musicFadedOut: true // Flag to indicate we've already faded out the music
            });
        });
    }

    /**
     * Return to main menu
     */
    backToMainMenu() {
        // Play button click sound
        if (this.soundManager) {
            this.soundManager.playSoundEffect('button_click');

            // We don't need to stop the music when going back to the main menu
            // since it's the same music track
        }

        // Transition effect
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenu');
        });
    }
}
