import { EventBus } from '../EventBus';
import { getRandomWeaponUpgrades } from '../constants/WeaponUpgrades';
import { getRandomPlayerUpgrades } from '../constants/PlayerUpgrades';

/**
 * UpgradeManager class
 * Manages the generation and application of player and weapon upgrades
 */
export default class UpgradeManager {
    /**
     * Create a new upgrade manager
     * @param {Object} player - Reference to the player
     * @param {Object} weapon - Reference to the player's weapon
     * @param {Object} rng - Random number generator
     */
    constructor(player, weapon, rng) {
        this.player = player;
        this.weapon = weapon;
        this.rng = rng;
        this.rerollCount = 0;
        this.baseRerollCost = 50;
    }

    /**
     * Generate a set of upgrades for the shop
     * @param {number} playerLevel - Current player level for scaling upgrades
     * @returns {Object} Object containing weapon and player upgrade options
     */
    generateUpgrades(playerLevel = 1) {
        // Get player level from the player object if available
        const currentLevel = playerLevel ||
            (this.player && this.player.scene && this.player.scene.xpManager ?
            this.player.scene.xpManager.getCurrentLevel() : 1);

        return {
            weaponUpgrades: getRandomWeaponUpgrades(3, this.rng, currentLevel),
            playerUpgrades: getRandomPlayerUpgrades(3, this.rng, currentLevel)
        };
    }

    /**
     * Handle rerolling upgrades in the shop
     * @returns {Object} New upgrade options
     */
    reroll() {
        this.rerollCount++;

        // Get current player level if available
        const playerLevel = this.player && this.player.scene && this.player.scene.xpManager ?
            this.player.scene.xpManager.getCurrentLevel() : 1;

        return this.generateUpgrades(playerLevel);
    }

    /**
     * Get the current cost for rerolling upgrades
     * @returns {number} Current reroll cost
     */
    getRerollCost() {
        return this.baseRerollCost + (this.rerollCount * 25);
    }

    /**
     * Reset reroll count (when shop is closed)
     */
    resetReroll() {
        this.rerollCount = 0;
    }

    /**
     * Apply a weapon upgrade to the player's weapon
     * @param {Object} upgrade - Weapon upgrade to apply
     */
    applyWeaponUpgrade(upgrade) {
        if (!upgrade || !upgrade.stats || !this.player) return;

        // Check if this is a drone upgrade
        if (upgrade.isDroneUpgrade && upgrade.stats.drone && this.player.weaponManager) {
            // Add drone to weapon manager
            const newDrone = this.player.weaponManager.upgradeDrones();

            // Emit event for drone addition
            EventBus.emit('drone-added', {
                upgrade: upgrade,
                droneCount: this.player.weaponManager.drones.length,
                maxDrones: this.player.weaponManager.maxDrones
            });

            return;
        }

        // Use the WeaponManager to apply the upgrade if available
        if (this.player.weaponManager) {
            this.player.weaponManager.applyUpgrade(upgrade);
            return;
        }

        // Backwards compatibility - apply directly to player if no weapon manager
        // Apply each stat change from the upgrade
        Object.entries(upgrade.stats).forEach(([stat, value]) => {
            switch (stat) {
                case 'damage':
                    this.player.bulletDamage *= value;
                    break;

                case 'fireRate':
                    this.player.fireRate *= value;
                    break;

                case 'bulletRange':
                    this.player.bulletRange *= value;
                    break;

                case 'bulletSpeed':
                    this.player.bulletSpeed *= value;
                    break;

                case 'bulletPierce':
                    this.player.bulletPierce += value;
                    break;

                case 'criticalChance':
                    this.player.criticalHitChance = (this.player.criticalHitChance || 0) + value;
                    break;

                case 'criticalDamageMultiplier':
                    this.player.criticalDamageMultiplier = (this.player.criticalDamageMultiplier || 1) + value;
                    break;

                case 'aoeRadius':
                    this.player.bulletAoeRadius = (this.player.bulletAoeRadius || 0) + value;
                    break;

                case 'aoeDamage':
                    this.player.bulletAoeDamage = (this.player.bulletAoeDamage || 0) + value;
                    break;

                case 'homing':
                    this.player.bulletHoming = value;
                    this.player.homingForce = upgrade.stats.homingForce || 0.05;
                    break;

                default:
                    console.warn(`Unknown weapon stat: ${stat}`);
            }
        });

        // Emit event for weapon upgrade
        EventBus.emit('weapon-upgraded', {
            upgrade: upgrade,
            newStats: {
                damage: this.player.bulletDamage,
                fireRate: this.player.fireRate,
                range: this.player.bulletRange,
                speed: this.player.bulletSpeed,
                pierce: this.player.bulletPierce,
                criticalChance: this.player.criticalHitChance,
                criticalDamage: this.player.criticalDamageMultiplier
            }
        });
    }

    /**
     * Apply a player upgrade to the player
     * @param {Object} upgrade - Player upgrade to apply
     */
    applyPlayerUpgrade(upgrade) {
        if (!upgrade || !upgrade.stats || !this.player) return;

        // Apply each stat change from the upgrade
        Object.entries(upgrade.stats).forEach(([stat, value]) => {
            switch (stat) {
                case 'maxHealth':
                    // Increase both current and max health
                    const currentHealth = this.player.health || 100;
                    const maxHealth = this.player.maxHealth || 100;
                    this.player.maxHealth = maxHealth + value;
                    this.player.health = currentHealth + value;

                    // Update health UI if player health component exists
                    if (this.player.scene.playerHealth) {
                        this.player.scene.playerHealth.setMaxHealth(this.player.maxHealth);
                        // Use heal method instead of non-existent setHealth method
                        const healthIncrease = value;
                        this.player.scene.playerHealth.heal(healthIncrease);
                    }
                    break;

                case 'defense':
                    this.player.defense = (this.player.defense || 0) + value;
                    break;

                case 'speed':
                    this.player.speed *= value;
                    break;

                case 'pickupRadius':
                    if (this.player.scene.collectibleManager) {
                        this.player.scene.collectibleManager.xpCollectionRadius *= value;
                        this.player.scene.collectibleManager.cashCollectionRadius *= value;
                        this.player.scene.collectibleManager.healthCollectionRadius *= value;
                    }
                    break;

                case 'healthRegen':
                    this.player.healthRegen = (this.player.healthRegen || 0) + value;
                    break;

                case 'dash':
                    this.player.hasDash = true;
                    this.player.dashPower = upgrade.stats.dashPower || 1.5;
                    this.player.dashCooldown = upgrade.stats.dashCooldown || 10000;
                    this.player.dashCooldownTimer = 0;
                    break;

                case 'shield':
                    this.player.hasShield = true;
                    this.player.shieldDuration = upgrade.stats.shieldDuration || 3000;
                    this.player.shieldCooldown = upgrade.stats.shieldCooldown || 30000;
                    this.player.shieldCooldownTimer = 0;
                    break;

                default:
                    console.warn(`Unknown player stat: ${stat}`);
            }
        });

        // Emit event for player upgrade
        EventBus.emit('player-upgraded', {
            upgrade: upgrade,
            newStats: {
                health: this.player.health,
                maxHealth: this.player.maxHealth,
                defense: this.player.defense,
                speed: this.player.speed,
                healthRegen: this.player.healthRegen
            }
        });
    }
}
