# Asset Management

## Overview

This document describes the asset management system in Fluffy-Swizz Interactive, including how game assets are organized, loaded, and used throughout the game.

## Asset Organization

### Directory Structure

Assets are organized in a structured directory hierarchy:

```
public/
├── assets/
│   ├── images/
│   │   ├── ui/           # UI elements
│   │   ├── sprites/      # Character and object sprites
│   │   ├── effects/      # Visual effects
│   │   ├── backgrounds/  # Background images
│   │   └── icons/        # Game icons
│   ├── audio/
│   │   ├── music/        # Background music
│   │   └── sfx/          # Sound effects
│   ├── maps/
│   │   ├── tilesets/     # Tileset images
│   │   └── data/         # Map JSON files
│   └── fonts/            # Custom game fonts
└── favicon.png           # Browser tab icon
```

### Naming Conventions

Assets follow consistent naming conventions:

- **Images**: `category_name_variant.png` (e.g., `enemy_basic_blue.png`)
- **Spritesheets**: `category_name_spritesheet.png` (e.g., `player_minigun_spritesheet.png`)
- **Audio**: `category_name_variant.mp3` (e.g., `sfx_explosion_large.mp3`)
- **Maps**: `map_name.json` (e.g., `map_arena.json`)

## Asset Loading

### Preloader Scene

Assets are loaded in the dedicated Preloader scene:

#### `Preloader.js`

**Methods:**
- `preload()` - Loads all game assets
- `create()` - Transitions to MainMenu scene when loading is complete

**Loading Process:**
```javascript
// In Preloader.js
preload() {
    // Display loading progress
    this.createLoadingUI();
    
    // Load images
    this.loadImages();
    
    // Load spritesheets
    this.loadSpritesheets();
    
    // Load audio
    this.loadAudio();
    
    // Load maps
    this.loadMaps();
    
    // Load fonts
    this.loadFonts();
}

loadImages() {
    // UI elements
    this.load.image('logo', 'assets/images/ui/logo.png');
    this.load.image('button', 'assets/images/ui/button.png');
    this.load.image('health_bar', 'assets/images/ui/health_bar.png');
    
    // Backgrounds
    this.load.image('bg_menu', 'assets/images/backgrounds/menu_bg.png');
    this.load.image('bg_game', 'assets/images/backgrounds/game_bg.png');
    
    // Effects
    this.load.image('particle_texture', 'assets/images/effects/particle.png');
    this.load.image('explosion', 'assets/images/effects/explosion.png');
    this.load.image('muzzle_flash', 'assets/images/effects/muzzle_flash.png');
    
    // Additional images...
}

loadSpritesheets() {
    // Player spritesheets
    this.load.spritesheet('player_minigun', 
        'assets/images/sprites/player_minigun_spritesheet.png',
        { frameWidth: 64, frameHeight: 64 }
    );
    
    this.load.spritesheet('player_shotgun', 
        'assets/images/sprites/player_shotgun_spritesheet.png',
        { frameWidth: 64, frameHeight: 64 }
    );
    
    // Enemy spritesheets
    this.load.spritesheet('enemy_basic', 
        'assets/images/sprites/enemy_basic_spritesheet.png',
        { frameWidth: 48, frameHeight: 48 }
    );
    
    this.load.spritesheet('enemy_fast', 
        'assets/images/sprites/enemy_fast_spritesheet.png',
        { frameWidth: 32, frameHeight: 32 }
    );
    
    this.load.spritesheet('enemy_tank', 
        'assets/images/sprites/enemy_tank_spritesheet.png',
        { frameWidth: 64, frameHeight: 64 }
    );
    
    // Additional spritesheets...
}

loadAudio() {
    // Music tracks with fallbacks for different browsers
    this.load.audio('menu_music', [
        'assets/audio/music/menu_music.mp3',
        'assets/audio/music/menu_music.ogg'
    ]);
    
    this.load.audio('gameplay_music', [
        'assets/audio/music/gameplay_music.mp3',
        'assets/audio/music/gameplay_music.ogg'
    ]);
    
    this.load.audio('boss_music', [
        'assets/audio/music/boss_music.mp3',
        'assets/audio/music/boss_music.ogg'
    ]);
    
    // Sound effects with fallbacks
    this.load.audio('player_hit', [
        'assets/audio/sfx/player_hit.mp3',
        'assets/audio/sfx/player_hit.ogg'
    ]);
    
    this.load.audio('enemy_hit', [
        'assets/audio/sfx/enemy_hit.mp3',
        'assets/audio/sfx/enemy_hit.ogg'
    ]);
    
    this.load.audio('minigun_fire', [
        'assets/audio/sfx/minigun_fire.mp3',
        'assets/audio/sfx/minigun_fire.ogg'
    ]);
    
    this.load.audio('shotgun_fire', [
        'assets/audio/sfx/shotgun_fire.mp3',
        'assets/audio/sfx/shotgun_fire.ogg'
    ]);
    
    // Additional audio...
}

loadMaps() {
    // Tilesets
    this.load.image('scifi_tiles', 'assets/maps/tilesets/scifi_tiles.png');
    
    // Map data
    this.load.tilemapTiledJSON('map_arena', 'assets/maps/data/arena.json');
    this.load.tilemapTiledJSON('map_laboratory', 'assets/maps/data/laboratory.json');
    
    // Additional maps...
}

loadFonts() {
    // Web fonts are loaded via CSS
    // For bitmap fonts:
    this.load.bitmapFont(
        'pixel_font',
        'assets/fonts/pixel_font.png',
        'assets/fonts/pixel_font.xml'
    );
}

createLoadingUI() {
    // Create loading bar background
    this.add.rectangle(512, 384, 450, 50, 0x333333)
        .setOrigin(0.5);
    
    // Create loading bar
    this.loadingBar = this.add.rectangle(287, 384, 400, 30, 0x00ff00)
        .setOrigin(0, 0.5);
    
    // Create loading text
    this.loadingText = this.add.text(512, 340, 'Loading...', {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff'
    }).setOrigin(0.5);
    
    // Create progress text
    this.progressText = this.add.text(512, 430, '0%', {
        fontFamily: 'Arial',
        fontSize: 18,
        color: '#ffffff'
    }).setOrigin(0.5);
    
    // Update progress bar as assets load
    this.load.on('progress', (value) => {
        this.loadingBar.width = 400 * value;
        this.progressText.setText(`${Math.floor(value * 100)}%`);
    });
    
    // Clean up when loading complete
    this.load.on('complete', () => {
        this.loadingBar.destroy();
        this.loadingText.destroy();
        this.progressText.destroy();
    });
}
```

### Dynamic Asset Loading

Some assets may be loaded dynamically during gameplay:

```javascript
// Example: Loading a new map during gameplay
loadNewMap(mapKey) {
    // Show loading indicator
    const loadingText = this.add.text(512, 384, 'Loading Map...', {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
    
    // Check if map is already loaded
    if (this.cache.tilemap.exists(mapKey)) {
        loadingText.destroy();
        this.createMap(mapKey);
        return;
    }
    
    // Get map configuration
    const mapConfig = this.mapManager.mapConfig[mapKey];
    
    // Load map and required assets
    this.load.tilemapTiledJSON(mapKey, mapConfig.file);
    
    // Load any missing tilesets
    for (const tilesetKey of mapConfig.tilesets) {
        if (!this.textures.exists(tilesetKey)) {
            this.load.image(
                tilesetKey, 
                `assets/maps/tilesets/${tilesetKey}.png`
            );
        }
    }
    
    // Start loading
    this.load.start();
    
    // When loading completes, create the map
    this.load.on('complete', () => {
        loadingText.destroy();
        this.createMap(mapKey);
    });
}
```

## Asset Usage

### Sprites and Animations

Sprites and animations are created from loaded assets:

```javascript
// Creating player animations
createPlayerAnimations() {
    // Minigun animations
    this.anims.create({
        key: 'minigun_idle',
        frames: this.anims.generateFrameNumbers('player_minigun', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: -1
    });
    
    this.anims.create({
        key: 'minigun_move',
        frames: this.anims.generateFrameNumbers('player_minigun', { frames: [4, 5, 6, 7] }),
        frameRate: 12,
        repeat: -1
    });
    
    this.anims.create({
        key: 'minigun_fire',
        frames: this.anims.generateFrameNumbers('player_minigun', { frames: [8, 9, 10, 11] }),
        frameRate: 15,
        repeat: 0
    });
    
    // Shotgun animations
    this.anims.create({
        key: 'shotgun_idle',
        frames: this.anims.generateFrameNumbers('player_shotgun', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: -1
    });
    
    this.anims.create({
        key: 'shotgun_move',
        frames: this.anims.generateFrameNumbers('player_shotgun', { frames: [4, 5, 6, 7] }),
        frameRate: 12,
        repeat: -1
    });
    
    this.anims.create({
        key: 'shotgun_fire',
        frames: this.anims.generateFrameNumbers('player_shotgun', { frames: [8, 9, 10, 11] }),
        frameRate: 15,
        repeat: 0
    });
    
    // Enemy animations
    // ...
}
```

### Audio Management

Audio assets are managed through the SoundManager:

```javascript
// Playing sound effects
this.soundManager.playSound('minigun_fire', {
    volume: 0.8,
    rate: 1.0,
    detune: 0
});

// Playing music
this.soundManager.playMusic('gameplay_music', {
    volume: 0.6,
    loop: true
});

// Crossfading music
this.soundManager.crossFadeMusic('gameplay_music', 'boss_music', 2000);
```

### Texture Atlases

For complex sprites, texture atlases are used:

```javascript
// Loading a texture atlas
preload() {
    this.load.atlas(
        'ui_atlas',
        'assets/images/ui/ui_atlas.png',
        'assets/images/ui/ui_atlas.json'
    );
}

// Using frames from the atlas
create() {
    this.add.image(100, 100, 'ui_atlas', 'button_normal.png');
    this.add.image(200, 100, 'ui_atlas', 'button_hover.png');
    this.add.image(300, 100, 'ui_atlas', 'button_pressed.png');
}
```

## Asset Requirements

### Required Assets

#### Images

| Asset | Description | Size | Format |
|-------|-------------|------|--------|
| `logo.png` | Game logo | 512x256 | PNG |
| `player_minigun_spritesheet.png` | Player with minigun | 512x512 (8x8 grid) | PNG |
| `player_shotgun_spritesheet.png` | Player with shotgun | 512x512 (8x8 grid) | PNG |
| `enemy_basic_spritesheet.png` | Basic enemy | 384x384 (8x8 grid) | PNG |
| `enemy_fast_spritesheet.png` | Fast enemy | 256x256 (8x8 grid) | PNG |
| `enemy_tank_spritesheet.png` | Tank enemy | 512x512 (8x8 grid) | PNG |
| `boss1_spritesheet.png` | First boss | 768x768 (8x8 grid) | PNG |
| `particle_texture.png` | Particle effect texture | 16x16 | PNG |
| `bullet_minigun.png` | Minigun bullet | 8x8 | PNG |
| `bullet_shotgun.png` | Shotgun pellet | 6x6 | PNG |
| `scifi_tiles.png` | Tileset for maps | 512x512 (16x16 tiles) | PNG |

#### Audio

| Asset | Description | Format | Duration |
|-------|-------------|--------|----------|
| `menu_music.mp3/ogg` | Main menu music | MP3/OGG | 2-3 minutes (looping) |
| `gameplay_music.mp3/ogg` | Main gameplay music | MP3/OGG | 3-4 minutes (looping) |
| `boss_music.mp3/ogg` | Boss encounter music | MP3/OGG | 2-3 minutes (looping) |
| `player_hit.mp3/ogg` | Player takes damage | MP3/OGG | <1 second |
| `enemy_hit.mp3/ogg` | Enemy takes damage | MP3/OGG | <1 second |
| `enemy_death.mp3/ogg` | Enemy is defeated | MP3/OGG | <1 second |
| `minigun_fire.mp3/ogg` | Minigun weapon firing | MP3/OGG | <1 second |
| `shotgun_fire.mp3/ogg` | Shotgun weapon firing | MP3/OGG | <1 second |
| `pickup_xp.mp3/ogg` | Collecting XP orb | MP3/OGG | <1 second |
| `pickup_cash.mp3/ogg` | Collecting cash | MP3/OGG | <1 second |
| `level_up.mp3/ogg` | Player levels up | MP3/OGG | <1 second |
| `wave_start.mp3/ogg` | New wave begins | MP3/OGG | <1 second |
| `wave_complete.mp3/ogg` | Wave is completed | MP3/OGG | <1 second |
| `game_over.mp3/ogg` | Player is defeated | MP3/OGG | <1 second |
| `victory.mp3/ogg` | Player wins | MP3/OGG | <1 second |
| `button_click.mp3/ogg` | UI button interaction | MP3/OGG | <1 second |

#### Maps

| Asset | Description | Format |
|-------|-------------|--------|
| `arena.json` | Main arena map | Tiled JSON |
| `laboratory.json` | Laboratory themed map | Tiled JSON |

### Asset Creation Guidelines

#### Sprites

- **Player Sprites**:
  - 64x64 pixels per frame
  - 8 frames of animation per action
  - Actions: idle, move, fire, hit, die
  - Consistent origin point (center)

- **Enemy Sprites**:
  - Basic: 48x48 pixels per frame
  - Fast: 32x32 pixels per frame
  - Tank: 64x64 pixels per frame
  - Boss: 96x96 pixels per frame
  - Actions: idle, move, attack, hit, die
  - Consistent origin point (center)

#### Audio

- **Sound Effects**:
  - Short duration (<1 second for most effects)
  - Normalized volume levels
  - Both MP3 and OGG formats for cross-browser support
  - 44.1kHz sample rate, 128-192kbps bitrate

- **Music**:
  - Seamless looping
  - Consistent volume levels
  - Both MP3 and OGG formats
  - 44.1kHz sample rate, 192-256kbps bitrate

#### Maps

- **Tiled Maps**:
  - 32x32 pixel tiles
  - Include collision layers
  - Include spawn point objects
  - Use properties for interactive tiles

## Asset Optimization

### Image Optimization

- Use texture atlases for related sprites
- Compress PNG files using tools like TinyPNG
- Use appropriate image sizes (avoid oversized assets)
- Consider using WebP format with PNG fallback

### Audio Optimization

- Compress audio files appropriately
- Use lower bitrates for sound effects
- Consider using the Web Audio API for dynamic effects
- Implement audio pooling for frequently played sounds

### Loading Optimization

- Preload essential assets first
- Load non-essential assets during gameplay
- Use a loading screen with progress indicator
- Consider implementing asset streaming for large games

## Asset Management Tools

### Texture Packer

For creating and managing texture atlases:

```javascript
// Example Texture Packer configuration
{
    "textureName": "ui_atlas",
    "width": 1024,
    "height": 1024,
    "padding": 2,
    "allowRotation": false,
    "allowTrimming": true,
    "fixedSize": false,
    "powerOfTwo": true,
    "algorithm": "MaxRects",
    "format": "phaser"
}
```

### Tiled Map Editor

For creating and editing game maps:

- Use Tiled Map Editor (https://www.mapeditor.org/)
- Export maps in JSON format
- Create custom properties for special tiles
- Use object layers for spawn points and triggers

### Audio Tools

- Audacity for editing audio files
- FFMPEG for format conversion
- Howler.js integration for advanced audio features

## Troubleshooting

### Common Asset Issues

#### Missing Assets

If assets fail to load:

1. Check file paths and case sensitivity
2. Verify assets are in the correct directory
3. Check browser console for 404 errors
4. Ensure preloader is waiting for all assets

```javascript
// Ensure preloader waits for all assets
create() {
    // Only proceed when all assets are loaded
    if (this.load.isLoading()) {
        this.load.once('complete', () => {
            this.scene.start('MainMenu');
        });
    } else {
        this.scene.start('MainMenu');
    }
}
```

#### Texture Issues

If textures appear incorrect:

1. Check texture dimensions (power of two is recommended)
2. Verify texture format is supported
3. Check for CORS issues if loading from external sources
4. Ensure proper mipmap settings

```javascript
// Configure texture settings
this.load.image('example', 'path/to/image.png', {
    flipY: false,
    generateMipmap: true
});
```

#### Audio Issues

If audio doesn't play:

1. Check browser audio format support
2. Verify audio files are correctly encoded
3. Ensure audio is played after user interaction (browser autoplay policies)
4. Check for multiple audio playback conflicts

```javascript
// Handle browser autoplay restrictions
create() {
    // Create a "Click to Start" button
    const startButton = this.add.text(512, 384, 'Click to Start', {
        fontFamily: 'Arial',
        fontSize: 32,
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();
    
    // Start game and audio on click
    startButton.once('pointerdown', () => {
        startButton.destroy();
        this.soundManager.init();
        this.startGame();
    });
}
```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
