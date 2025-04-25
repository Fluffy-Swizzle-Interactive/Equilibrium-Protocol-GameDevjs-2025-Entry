# Randomized Enemy Group Spawning System

## Overview

The Randomized Enemy Group Spawning system creates dynamic balance in enemy faction distribution. It uses weighted probability to determine which enemy factions (groups) spawn, with weights automatically adjusted based on player behavior and game state.

This system creates strategic gameplay by requiring players to balance which enemy factions they kill to prevent chaos events from triggering.

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

### Integration with ChaosManager

The Chaos System is tightly integrated with the GroupWeightManager to:
1. Track which faction the player targets most frequently
2. Increase spawn rates for factions that are killed more often
3. Trigger chaos events and faction surges when certain thresholds are reached
4. Apply a momentum system where repeated kills of the same faction accelerate chaos changes

#### Advanced Balance Mechanics

- **Non-Linear Adjustments**: Weight changes follow exponential curves for more dramatic shifts
- **Faction Surges**: When too many enemies of one faction are killed in sequence, the opposite faction will surge
- **Chaos Fluctuations**: Natural oscillations in the chaos value create dynamic changes in enemy spawns
- **Kill Momentum**: Repeated killing of the same faction builds momentum, accelerating chaos changes
- **Threshold Events**: Multiple threshold events at different chaos levels (-70, -40, 40, 70) trigger faction surges

## Implementation Details

### Enhanced Weight Calculation

Enemy group weights are calculated using more sophisticated algorithms:
1. Tracking consecutive kills to build momentum
2. Applying non-linear (exponential) adjustments for more dramatic shifts
3. Introducing random fluctuations to create unpredictability
4. Creating temporary surge events when thresholds are crossed

```javascript
// Example of non-linear adjustment calculation
const imbalanceFactor = Math.pow(Math.abs(imbalance) * 2, 1.5);
const direction = imbalance >= 0 ? -1 : 1;
const adjustment = direction * imbalanceFactor * this.volatility * 150;
```

### Surge Mechanics

When players repeatedly target the same faction, the game will create a dramatic surge:

```javascript
// Trigger a surge in the opposite faction
if (this.momentumEnabled && this.currentMomentum > 3.5 && this.consecutiveKillCount >= 8) {
    const oppositeGroup = groupId === GroupId.AI ? GroupId.CODER : GroupId.AI;
    
    // Every 8 kills of the same faction
    if (this.consecutiveKillCount % 8 === 0) {
        this.triggerFactionSurge(oppositeGroup);
    }
}
```

### Visual Feedback

The system provides clear visual feedback when dramatic spawn changes occur:

1. **Faction Surge Notifications**: On-screen alerts when surges happen
2. **Particle Effects**: Colorful particle bursts corresponding to the faction
3. **Screen Shake**: Camera shake effects when thresholds are crossed
4. **Chaos Meter Flashes**: The chaos meter flashes when significant changes occur

## Gameplay Impact

These enhancements create much more volatile and dynamic gameplay:

1. **Dramatic Shifts**: Enemy group distributions change much more rapidly
2. **Strategic Targeting**: Players must be more careful about which factions they target
3. **Visual Drama**: Clear visual feedback creates "Oh no!" moments for players
4. **Unpredictable Events**: Random fluctuations and surges create surprising moments
5. **Balance Challenges**: Players must work harder to maintain balance between factions

## Design Considerations

### Volatility Settings

The system now provides multiple volatility controls:

- **Base Volatility**: Now increased from 0.2 to 0.5
- **Momentum Factor**: How quickly repeated kills of the same faction accelerate (0.15)
- **Maximum Momentum**: Cap on momentum buildup (5.0)
- **Surge Threshold**: How many consecutive kills trigger a surge (8)
- **Random Fluctuations**: Natural variations in spawn rates (active by default)
- **Oscillation**: Small natural chaos fluctuations that happen automatically

### Surge Prevention

To prevent surges, players should:

1. Alternate between killing different faction enemies
2. Pay attention to the chaos meter and faction distributions
3. When a surge occurs, prioritize targeting the surging faction
4. Avoid long killing sprees of the same faction

### Debug Features

Enhanced debugging features:

- Set `isDev: true` in the scene to enable detailed console logging
- Track `consecutiveKillCount` and `currentMomentum` to see how close to a surge
- Use `getChaosPercentage()` to check current chaos levels
- Monitor threshold events by checking `thresholdEvents` in the ChaosManager

## Technical Implementation Notes

1. **Event Emissions**: The system emits various events that UI components can listen for:
   - `faction-surge`: When a dramatic surge in a faction occurs
   - `MAJOR_CHAOS`: When chaos reaches extreme levels
   - `THRESHOLD_CHAOS`: When intermediate thresholds are crossed

2. **Parameter Tuning**: Key parameters affecting fluctuation intensity:
   - `this.killWeight`: Multiplied by 2.5 for faster chaos changes
   - `this.volatility`: Increased to 0.5 for more dramatic shifts
   - `this.surgeMultiplier`: How strong faction surges are (2.5x)
   - `this.fluctuationIntensity`: How strong random fluctuations are (0.3)

3. **Dependencies**: This system depends on:
   - `EventBus` for inter-system communication
   - `UIManager` for visual feedback
   - Support for particle effects and screen shake

---

*This documentation is maintained by Fluffy-Swizz Interactive development team.*