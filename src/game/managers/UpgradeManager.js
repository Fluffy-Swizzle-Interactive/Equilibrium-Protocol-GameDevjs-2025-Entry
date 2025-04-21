// UpgradeManager.js
import { EventBus } from '../EventBus';

export default class UpgradeManager {
  /**
   * Create a new upgrade manager
   * @param {Player} player - Reference to the player
   * @param {Object} weapon - Reference to the player's weapon
   * @param {Object} rng - Random number generator
   */
  constructor(player, weapon, rng) {
    this.player = player;
    this.weapon = weapon;
    this.rng = rng;
    this.rerollCost = 50;
    this.rerollCount = 0;
    
    // Track applied upgrades
    this.appliedUpgrades = {
      weapon: [],
      player: []
    };
  }

  /**
   * Generate a set of random upgrades for the shop
   * @returns {Object} Object containing weapon and player upgrades
   */
  generateUpgrades() {
    return {
      weaponUpgrades: this.getRandomWeaponUpgrades(3),
      playerUpgrades: this.getRandomPlayerUpgrades(3),
    };
  }

  /**
   * Generate random weapon upgrades
   * @param {number} count - Number of upgrades to generate
   * @returns {Array} Array of weapon upgrade objects
   */
  getRandomWeaponUpgrades(count) {
    // Define possible upgrade categories and properties
    const categories = ['Melee', 'Ranged', 'AoE'];
    const rarities = ['Common', 'Rare', 'Epic'];
    const names = {
      Melee: ['Sharpened Edge', 'Heavy Strike', 'Combat Training'],
      Ranged: ['Focused Sight', 'Quick Reload', 'Armor Piercing'],
      AoE: ['Blast Radius', 'Shockwave', 'Cluster Shot']
    };

    const upgrades = [];

    for (let i = 0; i < count; i++) {
      // Select random category and rarity
      const category = this.rng.pick(categories);
      let rarity;
      
      // Determine rarity with weighted probability
      const rarityRoll = Math.random();
      if (rarityRoll < 0.6) {
        rarity = 'Common';
      } else if (rarityRoll < 0.9) {
        rarity = 'Rare';
      } else {
        rarity = 'Epic';
      }

      // Pick a name from the selected category
      const name = this.rng.pick(names[category]);
      
      // Calculate base cost based on rarity
      let baseCost;
      if (rarity === 'Common') {
        baseCost = 100;
      } else if (rarity === 'Rare') {
        baseCost = 250;
      } else {
        baseCost = 400;
      }
      
      // Create the upgrade object
      upgrades.push({
        name: name,
        category: category,
        rarity: rarity,
        cost: baseCost + (i * 50),
        effects: this.generateWeaponEffects(category, rarity)
      });
    }

    return upgrades;
  }

  /**
   * Generate random player upgrades
   * @param {number} count - Number of upgrades to generate
   * @returns {Array} Array of player upgrade objects
   */
  getRandomPlayerUpgrades(count) {
    const types = ['Health', 'Armor', 'Speed'];
    const upgrades = [];

    // Create one upgrade of each type
    for (let i = 0; i < Math.min(count, types.length); i++) {
      // Calculate cost based on type and progression
      let cost;
      switch (types[i]) {
        case 'Health':
          cost = 15 + (this.getUpgradeLevel('player', 'Health') * 10);
          break;
        case 'Armor':
          cost = 20 + (this.getUpgradeLevel('player', 'Armor') * 15);
          break;
        case 'Speed':
          cost = 25 + (this.getUpgradeLevel('player', 'Speed') * 20);
          break;
        default:
          cost = 20 + (i * 10);
      }

      upgrades.push({
        type: types[i],
        cost: cost,
        description: this.getPlayerUpgradeDescription(types[i])
      });
    }

    return upgrades;
  }

  /**
   * Generate effect values for a weapon upgrade
   * @param {string} category - Weapon category (Melee, Ranged, AoE)
   * @param {string} rarity - Rarity level (Common, Rare, Epic)
   * @returns {Object} Object containing effect values
   */
  generateWeaponEffects(category, rarity) {
    // Define base modifier values
    let damageModifier = 0;
    let fireRateModifier = 0;
    let pierceModifier = 0;
    
    // Set modifier values based on category
    switch(category) {
      case 'Melee':
        damageModifier = 0.15; // 15% damage increase
        break;
      case 'Ranged':
        fireRateModifier = 0.1; // 10% fire rate increase
        break;
      case 'AoE':
        pierceModifier = 1; // +1 pierce
        break;
    }
    
    // Apply rarity multipliers
    const rarityMultiplier = (rarity === 'Common') ? 1 : (rarity === 'Rare') ? 1.5 : 2.2;
    damageModifier *= rarityMultiplier;
    fireRateModifier *= rarityMultiplier;
    if (pierceModifier > 0 && rarity === 'Epic') pierceModifier += 1;
    
    return {
      damageModifier: Number(damageModifier.toFixed(2)),
      fireRateModifier: Number(fireRateModifier.toFixed(2)),
      pierceModifier: Math.round(pierceModifier)
    };
  }

  /**
   * Get description for player upgrade
   * @param {string} type - Type of upgrade (Health, Armor, Speed)
   * @returns {string} Description text
   */
  getPlayerUpgradeDescription(type) {
    switch(type) {
      case 'Health':
        return 'Increases maximum health by 20%';
      case 'Armor':
        return 'Reduces damage taken by 15%';
      case 'Speed':
        return 'Increases movement speed by 15%';
      default:
        return 'Enhances player abilities';
    }
  }

  /**
   * Apply an upgrade to the player or weapon
   * @param {Object} upgrade - The upgrade to apply
   * @param {string} type - Either 'weapon' or 'player'
   * @returns {boolean} Whether the upgrade was successfully applied
   */
  applyUpgrade(upgrade, type) {
    if (type === 'weapon') {
      return this.applyWeaponUpgrade(upgrade);
    } else if (type === 'player') {
      return this.applyPlayerUpgrade(upgrade);
    }
    return false;
  }

  /**
   * Apply a weapon upgrade
   * @param {Object} upgrade - The weapon upgrade to apply
   * @returns {boolean} Whether the upgrade was successfully applied
   */
  applyWeaponUpgrade(upgrade) {
    if (!upgrade || !upgrade.effects) return false;
    
    const effects = upgrade.effects;
    
    // Apply damage increase
    if (effects.damageModifier > 0) {
      this.player.bulletDamage *= (1 + effects.damageModifier);
      this.player.bulletDamage = Math.round(this.player.bulletDamage);
    }
    
    // Apply fire rate improvement (decrease fire rate value)
    if (effects.fireRateModifier > 0) {
      // Fire rate is in milliseconds, so we reduce it to improve it
      this.player.fireRate /= (1 + effects.fireRateModifier);
      this.player.fireRate = Number(this.player.fireRate.toFixed(1));
    }
    
    // Apply pierce increase
    if (effects.pierceModifier > 0) {
      this.player.bulletPierce += effects.pierceModifier;
      this.player.bulletHealth += effects.pierceModifier;
    }
    
    // Update weapon reference
    this.weapon.damage = this.player.bulletDamage;
    this.weapon.fireRate = this.player.fireRate;
    this.weapon.pierce = this.player.bulletPierce;
    
    // Track the applied upgrade
    this.appliedUpgrades.weapon.push(upgrade);
    
    // Emit event about the weapon upgrade
    EventBus.emit('weapon-upgraded', {
      category: upgrade.category,
      rarity: upgrade.rarity,
      effects: effects
    });
    
    return true;
  }

  /**
   * Apply a player upgrade via the player's applyUpgrade method
   * @param {Object} upgrade - The player upgrade to apply
   * @returns {boolean} Whether the upgrade was successfully applied
   */
  applyPlayerUpgrade(upgrade) {
    // Use the player's applyUpgrade method
    const success = this.player.applyUpgrade(upgrade);
    
    if (success) {
      // Track the applied upgrade
      this.appliedUpgrades.player.push(upgrade);
    }
    
    return success;
  }

  /**
   * Get the current level of an upgrade type
   * @param {string} category - 'player' or 'weapon' category
   * @param {string} type - Type of upgrade to check
   * @returns {number} Current level of the upgrade
   */
  getUpgradeLevel(category, type) {
    if (category === 'player') {
      // Check in player's tracked upgrades
      if (this.player.upgrades && this.player.upgrades[type.toLowerCase()] !== undefined) {
        return this.player.upgrades[type.toLowerCase()];
      }
    }
    
    // Count from applied upgrades
    return this.appliedUpgrades[category].filter(u => 
      (category === 'player' && u.type === type) || 
      (category === 'weapon' && u.category === type)
    ).length;
  }

  /**
   * Reroll all upgrades and increase reroll cost
   * @returns {Object} New set of upgrades
   */
  reroll() {
    this.rerollCount++;
    return this.generateUpgrades();
  }

  /**
   * Get the current cost to reroll upgrades
   * @returns {number} Reroll cost
   */
  getRerollCost() {
    return this.rerollCost * Math.max(1, this.rerollCount);
  }

  /**
   * Reset the reroll counter
   */
  resetReroll() {
    this.rerollCount = 0;
  }
}
