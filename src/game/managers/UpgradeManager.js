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

        // Track purchased drone upgrades
        this.purchasedDroneUpgrades = new Set();

        // Track current drone level (0 = no drones, 1 = first drone, etc.)
        this.currentDroneLevel = 0;

        // Track purchased upgrades in the current shop session
        // These will be excluded from rerolls
        this.purchasedUpgradesThisSession = {
            weapon: new Set(),  // Store upgrade IDs
            player: new Set()   // Store upgrade IDs
        };

        // Track upgrades that should never appear again in the shop
        // These are permanently excluded across all shop sessions
        this.permanentlyPurchasedUpgrades = new Set();

        // Check if player already has certain upgrades that should be excluded
        // This needs to be called after a short delay to ensure player is fully initialized
        if (player && player.scene) {
            player.scene.time.delayedCall(100, () => {
                this.checkExistingUpgrades();
            });
        }
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

        // Get all weapon upgrades
        let weaponUpgrades = getRandomWeaponUpgrades(6, this.rng, currentLevel); // Get more to account for filtering

        // Filter out purchased drone upgrades and enforce drone upgrade dependencies
        weaponUpgrades = this.filterDroneUpgrades(weaponUpgrades);

        // Filter out upgrades that were already purchased in this shop session
        if (this.purchasedUpgradesThisSession.weapon.size > 0) {
            weaponUpgrades = weaponUpgrades.filter(upgrade =>
                !this.purchasedUpgradesThisSession.weapon.has(upgrade.id));
        }

        // Filter out permanently purchased upgrades (like homing shot)
        if (this.permanentlyPurchasedUpgrades.size > 0) {
            weaponUpgrades = weaponUpgrades.filter(upgrade =>
                !this.permanentlyPurchasedUpgrades.has(upgrade.id));
        }

        // Limit to 3 upgrades (in case we got extras for filtering)
        weaponUpgrades = weaponUpgrades.slice(0, 3);

        // Get player defense stat for filtering upgrades
        let playerDefense = 0;
        if (this.player.healthSystem) {
            playerDefense = Math.round(this.player.healthSystem.getDamageResistance() * 100);
        } else if (this.player.scene && this.player.scene.playerHealth) {
            playerDefense = Math.round(this.player.scene.playerHealth.getDamageResistance() * 100);
        } else if (this.player.defense !== undefined) {
            playerDefense = this.player.defense;
        }

        // Get player health regeneration for filtering upgrades
        let healthRegen = 0;
        if (this.player.healthRegen !== undefined) {
            healthRegen = this.player.healthRegen;
        }

        // Create player stats object for filtering
        const playerStats = {
            defense: playerDefense,
            healthRegen: healthRegen
        };

        // Get player upgrades with filtering for defense cap
        let playerUpgrades = getRandomPlayerUpgrades(5, this.rng, currentLevel, playerStats); // Get more to account for filtering

        // Filter out upgrades that were already purchased in this shop session
        if (this.purchasedUpgradesThisSession.player.size > 0) {
            playerUpgrades = playerUpgrades.filter(upgrade =>
                !this.purchasedUpgradesThisSession.player.has(upgrade.id));
        }

        // Limit to 3 player upgrades
        playerUpgrades = playerUpgrades.slice(0, 3);

        return {
            weaponUpgrades: weaponUpgrades,
            playerUpgrades: playerUpgrades
        };
    }

    /**
     * Filter drone upgrades based on purchase history and dependencies
     * @param {Array} upgrades - Array of weapon upgrades
     * @returns {Array} - Filtered array of weapon upgrades
     */
    filterDroneUpgrades(upgrades) {
        return upgrades.filter(upgrade => {
            // If it's not a drone upgrade, keep it
            if (!upgrade.isDroneUpgrade) return true;

            // If this drone upgrade has already been purchased, filter it out
            if (this.purchasedDroneUpgrades.has(upgrade.id)) return false;

            // Check dependencies for drone upgrades
            if (upgrade.id === 'drone_1') {
                // Drone 1 can always appear if not purchased
                return true;
            } else if (upgrade.id === 'drone_2') {
                // Drone 2 requires drone 1 to be purchased
                return this.purchasedDroneUpgrades.has('drone_1');
            } else if (upgrade.id === 'drone_3') {
                // Drone 3 requires drone 2 to be purchased
                return this.purchasedDroneUpgrades.has('drone_2');
            }

            // Default case - allow the upgrade
            return true;
        });
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

        // Generate new upgrades with current player level
        return this.generateUpgrades(playerLevel);
    }

    /**
     * Get the current cost for rerolling upgrades
     * @returns {number} Current reroll cost
     */
    getRerollCost() {
        // First reroll is free
        if (this.rerollCount === 0) {
            return 0;
        }
        return this.baseRerollCost + ((this.rerollCount - 1) * 25);
    }

    /**
     * Reset reroll count and purchased upgrades tracking (when shop is closed)
     */
    resetReroll() {
        this.rerollCount = 0;

        // Clear the purchased upgrades tracking for the next shop session
        this.purchasedUpgradesThisSession.weapon.clear();
        this.purchasedUpgradesThisSession.player.clear();

        // Check if player already has homing shots and update permanent exclusions
        this.checkExistingUpgrades();
    }

    /**
     * Check if player already has certain upgrades and update permanent exclusions
     * Called when shop is initialized and when shop is reset
     */
    checkExistingUpgrades() {
        // Skip if player is not available
        if (!this.player) return;

        // Check for legendary upgrades the player might already have

        // 1. Check for homing shots (homing_1)
        let playerHasHoming = false;

        // Check player's weapon manager if available
        if (this.player.weaponManager) {
            playerHasHoming = this.player.weaponManager.bulletHoming === true;
        }
        // Fallback to direct player properties
        else {
            playerHasHoming = this.player.bulletHoming === true;
        }

        // If player already has homing, add it to permanent exclusions
        if (playerHasHoming) {
            this.permanentlyPurchasedUpgrades.add('homing_1');
            console.log('Player already has homing shots - excluding from shop');
        }

        // 2. Check for explosive rounds (area_1)
        let playerHasExplosiveRounds = false;

        // Check player's weapon manager if available
        if (this.player.weaponManager) {
            playerHasExplosiveRounds = this.player.weaponManager.bulletAoeRadius > 0;
        }
        // Fallback to direct player properties
        else {
            playerHasExplosiveRounds = this.player.bulletAoeRadius > 0;
        }

        // If player already has explosive rounds, add it to permanent exclusions
        if (playerHasExplosiveRounds) {
            this.permanentlyPurchasedUpgrades.add('area_1');
            console.log('Player already has explosive rounds - excluding from shop');
        }

        // 3. Check for Combat Drone III (drone_3)
        // This is harder to check directly, so we'll check if the player has 3 or more drones
        let playerHasMaxDrones = false;

        // Check player's weapon manager if available
        if (this.player.weaponManager && this.player.weaponManager.drones) {
            playerHasMaxDrones = this.player.weaponManager.drones.length >= 3;
        }

        // If player already has max drones, add it to permanent exclusions
        if (playerHasMaxDrones) {
            this.permanentlyPurchasedUpgrades.add('drone_3');
            console.log('Player already has max drones - excluding from shop');
        }
    }

    /**
     * Track a purchased upgrade to exclude it from future rerolls in this session
     * @param {string} type - Type of upgrade ('weapon' or 'player')
     * @param {string} upgradeId - ID of the purchased upgrade
     */
    trackPurchasedUpgrade(type, upgradeId) {
        if (type === 'weapon' || type === 'player') {
            this.purchasedUpgradesThisSession[type].add(upgradeId);
        }
    }

    /**
     * Apply a weapon upgrade to the player's weapon
     * @param {Object} upgrade - Weapon upgrade to apply
     * @returns {boolean} - Whether the upgrade was successfully applied
     */
    applyWeaponUpgrade(upgrade) {
        if (!upgrade || !upgrade.stats || !this.player) return false;

        // Track this upgrade as purchased for this shop session
        if (upgrade.id) {
            this.trackPurchasedUpgrade('weapon', upgrade.id);

            // Special handling for LEGENDARY rarity upgrades - permanently exclude them from future shops
            if (upgrade.rarity && upgrade.rarity.name === 'Legendary') {
                this.permanentlyPurchasedUpgrades.add(upgrade.id);
                console.log(`Legendary upgrade "${upgrade.name}" purchased - will no longer appear in shop`);
            }
        }

        // Check if this is a drone upgrade
        if (upgrade.isDroneUpgrade && upgrade.stats.drone && this.player.weaponManager) {
            // Add drone to weapon manager
            this.player.weaponManager.upgradeDrones();

            // Track this drone upgrade as purchased
            if (upgrade.id) {
                this.purchasedDroneUpgrades.add(upgrade.id);

                // Update current drone level based on the upgrade ID
                if (upgrade.id === 'drone_1') this.currentDroneLevel = 1;
                if (upgrade.id === 'drone_2') this.currentDroneLevel = 2;
                if (upgrade.id === 'drone_3') this.currentDroneLevel = 3;
            }

            // Emit event for drone addition
            EventBus.emit('drone-added', {
                upgrade: upgrade,
                droneCount: this.player.weaponManager.drones.length,
                maxDrones: this.player.weaponManager.maxDrones,
                currentDroneLevel: this.currentDroneLevel
            });

            return true; // Indicate success
        }

        // Use the WeaponManager to apply the upgrade if available
        if (this.player.weaponManager) {
            const success = this.player.weaponManager.applyUpgrade(upgrade);
            return success !== false; // Return true unless explicitly failed
        }

        // Backwards compatibility - apply directly to player if no weapon manager
        // Apply each stat change from the upgrade
        Object.entries(upgrade.stats).forEach(([stat, value]) => {
            switch (stat) {
                case 'damage':
                    this.player.bulletDamage *= value;
                    break;

                case 'fireRate':
                    // For fire rate, values < 1 make firing faster (reduce delay)
                    // For values > 1, we need to invert the effect to still make firing faster
                    if (value < 1) {
                        this.player.fireRate *= value; // Reduce delay between shots
                    } else {
                        // If value > 1, we need to decrease fire rate (make it faster)
                        // by dividing instead of multiplying
                        this.player.fireRate /= value;
                    }
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

                    // Only permanently exclude if it's a LEGENDARY rarity upgrade
                    if (upgrade.rarity && upgrade.rarity.name === 'Legendary') {
                        this.permanentlyPurchasedUpgrades.add('homing_1');
                        console.log('Legendary homing shot applied to player - will no longer appear in shop');
                    }
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

        return true; // Indicate success
    }

    /**
     * Apply a player upgrade to the player
     * @param {Object} upgrade - Player upgrade to apply
     * @returns {boolean} - Whether the upgrade was successfully applied
     */
    applyPlayerUpgrade(upgrade) {
        if (!upgrade || !upgrade.stats || !this.player) return false;

        // Track this upgrade as purchased for this shop session
        if (upgrade.id) {
            this.trackPurchasedUpgrade('player', upgrade.id);
        }

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
                    // Get current resistance to check if we're at the cap
                    let currentResistance = 0;
                    let playerHealthSystem = null;
                    let sceneHealthSystem = null;

                    // Get references to both health systems if they exist
                    if (this.player.healthSystem) {
                        playerHealthSystem = this.player.healthSystem;
                        currentResistance = playerHealthSystem.getDamageResistance() || 0;
                    }

                    if (this.player.scene.playerHealth) {
                        sceneHealthSystem = this.player.scene.playerHealth;
                        // If we don't have a player health system, use the scene's value
                        if (!playerHealthSystem) {
                            currentResistance = sceneHealthSystem.getDamageResistance() || 0;
                        }
                    }

                    // Check if already at max defense (25%)
                    if (currentResistance >= 0.25) {
                        console.log('Player already at maximum defense (25%). Upgrade not applied.');
                        return false; // Indicate upgrade wasn't applied
                    }

                    // Update player.defense property for tracking
                    this.player.defense = (this.player.defense || 0) + value;

                    // Update the actual damage resistance in the health system
                    // Convert defense points to percentage (e.g., 5 defense = 0.05 or 5% resistance)
                    const newResistance = currentResistance + (value / 100);

                    // Update both health systems to ensure they stay in sync
                    if (playerHealthSystem) {
                        playerHealthSystem.setDamageResistance(newResistance);
                        console.log('Updated player.healthSystem with new resistance:', newResistance);
                    }

                    if (sceneHealthSystem && sceneHealthSystem !== playerHealthSystem) {
                        sceneHealthSystem.setDamageResistance(newResistance);
                        console.log('Updated scene.playerHealth with new resistance:', newResistance);
                    }

                    if (!playerHealthSystem && !sceneHealthSystem) {
                        console.warn('No health system found to apply defense upgrade');
                        return false;
                    }

                    console.log('Defense upgrade applied. New resistance:', newResistance);
                    break;

                case 'speed':
                    this.player.speed *= value;
                    break;

                case 'pickupRadius':
                    if (this.player.scene.collectibleManager) {
                        const collectibleManager = this.player.scene.collectibleManager;

                        // Use the new method to update all collection radii
                        if (typeof collectibleManager.updateAllCollectionRadii === 'function') {
                            collectibleManager.updateAllCollectionRadii(value);
                        } else {
                            // Fallback to direct update if the method doesn't exist
                            if (collectibleManager.collectionConfig) {
                                // Update XP pickup radius
                                if (collectibleManager.collectionConfig.xp_pickup) {
                                    collectibleManager.collectionConfig.xp_pickup.radius *= value;
                                }

                                // Update cash pickup radius
                                if (collectibleManager.collectionConfig.cash_pickup) {
                                    collectibleManager.collectionConfig.cash_pickup.radius *= value;
                                }

                                // Update health pickup radius
                                if (collectibleManager.collectionConfig.health_pickup) {
                                    collectibleManager.collectionConfig.health_pickup.radius *= value;
                                }

                                console.log('Updated collection radii with multiplier:', value);
                            } else {
                                console.warn('CollectibleManager has no collectionConfig object');
                            }
                        }
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

        return true; // Indicate success
    }
}
