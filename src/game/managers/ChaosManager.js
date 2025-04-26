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
        
        // ENHANCED: Adjust kill weight for more balanced chaos changes
        // Reduced from 2.5x to 1.4x for a more moderate progression
        this.killWeight = this.killWeight * 1.4; 
        
        // ENHANCED: Momentum system for accelerating chaos changes
        this.momentumEnabled = true;
        // Reduced momentum factor for a less aggressive buildup
        this.momentumFactor = 0.08; // Reduced from 0.15
        this.currentMomentum = 0;
        // Increased decay to reduce momentum persistence
        this.momentumDecay = 0.96; // Faster decay (was 0.98)
        this.maxMomentum = 3.5; // Reduced from 5.0
        this.consecutiveKillType = null;
        this.consecutiveKillCount = 0;
        
        // Track if a major event has been fired at each extreme
        this.majorEventFired = {
            [CHAOS.MIN_VALUE]: false,
            [CHAOS.MAX_VALUE]: false
        };
        
        // ENHANCED: Additional threshold events for more chaos events
        this.thresholdEvents = [
            { value: 40, triggered: false, direction: 1 },
            { value: 70, triggered: false, direction: 1 },
            { value: -40, triggered: false, direction: -1 },
            { value: -70, triggered: false, direction: -1 }
        ];
        
        // Multiplier caches to avoid recalculating every frame
        this.multiplierCache = {
            [GroupId.AI]: this.calculateMultipliers(GroupId.AI),
            [GroupId.CODER]: this.calculateMultipliers(GroupId.CODER)
        };
        
        // Reference to GroupWeightManager to control spawn probabilities
        this.groupWeightManager = null;
        
        // REMOVED: Automatic chaos oscillations to ensure chaos only changes from player actions
        this.chaosOscillations = false; // Disabled automatic fluctuations
        this.oscillationAmount = 0;      // Set to zero to prevent any unintended effects
        this.oscillationSpeed = 0;       // Set to zero
        this.lastOscillationTime = Date.now();
        
        // NEW: Cooldown timer for extreme chaos values
        this.extremeChaosTimeoutActive = false;
        this.maxChaosCooldownDuration = 5000; // 5 seconds in milliseconds
        
        // Register this manager with the scene for easy access
        scene.chaosManager = this;
        
        // Subscribe to EventBus
        EventBus.on('enemy-killed', this.handleEnemyKilled, this);
        
        // Debug properties
        this.isDev = this.scene.isDev || false;
        
        // Set up update loop for momentum only (not oscillation)
        if (this.scene && this.scene.events) {
            this.scene.events.on('update', this.update, this);
        }
    }
    
    /**
     * Set the group weight manager reference
     * @param {GroupWeightManager} groupWeightManager - The GroupWeightManager instance
     */
    setGroupWeightManager(groupWeightManager) {
        this.groupWeightManager = groupWeightManager;
        
        // Initialize weights based on current chaos level
        this.updateGroupWeights();
        
        if (this.isDev) {
            console.debug('ChaosManager connected to GroupWeightManager');
        }
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
        
        // NEW: Skip if we're in an extreme chaos cooldown period
        if (this.extremeChaosTimeoutActive) {
            if (this.isDev) {
                console.debug('Chaos change blocked: Extreme chaos cooldown active');
            }
            return this.chaosValue;
        }
        
        // ENHANCED: Track consecutive kills to build momentum
        if (this.momentumEnabled) {
            if (this.consecutiveKillType === groupId) {
                this.consecutiveKillCount++;
                // Build up momentum for repeated kills of the same group
                const momentumIncrease = Math.min(this.momentumFactor * this.consecutiveKillCount, this.maxMomentum);
                this.currentMomentum = Math.min(this.maxMomentum, this.currentMomentum + momentumIncrease);
            } else {
                // Reset momentum when switching targets
                this.consecutiveKillType = groupId;
                this.consecutiveKillCount = 1;
                this.currentMomentum = this.momentumFactor;
            }
        }
        
        // When killing AI, move toward CODER dominance (+)
        // When killing CODER, move toward AI dominance (-)
        const direction = groupId === GroupId.AI ? 1 : -1;
        
        // ENHANCED: Apply momentum to kill weight
        const effectiveKillWeight = this.momentumEnabled ? 
            this.killWeight * (1 + this.currentMomentum) : 
            this.killWeight;
            
        const newValue = this.chaosValue + (direction * effectiveKillWeight);
        
        // Update the value and check for major events
        const result = this.setChaos(newValue);
        
        // Recalculate multipliers
        this.updateMultiplierCache();
        
        // IMPORTANT: Also register kill with the GroupWeightManager if available
        // This makes killed groups more likely to spawn, creating a balancing mechanism
        if (this.groupWeightManager) {
            this.groupWeightManager.registerKill(groupId);
            
            // Trigger a surge if momentum is very high (player killing same group repeatedly)
            if (this.momentumEnabled && this.currentMomentum > 3.5 && this.consecutiveKillCount >= 8) {
                // Get the opposite group for the surge
                const oppositeGroup = groupId === GroupId.AI ? GroupId.CODER : GroupId.AI;
                
                // Call the surge method in GroupWeightManager
                if (this.consecutiveKillCount % 8 === 0) { // Every 8 kills
                    this.triggerFactionSurge(oppositeGroup);
                }
                
                // Reset momentum after triggering surge
                this.currentMomentum *= 0.7; // Reduce momentum but don't reset completely
            }
        }
        
        return result;
    }
    
    /**
     * Trigger a faction surge in the weight manager
     * @param {String} factionId - The faction to trigger a surge for
     */
    triggerFactionSurge(factionId) {
        if (!this.groupWeightManager) return;
        
        // Get WaveManager reference to track any extra spawns
        const waveManager = this.scene.waveManager;
        
        // Calculate potential surge enemies (1-3 extra enemies)
        const surgeEnemiesCount = Math.floor(Math.random() * 3) + 1;
        
        // Temporarily boost the enemy spawn rate for the target faction
        this.groupWeightManager.temporaryBoost(factionId, 3.0, 10000);
        
        // Register these potential enemy spawns with WaveManager
        if (waveManager && typeof waveManager.registerExternalEnemySpawn === 'function') {
            waveManager.registerExternalEnemySpawn(surgeEnemiesCount);
            
            if (this.isDev) {
                console.debug(`[ChaosManager] Registered ${surgeEnemiesCount} surge enemies with WaveManager`);
            }
        }
        
        // Emit event for UI notifications
        if (this.scene.events) {
            this.scene.events.emit('faction-surge', {
                groupId: factionId,
                strength: 3.0
            });
        }
    }
    
    /**
     * Update group weights based on current chaos level
     * Adjusts spawn probabilities based on chaos imbalance
     */
    updateGroupWeights() {
        if (!this.groupWeightManager) return;
        
        // Get normalized chaos value (-1 to 1)
        const normalizedChaos = this.chaosValue / 100;
        
        // Base weights - equal distribution by default
        let aiWeight = 50;
        let coderWeight = 50;
        
        // ENHANCED: Apply more balanced adjustments to weights based on chaos level
        if (normalizedChaos > 0) {
            // Positive chaos (CODER dominance) - increase AI spawn rates
            // More moderate curve - less exponential for better balance
            const adjustment = Math.pow(Math.abs(normalizedChaos), 1.3) * 35; // Reduced from 1.5/40 to 1.3/35
            aiWeight += adjustment;
            coderWeight -= adjustment;
        } else if (normalizedChaos < 0) {
            // Negative chaos (AI dominance) - increase CODER spawn rates
            const adjustment = Math.pow(Math.abs(normalizedChaos), 1.3) * 35;
            coderWeight += adjustment;
            aiWeight -= adjustment;
        }
        
        // Set the weights in the weight manager
        // Increased minimum weight from 15% to 20% for better balance
        this.groupWeightManager.setWeights({
            'ai': Math.max(20, aiWeight),
            'coder': Math.max(20, coderWeight)
        });
        
        if (this.isDev) {
            console.debug(`Chaos level ${this.chaosValue} adjusted spawn weights:`, {
                ai: aiWeight,
                coder: coderWeight
            });
        }
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
     * ENHANCED: More dramatic power scaling
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
        
        // ENHANCED: Apply more dramatic non-linear scaling
        // Apply K multipliers from constants with exponential scaling for more dramatic effects
        return {
            hp: 1 + (Math.pow(chaosFactor, 1.2) * CHAOS.MULTIPLIERS.HP * 1.2),
            damage: 1 + (Math.pow(chaosFactor, 1.3) * CHAOS.MULTIPLIERS.DAMAGE * 1.3),
            fireRate: 1 + (Math.pow(chaosFactor, 1.1) * CHAOS.MULTIPLIERS.FIRE_RATE * 1.2),
            dodge: 1 + (Math.pow(chaosFactor, 1.4) * CHAOS.MULTIPLIERS.DODGE * 1.2)
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
     * Check if a faction is in the rage state
     * @param {string} groupId - The group ID to check
     * @returns {boolean} True if the faction should enter rage mode
     */
    isEnraged(groupId) {
        // Skip if invalid group
        if (!groupId || groupId === GroupId.NEUTRAL) {
            return false;
        }
        
        // Determine threshold based on chaos orientation
        const absValue = Math.abs(this.chaosValue);
        
        // If not past panic threshold, no rage
        if (absValue < this.panicThreshold) {
            return false;
        }
        
        // CORRECTED LOGIC:
        // When chaos is positive (+): CODERS are dominant, AI should rage
        // When chaos is negative (-): AI is dominant, CODERS should rage
        
        if (this.chaosValue > 0) {
            // Positive chaos - CODERS dominant, AI should rage
            return groupId === GroupId.AI;
        } else {
            // Negative chaos - AI dominant, CODERS should rage
            return groupId === GroupId.CODER;
        }
    }
    
    /**
     * @deprecated Use isEnraged instead
     * Check if a faction is in the panic state (legacy method for backwards compatibility)
     * @param {string} groupId - The group ID to check
     * @returns {boolean} True if the faction should rage
     */
    isPanicking(groupId) {
        return this.isEnraged(groupId);
    }
    
    /**
     * Check if a specific group is weakened by the current chaos level
     * A group is weakened when the chaos value is biased against it
     * @param {string} groupId - The group ID to check
     * @returns {boolean} True if the group is weakened by chaos
     */
    isGroupWeakened(groupId) {
        // Skip if invalid group
        if (!groupId || groupId === GroupId.NEUTRAL) {
            return false;
        }
        
        // Get the normalized faction balance (-1 to 1)
        const balance = this.getFactionBalance();
        
        // AI is weakened when balance is positive (CODER dominance)
        // CODER is weakened when balance is negative (AI dominance)
        if (groupId === GroupId.AI) {
            return balance > 0.3; // AI is weakened when CODER dominance is above 30%
        } else if (groupId === GroupId.CODER) {
            return balance < -0.3; // CODER is weakened when AI dominance is above 30%
        }
        
        return false;
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
     * Get the faction balance status
     * Returns a value between -1 and 1 where:
     * -1 = complete AI dominance
     * 0 = balanced
     * 1 = complete CODER dominance
     * 
     * @returns {number} Normalized faction balance (-1 to 1)
     */
    getFactionBalance() {
        // Normalize chaos value from -100...100 to -1...1
        return this.chaosValue / 100;
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
        
        // ENHANCED: Check for threshold events
        this.checkThresholdEvents(oldValue, newValue);
        
        // Update group weights if GroupWeightManager is available
        if (this.groupWeightManager && Math.abs(newValue - oldValue) >= 5) {
            this.updateGroupWeights();
        }
        
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
            
            // NEW: Start the extreme chaos cooldown timer for maximum CODER dominance
            this.startExtremeChaosTimeout();
        }
        
        // Check for min value reached
        if (newValue === this.minValue && !this.majorEventFired[this.minValue]) {
            this.triggerMajorChaosEvent(GroupId.AI);
            this.majorEventFired[this.minValue] = true;
            
            // NEW: Start the extreme chaos cooldown timer for maximum AI dominance
            this.startExtremeChaosTimeout();
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
     * NEW: Start a timeout that prevents chaos changes while at extreme values
     * @private
     */
    startExtremeChaosTimeout() {
        // Set the flag to block chaos changes
        this.extremeChaosTimeoutActive = true;
        
        if (this.isDev) {
            console.debug(`Extreme chaos cooldown started. Duration: ${this.maxChaosCooldownDuration / 1000}s`);
        }
        
        // Create a visual indicator that chaos is locked
        EventBus.emit('CHAOS_LOCKED', {
            duration: this.maxChaosCooldownDuration,
            faction: this.chaosValue === this.maxValue ? GroupId.CODER : GroupId.AI
        });
        
        // Store the current chaos value to calculate the reset value later
        const extremeChaosValue = this.chaosValue;
        
        // After the timeout, allow chaos changes again
        this.scene.time.delayedCall(this.maxChaosCooldownDuration, () => {
            this.extremeChaosTimeoutActive = false;
            
            // Reset chaos to 25% of its extreme value to give the player grace
            // If at max chaos (100), reset to 25
            // If at min chaos (-100), reset to -25
            const resetValue = extremeChaosValue > 0 ? 
                Math.floor(this.maxValue * 0.25) : 
                Math.ceil(this.minValue * 0.25);
            
            // Set the new chaos value and emit event
            this.setChaos(resetValue);
            
            if (this.isDev) {
                console.debug(`Extreme chaos cooldown ended. Chaos reset from ${extremeChaosValue} to ${resetValue}`);
            }
            
            // Emit an event that chaos can be influenced again
            EventBus.emit('CHAOS_UNLOCKED', {
                value: resetValue,
                previousValue: extremeChaosValue,
                faction: extremeChaosValue === this.maxValue ? GroupId.CODER : GroupId.AI
            });
        });
    }
    
    /**
     * Check for threshold events when passing certain chaos values
     * @param {number} oldValue - Previous chaos value
     * @param {number} newValue - New chaos value
     * @private 
     */
    checkThresholdEvents(oldValue, newValue) {
        for (const threshold of this.thresholdEvents) {
            // Check if we've crossed this threshold in the relevant direction
            const crossedPositive = 
                threshold.direction > 0 && 
                oldValue < threshold.value && 
                newValue >= threshold.value;
                
            const crossedNegative = 
                threshold.direction < 0 && 
                oldValue > threshold.value && 
                newValue <= threshold.value;
                
            if ((crossedPositive || crossedNegative) && !threshold.triggered) {
                // Trigger threshold event
                const faction = threshold.direction > 0 ? GroupId.CODER : GroupId.AI;
                this.triggerThresholdEvent(faction, threshold.value);
                threshold.triggered = true;
                
                // Trigger faction surge in the non-dominant faction
                if (this.groupWeightManager) {
                    const oppositeFaction = threshold.direction > 0 ? GroupId.AI : GroupId.CODER;
                    this.triggerFactionSurge(oppositeFaction);
                }
            }
            
            // Reset triggered state when moving back across threshold
            if (threshold.direction > 0 && newValue < threshold.value - 10) {
                threshold.triggered = false;
            } else if (threshold.direction < 0 && newValue > threshold.value + 10) {
                threshold.triggered = false;
            }
        }
    }
    
    /**
     * Trigger a threshold chaos event
     * @param {string} factionId - The faction that reached dominance
     * @param {number} value - The threshold value reached
     * @private
     */
    triggerThresholdEvent(factionId, value) {
        EventBus.emit('THRESHOLD_CHAOS', { 
            factionId,
            value,
            absoluteValue: Math.abs(value)
        });
        
        // Apply screen shake effect (smaller than major events)
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(
                CHAOS.SHAKE_DURATION * 0.7,
                CHAOS.SHAKE_INTENSITY * 0.7
            );
        }
        
        // Create visual feedback
        this.createChaosParticles(factionId, 0.7);
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
        
        // Display particle effect
        this.createChaosParticles(factionId);
    }
    
    /**
     * Create particles for chaos event
     * @param {string} factionId - The faction that reached dominance
     * @param {number} scale - Scale factor for particle effect (1.0 = full size)
     * @private
     */
    createChaosParticles(factionId, scale = 1.0) {
        // Get appropriate color based on faction
        const color = CHAOS.COLORS[factionId.toUpperCase()] || 0xffffff;
        
        // Create particle emitter if we have a particle manager
        if (this.scene.add && this.scene.add.particles) {
            const centerX = this.scene.cameras.main.width / 2;
            const centerY = this.scene.cameras.main.height / 2;
            
            // Use the updated Phaser particle API
            const particleManager = this.scene.add.particles(centerX, centerY, 'particle_texture', {
                speed: { min: -800 * scale, max: 800 * scale },
                angle: { min: 0, max: 360 },
                scale: { start: 0.6 * scale, end: 0 },
                blendMode: 'ADD',
                lifespan: 600 * scale,
                gravityY: 0,
                quantity: Math.round(50 * scale),
                tint: color
            });
            
            // Stop emitting after a short time
            this.scene.time.delayedCall(300 * scale, () => {
                // In newer Phaser versions, we need to remove the entire manager
                particleManager.destroy();
            });
        }
    }
    
    /**
     * Apply chaos oscillation for natural fluctuation
     * DISABLED: Chaos should only change based on player actions
     * @private
     */
    applyOscillation() {
        // Function disabled - chaos should only change from player actions
        return;
    }
    
    /**
     * Update chaos momentum
     * @private
     */
    updateMomentum() {
        if (!this.momentumEnabled) return;
        
        // Gradually decay momentum
        this.currentMomentum *= this.momentumDecay;
        
        // Reset momentum when it gets very small
        if (this.currentMomentum < 0.01) {
            this.currentMomentum = 0;
        }
    }
    
    /**
     * Adjust the chaos level by a relative amount
     * @param {number} amount - Amount to adjust by (positive or negative)
     * @param {boolean} emitEvent - Whether to emit a chaos-changed event
     * @returns {number} The new chaos value after adjustment and clamping
     */
    adjustChaos(amount, emitEvent = true) {
        // NEW: Skip if extreme chaos cooldown is active
        if (this.extremeChaosTimeoutActive) {
            if (this.isDev) {
                console.debug('Chaos adjustment blocked: Extreme chaos cooldown active');
            }
            return this.chaosValue;
        }
        
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
        
        // Reset threshold events
        for (const threshold of this.thresholdEvents) {
            threshold.triggered = false;
        }
        
        // Reset momentum system
        this.currentMomentum = 0;
        this.consecutiveKillCount = 0;
        this.consecutiveKillType = null;
        
        // Clear any active chaos timeout
        this.extremeChaosTimeoutActive = false;
        
        // Update multipliers
        this.updateMultiplierCache();
        
        // Emit reset event
        EventBus.emit('chaos-reset');
    }
    
    /**
     * Update method called each frame
     * @param {number} time - Current time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        // REMOVED: No longer applying oscillation to chaos value
        // Only updating momentum decay which doesn't directly change chaos value
        this.updateMomentum();
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Unsubscribe from EventBus
        EventBus.off('enemy-killed', this.handleEnemyKilled, this);
        
        // Unsubscribe from update event
        if (this.scene && this.scene.events) {
            this.scene.events.off('update', this.update, this);
        }
        
        // Clear references
        this.scene = null;
        this.multiplierCache = null;
        this.groupWeightManager = null;
    }
}