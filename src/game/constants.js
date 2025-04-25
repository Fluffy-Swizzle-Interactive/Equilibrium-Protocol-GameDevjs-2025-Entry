/**
 * Game Constants
 * Centralizes important constant values used throughout the game
 */

/**
 * Depth values for rendering layers
 * Higher numbers appear on top of lower numbers
 */
export const DEPTHS = {
    // Map layers (usually set automatically by the MapManager)
    MAP_GROUND: 0,
    MAP_WALLS: 1,
    MAP_DECORATION: 2,
    
    // Game entities
    BULLETS: 10,
    PROJECTILES: 11,
    PICKUP_ITEMS: 12,
    ENEMIES: 15,
    ENEMY_HEALTH_BAR_BG: 16,
    ENEMY_HEALTH_BAR_FG: 17,
    PLAYER: 20,
    PLAYER_EFFECTS: 22,
    PLAYER_UI: 25,
    
    // Effects and UI
    EFFECTS_LOW: 30,
    EFFECTS_MID: 40,
    EFFECTS_HIGH: 50,
    UI_BACKGROUND: 90,
    UI_ELEMENTS: 95,
    UI_TEXT: 100,
    UI_FLOATING_TEXT: 105,
    UI_OVERLAY: 1000
};

/**
 * Game settings
 */
export const SETTINGS = {
    // Common game settings
    DEFAULT_SCALE_FACTOR: 1.5,
    
    // Player settings
    PLAYER_SPEED: 3,
    PLAYER_FRICTION: 0.9,
    PLAYER_ACCELERATION: 0.3,
    PLAYER_RADIUS: 20,
    
    // Weapon settings
    MINIGUN_FIRE_RATE: 333,
    MINIGUN_BULLET_SPEED: 10,
    MINIGUN_BULLET_DAMAGE: 30,
    MINIGUN_BULLET_CALIBER: 5,
    MINIGUN_BULLET_HEALTH: 30,
    
    SHOTGUN_FIRE_RATE: 40,
    SHOTGUN_BULLET_SPEED: 12,
    SHOTGUN_BULLET_DAMAGE: 20,
    SHOTGUN_SPREAD_ANGLE: 30,
    SHOTGUN_BULLET_COUNT: 10,
    SHOTGUN_BULLET_CALIBER: 5,
    SHOTGUN_BULLET_HEALTH: 30,
};

/**
 * Color values
 */
export const COLORS = {
    PLAYER: 0xff0000,
    MINIGUN_BULLET: 0xffff00,
    SHOTGUN_BULLET: 0xff6600,
    ENEMY_NORMAL: 0x0000ff,
    ENEMY_SPECIAL: 0x00ffff,
    ENEMY_BOSS: 0xff00ff,
    UI_TEXT: 0xffffff,
    UI_BACKGROUND: 0x000000
};

/**
 * Enemy Group IDs
 * Defines the different factions that enemies can belong to
 */
export const GroupId = {
    AI: 'ai',
    CODER: 'coder',
    NEUTRAL: 'neutral'
};

/**
 * Group IDs for entity factions
 * Numeric identifiers used for sprite-based enemies and faction coloring
 */
export const GROUP_IDS = {
    FRIENDLY: 1,
    HOSTILE: 2,
    NEUTRAL: 3,
    FACTION_A: 4,
    FACTION_B: 5,
    FACTION_C: 6
};

/**
 * Chaos System Constants
 * Values used by the Chaos system
 */
export const CHAOS = {
    MIN_VALUE: -100,
    MAX_VALUE: 100,
    DEFAULT_VALUE: 0,
    KILL_WEIGHT: 1,           // Amount of chaos changed per kill
    PANIC_THRESHOLD: 85,      // Absolute value at which faction panic begins
    PANIC_DURATION: 3000,     // Duration of panic state in milliseconds
    
    // Multiplier constants (K values)
    MULTIPLIERS: {
        HP: 0.01,             // Health multiplier (K)
        DAMAGE: 0.01,         // Damage multiplier (K)
        FIRE_RATE: 0.01,      // Fire rate multiplier (K)
        DODGE: 0.01           // Dodge frequency multiplier (K)
    },
    
    // Chaos Event constants
    MAJOR_EVENT_VALUE: 100,   // Absolute value that triggers major chaos event
    SHAKE_INTENSITY: 0.01,    // Screen shake intensity for major events
    SHAKE_DURATION: 500,      // Screen shake duration in ms
    
    // Colors for factions
    COLORS: {
        AI: 0x3366ff,         // Blue for AI faction
        CODER: 0xff3366,      // Red for Coder faction
        NEUTRAL: 0xaaaaaa     // Gray for neutral
    }
};

/**
 * Group Modifiers
 * Defines stat modifications based on group types
 */
export const GROUP_MODIFIERS = {
    [GroupId.AI]: {
        health: 1.2,
        speed: 0.9,
        damage: 1.3,
        color: 0xff3333 // Red tint
    },
    [GroupId.CODER]: {
        health: 0.9,
        speed: 1.2,
        damage: 1.0,
        color: 0x33aaff // Blue tint
    },
    [GroupId.NEUTRAL]: {
        health: 0.7,
        speed: 1.5,
        damage: 0.5,
        color: 0x55ff55 // Green tint
    }
};