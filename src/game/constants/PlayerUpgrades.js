/**
 * Constants for player upgrades in the shop system
 * Defines all available player upgrades, their stats, costs, and effects
 */

// Import rarity from WeaponUpgrades to maintain consistency
import { RARITY } from './WeaponUpgrades';

// Player upgrade categories
export const UPGRADE_CATEGORIES = {
    HEALTH: 'Health',
    DEFENSE: 'Defense',
    SPEED: 'Speed',
    PICKUP: 'Pickup',
    SPECIAL: 'Special'
};

/**
 * List of all available player upgrades
 * Each upgrade has:
 * - id: Unique identifier
 * - name: Display name with emoji for visual appeal
 * - category: Type of upgrade (from UPGRADE_CATEGORIES)
 * - rarity: Rarity level affecting cost and power (from RARITY)
 * - skillPointCost: Base cost in skill points
 * - description: Detailed description of the upgrade effect
 * - stats: Actual stat changes to apply to the player
 * - visualProperties: Styling properties for the UI
 */
export const PLAYER_UPGRADES = [
    {
        id: 'health_1',
        name: '❤️ Health Boost',
        category: UPGRADE_CATEGORIES.HEALTH,
        rarity: RARITY.COMMON,
        skillPointCost: 1,
        description: 'Increases maximum health',
        stats: {
            maxHealth: 20 // +20 health points
        },
        visualProperties: {
            borderColor: 0xaa6666,
            fillColor: 0x221111
        }
    },
    {
        id: 'health_2',
        name: '❤️ Major Health',
        category: UPGRADE_CATEGORIES.HEALTH,
        rarity: RARITY.RARE,
        skillPointCost: 1,
        description: 'Significantly increases maximum health.',
        stats: {
            maxHealth: 50 // +50 health points
        },
        visualProperties: {
            borderColor: 0xcc6666,
            fillColor: 0x331111
        }
    },
    {
        id: 'defense_1',
        name: '🛡️ Armor Plating',
        category: UPGRADE_CATEGORIES.DEFENSE,
        rarity: RARITY.COMMON,
        skillPointCost: 1,
        description: 'Adds 5 defense points, reducing damage taken from all enemy attacks by 5%.',
        stats: {
            defense: 5 // +5% damage reduction
        },
        visualProperties: {
            borderColor: 0x6666aa,
            fillColor: 0x111122
        }
    },
    {
        id: 'defense_2',
        name: '🛡️ Heavy Armor',
        category: UPGRADE_CATEGORIES.DEFENSE,
        rarity: RARITY.RARE,
        skillPointCost: 1,
        description: 'Adds 10 defense points, reducing damage taken from all enemy attacks by 10%.',
        stats: {
            defense: 10 // +10% damage reduction
        },
        visualProperties: {
            borderColor: 0x6666cc,
            fillColor: 0x111133
        }
    },
    {
        id: 'speed_1',
        name: '⚡ Speed Boost',
        category: UPGRADE_CATEGORIES.SPEED,
        rarity: RARITY.COMMON,
        skillPointCost: 1,
        description: 'Increases movement speed by 15%, helping you dodge enemies more effectively.',
        stats: {
            speed: 1.15 // 15% speed multiplier
        },
        visualProperties: {
            borderColor: 0xaaaa66,
            fillColor: 0x222211
        }
    },
    {
        id: 'speed_2',
        name: '⚡ Nitro Speed',
        category: UPGRADE_CATEGORIES.SPEED,
        rarity: RARITY.RARE,
        skillPointCost: 1,
        description: 'Further increases movement speed by 25%, making you significantly faster.',
        stats: {
            speed: 1.25 // 25% speed multiplier
        },
        visualProperties: {
            borderColor: 0xcccc66,
            fillColor: 0x333311
        }
    },
    {
        id: 'pickup_radius_1',
        name: '🧲 Magnet Pull',
        category: UPGRADE_CATEGORIES.PICKUP,
        rarity: RARITY.COMMON,
        skillPointCost: 1,
        description: 'Increases pickup collection radius by 25%, making it easier to collect drops.',
        stats: {
            pickupRadius: 1.25 // 25% increase to pickup radius
        },
        visualProperties: {
            borderColor: 0x66aaaa,
            fillColor: 0x112222
        }
    },
    {
        id: 'regen_1',
        name: '💉 Regeneration',
        category: UPGRADE_CATEGORIES.HEALTH,
        rarity: RARITY.LEGENDARY,
        skillPointCost: 3,
        description: 'Slowly regenerate 1 health point every 2 seconds.',
        stats: {
            healthRegen: 0.5 // 0.5 health per second
        },
        visualProperties: {
            borderColor: 0xaa66aa,
            fillColor: 0x221122
        }
    },
    {
        id: 'dash_1',
        name: '💨 Emergency Dash',
        category: UPGRADE_CATEGORIES.SPECIAL,
        rarity: RARITY.EPIC,
        skillPointCost: 2,
        description: 'Adds a dash ability to quickly escape dangerous situations (Cooldown: 10s).',
        stats: {
            dash: true,
            dashPower: 1.5,
            dashCooldown: 10000 // 10 seconds in ms
        },
        visualProperties: {
            borderColor: 0x66aacc,
            fillColor: 0x112233
        }
    },
    {
        id: 'shield_1',
        name: '🔰 Energy Shield',
        category: UPGRADE_CATEGORIES.SPECIAL,
        rarity: RARITY.LEGENDARY,
        skillPointCost: 3,
        description: 'Creates a temporary shield that blocks all damage for 3 seconds (Cooldown: 30s).',
        stats: {
            shield: true,
            shieldDuration: 3000, // 3 seconds in ms
            shieldCooldown: 30000 // 30 seconds in ms
        },
        visualProperties: {
            borderColor: 0x66ccaa,
            fillColor: 0x113322
        }
    }
];

/**
 * Scale upgrade stats based on player level
 * @param {Object} upgrade - The upgrade to scale
 * @param {number} playerLevel - Current player level
 * @returns {Object} - Scaled upgrade object
 */
export function scalePlayerUpgradeByLevel(upgrade, playerLevel) {
    // If no level provided or level is less than 10, return original upgrade
    if (!playerLevel || playerLevel < 10) {
        return upgrade;
    }

    // Check if this is an EPIC or LEGENDARY upgrade - if so, don't scale it
    if (upgrade.rarity && (upgrade.rarity.name === 'Epic' || upgrade.rarity.name === 'Legendary')) {
        // Return a copy to avoid modifying the original
        return JSON.parse(JSON.stringify(upgrade));
    }

    // Calculate level tier (increases every 10 levels)
    const levelTier = Math.floor(playerLevel / 10);

    // Create a deep copy of the upgrade to avoid modifying the original
    const scaledUpgrade = JSON.parse(JSON.stringify(upgrade));

    // Scale stats based on level tier
    if (scaledUpgrade.stats) {
        Object.entries(scaledUpgrade.stats).forEach(([stat, value]) => {
            // Different scaling for different stat types
            switch (stat) {
                case 'speed':
                case 'pickupRadius':
                    // Multiplicative stats: increase by 5% per tier
                    if (typeof value === 'number' && value > 1) {
                        const increase = 0.05 * levelTier;
                        scaledUpgrade.stats[stat] = value + increase;
                    }
                    break;

                case 'maxHealth':
                    // Health scales more aggressively
                    if (typeof value === 'number') {
                        const increase = value * 0.2 * levelTier;
                        scaledUpgrade.stats[stat] = Math.round(value + increase);
                    }
                    break;

                case 'defense':
                    // Defense scales moderately
                    if (typeof value === 'number') {
                        const increase = value * 0.15 * levelTier;
                        scaledUpgrade.stats[stat] = Math.round(value + increase);
                    }
                    break;

                case 'healthRegen':
                    // Health regen scales moderately
                    if (typeof value === 'number') {
                        const increase = value * 0.1 * levelTier;
                        scaledUpgrade.stats[stat] = value + increase;
                    }
                    break;

                case 'dashPower':
                    // Dash power scales slightly
                    if (typeof value === 'number') {
                        const increase = value * 0.05 * levelTier;
                        scaledUpgrade.stats[stat] = value + increase;
                    }
                    break;

                case 'dashCooldown':
                case 'shieldCooldown':
                    // Cooldowns decrease (improve) slightly
                    if (typeof value === 'number') {
                        const reduction = value * 0.05 * levelTier;
                        scaledUpgrade.stats[stat] = Math.max(value * 0.5, value - reduction);
                    }
                    break;

                case 'shieldDuration':
                    // Shield duration increases
                    if (typeof value === 'number') {
                        const increase = value * 0.1 * levelTier;
                        scaledUpgrade.stats[stat] = value + increase;
                    }
                    break;

                // Boolean values don't need scaling
                case 'dash':
                case 'shield':
                    break;

                default:
                    // For any other stats, apply a small increase
                    if (typeof value === 'number') {
                        const increase = value * 0.05 * levelTier;
                        scaledUpgrade.stats[stat] = value + increase;
                    }
            }
        });
    }

    // Update the description to show it's been scaled
    if (scaledUpgrade.description) {
        scaledUpgrade.description += ` (Lv.${playerLevel} Bonus)`;
    }

    // Skill point cost doesn't scale with level

    return scaledUpgrade;
}

/**
 * Get random player upgrades for the shop
 * @param {number} count - Number of upgrades to get
 * @param {Object} rng - Random number generator object with pick method
 * @param {number} playerLevel - Current player level for scaling upgrades
 * @param {Object} playerStats - Optional player stats to filter upgrades
 * @returns {Array} - Array of random player upgrades
 */
export function getRandomPlayerUpgrades(count = 3, rng, playerLevel = 1, playerStats = null) {
    if (!rng || (typeof rng.pick !== 'function' && typeof rng.range !== 'function')) {
        // Fallback if no RNG is provided
        return PLAYER_UPGRADES.slice(0, count);
    }

    // Ensure we have a range function
    if (!rng.range && rng.pick) {
        // Add a range function if only pick is available
        rng.range = (min, max) => {
            return Math.random() * (max - min) + min;
        };
    }

    // Create a copy to avoid modifying the original array
    let availableUpgrades = [...PLAYER_UPGRADES];
    const selectedUpgrades = [];

    // Filter out defense upgrades if player has reached the defense cap (25%)
    if (playerStats && playerStats.defense !== undefined) {
        // If defense is 25% or higher, filter out all defense upgrades
        if (playerStats.defense >= 25) {
            availableUpgrades = availableUpgrades.filter(upgrade =>
                upgrade.category !== UPGRADE_CATEGORIES.DEFENSE);
        }
    }

    // Filter out regeneration upgrades if player already has health regeneration
    if (playerStats && playerStats.healthRegen !== undefined) {
        // If player has any health regeneration, filter out all regeneration upgrades
        if (playerStats.healthRegen > 0) {
            availableUpgrades = availableUpgrades.filter(upgrade =>
                !(upgrade.stats && upgrade.stats.healthRegen));
        }
    }

    // Filter out any LEGENDARY rarity upgrades that have been purchased
    // This is handled by the permanentlyPurchasedUpgrades set in UpgradeManager
    // But we'll also filter them out here based on rarity
    if (playerStats && playerStats.purchasedLegendaryUpgrades) {
        // Filter out all LEGENDARY rarity upgrades and special abilities (dash, shield, regen)
        availableUpgrades = availableUpgrades.filter(upgrade => {
            // Check if this is a LEGENDARY upgrade that's been purchased
            const isLegendaryPurchased = upgrade.rarity &&
                upgrade.rarity.name === 'Legendary' &&
                playerStats.purchasedLegendaryUpgrades.has(upgrade.id);

            // Check if this is the Emergency Dash upgrade and it's been purchased
            const isDashPurchased = upgrade.id === 'dash_1' &&
                playerStats.purchasedLegendaryUpgrades.has('dash_1');

            // Check if this is the Shield upgrade and it's been purchased
            const isShieldPurchased = upgrade.id === 'shield_1' &&
                playerStats.purchasedLegendaryUpgrades.has('shield_1');

            // Check if this is the Regeneration upgrade and it's been purchased
            const isRegenPurchased = upgrade.id === 'regen_1' &&
                playerStats.purchasedLegendaryUpgrades.has('regen_1');

            // Filter out if any of the above conditions are true
            return !(isLegendaryPurchased || isDashPurchased || isShieldPurchased || isRegenPurchased);
        });
    }

    // Create a weighted pool based on rarity
    const weightedPool = [];

    // Add each upgrade to the weighted pool based on its rarity weight
    availableUpgrades.forEach((upgrade, index) => {
        const rarityWeight = upgrade.rarity?.weight || 100; // Default to 100 if not specified

        // Add this upgrade to the pool multiple times based on its weight
        for (let i = 0; i < rarityWeight; i++) {
            weightedPool.push(index);
        }
    });

    // Create a map of upgrades by their index for safer access
    const upgradeMap = new Map();
    availableUpgrades.forEach((upgrade, index) => {
        upgradeMap.set(index, upgrade);
    });

    // Select random upgrades from the weighted pool
    for (let i = 0; i < count; i++) {
        if (weightedPool.length === 0 || upgradeMap.size === 0) break;

        // Get a random index from the weighted pool
        const randomPoolIndex = Math.floor(rng.range(0, weightedPool.length - 1));
        const selectedIndex = weightedPool[randomPoolIndex];

        // Get the upgrade at this index
        const selected = upgradeMap.get(selectedIndex);

        // Skip if somehow the upgrade is undefined
        if (!selected) continue;

        // Remove all instances of this index from the weighted pool
        for (let j = weightedPool.length - 1; j >= 0; j--) {
            if (weightedPool[j] === selectedIndex) {
                weightedPool.splice(j, 1);
            }
        }

        // Remove the selected upgrade from the map
        upgradeMap.delete(selectedIndex);

        // Create a deep copy of the selected upgrade
        const upgradeCopy = JSON.parse(JSON.stringify(selected));

        // Determine if we should randomize the rarity
        let randomRarity;

        if (upgradeCopy.rarity.name === 'Epic' || upgradeCopy.rarity.name === 'Legendary') {
            // Keep original rarity for EPIC and LEGENDARY upgrades
            randomRarity = upgradeCopy.rarity;
        } else {
            // Only randomly assign a new rarity for COMMON and RARE upgrades
            const rarityValues = Object.values(RARITY);

            // Create a weighted pool for rarities
            const rarityPool = [];
            rarityValues.forEach(rarity => {
                // Add each rarity to the pool based on its weight
                for (let i = 0; i < rarity.weight; i++) {
                    rarityPool.push(rarity);
                }
            });

            // Select a random rarity from the weighted pool
            const randomRarityIndex = Math.floor(rng.range(0, rarityPool.length - 1));
            randomRarity = rarityPool[randomRarityIndex];
        }

        // Apply the rarity
        upgradeCopy.rarity = randomRarity;

        // Skill point cost doesn't change with rarity

        // Player upgrade stats don't scale with rarity - they only use the base values

        // Check if this was originally an EPIC or LEGENDARY upgrade
        const wasEpicOrLegendary = selected.rarity.name === 'Epic' || selected.rarity.name === 'Legendary';

        // Update the description to reflect the rarity (visual only)
        if (upgradeCopy.description) {
            // For EPIC and LEGENDARY upgrades, keep the original description
            if (wasEpicOrLegendary) {
                // Keep the original description
                upgradeCopy.description = selected.description;
            } else {
                // For COMMON and RARE upgrades that got randomized, update the description
                // Extract the base description without any previous rarity or level indicators
                let baseDescription = upgradeCopy.description;
                if (baseDescription.includes('(')) {
                    baseDescription = baseDescription.substring(0, baseDescription.indexOf('(')).trim();
                }

                // Add rarity indicator (visual only - stats don't change with rarity)
                upgradeCopy.description = `${baseDescription} (${randomRarity.name})`;
            }
        }

        // Scale the upgrade based on player level
        const scaledUpgrade = scalePlayerUpgradeByLevel(upgradeCopy, playerLevel);

        // Add to selected upgrades
        selectedUpgrades.push(scaledUpgrade);
    }

    return selectedUpgrades;
}