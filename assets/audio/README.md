# Audio Assets

This directory contains all audio assets for the game, organized into logical categories.

## Directory Structure

- **sfx/** - Sound effects
  - Contains short sound effects like weapon sounds, player/enemy actions, etc.
  - Example: `laserShoot.wav`, `levelUp.wav`

- **music/** - Background music
  - Contains longer music tracks for different game states
  - Example: `menu_music.mp3`, `gameplay_music.mp3`

- **ui/** - User interface sounds
  - Contains sounds for UI interactions
  - Example: `button_click.wav`, `menu_open.wav`

- **ambient/** - Ambient and environmental sounds
  - Contains ambient loops and environmental sounds
  - Example: `ambient_loop.mp3`, `environment_cave.mp3`

## Audio Format Support

The game supports multiple audio formats for cross-browser compatibility:

- MP3 - Primary format for music and longer ambient sounds
- WAV - Primary format for short sound effects
- OGG - Alternative format for better compression (optional)

## Implementation Notes

When loading audio in the game code, use the following pattern for better browser compatibility:

```javascript
// In Preloader.js
this.load.audio('sound_name', [
    'assets/audio/category/sound_name.mp3',
    'assets/audio/category/sound_name.ogg'
]);
```

## Adding New Audio Files

1. Place the file in the appropriate subdirectory
2. Follow the naming conventions described in each folder's README
3. Update the preloader to load the new audio file
4. Register the sound with the SoundManager if needed
