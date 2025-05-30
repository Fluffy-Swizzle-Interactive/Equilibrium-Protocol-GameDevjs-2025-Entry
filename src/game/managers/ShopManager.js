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
    this.isProcessingShopOpen = false; // Add debounce flag

    // Register with scene for easier access
    scene.shopManager = this;

    // Bind event handlers to maintain 'this' context
    this.onWaveCompleted = this.onWaveCompleted.bind(this);

    // Listen for wave completed events to update the next wave button
    EventBus.on('wave-completed', this.onWaveCompleted);

    // Direct integration with WaveManager for round end
    if (scene.waveManager) {
      scene.waveManager.registerEndOfRoundCallback(this.onWaveCompleted);
    }

    // Clean up event listeners when scene is destroyed
    this.scene.events.once('shutdown', () => {
      EventBus.off('wave-completed', this.onWaveCompleted);
      if (this.scene.waveManager) {
        this.scene.waveManager.unregisterEndOfRoundCallback(this.onWaveCompleted);
      }
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

        // Add new listener for opening shop (only to the background element)
        nextWaveBg.on('pointerdown', () => {
          // Add debounce protection
          if (this.isProcessingShopOpen) return;
          
          // Set processing flag
          this.isProcessingShopOpen = true;
          
          // Open shop
          this.openShop();
          
          // Reset flag after a delay to prevent double-clicks
          this.scene.time.delayedCall(500, () => {
            this.isProcessingShopOpen = false;
          });
        });

        // Make the text non-interactive or ensure it doesn't have its own handler
        nextWaveButton.off('pointerdown');
        nextWaveButton.disableInteractive(); // Optional: make text non-interactive

        // Make the button visible if it's not already
        if (!nextWaveBg.visible) {
          this.scene.uiManager.showNextWaveButton();
        }
      }
    }
  }

  /**
   * Open the shop interface
   */
  openShop() {
    if (this.isShopOpen) return;

    this.isShopOpen = true;
    
    // Immediately hide the "Open Shop" button to prevent double-clicks
    if (this.scene.uiManager) {
      this.scene.uiManager.hideNextWaveButton();
    }

    // Sync player credits with cashManager before opening shop
    if (this.scene.cashManager) {
      this.player.credits = this.scene.cashManager.getCurrentCash();
      if (this.scene.isDev) {
        console.debug('Shop opened with player credits synced:', this.player.credits);
      }
    }

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
    // Check if player has reached the reroll limit
    if (this.upgradeManager.rerollCount >= this.upgradeManager.maxRerollsPerRound) {
      // Reached reroll limit
      EventBus.emit('shop-reroll-failed', { reason: 'reroll-limit-reached' });
      return false;
    }

    // Check if player can afford reroll
    const rerollCost = this.upgradeManager.getRerollCost();

    // Skip payment check if reroll is free
    if (rerollCost > 0 && this.player.credits < rerollCost) {
      // Not enough credits
      EventBus.emit('shop-reroll-failed', { reason: 'insufficient-funds' });
      return false;
    }

    // Process payment (only if reroll costs something)
    if (rerollCost > 0) {
      this.player.credits -= rerollCost;

      // Update cash display
      if (this.scene.cashManager) {
        this.scene.cashManager.setCash(this.player.credits);
      }
    }

    // Generate new upgrades
    const upgrades = this.upgradeManager.reroll();

    // Emit event with new upgrades for the ShopMenuScene to update
    EventBus.emit('shop-rerolled', {
      newUpgrades: upgrades,
      newRerollCost: this.upgradeManager.getRerollCost(),
      rerollsRemaining: this.upgradeManager.maxRerollsPerRound - this.upgradeManager.rerollCount
    });

    // Play shop upgrade sound for reroll (same as upgrade buttons)
    if (this.scene.soundManager) {
      this.scene.soundManager.playSoundEffect('shop_upgrade', {
        volume: 0.06, // Same as other shop upgrades
        detune: -100,
        rate: 1.1
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
        volume: 0.05 // Reduced to 10% of original value (0.5 -> 0.05)
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
    // Check if player has enough skill points for the upgrade
    if (this.player.skillPoints < upgrade.skillPointCost) {
      EventBus.emit('shop-purchase-failed', { reason: 'insufficient-skill-points' });
      return false;
    }

    // Process skill point payment
    this.player.skillPoints -= upgrade.skillPointCost;

    // Emit event for skill points update
    EventBus.emit('skill-points-updated', {
      skillPoints: this.player.skillPoints
    });

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
        volume: 0.05 // Reduced to 10% of original value (0.5 -> 0.05)
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

    // Hide the next wave button (which is currently showing "Open Shop")
    if (this.scene.uiManager && this.scene.uiManager.elements.nextWaveButtonBg) {
      this.scene.uiManager.elements.nextWaveButtonBg.setVisible(false);
      if (this.scene.uiManager.elements.nextWaveButtonText) {
        this.scene.uiManager.elements.nextWaveButtonText.setVisible(false);
      }
    }

    // Start next wave using wave manager
    if (this.scene.waveManager) {
      this.scene.waveManager.startNextWave();
    }
  }
}
