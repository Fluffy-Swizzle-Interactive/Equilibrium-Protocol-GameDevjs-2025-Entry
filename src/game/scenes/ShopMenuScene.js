import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { RARITY } from '../constants/WeaponUpgrades';

/**
 * ShopMenuScene class
 * Manages the UI interface for the in-game shop to purchase upgrades between waves
 */
export default class ShopMenuScene extends Phaser.Scene {
    constructor() {
        super('ShopMenu');
        this.upgradeElements = {
            weaponCards: [],
            playerButtons: [],
            statPanels: []
        };
        this.shopOverlay = null;
        this.shopWidth = 0;
        this.shopHeight = 0;
        this.shopManager = null;
        this.gameScene = null;
        this.upgradeOptions = null;
    }

    init(data) {
        // Store references passed from the WaveGame scene
        this.shopManager = data.shopManager;
        this.upgradeOptions = data.upgradeOptions;
        this.gameScene = data.gameScene;
        this.playerRef = data.player;
    }

    preload() {
        // Load any necessary assets for the shop menu
    }

    create() {
        // Set up scene sizes
        const { width, height } = this.sys.game.canvas;
        this.shopWidth = width * 0.9;
        this.shopHeight = height * 0.8;
        
        // Create the shop UI using the options provided
        this.createShopUI(this.upgradeOptions);
        
        // Register event for closing shop
        this.events.once('shutdown', this.cleanup, this);
        
        // Set up events for shop interactions
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for shop interactions
     */
    setupEventListeners() {
        // Listen for purchases
        EventBus.on('shop-item-purchased', this.handleItemPurchased, this);
        
        // Listen for rerolls
        EventBus.on('shop-rerolled', this.handleReroll, this);
        
        // Listen for failures
        EventBus.on('shop-purchase-failed', this.handlePurchaseFailed, this);
        EventBus.on('shop-reroll-failed', this.handleRerollFailed, this);
    }

    /**
     * Create the entire shop UI
     * @param {Object} upgradeOptions - Options for available upgrades
     */
    createShopUI(upgradeOptions) {
        const { width, height } = this.sys.game.canvas;
        
        // Create container for all shop elements
        this.shopOverlay = this.add.container().setScrollFactor(0).setDepth(150);
        
        // Create semi-transparent background overlay
        const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(150);
        this.shopOverlay.add(bg);
        
        // Create main shop container with dark background
        const mainContainer = this.add.container(width / 2, height / 2);
        const mainBg = this.add.rectangle(0, 0, this.shopWidth, this.shopHeight, 0x111111, 0.9);
        mainBg.setOrigin(0.5);
        mainContainer.add(mainBg);
        this.shopOverlay.add(mainContainer);
        
        // Create shop title
        const shopTitle = this.add.text(0, -this.shopHeight / 2 + 30, 'Shop', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);
        mainContainer.add(shopTitle);
        
        // Layout constants - dividing the shop into sections
        const upperSectionY = -this.shopHeight * 0.25; // Upper section for weapon/player upgrades
        const lowerSectionY = upperSectionY + 200; // Lower section for stats panels
        const bottomSectionY = this.shopHeight * 0.35; // Bottom section for buttons
        
        // Create upgrades in the upper section
        if (upgradeOptions) {
            this.createWeaponUpgrades(mainContainer, upgradeOptions.weaponUpgrades, upperSectionY);
            this.createPlayerUpgrades(mainContainer, upgradeOptions.playerUpgrades, upperSectionY);
            
            // Create stats panels in the lower section
            this.createStatPanels(mainContainer, lowerSectionY);
            
            // Create bottom buttons
            this.createBottomButtons(mainContainer, bottomSectionY);
        }
        
        // Add animation for the overlay
        this.tweens.add({
            targets: this.shopOverlay,
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Power2'
        });
        
        // Update stats from player
        this.updateStatPanels();
    }

    /**
     * Create weapon upgrade cards display - horizontally arranged on left side
     * @param {Phaser.GameObjects.Container} container - Main container to add elements to
     * @param {Array} weaponUpgrades - Array of weapon upgrade options
     * @param {number} startY - Y position to start placing cards
     */
    createWeaponUpgrades(container, weaponUpgrades, startY) {
        // Clear any existing weapon cards
        this.upgradeElements.weaponCards = [];
        
        // Define player upgrade button dimensions to calculate total height
        const playerButtonHeight = 40;
        const playerButtonSpacing = 15;
        
        // Calculate total height of three player upgrades (3 buttons + 2 spaces between them)
        // This makes the weapon cards the same height as all three player upgrade buttons combined
        const cardWidth = 160;
        const cardHeight = (playerButtonHeight * 3) + (playerButtonSpacing * 2); // 40*3 + 15*2 = 150
        const spacing = 15;
        
        // Use the provided weapon upgrades or empty array if none
        const upgrades = weaponUpgrades || [];
        
        // Loop through weapon upgrades and create cards
        upgrades.forEach((upgrade, index) => {
            // Position cards side by side on the left side
            const x = -this.shopWidth * 0.3 + (index * (cardWidth + spacing));
            
            // Create card container
            const card = this.add.container(x, startY);
            
            // Get visual properties from upgrade or use defaults
            const fillColor = upgrade.visualProperties?.fillColor || 0x000022;
            const borderColor = upgrade.visualProperties?.borderColor || 0x3333aa;
            
            // Create card background with colored border
            const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, fillColor, 0.6);
            const cardBorder = this.add.rectangle(0, 0, cardWidth, cardHeight);
            cardBorder.setStrokeStyle(2, borderColor);
            cardBg.setOrigin(0.5);
            cardBorder.setOrigin(0.5);
            
            // Create card title - positioned higher in the taller card
            const nameText = this.add.text(0, -cardHeight/2 + 20, upgrade.name, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
            
            // Add subtle dropshadow to improve text readability
            nameText.setShadow(1, 1, 'rgba(0,0,0,0.5)', 2);
            
            // Reduced spacing between elements - position category closer to the title
            const categoryText = this.add.text(0, -cardHeight/2 + 50, 
                `Category: ${upgrade.category}`, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: '#dddddd',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
            
            // Create rarity text with reduced spacing
            // Use the rarity color from our constants
            const rarityColor = upgrade.rarity?.color || '#ffffff';
            
            const rarityText = this.add.text(0, -cardHeight/2 + 75, 
                `Rarity: ${upgrade.rarity?.name || 'Common'}`, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: rarityColor,
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
            
            // Add shadow to improve text readability
            categoryText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
            rarityText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
            
            // Add effects text with reduced spacing
            const effectsText = this.add.text(0, -cardHeight/2 + 100, 
                `Effects: ${upgrade.effects}`, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: '#88ff88',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
            effectsText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
            
            // Add price box at the bottom of the card - with added bottom padding
            const priceBoxWidth = 100;
            const priceBoxHeight = 26;
            const priceY = cardHeight/2 - 20;
            
            // Create price box with black transparent background and yellow border
            const priceBox = this.add.rectangle(0, priceY, priceBoxWidth, priceBoxHeight, 0x000000, 0.5);
            priceBox.setStrokeStyle(1, 0xffcc44); // Credit yellow color border
            
            // Create price text with improved readability
            const priceText = this.add.text(0, priceY, `Credits: ${upgrade.price}`, {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffcc44', // Credit yellow color
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
            
            // Add subtle glow to price text
            priceText.setShadow(0, 0, '#ffcc44', 3, true, true);
            
            // Add all elements to card
            card.add([cardBg, cardBorder, nameText, categoryText, rarityText, effectsText, priceBox, priceText]);
            
            // Make the entire card interactive
            card.setSize(cardWidth, cardHeight); // Set the size of the container for hit testing
            card.setInteractive({ useHandCursor: true });
            
            // Add hover effect to the container
            card.on('pointerover', () => {
                cardBorder.setStrokeStyle(3, borderColor);
                categoryText.setColor('#ffffff');
                rarityText.setStyle({ color: rarityColor, fontSize: '14px' });
            });
            
            card.on('pointerout', () => {
                cardBorder.setStrokeStyle(2, borderColor);
                categoryText.setColor('#dddddd');
                rarityText.setStyle({ color: rarityColor, fontSize: '13px' });
            });
            
            // Add click event
            card.on('pointerdown', () => {
                // Find the card record in our tracking array
                const cardRecord = this.upgradeElements.weaponCards.find(c => c.upgrade.id === upgrade.id);
                
                // Skip if already purchased
                if (cardRecord && cardRecord.purchased) {
                    // Show feedback that it's already purchased
                    this.showFloatingText(card.x, card.y, 'Already purchased!', '#88ff88');
                    return;
                }
                
                // Check if player can afford it before visual feedback
                const player = this.playerRef;
                if (player && player.credits < upgrade.price) {
                    this.showFloatingText(card.x, card.y, 'Not enough credits!', '#ff5555');
                    return;
                }
                
                // Visual feedback for click
                this.tweens.add({
                    targets: card,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 50,
                    yoyo: true,
                    onComplete: () => {
                        // Notify the ShopManager to handle the purchase
                        if (this.shopManager) {
                            // Call the shopManager's purchaseWeaponUpgrade method directly
                            const purchaseSuccess = this.shopManager.purchaseWeaponUpgrade(upgrade);
                            
                            // The event handling for success/failure will be handled by separate methods
                            if (this.scene.isDev) {
                                console.debug('Weapon upgrade purchase attempt:', 
                                    purchaseSuccess ? 'SUCCESS' : 'FAILED', 
                                    upgrade.name, 
                                    upgrade.price);
                            }
                        }
                    }
                });
            });
            
            // Add card to main container and tracking list
            container.add(card);
            this.upgradeElements.weaponCards.push({
                container: card,
                upgrade: upgrade,
                purchased: false
            });
        });
    }

    /**
     * Create player upgrade buttons - vertically stacked on right side
     * @param {Phaser.GameObjects.Container} container - Main container to add elements to
     * @param {Array} playerUpgrades - Array of player upgrade options
     * @param {number} startY - Y position to start placing upgrades
     */
    createPlayerUpgrades(container, playerUpgrades, startY) {
        // Clear any existing player upgrade buttons
        this.upgradeElements.playerButtons = [];
        
        // Define button dimensions to match reference image
        const buttonWidth = 160;
        const buttonHeight = 40;
        const spacing = 15;
        
        // Calculate starting position - right side of weapon cards
        const rightSideX = this.shopWidth * 0.3; // Right side position
        
        // Use the provided player upgrades or empty array if none
        const upgrades = playerUpgrades || [];
        
        // Create player upgrade buttons - stacked vertically
        upgrades.forEach((upgrade, index) => {
            // Calculate vertical position with proper spacing
            // Move buttons 50px higher by subtracting 55 from the y position
            const y = startY - 55 + (index * (buttonHeight + spacing));
            
            // Create button container
            const button = this.add.container(rightSideX, y);
            
            // Get visual properties from upgrade or use defaults
            const fillColor = upgrade.visualProperties?.fillColor || 0x221111;
            const borderColor = upgrade.visualProperties?.borderColor || 0xaa6666;
            
            // Create button background with colored border
            const btnBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, fillColor, 0.6);
            const btnBorder = this.add.rectangle(0, 0, buttonWidth, buttonHeight);
            btnBorder.setStrokeStyle(2, borderColor);
            btnBg.setOrigin(0.5);
            btnBorder.setOrigin(0.5);
            
            // Create button text
            const nameText = this.add.text(0, 0, upgrade.name, {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0.5);
            
            // Create price text on the right side of the button
            const priceText = this.add.text(buttonWidth/2 - 10, 0, `$${upgrade.price}`, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: '#ffcc44',
                fontStyle: 'bold'
            }).setOrigin(1, 0.5);
            
            // Add elements to button container
            button.add([btnBg, btnBorder, nameText, priceText]);
            
            // Make button interactive 
            btnBg.setInteractive({ 
                useHandCursor: true
            });
            
            // Create tooltip for upgrade description (initially hidden)
            const tooltipWidth = 200;
            const tooltipHeight = 80;
            const tooltipPadding = 10;
            
            // Create tooltip container that will be shown on hover
            const tooltip = this.add.container(buttonWidth/2 + 10, 0).setVisible(false);
            button.add(tooltip);
            
            // Create tooltip background with colored border to match upgrade
            const tooltipBg = this.add.rectangle(0, 0, tooltipWidth, tooltipHeight, 0x000000, 0.8);
            tooltipBg.setStrokeStyle(2, borderColor);
            tooltipBg.setOrigin(0, 0.5);
            tooltip.add(tooltipBg);
            
            // Create tooltip text
            const tooltipText = this.add.text(
                tooltipPadding, 
                0, 
                upgrade.description, 
                {
                    fontFamily: 'Arial',
                    fontSize: '13px',
                    color: '#ffffff',
                    wordWrap: { width: tooltipWidth - (tooltipPadding * 2) }
                }
            ).setOrigin(0, 0.5);
            tooltip.add(tooltipText);
            
            // Add hover and click effects
            btnBg.on('pointerover', () => {
                btnBorder.setStrokeStyle(3, borderColor);
                nameText.setColor('#ffffff');
                nameText.setStyle({ fontSize: '15px', fontStyle: 'bold' });
                
                // Show tooltip
                tooltip.setVisible(true);
            });
            
            btnBg.on('pointerout', () => {
                btnBorder.setStrokeStyle(2, borderColor);
                nameText.setColor('#dddddd');
                nameText.setStyle({ fontSize: '14px', fontStyle: 'bold' });
                
                // Hide tooltip
                tooltip.setVisible(false);
            });
            
            // Add click event with visual feedback
            btnBg.on('pointerdown', () => {
                // Find the button record in our tracking array
                const buttonRecord = this.upgradeElements.playerButtons.find(b => b.upgrade.id === upgrade.id);
                
                // Skip if already purchased
                if (buttonRecord && buttonRecord.purchased) {
                    // Show feedback that it's already purchased
                    this.showFloatingText(button.x, button.y, 'Already purchased!', '#88ff88');
                    return;
                }
                
                // Check if player can afford it before visual feedback
                const player = this.playerRef;
                if (player && player.credits < upgrade.price) {
                    this.showFloatingText(button.x, button.y, 'Not enough credits!', '#ff5555');
                    return;
                }
                
                // Visual feedback for click
                this.tweens.add({
                    targets: button,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 50,
                    yoyo: true,
                    onComplete: () => {
                        // Notify the ShopManager to handle the purchase
                        if (this.shopManager) {
                            // Call the shopManager's purchasePlayerUpgrade method directly
                            const purchaseSuccess = this.shopManager.purchasePlayerUpgrade(upgrade);
                            
                            // The event handling for success/failure will be handled by separate methods
                            if (this.scene.isDev) {
                                console.debug('Player upgrade purchase attempt:', 
                                    purchaseSuccess ? 'SUCCESS' : 'FAILED', 
                                    upgrade.name, 
                                    upgrade.price);
                            }
                        }
                    }
                });
            });
            
            // Add button to container and tracking list
            container.add(button);
            this.upgradeElements.playerButtons.push({
                container: button,
                upgrade: upgrade,
                purchased: false,
                tooltip: tooltip
            });
        });
    }

    /**
     * Creates stat panels to display player and weapon statistics
     * @param {Phaser.GameObjects.Container} container - Main container to add elements to
     * @param {number} lowerSectionY - Y position to start placing stat panels
     */
    createStatPanels(container, lowerSectionY) {
        // Clear any existing stat panels
        this.upgradeElements.statPanels = [];
        
        const panelWidth = 220;
        const panelHeight = 180;
        const cardWidth = 160; // Width of a weapon upgrade card
        const buttonWidth = 160; // Width of player upgrade buttons
        const textPadding = 20; // Padding for text inside panels
        
        // Apply 60px vertical offset to move panels up
        const verticalOffset = -60;
        const adjustedY = lowerSectionY + verticalOffset;
        
        // Calculate positions that align with weapon cards and player upgrade buttons
        // For weapon stats - align left edge with the left edge of the first weapon upgrade card
        const firstCardX = -this.shopWidth * 0.3; // X coordinate of first weapon card (center)
        const weaponPanelX = firstCardX - cardWidth/2 + panelWidth/2; // Align left edges
        
        // For player stats - align right edge with the right edge of player upgrade buttons
        const playerButtonX = this.shopWidth * 0.3; // X coordinate of player upgrade buttons (center)
        const playerPanelX = playerButtonX + buttonWidth/2 - panelWidth/2; // Align right edges
        
        // Create weapon stats panel - positioned directly underneath the weapon cards but moved up by 60px
        const weaponPanel = this.add.graphics();
        weaponPanel.fillStyle(0x222222, 0.8);
        weaponPanel.fillRoundedRect(weaponPanelX - panelWidth/2, adjustedY, panelWidth, panelHeight, 8);
        weaponPanel.lineStyle(2, 0xaa4f4f);
        weaponPanel.strokeRoundedRect(weaponPanelX - panelWidth/2, adjustedY, panelWidth, panelHeight, 8);
        
        // Weapon stats title - reduced spacing between title and content
        const weaponTitle = this.add.text(
            weaponPanelX, 
            adjustedY + 10, 
            'WEAPON STATS', 
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
                backgroundColor: '#222222',
                padding: { x: 3, y: 3 }
            }
        ).setOrigin(0.5, 0.5);
        
        // Weapon stats text - positioned with proper alignment and padding, reduced line spacing
        const weaponStatsText = this.add.text(
            weaponPanelX - panelWidth/2 + textPadding, 
            adjustedY + 30,
            'Damage: 10\nRate: 5/sec\nRange: 300\nSpeed: 400\nCrit: 5%', 
            {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff',
                lineSpacing: 6, // Reduced for more compact display
                padding: { x: 2, y: 2 }
            }
        );

        // Create player stats panel - aligned under player upgrade buttons but moved up by 60px
        const playerPanel = this.add.graphics();
        playerPanel.fillStyle(0x222222, 0.8);
        playerPanel.fillRoundedRect(playerPanelX - panelWidth/2, adjustedY, panelWidth, panelHeight, 8);
        playerPanel.lineStyle(2, 0x4a6fa5);
        playerPanel.strokeRoundedRect(playerPanelX - panelWidth/2, adjustedY, panelWidth, panelHeight, 8);
        
        // Player stats title - centered over the panel
        const playerTitle = this.add.text(
            playerPanelX, 
            adjustedY + 10,
            'PLAYER STATS', 
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
                backgroundColor: '#222222',
                padding: { x: 3, y: 3 }
            }
        ).setOrigin(0.5, 0.5);
        
        // Player stats text
        const playerStatsText = this.add.text(
            playerPanelX - panelWidth/2 + textPadding, 
            adjustedY + 30,
            'Health: 100\nArmor: 10\nSpeed: 150\nXP: 300\nLevel: 3', 
            {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff',
                lineSpacing: 6,
                padding: { x: 2, y: 2 }
            }
        );

        // Add subtle shadow to improve text readability
        weaponStatsText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
        playerStatsText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
        
        // Add separator lines between stat entries
        const weaponSeparator = this.add.graphics();
        weaponSeparator.lineStyle(1, 0x444444, 0.7);
        for (let i = 1; i < 5; i++) {
            weaponSeparator.lineBetween(
                weaponPanelX - panelWidth/2 + 10, 
                adjustedY + 30 + (i * 20),
                weaponPanelX + panelWidth/2 - 10, 
                adjustedY + 30 + (i * 20)
            );
        }
        
        const playerSeparator = this.add.graphics();
        playerSeparator.lineStyle(1, 0x444444, 0.7);
        for (let i = 1; i < 5; i++) {
            playerSeparator.lineBetween(
                playerPanelX - panelWidth/2 + 10, 
                adjustedY + 30 + (i * 20),
                playerPanelX + panelWidth/2 - 10, 
                adjustedY + 30 + (i * 20)
            );
        }

        // Add panels to our tracking array
        this.upgradeElements.statPanels.push({
            type: 'weapon',
            graphics: weaponPanel,
            title: weaponTitle,
            statsText: weaponStatsText,
            separator: weaponSeparator
        });
        
        this.upgradeElements.statPanels.push({
            type: 'player',
            graphics: playerPanel,
            title: playerTitle,
            statsText: playerStatsText,
            separator: playerSeparator
        });

        // Add all these elements to our container
        container.add([
            weaponPanel, weaponTitle, weaponStatsText, weaponSeparator,
            playerPanel, playerTitle, playerStatsText, playerSeparator
        ]);
    }

    /**
     * Create bottom buttons for reroll and next wave
     * @param {Phaser.GameObjects.Container} container - Main container to add elements to
     * @param {number} buttonY - Y position for the buttons
     */
    createBottomButtons(container, buttonY) {
        // Calculate button positions
        const buttonSpacing = 100;
        
        // Create reroll button (green button on left)
        const rerollContainer = this.add.container(-buttonSpacing, buttonY);
        const rerollBg = this.add.rectangle(0, 0, 100, 36, 0x2a4d2a);
        rerollBg.setStrokeStyle(2, 0x44aa44);
        
        const rerollText = this.add.text(0, 0, 'Reroll', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        rerollContainer.add([rerollBg, rerollText]);
        
        // Make reroll button interactive
        rerollBg.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        rerollBg.on('pointerover', () => {
            rerollBg.setFillStyle(0x3a5d3a);
        });
        
        rerollBg.on('pointerout', () => {
            rerollBg.setFillStyle(0x2a4d2a);
        });
        
        rerollBg.on('pointerdown', () => {
            this.tweens.add({
                targets: rerollBg,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    if (this.shopManager) {
                        this.shopManager.handleReroll();
                    }
                }
            });
        });
        
        // Create next wave button (green button on right)
        const nextWaveContainer = this.add.container(buttonSpacing, buttonY);
        const nextWaveBg = this.add.rectangle(0, 0, 150, 36, 0x2a4d2a);
        nextWaveBg.setStrokeStyle(2, 0x44aa44);
        
        const nextWaveText = this.add.text(0, 0, 'Start Next Wave', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        nextWaveContainer.add([nextWaveBg, nextWaveText]);
        
        // Make next wave button interactive
        nextWaveBg.setInteractive({ useHandCursor: true });
        
        // Add hover and click effects
        nextWaveBg.on('pointerover', () => {
            nextWaveBg.setFillStyle(0x3a5d3a);
        });
        
        nextWaveBg.on('pointerout', () => {
            nextWaveBg.setFillStyle(0x2a4d2a);
        });
        
        nextWaveBg.on('pointerdown', () => {
            this.tweens.add({
                targets: nextWaveBg,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    this.closeShop();
                }
            });
        });
        
        // Add buttons to main container
        container.add(rerollContainer);
        container.add(nextWaveContainer);
        
        // Store references
        this.rerollButton = { container: rerollContainer, background: rerollBg, text: rerollText };
        this.nextWaveButton = { container: nextWaveContainer, background: nextWaveBg, text: nextWaveText };
    }

    /**
     * Updates the stat panels with current player and weapon stats
     */
    updateStatPanels() {
        if (!this.upgradeElements.statPanels || this.upgradeElements.statPanels.length === 0) return;
        
        // Get actual player reference and properly access stats
        const player = this.playerRef;
        if (!player) return;
        
        // Get health from player's health system
        // Check both possible locations for the playerHealth instance
        let health, maxHealth;
        
        if (player.scene && player.scene.playerHealth) {
            // Use the proper PlayerHealth instance methods
            health = player.scene.playerHealth.getCurrentHealth();
            maxHealth = player.scene.playerHealth.getMaxHealth();
        } else if (player.healthSystem) {
            health = player.healthSystem.getCurrentHealth();
            maxHealth = player.healthSystem.getMaxHealth();
        } else {
            // Fallback to direct properties
            health = player.health || 100;
            maxHealth = player.maxHealth || 100;
        }
        
        // Get defense/damage resistance from health system
        let defense;
        if (player.scene && player.scene.playerHealth) {
            defense = Math.round(player.scene.playerHealth.getDamageResistance() * 100);
        } else if (player.healthSystem) {
            defense = Math.round(player.healthSystem.getDamageResistance() * 100);
        } else {
            defense = Math.round(player.defense || 0);
        }
        
        // Get player credits/cash - check multiple possible sources
        let cash = 0;
        if (player.credits !== undefined) {
            cash = player.credits;
        } else if (this.gameScene?.cashManager?.cash !== undefined) {
            cash = this.gameScene.cashManager.cash;
        } else if (this.shopManager?.playerCredits !== undefined) {
            cash = this.shopManager.playerCredits;
        }
        
        // Get XP manager from game scene with better fallbacks
        let currentLevel = 1;
        let currentXP = 0;
        let nextLevelXP = 100;
        
        if (this.gameScene?.xpManager) {
            currentLevel = this.gameScene.xpManager.currentLevel || 1;
            currentXP = this.gameScene.xpManager.currentXP || 0;
            nextLevelXP = this.gameScene.xpManager.nextLevelXP || 100;
        } else if (player.level !== undefined) {
            currentLevel = player.level;
            currentXP = player.xp || 0;
            nextLevelXP = player.nextLevelXP || 100;
        }
        
        // Get movement speed
        const speed = Math.round(player.speed || 150);
        
        // Get weapon stats - Look for proper weapon stats from various possible locations
        let bulletDamage, fireRate, bulletRange, bulletSpeed, criticalHitChance, criticalDamageMultiplier;
        
        // Check for WeaponManager first (most accurate source if it exists)
        if (player.weaponManager) {
            // Get stats directly from weapon manager using getStats() method
            const weaponStats = player.weaponManager.getStats();
            
            bulletDamage = Math.round(weaponStats?.damage || player.bulletDamage || 10);
            fireRate = Math.round(weaponStats?.fireRate ? (1000 / weaponStats.fireRate) : (player.fireRate ? (1000 / player.fireRate) : 3));
            bulletRange = Math.round(weaponStats?.range || player.bulletRange || 400);
            bulletSpeed = Math.round(weaponStats?.speed || player.bulletSpeed || 600);
            criticalHitChance = Math.round(weaponStats?.criticalChance || player.criticalHitChance || 5);
            criticalDamageMultiplier = (weaponStats?.criticalDamage || player.criticalDamageMultiplier || 1.5).toFixed(1);
        } else {
            // Fallback to direct properties on player
            bulletDamage = Math.round(player.bulletDamage || 10);
            fireRate = Math.round(player.fireRate ? (1000 / player.fireRate) : 3);  // Convert ms delay to shots per second
            bulletRange = Math.round(player.bulletRange || 400);
            bulletSpeed = Math.round(player.bulletSpeed || 600);
            criticalHitChance = Math.round(player.criticalHitChance || 5);
            criticalDamageMultiplier = (player.criticalDamageMultiplier || 1.5).toFixed(1);
        }
        
        // Format player stats
        const playerStats = [
            `Health: ${Math.round(health)}/${Math.round(maxHealth)}`,
            `Speed: ${speed}`,
            `Defense: ${defense}%`,
            `XP Level: ${currentLevel}`,
            `XP Points: ${currentXP}/${nextLevelXP}`,
            `Cash: $${cash}`
        ].join('\n');
        
        // Format weapon stats
        const weaponStats = [
            `Damage: ${bulletDamage}`,
            `Fire Rate: ${fireRate}/sec`,
            `Range: ${bulletRange}`,
            `Bullet Speed: ${bulletSpeed}`,
            `Critical Hit: ${criticalHitChance}%`,
            `Critical Damage: ${criticalDamageMultiplier}x`
        ].join('\n');
        
        // Update the panel texts
        this.upgradeElements.statPanels.forEach(panel => {
            if (panel.type === 'player') {
                panel.statsText.setText(playerStats);
            } else if (panel.type === 'weapon') {
                panel.statsText.setText(weaponStats);
            }
        });
        
        // Debug output to help identify where values are coming from
        if (this.scene.isDev) {
            console.debug('Stats Panel Update:', {
                playerHealth: { current: health, max: maxHealth },
                playerCredits: cash,
                playerXP: { level: currentLevel, current: currentXP, next: nextLevelXP },
                weaponStats: { damage: bulletDamage, fireRate }
            });
        }
    }

    /**
     * Handle an item being purchased
     * @param {Object} data - Purchase data
     */
    handleItemPurchased(data) {
        // Update panels with new stats
        this.updateStatPanels();

        // Optional: Add visual effect for purchased item
        const { itemType, itemId } = data;
        
        if (itemType === 'weapon') {
            this.upgradeElements.weaponCards.forEach(card => {
                if (card.upgrade.id === itemId) {
                    // Mark as purchased and add visual feedback
                    card.purchased = true;
                    card.container.setAlpha(0.6);
                    
                    // Add a checkmark or "Purchased" text
                    const purchasedText = this.add.text(0, 0, 'Purchased', {
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        fontStyle: 'bold',
                        color: '#88ff88',
                        backgroundColor: '#000000',
                        padding: { x: 4, y: 2 }
                    }).setOrigin(0.5, 0.5);
                    
                    card.container.add(purchasedText);
                }
            });
        } else if (itemType === 'player') {
            this.upgradeElements.playerButtons.forEach(button => {
                if (button.upgrade.id === itemId) {
                    // Mark as purchased and add visual feedback
                    button.purchased = true;
                    button.container.setAlpha(0.6);
                    
                    // Update button text to show it's purchased
                    const checkmark = this.add.text(-70, 0, '✓', {
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        color: '#88ff88'
                    }).setOrigin(0.5);
                    
                    button.container.add(checkmark);
                }
            });
        }
    }

    /**
     * Handle a reroll event - update the shop UI with new upgrade options
     * @param {Object} data - Reroll data with new upgrades
     */
    handleReroll(data) {
        const { newUpgrades, newRerollCost } = data;
        
        // Update reroll button text to show new cost if available
        if (this.rerollButton && newRerollCost !== undefined) {
            this.rerollButton.text.setText(`Reroll ($${newRerollCost})`);
        }
        
        // Clear existing upgrade elements
        this.clearUpgradeElements();
        
        // Get the main container
        const mainContainer = this.shopOverlay.getAt(1); // The main container is the second child of shopOverlay
        
        if (mainContainer) {
            // Layout constants - same as in createShopUI
            const upperSectionY = -this.shopHeight * 0.25;
            
            // Recreate the upgrade elements with the new options
            this.createWeaponUpgrades(mainContainer, newUpgrades.weaponUpgrades, upperSectionY);
            this.createPlayerUpgrades(mainContainer, newUpgrades.playerUpgrades, upperSectionY);
            
            // Update the stats panels
            this.updateStatPanels();
            
            // Play a refresh animation
            this.tweens.add({
                targets: mainContainer,
                scaleX: { from: 0.95, to: 1 },
                scaleY: { from: 0.95, to: 1 },
                duration: 200,
                ease: 'Back.easeOut'
            });
        }
    }
    
    /**
     * Clear all upgrade elements for rerolling
     */
    clearUpgradeElements() {
        // Remove all weapon cards 
        this.upgradeElements.weaponCards.forEach(card => {
            if (card.container && card.container.active) {
                card.container.destroy();
            }
        });
        this.upgradeElements.weaponCards = [];
        
        // Remove all player buttons
        this.upgradeElements.playerButtons.forEach(button => {
            if (button.container && button.container.active) {
                button.container.destroy();
            }
        });
        this.upgradeElements.playerButtons = [];
    }
    
    /**
     * Handle a purchase failure
     * @param {Object} data - Failure data
     */
    handlePurchaseFailed(data) {
        const { reason } = data;
        
        // Display message based on the reason
        let message = 'Purchase failed';
        
        if (reason === 'insufficient-funds') {
            message = 'Not enough credits!';
        }
        
        // Create failure message
        const errorText = this.add.text(0, -100, message, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        
        // Add to the shop overlay
        if (this.shopOverlay) {
            this.shopOverlay.add(errorText);
        }
        
        // Fade out after delay
        this.tweens.add({
            targets: errorText,
            alpha: { from: 1, to: 0 },
            y: '-=50',
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                errorText.destroy();
            }
        });
        
        // Play error sound if available
        if (this.sound && this.sound.add) {
            // Play a basic sound for now as fallback
            this.sound.play('shoot_minigun', { volume: 0.3, detune: 1200 });
        }
    }
    
    /**
     * Handle a reroll failure
     * @param {Object} data - Failure data
     */
    handleRerollFailed(data) {
        const { reason } = data;
        
        // Display message based on the reason
        let message = 'Reroll failed';
        
        if (reason === 'insufficient-funds') {
            message = 'Not enough credits for reroll!';
        }
        
        // Create failure message - same as purchase failure but with different positioning
        const errorText = this.add.text(0, 0, message, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        
        // Position near reroll button
        if (this.rerollButton && this.rerollButton.container) {
            errorText.x = this.rerollButton.container.x;
            errorText.y = this.rerollButton.container.y - 30;
        }
        
        // Add to the shop overlay
        if (this.shopOverlay) {
            this.shopOverlay.add(errorText);
        }
        
        // Fade out after delay
        this.tweens.add({
            targets: errorText,
            alpha: { from: 1, to: 0 },
            y: '-=30',
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                errorText.destroy();
            }
        });
        
        // Play error sound if available
        if (this.sound && this.sound.add) {
            // Play a basic sound for now as fallback
            this.sound.play('shoot_minigun', { volume: 0.3, detune: 1200 });
        }
    }

    /**
     * Close the shop and return to the main game
     */
    closeShop() {
        // Notify the parent scene that shop is closing
        if (this.shopManager) {
            this.shopManager.onNextWaveStart();
        }

        // Animation for closing
        this.tweens.add({
            targets: this.shopOverlay,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Return to the main game
                this.scene.stop('ShopMenu');
                this.scene.resume('WaveGame');
            }
        });
    }

    /**
     * Clean up resources when scene is destroyed
     */
    cleanup() {
        // Remove event listeners
        EventBus.off('shop-item-purchased', this.handleItemPurchased);
        EventBus.off('shop-rerolled', this.handleReroll);
        EventBus.off('shop-purchase-failed', this.handlePurchaseFailed);
        EventBus.off('shop-reroll-failed', this.handleRerollFailed);
        
        // Clear references
        this.upgradeElements = {
            weaponCards: [],
            playerButtons: [],
            statPanels: []
        };
    }

    /**
     * Show a floating text message at a specific position
     * @param {number} x - X position for the floating text
     * @param {number} y - Y position for the floating text
     * @param {string} message - Message to display
     * @param {string} color - Text color (hex)
     */
    showFloatingText(x, y, message, color = '#ffffff') {
        // Get the main container to get the correct position in the shop
        const mainContainer = this.shopOverlay.getAt(1);
        
        if (!mainContainer) return;
        
        // Convert position to world space
        const worldX = mainContainer.x + x;
        const worldY = mainContainer.y + y;
        
        // Create the floating text with proper styling
        const floatingText = this.add.text(worldX, worldY - 20, message, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5).setDepth(200);
        
        // Add to shop overlay to ensure proper layering
        this.shopOverlay.add(floatingText);
        
        // Animate the text floating upward and fading out
        this.tweens.add({
            targets: floatingText,
            y: worldY - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }
}

