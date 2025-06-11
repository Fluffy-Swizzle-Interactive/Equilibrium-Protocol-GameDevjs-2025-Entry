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

### Wave Progression Issues

If rounds/waves fail to progress or get stuck:

#### Invisible Enemies in Walls
Sometimes enemies can spawn inside walls or obstacles, making them unreachable by player bullets:

**Symptoms:**
- Wave doesn't complete despite appearing to have no visible enemies
- Enemy counter shows active enemies but none are visible on screen
- Debug panel shows active enemies count > 0

**Debug Steps:**
1. Press `U` key in development mode to enable hitbox visualization
2. Look for red circles (normal enemies) or magenta circles (stuck enemies)
3. Check the browser console for debug messages about stuck enemies
4. Use the debug panel to verify enemy counts match actual visible enemies

**Automatic Fixes (Implemented):**
- Enemy spawn validation now checks collision with walls/obstacles
- Stuck enemy detection automatically removes unreachable enemies
- Enhanced cleanup runs every 15 seconds to remove problematic enemies

**Manual Fixes:**
- Use the "Next Wave" button in debug panel to force wave progression
- Restart the current wave if enemies remain stuck
- Check collision layer setup in the map configuration

#### Enemy Count Mismatches
If tracked enemy counts don't match actual enemies:

**Debug Steps:**
1. Open browser console and look for "[WaveManager]" debug messages
2. Check for enemy count mismatches or cleanup operations
3. Verify that enemy pools are properly releasing destroyed enemies

**Console Test:**
Run this in browser console to diagnose enemy issues:
```javascript
// Check current enemy state
const scene = window.phaserGame?.scene?.getScene('WaveGame');
if (scene?.waveManager) {
    scene.waveManager.verifyEnemyCount();
}
```
