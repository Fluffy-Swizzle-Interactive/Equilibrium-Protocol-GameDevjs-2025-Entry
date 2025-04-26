# Faction Battle System

## Overview

The Faction Battle System creates dynamic battlefield scenarios where AI and Coder enemies fight each other without player intervention. This happens when chaos levels are high enough and enemies from opposing factions are in close proximity to each other.

## Key Components

### Detection System

* Automatically detects when enemy factions are close enough for a battle
* Requires a minimum chaos level (45%)
* Needs minimum enemy count from each faction (4)
* Uses a grid system to efficiently find potential battle areas

### Battle Lifecycle

1. **Detection Phase**: 
   - System checks for enemy clusters every 3 seconds
   - Requires at least 5 enemies from each faction within a 300px area
   - Only activates when chaos is above 40%

2. **Battle Phase**:
   - Enemies are paired into 1v1 matchups
   - Visual effects indicate active battles
   - Battle duration: ~3 seconds

3. **Resolution Phase**:
   - For each pair, a 50% chance determines the winner
   - Losing enemies are eliminated
   - Winning enemies receive speed and damage boosts
   - Victory shifts chaos level +/- 10 points
   
4. **Visual Aftermath**:
   - Winning enemies display a temporary pulsing aura of their faction color
   - Faction tint is properly maintained after the visual effect ends
   - Faction colors persist even after chaos events end (AI = blue, Coder = red)

## Configuration Options

* `chaosThreshold`: Minimum chaos level required for battles (default: 45%)
* `requiredEnemiesPerFaction`: Minimum enemies needed from each faction (default: 4)
* `detectionRadius`: Range to check for enemy clusters (default: 350px)
* `battleCheckInterval`: How often to check for potential battles (default: 2000ms)
* `maxSimultaneousBattles`: Maximum concurrent battles (default: 1)
* `battleCooldown`: Cooldown between battles (default: 15000ms)

## Events

The system emits the following events through the EventBus:

- `FACTION_BATTLE_START`: When a battle begins, with position and team info
- `FACTION_BATTLE_END`: When a battle resolves, with results and winning faction

## Visual Feedback

- **Battle Indicator**: "FACTION BATTLE!" text appears at battle location
- **Particles**: Colorful particle effects show active battles
- **Victory Text**: Shows which faction won ("AI VICTORY!" or "CODER VICTORY!")
- **Victory Aura**: Winning enemies glow with their faction's color
- **Persistent Tinting**: Enemy faction colors remain consistent after battles and chaos events

## Strategic Impact

The Faction Battle System creates interesting strategic choices for players:
- Allow enemies to fight each other to thin their numbers
- Manipulate chaos levels to encourage or prevent battles
- Use battles as distractions to complete objectives
- Take advantage of predictable enemy positioning during battles

## Integration with Chaos System

The Faction Battle System is tightly integrated with the Chaos System:
- Battles only trigger when chaos is above the threshold
- Battle outcomes affect the chaos meter
- Chaos level changes may trigger or prevent faction battles
- Both systems work together to ensure visual consistency with enemy colors

## Technical Notes

- Uses Phaser's particle system for visual effects
- Implements spatial hashing for efficient enemy cluster detection
- Maintains proper faction tinting through chaos transitions
- Properly handles tint restoration for complex sprite hierarchies