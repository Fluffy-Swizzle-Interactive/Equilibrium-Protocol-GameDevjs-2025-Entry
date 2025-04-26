import { EventBus } from '../EventBus';

/**
 * ButtonSoundHelper
 * Utility functions for handling button sounds
 */
export const ButtonSoundHelper = {
    /**
     * Add button click sound to a Phaser game object
     * @param {Phaser.GameObjects.GameObject} button - The button to add sound to
     * @param {Object} options - Optional configuration
     */
    addButtonSound(button, options = {}) {
        // Default options
        const config = {
            event: 'pointerdown',
            volume: 0.6,
            detune: -200, // Pitch down slightly
            rate: 1.2, // Speed up slightly
            ...options
        };

        // Add event listener to the button
        button.on(config.event, () => {
            // Emit button-click event on EventBus
            EventBus.emit('button-click', {
                volume: config.volume,
                detune: config.detune
            });
        });

        return button;
    },

    /**
     * Set up event listener for button clicks in a scene
     * @param {Phaser.Scene} scene - The scene to set up the listener in
     */
    setupButtonSounds(scene) {
        // Initialize button_click sound effect if it doesn't exist
        if (scene.soundManager && !scene.soundManager.hasSound('button_click')) {
            scene.soundManager.initSoundEffect('button_click', {
                volume: 0.6,
                rate: 1.2, // Speed up slightly
                detune: -200 // Pitch down slightly
            });
        }

        // Listen for button-click events on the EventBus
        EventBus.on('button-click', (data) => {
            if (scene.soundManager) {
                scene.soundManager.playSoundEffect('button_click', {
                    volume: data?.volume || 0.6,
                    detune: data?.detune || -200, // Pitch down slightly
                    rate: data?.rate || 1.2 // Speed up slightly
                });
            }
        });

        // Return a cleanup function
        return () => {
            EventBus.off('button-click');
        };
    }
};
