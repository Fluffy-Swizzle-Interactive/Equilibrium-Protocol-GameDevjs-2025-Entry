import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

export class Game extends Scene {
    constructor() {
        super('Game');
        
        // Initialize game state properties
        this.enemySpawnRate = 2000; // Milliseconds between enemy spawns
        this.enemySpawnRateDecrease = 50; // How much to decrease spawn rate over time
        this.minEnemySpawnRate = 500; // Minimum time between enemy spawns
        this.gameTime = 0; // Track game time for difficulty scaling
        this.enemyList = []; // Track all active enemies
        this.killCount = 0; // Track number of enemies killed
        
        // Check if we're in development mode
        this.isDev = import.meta.env.DEV;
    }

    init(data) {
        // Store the game mode received from menu selection
        this.gameMode = data.mode || 'minigun'; // Default to minigun if no mode is specified
        
        // Reset game state for new game
        this.resetGameState();
    }

    /**
     * Reset all game state variables for a new game
     */
    resetGameState() {
        this.killCount = 0;
        this.gameTime = 0;
        this.survivalTime = 0;
        this.enemySpawnRate = 2000; // Reset to initial spawn rate
        this.enemyList = [];
        this.isPaused = false;
    }

    create() {
        this.setupMap();
        this.setupGameObjects();
        this.setupUI();
        this.setupInput();
        this.setupEnemySpawner();
        
        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Set up the game map and boundaries
     */
    setupMap() {
        // Create the tilemap
        this.map = this.make.tilemap({ key: 'map' });
        this.tileset = this.map.addTilesetImage('scifi_tiles', 'scifi_tiles');
        this.groundLayer = this.map.createLayer('Tile Layer 1', this.tileset);
        
        // Calculate map scaling and boundaries
        const mapWidth = this.map.widthInPixels;
        const mapHeight = this.map.heightInPixels;
        
        // Scale the map to fill the screen
        const scaleX = this.game.config.width / mapWidth;
        const scaleY = this.game.config.height / mapHeight;
        const scale = Math.max(scaleX, scaleY) * 1.5; // 50% larger than needed
        
        this.groundLayer.setScale(scale);
        
        // Update the effective map dimensions after scaling
        const effectiveMapWidth = mapWidth * scale;
        const effectiveMapHeight = mapHeight * scale;
        
        // Set physics world bounds
        this.physics.world.setBounds(0, 0, effectiveMapWidth, effectiveMapHeight);
        
        // Store map dimensions for use elsewhere
        this.mapDimensions = {
            width: effectiveMapWidth,
            height: effectiveMapHeight
        };
    }

    /**
     * Set up game objects including player, enemies, and bullets
     */
    setupGameObjects() {
        // Create groups for game objects
        this.bullets = this.add.group();
        this.enemies = this.add.group();
        
        // Create player instance (in center of map)
        const playerX = this.mapDimensions.width / 2;
        const playerY = this.mapDimensions.height / 2;
        this.player = new Player(this, playerX, playerY);
        
        // Setup camera to follow player
        this.setupCamera();
    }

    /**
     * Set up the camera to follow the player
     */
    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.mapDimensions.width, this.mapDimensions.height);
        this.cameras.main.startFollow(this.player.graphics, true, 0.09, 0.09);
        this.cameras.main.setZoom(0.7);
    }

    /**
     * Set up UI elements like timer and kill counter
     */
    setupUI() {
        // Create survival timer UI
        this.timerText = this.add.text(16, 16, 'Time: 0s', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(100);
        
        // Create kill counter UI
        this.killText = this.add.text(16, 50, 'Kills: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(100);
        
        // Create pause overlay
        this.createPauseOverlay();
    }

    /**
     * Create the pause overlay elements
     */
    createPauseOverlay() {
        // Create a semi-transparent overlay
        this.pauseOverlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        ).setScrollFactor(0).setDepth(1000).setVisible(false);
        
        // Create pause text
        this.pauseText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            'PAUSED\nPress SPACE to resume',
            {
                fontFamily: 'Arial',
                fontSize: '36px',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setVisible(false);
    }

    /**
     * Set up input handlers for keyboard and mouse
     */
    setupInput() {
        // Track mouse position
        this.input.on('pointermove', (pointer) => {
            this.mouseX = pointer.worldX;
            this.mouseY = pointer.worldY;
        });
        
        // Track mouse states
        this.input.on('pointerdown', () => {
            this.isMouseDown = true;
        });
        
        this.input.on('pointerup', () => {
            this.isMouseDown = false;
        });
        
        // Set up WASD keys
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Set up spacebar for pause
        this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    /**
     * Set up the enemy spawner timer
     */
    setupEnemySpawner() {
        this.time.addEvent({
            delay: this.enemySpawnRate,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    setPauseState(isPaused, reason = 'toggle') {
        this.isPaused = isPaused;
        
        // Show/hide pause overlay based on reason
        const showOverlay = reason === 'toggle' || reason === 'space';
        this.pauseOverlay.setVisible(isPaused && showOverlay);
        this.pauseText.setVisible(isPaused && showOverlay);
        
        // Pause/resume all physics and timers
        if (isPaused) {
            this.physics.pause();
            this.time.paused = true;
        } else {
            this.physics.resume();
            this.time.paused = false;
        }
    }

    togglePause() {
        this.setPauseState(!this.isPaused, 'toggle');
    }

    pauseGame(reason = 'external') {
        this.setPauseState(true, reason);
    }

    resumeGame() {
        this.setPauseState(false);
    }

    update(time, delta) {
        // Handle pause state
        this.handlePauseState();
        
        // If game is paused, don't update game logic
        if (this.isPaused) {
            return;
        }
        
        // Update game timers
        this.updateGameTimers(delta);
        
        // Update player, bullets, and enemies
        this.updateGameObjects();
        
        // Check for collisions
        this.checkCollisions();
        
        // Update difficulty based on game time
        this.updateDifficulty();
    }

    /**
     * Handle pause key press and game pause state
     */
    handlePauseState() {
        if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
            this.togglePause();
        }
    }

    /**
     * Update game time and survival time
     * @param {number} delta - Time since last frame in ms
     */
    updateGameTimers(delta) {
        // Update game time for difficulty scaling
        this.gameTime += delta;
        
        // Update survival time
        this.survivalTime += delta / 1000;
        
        // Only update UI text if it exists
        if (this.timerText) {
            this.timerText.setText(`Time: ${Math.floor(this.survivalTime)}s`);
        }
        
        // Log debug info only in development mode
        if (this.isDev && this.gameTime % 1000 < 16) {
            console.debug(`Game time: ${Math.floor(this.gameTime / 1000)}s, Enemy count: ${this.enemyList.length}`);
        }
    }

    /**
     * Update all game objects (player, bullets, enemies)
     */
    updateGameObjects() {
        // Update player
        this.player.update();
        
        // Attempt to shoot if mouse is held down
        if (this.isMouseDown) {
            this.player.shoot();
        }
        
        // Update bullets
        this.updateBullets();
        
        // Update enemies
        this.updateEnemies();
    }

    updateBullets() {
        // Update each bullet's position
        this.bullets.getChildren().forEach(bullet => {
            bullet.x += bullet.dirX * bullet.speed;
            bullet.y += bullet.dirY * bullet.speed;
            
            // Remove bullets that are too far from player
            const playerPos = this.player.getPosition();
            const dx = bullet.x - playerPos.x;
            const dy = bullet.y - playerPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Track bullet lifetime and destroy if too old
            bullet.lifetime = bullet.lifetime || 0;
            bullet.lifetime += this.time.physicsFrameDelta;
            
            // Destroy bullets that are too far OR have been alive too long (3 seconds max)
            if (distance > 1000 || bullet.lifetime > 3000) {
                bullet.destroy();
            }
        });
    }
    
    spawnEnemy() {
        // Get camera viewport and scaled map dimensions
        const cam = this.cameras.main;
        const playerPos = this.player.getPosition();
        const scale = this.groundLayer.scale;
        const effectiveMapWidth = this.map.widthInPixels * scale;
        const effectiveMapHeight = this.map.heightInPixels * scale;
        
        // Increased margin for spawning further outside the view
        const minMargin = 150; // Minimum spawn distance from view edge
        const maxMargin = 400; // Maximum spawn distance from view edge
        const margin = Phaser.Math.Between(minMargin, maxMargin);
        
        let x, y;
        
        // Choose a side to spawn from (with weighted randomness)
        // Sometimes spawn from corners for more varied approach angles
        const spawnType = Phaser.Math.Between(0, 100);
        
        if (spawnType < 80) {
            // Standard edge spawn (80% chance)
            const side = Phaser.Math.Between(0, 3);
            
            // Calculate spawn position around viewport but use scaled dimensions
            switch(side) {
                case 0: // Top
                    x = Phaser.Math.Between(
                        Math.max(50, playerPos.x - cam.width),
                        Math.min(effectiveMapWidth - 50, playerPos.x + cam.width)
                    );
                    y = Math.max(50, playerPos.y - cam.height/2 - margin);
                    break;
                case 1: // Right
                    x = Math.min(effectiveMapWidth - 50, playerPos.x + cam.width/2 + margin);
                    y = Phaser.Math.Between(
                        Math.max(50, playerPos.y - cam.height),
                        Math.min(effectiveMapHeight - 50, playerPos.y + cam.height)
                    );
                    break;
                case 2: // Bottom
                    x = Phaser.Math.Between(
                        Math.max(50, playerPos.x - cam.width),
                        Math.min(effectiveMapWidth - 50, playerPos.x + cam.width)
                    );
                    y = Math.min(effectiveMapHeight - 50, playerPos.y + cam.height/2 + margin);
                    break;
                case 3: // Left
                    x = Math.max(50, playerPos.x - cam.width/2 - margin);
                    y = Phaser.Math.Between(
                        Math.max(50, playerPos.y - cam.height),
                        Math.min(effectiveMapHeight - 50, playerPos.y + cam.height)
                    );
                    break;
            }
        } else if (spawnType < 95) {
            // Corner spawn (15% chance)
            const corner = Phaser.Math.Between(0, 3);
            const cornerMargin = margin * 1.2; // Slightly further for corners
            
            switch(corner) {
                case 0: // Top-Left
                    x = Math.max(50, playerPos.x - cam.width/2 - cornerMargin);
                    y = Math.max(50, playerPos.y - cam.height/2 - cornerMargin);
                    break;
                case 1: // Top-Right
                    x = Math.min(effectiveMapWidth - 50, playerPos.x + cam.width/2 + cornerMargin);
                    y = Math.max(50, playerPos.y - cam.height/2 - cornerMargin);
                    break;
                case 2: // Bottom-Right
                    x = Math.min(effectiveMapWidth - 50, playerPos.x + cam.width/2 + cornerMargin);
                    y = Math.min(effectiveMapHeight - 50, playerPos.y + cam.height/2 + cornerMargin);
                    break;
                case 3: // Bottom-Left
                    x = Math.max(50, playerPos.x - cam.width/2 - cornerMargin);
                    y = Math.min(effectiveMapHeight - 50, playerPos.y + cam.height/2 + cornerMargin);
                    break;
            }
        } else {
            // Group spawn - spawn multiple enemies in the same area (5% chance)
            this.spawnEnemyGroup();
            return; // Skip regular enemy spawn since we're spawning a group
        }
        
        // Ensure spawn is within map bounds
        x = Phaser.Math.Clamp(x, 50, effectiveMapWidth - 50);
        y = Phaser.Math.Clamp(y, 50, effectiveMapHeight - 50);
        
        // Create a new enemy
        const enemy = new Enemy(this, x, y);
        
        // Add to enemy list
        this.enemyList.push(enemy);
    }
    
    spawnEnemyGroup() {
        // Get camera viewport and scaled map dimensions
        const cam = this.cameras.main;
        const playerPos = this.player.getPosition();
        const scale = this.groundLayer.scale;
        const effectiveMapWidth = this.map.widthInPixels * scale;
        const effectiveMapHeight = this.map.heightInPixels * scale;
        
        // Choose a side for the group to spawn from
        const side = Phaser.Math.Between(0, 3);
        
        // Base position for the group (far from view)
        const groupMargin = 500; // Spawn groups very far away
        let baseX, baseY;
        
        // Calculate base position for the group
        switch(side) {
            case 0: // Top
                baseX = playerPos.x + Phaser.Math.Between(-cam.width/2, cam.width/2);
                baseY = Math.max(50, playerPos.y - cam.height/2 - groupMargin);
                break;
            case 1: // Right
                baseX = Math.min(effectiveMapWidth - 50, playerPos.x + cam.width/2 + groupMargin);
                baseY = playerPos.y + Phaser.Math.Between(-cam.height/2, cam.height/2);
                break;
            case 2: // Bottom
                baseX = playerPos.x + Phaser.Math.Between(-cam.width/2, cam.width/2);
                baseY = Math.min(effectiveMapHeight - 50, playerPos.y + cam.height/2 + groupMargin);
                break;
            case 3: // Left
                baseX = Math.max(50, playerPos.x - cam.width/2 - groupMargin);
                baseY = playerPos.y + Phaser.Math.Between(-cam.height/2, cam.height/2);
                break;
        }
        
        // Spawn 3-6 enemies in the group
        const groupSize = Phaser.Math.Between(3, 6);
        const spreadRadius = 100; // How spread out the group is
        
        for (let i = 0; i < groupSize; i++) {
            // Random offset within the spread radius
            const offsetX = Phaser.Math.Between(-spreadRadius, spreadRadius);
            const offsetY = Phaser.Math.Between(-spreadRadius, spreadRadius);
            
            // Calculate final spawn position with offset
            const x = Phaser.Math.Clamp(baseX + offsetX, 50, effectiveMapWidth - 50);
            const y = Phaser.Math.Clamp(baseY + offsetY, 50, effectiveMapHeight - 50);
            
            // Create enemy and add to list
            const enemy = new Enemy(this, x, y);
            this.enemyList.push(enemy);
        }
    }
    
    updateEnemies() {
        // Loop through all enemies and update them
        for (let i = this.enemyList.length - 1; i >= 0; i--) {
            // Update enemy movement and behavior
            this.enemyList[i].update();
            
            // If enemy was destroyed, remove from list
            if (!this.enemyList[i].graphics || !this.enemyList[i].graphics.active) {
                this.createEnemyDeathEffect(this.enemyList[i].graphics.x, this.enemyList[i].graphics.y);
                this.enemyList.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        this.checkBulletEnemyCollisions();
    }

    checkBulletEnemyCollisions() {
        // Check each bullet against each enemy
        this.bullets.getChildren().forEach(bullet => {
            this.enemies.getChildren().forEach(enemyGraphics => {
                // If both bullet and enemy exist
                if (bullet.active && enemyGraphics.active) {
                    // Check distance
                    const distance = Phaser.Math.Distance.Between(
                        bullet.x, bullet.y,
                        enemyGraphics.x, enemyGraphics.y
                    );
                    
                    // If hit (sum of radii), damage enemy
                    if (distance < (this.player.caliber + enemyGraphics.parentEnemy.size/2)) {
                        // Damage enemy with bullet's damage value
                        enemyGraphics.parentEnemy.takeDamage(this.player.bulletDamage);
                        
                        // Reduce bullet health
                        bullet.health--;
                        
                        // Visual feedback - make bullet flash
                        const originalColor = this.player.bulletColor;
                        const hitColor = 0xffffff;
                        bullet.fillColor = hitColor;
                        
                        // Reset bullet color after a short delay if it still exists
                        this.time.delayedCall(50, () => {
                            if (bullet && bullet.active) {
                                bullet.fillColor = originalColor;
                            }
                        });
                        
                        // Only destroy bullet if its health is depleted
                        if (bullet.health <= 0) {
                            bullet.destroy();
                        }
                    }
                }
            });
        });
    }
    
    updateDifficulty() {
        // Every 10 seconds, make enemies spawn faster
        if (this.gameTime > 0 && this.gameTime % 10000 < 100) {
            // Reduce spawn rate (making enemies spawn faster)
            this.enemySpawnRate = Math.max(
                this.minEnemySpawnRate, 
                this.enemySpawnRate - this.enemySpawnRateDecrease
            );
            
            // Update the spawn timer
            this.time.addEvent({
                delay: this.enemySpawnRate,
                callback: this.spawnEnemy,
                callbackScope: this,
                loop: true
            });
        }
    }
    
    playerDeath() {
        // Pass survival time and kill count to the GameOver scene
        this.scene.start('GameOver', { 
            survivalTime: Math.floor(this.survivalTime),
            killCount: this.killCount,
        });
    }

    changeScene() {
        this.scene.start('GameOver', { 
            survivalTime: Math.floor(this.survivalTime),
            killCount: this.killCount,
        });
    }

    createEnemyDeathEffect(x, y) {
        // Create a particle emitter
        const particles = this.add.particles(x, y, 'particle_texture', {
            speed: { min: 50, max: 200 },
            scale: { start: 0.15, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 100,
            blendMode: 'ADD',
            quantity: 5,
            angle: { min: 0, max: 360 }
        });
        
        // Auto-destroy the emitter after it's done
        particles.setDepth(50);
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }

    // Method to spawn a boss
    spawnBoss() {
        // Get camera viewport and scaled map dimensions
        const cam = this.cameras.main;
        const playerPos = this.player.getPosition();
        const scale = this.groundLayer.scale;
        const effectiveMapWidth = this.map.widthInPixels * scale;
        const effectiveMapHeight = this.map.heightInPixels * scale;
        
        // Make the boss spawn very far from the player, but visible
        const bossMargin = 600; // Very far away
        let x, y;
        
        // Choose a direction for the boss to spawn from
        const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
        
        // Calculate spawn position far from player but in a random direction
        x = playerPos.x + Math.cos(angle) * bossMargin;
        y = playerPos.y + Math.sin(angle) * bossMargin;
        
        // Ensure spawn is within map bounds
        x = Phaser.Math.Clamp(x, 50, effectiveMapWidth - 50);
        y = Phaser.Math.Clamp(y, 50, effectiveMapHeight - 50);
        
        // Create a new boss enemy (true flag indicates it's a boss)
        const boss = new Enemy(this, x, y, true);
        
        // Add to enemy list
        this.enemyList.push(boss);
        
        // Show boss warning message
        this.showBossWarning();
    }
    
    showBossWarning() {
        // Create warning text
        const warningText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            'BOSS INCOMING!',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // Animate the warning text
        this.tweens.add({
            targets: warningText,
            alpha: { from: 1, to: 0 },
            scaleX: { from: 1, to: 1.5 },
            scaleY: { from: 1, to: 1.5 },
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                warningText.destroy();
            }
        });
    }
    
    createBossDeathEffect(x, y) {
        // Create a large explosion effect
        for (let i = 0; i < 5; i++) {
            // Stagger the explosions for dramatic effect
            this.time.delayedCall(i * 200, () => {
                // Randomize positions slightly for each explosion
                const offsetX = Phaser.Math.Between(-30, 30);
                const offsetY = Phaser.Math.Between(-30, 30);
                
                // Create a particle emitter
                const particles = this.add.particles(x + offsetX, y + offsetY, 'particle_texture', {
                    speed: { min: 100, max: 300 },
                    scale: { start: 0.4, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 800,
                    blendMode: 'ADD',
                    quantity: 30,
                    angle: { min: 0, max: 360 }
                });
                
                // Auto-destroy the emitter after it's done
                particles.setDepth(200);
                this.time.delayedCall(1000, () => {
                    particles.destroy();
                });
            });
        }
        
        // Show victory message
        const victoryText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 3,
            'BOSS DEFEATED!',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // Animate the victory text
        this.tweens.add({
            targets: victoryText,
            alpha: { from: 1, to: 0 },
            y: this.cameras.main.height / 3 - 100,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => {
                victoryText.destroy();
            }
        });
    }
}
