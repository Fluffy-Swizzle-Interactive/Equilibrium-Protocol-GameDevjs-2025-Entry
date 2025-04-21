// ShopManager.js

import { EventBus } from '../EventBus';
import UpgradeManager from './UpgradeManager.js';

/**
 * ShopManager class
 * Manages the in-game shop interface for purchasing weapon and player upgrades between waves
 */
export default class ShopManager {
  /**
   * Create a new shop manager
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {Player} player - Reference to the player
   * @param {Object} weapon - Reference to the player's weapon
   * @param {Object} rng - Random number generator
   */
  constructor(scene, player, weapon, rng) {
    this.scene = scene;
    this.player = player;
    this.weapon = weapon;
    this.rng = rng;
    this.upgradeManager = new UpgradeManager(player, weapon, rng);
    this.shopOverlay = null;
    this.isShopOpen = false;
    this.upgradeElements = {
      weaponCards: [],
      playerButtons: [],
      statPanels: []
    };
    
    // Register with scene for easier access
    scene.shopManager = this;
    
    // Bind event handlers to maintain 'this' context
    this.onWaveCompleted = this.onWaveCompleted.bind(this);
    
    // Listen for wave completed events to update the next wave button
    EventBus.on('wave-completed', this.onWaveCompleted);
    
    // Clean up event listeners when scene is destroyed
    this.scene.events.once('shutdown', () => {
      EventBus.off('wave-completed', this.onWaveCompleted);
    });
    
    // For debugging: Log when the shop manager is initialized
    if (scene.isDev) {
      console.debug('ShopManager initialized, listening for wave-completed events');
    }
  }

  /**
   * Handle wave completion event
   * Updates the next wave button text to "Open Shop"
   */
  onWaveCompleted(data) {
    if (!this.scene || !this.scene.uiManager) return;
    
    // For debugging in development mode
    if (this.scene.isDev) {
      console.debug('Wave completed event received in ShopManager', data);
    }
    
    const nextWaveButton = this.scene.uiManager.elements.nextWaveButtonText;
    if (nextWaveButton) {
      nextWaveButton.setText('Open Shop');
      
      // Change the click handler for the next wave button
      const nextWaveBg = this.scene.uiManager.elements.nextWaveButtonBg;
      if (nextWaveBg) {
        // Remove previous listeners
        nextWaveBg.off('pointerdown');
        
        // Add new listener for opening shop
        nextWaveBg.on('pointerdown', () => {
          this.openShop();
        });
      }
      
      // Do the same for the text element
      nextWaveButton.off('pointerdown');
      nextWaveButton.on('pointerdown', () => {
        this.openShop();
      });
      
      // Make the button visible if it's not already
      if (!nextWaveBg.visible) {
        this.scene.uiManager.showNextWaveButton();
      }
    }
  }

  /**
   * Open the shop interface
   */
  openShop() {
    if (this.isShopOpen) return;
    
    this.isShopOpen = true;
    const upgrades = this.upgradeManager.generateUpgrades();
    this.createOverlay(upgrades);
    
    // Pause the game while shop is open
    if (this.scene.setPauseState) {
      this.scene.setPauseState(true, 'shop');
    }
  }

  /**
   * Create the shop overlay with all UI components
   * @param {Object} upgrades - The upgrades to display in the shop
   */
  createOverlay(upgrades) {
    const { width, height } = this.scene.cameras.main;
    
    // Create container for all shop elements
    this.shopOverlay = this.scene.add.container().setScrollFactor(0).setDepth(150);
    
    // Create semi-transparent background overlay
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.8)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(150);
    this.shopOverlay.add(bg);
    
    // Create main shop container with dark background
    const shopWidth = width * 0.9;
    const shopHeight = height * 0.8;
    const mainContainer = this.scene.add.container(width / 2, height / 2);
    const mainBg = this.scene.add.rectangle(0, 0, shopWidth, shopHeight, 0x111111, 0.9);
    mainBg.setOrigin(0.5);
    mainContainer.add(mainBg);
    this.shopOverlay.add(mainContainer);
    
    // Create shop title
    const shopTitle = this.scene.add.text(0, -shopHeight / 2 + 30, 'Shop Page', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    mainContainer.add(shopTitle);
    
    // Layout constants - dividing the shop into sections
    const upperSectionY = -shopHeight * 0.25; // Upper section for weapon/player upgrades
    const lowerSectionY = upperSectionY + 200; // Lower section for stats panels
    const bottomSectionY = shopHeight * 0.35; // Bottom section for buttons
    
    // Create upgrades in the upper section
    this.createWeaponUpgrades(mainContainer, upgrades.weaponUpgrades, shopWidth, shopHeight, upperSectionY);
    this.createPlayerUpgrades(mainContainer, upgrades.playerUpgrades, shopWidth, shopHeight, upperSectionY);
    
    // Create stats panels in the lower section
    this.createStatPanels(mainContainer, shopWidth, shopHeight, lowerSectionY);
    
    // Create bottom buttons
    this.createBottomButtons(mainContainer, shopWidth, shopHeight, bottomSectionY);
    
    // Add animation for the overlay
    this.scene.tweens.add({
      targets: this.shopOverlay,
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Power2'
    });
  }

  /**
   * Creates the main shop UI container and all nested elements
   * @param {number} x - X position for the shop container
   * @param {number} y - Y position for the shop container
   * @returns {Phaser.GameObjects.Container} - The main shop container
   */
  createShopUI(x, y) {
    // Clear previous elements if they exist
    if (this.shopContainer) {
      this.shopContainer.destroy();
      this.upgradeElements = {
        weaponCards: [],
        playerButtons: [],
        statPanels: []
      };
    }

    // Constants for shop dimensions and layout
    const shopWidth = 900;
    const shopHeight = 600;
    const upperSectionHeight = shopHeight * 0.4;
    const lowerSectionY = upperSectionHeight + 20; // Y position where the lower section begins
    
    // Create main container
    this.shopContainer = this.scene.add.container(x, y);
    
    // Create shop background
    const shopBg = this.scene.add.graphics();
    shopBg.fillStyle(0x000000, 0.85);
    shopBg.fillRoundedRect(-shopWidth / 2, -shopHeight / 2, shopWidth, shopHeight, 15);
    shopBg.lineStyle(4, 0x6a4f2d);
    shopBg.strokeRoundedRect(-shopWidth / 2, -shopHeight / 2, shopWidth, shopHeight, 15);
    this.shopContainer.add(shopBg);
    
    // Create shop title
    const titleText = this.scene.add.text(0, -shopHeight / 2 + 20, 'SHOP', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.shopContainer.add(titleText);
    
    // Create close button
    const closeButton = this.scene.add.text(shopWidth / 2 - 50, -shopHeight / 2 + 20, 'X', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerup', () => this.closeShop());
    this.shopContainer.add(closeButton);
    
    // Display player's current cash
    this.cashText = this.scene.add.text(
      -shopWidth / 2 + 30, 
      -shopHeight / 2 + 20, 
      `CASH: ${this.cashManager.getPlayerCash()}$`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffff00',
        fontStyle: 'bold'
      }
    );
    this.shopContainer.add(this.cashText);
    
    // Create sections separator line
    const separator = this.scene.add.graphics();
    separator.lineStyle(2, 0x6a4f2d);
    separator.lineBetween(-shopWidth / 2, -shopHeight / 2 + upperSectionHeight, shopWidth / 2, -shopHeight / 2 + upperSectionHeight);
    this.shopContainer.add(separator);
    
    // Create weapon upgrade cards in the upper section
    this.createWeaponUpgrades(this.shopContainer, shopWidth, upperSectionHeight);
    
    // Create player upgrade buttons in the upper right section
    this.createPlayerUpgrades(this.shopContainer, shopWidth, upperSectionHeight);
    
    // Create stat panels in the lower section, aligned with upper section elements
    this.createStatPanels(this.shopContainer, shopWidth, shopHeight, lowerSectionY - shopHeight / 2);
    
    return this.shopContainer;
  }

  /**
   * Create weapon upgrade cards display - horizontally arranged on left side
   * @param {Phaser.GameObjects.Container} container - Main container to add elements to
   * @param {Array} weaponUpgrades - Array of weapon upgrade options
   * @param {number} shopWidth - Shop container width
   * @param {number} shopHeight - Shop container height
   * @param {number} startY - Y position to start placing cards
   */
  createWeaponUpgrades(container, weaponUpgrades, shopWidth, shopHeight, startY) {
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
    
    // Define weapon upgrades that match the reference image
    const weaponTypes = [
      { 
        name: '🗡️ Upgrade 1', 
        category: 'Melee', 
        rarity: 'Common',
        borderColor: 0xaa3333, 
        fillColor: 0x220000,
        price: 100,
        effects: '+10% Damage'
      },
      { 
        name: '🏹 Upgrade 2', 
        category: 'Ranged', 
        rarity: 'Rare', 
        borderColor: 0x3333aa, 
        fillColor: 0x000022,
        price: 150,
        effects: '+15% Damage'
      },
      { 
        name: '🔥 Upgrade 3', 
        category: 'AoE', 
        rarity: 'Epic', 
        borderColor: 0xaa33aa, 
        fillColor: 0x220022,
        price: 200,
        effects: '+20% Damage'
      }
    ];
    
    // Loop through weapon types and create upgrade cards
    weaponTypes.forEach((upgrade, index) => {
      // Position cards side by side on the left side
      const x = -shopWidth * 0.3 + (index * (cardWidth + spacing));
      
      // Create card container
      const card = this.scene.add.container(x, startY);
      
      // Create card background with colored border
      const cardBg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, upgrade.fillColor, 0.6);
      const cardBorder = this.scene.add.rectangle(0, 0, cardWidth, cardHeight);
      cardBorder.setStrokeStyle(2, upgrade.borderColor);
      cardBg.setOrigin(0.5);
      cardBorder.setOrigin(0.5);
      
      // Create card title - positioned higher in the taller card
      const nameText = this.scene.add.text(0, -cardHeight/2 + 20, upgrade.name, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      
      // Add subtle dropshadow to improve text readability
      nameText.setShadow(1, 1, 'rgba(0,0,0,0.5)', 2);
      
      // Reduced spacing between elements - position category closer to the title
      const categoryText = this.scene.add.text(0, -cardHeight/2 + 50, 
        `Category: ${upgrade.category}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#dddddd',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      
      // Create rarity text with reduced spacing
      let rarityColor;
      switch (upgrade.rarity) {
        case 'Common': rarityColor = '#aaaaaa'; break;
        case 'Rare': rarityColor = '#4488ff'; break;
        case 'Epic': rarityColor = '#aa44ff'; break;
        default: rarityColor = '#ffffff';
      }
      
      const rarityText = this.scene.add.text(0, -cardHeight/2 + 75, 
        `Rarity: ${upgrade.rarity}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: rarityColor,
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      
      // Add shadow to improve text readability
      categoryText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
      rarityText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
      
      // Add effects text with reduced spacing
      const effectsText = this.scene.add.text(0, -cardHeight/2 + 100, 
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
      const priceBox = this.scene.add.rectangle(0, priceY, priceBoxWidth, priceBoxHeight, 0x000000, 0.5);
      priceBox.setStrokeStyle(1, 0xffcc44); // Credit yellow color border
      
      // Create price text with improved readability
      const priceText = this.scene.add.text(0, priceY, `Credits: ${upgrade.price}`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffcc44', // Credit yellow color
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      
      // Add subtle glow to price text
      priceText.setShadow(0, 0, '#ffcc44', 3, true, true);
      
      // Add all elements to card
      card.add([cardBg, cardBorder, nameText, categoryText, rarityText, effectsText, priceBox, priceText]);
      
      // Make card interactive
      cardBg.setInteractive({ cursor: 'pointer' });
      
      // Add hover effect
      cardBg.on('pointerover', () => {
        cardBorder.setStrokeStyle(3, upgrade.borderColor);
        // Highlight the text on hover for better feedback
        categoryText.setColor('#ffffff');
        rarityText.setStyle({ color: rarityColor, fontSize: '14px' });
      });
      
      cardBg.on('pointerout', () => {
        cardBorder.setStrokeStyle(2, upgrade.borderColor);
        // Reset text on pointer out
        categoryText.setColor('#dddddd');
        rarityText.setStyle({ color: rarityColor, fontSize: '13px' });
      });
      
      // Add click event
      cardBg.on('pointerdown', () => {
        // Visual feedback for click
        this.scene.tweens.add({
          targets: cardBg,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 50,
          yoyo: true
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
   * @param {number} shopWidth - Shop container width
   * @param {number} shopHeight - Shop container height
   * @param {number} startY - Y position to start placing upgrades
   */
  createPlayerUpgrades(container, playerUpgrades, shopWidth, shopHeight, startY) {
    // Clear any existing player upgrade buttons
    this.upgradeElements.playerButtons = [];
    
    // Define button dimensions to match reference image
    const buttonWidth = 160;
    const buttonHeight = 40;
    const spacing = 15;
    
    // Calculate starting position - right side of weapon cards
    const rightSideX = shopWidth * 0.3; // Right side position
    
    // Define player upgrade types exactly as in the reference
    const playerUpgradeTypes = [
      { 
        name: '❤️ Health Upgrade', 
        borderColor: 0xaa6666, 
        fillColor: 0x221111
      },
      { 
        name: '🛡️ Armor Upgrade', 
        borderColor: 0x6666aa, 
        fillColor: 0x111122 
      },
      { 
        name: '⚡ Speed Upgrade', 
        borderColor: 0xaaaa66, 
        fillColor: 0x222211
      }
    ];
    
    // Create player upgrade buttons - stacked vertically
    playerUpgradeTypes.forEach((upgrade, index) => {
      // Calculate vertical position with proper spacing
      // Move buttons 50px higher by subtracting 50 from the y position
      const y = startY - 55 + (index * (buttonHeight + spacing));
      
      // Create button container
      const button = this.scene.add.container(rightSideX, y);
      
      // Create button background with colored border
      const btnBg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, upgrade.fillColor, 0.6);
      const btnBorder = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight);
      btnBorder.setStrokeStyle(2, upgrade.borderColor);
      btnBg.setOrigin(0.5);
      btnBorder.setOrigin(0.5);
      
      // Create button text
      const nameText = this.scene.add.text(0, 0, upgrade.name, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      
      // Add elements to button container
      button.add([btnBg, btnBorder, nameText]);
      
      // Make button interactive
      btnBg.setInteractive({ cursor: 'pointer' });
      
      // Add hover effect
      btnBg.on('pointerover', () => {
        btnBorder.setStrokeStyle(3, upgrade.borderColor);
      });
      
      btnBg.on('pointerout', () => {
        btnBorder.setStrokeStyle(2, upgrade.borderColor);
      });
      
      // Add click event
      btnBg.on('pointerdown', () => {
        // Visual feedback for click
        this.scene.tweens.add({
          targets: btnBg,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 50,
          yoyo: true
        });
      });
      
      // Add button to container and tracking list
      container.add(button);
      this.upgradeElements.playerButtons.push({
        container: button,
        upgrade: upgrade,
        purchased: false
      });
    });
  }
  
  /**
   * Creates stat panels to display player and weapon statistics
   * @param {Phaser.GameObjects.Container} container - Main container to add elements to
   * @param {number} shopWidth - Shop container width
   * @param {number} shopHeight - Shop container height
   * @param {number} lowerSectionY - Y position to start placing stat panels
   */
  createStatPanels(container, shopWidth, shopHeight, lowerSectionY) {
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
    const firstCardX = -shopWidth * 0.3; // X coordinate of first weapon card (center)
    const weaponPanelX = firstCardX - cardWidth/2 + panelWidth/2; // Align left edges
    
    // For player stats - align right edge with the right edge of player upgrade buttons
    const playerButtonX = shopWidth * 0.3; // X coordinate of player upgrade buttons (center)
    const playerPanelX = playerButtonX + buttonWidth/2 - panelWidth/2; // Align right edges
    
    // Create weapon stats panel - positioned directly underneath the weapon cards but moved up by 60px
    const weaponPanel = this.scene.add.graphics();
    weaponPanel.fillStyle(0x222222, 0.8);
    weaponPanel.fillRoundedRect(weaponPanelX - panelWidth/2, adjustedY, panelWidth, panelHeight, 8);
    weaponPanel.lineStyle(2, 0xaa4f4f);
    weaponPanel.strokeRoundedRect(weaponPanelX - panelWidth/2, adjustedY, panelWidth, panelHeight, 8);
    
    // Weapon stats title - reduced spacing between title and content
    const weaponTitle = this.scene.add.text(
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
    const weaponStatsText = this.scene.add.text(
      weaponPanelX - panelWidth/2 + textPadding, 
      adjustedY + 30,
      'Damage: 10\nRate: 5/sec\nRange: 300\nSpeed: 400\nCrit: 5%', 
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        lineSpacing: 6, // Reduced from 10 to 6 for more compact display
        padding: { x: 2, y: 2 }
      }
    );

    // Create player stats panel - aligned under player upgrade buttons but moved up by 60px
    const playerPanel = this.scene.add.graphics();
    playerPanel.fillStyle(0x222222, 0.8);
    playerPanel.fillRoundedRect(playerPanelX - panelWidth/2, adjustedY, panelWidth, panelHeight, 8);
    playerPanel.lineStyle(2, 0x4a6fa5);
    playerPanel.strokeRoundedRect(playerPanelX - panelWidth/2, adjustedY, panelWidth, panelHeight, 8);
    
    // Player stats title - centered over the panel (reduced spacing)
    const playerTitle = this.scene.add.text(
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
    
    // Player stats text - positioned with proper alignment and padding, reduced line spacing to match weapon stats
    const playerStatsText = this.scene.add.text(
      playerPanelX - panelWidth/2 + textPadding, 
      adjustedY + 30,
      'Health: 100\nArmor: 10\nSpeed: 150\nXP: 300\nLevel: 3', 
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#ffffff',
        lineSpacing: 6, // Reduced from 10 to 6 for more compact display
        padding: { x: 2, y: 2 }
      }
    );

    // Add subtle shadow to improve text readability
    weaponStatsText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
    playerStatsText.setShadow(1, 1, 'rgba(0,0,0,0.7)', 2);
    
    // Add separator lines between stat entries - adjusted spacing to match new line spacing
    const weaponSeparator = this.scene.add.graphics();
    weaponSeparator.lineStyle(1, 0x444444, 0.7);
    for (let i = 1; i < 5; i++) {
      weaponSeparator.lineBetween(
        weaponPanelX - panelWidth/2 + 10, 
        adjustedY + 30 + (i * 20), // Adjusted from 25 to 20 to match new line spacing
        weaponPanelX + panelWidth/2 - 10, 
        adjustedY + 30 + (i * 20)
      );
    }
    
    const playerSeparator = this.scene.add.graphics();
    playerSeparator.lineStyle(1, 0x444444, 0.7);
    for (let i = 1; i < 5; i++) {
      playerSeparator.lineBetween(
        playerPanelX - panelWidth/2 + 10, 
        adjustedY + 30 + (i * 20), // Adjusted from 25 to 20 to match new line spacing
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
    
    // Initial update of the stat panels
    this.updateStatPanels();
  }

  /**
   * Create bottom buttons for reroll and next wave
   * @param {Phaser.GameObjects.Container} container - Main container to add elements to
   * @param {number} shopWidth - Shop container width
   * @param {number} shopHeight - Shop container height
   * @param {number} buttonY - Y position for the buttons
   */
  createBottomButtons(container, shopWidth, shopHeight, buttonY) {
    // Calculate button positions
    const buttonSpacing = 100;
    
    // Create reroll button (green button on left)
    const rerollContainer = this.scene.add.container(-buttonSpacing, buttonY);
    const rerollBg = this.scene.add.rectangle(0, 0, 100, 36, 0x2a4d2a);
    rerollBg.setStrokeStyle(2, 0x44aa44);
    
    const rerollText = this.scene.add.text(0, 0, 'Reroll', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    rerollContainer.add([rerollBg, rerollText]);
    
    // Make reroll button interactive
    rerollBg.setInteractive({ cursor: 'pointer' });
    
    // Add hover and click effects
    rerollBg.on('pointerover', () => {
      rerollBg.setFillStyle(0x3a5d3a);
    });
    
    rerollBg.on('pointerout', () => {
      rerollBg.setFillStyle(0x2a4d2a);
    });
    
    rerollBg.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: rerollBg,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => this.handleReroll()
      });
    });
    
    // Create next wave button (green button on right)
    const nextWaveContainer = this.scene.add.container(buttonSpacing, buttonY);
    const nextWaveBg = this.scene.add.rectangle(0, 0, 150, 36, 0x2a4d2a);
    nextWaveBg.setStrokeStyle(2, 0x44aa44);
    
    const nextWaveText = this.scene.add.text(0, 0, 'Start Next Wave', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    nextWaveContainer.add([nextWaveBg, nextWaveText]);
    
    // Make next wave button interactive
    nextWaveBg.setInteractive({ cursor: 'pointer' });
    
    // Add hover and click effects
    nextWaveBg.on('pointerover', () => {
      nextWaveBg.setFillStyle(0x3a5d3a);
    });
    
    nextWaveBg.on('pointerout', () => {
      nextWaveBg.setFillStyle(0x2a4d2a);
    });
    
    nextWaveBg.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: nextWaveBg,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.closeShop();
          this.onNextWaveStart();
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
   * Handle rerolling shop upgrades
   */
  handleReroll() {
    // Check if player can afford reroll
    const rerollCost = this.upgradeManager.getRerollCost();
    
    if (this.player.credits < rerollCost) {
      // Show "cannot afford" feedback on button
      const rerollBg = this.rerollButton.background;
      
      // Flash red a few times
      this.scene.tweens.add({
        targets: rerollBg,
        fillColor: { from: 0x333333, to: 0x663333 },
        yoyo: true,
        duration: 100,
        repeat: 3,
        onComplete: () => {
          rerollBg.setFillStyle(0x333333);
        }
      });
      
      return;
    }
    
    // Process payment
    this.player.credits -= rerollCost;
    
    // Update cash display
    if (this.scene.cashManager) {
      this.scene.cashManager.setCash(this.player.credits);
    }
    
    // Generate new upgrades
    const upgrades = this.upgradeManager.reroll();
    
    // Update reroll cost display
    const newCost = this.upgradeManager.getRerollCost();
    this.rerollButton.text.setText(`Reroll (${newCost} Credits)`);
    
    // Recreate the shop UI elements
    this.rebuildShopElements(upgrades);
    
    // Play reroll sound
    if (this.scene.soundManager) {
      this.scene.soundManager.playSoundEffect('shoot_minigun', { 
        detune: -600, 
        volume: 0.5 
      });
    }
  }

  /**
   * Rebuild shop UI elements after reroll
   * @param {Object} upgrades - New upgrades to display
   */
  rebuildShopElements(upgrades) {
    // Remove old elements
    this.upgradeElements.weaponCards.forEach(card => {
      if (card.container) {
        card.container.destroy();
      }
    });
    
    this.upgradeElements.playerButtons.forEach(button => {
      if (button.container) {
        button.container.destroy();
      }
    });
    
    // Recreate with new upgrades
    const { width, height } = this.scene.cameras.main;
    this.createWeaponUpgrades(upgrades.weaponUpgrades, width, height);
    this.createPlayerUpgrades(upgrades.playerUpgrades, width, height);
  }

  /**
   * Close the shop interface
   */
  closeShop() {
    if (!this.isShopOpen || !this.shopOverlay) return;
    
    // Fade out shop overlay
    this.scene.tweens.add({
      targets: this.shopOverlay,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // Clean up shop overlay
        this.shopOverlay.destroy();
        this.shopOverlay = null;
        
        // Reset shop state
        this.isShopOpen = false;
        
        // Ensure all stat panels are properly destroyed
        if (this.upgradeElements.statPanels) {
          this.upgradeElements.statPanels.forEach(panel => {
            if (panel.graphics) panel.graphics.destroy();
            if (panel.title) panel.title.destroy();
            if (panel.statsText) panel.statsText.destroy();
          });
        }
        
        // Reset upgrade tracking lists
        this.upgradeElements = {
          weaponCards: [],
          playerButtons: [],
          statPanels: []
        };
        
        // Reset reroll count for next shop visit
        this.upgradeManager.resetReroll();
        
        // Unpause the game
        if (this.scene.setPauseState) {
          this.scene.setPauseState(false, 'shop');
        }
      }
    });
  }

  /**
   * Handle starting the next wave after shopping
   */
  onNextWaveStart() {
    // Start next wave using wave manager
    if (this.scene.waveManager) {
      this.scene.waveManager.startNextWave();
    }
  }

  /**
   * Updates the stat panels with current player and weapon stats
   * Should be called after upgrades are purchased or when shop is opened
   */
  updateStatPanels() {
    if (!this.upgradeElements.statPanels || this.upgradeElements.statPanels.length === 0) return;
    
    const player = this.scene.player;
    
    // Format player stats
    const playerStats = [
      `Health: ${player.health}/${player.maxHealth}`,
      `Speed: ${player.speed}`,
      `Defense: ${player.defense || 0}`,
      `XP Level: ${this.scene.xpManager.currentLevel}`,
      `XP Points: ${this.scene.xpManager.currentXP}/${this.scene.xpManager.nextLevelXP}`,
      `Cash: $${this.scene.cashManager.cash}`
    ].join('\n');
    
    // Format weapon stats
    const weaponStats = [
      `Damage: ${player.bulletDamage || 10}`,
      `Fire Rate: ${(player.fireRate || 300)}ms`,
      `Range: ${player.bulletRange || 400}`,
      `Bullet Speed: ${player.bulletSpeed || 600}`,
      `Critical Hit: ${player.criticalHitChance || 5}%`,
      `Critical Damage: ${player.criticalDamageMultiplier || 1.5}x`
    ].join('\n');
    
    // Update the panel texts
    this.upgradeElements.statPanels.forEach(panel => {
      if (panel.type === 'player') {
        panel.statsText.setText(playerStats);
      } else if (panel.type === 'weapon') {
        panel.statsText.setText(weaponStats);
      }
    });
  }

  /**
   * Toggle the visibility of the shop UI
   * @param {boolean} [forceState=null] - If provided, forces the shop to this state (open/closed)
   * @returns {boolean} - The new state of the shop (true = open, false = closed)
   */
  toggleShop(forceState = null) {
    // If a state is forced, set it directly
    if (forceState !== null) {
      this.isShopOpen = forceState;
    } else {
      // Otherwise toggle the current state
      this.isShopOpen = !this.isShopOpen;
    }

    // Show/hide the shop overlay
    if (this.shopOverlay) {
      this.shopOverlay.setVisible(this.isShopOpen);
      
      // Pause the game when shop is open
      if (this.isShopOpen) {
        this.scene.scene.pause('Game');
        // Update the stat panels when opening the shop
        this.updateStatPanels();
      } else {
        this.scene.scene.resume('Game');
      }
    }

    return this.isShopOpen;
  }
}
