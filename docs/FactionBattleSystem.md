# Faction Battle System

## Overview

The Faction Battle System creates dynamic combat between enemy factions when they're in close proximity and chaos levels are high. This creates emergent gameplay where enemies will fight each other without player intervention, potentially providing strategic advantages to the player.

## Core Concepts

- **Proximity-based Detection**: When enough enemies from opposing factions are near each other, they may trigger a battle
- **Chaos Threshold**: Battles only occur when chaos levels exceed 40% (in either direction)
- **Battle Resolution**: Each enemy pairing has a 50% chance of winning their individual fight
- **Victory Effects**: The winning faction receives temporary stat boosts

## Key Components

### FactionBattleManager

The central manager class that handles detection, execution, and resolution of faction battles.

```javascript
const factionBattleManager = new FactionBattleManager(scene, {
    chaosThreshold: 40,               // Minimum chaos level (40%)
    requiredEnemiesPerFaction: 5,     // Need 5 enemies from each faction
    totalEnemiesRequired: 10,         // Total enemies needed
    detectionRadius: 300,             // Detection radius in pixels
    battleCheckInterval: 3000,        // Check every 3 seconds
    victoryChance: 0.5                // 50% chance for either side to win
});
```

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

## Integration with Other Systems

### Chaos System Integration

The Faction Battle System is closely tied to the Chaos System:
- Battles are only possible above 40% chaos
- Battle outcomes affect the chaos level
- Higher chaos increases battle frequency

### GroupManager Integration

Relies on the GroupManager to:
- Find groups of enemies by faction
- Track enemy relations and positions
- Register battle-related kills

## Usage

The FactionBattleManager is initialized in the main game scene and needs references to both the GroupManager and ChaosManager:

```javascript
// Create and register manager
const factionBattleManager = new FactionBattleManager(this);

// Initialize after all managers exist
factionBattleManager.initialize();

// Start/stop battle detection manually (also handled automatically)
factionBattleManager.startBattleDetection();
factionBattleManager.stopBattleDetection();

// For debugging, force a battle at a specific location
factionBattleManager.forceBattle(x, y, radius);
```

## Events

The system emits the following events through the EventBus:

- `FACTION_BATTLE_START`: When a battle begins, with position and team info
- `FACTION_BATTLE_END`: When a battle resolves, with results and winning faction

## Visual Feedback

- **Battle Indicator**: "FACTION BATTLE!" text appears at battle location
- **Particles**: Colorful particle effects show active battles
- **Victory Text**: Shows which faction won ("AI VICTORY!" or "CODER VICTORY!")
- **Victory Aura**: Winning enemies glow with their faction's color

## Strategic Impact

The Faction Battle System creates interesting strategic choices for players:
- Allow enemies to fight each other to thin their numbers
- Manipulate chaos levels to encourage or prevent battles
- Use battles as distractions to complete objectives
- Take advantage of predictable enemy positioning during battles