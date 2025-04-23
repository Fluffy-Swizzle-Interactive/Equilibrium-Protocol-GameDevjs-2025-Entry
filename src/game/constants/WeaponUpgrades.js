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
        multiplier: 1.0
    },
    RARE: {
        name: 'Rare',
        color: '#4488ff',
        hexColor: 0x4488ff,
        multiplier: 1.5
    },
    EPIC: {
        name: 'Epic',
        color: '#aa44ff',
        hexColor: 0xaa44ff,
        multiplier: 2.0
    },
    LEGENDARY: {
        name: 'Legendary',
        color: '#ffaa00',
        hexColor: 0xffaa00,
        multiplier: 3.0
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
        effects: 'Increases length of player shooting line by 10%',
        stats: {
            bulletRange: 1.1 // 10% range boost
        },
        visualProperties: {
            borderColor: 0x33aa33,
            fillColor: 0x002200
        }
    },
    {
        id: 'pierce_1',
        name: '📌 Piercing Shot',
        category: UPGRADE_CATEGORIES.PIERCE,
        rarity: RARITY.RARE,
        price: 150,
        effects: '+1 Enemy Pierce',
        stats: {
            bulletPierce: 1 // +1 to pierce count
        },
        visualProperties: {
            borderColor: 0xaa44aa,
            fillColor: 0x220022
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
        rarity: RARITY.EPIC,
        price: 200,
        effects: 'Small explosion on hit',
        stats: {
            aoeRadius: 30, // Small explosion radius
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
        price: 300,
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
        rarity: RARITY.LEGENDARY,
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
        rarity: RARITY.EPIC,
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
        rarity: RARITY.LEGENDARY,
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
    }
];

/**
 * Get random weapon upgrades for the shop
 * @param {number} count - Number of upgrades to get
 * @param {Object} rng - Random number generator object with pick method
 * @returns {Array} - Array of random weapon upgrades
 */
export function getRandomWeaponUpgrades(count = 3, rng) {
    if (!rng || typeof rng.pick !== 'function') {
        // Fallback if no RNG is provided
        return WEAPON_UPGRADES.slice(0, count);
    }
    
    // Create a copy to avoid modifying the original array
    const availableUpgrades = [...WEAPON_UPGRADES];
    const selectedUpgrades = [];
    
    // Select random upgrades
    for (let i = 0; i < count; i++) {
        if (availableUpgrades.length === 0) break;
        
        // Get a random index
        const randomIndex = Math.floor(rng.range(0, availableUpgrades.length - 1));
        const selected = availableUpgrades.splice(randomIndex, 1)[0];
        selectedUpgrades.push(selected);
    }
    
    return selectedUpgrades;
}