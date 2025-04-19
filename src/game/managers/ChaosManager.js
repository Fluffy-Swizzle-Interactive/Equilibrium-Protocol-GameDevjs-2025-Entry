import { EventBus } from '../EventBus';
import { CHAOS, GroupId } from '../constants';

/**
 * ChaosManager
 * Manages the game's chaos meter system, which tracks player kill choices and
 * dynamically adjusts enemy stats based on the balance between factions.
 * 
 * The meter ranges from -100 (AI dominance) to +100 (Coder dominance), where
 * each player kill shifts the meter by ±1 toward the opposite faction.
 */
export class ChaosManager {
    /**
     * Create a new Chaos Manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {Object} options - Configuration options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Current chaos value
        this.chaosValue = options.initialValue ?? CHAOS.DEFAULT_VALUE;
        
        // Configuration
        this.minValue = options.minValue ?? CHAOS.MIN_VALUE;
        this.maxValue = options.maxValue ?? CHAOS.MAX_VALUE;
        this.killWeight = options.killWeight ?? CHAOS.KILL_WEIGHT;
        this.panicThreshold = options.panicThreshold ?? CHAOS.PANIC_THRESHOLD;
        
        // Track if a major event has been fired at each extreme
        this.majorEventFired = {
            [CHAOS.MIN_VALUE]: false,
            [CHAOS.MAX_VALUE]: false
        };
        
        // Multiplier caches to avoid recalculating every frame
        this.multiplierCache = {
            [GroupId.AI]: this.calculateMultipliers(GroupId.AI),
            [GroupId.CODER]: this.calculateMultipliers(GroupId.CODER)
        };
        
        // Register this manager with the scene for easy access
        scene.chaosManager = this;
        
        // Subscribe to EventBus
        EventBus.on('enemy-killed', this.handleEnemyKilled, this);
    }
    
    /**
     * Handle enemy killed event
     * @param {Object} data - Event data containing the killed enemy
     * @private
     */
    handleEnemyKilled(data) {
        if (data && data.enemy && data.enemy.groupId) {
            this.registerKill(data.enemy.groupId);
        }
    }
    
    /**
     * Register a kill and update chaos accordingly
     * @param {string} groupId - The group ID of the killed enemy
     * @returns {number} The new chaos value
     */
    registerKill(groupId) {
        // Skip if invalid group
        if (!groupId || groupId === GroupId.NEUTRAL) {
            return this.chaosValue;
        }
        
        // When killing AI, move toward CODER dominance (+)
        // When killing CODER, move toward AI dominance (-)
        const direction = groupId === GroupId.AI ? 1 : -1;
        const newValue = this.chaosValue + (direction * this.killWeight);
        
        // Update the value and check for major events
        const result = this.setChaos(newValue);
        
        // Recalculate multipliers
        this.updateMultiplierCache();
        
        return result;
    }
    
    /**
     * Get multipliers for a specific faction
     * @param {string} groupId - The group ID to get multipliers for
     * @returns {Object} Multipliers for hp, damage, fireRate, dodge
     */
    getMultipliers(groupId) {
        // Return cached values
        return this.multiplierCache[groupId] || {
            hp: 1,
            damage: 1, 
            fireRate: 1,
            dodge: 1
        };
    }
    
    /**
     * Calculate multipliers for a specific faction based on current chaos
     * @param {string} groupId - The group ID to calculate multipliers for
     * @returns {Object} Multipliers for hp, damage, fireRate, dodge
     * @private
     */
    calculateMultipliers(groupId) {
        // Default multipliers (no effect)
        const defaultMultipliers = {
            hp: 1,
            damage: 1,
            fireRate: 1,
            dodge: 1
        };
        
        // Determine if this group gets multipliers based on chaos polarity
        const chaosPolarity = this.getPolarity();
        
        // If chaos is 0, no multipliers
        if (chaosPolarity === 0) {
            return defaultMultipliers;
        }
        
        // AI gets multipliers when chaos < 0, Coders when chaos > 0
        const shouldGetMultiplier = 
            (groupId === GroupId.AI && chaosPolarity < 0) || 
            (groupId === GroupId.CODER && chaosPolarity > 0);
        
        // If this group doesn't get multipliers, return defaults
        if (!shouldGetMultiplier) {
            return defaultMultipliers;
        }
        
        // Calculate the multiplier factor (absolute chaos value)
        const chaosFactor = Math.abs(this.chaosValue) / 100;
        
        // Apply K multipliers from constants
        return {
            hp: 1 + (chaosFactor * CHAOS.MULTIPLIERS.HP),
            damage: 1 + (chaosFactor * CHAOS.MULTIPLIERS.DAMAGE),
            fireRate: 1 + (chaosFactor * CHAOS.MULTIPLIERS.FIRE_RATE),
            dodge: 1 + (chaosFactor * CHAOS.MULTIPLIERS.DODGE)
        };
    }
    
    /**
     * Update the cached multipliers
     * @private
     */
    updateMultiplierCache() {
        this.multiplierCache = {
            [GroupId.AI]: this.calculateMultipliers(GroupId.AI),
            [GroupId.CODER]: this.calculateMultipliers(GroupId.CODER)
        };
    }
    
    /**
     * Check if a faction is in the panic state
     * @param {string} groupId - The group ID to check
     * @returns {boolean} True if the faction should panic
     */
    isPanicking(groupId) {
        // Skip if invalid group
        if (!groupId || groupId === GroupId.NEUTRAL) {
            return false;
        }
        
        // Determine threshold based on chaos orientation
        const absValue = Math.abs(this.chaosValue);
        
        // If not past panic threshold, no panic
        if (absValue < this.panicThreshold) {
            return false;
        }
        
        // AI panics when chaos is strongly positive (Coders winning)
        // Coders panic when chaos is strongly negative (AI winning)
        return (groupId === GroupId.AI && this.chaosValue > 0) || 
               (groupId === GroupId.CODER && this.chaosValue < 0);
    }
    
    /**
     * Get the current chaos level
     * @returns {number} Current chaos value
     */
    getChaos() {
        return this.chaosValue;
    }
    
    /**
     * Get the current chaos level normalized between 0-1
     * @returns {number} Normalized chaos value (0-1)
     */
    getNormalizedChaos() {
        // Convert from -100 to 100 range to 0-1 range
        return (this.chaosValue - this.minValue) / (this.maxValue - this.minValue);
    }
    
    /**
     * Get the chaos polarity (positive or negative)
     * @returns {number} -1 for negative, 0 for neutral, 1 for positive
     */
    getPolarity() {
        if (this.chaosValue > 0) return 1;
        if (this.chaosValue < 0) return -1;
        return 0;
    }
    
    /**
     * Get the absolute chaos level (ignores positive/negative)
     * @returns {number} Absolute chaos value (0-100)
     */
    getAbsoluteChaos() {
        return Math.abs(this.chaosValue);
    }
    
    /**
     * Get the current chaos level as a percentage with sign
     * @returns {string} Chaos percentage with sign (e.g., "+75%" or "-42%")
     */
    getChaosPercentage() {
        const percentage = Math.round((this.chaosValue / this.maxValue) * 100);
        return (percentage > 0 ? '+' : '') + percentage + '%';
    }
    
    /**
     * Set the chaos level to a specific value
     * @param {number} value - New chaos value
     * @param {boolean} emitEvent - Whether to emit a chaos-changed event
     * @returns {number} The new chaos value after clamping
     */
    setChaos(value, emitEvent = true) {
        // Store old value for event
        const oldValue = this.chaosValue;
        
        // Clamp value to min/max range
        const newValue = Math.max(this.minValue, Math.min(this.maxValue, value));
        this.chaosValue = newValue;
        
        // Check for major events
        this.checkMajorChaosEvents(oldValue, newValue);
        
        // Emit event if value changed and emitEvent is true
        if (emitEvent && oldValue !== this.chaosValue) {
            this.emitChaosChanged(oldValue, this.chaosValue);
        }
        
        return this.chaosValue;
    }
    
    /**
     * Check if a major chaos event should be triggered
     * @param {number} oldValue - Previous chaos value
     * @param {number} newValue - New chaos value
     * @private
     */
    checkMajorChaosEvents(oldValue, newValue) {
        // Check for max value reached
        if (newValue === this.maxValue && !this.majorEventFired[this.maxValue]) {
            this.triggerMajorChaosEvent(GroupId.CODER);
            this.majorEventFired[this.maxValue] = true;
        }
        
        // Check for min value reached
        if (newValue === this.minValue && !this.majorEventFired[this.minValue]) {
            this.triggerMajorChaosEvent(GroupId.AI);
            this.majorEventFired[this.minValue] = true;
        }
        
        // Reset fired flag if moving away from extremes
        if (oldValue === this.maxValue && newValue < this.maxValue) {
            this.majorEventFired[this.maxValue] = false;
        }
        
        if (oldValue === this.minValue && newValue > this.minValue) {
            this.majorEventFired[this.minValue] = false;
        }
    }
    
    /**
     * Trigger a major chaos event
     * @param {string} factionId - The faction that reached dominance
     * @private
     */
    triggerMajorChaosEvent(factionId) {
        EventBus.emit('MAJOR_CHAOS', { factionId });
        
        // Apply screen shake effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(
                CHAOS.SHAKE_DURATION,
                CHAOS.SHAKE_INTENSITY
            );
        }
        
        // Display particle effect (placeholder)
        this.createChaosParticles(factionId);
    }
    
    /**
     * Create particles for chaos event
     * @param {string} factionId - The faction that reached dominance
     * @private
     */
    createChaosParticles(factionId) {
        // Get appropriate color based on faction
        const color = CHAOS.COLORS[factionId.toUpperCase()] || 0xffffff;
        
        // Create particle emitter if we have a particle manager
        if (this.scene.particles) {
            const centerX = this.scene.cameras.main.width / 2;
            const centerY = this.scene.cameras.main.height / 2;
            
            const particles = this.scene.particles.createEmitter({
                x: centerX,
                y: centerY,
                speed: { min: -800, max: 800 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.6, end: 0 },
                blendMode: 'ADD',
                lifespan: 600,
                gravityY: 0,
                quantity: 50,
                tint: color
            });
            
            // Stop emitting after a short time
            this.scene.time.delayedCall(300, () => {
                particles.stop();
            });
        }
    }
    
    /**
     * Adjust the chaos level by a relative amount
     * @param {number} amount - Amount to adjust by (positive or negative)
     * @param {boolean} emitEvent - Whether to emit a chaos-changed event
     * @returns {number} The new chaos value after adjustment and clamping
     */
    adjustChaos(amount, emitEvent = true) {
        return this.setChaos(this.chaosValue + amount, emitEvent);
    }
    
    /**
     * Emit chaos changed event
     * @param {number} oldValue - Previous chaos value
     * @param {number} newValue - New chaos value
     * @private
     */
    emitChaosChanged(oldValue, newValue) {
        // Add polarity information to event data
        EventBus.emit('chaos-changed', {
            oldValue,
            newValue,
            normalized: this.getNormalizedChaos(),
            polarity: this.getPolarity(),
            absoluteValue: this.getAbsoluteChaos(),
            percentage: this.getChaosPercentage(),
            multipliers: {
                [GroupId.AI]: this.multiplierCache[GroupId.AI],
                [GroupId.CODER]: this.multiplierCache[GroupId.CODER]
            }
        });
    }
    
    /**
     * Reset chaos to default value
     */
    reset() {
        this.chaosValue = CHAOS.DEFAULT_VALUE;
        
        // Reset major event flags
        this.majorEventFired = {
            [CHAOS.MIN_VALUE]: false,
            [CHAOS.MAX_VALUE]: false
        };
        
        // Update multipliers
        this.updateMultiplierCache();
        
        // Emit reset event
        EventBus.emit('chaos-reset');
    }
    
    /**
     * Event subscription handler
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} context - Context to bind the callback to
     */
    on(event, callback, context) {
        EventBus.on(event, callback, context);
    }
    
    /**
     * Event unsubscription handler
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @param {Object} context - Context to bind the callback to
     */
    off(event, callback, context) {
        EventBus.off(event, callback, context);
    }
    
    /**
     * Update method called each frame
     * @param {number} time - Current time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        // Currently no per-frame updates needed
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Unsubscribe from EventBus
        EventBus.off('enemy-killed', this.handleEnemyKilled, this);
        
        // Clear references
        this.scene = null;
        this.multiplierCache = null;
    }
}