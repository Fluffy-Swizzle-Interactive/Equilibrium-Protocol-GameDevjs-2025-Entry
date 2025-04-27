import { EventBus } from '../EventBus';

/**
 * KillTimerManager
 * Tracks timing of enemy kills for game mechanics that depend on kill timing
 */
export class KillTimerManager {
    constructor(scene) {
        this.scene = scene;
        
        // Track last kill time (in ms since game start)
        this.lastKillTime = 0;
        
        // Track time between kills
        this.timeSinceLastKill = 0;
        
        // Register with scene for easy access
        scene.killTimerManager = this;
        
        // Listen for enemy-killed events
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        EventBus.on('enemy-killed', this.onEnemyKilled, this);
    }
    
    /**
     * Handle enemy killed event
     * @param {Object} data - Event data containing the killed enemy
     */
    onEnemyKilled(data) {
        this.lastKillTime = this.scene.time.now;
        
        // Reset time since last kill
        this.timeSinceLastKill = 0;
        
        // Emit event with timing data
        EventBus.emit('kill-timer-updated', {
            lastKillTime: this.lastKillTime,
            timeSinceLastKill: this.timeSinceLastKill
        });
    }
    
    /**
     * Update method to be called in the scene's update loop
     */
    update() {
        if (this.lastKillTime > 0) {
            this.timeSinceLastKill = this.scene.time.now - this.lastKillTime;
        }
    }
    
    /**
     * Get time since last kill in milliseconds
     * @returns {number} Time since last kill in ms
     */
    getTimeSinceLastKill() {
        return this.timeSinceLastKill;
    }
    
    /**
     * Get the timestamp of the last kill
     * @returns {number} Timestamp of last kill
     */
    getLastKillTime() {
        return this.lastKillTime;
    }
}