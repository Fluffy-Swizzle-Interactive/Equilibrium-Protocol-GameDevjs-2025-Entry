# Chaos System

## Overview

The Chaos System is a central game mechanic that tracks player kill choices and adjusts enemy behavior, stats, and spawn rates dynamically. It creates a constantly shifting balance between the AI and Coder factions.

## Core Concepts

### Chaos Meter

- Ranges from -100 (AI dominance) to +100 (Coder dominance)
- Each player kill shifts the meter toward the opposite faction
- Chaos level determines enemy stats, spawn rates, and special events
- Visual feedback shows current chaos level to the player

### Faction Balance

The balance between factions is determined by the chaos level:
- Positive chaos: Coder dominance (blue UI indicators)
- Negative chaos: AI dominance (red UI indicators)
- Zero chaos: Perfect balance (neutral)

### Kill Weighting

- Killing AI enemies: +1 chaos (toward Coder dominance)
- Killing Coder enemies: -1 chaos (toward AI dominance)
- Enhanced momentum system increases impact of consecutive kills
- Every 8 consecutive kills triggers a faction surge

## Impact on Gameplay

### Faction Behavior

When chaos reaches extreme values (above 85 or below -85):

- **The dominated faction enters rage mode**: When chaos is high positive (>85), AI enemies enter rage mode and rush aggressively toward the player with increased speed and damage. When chaos is high negative (<-85), Coder enemies enter rage mode and do the same.
- **The dominant faction gains power**: The dominant faction receives stat boosts.
- **Maximum chaos cooldown period**: When either faction reaches maximum dominance (±100), the chaos meter locks for 5 seconds, preventing player influence and ensuring a sustained period of maximum faction advantage.

### Spawn Rate Adjustment

- Higher chaos toward one faction increases spawn rates for the opposing faction, creating a natural balancing mechanism
- The spawn system responds dynamically to create varied enemy distributions throughout gameplay
- Spawn weights are consistently predictable based on player actions, not random fluctuations

### Enemy Stat Boosts

The dominated faction receives stat boosts based on the chaos level:
- Health: Up to 20% increase at maximum chaos
- Damage: Up to 30% increase at maximum chaos
- Fire Rate: Up to 20% increase at maximum chaos
- Dodge Frequency: Up to 20% increase at maximum chaos

### Visual Identification

- AI enemies consistently maintain blue tinting
- Coder enemies consistently maintain red tinting
- Tinting persists across all game events, including chaos transitions and faction battles
- The system automatically ensures proper enemy tinting when chaos levels change significantly

## Chaos Events

### Major Events

- **Extreme Values**: When chaos reaches ±100, a major event occurs
- **Threshold Crossings**: Additional events at ±40 and ±70 chaos levels
- **Faction Surges**: Temporarily boosts spawn rates for a specific faction

### Event Effects

- Screen shake (intensity varies by event type)
- Particle bursts using faction colors
- Temporary spawn rate adjustments
- Enemy rage state activation
- Stat multiplier changes

## Integration with Other Systems

The chaos system integrates with these other game systems:

- **Enemy AI**: Determines when factions should enter rage mode and rush the player
- **Enemy Stats**: Modifies health, damage, and other stats based on chaos level
- **Spawn System**: Affects the distribution of enemy groups
- **Visual Effects**: Triggers appropriate visual feedback and ensures consistent faction identification
- **UI Manager**: Displays chaos meter and indicates when it's locked during cooldown
- **Faction Battles**: Determines when enemy factions can fight each other

## Technical Notes

- Momentum system creates dramatic swings in chaos when player focuses on one faction
- Automatic tint restoration ensures visual consistency during faction transitions
- Extreme chaos values trigger a temporary cooldown period before resetting
- Deep integration with GroupManager for enemy tagging and identification
- EventBus communication ensures responsive UI and gameplay updates
