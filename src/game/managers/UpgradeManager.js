// UpgradeManager.js

export default class UpgradeManager {
    constructor(player, weapon, rng) {
      this.player = player;
      this.weapon = weapon;
      this.rng = rng;
      this.rerollCost = 50;
      this.rerollCount = 0;
    }
  
    generateUpgrades() {
      return {
        weaponUpgrades: this.getRandomWeaponUpgrades(3),
        playerUpgrades: this.getRandomPlayerUpgrades(3),
      };
    }
  
    getRandomWeaponUpgrades(count) {
      const categories = ['Melee', 'Ranged', 'AoE'];
      const rarities = ['Common', 'Rare', 'Epic'];
      const upgrades = [];
  
      for (let i = 0; i < count; i++) {
        upgrades.push({
          name: `Weapon Upgrade ${i + 1}`,
          category: this.rng.pick(categories),
          rarity: this.rng.pick(rarities),
          cost: this.calculateWeaponCost(i),
        });
      }
  
      return upgrades;
    }
  
    getRandomPlayerUpgrades(count) {
      const types = ['Health', 'Armor', 'Speed'];
      const upgrades = [];
  
      for (let i = 0; i < count; i++) {
        upgrades.push({
          type: types[i],
          cost: 10 + i * 5, // XP cost
        });
      }
  
      return upgrades;
    }
  
    applyUpgrade(upgrade, type) {
      if (type === 'weapon') {
        this.weapon.applyUpgrade(upgrade);
      } else if (type === 'player') {
        this.player.applyUpgrade(upgrade);
      }
    }
  
    reroll() {
      this.rerollCount++;
      const cost = this.getRerollCost();
      this.player.credits -= cost;
      return this.generateUpgrades();
    }
  
    getRerollCost() {
      return this.rerollCost * this.rerollCount || this.rerollCost;
    }
  
    resetReroll() {
      this.rerollCount = 0;
    }
  
    calculateWeaponCost(index) {
      return 100 + index * 50; // Example base cost
    }
  }
  