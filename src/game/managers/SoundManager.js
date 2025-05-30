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
        // Reduced to 10% of original values (0.5 -> 0.05, 0.7 -> 0.07)
        this.musicVolume = 0.05;
        this.effectsVolume = 0.07;
        this.isMuted = false;

        // Initialize pause-related state properties
        this._musicPaused = false;
        this._musicWasPlaying = false;
        this._originalVolume = null;
        this._seekPosition = 0;
        this._musicKey = null;
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

        // Ensure volume doesn't exceed our base volume
        const finalVolume = Math.min(musicOptions.volume, this.musicVolume);

        // Create the music object
        this.musicTracks[key] = this.scene.sound.add(key, {
            volume: finalVolume,
            loop: musicOptions.loop
        });

        console.debug(`Initialized music track "${key}" with volume ${finalVolume}`);
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

        // Make sure the track exists
        if (!this.musicTracks[key]) {
            console.warn(`Music track "${key}" not found, cannot play`);
            return;
        }

        // If we have music playing and it's different from what we want to play
        if (this.currentMusic && this.currentMusic !== this.musicTracks[key]) {
            // Store the current volume for debugging
            const currentVolume = this.currentMusic.volume;
            console.debug(`Crossfading music from ${this._getMusicKeyByTrack(this.currentMusic)} (vol: ${currentVolume}) to ${key}`);

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
            console.debug(`Starting music ${key} with volume ${this.musicVolume}`);
            this.startNewMusic(key, playOptions.fadeIn, playOptions.delay);
        } else {
            // Current music is already the requested track
            console.debug(`Music ${key} is already playing at volume ${this.currentMusic.volume}`);
        }
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

        // Set the target volume
        const targetVolume = this.isMuted ? 0 : this.musicVolume;

        // If no fade-in is requested or duration is very short, start at target volume
        if (fadeInDuration <= 50) {
            this.currentMusic.volume = targetVolume;

            // Start playback
            this.currentMusic.play({
                delay: delay / 1000 // Convert ms to seconds
            });
        } else {
            // Start with volume 0 for fade-in
            this.currentMusic.volume = 0;

            // Start playback
            this.currentMusic.play({
                delay: delay / 1000 // Convert ms to seconds
            });

            // Fade in
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: targetVolume,
                duration: fadeInDuration
            });
        }
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
        if (this.currentMusic) {
            // Store the current music state and position
            this._musicWasPlaying = this.currentMusic.isPlaying;

            if (this._musicWasPlaying) {
                // Store information needed to resume properly
                this._originalVolume = this.currentMusic.volume;
                this._musicKey = this._getMusicKeyByTrack(this.currentMusic);
                this._seekPosition = this.currentMusic.seek; // Store current position

                // Cancel any existing volume tweens to prevent conflicts
                this.scene.tweens.killTweensOf(this.currentMusic);

                // Stop the music completely
                this.currentMusic.stop();

                // Set the flag to indicate we specifically stopped it
                this._musicPaused = true;

                // For extra safety, directly pause the WebAudio node if possible
                if (this.scene.sound.context && !this.scene.sound.context.suspended) {
                    this.scene.sound.pauseAll(); // This helps ensure all audio pauses
                }

                console.debug(`Background music paused at position ${this._seekPosition}`);
            }
        }
    }

    /**
     * Resume paused music
     */
    resumeMusic() {
        // Only resume if we specifically paused the music
        if (this._musicPaused && this._musicWasPlaying && this._musicKey) {
            // Resume the WebAudio context if it was suspended
            if (this.scene.sound.context && this.scene.sound.context.suspended) {
                this.scene.sound.resumeAll();
            }

            // Get the track
            const track = this.musicTracks[this._musicKey];

            if (track) {
                // Make sure track is stopped before restarting it
                if (track.isPlaying) {
                    track.stop();
                }

                // Reset this track as current
                this.currentMusic = track;

                // Start the music from where it was paused
                // Use the stored volume, but ensure it doesn't exceed our current musicVolume
                const resumeVolume = Math.min(this._originalVolume || this.musicVolume, this.musicVolume);

                this.currentMusic.play({
                    loop: true,
                    volume: resumeVolume,
                    seek: this._seekPosition || 0
                });

                console.debug(`Resumed music with volume ${resumeVolume}`);

                console.debug(`Background music resumed from position ${this._seekPosition}`);
            } else {
                console.warn(`Could not resume music: track ${this._musicKey} not found`);
            }

            // Clear the pause state
            this._musicPaused = false;
            this._musicWasPlaying = false;
            this._originalVolume = null;
            this._seekPosition = 0;
            this._musicKey = null;
        }
    }

    /**
     * Helper method to find the key of a music track
     * @private
     * @param {Phaser.Sound.BaseSound} track - The track to find
     * @returns {string|null} - The key of the track, or null if not found
     */
    _getMusicKeyByTrack(track) {
        if (!track) return null;

        // Find the key by comparing the track references
        for (const [key, value] of Object.entries(this.musicTracks)) {
            if (value === track) {
                return key;
            }
        }

        return null;
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
     * @param {number} volume - Volume level (0 to 0.1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 0.1);

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
     * @param {number} volume - Volume level (0 to 0.1)
     */
    setEffectsVolume(volume) {
        this.effectsVolume = Phaser.Math.Clamp(volume, 0, 0.1);

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
            detune: 0,
            loop: false // Explicitly set loop to false by default for all sound effects
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
            // If sound effect doesn't exist, try to create it on-demand
            if (this.scene.cache.audio.exists(key)) {
                console.debug(`Sound effect "${key}" not found in SoundManager, initializing on-demand`);
                this.initSoundEffect(key, {
                    volume: this.effectsVolume,
                    rate: 1.0,
                    loop: false // Ensure loop is false
                });
            } else {
                console.warn(`Sound effect "${key}" not found and cannot be created`);
                return null;
            }
        }

        // Check if audio system is ready
        if (this.scene.sound.locked) {
            console.debug(`Audio system is locked, attempting to unlock before playing "${key}"`);

            // Create a one-time event listener for the unlock event
            this.scene.sound.once('unlocked', () => {
                // Try playing the sound after the system is unlocked
                if (this.soundEffects[key]) {
                    console.debug(`Audio system unlocked, now playing "${key}"`);
                    // Ensure loop is false when playing and volume is capped
                    const playOptions = {
                        ...options,
                        loop: false,
                        volume: Math.min(options.volume || this.effectsVolume, this.effectsVolume)
                    };
                    this.soundEffects[key].play(playOptions);
                }
            });

            // Also try to unlock the audio system manually (needed in some browsers)
            this.scene.sound.unlock();
            return null;
        }

        // If the sound is already playing, stop it first to prevent overlapping
        if (this.soundEffects[key] && this.soundEffects[key].isPlaying) {
            this.soundEffects[key].stop();
        }

        // Ensure loop is false in the options and volume is capped at effectsVolume
        const playOptions = {
            ...options,
            loop: false,
            volume: Math.min(options.volume || this.effectsVolume, this.effectsVolume)
        };

        // Log the volume for debugging
        console.debug(`Playing sound "${key}" with volume ${playOptions.volume}`);

        // Sound exists and audio system is ready, play the sound
        try {
            return this.soundEffects[key].play(playOptions);
        } catch (error) {
            console.warn(`Error playing sound "${key}":`, error);
            return null;
        }
    }
    /**
     * Check if a sound effect exists in the manager
     * @param {string} key - Asset key for the sound effect
     * @returns {boolean} Whether the sound effect exists
     */
    hasSound(key) {
        return !!this.soundEffects[key] || this.scene.cache.audio.exists(key);
    }

    /**
     * Play a random wave end sound effect
     * Selects one of the waveEnd1-7 sound effects randomly
     * @param {Object} options - Optional playback options
     * @returns {Phaser.Sound.BaseSound} The sound instance
     */
    playRandomWaveEndSound(options = {}) {
        // Get a random number between 1 and 7 (inclusive)
        const randomNum = Math.floor(Math.random() * 7) + 1;
        const soundKey = `waveEnd${randomNum}`;

        // Default options for wave end sounds
        const defaultOptions = {
            volume: 0.07, // Reduced to 10% of original value (0.7 -> 0.07)
            // Add slight pitch variation for more variety
            detune: Math.random() * 100 - 50, // Random detune between -50 and +50
            loop: false, // Explicitly set loop to false to prevent looping
            duration: 2000 // Set a maximum duration to ensure the sound stops
        };

        // Merge default options with provided options
        const soundOptions = { ...defaultOptions, ...options };

        // Get the sound instance
        const sound = this.soundEffects[soundKey];

        // If the sound is already playing, stop it first
        if (sound && sound.isPlaying) {
            sound.stop();
        }

        // Play the random wave end sound
        const soundInstance = this.playSoundEffect(soundKey, soundOptions);

        // Add a safety timeout to ensure the sound stops after a certain time
        if (soundInstance) {
            this.scene.time.delayedCall(3000, () => {
                if (soundInstance.isPlaying) {
                    soundInstance.stop();
                }
            });
        }

        return soundInstance;
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