import { DEPTHS, GroupId, CHAOS } from '../constants';
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
        
        this.initialized = false;
        this.isProcessingNextWave = false; // Flag for debounce protection

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

        // Add chaos meter display
        this.setupGroupDisplay();

        // Create cash display UI
        this.createCashUI();

        // Set up event listeners
        this.setupEventListeners();

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
        
        // Create level circle to the right of health bar
        this.elements.levelCircle = this.scene.add.circle(
            width - 30, 35, 22,
            0x000000, 0.8
        ).setScrollFactor(0).setDepth(101);
        
        // Create level circle border
        this.elements.levelBorder = this.scene.add.circle(
            width - 30, 35, 22
        ).setScrollFactor(0).setDepth(102)
        .setStrokeStyle(2, 0x00ff99);
        
        // Create level progress arc (empty initially)
        this.elements.levelArc = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(101);
        
        // Create level text
        this.elements.levelText = this.scene.add.text(
            width - 30, 35, '1',
            { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' }
        ).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(103);
                
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
     * Create cash display UI
     */
    createCashUI() {
        const width = this.scene.cameras.main.width;
        
        // Create cash background
        this.elements.cashBackground = this.scene.add.rectangle(
            width - 220, 60, 120, 30,
            0x000000, 0.7
        ).setOrigin(0, 0).setScrollFactor(0).setDepth(100);
        
        // Create cash icon ($ symbol)
        this.elements.cashIcon = this.scene.add.text(
            width - 210, 75, '$',
            { fontFamily: 'Arial', fontSize: 18, color: '#FFD700', fontWeight: 'bold' }
        ).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(102);
        
        // Create cash text
        this.elements.cashText = this.scene.add.text(
            width - 170, 75, '0',
            { fontFamily: 'Arial', fontSize: 16, color: '#FFD700' }
        ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);
        
        // Add to container
        this.elements.container.add(this.elements.cashBackground);
        this.elements.container.add(this.elements.cashIcon);
        this.elements.container.add(this.elements.cashText);
    }
    
    /**
     * Update cash UI with current cash amount
     * @param {Object} data - Cash data object containing cash value
     */
    updateCashUI(data) {
        if (!this.elements.cashText) return;
        
        const { cash } = data;
        
        // Format cash value with commas for thousands
        const formattedCash = cash.toLocaleString();
        
        // Update cash text
        this.elements.cashText.setText(formattedCash);
        
        // Optional: Add animation effect when cash changes
        if (this._previousCash !== undefined && cash > this._previousCash) {
            // Cash increased, show animation
            this.scene.tweens.add({
                targets: this.elements.cashText,
                scale: { from: 1.2, to: 1 },
                duration: 200,
                ease: 'Back.easeOut'
            });
            
            // Flash the text to gold color
            this.elements.cashText.setTint(0xFFFFFF);
            this.scene.time.delayedCall(100, () => {
                this.elements.cashText.setTint(0xFFD700);
            });
        }
        
        // Store current cash for next comparison
        this._previousCash = cash;
    }
    
    /**
     * Set up chaos meter display at top center
     * Creates a bi-directional bar showing balance between AI and Coder factions
     */
    setupGroupDisplay() {
        const width = this.scene.cameras.main.width;
        const centerX = width / 2;
        
        // Create container for chaos meter
        this.groups.chaosContainer = this.scene.add.container(centerX, 40).setScrollFactor(0).setDepth(DEPTHS.UI_ELEMENTS);
        
        // Background for chaos meter
        this.elements.chaosBg = this.scene.add.rectangle(0, 0, 180, 25, 0x000000, 0.6)
            .setOrigin(0.5, 0.5);
        
        // Background for chaos meter
        this.elements.chaosBg = this.scene.add.rectangle(0, 0, 300, 30, 0x000000, 0.7)
            .setOrigin(0.5, 0.5)
            .setStrokeStyle(1, 0xffffff, 0.3);
        
        // Central marker line
        this.elements.centerLine = this.scene.add.rectangle(0, 0, 2, 30, 0xffffff, 0.8)
            .setOrigin(0.5, 0.5);
        
        // AI side bar (left side - blue)
        this.elements.aiBar = this.scene.add.rectangle(-150, 0, 0, 24, CHAOS.COLORS.AI, 1)
            .setOrigin(0, 0.5);
        
        // Coder side bar (right side - red)
        this.elements.coderBar = this.scene.add.rectangle(0, 0, 0, 24, CHAOS.COLORS.CODER, 1)
            .setOrigin(0, 0.5);
        
        // Labels
        this.elements.aiLabel = this.scene.add.text(-140, 0, 'AI', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setShadow(1, 1, '#000000', 2);
        
        this.elements.coderLabel = this.scene.add.text(140, 0, 'CODER', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5).setShadow(1, 1, '#000000', 2);
        
        // Chaos value display
        this.elements.chaosValue = this.scene.add.text(0, 0, '0', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setShadow(1, 1, '#000000', 2);
        
        // Faction count text (below the chaos meter)
        this.elements.groupText = this.scene.add.text(0, 20, '', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        
        // Add all elements to the container
        this.groups.chaosContainer.add([
            this.elements.chaosBg,
            this.elements.aiBar,
            this.elements.coderBar,
            this.elements.centerLine,
            this.elements.aiLabel,
            this.elements.coderLabel,
            this.elements.chaosValue,
            this.elements.groupText
        ]);
        
        // Set up event listeners for chaos events
        if (this.scene.chaosManager) {
            EventBus.on('chaos-changed', this.handleChaosChanged, this);
            EventBus.on('MAJOR_CHAOS', this.handleMajorChaosEvent, this);
        }
        
        // Initialize with current value if available
        this.updateChaosMeter();
    }
    
    /**
     * Handle chaos value changes
     * @param {Object} data - Data containing old and new chaos values
     */
    handleChaosChanged(data) {
        // Update the chaos meter visualization
        this.updateChaosMeter();
        
        const majorEventThreshold = CHAOS?.MAJOR_EVENT_VALUE || 85;
        
        const newValue = data.newValue || data.value || 0;
        const oldValue = data.oldValue || 0;
        
        // Flash the meter when passing major thresholds
        if (Math.abs(newValue) >= majorEventThreshold && 
            Math.abs(oldValue) < majorEventThreshold) {
            this.flashChaosMeter();
        }
    }
    
    /**
     * Handle major chaos events
     * @param {Object} data - Event data with faction info
     */
    handleMajorChaosEvent(data) {
        this.flashChaosMeter();
        
        // Add screen shake effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(
                CHAOS.SHAKE_DURATION || 500,
                CHAOS.SHAKE_INTENSITY || 0.01
            );
        }
        
        // Add particle burst effect
        this.createChaosParticleEffect(data.factionId);
    }
    
    /**
     * Create particle effect for major chaos events
     * @param {string} factionId - ID of the dominant faction
     */
    createChaosParticleEffect(factionId) {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;
        
        // Determine color based on dominant faction
        const particleColor = factionId === GroupId.AI ? 
            CHAOS.COLORS.AI : CHAOS.COLORS.CODER;
        
        // Create particle emitter
        if (this.scene.add && this.scene.add.particles) {
            // Use default particle texture if available, otherwise use a circle
            const particleManager = this.scene.add.particles(centerX, centerY, 'particle_texture', {
                speed: { min: 100, max: 300 },
                scale: { start: 0.5, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 800,
                blendMode: 'ADD',
                tint: particleColor,
                quantity: 50,
                angle: { min: 0, max: 360 }
            });
            
            // Auto-destroy after effect completes
            this.scene.time.delayedCall(1000, () => {
                if (particleManager) particleManager.destroy();
            });
        }
    }
    
    /**
     * Create flashing effect for the chaos meter
     */
    flashChaosMeter() {
        if (!this.elements.chaosBg) return;
        
        // Stop any existing flash tween
        if (this.flashTween) {
            this.flashTween.stop();
        }
        
        // Reset to normal state
        this.elements.chaosBg.setStrokeStyle(1, 0xffffff, 0.3);
        
        // Create flash effect
        this.flashTween = this.scene.tweens.add({
            targets: [this.elements.chaosBg],
            alpha: { from: 0.7, to: 1 },
            strokeAlpha: { from: 0.3, to: 0.8 },
            yoyo: true,
            repeat: 5,
            duration: 100,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (this.elements.chaosBg) {
                    this.elements.chaosBg.setStrokeStyle(1, 0xffffff, 0.3);
                    this.elements.chaosBg.setAlpha(0.7);
                }
                this.flashTween = null;
            }
        });
    }
    
    /**
     * Update chaos meter with current level
     */
    updateChaosMeter() {
        // First check if the chaos manager exists and if all required elements are available
        if (!this.scene || !this.scene.chaosManager || 
            !this.elements.aiBar || !this.elements.coderBar || 
            !this.elements.chaosValue || !this.elements.chaosValue.setText) {
            return;
        }
        
        try {
            const chaosValue = this.scene.chaosManager.getChaos();
            const maxWidth = 150; // Half of the total bar width (300/2)
            
            // Update the value text - wrap in try/catch to handle potential null data
            this.elements.chaosValue.setText(Math.round(chaosValue));
            
            // Update AI bar (left side, negative values)
            const aiWidth = Math.max(0, -chaosValue) / Math.abs(CHAOS.MIN_VALUE) * maxWidth;
            this.elements.aiBar.width = aiWidth;
            this.elements.aiBar.x = -aiWidth;
            
            // Update Coder bar (right side, positive values)
            const coderWidth = Math.max(0, chaosValue) / CHAOS.MAX_VALUE * maxWidth;
            this.elements.coderBar.width = coderWidth;
            
            // Update faction count text beneath the meter - only if available
            if (this.elements.groupText && this.elements.groupText.setText) {
                this.updateGroupCountText();
            }
        } catch (error) {
            // Silently handle any error that might occur during update
            console.debug("Error updating chaos meter:", error);
        }
    }
    
    /**
     * Update faction count text beneath the chaos meter
     */
    updateGroupCountText() {
        if (!this.scene.groupManager || !this.elements.groupText) return;
        
        const counts = this.scene.groupManager.getAllGroupCounts();
        
        // Format the group counts text
        const aiCount = counts[GroupId.AI] || 0;
        const coderCount = counts[GroupId.CODER] || 0;
        const neutralCount = counts[GroupId.NEUTRAL] || 0;
        
        // Create text for counts
        const groupText = `AI: ${aiCount} | CODER: ${coderCount} | NEUTRAL: ${neutralCount}`;
        this.elements.groupText.setText(groupText);
    }
    /**
     * Update XP UI with current XP and level data
     * @param {Object} data - XP data object containing level, xp, and xpToNext values
     */
    updateXPUI(data) {
        if (!this.elements.levelText) return;
        
        const { level, xp, xpToNext } = data;
        
        // Update level text
        this.elements.levelText.setText(level.toString());
        
        // Draw the circular progress arc around the level circle
        if (this.elements.levelArc) {
            // Clear previous arc
            this.elements.levelArc.clear();
            
            // Get the position of the level circle
            const width = this.scene.cameras.main.width;
            const x = width - 30; // Same as the level circle x position
            const y = 35;         // Same as the level circle y position
            const radius = 22;    // Same as the level circle radius
            
            // Set arc style
            this.elements.levelArc.lineStyle(4, 0x00ff99, 1);
            
            // Calculate the sweep angle based on XP progress
            const progress = (xp / xpToNext) || 0;
            const startAngle = -Math.PI / 2; // Start from top (270 degrees)
            const endAngle = startAngle + (Math.PI * 2 * progress); // Full circle is 2*PI
            
            // Draw the arc
            this.elements.levelArc.beginPath();
            this.elements.levelArc.arc(x, y, radius, startAngle, endAngle, false);
            this.elements.levelArc.strokePath();
        }
    }
    
    /**
     * Display level up animation
     * @param {number} level - New level reached
     */
    showLevelUpAnimation(level) {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Create level up text
        const levelUpText = this.scene.add.text(
            width / 2, height / 2, `LEVEL UP!\nLevel ${level}`,
            { 
                fontFamily: 'Arial', 
                fontSize: 48, 
                color: '#00ff99',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(150).setAlpha(0);
        
        // Create particles for level up effect
        const particles = this.scene.add.particles(width / 2, height / 2, 'particle_texture', {
            speed: { min: 100, max: 200 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            quantity: 10,
            tint: 0x00ff99,
            angle: { min: 0, max: 360 }
        });
        
        particles.setDepth(149);
        
        
        
        // Play level up sound effect if available
        if (this.scene.soundManager) {
            // Use the dedicated levelUp sound effect
            if (this.scene.soundManager.hasSound('levelUp')) {
                this.scene.soundManager.playSoundEffect('levelUp', {
                    volume: 0.7
                });
            } else {
                // Fall back to modified weapon sound if levelUp sound is not available
                this.scene.soundManager.playSoundEffect('shoot_minigun', {
                    detune: 1200, // Higher pitch
                    volume: 0.6,
                    rate: 0.5 // Slower rate
                });
            }
        }
        
        // Animate level up text
        this.scene.tweens.add({
            targets: levelUpText,
            alpha: { from: 0, to: 1 },
            scale: { from: 2, to: 1 },
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Add short pause before fading out
                this.scene.time.delayedCall(1000, () => {
                    // Fade out text
                    this.scene.tweens.add({
                        targets: levelUpText,
                        alpha: 0,
                        y: height * 0.4,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            levelUpText.destroy();
                            particles.destroy();
                        }
                    });
                });
            }
        });
        
        // Pulse the level indicator and make it spin
        this.scene.tweens.add({
            targets: [this.elements.levelCircle, this.elements.levelBorder],
            scale: { from: 1.5, to: 1 },
            duration: 500,
            ease: 'Bounce.easeOut'
        });
        
        // Make the level progress arc flash briefly
        if (this.elements.levelArc) {
            // Save the original level arc properties
            this.elements.levelArc.clear();
            
            // Create a full circle flash effect
            this.elements.levelArc.lineStyle(4, 0xffffff, 1);
            const x = width - 30;
            const y = 35;
            const radius = 22;
            this.elements.levelArc.beginPath();
            this.elements.levelArc.arc(x, y, radius, 0, Math.PI * 2);
            this.elements.levelArc.strokePath();
            
            // Revert to normal after a short delay (will be updated by updateXPUI)
            this.scene.time.delayedCall(300, () => {
                this.elements.levelArc.clear();
                // The next updateXPUI call will draw the correct arc again
            });
        }
        
        // Make the level text pop
        this.scene.tweens.add({
            targets: this.elements.levelText,
            scale: { from: 1.5, to: 1 },
            duration: 500,
            ease: 'Bounce.easeOut'
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
     * Handle next wave button click with debounce protection
     * Ensures the function cannot be called again until animations complete
     */
    onNextWaveClick() {
        // If already processing a click, ignore subsequent clicks
        if (this.isProcessingNextWave) {
            return;
        }
        
        // Set processing flag to prevent multiple rapid clicks
        this.isProcessingNextWave = true;
        
        // Hide the button
        this.hideNextWaveButton();
        
        // Wait for animation to complete (500ms) before starting next wave
        this.scene.time.delayedCall(500, () => {
            // Start next wave if wave manager exists
            if (this.scene.waveManager) {
                this.scene.waveManager.startNextWave();
            }
            
            // Reset processing flag after a safety delay
            this.scene.time.delayedCall(100, () => {
                this.isProcessingNextWave = false;
            });
        });
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
        
        // Add cash stats if available
        let cashText = '';
        if (this.scene.cashManager) {
            cashText = `\nCash Collected: $${this.scene.cashManager.getCurrentCash().toLocaleString()}`;
        }
        
        const statsText = `${waveText}\n${killText}${cashText}`;
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
        
        // Add cash stats if available
        let cashText = '';
        if (this.scene.cashManager) {
            cashText = `\nCash Collected: $${this.scene.cashManager.getCurrentCash().toLocaleString()}`;
        }
        
        const statsText = `${waveText}\n${killText}${cashText}`;
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
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Use the imported EventBus instead of trying to access it through scene
        
        // Listen for XP updates
        EventBus.on('xp-updated', this.updateXPUI, this);
        
        // Listen for level up events
        EventBus.on('level-up', (data) => {
            this.showLevelUpAnimation(data.level);
            this.updateXPUI(data);
        }, this);
        
        // Listen for cash updates
        EventBus.on('cash-updated', this.updateCashUI, this);
        
        // Listen for faction surge events
        EventBus.on('faction-surge', this.showFactionSurgeNotification, this);
        
        // Clean up listeners when scene changes
        this.scene.events.once('shutdown', () => {
            EventBus.off('xp-updated', this.updateXPUI, this);
            EventBus.off('level-up');
            EventBus.off('cash-updated', this.updateCashUI, this);
            EventBus.off('faction-surge', this.showFactionSurgeNotification, this);
        });
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
            const healthPercent = this.scene.playerHealth.getHealthPercent() * 100;
            const maxHealth = this.scene.playerHealth.maxHealth;
            const currentHealth = this.scene.playerHealth.currentHealth;
            this.updateHealthUI(currentHealth, maxHealth);
        }

        
        // Update chaos meter
        this.updateChaosMeter();
    }
    
    /**
     * Display a faction surge notification when a dramatic shift in spawn rates occurs
     * @param {Object} data - Surge data including group ID and strength
     */
    showFactionSurgeNotification(data) {
        const { groupId, strength } = data;
        
        // Determine faction name and color based on groupId
        let factionName = groupId === 'ai' ? 'AI' : 'Coder';
        let color = groupId === 'ai' ? 0x00aaff : 0xff5500;
        
        // Create notification background
        const surgeBackground = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height * 0.2,
            400,
            100,
            0x000000,
            0.8
        ).setScrollFactor(0).setDepth(100);
        
        // Create notification text
        const surgeText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height * 0.2,
            `${factionName} SURGE!\nMassive reinforcements incoming!`,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: `#${color.toString(16).padStart(6, '0')}`,
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(101);
        
        // Create particle effect
        if (this.scene.particles) {
            const particles = this.scene.particles.createEmitter({
                x: this.scene.cameras.main.width / 2,
                y: this.scene.cameras.main.height * 0.2 + 30,
                speed: { min: 100, max: 200 },
                angle: { min: 230, max: 310 },
                scale: { start: 0.6, end: 0 },
                blendMode: 'ADD',
                lifespan: 800,
                quantity: 2,
                tint: color
            });
            
            // Stop after a short time
            this.scene.time.delayedCall(1500, () => {
                particles.stop();
            });
        }
        
        // Create dramatic animation
        this.scene.tweens.add({
            targets: [surgeBackground, surgeText],
            scaleX: { from: 0, to: 1 },
            scaleY: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Add pulsing effect
                this.scene.tweens.add({
                    targets: [surgeBackground, surgeText],
                    scale: { from: 1, to: 1.05 },
                    yoyo: true,
                    repeat: 3,
                    duration: 150,
                    onComplete: () => {
                        // Fade out after delay
                        this.scene.time.delayedCall(1500, () => {
                            this.scene.tweens.add({
                                targets: [surgeBackground, surgeText],
                                alpha: 0,
                                y: '-=50',
                                duration: 500,
                                onComplete: () => {
                                    surgeBackground.destroy();
                                    surgeText.destroy();
                                }
                            });
                        });
                    }
                });
            }
        });
        
        // Camera shake effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.005);
        }
        
        // Play dramatic sound if available
        if (this.scene.soundManager) {
            this.scene.soundManager.playSoundEffect('surge_alert', { volume: 0.7 });
        }
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