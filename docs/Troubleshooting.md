# Troubleshooting Guide

This document provides solutions for common issues encountered during development and gameplay.

## Debug Panel Features

The Debug Panel provides various tools to help diagnose and troubleshoot issues during development:

- **Open Shop**: Opens the shop interface for testing item purchases
- **Spawn Drone**: Adds a drone to the player's arsenal (increases max drones if needed)
- **Next Wave**: Immediately starts the next wave if in pause phase
- **Add XP**: Grants 50 XP to the player
- **Add Cash**: Adds $100 to the player's cash
- **Toggle Chaos**: Switches between positive and negative chaos values
- **Increase Fire Rate**: Reduces weapon firing delay by 20%, making weapons shoot faster
- **Game Stats**: Shows FPS, game mode, survival time, and kill count
- **Wave Info**: Displays current wave status and enemy counts
- **XP & Level**: Shows player level and progress
- **Position**: Indicates player and mouse coordinates
- **Entity Counts**: Shows active enemies, bullets, and collectibles
- **Object Pools**: Displays active/total objects in the pool system

## Common Issues

### Performance Drops

If you encounter performance drops, try these steps:
1. Enable the Debug Panel to check FPS
2. Reduce the number of active enemies with the Enemy Manager
3. Check if particle effects are causing the slowdown
4. Verify bullet count isn't excessive

### TypeError: anims.setTimeScale is not a function

This error can occur when trying to manipulate animation speed before properly checking if the animation object exists:

```javascript
// INCORRECT - May cause errors if animation doesn't exist
sprite.anims.setTimeScale(2);

// CORRECT - Check for existence of method first
if (sprite.anims && typeof sprite.anims.setTimeScale === 'function') {
    sprite.anims.setTimeScale(2);
}
```

This is particularly important for boss entities that have complex animation state management and might be attempting to play or modify animations that aren't fully loaded or initialized yet.

### Missing Assets

If game assets are not loading correctly:
1. Check the console for 404 errors
2. Verify the asset path in the asset manifest
3. Make sure the asset is correctly placed in the public/assets directory
4. Try clearing the browser cache
