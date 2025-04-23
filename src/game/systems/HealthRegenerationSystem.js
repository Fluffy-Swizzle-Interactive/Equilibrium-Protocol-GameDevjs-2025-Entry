/**
 * Health Regeneration System
 * Handles applying health regeneration to the player over time
 */
export class HealthRegenerationSystem {
    /**
     * Create a new health regeneration system
     * @param {Phaser.Scene} scene - The scene this system belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.lastRegenTime = 0;
        this.regenInterval = 1000; // Apply regen every 1 second
        
        // Register with scene for easier access
        scene.healthRegenSystem = this;
    }
    
    /**
     * Update method called each frame
     * @param {number} time - Current game time
     * @param {number} delta - Time since last frame in ms
     */
    update(time, delta) {
        // Skip if no player or health system
        if (!this.scene.player) return;
        
        // Get the player's health system
        const healthSystem = this.scene.playerHealth || this.scene.player.healthSystem;
        if (!healthSystem) return;
        
        // Get player's health regen value
        const healthRegen = this.scene.player.healthRegen || 0;
        
        // Skip if no health regen
        if (healthRegen <= 0) return;
        
        // Check if it's time to apply regeneration
        if (time - this.lastRegenTime >= this.regenInterval) {
            this.lastRegenTime = time;
            
            // Apply health regeneration
            const regenAmount = healthRegen * (this.regenInterval / 1000); // Convert to per-second rate
            healthSystem.heal(regenAmount);
            
            // Optional: Show visual feedback for regeneration
            if (regenAmount > 0 && this.scene.player.graphics && Math.random() < 0.3) {
                // Only show visual feedback occasionally (30% chance)
                this.showRegenEffect();
            }
        }
    }
    
    /**
     * Show visual effect for health regeneration
     */
    showRegenEffect() {
        // Skip if no player graphics
        if (!this.scene.player.graphics) return;
        
        // Create a small healing particle effect
        if (this.scene.add.particles) {
            const particles = this.scene.add.particles(
                this.scene.player.graphics.x,
                this.scene.player.graphics.y,
                'particle_texture',
                {
                    speed: { min: 20, max: 50 },
                    scale: { start: 0.2, end: 0 },
                    alpha: { start: 0.8, end: 0 },
                    lifespan: 800,
                    blendMode: 'ADD',
                    quantity: 2,
                    tint: 0x00ff00, // Green particles for healing
                    frequency: 200, // Emit particles every 200ms
                    emitting: true
                }
            );
            
            // Set depth to ensure it's visible
            particles.setDepth(100);
            
            // Stop emitting after a short time
            this.scene.time.delayedCall(800, () => {
                particles.destroy();
            });
        }
    }
}
