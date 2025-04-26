/**
 * Volume slider UI component for controlling game audio
 */
export class VolumeSlider {
    /**
     * Create a new volume slider
     * @param {Phaser.Scene} scene - The scene this slider belongs to
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Configuration options
     */
    constructor(scene, x, y, options = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Default options
        const defaultOptions = {
            width: 150,
            height: 20,
            trackColor: 0x666666,
            fillColor: 0x00ff00,
            knobColor: 0xffffff,
            knobRadius: 10,
            initialValue: 0.5,
            onChange: null,
            depth: 100,
            label: 'Volume',
            labelStyle: {
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ffffff'
            }
        };
        
        // Merge options
        this.options = { ...defaultOptions, ...options };
        
        // Current value (0-1)
        this.value = this.options.initialValue;
        
        // Create container for all slider elements
        this.container = scene.add.container(x, y).setDepth(this.options.depth);
        
        // Create UI elements
        this.createSlider();
        
        // Make interactive
        this.setupInteraction();
    }
    
    /**
     * Create the slider UI elements
     */
    createSlider() {
        // Create label
        this.label = this.scene.add.text(
            -this.options.width / 2 - 10, 
            0, 
            this.options.label, 
            this.options.labelStyle
        ).setOrigin(1, 0.5);
        
        // Create track (background)
        this.track = this.scene.add.rectangle(
            0, 
            0, 
            this.options.width, 
            this.options.height, 
            this.options.trackColor
        ).setOrigin(0.5);
        
        // Create fill (colored part)
        this.fill = this.scene.add.rectangle(
            -this.options.width / 2, 
            0, 
            this.options.width * this.value, 
            this.options.height, 
            this.options.fillColor
        ).setOrigin(0, 0.5);
        
        // Create knob
        this.knob = this.scene.add.circle(
            -this.options.width / 2 + (this.options.width * this.value), 
            0, 
            this.options.knobRadius, 
            this.options.knobColor
        );
        
        // Add to container
        this.container.add([this.label, this.track, this.fill, this.knob]);
    }
    
    /**
     * Set up interaction for the slider
     */
    setupInteraction() {
        // Make track interactive
        this.track.setInteractive({ useHandCursor: true });
        
        // Handle click/tap on track
        this.track.on('pointerdown', (pointer) => {
            this.updateValue(pointer);
            this.startDrag();
        });
        
        // Make knob interactive
        this.knob.setInteractive({ useHandCursor: true });
        
        // Handle drag on knob
        this.knob.on('pointerdown', () => {
            this.startDrag();
        });
    }
    
    /**
     * Start dragging the slider
     */
    startDrag() {
        // Add move and up listeners
        this.moveListener = (pointer) => {
            this.updateValue(pointer);
        };
        
        this.upListener = () => {
            this.stopDrag();
        };
        
        this.scene.input.on('pointermove', this.moveListener);
        this.scene.input.on('pointerup', this.upListener);
        
        // Play click sound if available
        if (this.scene.soundManager && this.scene.soundManager.hasSound('button_click')) {
            this.scene.soundManager.playSoundEffect('button_click');
        }
    }
    
    /**
     * Stop dragging the slider
     */
    stopDrag() {
        if (this.moveListener) {
            this.scene.input.off('pointermove', this.moveListener);
            this.scene.input.off('pointerup', this.upListener);
            this.moveListener = null;
            this.upListener = null;
        }
    }
    
    /**
     * Update slider value based on pointer position
     * @param {Phaser.Input.Pointer} pointer - The pointer that triggered the update
     */
    updateValue(pointer) {
        // Convert global pointer position to local position
        const localX = pointer.x - this.container.x;
        
        // Calculate normalized value (0-1)
        let newValue = (localX + this.options.width / 2) / this.options.width;
        newValue = Phaser.Math.Clamp(newValue, 0, 1);
        
        // Only update if value changed
        if (newValue !== this.value) {
            this.value = newValue;
            this.updateVisuals();
            
            // Call onChange callback if provided
            if (this.options.onChange) {
                this.options.onChange(this.value);
            }
        }
    }
    
    /**
     * Update visual elements to match current value
     */
    updateVisuals() {
        // Update fill width
        this.fill.width = this.options.width * this.value;
        
        // Update knob position
        this.knob.x = -this.options.width / 2 + (this.options.width * this.value);
    }
    
    /**
     * Set the slider value programmatically
     * @param {number} value - New value (0-1)
     */
    setValue(value) {
        this.value = Phaser.Math.Clamp(value, 0, 1);
        this.updateVisuals();
    }
    
    /**
     * Get the current slider value
     * @returns {number} Current value (0-1)
     */
    getValue() {
        return this.value;
    }
    
    /**
     * Set the visibility of the slider
     * @param {boolean} visible - Whether the slider should be visible
     */
    setVisible(visible) {
        this.container.setVisible(visible);
    }
    
    /**
     * Destroy the slider and clean up resources
     */
    destroy() {
        this.stopDrag();
        this.container.destroy();
    }
}
