/**
 * PlayerHealth class
 * Manages player's health, damage, and death handling
 */
export class PlayerHealth {
    /**
     * Create a new player health manager
     * @param {Phaser.Scene} scene - The scene this player belongs to
     * @param {Object} options - Configuration options
     */
    constructor(scene, options = {}) {
        this.scene = scene;

        // Health configuration
        this.maxHealth = options.maxHealth || 100;
        this.currentHealth = this.maxHealth;
        this.hitDamage = options.hitDamage || 34; // Set to make player die in 3 hits by default
        this.isInvulnerable = false;
        this.invulnerabilityTime = options.invulnerabilityTime || 1000; // ms of invulnerability after hit

        // Damage resistance (for armor upgrades)
        this.damageResistance = options.damageResistance !== undefined ? options.damageResistance : 0; // 0 = no resistance, 1 = 100% resistance

        // Visual feedback properties
        this.damageFlashDuration = options.damageFlashDuration || 200;
        this.damageFlashColor = options.damageFlashColor || 0xff0000;

        // Connect to UI Manager if available
        if (scene.uiManager) {
            scene.uiManager.updateHealthUI(this.currentHealth, this.maxHealth);
        }
    }

    /**
     * Take damage from an enemy or hazard
     * @param {number} amount - Amount of damage to take (defaults to standard hit damage)
     * @returns {boolean} Whether the player died from this damage
     */
    takeDamage(amount = this.hitDamage) {
        // If invulnerable, ignore damage
        if (this.isInvulnerable) return false;

        // Apply damage resistance if any
        if (this.damageResistance > 0) {
            amount = Math.max(1, amount * (1 - this.damageResistance));
        }

        // Reduce health
        this.currentHealth = Math.max(0, this.currentHealth - amount);

        // Update UI if available
        if (this.scene.uiManager) {
            this.scene.uiManager.updateHealthUI(this.currentHealth, this.maxHealth);
        }

        // Show visual feedback
        this.showDamageEffect();

        // Set temporary invulnerability
        this.setInvulnerable();

        // Check if player died
        if (this.currentHealth <= 0) {
            this.onDeath();
            return true;
        }

        // Play hit sound if sound manager is available
        if (this.scene.soundManager) {
            this.scene.soundManager.playSoundEffect('player_hit', { volume: 0.5 });
        }

        return false;
    }

    /**
     * Set player invulnerability for a short period
     */
    setInvulnerable() {
        this.isInvulnerable = true;

        // Clear any existing invulnerability timer
        if (this.invulnerabilityTimer) {
            this.scene.time.removeEvent(this.invulnerabilityTimer);
        }

        // Set new timer
        this.invulnerabilityTimer = this.scene.time.delayedCall(
            this.invulnerabilityTime,
            () => {
                this.isInvulnerable = false;
            }
        );
    }

    /**
     * Show visual effect when player takes damage
     */
    showDamageEffect() {
        // Get player sprite if available
        const playerSprite = this.scene.player?.graphics;

        if (!playerSprite) return;

        // Flash player red
        playerSprite.setTint(this.damageFlashColor);

        // Return to normal after flash duration
        this.scene.time.delayedCall(
            this.damageFlashDuration,
            () => {
                playerSprite.clearTint();
            }
        );

        // Add camera shake for impact feel
        this.scene.cameras.main.shake(100, 0.01);
    }

    /**
     * Handle player death
     */
    onDeath() {
        // Play death sound if sound manager is available
        if (this.scene.soundManager) {
            this.scene.soundManager.playSoundEffect('player_death', { volume: 0.7 });
        }

        // Show death animation
        this.showDeathAnimation();

        // Tell scene player died
        if (this.scene.playerDeath) {
            this.scene.time.delayedCall(1000, () => {
                this.scene.playerDeath();
            });
        }
    }

    /**
     * Show death animation effect
     */
    showDeathAnimation() {
        // Get player sprite if available
        const playerSprite = this.scene.player?.graphics;

        if (!playerSprite) return;

        // Stop player movement
        if (this.scene.player) {
            this.scene.player.velX = 0;
            this.scene.player.velY = 0;
        }

        // Create explosion effect
        this.scene.time.delayedCall(250, () => {
            // Create a particle emitter for death explosion
            if (this.scene.add.particles) {
                const particles = this.scene.add.particles(playerSprite.x, playerSprite.y, 'particle_texture', {
                    speed: { min: 100, max: 300 },
                    scale: { start: 0.4, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 600,
                    blendMode: 'ADD',
                    quantity: 30,
                    angle: { min: 0, max: 360 }
                });

                particles.setDepth(150);
            }
        });

        // Make player sprite fade out
        this.scene.tweens.add({
            targets: playerSprite,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 1000,
            ease: 'Power2'
        });
    }

    /**
     * Heal the player
     * @param {number} amount - Amount of health to restore
     */
    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);

        // Update UI if available
        if (this.scene.uiManager) {
            this.scene.uiManager.updateHealthUI(this.currentHealth, this.maxHealth);
        }

        // Optional visual feedback for healing
        const playerSprite = this.scene.player?.graphics;
        if (playerSprite) {
            playerSprite.setTint(0x00ff00); // Green flash
            this.scene.time.delayedCall(
                200,
                () => {
                    playerSprite.clearTint();
                }
            );
        }
    }

    /**
     * Reset player health to maximum
     */
    reset() {
        this.currentHealth = this.maxHealth;
        this.isInvulnerable = false;

        if (this.invulnerabilityTimer) {
            this.scene.time.removeEvent(this.invulnerabilityTimer);
            this.invulnerabilityTimer = null;
        }

        // Update UI if available
        if (this.scene.uiManager) {
            this.scene.uiManager.updateHealthUI(this.currentHealth, this.maxHealth);
        }
    }

    /**
     * Set the maximum health
     * @param {number} maxHealth - New maximum health value
     */
    setMaxHealth(maxHealth) {
        this.maxHealth = maxHealth;

        // Update UI if available
        if (this.scene.uiManager) {
            this.scene.uiManager.updateHealthUI(this.currentHealth, this.maxHealth);
        }
    }

    /**
     * Get the current health value
     * @returns {number} Current health
     */
    getCurrentHealth() {
        return this.currentHealth;
    }

    /**
     * Get the maximum health value
     * @returns {number} Maximum health
     */
    getMaxHealth() {
        return this.maxHealth;
    }

    /**
     * Set the damage resistance value (from armor upgrades)
     * @param {number} resistance - Resistance value between 0 and 1
     */
    setDamageResistance(resistance) {
        // Clamp between 0 and 0.9 (never allow 100% damage resistance)
        this.damageResistance = Math.min(0.9, Math.max(0, resistance));
    }

    /**
     * Get current damage resistance value
     * @returns {number} Damage resistance between 0 and 1
     */
    getDamageResistance() {
        return this.damageResistance;
    }

    /**
     * Get current health percentage
     * @returns {number} Health percentage between 0 and 1
     */
    getHealthPercent() {
        return this.currentHealth / this.maxHealth;
    }

    /**
     * Get whether player is currently invulnerable
     * @returns {boolean} True if player is invulnerable
     */
    getInvulnerable() {
        return this.isInvulnerable;
    }
}