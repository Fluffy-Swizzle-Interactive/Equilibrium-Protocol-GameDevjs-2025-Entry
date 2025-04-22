// ShopManager.js

import { EventBus } from '../EventBus';
import UpgradeManager from './UpgradeManager.js';

/**
 * ShopManager class
 * Manages the in-game shop logic for purchasing weapon and player upgrades between waves
 * UI elements are now handled by ShopMenuScene
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
    this.isShopOpen = false;
    
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

    // Launch the shop scene and pass necessary data
    this.scene.scene.launch('ShopMenu', {
      shopManager: this,
      upgradeOptions: upgrades,
      gameScene: this.scene,
      player: this.player
    });
    
    // Pause the game while shop is open
    this.scene.scene.pause('WaveGame');

    // For debugging
    if (this.scene.isDev) {
      console.debug('Shop opened with upgrades:', upgrades);
    }
  }
  
  /**
   * Handle rerolling shop upgrades
   */
  handleReroll() {
    // Check if player can afford reroll
    const rerollCost = this.upgradeManager.getRerollCost();
    
    if (this.player.credits < rerollCost) {
      // Not enough credits
      EventBus.emit('shop-reroll-failed', { reason: 'insufficient-funds' });
      return false;
    }
    
    // Process payment
    this.player.credits -= rerollCost;
    
    // Update cash display
    if (this.scene.cashManager) {
      this.scene.cashManager.setCash(this.player.credits);
    }
    
    // Generate new upgrades
    const upgrades = this.upgradeManager.reroll();
    
    // Emit event with new upgrades for the ShopMenuScene to update
    EventBus.emit('shop-rerolled', { 
      newUpgrades: upgrades, 
      newRerollCost: this.upgradeManager.getRerollCost() 
    });
    
    // Play reroll sound
    if (this.scene.soundManager) {
      this.scene.soundManager.playSoundEffect('shoot_minigun', { 
        detune: -600, 
        volume: 0.5 
      });
    }

    return true;
  }
  
  /**
   * Purchase a weapon upgrade
   * @param {Object} upgrade - Upgrade to purchase
   * @returns {boolean} - Whether purchase was successful
   */
  purchaseWeaponUpgrade(upgrade) {
    // Check if player can afford the upgrade
    if (this.player.credits < upgrade.price) {
      EventBus.emit('shop-purchase-failed', { reason: 'insufficient-funds' });
      return false;
    }
    
    // Process payment
    this.player.credits -= upgrade.price;
    
    // Update cash display
    if (this.scene.cashManager) {
      this.scene.cashManager.setCash(this.player.credits);
    }
    
    // Apply the upgrade
    this.upgradeManager.applyWeaponUpgrade(upgrade);
    
    // Emit event for UI update
    EventBus.emit('shop-item-purchased', { 
      itemType: 'weapon',
      itemId: upgrade.id,
      player: this.player,
      weapon: this.weapon
    });
    
    // Play purchase sound
    if (this.scene.soundManager) {
      this.scene.soundManager.playSoundEffect('levelUp', { 
        volume: 0.5 
      });
    }
    
    return true;
  }
  
  /**
   * Purchase a player upgrade
   * @param {Object} upgrade - Upgrade to purchase
   * @returns {boolean} - Whether purchase was successful
   */
  purchasePlayerUpgrade(upgrade) {
    // Check if player can afford the upgrade
    if (this.player.credits < upgrade.price) {
      EventBus.emit('shop-purchase-failed', { reason: 'insufficient-funds' });
      return false;
    }
    
    // Process payment
    this.player.credits -= upgrade.price;
    
    // Update cash display
    if (this.scene.cashManager) {
      this.scene.cashManager.setCash(this.player.credits);
    }
    
    // Apply the upgrade
    this.upgradeManager.applyPlayerUpgrade(upgrade);
    
    // Emit event for UI update
    EventBus.emit('shop-item-purchased', { 
      itemType: 'player',
      itemId: upgrade.id,
      player: this.player
    });
    
    // Play purchase sound
    if (this.scene.soundManager) {
      this.scene.soundManager.playSoundEffect('levelUp', { 
        volume: 0.5 
      });
    }
    
    return true;
  }

  /**
   * Handle starting the next wave after shopping
   */
  onNextWaveStart() {
    this.isShopOpen = false;

    // Reset reroll count for next shop visit
    this.upgradeManager.resetReroll();

    // Start next wave using wave manager
    if (this.scene.waveManager) {
      this.scene.waveManager.startNextWave();
    }
  }
}
