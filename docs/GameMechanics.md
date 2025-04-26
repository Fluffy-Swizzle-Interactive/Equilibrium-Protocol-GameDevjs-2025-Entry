# Game Mechanics

This document outlines the core game mechanics implemented in the Fluffy-Swizz Interactive game.

## Player Controls

### Movement
- **WASD** - Move the player character in four directions
- **Mouse** - Aim weapon
- **Left Click** - Fire weapon
- **Space** - Pause/unpause the game

### Advanced Movement
- Diagonal movement is handled with normalized vector math to ensure consistent movement speed
- Player speed can be upgraded through the shop system

## Combat System

### Weapon Mechanics
- Auto-fire when mouse button is held
- Configurable fire rate (shots per second)
- Configurable damage per shot
- Upgradeable through the shop system

### Damage Calculation
- Base damage per bullet
- Critical hit chance (configurable percentage)
- Critical hit multiplier (default: 2x)
- Enemy resistances can reduce damage taken

### Health System
- Player has health points (HP)
- Damage reduces HP
- Health can be regenerated through pickups or regeneration upgrades

## Game Modes

### Endless Survival

- Infinite waves of enemies
- Increasing difficulty over time
- Goal: Survive as long as possible and achieve high score

**Difficulty Scaling:**
- Enemy health: +5% per minute
- Enemy speed: +3% per minute
- Enemy spawn rate: +10% per minute
- Boss spawn: Every 5 minutes

### Wave-Based Survival

- Fixed number of waves (20)
- Each wave has specific enemy types and counts
- Short break between waves
- Goal: Complete all waves

**Wave Structure:**
- Waves 1-5: Basic enemies
- Waves 6-10: Mix of basic and fast enemies
- Waves 11-15: Mix of all enemy types
- Waves 16-19: Difficult enemy combinations
- Wave 20: Final boss wave

**Boss Waves:**
- Every 5th wave (5, 10, 15, 20)
- Bosses have increased health, damage, and special abilities
- Boss waves provide greater rewards

## Progression Systems

### XP System
- Killing enemies grants XP
- XP fills a progress bar
- When the bar is filled, player levels up
- Each level grants improved stats or ability points

### Cash System
- Killing enemies has a chance to drop cash
- Cash can be used to purchase upgrades in the shop
- Upgrades improve various player attributes

### Shop System
- Available between waves
- Offers a selection of upgrades
- Categories: Weapons, Defense, Utility
- Upgrade costs increase with power level

## Enemy Systems

### Enemy Types

#### Basic Enemies
- Basic melee attackers
- Fast movement, low health
- Deals damage on contact

#### Ranged Enemies
- Attacks from a distance
- Lower movement speed
- Fires projectiles at player

#### Elite Enemies
- Enhanced versions of basic types
- More health and damage
- Special abilities

#### Boss Enemies
- Unique, powerful enemies
- Very high health
- Multiple attack patterns
- Special abilities

### Enemy Behavior
- AI-driven movement
- Path finding to avoid obstacles
- Target acquisition and tracking
- Group coordination in later waves
- Dynamic difficulty adjustment

## Collectible System

### XP Orbs
- Dropped by enemies when killed
- Automatically attracted to player within a certain radius
- Increases XP bar progress

### Cash Pickups
- Randomly dropped by enemies
- Must be collected manually
- Increases player's cash reserves

### Health Pickups
- Rare drops from enemies
- Restores a percentage of player health
- Automatically attracted to player when health is low

## Special Mechanics

### Chaos System
- Chaos level increases as the game progresses
- Higher chaos leads to more enemy spawns and faction conflicts
- Visual indicators show current chaos level
- Affects enemy behavior and spawn patterns

### Faction Battles
- Different enemy factions can fight each other
- Triggered randomly or at high chaos levels
- Player can exploit faction conflicts to their advantage
- Factions have strengths and weaknesses against each other

## Map System

### Map Generation
- Predefined tilemapped levels
- Various environment types
- Obstacles and barriers affect movement
- Strategic choke points

### Environmental Objects
- Destructible objects
- Hazards that damage enemies or player
- Cover that blocks projectiles
- Interactive elements

## Audio System

### Dynamic Music
- Different music for different game states:
  - Menu music
  - Ambient exploration
  - Combat music
  - Boss fight themes
  - Victory/defeat themes
- Smooth transitions between tracks

### Sound Effects
- Weapon sounds
- Enemy sounds
- Environmental sounds
- UI feedback sounds
- Positional audio for immersion

## UI System

### Heads-Up Display (HUD)
- Health bar
- XP bar
- Cash counter
- Wave/time indicator
- Minimap (when applicable)

### Menus
- Main menu
- Pause menu
- Shop interface
- Game over screen
- Victory screen

## Technical Systems

### Object Pooling
- Reuses game objects for better performance
- Applied to bullets, enemies, effects
- Dynamically grows pools when needed

### Collision Optimization
- Spatial grid system for faster collision checks
- Only checks collisions for nearby objects
- Custom hitboxes for precise detection

### Performance Monitoring
- FPS counter
- Debug information display
- Performance optimization options

---

## Appendix

### Damage Formula
```
finalDamage = (baseDamage * critMultiplier) - enemyResistance
```

### XP Formula
```
xpRequired = baseXP * (currentLevel * levelScaling)
```

### Enemy Scaling
```
enemyHealth = baseHealth * (1 + (waveNumber * 0.1))
enemyDamage = baseDamage * (1 + (waveNumber * 0.05))
```
