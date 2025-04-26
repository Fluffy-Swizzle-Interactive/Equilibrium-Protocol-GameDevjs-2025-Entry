# Scene Transitions

## Overview

This document describes the scene transition system in Fluffy-Swizz Interactive, focusing on the flow between different game scenes and the purpose of each transition scene.

## Scene Flow

The game follows a structured scene flow:

1. **Boot** - Initializes core game components
2. **Preloader** - Loads assets and resources
3. **MainMenu** - Entry point for player interaction
4. **PreSpawn** - Instructions and preparation before gameplay
5. **WaveGame** - Main gameplay scene
6. **ShopMenu** - Upgrade system between waves
7. **GameOver** - End of game state

## Scene Descriptions

### PreSpawn Scene

The `PreSpawn` scene serves as a transitional scene between the Main Menu and actual gameplay, providing players with:
- Game instructions
- Controls explanation
- Weapon information
- Gameplay objectives

#### Implementation

The PreSpawn scene is implemented in `PreSpawn.js` as a Phaser Scene class:

```javascript
import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { SoundManager } from '../managers/SoundManager';
import { DEPTHS } from '../constants';

export class PreSpawn extends Scene {
    constructor() {
        super('PreSpawn');
    }
    
    init(data) {
        // Store data passed from MainMenu
        this.startWave = data.startWave || 0;
    }
    
    create() {
        // Scene setup and UI elements
        // ...
    }
    
    startGame() {
        // Transition to WaveGame scene
        // ...
    }
    
    backToMainMenu() {
        // Return to MainMenu scene
        // ...
    }
}
```

#### Key Features

- **Game Instructions**: Clear, concise text explaining game controls and objectives
- **Weapon Information**: Visual representation and description of the player's weapon
- **Navigation Buttons**: Options to start the game or return to the main menu
- **Data Passing**: Preserves data (like starting wave number) between scenes

#### UI Components

The PreSpawn scene contains the following UI elements:

- Semi-transparent background overlay
- Title text ("GAME INSTRUCTIONS")
- Instruction list (movement, aiming, shooting, etc.)
- Weapon information section
- Start Game button (green)
- Back to Menu button (gray)
- Visual representation of the player's weapon/bullet

#### Scene Transitions

The PreSpawn scene handles transitions to:

1. **WaveGame** - When the player clicks "START GAME"
   ```javascript
   startGame() {
       // Play button click sound
       this.soundManager.playSoundEffect('button_click');
       
       // Transition effect
       this.cameras.main.fadeOut(500, 0, 0, 0);
       
       this.cameras.main.once('camerafadeoutcomplete', () => {
           // Start the wave-based game with the stored wave number
           this.scene.start('WaveGame', { 
               startWave: this.startWave || 0
           });
       });
   }
   ```

2. **MainMenu** - When the player clicks "BACK TO MENU"
   ```javascript
   backToMainMenu() {
       // Play button click sound
       this.soundManager.playSoundEffect('button_click');
       
       // Transition effect
       this.cameras.main.fadeOut(500, 0, 0, 0);
       
       this.cameras.main.once('camerafadeoutcomplete', () => {
           this.scene.start('MainMenu');
       });
   }
   ```

#### Audio Integration

The PreSpawn scene uses the SoundManager for audio feedback:

```javascript
setupSoundManager() {
    // Create sound manager
    this.soundManager = new SoundManager(this);
    
    // Initialize sound effects
    this.soundManager.initSoundEffect('button_click', {
        volume: 0.6,
        rate: 1.0
    });
}
```

## Suggested Enhancements

Future enhancements to the scene transition system could include:

1. **Animated Tutorials**: Add simple animations demonstrating gameplay mechanics
2. **Interactive Elements**: Allow players to test controls before starting
3. **Difficulty Selection**: Add options to select game difficulty
4. **Dynamic Tips**: Show different gameplay tips each time the scene loads
5. **Skip Option**: Allow returning players to skip instruction screens

## Integration with Game Flow

The scene transition system is designed to create a smooth player experience:

```
MainMenu → PreSpawn → WaveGame → (ShopMenu between waves) → GameOver
```

Each transition includes fade effects and appropriate audio cues to enhance immersion.

## Troubleshooting Scene Transitions

Common issues and solutions with scene transitions:

1. **Black Screen Between Scenes** 
   - Ensure fadeOut and fadeIn effects complete before transitioning
   - Check that all scene keys are registered correctly in `main.js`

2. **Data Loss Between Scenes**
   - Use scene init() method to capture passed data
   - Verify data is properly passed in scene.start() calls

3. **UI Elements Persisting Between Scenes**
   - Ensure UI elements are properly destroyed in scene shutdown
   - Check for global DOM elements that might persist

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*