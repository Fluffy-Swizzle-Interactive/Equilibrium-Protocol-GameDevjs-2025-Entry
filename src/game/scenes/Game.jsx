import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { SoundManager } from '../managers/SoundManager';
import { GameObjectManager } from '../managers/GameObjectManager';
import { EnemyManager } from '../managers/EnemyManager';
import { BulletPool } from '../entities/BulletPool';

export class Game extends Scene {
    constructor() {
        super({ key: 'Game' });
        
        // Add this to your existing constructor
        this.config = {
            spatialGrid: {
                enabled: true,
                cellSize: 100,
                debugDraw: false
            }
        };
        
        // Initialize game state properties
        this.enemySpawnRate = 2000; // Milliseconds between enemy spawns
        this.enemySpawnRateDecrease = 50; // How much to decrease spawn rate over time
        this.minEnemySpawnRate = 500; // Minimum time between enemy spawns
        this.gameTime = 0; // Track game time for difficulty scaling
        this.enemyList = []; // Track all active enemies
        this.killCount = 0; // Track number of enemies killed (total)
        this.regularKillCount = 0; // Track number of regular enemies killed (for boss spawning)
        this.bossesKilled = 0; // Track number of boss enemies killed
        
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
        this.regularKillCount = 0;
        this.bossesKilled = 0;
        this.gameTime = 0;
        this.survivalTime = 0;
        this.enemySpawnRate = 2000; // Reset to initial spawn rate
        this.enemyList = [];
        this.isPaused = false;
    }

    create() {
        this.setupMap();
        this.setupSoundManager(); // Initialize sound manager first
        this.setupObjectManager(); // Initialize object pooling system
        this.setupGameObjects(); // Then create player and other objects
        this.setupUI();
        this.setupInput();
        this.setupEnemySpawner();
        
        this.gridCellSize = 100; // Adjust based on game scale
        this.spatialGrid = {};
        
        EventBus.emit('current-scene-ready', this);
    }

    /**
     * Set up the sound manager and start ambient music
     */
    setupSoundManager() {
        // Create sound manager
        this.soundManager = new SoundManager(this);
        
        // Initialize ambient music
        this.soundManager.initBackgroundMusic('ambient_music', {
            volume: 0.4,  // Slightly lower volume for ambient music
            loop: true
        });
        
        // Initialize sound effects
        this.soundManager.initSoundEffect('shoot_minigun', {
            volume: 0.5,
            rate: 1.0
        });
        
        this.soundManager.initSoundEffect('shoot_shotgun', {
            volume: 0.6,
            rate: 0.9
        });
        
        // Unlock audio context as early as possible - this helps with mobile browsers
        // and cases where audio might be initially locked
        if (this.sound.locked) {
            console.debug('Audio system is locked. Attempting to unlock...');
            this.sound.once('unlocked', () => {
                console.debug('Audio system unlocked successfully');
                // Start playing ambient music with fade in once audio is unlocked
                this.soundManager.playMusic('ambient_music', {
                    fadeIn: 2000  // 2 second fade in
                });
            });
        } else {
            // Sound already unlocked, play immediately
            this.soundManager.playMusic('ambient_music', {
                fadeIn: 2000  // 2 second fade in
            });
        }
    }

    /**
     * Set up the global object manager for pooling game objects
     */
    setupObjectManager() {
        // Create the global object manager
        this.gameObjectManager = new GameObjectManager(this);
        
        // Create groups for game objects
        this.bullets = this.add.group();
        this.enemies = this.add.group();
        
        // Initialize the bullet pool
        this.bulletPool = new BulletPool(this, {
            initialSize: 50,  // Start with 50 bullets
            maxSize: 500,     // Allow up to 500 bullets
            growSize: 20      // Add 20 at a time when needed
        });
        
        // Initialize the enemy manager with pools for different enemy types
        this.enemyManager = new EnemyManager(this, {
            initialSize: 20,  // Start with 20 enemies
            maxSize: 200,     // Allow up to 200 enemies
            growSize: 5       // Add 5 at a time when needed
        });
    }

    /**
     * Set up the game map and boundaries
     */
    setupMap() {
        // Create the tilemap
        this.map = this.make.tilemap({ key: 'map' });
        this.tileset = this.map.addTilesetImage('level1', 'level1');
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
            
            // Pause ambient music
            if (this.soundManager) {
                this.soundManager.pauseMusic();
            }
        } else {
            this.physics.resume();
            this.time.paused = false;
            
            // Resume ambient music
            if (this.soundManager) {
                this.soundManager.resumeMusic();
            }
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
        
        // Uncomment the following line to visualize the spatial grid (for debugging)
         //this.debugDrawGrid();
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
        
        // Update bullets using the pooling system
        this.updateBullets();
        
        // Update enemies using the pooling system
        this.updateEnemies();
    }

    updateBullets() {
        // Use the bullet pool to update and cull bullets
        this.bulletPool.updateBullets(
            // Custom update function - not needed since standard movement is applied in the pool
            null,
            // Culling function - return true to release the bullet back to the pool
            (bullet) => {
                // Get distance from player
                const playerPos = this.player.getPosition();
                const dx = bullet.x - playerPos.x;
                const dy = bullet.y - playerPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Return true if bullet should be culled (too far or too old)
                return distance > 1000 || bullet.lifetime > 3000;
            }
        );
    }
    
    spawnEnemy() {
        // Determine which enemy type to spawn based on game time and randomness
        let enemyType;
        
        // Random chance to spawn either enemy1 or enemy2 from the start
        if (Math.random() < 0.7) {
            enemyType = 'enemy1';
        } else {
            enemyType = 'enemy2';
        }
        
        // As game progresses, increase chance to spawn tougher enemies
        const gameTimeMinutes = this.gameTime / 60000;
        
        // After 1 minute, increase enemy2 spawn chance
        if (gameTimeMinutes >= 1 && Math.random() < 0.5) {
            enemyType = 'enemy2';
        }
        
        // After 3 minutes, further increase enemy2 spawn chance
        if (gameTimeMinutes >= 3 && Math.random() < 0.7) {
            enemyType = 'enemy2';
        }
        
        // Use the enemyManager to spawn enemies at map edges
        this.enemyManager.spawnEnemiesAtEdges(enemyType, 1);
    }
    
    spawnEnemyGroup() {
        // Determine which enemy type to spawn
        let enemyType;
        
        // Random chance to spawn either enemy1 or enemy2 groups from the start
        if (Math.random() < 0.6) {
            enemyType = 'enemy1';
        } else {
            enemyType = 'enemy2';
        }
        
        // As game progresses, increase chance for enemy2 groups
        const gameTimeMinutes = this.gameTime / 60000;
        
        // After 2 minutes, increase enemy2 group spawn chance
        if (gameTimeMinutes >= 2 && Math.random() < 0.6) {
            enemyType = 'enemy2';
        }
        
        // Get player position
        const playerPos = this.player.getPosition();
        
        // Choose random group size (3-6 enemies)
        const groupSize = Phaser.Math.Between(3, 6);
        
        // Spawn enemy group around a point far from player
        const bossMargin = 500; // Far away
        const angle = Math.random() * Math.PI * 2;
        
        // Calculate spawn position in random direction
        let baseX = playerPos.x + Math.cos(angle) * bossMargin;
        let baseY = playerPos.y + Math.sin(angle) * bossMargin;
        
        // Ensure spawn is within map bounds
        baseX = Math.max(50, Math.min(this.mapDimensions.width - 50, baseX));
        baseY = Math.max(50, Math.min(this.mapDimensions.height - 50, baseY));
        
        // Use the enemy manager to spawn the group
        this.enemyManager.spawnEnemyGroup(enemyType, baseX, baseY, groupSize, 100);
    }
    
    updateEnemies() {
        // Use the enemy manager to update all enemies
        if (this.enemyManager) {
            this.enemyManager.update();
        }
    }
    
    checkCollisions() {
        this.checkBulletEnemyCollisions();
    }

    checkBulletEnemyCollisions() {
        // Update spatial grid
        this.updateSpatialGrid();
        
        // Check collisions with spatial optimization
        this.bullets.getChildren().forEach(bullet => {
            if (!bullet.active) return;
            
            // Get bullet's cell and adjacent cells
            const cellX = Math.floor(bullet.x / this.gridCellSize);
            const cellY = Math.floor(bullet.y / this.gridCellSize);
            
            // Check only enemies in relevant cells
            for (let x = cellX - 1; x <= cellX + 1; x++) {
                for (let y = cellY - 1; y <= cellY + 1; y++) {
                    const cellKey = `${x},${y}`;
                    const enemiesInCell = this.spatialGrid[cellKey] || [];
                    
                    // Check collisions with enemies in this cell
                    enemiesInCell.forEach(enemyGraphics => {
                        if (!enemyGraphics.active || !bullet.active) return;
                        
                        const distance = Phaser.Math.Distance.Between(
                            bullet.x, bullet.y,
                            enemyGraphics.x, enemyGraphics.y
                        );
                        
                        if (distance < (this.player.caliber + enemyGraphics.parentEnemy.size/2)) {
                            // Damage enemy with bullet's damage value
                            enemyGraphics.parentEnemy.takeDamage(this.player.bulletDamage);
                            
                            // Reduce bullet health
                            bullet.health--;
                            
                            // Visual feedback - make bullet flash
                            const originalColor = this.player.bulletColor;
                            bullet.fillColor = 0xffffff;
                            
                            // Reset bullet color after a short delay if it still exists
                            this.time.delayedCall(50, () => {
                                if (bullet && bullet.active) {
                                    bullet.fillColor = originalColor;
                                }
                            });
                            
                            // Only release bullet back to pool if its health is depleted
                            if (bullet.health <= 0) {
                                this.bulletPool.releaseBullet(bullet);
                            }
                        }
                    });
                }
            }
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
        // Stop ambient music with fade out
        if (this.soundManager) {
            this.soundManager.stopMusic(1000); // 1s fade out
        }

        // Pass survival time and kill count to the GameOver scene
        this.scene.start('GameOver', { 
            survivalTime: Math.floor(this.survivalTime),
            killCount: this.killCount,
        });
    }

    changeScene() {
        // Stop ambient music
        if (this.soundManager) {
            this.soundManager.stopMusic(500);
        }

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

    /**
     * Method called when an enemy is killed
     * @param {boolean} isBoss - Whether the killed enemy was a boss
     * @param {number} x - X position of enemy death
     * @param {number} y - Y position of enemy death
     * @param {string} enemyType - Type of enemy killed
     */
    onEnemyKilled(isBoss, x, y, enemyType) {
        // Increment total kill count
        this.killCount++;
        
        // Update the kill counter UI
        this.killText.setText(`Kills: ${this.killCount}`);
        
        // Create death effect at enemy position
        this.createEnemyDeathEffect(x, y);
        
        if (isBoss) {
            // If a boss was killed, increment the boss kill counter
            this.bossesKilled++;
            
            // Create special effects for boss death
            this.createBossDeathEffect(x, y);
            
            // Award bonus points for boss kill
            // Note: could be tracked separately if needed
        } else {
            // If a regular enemy was killed, increment the regular kill counter
            this.regularKillCount++;
            
            // Check if we should spawn a boss after enough regular enemies killed
            // Changed from 1000 to a more reasonable number for testing
            if (this.regularKillCount % 1000 === 0) {
                this.spawnBoss();
            }
            
            // Occasionally spawn enemy groups
            if (this.regularKillCount % 10 === 0 && Math.random() < 0.5) {
                this.spawnEnemyGroup();
            }
        }
    }

    // Method to spawn a boss
    spawnBoss() {
        // Use the enemy manager to handle boss spawning
        if (this.enemyManager) {
            this.enemyManager.spawnBoss('boss1');
        }
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

    updateSpatialGrid() {
        // Clear grid
        this.spatialGrid = {};
        
        // Add enemies to grid
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            
            const cellX = Math.floor(enemy.x / this.gridCellSize);
            const cellY = Math.floor(enemy.y / this.gridCellSize);
            const cellKey = `${cellX},${cellY}`;
            
            if (!this.spatialGrid[cellKey]) {
                this.spatialGrid[cellKey] = [];
            }
            
            this.spatialGrid[cellKey].push(enemy);
        });
    }

    // Add this method to visualize the spatial grid (for debugging)
    debugDrawGrid() {
        // Clear previous debug graphics
        if (this.gridDebugGraphics) {
            this.gridDebugGraphics.clear();
        } else {
            this.gridDebugGraphics = this.add.graphics();
        }
        
        // Draw grid cells that contain enemies
        this.gridDebugGraphics.lineStyle(1, 0x00ff00, 0.3);
        
        Object.keys(this.spatialGrid).forEach(cellKey => {
            const [cellX, cellY] = cellKey.split(',').map(Number);
            const x = cellX * this.gridCellSize;
            const y = cellY * this.gridCellSize;
            
            // Draw cell rectangle
            this.gridDebugGraphics.strokeRect(x, y, this.gridCellSize, this.gridCellSize);
            
            // Optionally show enemy count in cell
            const count = this.spatialGrid[cellKey].length;
            if (count > 0) {
                this.gridDebugGraphics.fillStyle(0x00ff00, 0.2);
                this.gridDebugGraphics.fillRect(x, y, this.gridCellSize, this.gridCellSize);
            }
        });
    }
}
