import { EventBus } from '../EventBus';
import { CHAOS } from '../constants';

/**
 * ChaosManager
 * Manages the game's chaos system, which affects gameplay dynamics and
 * enemy behavior. Provides API for chaos adjustments and queries.
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
        this.updateInterval = options.updateInterval ?? CHAOS.UPDATE_INTERVAL;
        this.adjustmentRate = options.adjustmentRate ?? CHAOS.ADJUSTMENT_RATE;
        
        // Auto-adjustment settings
        this.autoAdjust = options.autoAdjust ?? false;
        this.autoAdjustDirection = 1; // 1 for increase, -1 for decrease
        this.lastUpdateTime = 0;
        
        // Register this manager with the scene for easy access
        scene.chaosManager = this;
        
        // Set up auto-update timer if enabled
        if (this.autoAdjust) {
            this.setupAutoUpdate();
        }
    }
    
    /**
     * Set up auto-update for chaos level
     * @private
     */
    setupAutoUpdate() {
        this.autoUpdateEvent = this.scene.time.addEvent({
            delay: this.updateInterval,
            callback: this.autoUpdateChaos,
            callbackScope: this,
            loop: true
        });
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
        this.chaosValue = Math.max(this.minValue, Math.min(this.maxValue, value));
        
        // Emit event if value changed and emitEvent is true
        if (emitEvent && oldValue !== this.chaosValue) {
            this.emitChaosChanged(oldValue, this.chaosValue);
        }
        
        return this.chaosValue;
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
     * Auto-update chaos value based on timer
     * @private
     */
    autoUpdateChaos() {
        const now = this.scene.time.now;
        
        // Skip if paused
        if (this.scene.isPaused) {
            return;
        }
        
        // Calculate adjustment based on direction and rate
        const adjustment = this.autoAdjustDirection * this.adjustmentRate;
        
        // Apply the adjustment
        this.adjustChaos(adjustment);
        
        // Reverse direction if we hit min/max
        if (this.chaosValue >= this.maxValue) {
            this.autoAdjustDirection = -1;
        } else if (this.chaosValue <= this.minValue) {
            this.autoAdjustDirection = 1;
        }
        
        this.lastUpdateTime = now;
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
            percentage: this.getChaosPercentage()
        });
    }
    
    /**
     * Set auto-adjustment on or off
     * @param {boolean} enabled - Whether auto-adjustment should be enabled
     */
    setAutoAdjust(enabled) {
        this.autoAdjust = enabled;
        
        // Set up or destroy timer as needed
        if (this.autoAdjust && !this.autoUpdateEvent) {
            this.setupAutoUpdate();
        } else if (!this.autoAdjust && this.autoUpdateEvent) {
            this.autoUpdateEvent.destroy();
            this.autoUpdateEvent = null;
        }
    }
    
    /**
     * Reset chaos to default value
     */
    reset() {
        this.setChaos(CHAOS.DEFAULT_VALUE);
        this.autoAdjustDirection = 1;
        this.lastUpdateTime = 0;
    }
    
    /**
     * Update method called each frame
     * @param {number} time - Current time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        // Currently no per-frame updates needed
        // Auto updates are handled by the timer
    }
}