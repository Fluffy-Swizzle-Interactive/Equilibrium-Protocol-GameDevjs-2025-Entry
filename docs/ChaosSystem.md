# Chaos System

## Overview

The Chaos System tracks the balance of power between enemy factions, creating dynamic gameplay that responds to player actions. The system adjusts enemy spawn rates and stats based on which faction the player targets more frequently.

## Core Concept

The chaos meter ranges from -100 (AI dominance) to +100 (Coder dominance), with 0 representing perfect balance between factions. Player actions shift the meter based on which faction is being targeted:

- Killing AI enemies: Moves chaos toward +100 (Coder dominance)
- Killing Coder enemies: Moves chaos toward -100 (AI dominance)

**Important**: Chaos value changes ONLY when enemies are killed. There are no automatic or random fluctuations in chaos.

## Impact on Gameplay

### Faction Behavior

When chaos reaches extreme values (above 85 or below -85):

- **The dominated faction enters rage mode**: When chaos is high positive (>85), AI enemies enter rage mode and rush aggressively toward the player with increased speed and damage. When chaos is high negative (<-85), Coder enemies enter rage mode and do the same.
- **The dominant faction gains power**: The dominant faction receives stat boosts.

### Spawn Rate Adjustment

- Higher chaos toward one faction increases spawn rates for the opposing faction, creating a natural balancing mechanism
- The spawn system responds dynamically to create varied enemy distributions throughout gameplay
- Spawn weights are consistently predictable based on player actions, not random fluctuations

## Balance Tuning

The chaos system has been carefully tuned to create an engaging but manageable challenge:

- **Kill Weight**: 1.4× base influence (moderate chaos buildup)
- **Momentum System**: Consecutive kills of the same faction build momentum, but momentum decays at a balanced rate
- **Momentum Factor**: 0.08 (reduced from 0.15 for less aggressive buildup)
- **Momentum Decay**: 0.96 (increased from 0.98 for faster momentum dissipation)
- **Maximum Momentum**: 3.5× (reduced from 5.0 for more manageable chaos shifts)
- **Random Oscillations**: Disabled (removed for predictable, player-action-driven chaos)

## Implementation

### ChaosManager

The ChaosManager class tracks the overall chaos value and related game systems:

```javascript
const chaosManager = new ChaosManager(scene, {
    initialValue: 0,        // Starting at neutral
    minValue: -100,         // Maximum AI dominance
    maxValue: 100,          // Maximum Coder dominance
    killWeight: 1.4,        // Base weight per kill (adjusted for balance)
    panicThreshold: 85      // Threshold for faction rage (previously panic)
});
```

Key methods:
- `registerKill(groupId)`: Records a kill and updates chaos
- `isEnraged(groupId)`: Checks if a faction should be in rage state
- `getMultipliers(groupId)`: Gets stat multipliers for a faction
- `triggerFactionSurge(factionId)`: Creates temporary dramatic surge in enemy spawns

### GroupWeightManager

Handles the dynamic spawn distribution between factions:

```javascript
const groupWeightManager = new GroupWeightManager(scene, {
    // Initial weights are now randomized (30-70) if not explicitly provided
    // This creates unique gameplay experiences in each session
    volatility: 0.35,           // How quickly weights change (0-1)
    enableFluctuations: false,  // Disabled random fluctuations for predictability
    enableSurges: true          // Enables surges based on player kill streaks
});
```

Key methods:
- `pickRandomGroup()`: Returns a deterministically selected group based on current weights
- `registerKill(groupId)`: Records a kill and adjusts weights accordingly
- `temporaryBoost(groupId, multiplier, duration)`: Creates a temporary surge for gameplay events

## Randomized Initial Weights

Each gameplay session now begins with randomized weight distribution between AI and Coder factions:

- **Random Starting Range**: Each faction starts with a weight between 30-70 (previously fixed at 50 each)
- **Session Variety**: Creates a unique starting condition for every gameplay session
- **Strategic Adaptation**: Players must adapt to the initial enemy distribution they encounter
- **Surprise Element**: Players won't know which faction has the initial advantage until they start playing

## Predictability and Player Control

The chaos system has been refined to ensure players have direct and predictable control over the game state:

- **No Random Fluctuations**: Chaos only changes when the player kills enemies, not through random oscillations
- **Predictable Spawn Selection**: The 5% random chance in group selection has been removed
- **Clear Cause and Effect**: Every player action has a direct, predictable impact on game dynamics
- **Player-Driven Gameplay**: All significant changes in faction balance are directly tied to player choices
- **Randomized Initial Weights**: Adds variety and surprise to each session

## Visual Feedback

The chaos system provides clear visual feedback to help players understand the current state:

- Faction surge notifications when dramatic shifts occur
- Particle effects using faction colors during major events
- Screen shake effects when crossing thresholds
- Enemies visibly entering rage state with clear visual indicators (red pulsing and size changes)

## Integrating with Other Systems

The chaos system integrates with these other game systems:

- **Enemy AI**: Determines when factions should enter rage mode and rush the player
- **Enemy Stats**: Modifies health, damage, and other stats based on chaos level
- **Spawn System**: Affects the distribution of enemy groups
- **Visual Effects**: Triggers appropriate visual feedback

## Debugging

Enable debug mode to get detailed logging of the chaos system:

```javascript
// Enable in scene creation
this.isDev = true;
```

This will log:
- Chaos level changes
- Spawn weight adjustments
- Major events and thresholds
- Faction surges

## Design Considerations

### Player Strategy

The chaos system encourages strategic target selection:
- Players who focus on a single faction will face increased resistance from that faction
- Alternating targets maintains more balanced gameplay
- Paying attention to the chaos meter informs optimal strategy
- Players can reliably predict game responses to their actions
- When a faction enters rage mode, extra caution is needed as they become more dangerous

### Game Balance

The system has been tuned to achieve:
- Moderate chaos progression that doesn't get out of hand too quickly
- Clear cause-and-effect relationship between player actions and game response
- Dynamic but manageable difficulty that rewards strategic play
- Predictable behavior that allows players to make informed decisions
- More challenging gameplay when enemies enter rage mode, adding tension

---

*This documentation is maintained by Fluffy-Swizz Interactive development team.*
