# Randomized Enemy Group Spawning System

The game uses a dynamic enemy group spawning system to intelligently balance the distribution of AI and Coder factions based on player behavior.

## Core Components

### GroupWeightManager

The `GroupWeightManager` class is responsible for:
- Maintaining weight distributions for each enemy faction
- Tracking kill history to adjust weights dynamically
- Providing weighted random selection for enemy spawning
- Creating dramatic "surge" events that temporarily flood the game with a specific faction

#### Key Methods

- `pickRandomGroup()` - Returns a randomly selected group based on current weights
- `registerKill(groupId)` - Records a kill for a specific group and adjusts weights
- `setWeight(groupId, weight)` - Manually sets the weight for a specific group
- `getWeights()` - Returns the current weight distribution
- `setVolatility(value)` - Sets how quickly weights adjust (0-1 scale)
- `temporaryBoost(groupId, multiplier, duration)` - Creates a temporary surge in a specific faction

#### Weight Balancing System

The system maintains balance by:
1. Setting minimum and maximum weight caps (15-500) to prevent extreme imbalances
2. Adjusting weights inversely to kill percentages (killing more of group A increases the spawn chance of group A)
3. Using non-linear adjustments to create more dynamic but controlled spawn patterns

```javascript
// Example of weight cap implementation
const newWeight = this.groupWeights[groupId] + adjustment;
this.groupWeights[groupId] = Math.max(this.minWeight, Math.min(this.maxWeight, newWeight));
```

This approach prevents situations where one faction completely dominates spawning, ensuring players always encounter a mix of enemy types.

## Implementation Details

### Enhanced Weight Calculation

Enemy group weights are calculated using more sophisticated algorithms:
1. Tracking consecutive kills to build momentum
2. Applying non-linear (exponential) adjustments for more dramatic shifts
3. Introducing random fluctuations to create unpredictability
4. Creating temporary surge events when thresholds are crossed

```javascript
// Example of non-linear adjustment calculation
const imbalanceFactor = Math.pow(Math.abs(imbalance) * 1.8, 1.3);
const direction = imbalance >= 0 ? -1 : 1;
const adjustment = direction * imbalanceFactor * this.volatility * 100;
```

### Automatic Spawn Rebalancing

The dynamic weight adjustment system helps maintain game balance by:

1. Increasing spawn rates of factions the player kills more often
2. Gradually reverting back to balance when kills are more evenly distributed
3. Setting reasonable bounds on weight values to prevent extreme imbalances
4. Creating surge events to maintain tension and unpredictability

## GroupWeightManager Integration with WaveManager

The GroupWeightManager provides robust integration with the WaveManager's enemy counting system, particularly through its `temporaryBoost` method:

```javascript
/**
 * Temporarily boost a specific group's spawn rate dramatically
 * @param {String} groupId - The group to boost
 * @param {Number} multiplier - How much to boost by (e.g., 2.0 = double)
 * @param {Number} duration - How long the boost lasts in ms
 * @returns {Number} Estimated number of extra spawns this boost will create
 */
temporaryBoost(groupId, multiplier = 2.0, duration = 5000) {
    // ... boost implementation ...
    
    // Apply boost with maximum cap to prevent extreme imbalance
    const boostedWeight = Math.min(this.maxWeight, originalWeight * multiplier);
    this.groupWeights[groupId] = boostedWeight;
    
    // Estimate additional enemies that might spawn from this boost
    const estimatedExtraSpawns = Math.floor((multiplier - 1) * (duration / 1000));
    
    // ... scheduling and cleanup ...
    
    // Return the estimated extra spawns for integration with WaveManager
    return estimatedExtraSpawns;
}
```

--- 

*This documentation is maintained by Fluffy-Swizz Interactive development team.*