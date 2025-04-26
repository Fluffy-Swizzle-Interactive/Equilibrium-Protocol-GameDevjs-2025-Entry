/**
 * GroupWeightManager - Handles dynamic group weight distribution for enemy spawning
 * Used to control the probability distribution of different enemy factions/groups
 */
export class GroupWeightManager {
    /**
     * Constructor for GroupWeightManager
     * @param {Object} scene - The Phaser scene this manager belongs to
     * @param {Object} options - Configuration options
     * @param {Object} options.initialWeights - Initial weights for each group {groupId: weight}
     * @param {Number} options.volatility - How quickly weights change (0-1)
     * @param {Boolean} options.enableFluctuations - Enable random weight fluctuations
     * @param {Boolean} options.debug - Enable debug logging
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.isDev = this.scene.isDev || false;
        
        // Generate randomized initial weights between 30-70 if not provided
        if (!options.initialWeights) {
            const aiWeight = Math.floor(Math.random() * 41) + 30; // Random between 30-70
            const coderWeight = Math.floor(Math.random() * 41) + 30; // Random between 30-70
            this.groupWeights = {
                'ai': aiWeight,      // AI faction with randomized weight
                'coder': coderWeight // Coder faction with randomized weight
            };
        } else {
            // Use provided weights
            this.groupWeights = options.initialWeights;
        }
        
        // Total weight sum (for probability calculations)
        this.totalWeight = this.calculateTotalWeight();
        
        // Volatility: how quickly weights change (reduced to find better balance)
        this.volatility = options.volatility || 0.35; // Reduced from 0.5
        
        // Track history of group kills
        this.killHistory = {
            'ai': 0,
            'coder': 0
        };
        
        // Recent kill streak tracking for surge mechanics
        this.recentKills = [];
        this.maxRecentKills = 10; // Track last 10 kills
        
        // DISABLED: Random fluctuations in weights for more predictable spawning
        this.enableFluctuations = true; // Always false to prevent random changes
        
        // Fluctuation timing (kept for API compatibility but not used)
        this.lastFluctuationTime = 0;
        this.fluctuationInterval = options.fluctuationInterval || 10000;
        this.fluctuationIntensity = 0; // Set to 0 to prevent any fluctuations
        
        // Create surge mechanics (sudden dramatic shifts based on player actions)
        this.enableSurges = options.enableSurges !== undefined ? options.enableSurges : true;
        this.surgeThreshold = options.surgeThreshold || 5; // Consecutive kills to trigger surge
        this.surgeMultiplier = options.surgeMultiplier || 2.2; // Reduced from 2.5
        this.activeSurge = null;
        
        // Flag to enable/disable dynamic weight adjustment
        this.dynamicAdjustment = true;
        
        // Add min/max weight caps to prevent extreme imbalances
        this.minWeight = options.minWeight || 15;
        this.maxWeight = options.maxWeight || 500; // Add reasonable maximum cap
        
        // Log initialization
        if (this.isDev) {
            console.debug('GroupWeightManager initialized with randomized weights:', this.groupWeights);
        }
    }

    /**
     * Calculate the total weight (sum of all group weights)
     * @returns {Number} The total weight
     */
    calculateTotalWeight() {
        return Object.values(this.groupWeights).reduce((sum, weight) => sum + weight, 0);
    }

    /**
     * Get the current weight for a specific group
     * @param {String} groupId - The group ID to get weight for
     * @returns {Number} The current weight value or 0 if not found
     */
    getWeight(groupId) {
        return this.groupWeights[groupId] || 0;
    }

    /**
     * Set the weight for a specific group
     * @param {String} groupId - The group ID to set weight for
     * @param {Number} weight - The weight value to set
     */
    setWeight(groupId, weight) {
        // Ensure weight is within bounds
        this.groupWeights[groupId] = Math.max(this.minWeight, Math.min(this.maxWeight, weight));
        this.totalWeight = this.calculateTotalWeight();
        
        if (this.isDev) {
            console.debug(`Set weight for group ${groupId} to ${this.groupWeights[groupId]}. New total: ${this.totalWeight}`);
        }
    }

    /**
     * Set weights for multiple groups at once
     * @param {Object} weights - Object with group IDs as keys and weights as values
     */
    setWeights(weights) {
        for (const [groupId, weight] of Object.entries(weights)) {
            this.groupWeights[groupId] = Math.max(this.minWeight, Math.min(this.maxWeight, weight));
        }
        this.totalWeight = this.calculateTotalWeight();
    }

    /**
     * Register a kill for a specific group and track kill streaks
     * @param {String} groupId - The group ID that was killed
     */
    registerKill(groupId) {
        // Update kill history
        if (this.killHistory[groupId] !== undefined) {
            this.killHistory[groupId]++;
        } else {
            this.killHistory[groupId] = 1;
        }
        
        // Track recent kills for surge mechanics
        this.recentKills.push(groupId);
        if (this.recentKills.length > this.maxRecentKills) {
            this.recentKills.shift(); // Remove oldest kill
        }
        
        // Check for kill streaks and possibly trigger surges
        this.checkForSurges(groupId);
        
        // Apply dynamic adjustment if enabled
        if (this.dynamicAdjustment) {
            this.adjustWeightsBasedOnKills();
        }
    }

    /**
     * Check for streaks of the same group being killed and trigger surges
     * @param {String} latestGroupId - The group ID of the most recent kill
     * @private
     */
    checkForSurges(latestGroupId) {
        if (!this.enableSurges) return;
        
        // Count consecutive kills of the same group
        let streakCount = 0;
        for (let i = this.recentKills.length - 1; i >= 0; i--) {
            if (this.recentKills[i] === latestGroupId) {
                streakCount++;
            } else {
                break; // Streak broken
            }
        }
        
        // If streak exceeds threshold, trigger a surge
        if (streakCount >= this.surgeThreshold) {
            this.triggerSurge(latestGroupId);
            
            // Reset recent kills to prevent immediate re-triggering
            this.recentKills = [];
        }
    }

    /**
     * Trigger a dramatic surge in spawns of the opposite group
     * @param {String} killedGroupId - The group that was repeatedly killed
     * @private
     */
    triggerSurge(killedGroupId) {
        // Determine opposite group
        const groups = Object.keys(this.groupWeights);
        const oppositeGroup = groups.find(g => g !== killedGroupId);
        
        if (!oppositeGroup) return;
        
        // Already have an active surge for this group
        if (this.activeSurge && this.activeSurge.groupId === oppositeGroup) return;
        
        // Clear any existing surge
        if (this.activeSurge && this.activeSurge.timer) {
            this.activeSurge.timer.remove();
        }
        
        // Calculate original and surge weights
        const originalWeight = this.groupWeights[oppositeGroup];
        const surgeWeight = originalWeight * this.surgeMultiplier;
        
        // Apply the surge weight
        this.groupWeights[oppositeGroup] = surgeWeight;
        this.totalWeight = this.calculateTotalWeight();
        
        // Create a visual effect if available
        if (this.scene.events) {
            this.scene.events.emit('faction-surge', {
                groupId: oppositeGroup,
                strength: this.surgeMultiplier
            });
        }
        
        // Log surge event
        if (this.isDev) {
            console.debug(`SURGE triggered for ${oppositeGroup}! Weight boosted from ${originalWeight} to ${surgeWeight}`);
        }
        
        // Set a timer to revert the surge after a delay
        this.activeSurge = {
            groupId: oppositeGroup,
            originalWeight: originalWeight,
            timer: this.scene.time.delayedCall(12000, () => { // 12 seconds
                // Revert weight if it hasn't been manually changed
                if (this.groupWeights[oppositeGroup] === surgeWeight) {
                    this.groupWeights[oppositeGroup] = originalWeight;
                    this.totalWeight = this.calculateTotalWeight();
                    
                    if (this.isDev) {
                        console.debug(`Surge ended for ${oppositeGroup}, weight reverted to ${originalWeight}`);
                    }
                }
                this.activeSurge = null;
            })
        };
    }

    /**
     * Apply random fluctuations to group weights
     * DISABLED: Fluctuations are now disabled for predictability
     * @private
     */
    applyRandomFluctuation() {
        // Function disabled to prevent automatic changes to spawn weights
        return;
    }

    /**
     * Adjust weights based on kill history to maintain balance
     * Now with improved balancing to prevent extreme weight disparities
     */
    adjustWeightsBasedOnKills() {
        // Only adjust if we have multiple groups
        const groups = Object.keys(this.groupWeights);
        if (groups.length <= 1) return;
        
        // Calculate total kills
        const totalKills = Object.values(this.killHistory).reduce((sum, kills) => sum + kills, 0);
        if (totalKills === 0) return;
        
        // Calculate kill percentages
        const killPercentages = {};
        for (const groupId in this.killHistory) {
            killPercentages[groupId] = this.killHistory[groupId] / totalKills;
        }
        
        // IMPROVED BALANCING: Calculate the ratio between the groups' weights
        // This helps identify when weights are becoming too imbalanced
        const weightRatios = {};
        const weightValues = Object.values(this.groupWeights);
        const maxWeight = Math.max(...weightValues);
        const minWeight = Math.min(...weightValues);
        const weightImbalance = maxWeight / Math.max(1, minWeight);
        
        // Calculate target weights based on the inverse of kill percentages
        // When kill percentage is high, target weight should be higher (to spawn more)
        const targetWeights = {};
        const baseWeight = 50; // Base reference weight
        
        for (const groupId in killPercentages) {
            // Calculate target weight - inverse relationship with kill percentage
            // When kill percentage is high, we want to spawn more of this group to maintain balance
            const killPercentage = killPercentages[groupId];
            
            // More aggressive balancing when weights are extremely imbalanced
            if (weightImbalance > 5) {
                // Hard correction when weights are extremely imbalanced
                const oppositeGroup = groups.find(g => g !== groupId);
                if (this.groupWeights[groupId] > this.groupWeights[oppositeGroup] * 5) {
                    // This group's weight is way too high - force a reduction
                    targetWeights[groupId] = Math.floor(this.groupWeights[oppositeGroup] * 1.5);
                } else if (this.groupWeights[groupId] * 5 < this.groupWeights[oppositeGroup]) {
                    // This group's weight is way too low - force an increase
                    targetWeights[groupId] = Math.floor(this.groupWeights[oppositeGroup] / 1.5);
                }
            } else {
                // Normal balancing - adjust based on kill percentage
                // Higher kill percentage = higher weight (more spawns)
                targetWeights[groupId] = baseWeight + (killPercentage * 100);
            }
        }
        
        // Apply gradual adjustments toward target weights
        for (const groupId in this.groupWeights) {
            if (targetWeights[groupId] !== undefined) {
                const currentWeight = this.groupWeights[groupId];
                const targetWeight = targetWeights[groupId];
                const diff = targetWeight - currentWeight;
                
                // Apply adjustment with a smoothing factor for gradual change
                // Larger differences result in faster adjustments
                const adjustmentSize = Math.sign(diff) * Math.min(
                    Math.abs(diff) * 0.1, // 10% of the difference
                    10 // Max adjustment per update
                );
                
                // Apply adjustment with minimum and maximum weight caps
                const newWeight = currentWeight + adjustmentSize;
                this.groupWeights[groupId] = Math.max(this.minWeight, Math.min(this.maxWeight, newWeight));
            }
        }
        
        // Recalculate total weight
        this.totalWeight = this.calculateTotalWeight();
        
        // Debug logging
        if (this.isDev) {
            console.debug('Group weights adjusted based on kill history:', {
                weights: {...this.groupWeights},
                killPercentages
            });
        }
    }

    /**
     * Pick a random group based on current weights, with more predictability
     * @returns {String} The selected group ID
     */
    pickRandomGroup() {
        // REMOVED: The "complete randomness" 5% chance for more consistent spawns
        // Use normal weighted selection for predictability
        const random = Math.random() * this.totalWeight;
        
        let cumulativeWeight = 0;
        for (const [groupId, weight] of Object.entries(this.groupWeights)) {
            cumulativeWeight += weight;
            if (random < cumulativeWeight) {
                return groupId;
            }
        }
        
        // Fallback to first group if something went wrong
        return Object.keys(this.groupWeights)[0];
    }

    /**
     * Temporarily boost a specific group's spawn rate dramatically
     * Useful for events, story moments, or gameplay triggers
     * @param {String} groupId - The group to boost
     * @param {Number} multiplier - How much to boost by (e.g., 2.0 = double)
     * @param {Number} duration - How long the boost lasts in ms
     * @returns {Number} Estimated number of extra spawns this boost will create
     */
    temporaryBoost(groupId, multiplier = 2.0, duration = 5000) {
        if (!this.groupWeights[groupId]) return 0;
        
        const originalWeight = this.groupWeights[groupId];
        const boostedWeight = Math.min(this.maxWeight, originalWeight * multiplier);
        
        // Apply boost
        this.groupWeights[groupId] = boostedWeight;
        this.totalWeight = this.calculateTotalWeight();
        
        // Estimate additional enemies that might spawn from this boost
        // This is a rough estimate based on the boost multiplier and duration
        const estimatedExtraSpawns = Math.floor((multiplier - 1) * (duration / 1000));
        
        if (this.isDev) {
            console.debug(`Temporary boost applied to ${groupId}: ${originalWeight} → ${boostedWeight} for ${duration}ms`);
            console.debug(`Estimated extra spawns from boost: ${estimatedExtraSpawns}`);
        }
        
        // Schedule reversion
        this.scene.time.delayedCall(duration, () => {
            if (this.groupWeights[groupId] === boostedWeight) { // Only revert if not changed since
                this.groupWeights[groupId] = originalWeight;
                this.totalWeight = this.calculateTotalWeight();
                
                if (this.isDev) {
                    console.debug(`Temporary boost for ${groupId} ended, reverted to ${originalWeight}`);
                }
            }
        });
        
        // Return the estimated extra spawns for integration with WaveManager
        return estimatedExtraSpawns;
    }

    /**
     * Enable or disable dynamic weight adjustment
     * @param {Boolean} enabled - Whether to enable dynamic adjustment
     */
    setDynamicAdjustment(enabled) {
        this.dynamicAdjustment = enabled;
    }

    /**
     * Set the volatility factor for weight adjustments
     * @param {Number} value - New volatility value (0-1)
     */
    setVolatility(value) {
        this.volatility = Math.max(0, Math.min(1, value));
    }
    
    /**
     * Enable or disable random fluctuations
     * @param {Boolean} enabled - Whether to enable random fluctuations
     */
    setFluctuationsEnabled(enabled) {
        this.enableFluctuations = enabled;
    }
    
    /**
     * Enable or disable surge mechanics
     * @param {Boolean} enabled - Whether to enable surges
     */
    setSurgesEnabled(enabled) {
        this.enableSurges = enabled;
    }
    
    /**
     * Get the probability distribution of each group
     * @returns {Object} Object with group IDs as keys and probabilities as values
     */
    getProbabilities() {
        const probabilities = {};
        for (const [groupId, weight] of Object.entries(this.groupWeights)) {
            probabilities[groupId] = weight / this.totalWeight;
        }
        return probabilities;
    }

    /**
     * Reset kill history
     */
    resetKillHistory() {
        for (const groupId in this.killHistory) {
            this.killHistory[groupId] = 0;
        }
        this.recentKills = [];
    }

    /**
     * Force an immediate rebalance of weights if they've become extremely skewed
     * This is useful for recovering from unintended extreme imbalances
     * @returns {boolean} Whether weights were rebalanced
     */
    forceRebalanceWeights() {
        const groups = Object.keys(this.groupWeights);
        if (groups.length <= 1) return false;
        
        // Check current weight imbalance
        const weightValues = Object.values(this.groupWeights);
        const maxWeight = Math.max(...weightValues);
        const minWeight = Math.min(...weightValues);
        const weightImbalance = maxWeight / Math.max(1, minWeight);
        
        // Only rebalance if there's significant imbalance (more than 5:1 ratio)
        if (weightImbalance > 5) {
            // Reset to balanced weights around 50
            const baseWeight = 50;
            for (const groupId of groups) {
                // Apply some randomness to avoid perfect balance
                const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8-1.2
                this.groupWeights[groupId] = Math.floor(baseWeight * randomFactor);
            }
            
            this.totalWeight = this.calculateTotalWeight();
            
            if (this.isDev) {
                console.debug('Extreme weight imbalance detected and corrected:', {
                    previousImbalance: weightImbalance,
                    newWeights: {...this.groupWeights}
                });
            }
            
            return true;
        }
        
        return false;
    }
}