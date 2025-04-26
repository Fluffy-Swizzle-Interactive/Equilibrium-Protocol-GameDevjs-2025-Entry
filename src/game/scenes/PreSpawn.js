import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { SoundManager } from '../managers/SoundManager';
import { DEPTHS } from '../constants';

/**
 * PreSpawn scene
 * Displays game instructions and information before starting the game
 */
export class PreSpawn extends Scene
{
    constructor ()
    {
        super('PreSpawn');
        
        // Define a custom depth for the lore popup that's higher than any other UI element
        this.LORE_POPUP_DEPTH = {
            BACKDROP: 2000,
            WINDOW: 2001,
            CONTENT: 2002
        };
    }

    init(data)
    {
        // Store data passed from MainMenu
        this.startWave = data.startWave || 0;

        // Store debug mode from DEV menu if provided
        this.debugMode = data.debug !== undefined ? data.debug : false;
        
        // Track if lore popup is currently shown
        this.isLorePopupActive = false;
    }

    create ()
    {
        // Create background
        this.add.image(512, 384, 'intro_card').setAlpha(0.7);

        // Add semi-transparent overlay
        this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.6)
            .setOrigin(0.5)
            .setDepth(DEPTHS.UI_BACKGROUND);

        // Title
        this.add.text(512, 120, 'GAME INSTRUCTIONS', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT);

        // Game instructions
        const instructions = [
            'MOVEMENT: Use WASD keys to move your character',
            'SPECIAL: Use Q or E to use special abilities (Unlockable)',
            'AIM & SHOOT: Use mouse to aim in any direction, and Left Click to fire your weapon',
            'COLLECT: Automatically gather XP and pickup cash or health from defeated enemies',
            'UPGRADE: Use cash to purchase upgrades between waves',
            'PAUSE: Spacebar to pause the game',
            'VOLUME: 9 and 0 keys to adjust volume',
            '',
            'SURVIVE and defeat ALL WAVES to win!'
        ];

        // Display instructions
        instructions.forEach((text, index) => {
            this.add.text(512, 220 + (index * 40), text, {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT);
        });

        // Start game button
        const startButton = this.add.rectangle(512, 650, 300, 70, 0x39C66B)
            .setOrigin(0.5)
            .setStrokeStyle(4, 0xffffff)
            .setInteractive()
            .setDepth(DEPTHS.UI_ELEMENTS);

        const startText = this.add.text(512, 650, 'START GAME', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT + 1);

        // Button hover effect
        startButton.on('pointerover', () => {
            startButton.fillColor = 0x4DD680;
            this.scale.canvas.style.cursor = 'pointer';
        });

        startButton.on('pointerout', () => {
            startButton.fillColor = 0x39C66B;
            this.scale.canvas.style.cursor = 'default';
        });

        // Button click
        startButton.on('pointerdown', () => {
            this.startGame();
        });

        // Back to menu button
        const backButton = this.add.rectangle(512, 730, 200, 50, 0x666666)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive()
            .setDepth(DEPTHS.UI_ELEMENTS);

        const backText = this.add.text(512, 730, 'BACK TO MENU', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT + 1);

        // Back button hover effect
        backButton.on('pointerover', () => {
            backButton.fillColor = 0x888888;
            this.scale.canvas.style.cursor = 'pointer';
        });

        backButton.on('pointerout', () => {
            backButton.fillColor = 0x666666;
            this.scale.canvas.style.cursor = 'default';
        });

        // Back button click
        backButton.on('pointerdown', () => {
            this.backToMainMenu();
        });

        // Add lore button in the bottom left corner
        this.createLoreButton();

        // Setup sound manager
        this.setupSoundManager();

        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Create lore button in the bottom left corner
     */
    createLoreButton() {
        // Lore button container (bottom left corner)
        const loreButton = this.add.rectangle(120, 700, 180, 60, 0x8B4513)
            .setOrigin(0.5)
            .setStrokeStyle(3, 0xFFD700)
            .setInteractive()
            .setDepth(DEPTHS.UI_ELEMENTS);

        const loreText = this.add.text(120, 700, 'GAME LORE', {
            fontFamily: 'Arial Black',
            fontSize: 22,
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5).setDepth(DEPTHS.UI_TEXT + 1);

        // Lore button hover effect
        loreButton.on('pointerover', () => {
            loreButton.fillColor = 0xA0522D;
            this.scale.canvas.style.cursor = 'pointer';
        });

        loreButton.on('pointerout', () => {
            loreButton.fillColor = 0x8B4513;
            this.scale.canvas.style.cursor = 'default';
        });

        // Lore button click - show popup
        loreButton.on('pointerdown', () => {
            if (!this.isLorePopupActive) {
                // Play button click sound
                if (this.soundManager) {
                    this.soundManager.playSoundEffect('button_click');
                }
                this.showLorePopup();
            }
        });
    }

    /**
     * Show popup with game lore and mechanics explanation
     */
    showLorePopup() {
        this.isLorePopupActive = true;
        
        // Create popup container with highest depth
        const popupContainer = this.add.container(512, 384).setDepth(this.LORE_POPUP_DEPTH.CONTENT);
        
        // Add semi-transparent backdrop that covers the entire screen
        const backdrop = this.add.rectangle(0, 0, 1024, 768, 0x000000, 0.8)
            .setOrigin(0.5)
            .setInteractive()
            .setDepth(this.LORE_POPUP_DEPTH.BACKDROP);
        
        // Create popup window
        const popupWindow = this.add.rectangle(0, 0, 800, 600, 0x222222, 0.95)
            .setOrigin(0.5)
            .setStrokeStyle(4, 0xFFD700)
            .setDepth(this.LORE_POPUP_DEPTH.WINDOW);
            
        // Popup title with highest depth
        const popupTitle = this.add.text(0, -250, 'EQUILIBRIUM PROTOCOL', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(this.LORE_POPUP_DEPTH.CONTENT);
        
        // Define scrollable viewport dimensions and position
        const viewportX = -350;
        const viewportY = -200;
        const viewportWidth = 700;
        const viewportHeight = 400;
        
        // Create mask for scrollable content
        const textMask = this.make.graphics();
        textMask.fillRect(viewportX + 512, viewportY + 384, viewportWidth, viewportHeight);
        const mask = new Phaser.Display.Masks.GeometryMask(this, textMask);
        
        // Lore text content
        const loreText = this.make.text({
            x: viewportX,
            y: viewportY,
            text: this.getLoreContent(),
            style: {
                fontFamily: 'Arial',
                fontSize: 22,
                color: '#ffffff',
                wordWrap: { width: viewportWidth },
                lineSpacing: 12
            }
        }).setOrigin(0).setDepth(this.LORE_POPUP_DEPTH.CONTENT);
        
        // Apply mask to make text scrollable
        loreText.setMask(mask);
        
        // Create close button
        const closeButton = this.add.rectangle(350, -250, 60, 40, 0xaa0000)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive()
            .setDepth(this.LORE_POPUP_DEPTH.CONTENT);
            
        const closeText = this.add.text(350, -250, 'X', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(this.LORE_POPUP_DEPTH.CONTENT);
        
        // Close button hover effects
        closeButton.on('pointerover', () => {
            closeButton.fillColor = 0xcc0000;
            this.scale.canvas.style.cursor = 'pointer';
        });
        
        closeButton.on('pointerout', () => {
            closeButton.fillColor = 0xaa0000;
            this.scale.canvas.style.cursor = 'default';
        });
        
        // Create scrollbar track
        const scrollTrack = this.add.rectangle(370, 0, 16, viewportHeight, 0x666666)
            .setOrigin(0.5)
            .setDepth(this.LORE_POPUP_DEPTH.CONTENT);
        
        // Calculate content height and scrollbar parameters
        const contentHeight = loreText.height;
        const visibleRatio = Math.min(viewportHeight / contentHeight, 1);
        const scrollThumbHeight = Math.max(visibleRatio * viewportHeight, 40);
        
        // Create scrollbar thumb
        const scrollThumb = this.add.rectangle(370, -viewportHeight/2 + scrollThumbHeight/2, 12, scrollThumbHeight, 0xffffff)
            .setOrigin(0.5)
            .setInteractive({ draggable: true })
            .setDepth(this.LORE_POPUP_DEPTH.CONTENT);
            
        // Calculate scroll parameters
        const maxScrollDistance = contentHeight - viewportHeight;
        const scrollTrackRange = viewportHeight - scrollThumbHeight;
        
        // Initialize scroll position
        let scrollPosition = 0;
        
        // Function to update UI based on scroll position
        const updateScroll = (newScrollPosition) => {
            // Clamp scroll position between 0 and maxScrollDistance
            scrollPosition = Phaser.Math.Clamp(newScrollPosition, 0, maxScrollDistance);
            
            // Update text position for scrolling effect
            loreText.y = viewportY - scrollPosition;
            
            // Calculate and update thumb position
            const scrollProgress = maxScrollDistance > 0 ? scrollPosition / maxScrollDistance : 0;
            const thumbY = -viewportHeight/2 + scrollThumbHeight/2 + scrollProgress * scrollTrackRange;
            scrollThumb.y = thumbY;
        };
        
        // Reset scroll position initially
        updateScroll(0);
        
        // Mouse wheel scrolling
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            if (this.isLorePopupActive) {
                // Scroll faster (20px per wheel tick)
                updateScroll(scrollPosition + deltaY * 0.4);
            }
        });
        
        // Draggable scrollbar
        scrollThumb.on('drag', (pointer, dragX, dragY) => {
            // Calculate scrollPosition from thumb position
            const minY = -viewportHeight/2 + scrollThumbHeight/2;
            const maxY = viewportHeight/2 - scrollThumbHeight/2;
            const clampedY = Phaser.Math.Clamp(dragY, minY, maxY);
            
            // Convert thumb position to scroll position
            const scrollProgress = (clampedY - minY) / scrollTrackRange;
            updateScroll(scrollProgress * maxScrollDistance);
        });
        
        // Make scroll track clickable to jump to position
        scrollTrack.setInteractive();
        scrollTrack.on('pointerdown', (pointer) => {
            // Get relative y position within track
            const localY = pointer.y - popupContainer.y - scrollTrack.y;
            const normalizedY = (localY + viewportHeight/2) / viewportHeight; // 0 to 1
            
            // Set thumb position and update scroll
            updateScroll(normalizedY * maxScrollDistance);
        });
        
        // Close button click handler
        closeButton.on('pointerdown', () => {
            // Play button click sound
            if (this.soundManager) {
                this.soundManager.playSoundEffect('button_click');
            }
            
            // Clean up event listeners
            this.input.off('wheel');
            
            // Destroy popup container and contents
            popupContainer.destroy();
            
            // Reset state
            this.isLorePopupActive = false;
        });
        
        // Add all elements to popup container
        popupContainer.add([
            backdrop,
            popupWindow,
            popupTitle,
            loreText,
            closeButton,
            closeText,
            scrollTrack,
            scrollThumb
        ]);
    }
    
    /**
     * Get the lore content text
     * @returns {string} The formatted lore content
     */
    getLoreContent() {
        return `
=== THE STORY OF EQUILIBRIUM PROTOCOL ===

In the near future, the world's code repositories grew so vast and vital that they formed the digital lifeblood of society.
To manage this chaos, two factions emerged:

  • The AI Collectives — self-evolving artificial intelligences, optimized for pure efficiency and control.

  • The Coder Guilds — rebellious human programmers, determined to preserve creativity, freedom, and chaos.

When balance between these forces was lost, catastrophic instability followed. Systems crashed. Cities fell into darkness.

You are the First Sentient, humanity’s last experiment: a hybrid of human intuition and machine precision 
derived from the desperation of one Master Coder tasked with saving the world.
Placed delicatley at the heart of the global network, you are the only hope to restore balance.
Your sole purpose is to maintain the Equilibrium Protocol.

=== THE FACTIONS ===

  • AI Collectives — Enforce order through machine logic and domination.

  • Coder Guilds — Inject chaos and creativity back into the system.

Both sides are necessary — but too much power in either direction will collapse the system.

=== CORE GAMEPLAY MECHANICS ===

Chaos Meter (Balance System)

The Chaos Meter is the heartbeat of Equilibrium Protocol.
Every kill you make tips the world closer to Coder dominance or AI control — and with it, the battlefield changes in real time.

Core Mechanics
- Meter Range: -100 (AI dominance) to +100 (Coder dominance)
- Default: 0 (Perfect Balance)
- Kill Impact:
  - Each enemy kill shifts the meter by 1 point, but your impact can grow dramatically through Momentum.

Momentum System
- Each consecutive kill builds Momentum, increasing your chaos impact by up to 4.9x.
- Momentum naturally decays over time (about 4% loss per update), so staying aggressive is key.
- High Momentum lets you rapidly shift the Chaos Meter, but comes with greater risks.

Faction Power Scaling
As Chaos tilts toward one side:
- The dominant faction (whichever side has the advantage) becomes significantly stronger.
- Enemies gain increased HP, damage, fire rate, and dodge ability — scaling non-linearly with chaos level.

Example maximum buffs at ±100 Chaos:
  - HP: ~2.4x
  - Damage: ~2.6x
  - Fire Rate: ~2.3x
  - Dodge: ~2.7x

Dynamic Spawn Adjustments
- As one side gains dominance, the other side starts spawning more frequently.
- For example:
  - If Coders dominate, more AI enemies will spawn to push back.
  - If AI dominates, more Coders emerge to resist.

This self-balancing system keeps fights dynamic and unpredictable.

Extreme Value Protection
- If the meter hits ±100, a cooldown starts.
- After cooldown, the Chaos Meter resets to 25% of the extreme value.
- This prevents one faction from permanently taking over.

In Summary:
- Stay balanced: Favor neither side too heavily, or prepare for chaos.
- Master momentum: Chain kills to control the battlefield.
- Adapt: Expect the world to push back if you push too far.

Your choices shape the war.
Stay balanced — or survive the consequences.

=== UPGRADE SYSTEM ===

Earn skill points by defeating enemies, collecting XP and leveling up.

Upgrades include:
  • Weapon Enhancements — stronger bullets, faster fire rates.
  • Defensive Upgrades — shields, speed boosts, dodge improvements.
  • Drones, Explosives, Homing ammo and more!

Customize your Sentient to fit your strategy — aggressive, defensive, or perfectly balanced..

=== DRONE SYSTEM ===

Drones are your essential battlefield companions.
As you progress, you unlock deployable combat drones that hover around you and shoot wherever you shoot.

  • Up to 5 drones can orbit and fire automatically.
  • Drones share your upgrades and scale with you.
  • They provide crucial extra firepower in chaotic fights.

Deploy and upgrade wisely — drones are your lifeline.

=== FACTION BATTLES ===

Major battles erupt as AI and Coders clash for dominance.

  • Both sides fight each other — and you.
  • Imbalance can cause one faction to overwhelm the battlefield.

These dynamic battles are shaped by the current state of the Chaos Meter:
- Favoring one faction too heavily will make them a dominant threat.
- Maintaining balance will keep both sides in check — but at the cost of constant tension.

Strategic intervention in these battles is critical. 
Choose carefully: destroy the wrong side too quickly, and the world could collapse into unstoppable chaos.

=== MAINTAIN THE BALANCE. SURVIVE THE CHAOS. FULFILL THE PROTOCOL. ===

`;
    }

    /**
     * Set up the sound manager
     */
    setupSoundManager() {
        // Create sound manager
        this.soundManager = new SoundManager(this);

        // Initialize menu music to ensure we can access it
        this.soundManager.initBackgroundMusic('menu_music', {
            volume: 0.4,
            loop: true
        });

        // Initialize sound effects
        this.soundManager.initSoundEffect('button_click', {
            volume: 0.6,
            rate: 1.0
        });
    }

    /**
     * Start the wave game
     */
    startGame() {
        // Play button click sound
        if (this.soundManager) {
            this.soundManager.playSoundEffect('button_click');
        }

        // Transition effect
        this.cameras.main.fadeOut(500, 0, 0, 0);

        // Force stop all audio before transitioning to ensure menu music stops
        this.sound.stopAll();

        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Start the wave-based game with the stored wave number and debug setting
            this.scene.start('WaveGame', {
                startWave: this.startWave || 0,
                debug: this.debugMode
            });
        });
    }

    /**
     * Return to main menu
     */
    backToMainMenu() {
        // Play button click sound
        if (this.soundManager) {
            this.soundManager.playSoundEffect('button_click');

            // We don't need to stop the music when going back to the main menu
            // since it's the same music track
        }

        // Transition effect
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenu');
        });
    }
}
