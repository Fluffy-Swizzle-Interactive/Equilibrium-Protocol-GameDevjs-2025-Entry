# Faction Battle System

## Overview

The Faction Battle System creates dynamic combat between enemy factions when they're in close proximity and chaos levels are high. This creates emergent gameplay where enemies will fight each other without player intervention, potentially providing strategic advantages to the player.

## Core Concepts

- **Proximity-based Detection**: When enough enemies from opposing factions are near each other, they may trigger a battle
- **Chaos Threshold**: Battles only occur when chaos levels exceed 40% (in either direction)
- **Battle Resolution**: Each enemy pairing has a 50% chance of winning their individual fight
- **Victory Effects**: The winning faction receives temporary stat boosts
- **Visual Identification**: Enemies have faction-colored outlines to easily identify their allegiances

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

### Sprite-Based Enemy System Integration

The Faction Battle System works seamlessly with the sprite-based enemy system:
- Enemies display colored outlines based on their faction
- `GROUP_IDS` are used to determine faction membership
- Visual distinction aids player in identifying which enemies will fight each other
- Special animations play during faction battles

## Faction Identification

Enemies are visually identified by faction-colored outlines:

- **FRIENDLY** (Group ID 1): Green outline
- **HOSTILE** (Group ID 2): Red outline
- **NEUTRAL** (Group ID 3): Yellow outline
- **FACTION_A** (Group ID 4): Blue outline
- **FACTION_B** (Group ID 5): Orange outline
- **FACTION_C** (Group ID 6): Purple outline

Example of setting an enemy's faction:

```javascript
// Set an enemy to be part of Faction A
enemy.setGroupId(GROUP_IDS.FACTION_A);
```

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

### Creating Faction Battles Programmatically

Using the EnemyDemo helper class, you can set up faction battles easily:

```javascript
// Create the demo helper
const enemyDemo = new EnemyDemo(scene);

// Set up a battle between two factions
const battleEnemies = enemyDemo.setupFactionBattle(10, 
    { x: 300, y: 300 },  // Faction A position
    { x: 700, y: 300 }   // Faction B position
);
```

## Events

The system emits the following events through the EventBus:

- `FACTION_BATTLE_START`: When a battle begins, with position and team info
- `FACTION_BATTLE_END`: When a battle resolves, with results and winning faction

## Visual Feedback

- **Colored Outlines**: Each enemy has a colored outline indicating their faction
- **Battle Indicator**: "FACTION BATTLE!" text appears at battle location
- **Particles**: Colorful particle effects show active battles
- **Victory Text**: Shows which faction won ("AI VICTORY!" or "CODER VICTORY!")
- **Victory Aura**: Winning enemies glow with their faction's color
- **Battle Animations**: Enemies use special attack animations during battles

## Strategic Impact

The Faction Battle System creates interesting strategic choices for players:
- Allow enemies to fight each other to thin their numbers
- Manipulate chaos levels to encourage or prevent battles
- Use battles as distractions to complete objectives
- Take advantage of predictable enemy positioning during battles
- Identify friendly factions (green outline) for potential allies
- Target hostile factions (red outline) as priority threats