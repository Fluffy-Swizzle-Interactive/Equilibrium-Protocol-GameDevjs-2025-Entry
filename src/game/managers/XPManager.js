import { EventBus } from '../EventBus';

/**
 * XPManager class
 * Manages player experience points, level progression, and level-up events
 */
export class XPManager {
    /**
     * Create a new XP manager
     * @param {Phaser.Scene} scene - The scene this XP manager belongs to
     * @param {number} initialXP - Initial XP amount (default: 0)
     * @param {number} initialLevel - Initial level (default: 1)
     * @param {number} baseXPRequirement - Base XP needed for level 1→2 (default: 100)
     * @param {number} levelMultiplier - Multiplier for XP requirements per level (default: 1.2)
     */
    constructor(
        scene, 
        initialXP = 0, 
        initialLevel = 1, 
        baseXPRequirement = 100, 
        levelMultiplier = 1.2
    ) {
        this.scene = scene;
        this.currentXP = initialXP;
        this.currentLevel = initialLevel;
        this.baseXPRequirement = baseXPRequirement;
        this.levelMultiplier = levelMultiplier;

        // Calculate XP required for next level
        this.xpToNextLevel = this.calculateXPForLevel(this.currentLevel);
        
        // Register with scene for easier access
        scene.xpManager = this;
        
        // Initial XP update event
        this.emitXPUpdate();
    }
    
    /**
     * Calculate XP required for a specific level
     * @param {number} level - The level to calculate XP requirement for
     * @returns {number} The XP required to reach the next level
     */
    calculateXPForLevel(level) {
        // Using exponential growth formula: baseXP * multiplier^(level-1)
        return Math.round(this.baseXPRequirement * Math.pow(this.levelMultiplier, level - 1));
    }
    
    /**
     * Add XP to the player and handle level-up if necessary
     * @param {number} amount - Amount of XP to add
     * @returns {boolean} Whether the player leveled up
     */
    addXP(amount) {
        if (!amount || isNaN(amount) || amount <= 0) return false;
        
        this.currentXP += amount;
        let leveledUp = false;
        
        // Check for level-up
        while (this.currentXP >= this.xpToNextLevel) {
            leveledUp = true;
            this.levelUp();
        }
        
        // Emit XP update event for UI
        this.emitXPUpdate();
        
        return leveledUp;
    }
    
    /**
     * Level up the player
     * Updates level, recalculates XP requirements, and emits level-up event
     */
    levelUp() {
        // Adjust XP
        this.currentXP -= this.xpToNextLevel;
        
        // Increase level
        this.currentLevel++;
        
        // Recalculate XP for next level
        this.xpToNextLevel = this.calculateXPForLevel(this.currentLevel);
        
        // Emit level-up event
        EventBus.emit('level-up', {
            level: this.currentLevel,
            xp: this.currentXP,
            xpToNext: this.xpToNextLevel
        });
        
        if (this.scene.isDev) {
            console.debug(`Player reached level ${this.currentLevel}!`);
        }
    }
    
    /**
     * Emit XP update event with current status
     */
    emitXPUpdate() {
        EventBus.emit('xp-updated', {
            level: this.currentLevel,
            xp: this.currentXP, 
            xpToNext: this.xpToNextLevel
        });
    }
    
    /**
     * Get the progress percentage towards the next level (0-1)
     * @returns {number} Progress as a value between 0 and 1
     */
    getXPProgress() {
        return this.xpToNextLevel > 0 ? this.currentXP / this.xpToNextLevel : 0;
    }
    
    /**
     * Get the current player level
     * @returns {number} Current level
     */
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    /**
     * Get the current XP amount
     * @returns {number} Current XP
     */
    getCurrentXP() {
        return this.currentXP;
    }
    
    /**
     * Get the XP required for the next level
     * @returns {number} XP required for next level
     */
    getXPToNextLevel() {
        return this.xpToNextLevel;
    }
}
