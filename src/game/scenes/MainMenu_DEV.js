import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { DEPTHS } from '../constants';
import { MainMenu } from './MainMenu';

/**
 * Development version of MainMenu scene
 * Includes additional developer options and debugging features
 */
export class MainMenu_DEV extends MainMenu {
    constructor() {
        super();
        // Additional dev state
        this.debugMode = true;
        this.selectedStartWave = 0;
    }
    
    create() {
        // Call the parent create method first
        super.create();
        
        // Add development specific UI elements
        this.addDeveloperOptions();
        
        // Add dev notice
        this.add.text(
            10,
            10,
            '[DEV MODE]',
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#ff0000',
                align: 'left'
            }
        ).setDepth(DEPTHS.UI + 10);
        
        // Log to console for dev info
        console.debug('MainMenu_DEV loaded - development options enabled');
    }
    
    addDeveloperOptions() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        // Create a dev panel background
        const devPanel = this.add.rectangle(
            centerX,
            centerY + 300,
            600,
            160,
            0x333333
        ).setDepth(DEPTHS.UI - 1).setAlpha(0.7);
        
        // Create panel title
        this.add.text(
            centerX,
            centerY + 240,
            'DEVELOPER OPTIONS',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffff00',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(DEPTHS.UI);
        
        // Create wave selection for Wave Mode
        this.createWaveSelection(centerX, centerY + 280);
        
        // Create debug toggle button
        this.createDebugToggle(centerX, centerY + 340);
    }
    
    createWaveSelection(centerX, centerY) {
        
        // Create wave selection buttons
        const waveOptions = [0, 9, 19, 29, 39];
        const buttonWidth = 50;
        const spacing = 60;
        
        this.waveButtons = [];
        
        waveOptions.forEach((wave, index) => {
            // Position each button
            const x = centerX - 100 + (index * spacing);
            
            // Create button
            const button = this.add.rectangle(
                x,
                centerY,
                buttonWidth,
                30,
                0x444444
            ).setDepth(DEPTHS.UI).setInteractive();
            
            // Add text label
            const text = this.add.text(
                x,
                centerY,
                wave.toString(),
                {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    color: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5).setDepth(DEPTHS.UI + 1);
            
            // Button events
            button.on('pointerup', () => {
                this.selectedStartWave = wave;
                this.updateWaveSelection();
            });
            
            // Store button reference
            this.waveButtons.push({ button, wave });
        });
        
        // Set default selection
        this.updateWaveSelection();
    }
    
    createDebugToggle(centerX, centerY) {
        // Create toggle button background
        const toggleBg = this.add.rectangle(
            centerX - 150,
            centerY,
            140,
            30,
            0x444444
        ).setDepth(DEPTHS.UI).setInteractive();
        
        // Create toggle label
        this.add.text(
            centerX - 220,
            centerY,
            'Debug:',
            {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                align: 'right'
            }
        ).setOrigin(1, 0.5).setDepth(DEPTHS.UI);
        
        // Create toggle text
        this.debugToggleText = this.add.text(
            centerX - 150,
            centerY,
            this.debugMode ? 'ENABLED' : 'DISABLED',
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: this.debugMode ? '#00ff00' : '#ff0000',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(DEPTHS.UI + 1);
        
        // Toggle event
        toggleBg.on('pointerup', () => {
            this.debugMode = !this.debugMode;
            
            // Update toggle text
            this.debugToggleText.setText(this.debugMode ? 'ENABLED' : 'DISABLED');
            this.debugToggleText.setColor(this.debugMode ? '#00ff00' : '#ff0000');
            
            // Apply debug mode changes
            EventBus.emit('debug-mode-changed', this.debugMode);
        });
    }
    
    updateWaveSelection() {
        // Update the visual state of all wave buttons
        this.waveButtons.forEach(({ button, wave }) => {
            if (wave === this.selectedStartWave) {
                button.setFillStyle(0x00aaff);
            } else {
                button.setFillStyle(0x444444);
            }
        });
    }
    
    // Override the startGame method to include developer options
    startGame(mode) {
        // Transition effect
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (this.logoTween) {
                this.logoTween.stop();
                this.logoTween = null;
            }
            
            // Start the PreSpawn scene with developer options
            this.scene.start('PreSpawn', { 
                startWave: this.selectedStartWave,
                debug: this.debugMode
            });
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
}
