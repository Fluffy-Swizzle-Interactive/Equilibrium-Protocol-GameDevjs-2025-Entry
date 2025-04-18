import { DEPTHS, GroupId } from '../constants';
import { EventBus } from '../EventBus';

/**
 * UIManager class
 * Centralized manager for all UI elements in the game including
 * wave information, health bar, wave banners, and the next wave button
 */
export class UIManager {
    /**
     * Create a new UI manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.elements = {}; // Store all UI elements
        this.groups = {}; // Store UI element groups
        this.isDebugShown = false;
        this.initialized = false;

        // Register with scene for easier access
        scene.uiManager = this;
    }
    
    /**
     * Initialize UI elements
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        // Skip if already initialized
        if (this.initialized) return;

        // Store configuration options
        this.options = {
            showDebug: options.showDebug !== undefined ? options.showDebug : false,
            ...options
        };
        
        // Create UI container
        this.createUIContainer();
        
        // Create wave UI
        this.createWaveUI();
        
        // Create health UI
        this.createHealthUI();
        
        // Create wave banner
        this.createWaveBanner();
        
        // Create next wave button
        this.createNextWaveButton();
        
        // Create victory and game over UI
        this.createEndGameUI();
        
        // Create pause overlay
        this.createPauseOverlay();
        
        // Create debug info
        if (this.options.showDebug) {
            this.createDebugInfo();
            this.isDebugShown = true;
        }

        // Add group stats display for enemy factions
        this.setupGroupDisplay();
        
        // Add chaos meter display
        this.setupChaosMeter();

        this.initialized = true;
    }
    
    /**
     * Create the main UI container
     */
    createUIContainer() {
        // Get camera dimensions
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create UI container that stays fixed to the camera
        this.elements.container = this.scene.add.container(0, 0)
            .setScrollFactor(0) // Don't move with camera
            .setDepth(100); // Always on top
    }
    
    /**
     * Create wave number display
     */
    createWaveUI() {
        // Create wave text background
        this.elements.waveBackground = this.scene.add.rectangle(
            20, 20, 140, 40,
            0x000000, 0.7
        ).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
        
        // Create wave text
        this.elements.waveText = this.scene.add.text(
            30, 30, 'Wave: 0/40',
            { fontFamily: 'Arial', fontSize: 20, color: '#ffffff' }
        ).setScrollFactor(0).setDepth(101);
        
        // Add to container
        this.elements.container.add(this.elements.waveBackground);
        this.elements.container.add(this.elements.waveText);
    }
    
    /**
     * Create health bar UI
     */
    createHealthUI() {
        const width = this.scene.cameras.main.width;
        
        // Create health background
        this.elements.healthBackground = this.scene.add.rectangle(
            width - 220, 20, 200, 30,
            0x000000, 0.7
        ).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
        
        // Create health bar
        this.elements.healthBar = this.scene.add.rectangle(
            width - 215, 25, 190, 20,
            0xff0000, 1
        ).setOrigin(0, 0).setScrollFactor(0).setDepth(101);
        
        // Create health text
        this.elements.healthText = this.scene.add.text(
            width - 120, 30, '100%',
            { fontFamily: 'Arial', fontSize: 14, color: '#ffffff' }
        ).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(102);
        
        // Add to container
        this.elements.container.add(this.elements.healthBackground);
        this.elements.container.add(this.elements.healthBar);
        this.elements.container.add(this.elements.healthText);
    }
    
    /**
     * Create wave banner for displaying wave start/end
     */
    createWaveBanner() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create banner background
        this.elements.waveBannerBg = this.scene.add.rectangle(
            width / 2, height * 0.3, 400, 150,
            0x000099, 0.8
        ).setOrigin(0.5).setScrollFactor(0).setDepth(110);
        
        // Create banner text
        this.elements.waveBannerText = this.scene.add.text(
            width / 2, height * 0.3, 'Wave 1',
            { 
                fontFamily: 'Arial', 
                fontSize: 36, 
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        
        // Add to container and hide initially
        this.elements.container.add(this.elements.waveBannerBg);
        this.elements.container.add(this.elements.waveBannerText);
        this.elements.waveBannerBg.setVisible(false);
        this.elements.waveBannerText.setVisible(false);
    }
    
    /**
     * Create next wave button
     */
    createNextWaveButton() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create button background
        this.elements.nextWaveButtonBg = this.scene.add.rectangle(
            width / 2, height - 80, 220, 60,
            0x006600, 1
        ).setOrigin(0.5).setScrollFactor(0).setDepth(110);
        
        // Create button text
        this.elements.nextWaveButtonText = this.scene.add.text(
            width / 2, height - 80, 'Start Next Wave',
            { 
                fontFamily: 'Arial', 
                fontSize: 20, 
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(111);
        
        // Make interactive
        this.elements.nextWaveButtonBg.setInteractive({ useHandCursor: true });
        this.elements.nextWaveButtonText.setInteractive({ useHandCursor: true });
        
        // Add hover effect
        this.elements.nextWaveButtonBg.on('pointerover', () => {
            this.elements.nextWaveButtonBg.setFillStyle(0x008800);
        });
        
        this.elements.nextWaveButtonBg.on('pointerout', () => {
            this.elements.nextWaveButtonBg.setFillStyle(0x006600);
        });
        
        // Add click event
        this.elements.nextWaveButtonBg.on('pointerdown', () => {
            this.onNextWaveClick();
        });
        
        this.elements.nextWaveButtonText.on('pointerdown', () => {
            this.onNextWaveClick();
        });
        
        // Add to container and hide initially
        this.elements.container.add(this.elements.nextWaveButtonBg);
        this.elements.container.add(this.elements.nextWaveButtonText);
        this.elements.nextWaveButtonBg.setVisible(false);
        this.elements.nextWaveButtonText.setVisible(false);
    }
    
    /**
     * Create victory and game over UI
     */
    createEndGameUI() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create game over overlay
        this.elements.gameOverOverlay = this.scene.add.rectangle(
            0, 0, width, height,
            0x000000, 0.8
        ).setOrigin(0).setScrollFactor(0).setDepth(200);
        
        // Create game over text
        this.elements.gameOverText = this.scene.add.text(
            width / 2, height / 2 - 50, 'GAME OVER',
            { 
                fontFamily: 'Arial', 
                fontSize: 48, 
                color: '#ff0000',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        
        // Create victory text
        this.elements.victoryText = this.scene.add.text(
            width / 2, height / 2 - 50, 'VICTORY!',
            { 
                fontFamily: 'Arial', 
                fontSize: 48, 
                color: '#00ff00',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        
        // Create stats text
        this.elements.endGameStats = this.scene.add.text(
            width / 2, height / 2 + 50, '',
            { 
                fontFamily: 'Arial', 
                fontSize: 24, 
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        
        // Create restart button
        this.elements.restartButton = this.scene.add.rectangle(
            width / 2, height / 2 + 150, 200, 60,
            0x555555, 1
        ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        
        // Create restart text
        this.elements.restartText = this.scene.add.text(
            width / 2, height / 2 + 150, 'Back to Menu',
            { 
                fontFamily: 'Arial', 
                fontSize: 20, 
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(202);
        
        // Make restart button interactive
        this.elements.restartButton.setInteractive({ useHandCursor: true });
        this.elements.restartText.setInteractive({ useHandCursor: true });
        
        // Add hover effect
        this.elements.restartButton.on('pointerover', () => {
            this.elements.restartButton.setFillStyle(0x777777);
        });
        
        this.elements.restartButton.on('pointerout', () => {
            this.elements.restartButton.setFillStyle(0x555555);
        });
        
        // Add click event
        this.elements.restartButton.on('pointerdown', () => {
            this.onRestartClick();
        });
        
        this.elements.restartText.on('pointerdown', () => {
            this.onRestartClick();
        });
        
        // Add to container and hide initially
        this.elements.container.add(this.elements.gameOverOverlay);
        this.elements.container.add(this.elements.gameOverText);
        this.elements.container.add(this.elements.victoryText);
        this.elements.container.add(this.elements.endGameStats);
        this.elements.container.add(this.elements.restartButton);
        this.elements.container.add(this.elements.restartText);
        
        // Hide end game UI initially
        this.elements.gameOverOverlay.setVisible(false);
        this.elements.gameOverText.setVisible(false);
        this.elements.victoryText.setVisible(false);
        this.elements.endGameStats.setVisible(false);
        this.elements.restartButton.setVisible(false);
        this.elements.restartText.setVisible(false);
    }
    
    /**
     * Create pause overlay
     */
    createPauseOverlay() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create pause overlay
        this.elements.pauseOverlay = this.scene.add.rectangle(
            0, 0, width, height,
            0x000000, 0.5
        ).setOrigin(0).setScrollFactor(0).setDepth(150);
        
        // Create pause text
        this.elements.pauseText = this.scene.add.text(
            width / 2, height / 2, 'PAUSED\nPress SPACE to continue',
            { 
                fontFamily: 'Arial', 
                fontSize: 36, 
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(151);
        
        // Add to container and hide initially
        this.elements.container.add(this.elements.pauseOverlay);
        this.elements.container.add(this.elements.pauseText);
        this.elements.pauseOverlay.setVisible(false);
        this.elements.pauseText.setVisible(false);
    }
    
    /**
     * Create debug info display
     */
    createDebugInfo() {
        const width = this.scene.cameras.main.width;
        
        // Create debug background
        this.elements.debugBg = this.scene.add.rectangle(
            width - 260, 100, 240, 200,
            0x000000, 0.5
        ).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
        
        // Create debug text
        this.elements.debugText = this.scene.add.text(
            width - 250, 110, 'Debug Info',
            { 
                fontFamily: 'Courier', 
                fontSize: 14, 
                color: '#ffffff',
                align: 'left'
            }
        ).setScrollFactor(0).setDepth(101);
        
        // Add to container
        this.elements.container.add(this.elements.debugBg);
        this.elements.container.add(this.elements.debugText);
        
        // Update debug info periodically
        this.scene.time.addEvent({
            delay: 500, // Update every 500ms
            callback: this.updateDebugInfo,
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * Set up group display showing enemy faction counts
     */
    setupGroupDisplay() {
        const centerX = this.scene.cameras.main.width / 2;
        
        // Create container for group info
        this.groups.groupContainer = this.scene.add.container(centerX, 40).setScrollFactor(0).setDepth(DEPTHS.UI_ELEMENTS);
        
        // Background for group counter
        this.elements.groupBg = this.scene.add.rectangle(0, 0, 240, 60, 0x000000, 0.6)
            .setOrigin(0.5, 0.5);
        
        // Text for group counts
        this.elements.groupText = this.scene.add.text(0, 0, 'Factions: AI: 0 | CODER: 0 | NEUTRAL: 0', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Add elements to container
        this.groups.groupContainer.add([this.elements.groupBg, this.elements.groupText]);
    }
    
    /**
     * Set up chaos meter to emit events for React-based UI
     */
    setupChaosMeter() {
        // We'll use the React ChaosBar component for visual display
        // This method now just sets up event emission when chaos changes
        
        if (!this.scene.chaosManager) return;
        
        // Set up an event listener to emit the current chaos level periodically
        // This helps ensure the React component has updated data even if it misses some events
        this.chaosSyncTimer = this.scene.time.addEvent({
            delay: 1000, // Sync every second
            callback: () => {
                if (this.scene.chaosManager) {
                    const chaosValue = this.scene.chaosManager.getChaos();
                    const chaosData = {
                        value: chaosValue,
                        normalized: this.scene.chaosManager.getNormalizedChaos(),
                        polarity: this.scene.chaosManager.getPolarity(),
                        absoluteValue: this.scene.chaosManager.getAbsoluteChaos(),
                        percentage: this.scene.chaosManager.getChaosPercentage()
                    };
                    
                    // Emit the current chaos data to EventBus
                    EventBus.emit('chaos-sync', chaosData);
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    /**
     * Update the wave UI with current wave number
     * @param {number} currentWave - Current wave number
     * @param {number} maxWaves - Maximum number of waves
     */
    updateWaveUI(currentWave, maxWaves) {
        if (!this.elements.waveText) return;
        this.elements.waveText.setText(`Wave: ${currentWave}/${maxWaves}`);
    }
    
    /**
     * Update the health UI with current health percentage
     * @param {number} currentHealth - Current health value
     * @param {number} maxHealth - Maximum health value
     */
    updateHealthUI(currentHealth, maxHealth) {
        if (!this.elements.healthBar || !this.elements.healthText) return;
        
        // Calculate health percentage
        const healthPercent = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
        
        // Update health bar width
        const maxWidth = 190;
        this.elements.healthBar.width = Math.max(0, (maxWidth * healthPercent) / 100);
        
        // Update health text
        this.elements.healthText.setText(`${Math.floor(healthPercent)}%`);
        
        // Change color based on health percentage
        if (healthPercent < 25) {
            this.elements.healthBar.setFillStyle(0xff0000); // Red
        } else if (healthPercent < 50) {
            this.elements.healthBar.setFillStyle(0xff6600); // Orange
        } else if (healthPercent < 75) {
            this.elements.healthBar.setFillStyle(0xffff00); // Yellow
        } else {
            this.elements.healthBar.setFillStyle(0x00ff00); // Green
        }
    }
    
    /**
     * Show wave start banner
     * @param {number} waveNumber - Current wave number
     * @param {boolean} isBossWave - Whether this is a boss wave
     */
    showWaveStartBanner(waveNumber, isBossWave) {
        // Set banner text
        let bannerText = `Wave ${waveNumber}`;
        let bannerColor = 0x000099; // Blue for regular waves
        
        // Special message for boss waves
        if (isBossWave) {
            bannerText = `BOSS WAVE!\nWave ${waveNumber}`;
            bannerColor = 0x990000; // Red for boss waves
        }
        
        // Set text and color
        this.elements.waveBannerText.setText(bannerText);
        this.elements.waveBannerBg.setFillStyle(bannerColor, 0.8);
        
        // Show banner elements
        this.elements.waveBannerBg.setVisible(true);
        this.elements.waveBannerBg.setAlpha(0);
        this.elements.waveBannerText.setVisible(true);
        this.elements.waveBannerText.setAlpha(0);
        
        // Animate banner appearance
        this.scene.tweens.add({
            targets: [this.elements.waveBannerBg, this.elements.waveBannerText],
            y: { from: this.scene.cameras.main.height * 0.2, to: this.scene.cameras.main.height * 0.3 },
            alpha: { from: 0, to: 1 },
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hide banner after a delay
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: [this.elements.waveBannerBg, this.elements.waveBannerText],
                        y: this.scene.cameras.main.height * 0.2,
                        alpha: 0,
                        duration: 800,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            this.elements.waveBannerBg.setVisible(false);
                            this.elements.waveBannerText.setVisible(false);
                        }
                    });
                });
            }
        });
    }
    
    /**
     * Show wave complete UI and next wave button
     */
    showWaveCompleteUI() {
        // Set banner text and color
        this.elements.waveBannerText.setText('Wave Complete!\nPrepare for next wave');
        this.elements.waveBannerBg.setFillStyle(0x009900, 0.8); // Green for completion
        
        // Show banner elements
        this.elements.waveBannerBg.setVisible(true);
        this.elements.waveBannerBg.setAlpha(0);
        this.elements.waveBannerText.setVisible(true);
        this.elements.waveBannerText.setAlpha(0);
        
        // Animate banner appearance
        this.scene.tweens.add({
            targets: [this.elements.waveBannerBg, this.elements.waveBannerText],
            y: { from: this.scene.cameras.main.height * 0.2, to: this.scene.cameras.main.height * 0.3 },
            alpha: { from: 0, to: 1 },
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Show the next wave button
                this.showNextWaveButton();
                
                // Hide banner after a delay
                this.scene.time.delayedCall(3000, () => {
                    this.scene.tweens.add({
                        targets: [this.elements.waveBannerBg, this.elements.waveBannerText],
                        y: this.scene.cameras.main.height * 0.2,
                        alpha: 0,
                        duration: 800,
                        ease: 'Back.easeIn',
                        onComplete: () => {
                            this.elements.waveBannerBg.setVisible(false);
                            this.elements.waveBannerText.setVisible(false);
                        }
                    });
                });
            }
        });
    }
    
    /**
     * Show the next wave button
     */
    showNextWaveButton() {
        // Show button elements
        this.elements.nextWaveButtonBg.setVisible(true);
        this.elements.nextWaveButtonText.setVisible(true);
        
        // Animate button appearance
        this.scene.tweens.add({
            targets: [this.elements.nextWaveButtonBg, this.elements.nextWaveButtonText],
            y: { from: this.scene.cameras.main.height + 50, to: this.scene.cameras.main.height - 80 },
            duration: 500,
            ease: 'Back.easeOut'
        });
    }
    
    /**
     * Hide the next wave button
     */
    hideNextWaveButton() {
        // Animate button disappearance
        this.scene.tweens.add({
            targets: [this.elements.nextWaveButtonBg, this.elements.nextWaveButtonText],
            y: this.scene.cameras.main.height + 50,
            duration: 500,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.elements.nextWaveButtonBg.setVisible(false);
                this.elements.nextWaveButtonText.setVisible(false);
            }
        });
    }
    
    /**
     * Handle next wave button click
     */
    onNextWaveClick() {
        // Hide the button
        this.hideNextWaveButton();
        
        // Start next wave if wave manager exists
        if (this.scene.waveManager) {
            this.scene.waveManager.startNextWave();
        }
    }
    
    /**
     * Show game over UI
     */
    showGameOverUI() {
        // Prepare game over UI elements
        this.elements.gameOverOverlay.setVisible(true);
        this.elements.gameOverText.setVisible(true);
        this.elements.gameOverText.setAlpha(0);
        this.elements.gameOverText.setScale(2);
        
        // Prepare stats display
        const waveText = this.scene.waveManager 
            ? `Waves Survived: ${this.scene.waveManager.currentWave}` 
            : '';
        const killText = `Enemies Defeated: ${this.scene.killCount}`;
        const statsText = `${waveText}\n${killText}`;
        this.elements.endGameStats.setText(statsText);
        this.elements.endGameStats.setVisible(true);
        this.elements.endGameStats.setAlpha(0);
        
        // Show restart button
        this.elements.restartButton.setVisible(true);
        this.elements.restartText.setVisible(true);
        this.elements.restartButton.setAlpha(0);
        this.elements.restartText.setAlpha(0);
        
        // Animate game over text
        this.scene.tweens.add({
            targets: this.elements.gameOverText,
            alpha: 1,
            scale: 1,
            duration: 1000,
            ease: 'Back.easeOut',
            delay: 500,
            onComplete: () => {
                // Animate stats text
                this.scene.tweens.add({
                    targets: this.elements.endGameStats,
                    alpha: 1,
                    y: { from: this.scene.cameras.main.height / 2 + 20, to: this.scene.cameras.main.height / 2 + 50 },
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => {
                        // Animate restart button
                        this.scene.tweens.add({
                            targets: [this.elements.restartButton, this.elements.restartText],
                            alpha: 1,
                            y: { from: this.scene.cameras.main.height / 2 + 120, to: this.scene.cameras.main.height / 2 + 150 },
                            duration: 800,
                            ease: 'Power2'
                        });
                    }
                });
            }
        });
    }
    
    /**
     * Show victory UI when all waves are completed
     */
    showVictoryUI() {
        // Prepare victory UI elements
        this.elements.gameOverOverlay.setVisible(true);
        this.elements.victoryText.setVisible(true);
        this.elements.victoryText.setAlpha(0);
        this.elements.victoryText.setScale(2);
        
        // Prepare stats display
        const waveText = `All 40 Waves Completed!`;
        const killText = `Total Enemies Defeated: ${this.scene.killCount}`;
        const statsText = `${waveText}\n${killText}`;
        this.elements.endGameStats.setText(statsText);
        this.elements.endGameStats.setVisible(true);
        this.elements.endGameStats.setAlpha(0);
        
        // Show restart button
        this.elements.restartButton.setVisible(true);
        this.elements.restartText.setVisible(true);
        this.elements.restartButton.setAlpha(0);
        this.elements.restartText.setAlpha(0);
        
        // Animate victory text
        this.scene.tweens.add({
            targets: this.elements.victoryText,
            alpha: 1,
            scale: 1,
            duration: 1000,
            ease: 'Back.easeOut',
            delay: 500,
            onComplete: () => {
                // Animate stats text
                this.scene.tweens.add({
                    targets: this.elements.endGameStats,
                    alpha: 1,
                    y: { from: this.scene.cameras.main.height / 2 + 20, to: this.scene.cameras.main.height / 2 + 50 },
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => {
                        // Animate restart button
                        this.scene.tweens.add({
                            targets: [this.elements.restartButton, this.elements.restartText],
                            alpha: 1,
                            y: { from: this.scene.cameras.main.height / 2 + 120, to: this.scene.cameras.main.height / 2 + 150 },
                            duration: 800,
                            ease: 'Power2'
                        });
                    }
                });
            }
        });
    }
    
    /**
     * Handle restart button click
     */
    onRestartClick() {
        // Return to main menu
        this.scene.scene.start('MainMenu');
    }
    
    /**
     * Update group display with current counts
     */
    updateGroupDisplay() {
        if (!this.scene.groupManager || !this.elements.groupText) return;
        
        const counts = this.scene.groupManager.getAllGroupCounts();
        
        // Format the group counts text
        const aiCount = counts[GroupId.AI] || 0;
        const coderCount = counts[GroupId.CODER] || 0;
        const neutralCount = counts[GroupId.NEUTRAL] || 0;
        
        // Create colored text for each faction
        let groupText = 'Factions: ';
        groupText += `[color=#ff3333]AI: ${aiCount}[/color] | `;
        groupText += `[color=#33aaff]CODER: ${coderCount}[/color] | `;
        groupText += `[color=#55ff55]NEUTRAL: ${neutralCount}[/color]`;
        
        // Use setHTML to support colored text
        this.elements.groupText.setText(groupText.replace(/\[color=#([0-9a-fA-F]{6})\]/g, '')
                                               .replace(/\[\/color\]/g, ''));
    }
    
    /**
     * Update chaos meter with current level
     */
    updateChaosMeter() {
        // Chaos meter is now handled by React component, no need to update here
    }
    
    /**
     * Update debug information display
     */
    updateDebugInfo() {
        if (!this.elements.debugText || !this.options.showDebug) return;
        
        const { scene } = this;
        let debugText = 'DEBUG INFO\n';
        
        // FPS
        debugText += `FPS: ${Math.floor(scene.game.loop.actualFps)}\n`;
        
        // Wave information
        if (scene.waveManager) {
            debugText += `Wave: ${scene.waveManager.currentWave}/${scene.waveManager.maxWaves}\n`;
            debugText += `Active Enemies: ${scene.waveManager.activeEnemies}\n`;
            debugText += `Enemies Spawned: ${scene.waveManager.enemiesSpawned}\n`;
        }
        
        // Object pools information
        if (scene.gameObjectManager) {
            const stats = scene.gameObjectManager.getStats();
            debugText += '\nPOOLS:\n';
            
            for (const [type, poolStats] of Object.entries(stats)) {
                if (poolStats) {
                    debugText += `${type}: ${poolStats.active}/${poolStats.total}\n`;
                }
            }
        }
        
        // Player position
        if (scene.player) {
            const pos = scene.player.getPosition();
            debugText += `\nPlayer: (${Math.floor(pos.x)}, ${Math.floor(pos.y)})\n`;
        }
        
        // Kill count
        debugText += `Kills: ${scene.killCount}\n`;
        
        // Add group counts if available
        if (scene.groupManager) {
            const counts = scene.groupManager.getAllGroupCounts();
            debugText += `Groups: AI=${counts[GroupId.AI] || 0}, `;
            debugText += `CODER=${counts[GroupId.CODER] || 0}, `;
            debugText += `NEUTRAL=${counts[GroupId.NEUTRAL] || 0}\n`;
        }
        
        // Add chaos level if available
        if (scene.chaosManager) {
            const chaosValue = Math.round(scene.chaosManager.getChaos());
            debugText += `Chaos: ${chaosValue}%\n`;
        }
        
        // Update the debug text
        this.elements.debugText.setText(debugText);
    }
    
    /**
     * Update score UI
     * @param {number} score - Current score value
     */
    updateScoreUI(score) {
        // No dedicated score UI in wave mode, but we can update debug if needed
        if (this.isDebugShown) {
            this.updateDebugInfo();
        }
    }
    
    /**
     * Update method called each frame
     */
    update() {
        // Update player health if health system exists
        if (this.scene.playerHealth) {
           // const health = this.scene.playerHealth.getCurrentHealth();
            //const maxHealth = this.scene.playerHealth.getMaxHealth();
            //this.updateHealthUI(health, maxHealth);
        }

        // Update debug info if enabled
        if (this.options.showDebug && this.elements.debugText) {
            this.updateDebugInfo();
        }
        
        // Update group display
        this.updateGroupDisplay();
    }
    
    /**
     * Clean up resources when scene is destroyed
     */
    destroy() {
        // Clean up timers
        if (this.chaosSyncTimer) {
            this.chaosSyncTimer.destroy();
            this.chaosSyncTimer = null;
        }
        
        // Clean up elements
        for (const key in this.elements) {
            if (this.elements[key] && this.elements[key].destroy) {
                this.elements[key].destroy();
            }
        }
        
        // Clear references
        this.elements = {};
        this.groups = {};
        this.scene = null;
    }
}