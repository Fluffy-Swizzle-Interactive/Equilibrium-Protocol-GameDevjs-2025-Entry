// ShopManager.js

import UpgradeManager from './UpgradeManager.js';

export default class ShopManager {
  constructor(scene, player, weapon, rng) {
    this.scene = scene;
    this.player = player;
    this.weapon = weapon;
    this.rng = rng;
    this.upgradeManager = new UpgradeManager(player, weapon, rng);
    this.shopOverlay = null;
  }

  openShop() {
    const upgrades = this.upgradeManager.generateUpgrades();
    this.createOverlay(upgrades);
  }

  createOverlay(upgrades) {
    // Create modal elements: upgrade cards, buttons, stats
    // NOTE: Replace this with Phaser UI code
    this.shopOverlay = this.scene.add.container();

    // TODO: Add UI elements for:
    // - Weapon upgrades (upgrades.weaponUpgrades)
    // - Player upgrades (upgrades.playerUpgrades)
    // - Reroll button
    // - Player/weapon stats
    // - Start next wave

    this.setupRerollButton();
  }

  setupRerollButton() {
    const rerollBtn = this.scene.add.text(0, 0, 'Reroll', { fill: '#fff' }).setInteractive();
    rerollBtn.on('pointerdown', () => {
      const newUpgrades = this.upgradeManager.reroll();
      this.refreshOverlay(newUpgrades);
    });
    this.shopOverlay.add(rerollBtn);
  }

  refreshOverlay(upgrades) {
    // Clear and re-render UI with new upgrades
    this.shopOverlay.removeAll(true);
    this.createOverlay(upgrades);
  }

  closeShop() {
    this.shopOverlay.destroy();
    this.upgradeManager.resetReroll();
  }

  onNextWaveStart() {
    this.closeShop();
    this.scene.startNextWave(); // or emit event
  }
}
