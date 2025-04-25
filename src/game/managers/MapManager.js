import { DEPTHS } from '../constants';

/**
 * MapManager class
 * Handles loading, managing, and switching between different maps
 * Provides utilities for map scaling and proper boundary management
 */
export class MapManager {
    /**
     * Create a new map manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {Object} options - Configuration options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.currentMapKey = null;
        this.maps = new Map(); // Store map configurations
        this.tilesets = new Map(); // Store tileset configurations

        // Default options for map scaling and physics
        this.defaultOptions = {
            scaleFactor: 1.5, // Default scale: 50% larger than needed to fit screen
            enablePhysics: true, // Enable physics boundaries
            defaultTileWidth: 32,
            defaultTileHeight: 32
        };

        // Merge provided options with defaults
        this.options = { ...this.defaultOptions, ...options };

        // Register this manager with the scene for easy access
        this.scene.mapManager = this;

        // Initialize maps from options if provided
        if (options.maps) {
            this.registerMaps(options.maps);
        }
    }

    /**
     * Register multiple maps at once
     * @param {Object[]} maps - Array of map configuration objects
     */
    registerMaps(maps) {
        if (!Array.isArray(maps)) {
            console.error('Maps must be an array of map configuration objects');
            return;
        }

        maps.forEach(mapConfig => {
            this.registerMap(mapConfig);
        });
    }

    /**
     * Register a single map
     * @param {Object} mapConfig - Map configuration object
     * @param {string} mapConfig.key - Unique key for this map
     * @param {string} mapConfig.tilemapKey - Key for tilemap JSON file
     * @param {Object} mapConfig.tilesets - Tileset configuration
     * @param {Object} mapConfig.layers - Layer configuration
     * @param {Object} mapConfig.options - Optional map-specific options
     */
    registerMap(mapConfig) {
        if (!mapConfig.key || !mapConfig.tilemapKey) {
            console.error('Map configuration must include key and tilemapKey');
            return;
        }

        // Store the map configuration
        this.maps.set(mapConfig.key, mapConfig);

        // Store tileset configurations if provided
        if (mapConfig.tilesets) {
            mapConfig.tilesets.forEach(tileset => {
                this.tilesets.set(tileset.key, tileset);
            });
        }
    }

    /**
     * Load all registered maps
     * Call this in the scene's preload method
     */
    preloadMaps() {
        this.maps.forEach((mapConfig, key) => {
            // Load tilemap JSON if not already loaded
            if (mapConfig.tilemapKey && !this.scene.load.cacheManager.tilemap.exists(mapConfig.tilemapKey)) {
                this.scene.load.tilemapTiledJSON(mapConfig.tilemapKey, mapConfig.tilemapPath || `assets/${mapConfig.tilemapKey}.json`);
            }

            // Load tilesets for this map if not already loaded
            if (mapConfig.tilesets) {
                mapConfig.tilesets.forEach(tilesetConfig => {
                    if (tilesetConfig.key && !this.scene.textures.exists(tilesetConfig.key)) {
                        this.scene.load.image(tilesetConfig.key, tilesetConfig.imagePath || `assets/${tilesetConfig.key}.png`);
                    }
                });
            }
        });
    }

    /**
     * Load a specific map
     * @param {string} mapKey - Key of the map to load
     * @returns {Object} Map data and layers
     */
    loadMap(mapKey) {
        // Cleanup any existing map
        this.cleanupCurrentMap();

        // Get the map configuration
        const mapConfig = this.maps.get(mapKey);
        if (!mapConfig) {
            console.error(`Map with key ${mapKey} is not registered`);
            return null;
        }

        // Create the tilemap
        const tilemap = this.scene.make.tilemap({ key: mapConfig.tilemapKey });

        // For storing created tilesets
        const createdTilesets = new Map();

        // Add tilesets to the map
        if (mapConfig.tilesets) {
            mapConfig.tilesets.forEach(tilesetConfig => {
                const tileset = tilemap.addTilesetImage(
                    tilesetConfig.name || tilesetConfig.key,
                    tilesetConfig.key
                );
                createdTilesets.set(tilesetConfig.key, tileset);
            });
        }

        // Create layers based on configuration
        const createdLayers = new Map();

        if (mapConfig.layers) {
            mapConfig.layers.forEach(layerConfig => {
                // Get the tileset for this layer
                let tileset;
                if (layerConfig.tilesetKey) {
                    tileset = createdTilesets.get(layerConfig.tilesetKey);
                } else if (createdTilesets.size === 1) {
                    // If only one tileset is available, use it
                    tileset = createdTilesets.values().next().value;
                }

                if (tileset) {
                    const layer = tilemap.createLayer(
                        layerConfig.name,
                        tileset,
                        layerConfig.offsetX || 0,
                        layerConfig.offsetY || 0
                    );

                    if (layer) {
                        // Apply layer-specific configurations
                        if (layerConfig.visible === false) layer.setVisible(false);
                        if (layerConfig.alpha !== undefined) layer.setAlpha(layerConfig.alpha);

                        // Set depth based on configuration or default value from constants
                        // This is important for proper rendering order
                        if (layerConfig.depth !== undefined) {
                            layer.setDepth(layerConfig.depth);
                        } else if (layerConfig.name.toLowerCase().includes('ground')) {
                            layer.setDepth(DEPTHS.MAP_GROUND);
                        } else if (layerConfig.name.toLowerCase().includes('wall')) {
                            layer.setDepth(DEPTHS.MAP_WALLS);
                        } else if (layerConfig.name.toLowerCase().includes('decoration')) {
                            layer.setDepth(DEPTHS.MAP_DECORATION);
                        } else {
                            // Default depth ensures map layers are below game entities
                            layer.setDepth(DEPTHS.MAP_GROUND);
                        }

                        // Store created layer
                        createdLayers.set(layerConfig.name, layer);
                    }
                }
            });
        } else {
            // If no specific layers configured, try to create all layers from the map
            // using the first tileset (simple case for single tileset maps)
            const tileset = createdTilesets.values().next().value;
            if (tileset) {
                const layerData = tilemap.layers.map(l => l.name);
                layerData.forEach((layerName, index) => {
                    const layer = tilemap.createLayer(layerName, tileset);
                    if (layer) {
                        // Set depth based on layer name or index
                        if (layerName.toLowerCase().includes('ground')) {
                            layer.setDepth(DEPTHS.MAP_GROUND);
                        } else if (layerName.toLowerCase().includes('wall')) {
                            layer.setDepth(DEPTHS.MAP_WALLS);
                        } else if (layerName.toLowerCase().includes('decoration')) {
                            layer.setDepth(DEPTHS.MAP_DECORATION);
                        } else {
                            // Default depth = index to preserve stacking order from Tiled
                            layer.setDepth(index);
                        }

                        createdLayers.set(layerName, layer);
                    }
                });
            }
        }

        // Scale the map appropriately
        this.scaleMap(tilemap, createdLayers);

        // Set up physics if enabled
        if (this.options.enablePhysics !== false) {
            this.setupMapPhysics(tilemap, createdLayers, mapConfig);
        }

        // Store the current map data
        this.currentMapData = {
            key: mapKey,
            tilemap,
            tilesets: createdTilesets,
            layers: createdLayers,
            mapDimensions: this.calculateMapDimensions(tilemap, createdLayers)
        };

        this.currentMapKey = mapKey;

        return this.currentMapData;
    }

    /**
     * Calculate the dimensions of the currently loaded map
     * @param {Phaser.Tilemaps.Tilemap} tilemap - The tilemap
     * @param {Map} layers - The map layers
     * @returns {Object} The map dimensions
     */
    calculateMapDimensions(tilemap, layers) {
        // Get the base map dimensions
        const mapWidth = tilemap.widthInPixels;
        const mapHeight = tilemap.heightInPixels;

        // Get the scale from the first layer (assuming all layers have same scale)
        let scale = 1;
        if (layers.size > 0) {
            const firstLayer = layers.values().next().value;
            scale = firstLayer.scaleX || 1; // Use scaleX as we assume uniform scaling
        }

        // Calculate effective dimensions after scaling
        const effectiveWidth = mapWidth * scale;
        const effectiveHeight = mapHeight * scale;

        return {
            baseWidth: mapWidth,
            baseHeight: mapHeight,
            width: effectiveWidth,
            height: effectiveHeight,
            scale
        };
    }

    /**
     * Scale the map to fit the screen appropriately
     * @param {Phaser.Tilemaps.Tilemap} tilemap - The tilemap
     * @param {Map} layers - The map layers
     */
    scaleMap(tilemap, layers) {
        const mapConfig = this.maps.get(this.currentMapKey);
        const scaleFactor = mapConfig?.options?.scaleFactor || this.options.scaleFactor;

        // Calculate map scaling to fit the screen
        const mapWidth = tilemap.widthInPixels;
        const mapHeight = tilemap.heightInPixels;

        const scaleX = this.scene.game.config.width / mapWidth;
        const scaleY = this.scene.game.config.height / mapHeight;

        // Use the largest scale to ensure the map covers the screen
        // Multiply by scaleFactor to make it larger/smaller than needed
        const scale = Math.max(scaleX, scaleY) * scaleFactor;

        // Apply scaling to all layers
        layers.forEach(layer => {
            layer.setScale(scale);
        });
    }

    /**
     * Set up physics boundaries and collision for the map
     * @param {Phaser.Tilemaps.Tilemap} tilemap - The tilemap
     * @param {Map} layers - The map layers
     * @param {Object} mapConfig - The map configuration
     */
    setupMapPhysics(tilemap, layers, mapConfig) {
        // Calculate the effective dimensions after scaling
        const dimensions = this.calculateMapDimensions(tilemap, layers);

        // Set world bounds based on map dimensions
        this.scene.physics.world.setBounds(
            0, 0,
            dimensions.width,
            dimensions.height
        );

        // Set up collision for specific layers if configured
        if (mapConfig.collisionLayers) {
            mapConfig.collisionLayers.forEach(layerName => {
                const layer = layers.get(layerName);
                if (layer) {
                    // Check if this is the Level1-REDUX map
                    if (mapConfig.key === 'level1redux') {
                        // Use collision groups defined in Tiled
                        layer.setCollisionFromCollisionGroup();

                        // Debug collision visualization removed
                    }
                    // If specific properties are defined for collision, use them
                    else if (mapConfig.collisionProperties) {
                        layer.setCollisionByProperty(mapConfig.collisionProperties);
                    } else {
                        // Otherwise enable collision for all tiles
                        layer.setCollision(0, tilemap.getTileLayerNames().length);
                    }
                }
            });
        }
    }

    /**
     * Clean up the current map to prepare for a new one
     */
    cleanupCurrentMap() {
        if (this.currentMapData) {
            // Destroy layers
            this.currentMapData.layers.forEach(layer => {
                layer.destroy();
            });

            // Clear references
            this.currentMapData.layers.clear();
            this.currentMapData.tilesets.clear();

            // Null out current map data
            this.currentMapData = null;
        }
    }

    /**
     * Get current map dimensions
     * @returns {Object} Current map dimensions or null if no map is loaded
     */
    getMapDimensions() {
        if (!this.currentMapData) return null;
        return this.currentMapData.mapDimensions;
    }

    /**
     * Get a specific layer from the current map
     * @param {string} layerName - Name of the layer
     * @returns {Phaser.Tilemaps.TilemapLayer} The requested layer or null if not found
     */
    getLayer(layerName) {
        if (!this.currentMapData || !this.currentMapData.layers) return null;
        return this.currentMapData.layers.get(layerName) || null;
    }

    /**
     * Find a random walkable position on the map
     * Useful for entity spawning
     * @param {Object} options - Options for position finding
     * @param {number} options.margin - Margin from edges (in pixels)
     * @param {string} options.avoidLayer - Layer name to avoid collision with
     * @returns {Object} Random position {x, y}
     */
    findRandomPosition(options = {}) {
        if (!this.currentMapData) return null;

        const dimensions = this.currentMapData.mapDimensions;
        const margin = options.margin || 50;

        let x, y, positionValid;
        let attempts = 0;
        const maxAttempts = 50;

        do {
            positionValid = true;
            attempts++;

            // Generate random position within bounds
            x = Phaser.Math.Between(margin, dimensions.width - margin);
            y = Phaser.Math.Between(margin, dimensions.height - margin);

            // Check collision with specified layer if needed
            if (options.avoidLayer) {
                const layer = this.getLayer(options.avoidLayer);
                if (layer) {
                    const tile = layer.getTileAtWorldXY(x, y);
                    if (tile && tile.collides) {
                        positionValid = false;
                    }
                }
            }
        } while (!positionValid && attempts < maxAttempts);

        return { x, y };
    }

    /**
     * Check if a position is valid (within bounds and not colliding)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} options - Options for validation
     * @param {string} options.collisionLayer - Layer to check for collision
     * @returns {boolean} Whether the position is valid
     */
    isPositionValid(x, y, options = {}) {
        if (!this.currentMapData) return false;

        const dimensions = this.currentMapData.mapDimensions;

        // Check if within world bounds
        if (x < 0 || x > dimensions.width || y < 0 || y > dimensions.height) {
            return false;
        }

        // Check collision with specified layer if needed
        if (options.collisionLayer) {
            const layer = this.getLayer(options.collisionLayer);
            if (layer) {
                const tile = layer.getTileAtWorldXY(x, y);
                if (tile && tile.collides) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Switch to a different map
     * @param {string} mapKey - Key of the map to switch to
     * @param {Object} options - Options for the switch
     * @param {boolean} options.fadeOut - Whether to fade out before switching
     * @param {boolean} options.fadeIn - Whether to fade in after switching
     * @param {number} options.fadeDuration - Duration of the fade transition
     * @returns {Promise} Resolves when map switch is complete
     */
    switchMap(mapKey, options = {}) {
        return new Promise((resolve) => {
            const fadeOut = options.fadeOut !== false;
            const fadeIn = options.fadeIn !== false;
            const fadeDuration = options.fadeDuration || 500;

            const doSwitch = () => {
                // Load the new map
                const mapData = this.loadMap(mapKey);

                // Fade in if needed
                if (fadeIn) {
                    this.scene.cameras.main.fadeIn(fadeDuration);
                    this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                        resolve(mapData);
                    });
                } else {
                    resolve(mapData);
                }
            };

            // Fade out if needed
            if (fadeOut) {
                this.scene.cameras.main.fadeOut(fadeDuration);
                this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, doSwitch);
            } else {
                doSwitch();
            }
        });
    }
}