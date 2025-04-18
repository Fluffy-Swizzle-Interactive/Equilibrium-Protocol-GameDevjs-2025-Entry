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
        
        // Emit cash update event for UI
        this.emitCashUpdate();
        
        return amount;
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