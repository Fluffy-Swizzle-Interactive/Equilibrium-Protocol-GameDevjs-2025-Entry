/**
 * Constants for player upgrades in the shop system
 * Defines all available player upgrades, their stats, costs, and effects
 */

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
 * - price: Base cost in credits
 * - description: Detailed description of the upgrade effect
 * - stats: Actual stat changes to apply to the player
 * - visualProperties: Styling properties for the UI
 */
export const PLAYER_UPGRADES = [
    {
        id: 'health_1',
        name: '❤️ Health Boost',
        category: UPGRADE_CATEGORIES.HEALTH,
        price: 120,
        description: 'Increases maximum health by 20 points, allowing you to survive longer in battle.',
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
        name: '❤️❤️ Major Health',
        category: UPGRADE_CATEGORIES.HEALTH,
        price: 200,
        description: 'Significantly increases maximum health by 50 points.',
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
        price: 150,
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
        name: '🛡️🛡️ Heavy Armor',
        category: UPGRADE_CATEGORIES.DEFENSE,
        price: 240,
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
        price: 100,
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
        name: '⚡⚡ Nitro Speed',
        category: UPGRADE_CATEGORIES.SPEED,
        price: 180,
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
        price: 130,
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
        price: 180,
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
        price: 220,
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
        price: 300,
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
 * Get random player upgrades for the shop
 * @param {number} count - Number of upgrades to get
 * @param {Object} rng - Random number generator object with pick method
 * @returns {Array} - Array of random player upgrades
 */
export function getRandomPlayerUpgrades(count = 3, rng) {
    if (!rng || typeof rng.pick !== 'function') {
        // Fallback if no RNG is provided
        return PLAYER_UPGRADES.slice(0, count);
    }
    
    // Create a copy to avoid modifying the original array
    const availableUpgrades = [...PLAYER_UPGRADES];
    const selectedUpgrades = [];
    
    // Select random upgrades
    for (let i = 0; i < count; i++) {
        if (availableUpgrades.length === 0) break;
        
        const randomIndex = Math.floor(rng.pick(availableUpgrades));
        const selected = availableUpgrades.splice(randomIndex, 1)[0];
        selectedUpgrades.push(selected);
    }
    
    return selectedUpgrades;
}