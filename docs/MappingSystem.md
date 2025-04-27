# Mapping System

## Overview

This document describes the mapping system in Fluffy-Swizz Interactive, including how maps are created, loaded, and managed during gameplay.

## Core Concepts

The mapping system provides the game environment where gameplay takes place. It handles tile-based maps, collision detection with map elements, and map transitions.

### Map Types

The game supports several map types:

- **Tiled JSON Maps** - Created with the Tiled Map Editor
- **Programmatically Generated Maps** - Created at runtime
- **Array-Based Maps** - Defined using 2D arrays

## Implementation

### Map Manager

The mapping system is managed by the `MapManager` class.

#### `MapManager.js`

**Methods:**
- `constructor(scene)` - Initializes the map manager for a scene
- `preloadMaps()` - Preloads all configured maps
- `createMapFromTiled(key, options)` - Creates a map from Tiled JSON data
- `createMapFromArray(data, tilesetKey, options)` - Creates a map from a 2D array
- `generateRandomMap(width, height, options)` - Generates a random map
- `generateSequentialMap(width, height)` - Generates a sequential map for testing
- `switchMap(key, options)` - Switches to a new map
- `getAvailableMaps()` - Returns a list of all available maps
- `getMapDimensions()` - Returns dimensions of the current map
- `getTileAt(x, y)` - Gets tile at world coordinates
- `setTileAt(x, y, index)` - Sets tile at world coordinates
- `getMapProperty(name)` - Gets a custom property from the map
- `destroy()` - Cleans up all map resources

**Properties:**
- `scene` - Reference to the current scene
- `currentMap` - Current active map
- `currentMapKey` - Key of the current map
- `maps` - Collection of loaded maps
- `mapConfig` - Configuration for maps
- `layers` - Map layers (ground, walls, objects, etc.)
- `collisionLayers` - Layers that have collision enabled

### Map Configuration

Maps are configured with specific properties:

```javascript
// Example map configuration
this.mapConfig = {
    'arena': {
        key: 'arena',
        file: 'assets/maps/arena.json',
        tilesets: ['scifi_tiles'],
        collisionLayers: ['walls'],
        spawnPoints: {
            player: { x: 512, y: 384 },
            enemies: [
                { x: 200, y: 200 },
                { x: 800, y: 200 },
                { x: 200, y: 600 },
                { x: 800, y: 600 }
            ]
        }
    },
    'laboratory': {
        key: 'laboratory',
        file: 'assets/maps/laboratory.json',
        tilesets: ['scifi_tiles', 'lab_tiles'],
        collisionLayers: ['walls', 'equipment'],
        spawnPoints: {
            player: { x: 100, y: 100 },
            enemies: [
                { x: 300, y: 300 },
                { x: 500, y: 300 },
                { x: 700, y: 300 }
            ]
        }
    },
    // Additional maps...
};
```

### Loading Maps

Maps are preloaded during the Preloader scene:

```javascript
// In MapManager.js
preloadMaps() {
    // Preload all map files
    for (const mapKey in this.mapConfig) {
        const map = this.mapConfig[mapKey];

        // Load map file if not already loaded
        if (map.file && !this.scene.cache.tilemap.exists(map.key)) {
            this.scene.load.tilemapTiledJSON(map.key, map.file);
        }

        // Load tilesets if not already loaded
        for (const tilesetKey of map.tilesets) {
            if (!this.scene.textures.exists(tilesetKey)) {
                this.scene.load.image(
                    tilesetKey,
                    `assets/tilesets/${tilesetKey}.png`
                );
            }
        }
    }
}
```

### Creating Maps

Maps can be created from Tiled JSON data:

```javascript
// In MapManager.js
createMapFromTiled(key, options = {}) {
    // Get map configuration
    const mapConfig = this.mapConfig[key];
    if (!mapConfig) {
        console.error(`Map configuration not found for key: ${key}`);
        return null;
    }

    // Create tilemap from loaded JSON
    const map = this.scene.make.tilemap({ key: mapConfig.key });

    // Add tilesets
    const tilesets = [];
    for (const tilesetKey of mapConfig.tilesets) {
        tilesets.push(map.addTilesetImage(tilesetKey, tilesetKey));
    }

    // Create layers
    const layers = {};
    for (const layerData of map.layers) {
        const layer = map.createLayer(
            layerData.name,
            tilesets,
            0, 0
        );

        // Set layer properties
        if (options.scale) {
            layer.setScale(options.scale);
        }

        // Set collision if this is a collision layer
        if (mapConfig.collisionLayers.includes(layerData.name)) {
            layer.setCollisionByProperty({ collides: true });

            // Optionally show debug graphics
            if (options.debug) {
                const debugGraphics = this.scene.add.graphics();
                layer.renderDebug(debugGraphics, {
                    tileColor: null,
                    collidingTileColor: new Phaser.Display.Color(243, 134, 48, 128),
                    faceColor: new Phaser.Display.Color(40, 39, 37, 255)
                });
            }
        }

        // Store layer reference
        layers[layerData.name] = layer;
    }

    // Store map data
    this.currentMap = map;
    this.currentMapKey = key;
    this.layers = layers;

    // Set world bounds based on map size
    this.scene.physics.world.setBounds(
        0, 0,
        map.widthInPixels * (options.scale || 1),
        map.heightInPixels * (options.scale || 1)
    );

    // Return the created map
    return {
        map: map,
        layers: layers,
        config: mapConfig
    };
}
```

Maps can also be created programmatically:

```javascript
// In MapManager.js
generateRandomMap(width, height, options = {}) {
    // Create empty tilemap
    const map = this.scene.make.tilemap({
        tileWidth: 32,
        tileHeight: 32,
        width: width,
        height: height
    });

    // Add tileset
    const tileset = map.addTilesetImage(
        options.tilesetKey || 'scifi_tiles'
    );

    // Create layers
    const groundLayer = map.createBlankLayer('ground', tileset);
    const wallsLayer = map.createBlankLayer('walls', tileset);

    // Fill ground layer with floor tiles
    const floorTile = options.floorTile || 1;
    groundLayer.fill(floorTile);

    // Generate random walls
    const wallTile = options.wallTile || 2;
    const wallDensity = options.wallDensity || 0.1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Add border walls
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                wallsLayer.putTileAt(wallTile, x, y);
                continue;
            }

            // Random internal walls
            if (Math.random() < wallDensity) {
                wallsLayer.putTileAt(wallTile, x, y);
            }
        }
    }

    // Set collision on walls layer
    wallsLayer.setCollisionByExclusion([-1]);

    // Store map data
    this.currentMap = map;
    this.currentMapKey = 'random';
    this.layers = {
        ground: groundLayer,
        walls: wallsLayer
    };

    // Set world bounds
    this.scene.physics.world.setBounds(
        0, 0,
        map.widthInPixels,
        map.heightInPixels
    );

    // Return the created map
    return {
        map: map,
        layers: this.layers,
        config: {
            key: 'random',
            spawnPoints: this.generateSpawnPoints(width, height, wallsLayer)
        }
    };
}
```

### Switching Maps

The game can switch between maps during gameplay:

```javascript
// In MapManager.js
switchMap(key, options = {}) {
    // Clean up current map if it exists
    if (this.currentMap) {
        // Destroy all layers
        for (const layerName in this.layers) {
            this.layers[layerName].destroy();
        }

        // Clear references
        this.layers = {};
    }

    // Create new map
    const mapData = this.createMapFromTiled(key, options);

    // Emit map change event
    this.scene.events.emit('map-changed', {
        key: key,
        map: mapData.map,
        spawnPoints: mapData.config.spawnPoints
    });

    return mapData;
}
```

### Collision Detection

The mapping system integrates with Phaser's physics for collision detection:

```javascript
// In Game.js
setupMapCollision() {
    // Get collision layers
    const collisionLayers = [];
    for (const layerName of this.mapManager.mapConfig[this.currentMapKey].collisionLayers) {
        collisionLayers.push(this.mapManager.layers[layerName]);
    }

    // Set up player collision with map
    for (const layer of collisionLayers) {
        this.physics.add.collider(this.player, layer);
    }

    // Set up enemy collision with map
    for (const layer of collisionLayers) {
        this.physics.add.collider(this.enemyGroup, layer);
    }

    // Set up bullet collision with map
    for (const layer of collisionLayers) {
        this.physics.add.collider(
            this.bulletPool.getGroup(),
            layer,
            (bullet) => {
                // Create impact effect
                this.spritePool.createHitEffect(bullet.x, bullet.y, {
                    tint: 0xCCCCCC,
                    scale: 0.3
                });

                // Release bullet back to pool
                this.bulletPool.releaseBullet(bullet);
            },
            null,
            this
        );
    }
}
```

## Map Features

### Spawn Points

Maps define spawn points for players and enemies:

```javascript
// Example of using spawn points
setupPlayer() {
    // Get player spawn point from current map
    const spawnPoint = this.mapManager.currentMap.config.spawnPoints.player;

    // Create player at spawn point
    this.player = new Player(
        this,
        spawnPoint.x,
        spawnPoint.y,
        this.gameMode
    );
}

spawnEnemies() {
    // Get enemy spawn points from current map
    const spawnPoints = this.mapManager.currentMap.config.spawnPoints.enemies;

    // Spawn enemies at each point
    for (const spawnPoint of spawnPoints) {
        this.enemyFactory.createEnemy(
            'basic',
            spawnPoint.x,
            spawnPoint.y
        );
    }
}
```

### Interactive Tiles

Maps can include interactive tiles with special properties:

```javascript
// In MapManager.js
setupInteractiveTiles() {
    // Check if we have an 'interactive' layer
    if (!this.layers.interactive) return;

    // Get all tiles with the 'interactive' property
    const interactiveTiles = this.layers.interactive.filterTiles(
        tile => tile.properties.interactive
    );

    // Set up each interactive tile
    for (const tile of interactiveTiles) {
        // Get tile properties
        const props = tile.properties;

        // Set up based on interaction type
        switch (props.interactionType) {
            case 'health':
                this.setupHealthTile(tile);
                break;

            case 'teleport':
                this.setupTeleportTile(tile);
                break;

            case 'switch':
                this.setupSwitchTile(tile);
                break;

            // Additional interaction types...
        }
    }
}

setupHealthTile(tile) {
    // Create a physics body for this tile
    this.scene.physics.add.existing(tile, true);

    // Set up overlap with player
    this.scene.physics.add.overlap(
        this.scene.player,
        tile,
        () => {
            // Heal the player
            this.scene.player.heal(tile.properties.healAmount || 20);

            // Play healing sound
            this.scene.soundManager.playSound('health_pickup');

            // Create healing effect
            this.scene.spritePool.createHealEffect(
                tile.pixelX + 16,
                tile.pixelY + 16
            );

            // Disable the tile temporarily
            tile.properties.active = false;
            tile.alpha = 0.3;

            // Reactivate after cooldown
            this.scene.time.delayedCall(
                tile.properties.cooldown || 30000,
                () => {
                    tile.properties.active = true;
                    tile.alpha = 1;
                }
            );
        },
        () => tile.properties.active !== false
    );
}
```

### Destructible Elements

Maps can include destructible elements:

```javascript
// In MapManager.js
setupDestructibles() {
    // Check if we have a 'destructibles' layer
    if (!this.layers.destructibles) return;

    // Get all tiles with the 'destructible' property
    const destructibleTiles = this.layers.destructibles.filterTiles(
        tile => tile.properties.destructible
    );

    // Set up each destructible tile
    for (const tile of destructibleTiles) {
        // Set health property if not already set
        if (tile.properties.health === undefined) {
            tile.properties.health = 100;
        }

        // Create a physics body for this tile
        this.scene.physics.add.existing(tile, true);

        // Set up collision with bullets
        this.scene.physics.add.overlap(
            this.scene.bulletPool.getGroup(),
            tile,
            (tile, bullet) => {
                // Reduce tile health
                tile.properties.health -= bullet.damage;

                // Create impact effect
                this.scene.spritePool.createHitEffect(
                    bullet.x,
                    bullet.y,
                    {
                        tint: 0xCCCCCC,
                        scale: 0.3
                    }
                );

                // Release bullet back to pool
                this.scene.bulletPool.releaseBullet(bullet);

                // Check if tile is destroyed
                if (tile.properties.health <= 0) {
                    // Play destruction sound
                    this.scene.soundManager.playSound('tile_destroy');

                    // Create destruction effect
                    this.scene.spritePool.createDeathEffect(
                        tile.pixelX + 16,
                        tile.pixelY + 16,
                        {
                            tint: 0xAAAAAA,
                            scale: 0.8,
                            lifespan: 1000
                        }
                    );

                    // Remove the tile
                    this.layers.destructibles.removeTileAt(
                        tile.x,
                        tile.y
                    );

                    // Potentially spawn pickup
                    if (Math.random() < 0.3) {
                        this.scene.spritePool.createXPPickup(
                            tile.pixelX + 16,
                            tile.pixelY + 16,
                            { value: 5 }
                        );
                    }
                }
            }
        );
    }
}
```

## Map Transitions

The game can transition between maps during gameplay:

```javascript
// In Game.js
transitionToMap(mapKey) {
    // Show transition effect
    this.cameras.main.fade(500, 0, 0, 0);

    // Wait for fade to complete
    this.cameras.main.once('camerafadeoutcomplete', () => {
        // Switch to new map
        const mapData = this.mapManager.switchMap(mapKey);

        // Move player to spawn point
        const spawnPoint = mapData.config.spawnPoints.player;
        this.player.setPosition(spawnPoint.x, spawnPoint.y);

        // Set up collisions for new map
        this.setupMapCollision();

        // Spawn enemies for new map
        this.spawnEnemies();

        // Fade back in
        this.cameras.main.fadeIn(500);
    });
}
```

## Camera System

The camera follows the player and is constrained by map boundaries:

```javascript
// In Game.js
setupCamera() {
    // Set camera bounds to match map size
    this.cameras.main.setBounds(
        0, 0,
        this.mapManager.currentMap.widthInPixels,
        this.mapManager.currentMap.heightInPixels
    );

    // Set camera to follow player
    this.cameras.main.startFollow(
        this.player,
        true,
        0.1, 0.1 // Lerp factor for smooth following
    );

    // Set camera zoom
    this.cameras.main.setZoom(1);

    // Optional: Add camera effects
    this.cameras.main.setBackgroundColor('#111111');

    // Add camera shake on player damage
    this.events.on('player-damage', () => {
        this.cameras.main.shake(100, 0.01);
    });
}
```

## Performance Considerations

### Culling

The mapping system uses culling to improve performance:

```javascript
// In MapManager.js
optimizeMapRendering() {
    // Enable culling on all layers
    for (const layerName in this.layers) {
        this.layers[layerName].setCullPadding(2);
        this.layers[layerName].setSkipCull(false);
    }

    // Set render order to optimize for top-down view
    this.currentMap.setRenderOrder(Phaser.Tilemaps.RENDER_ORDER_RIGHT_DOWN);
}
```

### Tile Animations

The mapping system supports animated tiles:

```javascript
// In TileMapManager.js
setupAnimatedTiles() {
    // Find tiles with animation properties
    for (const layerName in this.layers) {
        const layer = this.layers[layerName];

        // Get all tiles with animation data
        const animatedTiles = layer.filterTiles(
            tile => tile.properties.animated
        );

        // Set up each animated tile
        for (const tile of animatedTiles) {
            const props = tile.properties;

            // Create animation if it doesn't exist
            const animKey = `tile_anim_${props.animationKey}`;
            if (!this.scene.anims.exists(animKey)) {
                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNumbers(
                        props.spritesheet,
                        {
                            start: props.startFrame,
                            end: props.endFrame
                        }
                    ),
                    frameRate: props.frameRate || 10,
                    repeat: -1
                });
            }

            // Replace tile with sprite
            const sprite = this.scene.add.sprite(
                tile.pixelX + 16,
                tile.pixelY + 16,
                props.spritesheet
            );

            // Play animation
            sprite.play(animKey);

            // Set sprite depth to match layer
            sprite.setDepth(layer.depth);

            // Remove the original tile
            layer.removeTileAt(tile.x, tile.y);
        }
    }
}
```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
