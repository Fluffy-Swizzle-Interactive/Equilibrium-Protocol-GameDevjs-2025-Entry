
# Equilibrium Protocol -- GameDevjs 2025 Entry By Fluffy Swizzle Interactive

## Overview

Equilibrium Protocol is a top-down shooter game built with Phaser 3 and React. Players use a unified weapon system and must survive as long as possible against increasingly difficult waves of enemies.

### Tech Stack

- **Game Engine**: Phaser 3.88.2
- **UI Framework**: React 18.3.1
- **Build Tool**: Vite 5.3.1

## Documentation Index

This documentation is organized into modular sections for easier navigation and maintenance:

### Core Systems

- [Architecture](/docs/Architecture.md) - System architecture and project structure
- [Game Entities](/docs/GameEntities.md) - Player, enemies, and other game objects
- [Game Mechanics](/docs/GameMechanics.md) - Core gameplay systems and interactions
- [Scene Transitions](/docs/SceneTransitions.md) - Scene flow and transition screens

### User Interface

- [UI Components](/docs/UIComponents.md) - User interface elements and their functionality

### Game Systems

- [Sound System](/docs/SoundSystem.md) - Audio management and implementation
- [XP System](/docs/XPSystem.md) - Experience points and leveling mechanics
- [Cash System](/docs/CashSystem.md) - In-game currency and economy
- [Wave Game Mode](/docs/WaveGameMode.md) - Wave-based gameplay implementation
- [Mapping System](/docs/MappingSystem.md) - Map creation and management
- [Enemy System](/docs/EnemySystem.md) - Enemy types, behavior, and spawning
- [Chaos System](/docs/ChaosSystem.md) - Chaos meter and related mechanics
- [Weapon System](/docs/WeaponSystem.md) - Unified weapon mechanics and upgrades

### Development

- [Development Guidelines](/docs/DevelopmentGuidelines.md) - Coding standards and practices
- [Asset Management](/docs/AssetManagement.md) - Asset handling and requirements
- [Troubleshooting](/docs/Troubleshooting.md) - Common issues and solutions

## Getting Started

For new developers joining the project, we recommend starting with:

1. [Architecture](/docs/Architecture.md) to understand the project structure
2. [Development Guidelines](/docs/DevelopmentGuidelines.md) for coding standards
3. The specific system documentation relevant to your assigned tasks

## Development Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

## Building for Production

Build the game for production:
```bash
npm run build
```

The production build will be in the `dist` folder.

## Deployment to itch.io

### Automatic Deployment (CI/CD)

This project is configured with GitHub Actions for automatic deployment to itch.io when changes are pushed to the main branch.

#### Prerequisites:

1. Create an itch.io account at https://itch.io
2. Create a new game page on itch.io with project name: `gjg2`
3. Generate a Butler API key at https://itch.io/user/settings/api-keys
4. Add the API key as a GitHub secret named `BUTLER_API_KEY` in your repository settings

#### How it works:

- When changes are pushed to the `main` branch, GitHub Actions will:
  - Build the project
  - Deploy to itch.io using Butler
  - Channel will be set to `web` for browser-based play
  - The game will be published to https://fluffymcchicken.itch.io/gjg2

### Manual Deployment

You can also deploy manually using npm scripts:

```bash
# Deploy to web channel
npm run deploy

# Deploy to windows-web channel
npm run deploy:win

# Deploy to all channels
npm run deploy:all
```

#### Prerequisites for manual deployment:

1. Install Butler: https://itch.io/docs/butler/installing.html
   - Or use the included `install-butler.bat` script on Windows
2. Log in to Butler:
```bash
butler login
```

## Contributing to Documentation

When updating documentation:

1. Keep each file focused on a single topic
2. Use consistent formatting (headings, code blocks, lists)
3. Include practical examples where helpful
4. Update the documentation when making code changes

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
