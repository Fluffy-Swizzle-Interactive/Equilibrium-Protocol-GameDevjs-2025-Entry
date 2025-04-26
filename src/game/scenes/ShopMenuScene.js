import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { RARITY } from '../constants/WeaponUpgrades';
import { ButtonSoundHelper } from '../utils/ButtonSoundHelper';

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

        // Setup button sound listener
        this.cleanupButtonSounds = ButtonSoundHelper.setupButtonSounds(this);
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

        // Listen for skill points updates
        EventBus.on('skill-points-updated', this.updateStatPanels, this);
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
     * Calculate the actual value of an upgrade stat with scaling
     * @param {Object} upgrade - The upgrade object
     * @param {string} statKey - The stat key to calculate
     * @returns {string} - Formatted string with the calculated value
     */
    calculateUpgradeValue(upgrade, statKey) {
        if (!upgrade || !upgrade.stats || !upgrade.stats[statKey]) {
            return '';
        }

        const value = upgrade.stats[statKey];
        const rarityMultiplier = upgrade.rarity?.multiplier || 1.0;

        // Different formatting based on stat type
        switch (statKey) {
            case 'damage':
            case 'bulletRange':
            case 'bulletSpeed':
                // These are multiplicative stats (e.g., 1.1 = +10%)
                if (value > 1) {
                    // Calculate the actual percentage with rarity scaling
                    const baseBonus = (value - 1) * 100; // Convert to percentage
                    const scaledBonus = baseBonus * rarityMultiplier;
                    return `+${Math.round(scaledBonus)}%`;
                }
                return '';

            case 'fireRate':
                // FireRate is inverted (lower is better)
                // For values < 1, it's a direct percentage improvement
                // For values > 1, we need to invert the calculation to show the correct bonus
                let baseBonus;
                if (value < 1) {
                    baseBonus = (1 - value) * 100; // Convert to percentage
                } else {
                    // For values > 1, we need to show the equivalent percentage improvement
                    // when dividing instead of multiplying
                    baseBonus = ((value - 1) / value) * 100;
                }
                const scaledBonus = baseBonus * rarityMultiplier;
                return `+${Math.round(scaledBonus)}%`;

            case 'bulletPierce':
            case 'criticalChance':
            case 'aoeRadius':
            case 'aoeDamage':
            case 'droneCount':
                // These are additive stats
                const scaledValue = value * rarityMultiplier;
                if (statKey === 'criticalChance') {
                    return `+${Math.round(scaledValue)}%`;
                } else if (statKey === 'bulletPierce') {
                    return `+${Math.round(scaledValue)}`;
                } else if (statKey === 'aoeDamage') {
                    return `${Math.round(scaledValue * 100)}%`;
                } else if (statKey === 'droneCount') {
                    // Always return +1 for drone count regardless of rarity
                    return `+1`;
                } else {
                    return `${Math.round(scaledValue)}`;
                }

            case 'criticalDamageMultiplier':
                // This is an additive bonus to the multiplier
                const scaledMultiplier = value * rarityMultiplier;
                return `+${(scaledMultiplier).toFixed(1)}x`;

            default:
                return '';
        }
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

            // Set background color based on rarity
            let fillColor, borderColor;

            // Determine colors based on rarity
            switch(upgrade.rarity?.name) {
                case 'Legendary':
                    fillColor = 0x332200; // Gold background
                    borderColor = 0xffaa00; // Gold border
                    break;
                case 'Epic':
                    fillColor = 0x220033; // Purple background
                    borderColor = 0xaa44ff; // Purple border
                    break;
                case 'Rare':
                    fillColor = 0x001133; // Blue background
                    borderColor = 0x4488ff; // Blue border
                    break;
                case 'Common':
                default:
                    fillColor = 0x113300; // Green background
                    borderColor = 0x44aa44; // Green border
                    break;
            }

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

            // Get the main stat key and value from the upgrade
            let mainStatKey = '';
            let effectsString = '';

            // Determine the main stat based on category
            switch (upgrade.category) {
                case 'Damage':
                    mainStatKey = 'damage';
                    break;
                case 'Fire Rate':
                    mainStatKey = 'fireRate';
                    break;
                case 'Range':
                    mainStatKey = 'bulletRange';
                    break;
                case 'Pierce':
                    mainStatKey = 'bulletPierce';
                    break;
                case 'Area of Effect':
                    mainStatKey = 'aoeRadius';
                    break;
                case 'Critical':
                    mainStatKey = upgrade.stats.criticalChance ? 'criticalChance' : 'criticalDamageMultiplier';
                    break;
                case 'Projectile':
                    mainStatKey = 'bulletSpeed';
                    break;
                case 'Drone':
                    // For drone upgrades, always show +1 Combat Drone
                    if (upgrade.stats.droneCount) {
                        effectsString = `+1 Combat Drone`;
                    } else {
                        effectsString = 'Combat Drone';
                    }
                    break;
                default:
                    // For other categories, use the original effects text
                    effectsString = upgrade.effects;
            }

            // Calculate the actual value if we have a main stat key
            if (mainStatKey && upgrade.stats[mainStatKey]) {
                const calculatedValue = this.calculateUpgradeValue(upgrade, mainStatKey);
                effectsString = `${calculatedValue} ${upgrade.category}`;
            }

            // Add effects text with reduced spacing - without the "Effects:" prefix
            const effectsText = this.add.text(0, -cardHeight/2 + 100,
                effectsString, {
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
                // Emit shop upgrade sound for weapon upgrades
                EventBus.emit('shop-upgrade-click', {
                    volume: 0.6,
                    detune: -100,
                    rate: 1.1
                });

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
        const buttonWidth = 200; // Increased from 160 to 200
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

            // Set background color based on rarity
            let fillColor, borderColor;

            // Determine colors based on rarity
            switch(upgrade.rarity?.name) {
                case 'Legendary':
                    fillColor = 0x332200; // Gold background
                    borderColor = 0xffaa00; // Gold border
                    break;
                case 'Epic':
                    fillColor = 0x220033; // Purple background
                    borderColor = 0xaa44ff; // Purple border
                    break;
                case 'Rare':
                    fillColor = 0x001133; // Blue background
                    borderColor = 0x4488ff; // Blue border
                    break;
                case 'Common':
                default:
                    fillColor = 0x113300; // Green background
                    borderColor = 0x44aa44; // Green border
                    break;
            }

            // Create button background with colored border
            const btnBg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, fillColor, 0.6);
            const btnBorder = this.add.rectangle(0, 0, buttonWidth, buttonHeight);
            btnBorder.setStrokeStyle(2, borderColor);
            btnBg.setOrigin(0.5);
            btnBorder.setOrigin(0.5);

            // Create button text - positioned closer to the left border
            const nameText = this.add.text(-buttonWidth/2 + 10, 0, upgrade.name, {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5); // Left-aligned with small padding

            // Create skill point cost text on the right side of the button
            const priceText = this.add.text(buttonWidth/2 - 10, 0, `${upgrade.skillPointCost} SP`, {
                fontFamily: 'Arial',
                fontSize: '13px',
                color: '#44ccff', // Blue color for skill points
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

            // Create tooltip container that will be shown on hover - position to the left of the button
            const tooltip = this.add.container(-buttonWidth/2 - tooltipWidth/2 - 10, 0).setVisible(false);
            button.add(tooltip);

            // Create tooltip background with colored border to match rarity
            const tooltipBg = this.add.rectangle(0, 0, tooltipWidth, tooltipHeight, 0x000000, 0.8);
            tooltipBg.setStrokeStyle(2, borderColor);
            tooltipBg.setOrigin(0.5, 0.5); // Center origin for left positioning
            tooltip.add(tooltipBg);

            // Create tooltip text - centered in the tooltip background
            const tooltipText = this.add.text(
                0,
                0,
                upgrade.description,
                {
                    fontFamily: 'Arial',
                    fontSize: '13px',
                    color: '#ffffff',
                    wordWrap: { width: tooltipWidth - (tooltipPadding * 2) },
                    align: 'center'
                }
            ).setOrigin(0.5, 0.5);
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
                // Emit shop upgrade sound for player upgrades
                EventBus.emit('shop-upgrade-click', {
                    volume: 0.6,
                    detune: -100,
                    rate: 1.1
                });

                // Find the button record in our tracking array
                const buttonRecord = this.upgradeElements.playerButtons.find(b => b.upgrade.id === upgrade.id);

                // Skip if already purchased
                if (buttonRecord && buttonRecord.purchased) {
                    // Show feedback that it's already purchased
                    this.showFloatingText(button.x, button.y, 'Already purchased!', '#88ff88');
                    return;
                }

                // Check if player has enough skill points before visual feedback
                const player = this.playerRef;
                if (player && player.skillPoints < upgrade.skillPointCost) {
                    this.showFloatingText(button.x, button.y, 'Not enough skill points!', '#ff5555');
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
                                    upgrade.skillPointCost);
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
        const panelHeight = 185; // Increased by 5px for more space at the bottom
        const cardWidth = 160; // Width of a weapon upgrade card
        const buttonWidth = 200; // Width of player upgrade buttons
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
        // Create with placeholder text that will be immediately replaced by updateStatPanels
        const weaponStatsText = this.add.text(
            weaponPanelX - panelWidth/2 + textPadding,
            adjustedY + 30,
            'Loading weapon stats...',
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

        // Player stats text - create with placeholder text that will be immediately replaced by updateStatPanels
        const playerStatsText = this.add.text(
            playerPanelX - panelWidth/2 + textPadding,
            adjustedY + 30,
            'Loading player stats...',
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

        // Add panels to our tracking array
        this.upgradeElements.statPanels.push({
            type: 'weapon',
            graphics: weaponPanel,
            title: weaponTitle,
            statsText: weaponStatsText
        });

        this.upgradeElements.statPanels.push({
            type: 'player',
            graphics: playerPanel,
            title: playerTitle,
            statsText: playerStatsText
        });

        // Add all these elements to our container
        container.add([
            weaponPanel, weaponTitle, weaponStatsText,
            playerPanel, playerTitle, playerStatsText
        ]);
    }

    /**
     * Create bottom buttons for reroll and next wave
     * @param {Phaser.GameObjects.Container} container - Main container to add elements to
     * @param {number} buttonY - Y position for the buttons
     */
    createBottomButtons(container, buttonY) {
        // Calculate button positions
        const buttonSpacing = 130; // Increased from 100 to 130 to accommodate wider reroll button

        // Create reroll button (green button on left)
        const rerollContainer = this.add.container(-buttonSpacing, buttonY);
        const rerollBg = this.add.rectangle(0, 0, 180, 36, 0x2a4d2a); // Increased width from 120 to 180
        rerollBg.setStrokeStyle(2, 0x44aa44);

        // Get the initial reroll cost from the shop manager
        const initialRerollCost = this.shopManager ? this.shopManager.upgradeManager.getRerollCost() : 0;
        const initialRerollCount = this.shopManager ? this.shopManager.upgradeManager.rerollCount : 0;
        const rerollsRemaining = this.shopManager ?
            this.shopManager.upgradeManager.maxRerollsPerRound - initialRerollCount : 5;

        const costText = initialRerollCost === 0 ? 'Free Reroll' : `Reroll ($${initialRerollCost})`;
        const rerollButtonText = `${costText} [${rerollsRemaining}/${this.shopManager?.upgradeManager.maxRerollsPerRound || 5}]`;

        const rerollText = this.add.text(0, 0, rerollButtonText, {
            fontFamily: 'Arial',
            fontSize: '14px', // Reduced from 16px to 14px for better fit
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        rerollContainer.add([rerollBg, rerollText]);

        // Store reference to reroll button for later use
        this.rerollButton = {
            container: rerollContainer,
            bg: rerollBg,
            text: rerollText
        };

        // Check if reroll limit is already reached
        const isRerollLimitReached = rerollsRemaining <= 0;

        // Make reroll button interactive (unless limit is reached)
        if (!isRerollLimitReached) {
            rerollBg.setInteractive({ useHandCursor: true });

            // Add hover and click effects
            rerollBg.on('pointerover', () => {
                rerollBg.setFillStyle(0x3a5d3a);
            });

            rerollBg.on('pointerout', () => {
                rerollBg.setFillStyle(0x2a4d2a);
            });
        } else {
            // Gray out the button if limit is reached
            rerollBg.setFillStyle(0x555555);
            rerollText.setColor('#999999');
        }

        // Only add click handler if the button is interactive
        if (!isRerollLimitReached) {
            rerollBg.on('pointerdown', () => {
                // Emit shop upgrade sound for reroll button (same as upgrade buttons)
                EventBus.emit('shop-upgrade-click', {
                    volume: 0.6,
                    detune: -100,
                    rate: 1.1
                });

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
        }

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
            // Emit button click event for sound
            EventBus.emit('button-click', {
                volume: 0.6,
                detune: -200, // Pitch down slightly
                rate: 1.2 // Speed up slightly
            });

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

        // Store reference to next wave button
        this.nextWaveButton = { container: nextWaveContainer, bg: nextWaveBg, text: nextWaveText };
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
            // Ensure we're getting the raw damageResistance value and converting it to percentage
            const resistanceDecimal = player.scene.playerHealth.getDamageResistance();
            defense = Math.round(resistanceDecimal * 100);

            if (this.scene.isDev) {
                console.debug('Defense from playerHealth:', {
                    raw: resistanceDecimal,
                    percent: defense
                });
            }
        } else if (player.healthSystem) {
            // Ensure we're getting the raw damageResistance value and converting it to percentage
            const resistanceDecimal = player.healthSystem.getDamageResistance();
            defense = Math.round(resistanceDecimal * 100);

            if (this.scene.isDev) {
                console.debug('Defense from healthSystem:', {
                    raw: resistanceDecimal,
                    percent: defense
                });
            }
        } else {
            defense = Math.round((player.defense || 0) * 100);
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
            // Use getter methods when available, fall back to direct properties
            currentLevel = this.gameScene.xpManager.getCurrentLevel?.() || this.gameScene.xpManager.currentLevel || 1;
            currentXP = this.gameScene.xpManager.getCurrentXP?.() || this.gameScene.xpManager.currentXP || 0;
            nextLevelXP = this.gameScene.xpManager.getXPToNextLevel?.() || this.gameScene.xpManager.nextLevelXP || 100;

            // Debug output to help identify XP values
            if (this.scene.isDev) {
                console.debug('XP Manager values:', {
                    level: currentLevel,
                    currentXP: currentXP,
                    nextLevelXP: nextLevelXP,
                    xpToNextLevel: this.gameScene.xpManager.xpToNextLevel,
                    getXPToNextLevel: this.gameScene.xpManager.getXPToNextLevel?.(),
                    nextLevelXPProperty: this.gameScene.xpManager.nextLevelXP
                });
            }
        } else if (player.level !== undefined) {
            currentLevel = player.level;
            currentXP = player.xp || 0;
            nextLevelXP = player.nextLevelXP || 100;
        }

        // Get movement speed
        const speed = Math.round(player.speed || 150);

        // Get weapon stats - Look for proper weapon stats from various possible locations
        let bulletDamage, fireRate, bulletRange, bulletSpeed, criticalHitChance, criticalDamageMultiplier, bulletPierce;

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
            bulletPierce = weaponStats?.pierce || player.bulletPierce || 1;
        } else {
            // Fallback to direct properties on player
            bulletDamage = Math.round(player.bulletDamage || 10);
            fireRate = Math.round(player.fireRate ? (1000 / player.fireRate) : 3);  // Convert ms delay to shots per second
            bulletRange = Math.round(player.bulletRange || 400);
            bulletSpeed = Math.round(player.bulletSpeed || 600);
            criticalHitChance = Math.round(player.criticalHitChance || 5);
            criticalDamageMultiplier = (player.criticalDamageMultiplier || 1.5).toFixed(1);
            bulletPierce = player.bulletPierce || 1;
        }

        // Get skill points
        const skillPoints = player.skillPoints !== undefined ? player.skillPoints : 0;

        // Format player stats
        const playerStats = [
            `Health: ${Math.round(health)}/${Math.round(maxHealth)}`,
            `Speed: ${speed}`,
            `Defense: ${defense}%`,
            `XP Level: ${currentLevel}`,
            `XP Points: ${currentXP}/${nextLevelXP}`,
            `Skill Points: ${skillPoints}`,
            `Cash: $${cash}`
        ].join('\n');

        // Format weapon stats
        const weaponStats = [
            `Damage: ${bulletDamage}`,
            `Fire Rate: ${fireRate}/sec`,
            `Range: ${bulletRange}`,
            `Bullet Speed: ${bulletSpeed}`,
            `Pierce: ${bulletPierce}`,
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
                playerDefense: defense,
                playerCredits: cash,
                playerXP: { level: currentLevel, current: currentXP, next: nextLevelXP },
                weaponStats: { damage: bulletDamage, fireRate, pierce: bulletPierce }
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
        const { newUpgrades, newRerollCost, rerollsRemaining } = data;

        // Update reroll button text to show new cost if available
        if (this.rerollButton && newRerollCost !== undefined) {
            // Show "Free Reroll" if the cost is 0, otherwise show the cost
            // Also show remaining rerolls
            const costText = newRerollCost === 0 ? 'Free Reroll' : `Reroll ($${newRerollCost})`;
            const buttonText = `${costText} [${rerollsRemaining}/${this.shopManager?.upgradeManager.maxRerollsPerRound || 5}]`;
            this.rerollButton.text.setText(buttonText);

            // Disable the reroll button if no rerolls are remaining
            if (rerollsRemaining <= 0 && this.rerollButton.bg) {
                this.rerollButton.bg.disableInteractive();
                this.rerollButton.bg.setFillStyle(0x555555); // Gray out the button
                this.rerollButton.text.setColor('#999999'); // Gray out the text
            }
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
        } else if (reason === 'insufficient-skill-points') {
            message = 'Not enough skill points!';
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
            this.sound.play('shoot_weapon', { volume: 0.3, detune: 1200 });
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
        } else if (reason === 'reroll-limit-reached') {
            message = 'Maximum rerolls reached for this round!';

            // Disable the reroll button if it exists with all required properties
            if (this.rerollButton && this.rerollButton.bg && this.rerollButton.text) {
                this.rerollButton.bg.disableInteractive();
                this.rerollButton.bg.setFillStyle(0x555555); // Gray out the button
                this.rerollButton.text.setColor('#999999'); // Gray out the text
            }
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
            this.sound.play('shoot_weapon', { volume: 0.3, detune: 1200 });
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
        EventBus.off('skill-points-updated', this.updateStatPanels);

        // Clean up button sound event listeners
        if (this.cleanupButtonSounds) {
            this.cleanupButtonSounds();
        }

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

