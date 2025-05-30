/**
 * Constants for weapon upgrades in the shop system
 * Defines all available weapon upgrades, their stats, costs, and effects
 */

// Rarity colors and values
export const RARITY = {
    COMMON: {
        name: 'Common',
        color: '#aaaaaa',
        hexColor: 0xaaaaaa,
        multiplier: 1.0,
        weight: 60 // Highest chance to appear
    },
    RARE: {
        name: 'Rare',
        color: '#4488ff',
        hexColor: 0x4488ff,
        multiplier: 1.5,
        weight: 20 // 20% chance compared to common
    },
    EPIC: {
        name: 'Epic',
        color: '#aa44ff',
        hexColor: 0xaa44ff,
        multiplier: 2.0,
        weight: 15 // 15% chance compared to common
    },
    LEGENDARY: {
        name: 'Legendary',
        color: '#ffaa00',
        hexColor: 0xffaa00,
        multiplier: 3.0,
        weight: 5 // 5% chance compared to common
    }
};

// Weapon upgrade categories
export const UPGRADE_CATEGORIES = {
    DAMAGE: 'Damage',
    FIRE_RATE: 'Fire Rate',
    RANGE: 'Range',
    PIERCE: 'Pierce',
    AREA: 'Area of Effect',
    CRITICAL: 'Critical',
    PROJECTILE: 'Projectile',
    DRONE: 'Drone' // New category for drone upgrades
};

/**
 * List of all available weapon upgrades
 * Each upgrade has:
 * - id: Unique identifier
 * - name: Display name with emoji for visual appeal
 * - category: Type of upgrade (from UPGRADE_CATEGORIES)
 * - rarity: Rarity level affecting cost and power (from RARITY)
 * - price: Base cost in credits
 * - effects: Human-readable description of effects
 * - stats: Actual stat changes to apply to the weapon
 * - visualProperties: Styling properties for the UI cards
 */
export const WEAPON_UPGRADES = [
    {
        id: 'damage_1',
        name: '🗡️ Damage Boost',
        category: UPGRADE_CATEGORIES.DAMAGE,
        rarity: RARITY.COMMON,
        price: 100,
        effects: '+10% Damage',
        stats: {
            damage: 1.1 // 10% damage boost multiplier
        },
        visualProperties: {
            borderColor: 0xaa3333,
            fillColor: 0x220000
        }
    },
    {
        id: 'fire_rate_1',
        name: '⚡ Rapid Fire',
        category: UPGRADE_CATEGORIES.FIRE_RATE,
        rarity: RARITY.COMMON,
        price: 120,
        effects: '+15% Fire Rate',
        stats: {
            fireRate: 0.85 // Lower number means faster fire rate
        },
        visualProperties: {
            borderColor: 0x3333aa,
            fillColor: 0x000022
        }
    },
    {
        id: 'range_1',
        name: '🏹 Extended Range',
        category: UPGRADE_CATEGORIES.RANGE,
        rarity: RARITY.COMMON,
        price: 80,
        effects: '+20% Range',
        stats: {
            bulletRange: 1.2 // 20% range boost
        },
        visualProperties: {
            borderColor: 0x33aa33,
            fillColor: 0x002200
        }
    },
    {
        id: 'range_2',
        name: '🏹🏹 Superior Range',
        category: UPGRADE_CATEGORIES.RANGE,
        rarity: RARITY.EPIC,
        price: 200,
        effects: '+40% Range',
        stats: {
            bulletRange: 1.4 // 40% range boost
        },
        visualProperties: {
            borderColor: 0x55cc55,
            fillColor: 0x003300
        }
    },
    {
        id: 'pierce_1',
        name: '📌 Piercing Shot',
        category: UPGRADE_CATEGORIES.PIERCE,
        rarity: RARITY.RARE,
        price: 180, // Increased price to reflect higher value
        effects: '+1 to pierce count',
        stats: {
            bulletPierce: 1 // +1 to pierce count (allows hitting 2 enemies total)
        },
        visualProperties: {
            borderColor: 0xaa44aa,
            fillColor: 0x220022
        }
    },
    {
        id: 'pierce_2',
        name: '📌 Advanced Piercing',
        category: UPGRADE_CATEGORIES.PIERCE,
        rarity: RARITY.EPIC,
        price: 300,
        effects: '+2 to pierce count',
        stats: {
            bulletPierce: 2 // +2 to pierce count (allows hitting 3 enemies total)
        },
        visualProperties: {
            borderColor: 0xcc66cc,
            fillColor: 0x330033
        }
    },
    {
        id: 'pierce_3',
        name: '📌 Master Piercing',
        category: UPGRADE_CATEGORIES.PIERCE,
        rarity: RARITY.LEGENDARY,
        price: 450,
        effects: '+5 to pierce count',
        stats: {
            bulletPierce: 4 // +4 to pierce count (allows hitting 5 enemies total)
        },
        visualProperties: {
            borderColor: 0xffaa00,
            fillColor: 0x553300
        }
    },
    {
        id: 'speed_1',
        name: '💨 Swift Bullets',
        category: UPGRADE_CATEGORIES.PROJECTILE,
        rarity: RARITY.RARE,
        price: 120,
        effects: '+25% Bullet Speed',
        stats: {
            bulletSpeed: 1.25 // 25% bullet speed boost
        },
        visualProperties: {
            borderColor: 0x33aaaa,
            fillColor: 0x002222
        }
    },
    {
        id: 'critical_1',
        name: '⚔️ Critical Strike',
        category: UPGRADE_CATEGORIES.CRITICAL,
        rarity: RARITY.EPIC,
        price: 180,
        effects: '+10% Critical Chance',
        stats: {
            criticalChance: 10 // +10% critical hit chance
        },
        visualProperties: {
            borderColor: 0xaaaa33,
            fillColor: 0x222200
        }
    },
    {
        id: 'area_1',
        name: '🔥 Explosive Rounds',
        category: UPGRADE_CATEGORIES.AREA,
        rarity: RARITY.LEGENDARY,
        price: 650,
        effects: '+80 AoE -50% damage',
        stats: {
            aoeRadius: 80, // Small explosion radius
            aoeDamage: 0.5 // 50% of bullet damage
        },
        visualProperties: {
            borderColor: 0xff4400,
            fillColor: 0x221100
        }
    },
    {
        id: 'damage_2',
        name: '⚔️ Major Damage',
        category: UPGRADE_CATEGORIES.DAMAGE,
        rarity: RARITY.EPIC,
        price: 220,
        effects: '+25% Damage',
        stats: {
            damage: 1.25 // 25% damage boost multiplier
        },
        visualProperties: {
            borderColor: 0xdd3333,
            fillColor: 0x330000
        }
    },
    {
        id: 'homing_1',
        name: '🎯 Homing Shot',
        category: UPGRADE_CATEGORIES.PROJECTILE,
        rarity: RARITY.LEGENDARY,
        price: 1000,
        effects: 'Bullets seek enemies',
        stats: {
            homing: true,
            homingForce: 0.05
        },
        visualProperties: {
            borderColor: 0xffaa00,
            fillColor: 0x332200
        }
    },
    {
        id: 'critical_damage_1',
        name: '💥 Critical Power',
        category: UPGRADE_CATEGORIES.CRITICAL,
        rarity: RARITY.EPIC,
        price: 250,
        effects: '+50% Critical Damage',
        stats: {
            criticalDamageMultiplier: 1.5 // Additional 50% damage on crits
        },
        visualProperties: {
            borderColor: 0xdd5500,
            fillColor: 0x331100
        }
    },
    // New Drone upgrades
    {
        id: 'drone_1',
        name: '🤖 Combat Drone I',
        category: UPGRADE_CATEGORIES.DRONE,
        rarity: RARITY.RARE,
        price: 300,
        effects: 'Adds 1 Combat Drone',
        stats: {
            drone: true,
            droneCount: 1
        },
        isDroneUpgrade: true,
        visualProperties: {
            borderColor: 0x44aadd,
            fillColor: 0x112233
        }
    },
    {
        id: 'drone_2',
        name: '🤖 Combat Drone II',
        category: UPGRADE_CATEGORIES.DRONE,
        rarity: RARITY.EPIC,
        price: 500,
        effects: 'Adds a 2nd Combat Drone',
        stats: {
            drone: true,
            droneCount: 1
        },
        isDroneUpgrade: true,
        visualProperties: {
            borderColor: 0x44ddff,
            fillColor: 0x113344
        }
    },
    {
        id: 'drone_3',
        name: '🤖 Combat Drone III',
        category: UPGRADE_CATEGORIES.DRONE,
        rarity: RARITY.LEGENDARY,
        price: 750,
        effects: 'Adds a 3rd Combat Drone',
        stats: {
            drone: true,
            droneCount: 1
        },
        isDroneUpgrade: true,
        visualProperties: {
            borderColor: 0x22ffff,
            fillColor: 0x114455
        }
    },
    {
        id: 'drone_4',
        name: '🤖 Combat Drone IV',
        category: UPGRADE_CATEGORIES.DRONE,
        rarity: RARITY.LEGENDARY,
        price: 1000,
        effects: 'Adds a 4th Combat Drone',
        stats: {
            drone: true,
            droneCount: 1
        },
        isDroneUpgrade: true,
        minWave: 15, // Only available after wave 15
        visualProperties: {
            borderColor: 0x00ffaa,
            fillColor: 0x115544
        }
    },
    {
        id: 'drone_5',
        name: '🤖 Combat Drone V',
        category: UPGRADE_CATEGORIES.DRONE,
        rarity: RARITY.LEGENDARY,
        price: 1500,
        effects: 'Adds a 5th Combat Drone',
        stats: {
            drone: true,
            droneCount: 1
        },
        isDroneUpgrade: true,
        minWave: 15, // Only available after wave 15
        visualProperties: {
            borderColor: 0x00ffcc,
            fillColor: 0x116655
        }
    },
];

/**
 * Scale upgrade stats based on player level
 * @param {Object} upgrade - The upgrade to scale
 * @param {number} playerLevel - Current player level
 * @returns {Object} - Scaled upgrade object
 */
export function scaleUpgradeByLevel(upgrade, playerLevel) {
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
                case 'damage':
                case 'bulletRange':
                case 'bulletSpeed':
                case 'criticalDamageMultiplier':
                    // Multiplicative stats: increase by 5% per tier
                    if (typeof value === 'number' && value > 1) {
                        const increase = 0.05 * levelTier;
                        scaledUpgrade.stats[stat] = value + increase;
                    }
                    break;

                case 'fireRate':
                    // FireRate is inverted (lower is better)
                    if (typeof value === 'number') {
                        if (value < 1) {
                            // For values < 1, improve by reducing further
                            const improvement = 0.03 * levelTier;
                            scaledUpgrade.stats[stat] = Math.max(0.5, value - improvement);
                        } else {
                            // For values > 1, improve by increasing
                            const improvement = 0.05 * levelTier;
                            scaledUpgrade.stats[stat] = value + improvement;
                        }
                    }
                    break;

                case 'bulletPierce':
                case 'criticalChance':
                case 'aoeRadius':
                case 'aoeDamage':
                case 'homingForce':
                    // Additive stats: increase by 10% per tier
                    if (typeof value === 'number') {
                        const increase = value * 0.1 * levelTier;
                        scaledUpgrade.stats[stat] = value + increase;
                    }
                    break;

                // Boolean values don't need scaling
                case 'homing':
                case 'drone':
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

    // Update the effects description to show it's been scaled
    if (scaledUpgrade.effects) {
        scaledUpgrade.effects += ` (Lv.${playerLevel} Bonus)`;
    }

    // Scale price based on level tier - 5% increase per 10 levels
    if (scaledUpgrade.price) {
        scaledUpgrade.price = Math.round(scaledUpgrade.price * (1 + 0.05 * levelTier));
    }

    return scaledUpgrade;
}

/**
 * Get random weapon upgrades for the shop
 * @param {number} count - Number of upgrades to get
 * @param {Object} rng - Random number generator object with pick method
 * @param {number} playerLevel - Current player level for scaling upgrades
 * @param {number} currentWave - Current wave number (optional)
 * @returns {Array} - Array of random weapon upgrades
 */
export function getRandomWeaponUpgrades(count = 3, rng, playerLevel = 1, currentWave = 1) {
    if (!rng || (typeof rng.pick !== 'function' && typeof rng.range !== 'function')) {
        // Fallback if no RNG is provided
        return WEAPON_UPGRADES.slice(0, count);
    }

    // Ensure we have a range function
    if (!rng.range && rng.pick) {
        // Add a range function if only pick is available
        rng.range = (min, max) => {
            return Math.random() * (max - min) + min;
        };
    }

    // Create a copy to avoid modifying the original array
    // Filter out upgrades that have a minWave requirement that hasn't been met
    const availableUpgrades = WEAPON_UPGRADES.filter(upgrade => {
        // Include the upgrade if it doesn't have a minWave property or if the current wave is >= minWave
        return !upgrade.minWave || currentWave >= upgrade.minWave;
    });

    const selectedUpgrades = [];

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

        // For drone upgrades, keep the original rarity
        // For other upgrades, randomly assign a new rarity
        let randomRarity;

        if (upgradeCopy.isDroneUpgrade) {
            // Keep original rarity for drone upgrades
            randomRarity = upgradeCopy.rarity;
        } else if (upgradeCopy.rarity.name === 'Epic' || upgradeCopy.rarity.name === 'Legendary') {
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

            // Apply the new rarity
            upgradeCopy.rarity = randomRarity;
        }

        // Check if this was originally an EPIC or LEGENDARY upgrade
        const wasEpicOrLegendary = selected.rarity.name === 'Epic' || selected.rarity.name === 'Legendary';

        // Only adjust price and stats if it wasn't originally EPIC or LEGENDARY
        if (!wasEpicOrLegendary) {
            // Adjust price based on new rarity
            const rarityPriceMultiplier = randomRarity.multiplier;
            upgradeCopy.price = Math.round(upgradeCopy.price * rarityPriceMultiplier);

            // Adjust stats based on new rarity if they are numeric
            if (upgradeCopy.stats) {
                Object.entries(upgradeCopy.stats).forEach(([stat, value]) => {
                    if (typeof value === 'number' && !isNaN(value)) {
                        // Special handling for fireRate
                        if (stat === 'fireRate') {
                            // For fireRate < 1, we want to make it even smaller (better) with higher rarities
                            if (value < 1) {
                                // Calculate how much below 1 the value is
                                const reduction = 1 - value;
                                // Scale the reduction by the rarity multiplier
                                const scaledReduction = reduction * rarityPriceMultiplier;
                                // Apply the scaled reduction, ensuring it doesn't go below 0.5
                                upgradeCopy.stats[stat] = Math.max(0.5, 1 - scaledReduction);
                            } else {
                                // For fireRate > 1, we want to make it even larger with higher rarities
                                // since it will be inverted when applied
                                const bonus = value - 1;
                                const scaledBonus = bonus * rarityPriceMultiplier;
                                upgradeCopy.stats[stat] = 1 + scaledBonus;
                            }
                        }
                        // For multiplicative stats (values > 1), scale the bonus portion
                        else if (value > 1) {
                            // Extract the bonus portion (e.g., 1.1 has a 0.1 bonus)
                            const bonus = value - 1;
                            // Scale the bonus by the rarity multiplier
                            const scaledBonus = bonus * rarityPriceMultiplier;
                            // Apply the scaled bonus
                            upgradeCopy.stats[stat] = 1 + scaledBonus;
                        }
                        // For additive stats, simply multiply by the rarity multiplier
                        else {
                            upgradeCopy.stats[stat] = value * rarityPriceMultiplier;
                        }
                    }
                });
            }
        }

        // Update the effects description to reflect the rarity
        if (upgradeCopy.effects) {
            // For EPIC and LEGENDARY upgrades, keep the original effects description
            if (wasEpicOrLegendary) {
                // Keep the original effects description
                upgradeCopy.effects = selected.effects;
            } else {
                // For COMMON and RARE upgrades that got randomized, update the description
                // Extract the base effect without any previous rarity or level indicators
                let baseEffect = upgradeCopy.effects;
                if (baseEffect.includes('(')) {
                    baseEffect = baseEffect.substring(0, baseEffect.indexOf('(')).trim();
                }

                // Add rarity indicator
                upgradeCopy.effects = `${baseEffect} (${randomRarity.name})`;
            }
        }

        // Scale the upgrade based on player level
        const scaledUpgrade = scaleUpgradeByLevel(upgradeCopy, playerLevel);

        // Add to selected upgrades
        selectedUpgrades.push(scaledUpgrade);
    }

    return selectedUpgrades;
}