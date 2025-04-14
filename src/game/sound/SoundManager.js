/**
 * Sound manager for centralized audio handling
 * Manages background music and audio effects
 */
export class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.musicTracks = {};
        this.soundEffects = {};
        this.currentMusic = null;
        this.musicVolume = 0.5;
        this.effectsVolume = 0.7;
        this.isMuted = false;
    }

    /**
     * Initialize background music
     * @param {string} key - Asset key for the music track
     * @param {Object} options - Configuration options for the music
     */
    initBackgroundMusic(key, options = {}) {
        const defaultOptions = {
            volume: this.musicVolume,
            loop: true,
            delay: 0
        };

        // Merge default options with provided options
        const musicOptions = { ...defaultOptions, ...options };
        
        // Create the music object
        this.musicTracks[key] = this.scene.sound.add(key, {
            volume: musicOptions.volume,
            loop: musicOptions.loop
        });

        return this.musicTracks[key];
    }

    /**
     * Play background music with crossfade
     * @param {string} key - Asset key for the music track to play
     * @param {Object} options - Playback options including fadeIn duration
     */
    playMusic(key, options = {}) {
        // Default options
        const defaultOptions = {
            fadeIn: 1000,
            fadeOut: 1000,
            delay: 0
        };

        // Merge default options with provided options
        const playOptions = { ...defaultOptions, ...options };

        // If we have music playing and it's different from what we want to play
        if (this.currentMusic && this.currentMusic !== this.musicTracks[key]) {
            // Fade out current music
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: playOptions.fadeOut,
                onComplete: () => {
                    this.currentMusic.stop();
                    
                    // Start new music with fade in
                    this.startNewMusic(key, playOptions.fadeIn, playOptions.delay);
                }
            });
        } else if (!this.currentMusic) {
            // No music playing, start new track
            this.startNewMusic(key, playOptions.fadeIn, playOptions.delay);
        }
        // If current music is already playing the requested track, do nothing
    }

    /**
     * Helper method to start a new music track with fade in
     * @param {string} key - Asset key for the music
     * @param {number} fadeInDuration - Duration of fade in effect in ms
     * @param {number} delay - Delay before playing in ms
     */
    startNewMusic(key, fadeInDuration, delay = 0) {
        // Make sure the track exists
        if (!this.musicTracks[key]) {
            console.warn(`Music track "${key}" not found`);
            return;
        }

        // Set as current music
        this.currentMusic = this.musicTracks[key];
        
        // Start with volume 0
        this.currentMusic.volume = 0;
        
        // Start playback
        this.currentMusic.play({
            delay: delay / 1000 // Convert ms to seconds
        });
        
        // Fade in
        this.scene.tweens.add({
            targets: this.currentMusic,
            volume: this.isMuted ? 0 : this.musicVolume,
            duration: fadeInDuration
        });
    }

    /**
     * Stop all music playback
     * @param {number} fadeOutDuration - Duration of fade out in ms
     */
    stopMusic(fadeOutDuration = 1000) {
        if (this.currentMusic) {
            // If fade out is requested
            if (fadeOutDuration > 0) {
                this.scene.tweens.add({
                    targets: this.currentMusic,
                    volume: 0,
                    duration: fadeOutDuration,
                    onComplete: () => {
                        this.currentMusic.stop();
                        this.currentMusic = null;
                    }
                });
            } else {
                // Stop immediately
                this.currentMusic.stop();
                this.currentMusic = null;
            }
        }
    }

    /**
     * Pause current music
     */
    pauseMusic() {
        if (this.currentMusic && this.currentMusic.isPlaying) {
            this.currentMusic.pause();
        }
    }

    /**
     * Resume paused music
     */
    resumeMusic() {
        if (this.currentMusic && !this.currentMusic.isPlaying) {
            this.currentMusic.resume();
        }
    }

    /**
     * Toggle mute state for all audio
     * @param {boolean} mute - Whether to mute (true) or unmute (false)
     */
    setMute(mute) {
        this.isMuted = mute;
        this.scene.sound.mute = mute;
    }

    /**
     * Toggle mute state
     * @returns {boolean} New mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.scene.sound.mute = this.isMuted;
        return this.isMuted;
    }

    /**
     * Set music volume
     * @param {number} volume - Volume level (0 to 1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        
        // Apply to current music if playing
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
        
        // Apply to all stored music tracks
        Object.values(this.musicTracks).forEach(track => {
            track.volume = this.musicVolume;
        });
    }

    /**
     * Set sound effects volume
     * @param {number} volume - Volume level (0 to 1)
     */
    setEffectsVolume(volume) {
        this.effectsVolume = Phaser.Math.Clamp(volume, 0, 1);
        
        // Apply to all sound effects
        Object.values(this.soundEffects).forEach(sound => {
            sound.volume = this.effectsVolume;
        });
    }

    /**
     * Initialize a sound effect
     * @param {string} key - Asset key for the sound effect
     * @param {Object} options - Configuration options
     * @returns {Phaser.Sound.BaseSound} The sound effect object
     */
    initSoundEffect(key, options = {}) {
        const defaultOptions = {
            volume: this.effectsVolume,
            rate: 1.0,
            detune: 0
        };

        const soundOptions = { ...defaultOptions, ...options };
        
        this.soundEffects[key] = this.scene.sound.add(key, soundOptions);
        return this.soundEffects[key];
    }

    /**
     * Play a sound effect
     * @param {string} key - Asset key for the sound effect
     * @param {Object} options - Playback options
     * @returns {Phaser.Sound.BaseSound} The sound instance
     */
    playSoundEffect(key, options = {}) {
        // Make sure the sound exists
        if (!this.soundEffects[key]) {
            console.warn(`Sound effect "${key}" not found`);
            return null;
        }

        // Play the sound with options
        return this.soundEffects[key].play(options);
    }

    /**
     * Cleanup and remove all sounds
     */
    destroy() {
        // Stop and destroy all music
        Object.values(this.musicTracks).forEach(track => {
            track.stop();
            track.destroy();
        });
        
        // Stop and destroy all sound effects
        Object.values(this.soundEffects).forEach(sound => {
            sound.stop();
            sound.destroy();
        });
        
        this.musicTracks = {};
        this.soundEffects = {};
        this.currentMusic = null;
    }
}