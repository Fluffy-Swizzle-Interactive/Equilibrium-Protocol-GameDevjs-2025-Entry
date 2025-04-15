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
    MINIGUN_FIRE_RATE: 10,
    MINIGUN_BULLET_SPEED: 10,
    MINIGUN_BULLET_DAMAGE: 30,
    
    SHOTGUN_FIRE_RATE: 40,
    SHOTGUN_BULLET_SPEED: 12,
    SHOTGUN_BULLET_DAMAGE: 20,
    SHOTGUN_SPREAD_ANGLE: 30,
    SHOTGUN_BULLET_COUNT: 10
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