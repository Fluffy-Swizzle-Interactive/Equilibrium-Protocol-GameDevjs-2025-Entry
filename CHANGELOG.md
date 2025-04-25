# Fluffy-Swizz Interactive Gamejam1 - Changelog

## [0.3.0] - 2025-04-25
### Added
- Implemented sprite-based enemy system with faction-colored outlines
  - Created `SpriteEnemy` base class for animated sprite enemies
  - Added specialized enemy types with unique behaviors:
    - `SpriteEnemy1`: Basic melee enemy with chase behavior
    - `SpriteEnemy2`: Tank enemy with charge attack capability 
    - `SpriteEnemy3`: Ranged enemy that maintains distance and fires projectiles
    - `SpriteBoss1`: Complex boss with multiple attack patterns and phases
  - Implemented WebGL outline shader through `OutlinePipeline` class
  - Added faction-based colored outlines for visual identification
- Created `EnemyRegistry` for managing and spawning different enemy types
- Added example `EnemyDemo` class showing how to create faction battles

### Technical
- Implemented shader-based outline effect using Phaser's pipeline system
- Created animation system for enemy sprites with state-based transitions
- Enhanced faction system with visual identification through colored outlines
- Updated documentation in EnemySystem.md and FactionBattleSystem.md

## [0.2.0] - 2025-04-16
### Added
- Implemented animated player character using sprite sheets
  - Added 16 sprite frames (4 directions × 4 frames each) for player movement
  - Created directional animations (up, down, left, right) for both idle and walking states
  - Added smooth transitions between animations based on movement state
- Enhanced asset pipeline to support sprite atlas and individual frames
- Updated documentation to reflect the new character animation system

### Fixed
- Fixed Boss1 summoning ability visual effect bug
  - Added proper cleanup for all circles created during minion summoning
  - Ensured all animation tweens properly destroy their targets on completion
- Fixed issue with sprite atlas reference paths in TESTPLAYER1.json
- Fixed player sprite loading issues in Preloader scene

### Changed
- Improved Player class with more robust animation handling
  - Added fallback mechanism for handling missing frames
  - Enhanced sprite direction logic with quadrant-based aiming
  - Optimized animation state transitions

### Technical
- Refactored Preloader.js to load both atlas and individual sprite frames
- Added robust error handling for texture and animation creation
- Enhanced sprite scaling to properly match collision radius
- Improved documentation in ProjectDoc(VS).md with detailed animation system information

## [0.1.0] - 2025-04-15
### Added
- Initial project setup with Phaser 3.88.2 and React 18.3.1
- Basic game loop and player mechanics
  - Player movement with WASD controls
  - Mouse aiming system
  - Two weapon systems (minigun and shotgun)
- Core game systems
  - Event bus for component communication
  - Object pooling for performance optimization
  - Sound manager for centralized audio control
- Enemy wave management with increasing difficulty
- Basic map system with TileMapManager
- Documentation system in ProjectDoc(VS).md

### Features
- Implemented player with two distinct weapon systems:
  - Minigun: Fast firing rate, medium damage, single projectile
  - Shotgun: Slower firing rate, multiple projectiles with spread
- Enemy types with different behaviors:
  - Basic enemies with simple follow AI
  - Boss enemies with special attack patterns and health bars
- Sound system with ambient music and weapon effects
- Debug panel for development monitoring

### Technical
- Set up project structure following OOP principles
- Implemented object pooling for bullets and enemies
- Built event-driven communication between React and Phaser
- Added documentation with markdown for all major systems