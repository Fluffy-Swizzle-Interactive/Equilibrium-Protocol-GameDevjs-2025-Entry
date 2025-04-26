/**
 * Global object manager that handles pooling for game objects like bullets and enemies
 * Implements object pooling pattern to improve performance by recycling objects
 */
export class GameObjectManager {
    /**
     * Create a new GameObjectManager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        
        // Track active pools by type
        this.pools = {};
        
        // Default configurations for pooled objects
        this.defaultConfigs = {
            bullet: {
                initialSize: 50,
                maxSize: 200,
                growSize: 10
            },
            enemy: {
                initialSize: 20,
                maxSize: 250,
                growSize: 5
            }
        };
        
        // Track stats for debugging
        this.stats = {
            created: {},
            reused: {},
            released: {}
        };
    }

    /**
     * Initialize a new object pool
     * @param {string} type - The type of pool to create (e.g. 'bullet', 'enemy')
     * @param {Function} createFunc - Function to create a new object
     * @param {Function} resetFunc - Function to reset an object for reuse
     * @param {object} options - Custom pool options
     * @returns {object} The created pool
     */
    createPool(type, createFunc, resetFunc, options = {}) {
        // Merge default config with provided options
        const config = {
            ...this.defaultConfigs[type] || {
                initialSize: 20,
                maxSize: 100,
                growSize: 5
            },
            ...options
        };

        // Create the pool structure
        const pool = {
            objects: [],
            type,
            createFunc,
            resetFunc,
            config
        };

        // Store in pools dictionary
        this.pools[type] = pool;

        // Initialize stats counter
        this.stats.created[type] = 0;
        this.stats.reused[type] = 0;
        this.stats.released[type] = 0;

        // Pre-populate pool
        this.populate(type, config.initialSize);

        return pool;
    }

    /**
     * Add objects to a pool
     * @param {string} type - The type of pool to populate
     * @param {number} count - Number of objects to create
     */
    populate(type, count) {
        const pool = this.pools[type];
        if (!pool) {
            console.warn(`Cannot populate non-existent pool of type: ${type}`);
            return;
        }

        for (let i = 0; i < count; i++) {
            const obj = pool.createFunc();
            
            // Set inactive but keep in memory
            if (obj.setActive) {
                obj.setActive(false);
            } else {
                obj.active = false;
            }
            
            if (obj.setVisible) {
                obj.setVisible(false);
            } else {
                obj.visible = false;
            }
            
            pool.objects.push(obj);
            this.stats.created[type]++;
        }

        console.debug(`Populated ${count} objects in ${type} pool. Total: ${pool.objects.length}`);
    }

    /**
     * Get an object from a pool or create a new one if needed
     * @param {string} type - The type of pool to get from
     * @param {...any} args - Arguments to pass to the reset function
     * @returns {object|null} The pooled object or null if limit reached
     */
    get(type, ...args) {
        const pool = this.pools[type];
        if (!pool) {
            console.warn(`Cannot get from non-existent pool of type: ${type}`);
            return null;
        }

        // Find first inactive object
        let obj = pool.objects.find(o => !o.active);

        // If no inactive objects and pool isn't too large, grow the pool
        if (!obj && pool.objects.length < pool.config.maxSize) {
            this.populate(type, pool.config.growSize);
            obj = pool.objects.find(o => !o.active);
        }

        // If we found or created an object, reset and return it
        if (obj) {
            // Set to active
            if (obj.setActive) {
                obj.setActive(true);
            } else {
                obj.active = true;
            }
            
            if (obj.setVisible) {
                obj.setVisible(true);
            } else {
                obj.visible = true;
            }

            // Apply custom reset logic
            pool.resetFunc(obj, ...args);
            
            // Track reuse stats
            this.stats.reused[type]++;
            
            return obj;
        }

        // Pool is full and all objects are active
        console.warn(`Pool of type ${type} is at capacity (${pool.config.maxSize})`);
        return null;
    }

    /**
     * Release an object back to its pool
     * @param {string} type - The pool type
     * @param {object} obj - The object to release
     */
    release(type, obj) {
        const pool = this.pools[type];
        if (!pool) {
            console.warn(`Cannot release to non-existent pool of type: ${type}`);
            return;
        }

        if (!obj || !obj.active) {
            return; // Already inactive or null
        }

        // Set to inactive
        if (obj.setActive) {
            obj.setActive(false);
        } else {
            obj.active = false;
        }
        
        if (obj.setVisible) {
            obj.setVisible(false);
        } else {
            obj.visible = false;
        }

        // Track release stats
        this.stats.released[type]++;
    }

    /**
     * Get statistics about the pools
     * @returns {object} Stats about pool usage
     */
    getStats() {
        const result = {};
        
        for (const type in this.pools) {
            const pool = this.pools[type];
            const activeCount = pool.objects.filter(obj => obj.active).length;
            
            result[type] = {
                total: pool.objects.length,
                active: activeCount,
                available: pool.objects.length - activeCount,
                created: this.stats.created[type] || 0,
                reused: this.stats.reused[type] || 0,
                released: this.stats.released[type] || 0
            };
        }
        
        return result;
    }

    /**
     * Clear all pools and release resources
     */
    destroy() {
        for (const type in this.pools) {
            const pool = this.pools[type];
            
            // Destroy all objects that have a destroy method
            pool.objects.forEach(obj => {
                if (obj.destroy && typeof obj.destroy === 'function') {
                    obj.destroy();
                }
            });
            
            // Clear the pool array
            pool.objects.length = 0;
        }
        
        // Clear pools object
        this.pools = {};
        this.stats = { created: {}, reused: {}, released: {} };
    }

    /**
     * Update all active objects in a pool
     * @param {string} type - The pool type to update
     * @param {Function} updateFunc - Function to call for each active object
     */
    updatePool(type, updateFunc) {
        const pool = this.pools[type];
        if (!pool) return;

        pool.objects.forEach(obj => {
            if (obj.active) {
                updateFunc(obj);
            }
        });
    }
}