# Sound System

## Overview

This document describes the sound system in Fluffy-Swizz Interactive, including audio management, implementation details, and best practices.

## Sound Manager

The game uses a centralized `SoundManager` class to handle all audio playback.

### `SoundManager.js`

**Methods:**
- `constructor(scene)` - Initializes the sound manager for a scene
- `init(options)` - Sets up sound manager with configuration options
- `playSound(key, config)` - Plays a sound effect with optional configuration
- `playMusic(key, config)` - Plays background music with optional configuration
- `stopMusic(key)` - Stops specific background music
- `stopAllMusic()` - Stops all background music
- `fadeMusic(key, duration)` - Fades out specific music track
- `crossFadeMusic(fromKey, toKey, duration)` - Smoothly transitions between tracks
- `setMasterVolume(volume)` - Sets overall volume for all sounds
- `setSoundVolume(volume)` - Sets volume for sound effects only
- `setMusicVolume(volume)` - Sets volume for music only
- `mute()` - Mutes all audio
- `unmute()` - Unmutes all audio
- `toggleMute()` - Toggles mute state
- `destroy()` - Cleans up resources when scene is destroyed

**Properties:**
- `sounds` - Map of all loaded sound effects
- `music` - Map of all loaded music tracks
- `options` - Configuration options
- `isMuted` - Current mute state
- `masterVolume` - Overall volume level (0-1)
- `soundVolume` - Sound effects volume level (0-1)
- `musicVolume` - Music volume level (0-1)

## Implementation

### Initialization

The sound manager is initialized in each scene that requires audio:

```javascript
// In scene's create method
this.soundManager = new SoundManager(this);
this.soundManager.init({
    masterVolume: 0.8,
    soundVolume: 1.0,
    musicVolume: 0.6,
    defaultSoundConfig: {
        rate: 1,
        detune: 0,
        seek: 0,
        loop: false,
        delay: 0
    },
    defaultMusicConfig: {
        rate: 1,
        detune: 0,
        seek: 0,
        loop: true,
        delay: 0,
        volume: 0.6
    }
});
```

### Playing Sound Effects

Sound effects are played using the `playSound` method:

```javascript
// Simple sound playback
this.soundManager.playSound('explosion');

// With configuration
this.soundManager.playSound('gunshot', {
    volume: 0.8,
    rate: 1.2, // Slightly higher pitch
    detune: 0,
    seek: 0,
    loop: false,
    delay: 0
});

// With position-based volume and panning
const distance = Phaser.Math.Distance.Between(
    this.player.x, this.player.y,
    x, y
);
const maxDistance = 500;
const volume = Math.max(0, 1 - (distance / maxDistance));
const pan = Phaser.Math.Clamp((x - this.player.x) / maxDistance, -1, 1);

this.soundManager.playSound('explosion', {
    volume: volume,
    pan: pan
});
```

### Playing Background Music

Background music is played using the `playMusic` method:

```javascript
// Start background music
this.soundManager.playMusic('gameplay_theme');

// Crossfade to boss music
this.soundManager.crossFadeMusic('gameplay_theme', 'boss_theme', 2000);
```

### Sound Variation

To prevent repetitive sounds, the manager supports sound variation:

```javascript
// Play a random variation of a sound
playRandomizedSound(baseKey, variations = 3, config = {}) {
    const randomIndex = Math.floor(Math.random() * variations) + 1;
    const soundKey = `${baseKey}_${randomIndex}`;
    return this.playSound(soundKey, config);
}

// Example usage
this.soundManager.playRandomizedSound('footstep', 4, { volume: 0.5 });
```

## Audio Asset Management

### Required Audio Assets

#### Sound Effects
- `player_hit` - Player takes damage
- `enemy_hit` - Enemy takes damage
- `enemy_death` - Enemy is defeated
- `minigun_fire` - Minigun weapon firing
- `shotgun_fire` - Shotgun weapon firing
- `reload` - Weapon reload
- `pickup_xp` - Collecting XP orb
- `pickup_cash` - Collecting cash
- `pickup_health` - Collecting health
- `level_up` - Player levels up
- `wave_start` - New wave begins
- `wave_complete` - Wave is completed
- `game_over` - Player is defeated
- `victory` - Player wins (wave mode)
- `button_click` - UI button interaction

#### Music Tracks
- `menu_music` - Main menu theme
- `gameplay_music` - Standard gameplay
- `boss_music` - Boss encounters
- `victory_music` - Victory screen
- `game_over_music` - Game over screen

### Audio Format Support

The game supports multiple audio formats for cross-browser compatibility:

```javascript
// In Preloader.js
preload() {
    // Load sound effects with fallbacks
    this.load.audio('explosion', [
        'assets/audio/explosion.mp3',
        'assets/audio/explosion.ogg'
    ]);
    
    // Load music with fallbacks
    this.load.audio('gameplay_music', [
        'assets/audio/gameplay_music.mp3',
        'assets/audio/gameplay_music.ogg'
    ]);
    
    // Additional audio assets...
}
```

## Performance Considerations

### Audio Pooling

The sound manager implements audio pooling to prevent performance issues with many simultaneous sounds:

```javascript
playPooledSound(key, maxInstances = 4, config = {}) {
    // Check if we've reached the maximum instances for this sound
    if (!this.soundInstances[key]) {
        this.soundInstances[key] = 0;
    }
    
    if (this.soundInstances[key] >= maxInstances) {
        // Find the oldest instance and stop it
        const oldestSound = this.activeSounds[key].shift();
        if (oldestSound && oldestSound.isPlaying) {
            oldestSound.stop();
        }
    } else {
        this.soundInstances[key]++;
    }
    
    // Play the sound
    const sound = this.playSound(key, config);
    
    // Add to active sounds list
    if (!this.activeSounds[key]) {
        this.activeSounds[key] = [];
    }
    this.activeSounds[key].push(sound);
    
    // Set up cleanup when sound finishes
    sound.once('complete', () => {
        this.soundInstances[key]--;
        const index = this.activeSounds[key].indexOf(sound);
        if (index !== -1) {
            this.activeSounds[key].splice(index, 1);
        }
    });
    
    return sound;
}
```

### Distance-Based Audio

For better performance and realism, sounds are attenuated based on distance from the player:

```javascript
playPositionalSound(key, x, y, config = {}) {
    // Calculate distance from player
    const distance = Phaser.Math.Distance.Between(
        this.scene.player.x, this.scene.player.y,
        x, y
    );
    
    // Set maximum audible distance
    const maxDistance = config.maxDistance || 800;
    
    // If beyond max distance, don't play the sound
    if (distance > maxDistance) {
        return null;
    }
    
    // Calculate volume based on distance (inverse linear falloff)
    const volume = Math.max(0, 1 - (distance / maxDistance));
    
    // Calculate stereo pan (-1 to 1) based on position relative to player
    const pan = Phaser.Math.Clamp(
        (x - this.scene.player.x) / (maxDistance / 2),
        -1, 1
    );
    
    // Merge with provided config
    const soundConfig = {
        ...config,
        volume: volume * (config.volume || 1),
        pan: pan
    };
    
    // Play the sound with calculated parameters
    return this.playSound(key, soundConfig);
}
```

## Troubleshooting

### Common Audio Issues

#### Sounds Not Playing on Initial Scene Load

If sounds aren't playing when a scene first loads but work after reloading:

1. **Check initialization order**:
   - SoundManager must be initialized before sounds are played
   - Ensure assets are fully loaded before attempting playback

2. **Browser autoplay policies**:
   - Modern browsers require user interaction before playing audio
   - Add a "Click to Start" button for initial user interaction

#### Multiple Music Tracks Playing Simultaneously

If multiple music tracks play at once:

1. **Check for proper stopping**:
   - Always stop current music before starting new tracks
   - Use `stopAllMusic()` when changing scenes

2. **Use crossfading**:
   - The SoundManager handles crossfading between tracks
   - Ensure only one music track is playing at a time

#### Audio Format Support

If audio doesn't play in certain browsers:

1. **Provide multiple formats**:
   - Include both MP3 and OGG versions of audio files
   - Different browsers support different audio formats

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
