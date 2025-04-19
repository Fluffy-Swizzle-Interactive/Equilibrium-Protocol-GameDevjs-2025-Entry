import { EventBus } from '../EventBus';
import { DEPTHS } from '../constants';

/**
 * CashManager class
 * Manages player currency, cash drops, and related events
 */
export class CashManager {
    /**
     * Create a new Cash manager
     * @param {Phaser.Scene} scene - The scene this cash manager belongs to
     * @param {number} initialCash - Initial cash amount (default: 0)
     * @param {number} cashMultiplier - Multiplier for cash drops (default: 1.0)
     */
    constructor(scene, initialCash = 0, cashMultiplier = 1.0) {
        this.scene = scene;
        this.currentCash = initialCash;
        this.cashMultiplier = cashMultiplier;

        // Register with scene for easier access
        scene.cashManager = this;
        
        // Cash collection animation properties
        this.lastCashCollectTime = 0;
        this.cashCollectTimeout = 1000; // 1 second timeout for accumulating cash
        this.accumulatedCash = 0;
        this.cashAnimationText = null;
        this.cashAnimationActive = false;
        this.cashAnimationTween = null;
        this.fadeOutTimer = null;
        
        // Emit initial cash update event
        this.emitCashUpdate();
    }
    
    /**
     * Add cash to the player
     * @param {number} amount - Amount of cash to add
     */
    addCash(amount) {
        if (!amount || isNaN(amount) || amount <= 0) return;
        
        this.currentCash += amount;
        
        // Play cash collection sound if available
        if (this.scene.soundManager) {
            const soundKey = this.scene.soundManager.hasSound('cash_pickup') 
                ? 'cash_pickup' 
                : 'laserShoot'; // Fallback to an existing sound
                
            this.scene.soundManager.playSoundEffect(soundKey, {
                volume: 0.3,
                rate: 1.0,
                detune: 600
            });
        }
        
        // Show cash collection animation
        this.showCashCollectAnimation(amount);
        
        // Emit cash update event for UI
        this.emitCashUpdate();
        
        return amount;
    }
    
    /**
     * Show an animation of cash being collected above the player's head
     * @param {number} amount - Amount of cash collected
     */
    showCashCollectAnimation(amount) {
        const currentTime = this.scene.time.now;
        
        // If player doesn't exist, don't show animation
        if (!this.scene.player || !this.scene.player.getPosition) return;
        
        const playerPos = this.scene.player.getPosition();
        
        // Reset fadeout timer if it exists
        if (this.fadeOutTimer) {
            this.fadeOutTimer.remove();
            this.fadeOutTimer = null;
        }
        
        // Accumulate cash regardless of existing text
        this.accumulatedCash += amount;
        this.lastCashCollectTime = currentTime;
        
        // Update or create text
        if (this.cashAnimationText && this.cashAnimationText.active) {
            // Update existing text
            this.cashAnimationText.setText(`+$${this.accumulatedCash}`);
            
            // Update position to follow player
            this.cashAnimationText.setPosition(playerPos.x, playerPos.y - 50);
            
            // Stop existing tween if running
            if (this.cashAnimationTween && this.cashAnimationTween.isPlaying()) {
                this.cashAnimationTween.stop();
            }
        } else {
            // Create new text
            this.createCashAnimationText(playerPos);
        }
        
        // Set up new fadeout timer after collecting stops
        this.fadeOutTimer = this.scene.time.delayedCall(this.cashCollectTimeout, () => {
            this.animateCashTextOut();
        });
    }
    
    /**
     * Create the cash animation text object
     * @param {Object} playerPos - Player position {x, y}
     */
    createCashAnimationText(playerPos) {
        // Clean up existing text if there is one
        if (this.cashAnimationText) {
            this.cashAnimationText.destroy();
        }
        
        // Create text slightly above player
        this.cashAnimationText = this.scene.add.text(
            playerPos.x, 
            playerPos.y - 50, 
            `+$${this.accumulatedCash}`, 
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#FFD700', // Gold color
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        );
        
        this.cashAnimationText.setOrigin(0.5);
        this.cashAnimationText.setDepth(DEPTHS.UI_FLOATING_TEXT);
        
        // Add a small pop-in animation
        this.scene.tweens.add({
            targets: this.cashAnimationText,
            scale: { from: 0.8, to: 1 },
            duration: 200,
            ease: 'Back.easeOut'
        });
    }
    
    /**
     * Animate the cash text out after player stops collecting
     */
    animateCashTextOut() {
        if (!this.cashAnimationText || !this.cashAnimationText.active) return;
        
        // Create rising and fading animation
        this.cashAnimationTween = this.scene.tweens.add({
            targets: this.cashAnimationText,
            y: '-=40', // Rise up
            alpha: { from: 1, to: 0 },
            scale: { from: 1, to: 1.2 },
            duration: 500,
            ease: 'Cubic.Out',
            onComplete: () => {
                if (this.cashAnimationText) {
                    this.cashAnimationText.destroy();
                    this.cashAnimationText = null;
                }
                this.accumulatedCash = 0;
            }
        });
    }
    
    /**
     * Update the cash animation text position to follow the player
     * Should be called in the scene update method
     */
    updateCashAnimationPosition() {
        if (!this.cashAnimationText || !this.cashAnimationText.active || !this.scene.player) return;
        
        const playerPos = this.scene.player.getPosition();
        if (playerPos) {
            this.cashAnimationText.setPosition(playerPos.x, playerPos.y - 50);
        }
    }
    
    /**
     * Emit cash update event with current status
     */
    emitCashUpdate() {
        EventBus.emit('cash-updated', {
            cash: this.currentCash
        });
    }
    
    /**
     * Get the current cash amount
     * @returns {number} Current cash
     */
    getCurrentCash() {
        return this.currentCash;
    }
    
    /**
     * Set the cash multiplier
     * @param {number} multiplier - The new multiplier value
     */
    setCashMultiplier(multiplier) {
        this.cashMultiplier = multiplier;
    }
    
    /**
     * Get the current cash multiplier
     * @returns {number} Current cash multiplier
     */
    getCashMultiplier() {
        return this.cashMultiplier;
    }
    
    /**
     * Spawn a cash pickup at the specified position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} amount - Cash amount for this pickup
     * @returns {Phaser.GameObjects.Sprite} The created cash pickup sprite
     */
    spawnCashPickup(x, y, amount) {
        if (!this.scene.spritePool) {
            console.warn('SpritePool not available, cannot spawn cash pickup');
            return null;
        }
        
        // The final amount after applying multiplier
        const finalAmount = Math.ceil(amount * this.cashMultiplier);
        
        // Create cash pickup using the new specialized method
        const cashPickup = this.scene.spritePool.createCashPickup(x, y, {
            value: finalAmount,
            tint: 0xFFD700 // Gold color
        });
        
        return cashPickup;
    }
    
    /**
     * Spend cash (reduce current amount)
     * @param {number} amount - Amount of cash to spend
     * @returns {boolean} Whether the transaction was successful
     */
    spendCash(amount) {
        if (!amount || isNaN(amount) || amount <= 0) return false;
        
        // Check if player has enough cash
        if (this.currentCash < amount) return false;
        
        // Deduct cash
        this.currentCash -= amount;
        
        // Emit cash update event for UI
        this.emitCashUpdate();
        
        return true;
    }
}