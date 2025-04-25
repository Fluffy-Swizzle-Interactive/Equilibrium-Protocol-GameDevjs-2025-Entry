# Troubleshooting

## Overview

This document provides solutions for common issues that may arise during development or gameplay of Fluffy-Swizz Interactive. It covers rendering problems, performance issues, gameplay bugs, and development environment setup.

## Rendering Issues

### Sprites Not Displaying

**Symptoms:**
- Sprites are invisible but still interact with the game
- Placeholder rectangles appear instead of sprites
- Console errors related to textures or images

**Possible Causes and Solutions:**

1. **Assets not loaded properly**
   - Ensure assets are properly preloaded in the Preloader scene
   - Check browser console for 404 errors
   - Verify file paths and case sensitivity

   ```javascript
   // Correct way to preload assets
   preload() {
       this.load.image('player', 'assets/images/sprites/player.png');
       // Wait for loading to complete
       this.load.on('complete', () => {
           console.log('All assets loaded successfully');
       });
   }
   ```

2. **Texture atlas frame issues**
   - Verify frame dimensions in spritesheet configuration
   - Check that frame names match what's being referenced in code

   ```javascript
   // Debugging texture atlas frames
   create() {
       // List all available frames in a texture atlas
       console.log('Available frames:', Object.keys(this.textures.get('ui_atlas').frames));
   }
   ```

3. **Sprite visibility settings**
   - Check if sprites have `visible` property set to false
   - Verify alpha value is not set to 0
   - Check if sprites are positioned off-screen

   ```javascript
   // Reset visibility settings
   sprite.setVisible(true);
   sprite.setAlpha(1);
   sprite.setPosition(400, 300); // Move to center of screen
   ```

4. **WebGL context issues**
   - Try switching to Canvas renderer as a fallback
   - Check for WebGL support in the browser

   ```javascript
   // Force Canvas renderer
   const config = {
       type: Phaser.CANVAS,
       // Other configuration...
   };
   ```

### Animation Problems

**Symptoms:**
- Animations not playing
- Animations playing incorrectly
- Sprites stuck on a single frame

**Possible Causes and Solutions:**

1. **Animation not created properly**
   - Verify animation key names
   - Check frame indices and frame rate

   ```javascript
   // Debugging animations
   create() {
       // List all available animations
       console.log('Available animations:', this.anims.anims.entries);
       
       // Create animation with explicit frames
       this.anims.create({
           key: 'player_walk',
           frames: [
               { key: 'player', frame: 0 },
               { key: 'player', frame: 1 },
               { key: 'player', frame: 2 },
               { key: 'player', frame: 3 }
           ],
           frameRate: 10,
           repeat: -1
       });
   }
   ```

2. **Animation not started**
   - Ensure `play()` method is called
   - Check if animation is being stopped elsewhere

   ```javascript
   // Start animation and log when it completes
   sprite.play('player_walk');
   sprite.on('animationcomplete', () => {
       console.log('Animation completed');
   });
   ```

3. **Sprite sheet configuration issues**
   - Verify sprite sheet dimensions
   - Check frame size and spacing

   ```javascript
   // Correct spritesheet loading
   preload() {
       this.load.spritesheet('player', 
           'assets/images/sprites/player_spritesheet.png',
           { 
               frameWidth: 64, 
               frameHeight: 64,
               spacing: 1, // If there's spacing between frames
               margin: 1   // If there's margin around frames
           }
       );
   }
   ```

### Camera Issues

**Symptoms:**
- Objects not visible in the viewport
- Camera not following the player
- Black screen or partial rendering

**Possible Causes and Solutions:**

1. **Camera bounds issues**
   - Check camera bounds against world bounds
   - Verify camera is following the correct object

   ```javascript
   // Set up camera correctly
   create() {
       // Set camera bounds to match the world
       this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
       
       // Make camera follow the player
       this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
       
       // Debug camera view
       console.log('Camera view:', {
           x: this.cameras.main.scrollX,
           y: this.cameras.main.scrollY,
           width: this.cameras.main.width,
           height: this.cameras.main.height
       });
   }
   ```

2. **Scroll factor issues**
   - Check if objects have incorrect scroll factors
   - UI elements should have scrollFactor(0) to stay fixed on screen

   ```javascript
   // Fix scroll factors
   create() {
       // Game objects should scroll with the camera (default)
       this.player.setScrollFactor(1);
       
       // UI elements should not scroll with the camera
       this.healthBar.setScrollFactor(0);
   }
   ```

3. **Zoom issues**
   - Check if camera zoom is set to extreme values
   - Verify that zoom is being applied correctly

   ```javascript
   // Reset camera zoom
   this.cameras.main.setZoom(1);
   ```

## Particle System Issues

### Common Error: `createEmitter removed. See ParticleEmitter docs for info`

This error occurs when using an outdated Phaser particle API method. The Phaser version used in this project requires the new particle API.

#### Solution

Instead of:
```javascript
// Old way - causes error
const particles = scene.particles.createEmitter({
    // config
});
```

Use this pattern:
```javascript
// New way - correct method
const particleManager = scene.add.particles(x, y, 'texture_key', {
    // config
});

// To destroy when done
scene.time.delayedCall(duration, () => {
    particleManager.destroy();
});
```

This has been fixed in:
- ChaosManager.js (`createChaosParticles`)
- UIManager.js (`createChaosParticleEffect`) 
- FactionBattleManager.js (`createBattleEffect` and `createBattleVictoryEffect`)
- CollectibleManager.js (`createCollectionEffect` and `showHealingEffect`)

The particle configuration options remain the same, only the method of creating the emitter has changed.

## Performance Issues

### Low Frame Rate

**Symptoms:**
- Game runs slowly
- Stuttering or jerky movement
- FPS counter shows low values

**Possible Causes and Solutions:**

1. **Too many active game objects**
   - Implement object pooling for frequently created/destroyed objects
   - Cull off-screen objects

   ```javascript
   // Object pooling example
   create() {
       this.bulletPool = this.physics.add.group({
           classType: Bullet,
           maxSize: 100,
           runChildUpdate: true
       });
   }
   
   fireBullet() {
       // Get bullet from pool instead of creating new one
       const bullet = this.bulletPool.get();
       if (bullet) {
           bullet.fire(this.x, this.y, this.rotation);
       }
   }
   ```

2. **Inefficient update logic**
   - Optimize heavy calculations in update methods
   - Use time-based movement instead of frame-based

   ```javascript
   // Time-based movement
   update(time, delta) {
       // Move based on time elapsed (delta in ms)
       this.x += this.speed * (delta / 1000);
       
       // Only perform expensive operations when needed
       if (time > this.nextAIUpdate) {
           this.updateAI();
           this.nextAIUpdate = time + 500; // Update AI every 500ms
       }
   }
   ```

3. **Physics system overload**
   - Reduce number of physics bodies
   - Use simpler collision shapes
   - Implement spatial partitioning for collision checks

   ```javascript
   // Optimize physics
   create() {
       // Use circle body for better performance when appropriate
       this.player.body.setCircle(20);
       
       // Disable physics for off-screen objects
       this.events.on('update', () => {
           this.enemies.getChildren().forEach(enemy => {
               const distance = Phaser.Math.Distance.Between(
                   enemy.x, enemy.y, this.player.x, this.player.y
               );
               
               // Only enable physics for nearby enemies
               enemy.body.enable = distance < 1000;
           });
       });
   }
   ```

4. **Rendering optimization**
   - Use texture atlases to reduce draw calls
   - Implement proper depth sorting
   - Consider using render textures for complex static elements

   ```javascript
   // Optimize rendering
   create() {
       // Group similar objects for batch rendering
       this.enemies = this.add.group();
       
       // Use render texture for static elements
       const staticElements = this.add.renderTexture(0, 0, 800, 600);
       staticElements.draw(this.backgroundElements);
   }
   ```

### Memory Leaks

**Symptoms:**
- Game performance degrades over time
- Browser tab uses increasing amounts of memory
- Game crashes after extended play

**Possible Causes and Solutions:**

1. **Event listeners not removed**
   - Always remove event listeners when no longer needed
   - Use `once()` for one-time events

   ```javascript
   // Proper event listener cleanup
   create() {
       // Store reference to bound function
       this.boundEventHandler = this.handleEvent.bind(this);
       this.events.on('myevent', this.boundEventHandler);
   }
   
   destroy() {
       // Remove event listener when scene is destroyed
       this.events.off('myevent', this.boundEventHandler);
   }
   ```

2. **Objects not properly destroyed**
   - Call `destroy()` on objects when no longer needed
   - Return objects to pools instead of creating new ones

   ```javascript
   // Proper cleanup
   removeEnemy(enemy) {
       // Remove from physics system
       this.physics.world.disable(enemy);
       
       // Remove any tweens
       this.tweens.killTweensOf(enemy);
       
       // Remove any event listeners
       enemy.removeAllListeners();
       
       // Destroy the object
       enemy.destroy();
   }
   ```

3. **Circular references**
   - Avoid circular object references
   - Set references to null when no longer needed

   ```javascript
   // Avoid circular references
   create() {
       this.player = new Player(this, 100, 100);
       
       // Weak reference to scene (already accessible via this.scene)
       // this.player.gameScene = this; // BAD - creates circular reference
   }
   
   destroy() {
       // Clear references
       this.player = null;
   }
   ```

## Gameplay Issues

### Collision Detection Problems

**Symptoms:**
- Objects pass through each other
- Collisions detected incorrectly
- Inconsistent collision behavior

**Possible Causes and Solutions:**

1. **Physics bodies not set up correctly**
   - Check body size and offset
   - Verify that physics is enabled for objects

   ```javascript
   // Debug physics bodies
   create() {
       // Show physics bodies
       this.physics.world.createDebugGraphic();
       
       // Adjust body size and offset
       this.player.body.setSize(40, 40); // Set custom hitbox size
       this.player.body.setOffset(12, 12); // Offset from sprite origin
   }
   ```

2. **Collision groups not set up properly**
   - Verify collision groups and callbacks
   - Check that objects are in the correct groups

   ```javascript
   // Set up collision groups
   create() {
       // Create collision groups
       this.playerBullets = this.physics.add.group();
       this.enemies = this.physics.add.group();
       
       // Set up collision between groups
       this.physics.add.overlap(
           this.playerBullets,
           this.enemies,
           this.handleBulletEnemyCollision,
           null,
           this
       );
   }
   ```

3. **Fast-moving objects**
   - Implement continuous collision detection for fast objects
   - Reduce object speed or increase physics step rate

   ```javascript
   // Handle fast-moving objects
   create() {
       // Set up arcade physics for continuous collision detection
       this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
       this.physics.world.TILE_BIAS = 40; // Increase for fast objects
   }
   
   // For very fast bullets, implement ray casting
   updateBullet(time, delta) {
       // Store previous position
       this.prevX = this.x;
       this.prevY = this.y;
       
       // Update position
       this.x += this.velocityX * (delta / 1000);
       this.y += this.velocityY * (delta / 1000);
       
       // Check for collisions along path
       const ray = new Phaser.Geom.Line(this.prevX, this.prevY, this.x, this.y);
       const hits = this.scene.physics.world.bodyRayCast(ray);
       
       if (hits.length > 0) {
           // Handle collision with the first hit
           this.handleCollision(hits[0].body.gameObject);
       }
   }
   ```

### Bullet Sprite and Collision Issues

**Symptoms:**
- Bullet sprites not visible but still interacting with the game
- Bullet-enemy collisions not registering correctly
- Inconsistent bullet behavior across different weapons

**Possible Causes and Solutions:**

1. **Bullet sprite path issues**
   - Check for case sensitivity in folder names (e.g., 'bullets' vs 'BULLETS')
   - Verify correct asset path in preload method

   ```javascript
   // Correct way to preload bullet sprites
   preload() {
       // Make sure to use the correct case for folder names
       for (let i = 1; i <= 10; i++) {
           const bulletKey = `bullet_${i}`;
           const bulletPath = `assets/sprites/BULLETS/${bulletKey}.png`;
           this.load.image(bulletKey, bulletPath);
       }
   }
   ```

2. **Bullet pool configuration issues**
   - Ensure bullet properties are correctly applied when creating bullets
   - Configure proper radius and scale for sprite-based bullets

   ```javascript
   // Configure bullet sprites properly in BulletPool constructor
   constructor(scene, options = {}) {
       // ...other initialization code...
       
       // Configure bullet sprites with correct scale and collision radius
       this.bulletSprites = {
           'bullet_1': { scale: 0.8, radius: 4 },
           'bullet_2': { scale: 0.8, radius: 5 },
           // Define all bullet types with appropriate properties
       };
       
       // Map weapon types to bullet sprites
       this.weaponBulletMap = {
           'minigun': ['bullet_1', 'bullet_4', 'bullet_7'],
           'shotgun': ['bullet_2', 'bullet_5', 'bullet_8'],
           // Map weapon types to appropriate bullet sprites
       };
   }
   ```

3. **Bullet-enemy collision detection problems**
   - Use appropriate collision detection methods (circle-to-circle for better accuracy)
   - Ensure bullet radius and enemy hitbox radius are properly defined

   ```javascript
   // Improved circle-to-circle collision detection
   checkCollision(bullet, enemy) {
       // Get bullet radius (use stored radius property or default to 5)
       const bulletRadius = bullet.radius || 5;
       
       // Get enemy radius (use bodyRadius property if available)
       let enemyRadius;
       if (enemy.bodyRadius !== undefined) {
           enemyRadius = enemy.bodyRadius;
       } else if (enemy.body && enemy.body.isCircle) {
           enemyRadius = enemy.body.radius;
       } else {
           // Fall back to approximating circle from body size
           enemyRadius = Math.min(enemy.width, enemy.height) / 2;
       }
       
       // Calculate distance between centers
       const dx = bullet.x - enemy.x;
       const dy = bullet.y - enemy.y;
       const distance = Math.sqrt(dx * dx + dy * dy);
       
       // Circle-to-circle intersection test
       return distance < (bulletRadius + enemyRadius);
   }
   ```

4. **Bullet persistence and penetration issues**
   - Track which enemies have already been hit by penetrating bullets
   - Use proper bullet health/pierce mechanics for bullet lifetime

   ```javascript
   // Handle bullet penetration through enemies
   handleBulletEnemyCollision(bullet, enemy) {
       // Skip if this enemy was already hit by this bullet
       if (bullet.penetratedEnemies && 
           bullet.penetratedEnemies.includes(enemy.id)) {
           return;
       }
       
       // Apply damage to enemy
       enemy.takeDamage(bullet.damage);
       
       // Track this enemy as hit
       if (!bullet.penetratedEnemies) {
           bullet.penetratedEnemies = [];
       }
       bullet.penetratedEnemies.push(enemy.id);
       
       // Reduce bullet health/pierce
       if (bullet.health !== undefined) {
           bullet.health--;
       } else if (bullet.pierce !== undefined) {
           bullet.pierce--;
       }
       
       // Only destroy bullet if its health/pierce is depleted
       if ((bullet.health !== undefined && bullet.health <= 0) ||
           (bullet.pierce !== undefined && bullet.pierce <= 0)) {
           bullet.destroy();
       }
   }
   ```

5. **Spatial partitioning optimization issues**
   - Ensure spatial grid is correctly updated and used for collision checks
   - Only check collisions in relevant grid cells for performance

   ```javascript
   // Update spatial grid for efficient collision detection
   updateSpatialGrid() {
       this.spatialGrid = {};
       
       // Add each enemy to its corresponding grid cell
       this.enemies.getChildren().forEach(enemy => {
           const cellX = Math.floor(enemy.x / this.gridCellSize);
           const cellY = Math.floor(enemy.y / this.gridCellSize);
           const cellKey = `${cellX},${cellY}`;
           
           if (!this.spatialGrid[cellKey]) {
               this.spatialGrid[cellKey] = [];
           }
           this.spatialGrid[cellKey].push(enemy);
       });
   }
   
   // Check collisions only in relevant grid cells
   checkBulletCollisions(bullet) {
       // Get bullet's grid cell and adjacent cells
       const cellX = Math.floor(bullet.x / this.gridCellSize);
       const cellY = Math.floor(bullet.y / this.gridCellSize);
       
       // Check a 3x3 area of cells around the bullet
       for (let x = cellX - 1; x <= cellX + 1; x++) {
           for (let y = cellY - 1; y <= cellY + 1; y++) {
               const cellKey = `${x},${y}`;
               const enemiesInCell = this.spatialGrid[cellKey] || [];
               
               // Check collisions only with enemies in this cell
               enemiesInCell.forEach(enemy => {
                   if (this.checkCollision(bullet, enemy)) {
                       this.handleBulletEnemyCollision(bullet, enemy);
                   }
               });
           }
       }
   }
   ```

## Development Environment Issues

### Build Problems

**Symptoms:**
- Build fails
- Assets missing in production build
- Unexpected behavior in production vs. development

**Possible Causes and Solutions:**

1. **Missing dependencies**
   - Check package.json for required dependencies
   - Run npm install to ensure all dependencies are installed

   ```bash
   # Install dependencies
   npm install
   
   # Check for outdated packages
   npm outdated
   ```

2. **Asset path issues**
   - Use relative paths for assets
   - Check base URL configuration in build settings

   ```javascript
   // In vite.config.js
   export default {
     base: './', // Use relative paths
     // Other configuration...
   }
   ```

3. **Environment-specific code**
   - Use environment variables for configuration
   - Test production build locally before deployment

   ```javascript
   // Environment-aware configuration
   const config = {
       debug: import.meta.env.DEV,
       apiUrl: import.meta.env.PROD 
           ? 'https://api.production.com' 
           : 'http://localhost:3000'
   };
   ```

### Version Control Issues

**Symptoms:**
- Merge conflicts
- Missing files in repository
- Unexpected behavior after pulling changes

**Possible Causes and Solutions:**

1. **Gitignore configuration**
   - Check .gitignore for correctly ignored files
   - Ensure build artifacts are not committed

   ```
   # Example .gitignore
   node_modules/
   dist/
   .DS_Store
   *.log
   ```

2. **Large binary files**
   - Use Git LFS for large assets
   - Consider keeping large assets in separate storage

   ```bash
   # Set up Git LFS
   git lfs install
   git lfs track "*.png" "*.jpg" "*.mp3" "*.ogg"
   git add .gitattributes
   ```

3. **Branch management**
   - Follow the established branching strategy
   - Regularly merge from main/dev to feature branches

   ```bash
   # Update feature branch with latest changes from dev
   git checkout feature/my-feature
   git pull origin dev
   # Resolve any conflicts
   git push
   ```

### Debugging Techniques

**General Debugging Approaches:**

1. **Use the Debug Panel**
   - Enable the built-in debug panel
   - Add custom metrics for specific debugging
   - Use debug actions to test game features

   ```javascript
   // Enable debug panel
   create() {
       this.debugPanel = new DebugPanel(this);
       this.debugPanel.addMetric('enemyCount', () => this.enemies.getChildren().length);
       this.debugPanel.addMetric('playerHealth', () => this.player.health);
       this.debugPanel.addMetric('fps', () => Math.round(this.game.loop.actualFps));
   }
   ```

   **Available Debug Actions:**
   - **Open Shop**: Forces the shop to open for testing upgrades
   - **Spawn Drone**: Adds a combat drone to the player for testing drone mechanics
     - Automatically increases max drone count if at limit
     - Provides visual feedback in the entity count section

2. **Visual Debugging**
   - Show hitboxes and collision areas
   - Add visual indicators for game state

   ```javascript
   // Visual debugging
   create() {
       // Show physics bodies
       this.physics.world.createDebugGraphic();
       
       // Show navigation paths
       this.navDebug = this.add.graphics();
       this.navDebug.lineStyle(2, 0x00ff00, 1);
       
       // Show enemy target with a line
       this.events.on('update', () => {
           this.navDebug.clear();
           this.enemies.getChildren().forEach(enemy => {
               this.navDebug.lineBetween(
                   enemy.x, enemy.y,
                   enemy.target.x, enemy.target.y
               );
           });
       });
   }
   ```

3. **Console Logging**
   - Use descriptive tags for filtering
   - Log important state changes

   ```javascript
   // Structured console logging
   class Logger {
       static log(system, message, data) {
           console.log(`[${system}] ${message}`, data || '');
       }
       
       static warn(system, message, data) {
           console.warn(`[${system}] ${message}`, data || '');
       }
       
       static error(system, message, data) {
           console.error(`[${system}] ${message}`, data || '');
       }
   }
   
   // Usage
   Logger.log('PLAYER', 'Health changed', { old: 100, new: 90 });
   Logger.warn('ENEMY', 'Spawned outside map bounds', { x: -100, y: 500 });
   ```

4. **Performance Monitoring**
   - Use browser dev tools for performance profiling
   - Monitor memory usage and frame rate

   ```javascript
   // Performance monitoring
   create() {
       // Track frame rate over time
       this.fpsHistory = [];
       this.fpsIndex = 0;
       
       this.time.addEvent({
           delay: 1000,
           callback: () => {
               const fps = Math.round(this.game.loop.actualFps);
               this.fpsHistory[this.fpsIndex] = fps;
               this.fpsIndex = (this.fpsIndex + 1) % 60; // Keep last 60 seconds
               
               // Log warning if FPS drops below threshold
               if (fps < 30) {
                   Logger.warn('PERFORMANCE', 'Low FPS detected', fps);
               }
           },
           loop: true
       });
   }
   ```

## Common Gameplay Bugs

### Enemy Behavior Issues

**Symptoms:**
- Enemies getting stuck
- Enemies not targeting player
- Erratic movement patterns

**Possible Causes and Solutions:**

1. **Pathfinding issues**
   - Check for obstacles in navigation paths
   - Verify target position is reachable

   ```javascript
   // Debug enemy pathfinding
   update() {
       this.enemies.getChildren().forEach(enemy => {
           // Check if enemy is stuck
           if (enemy.prevX === enemy.x && enemy.prevY === enemy.y) {
               enemy.stuckFrames = (enemy.stuckFrames || 0) + 1;
               
               // If stuck for too long, teleport to a valid position
               if (enemy.stuckFrames > 60) {
                   Logger.warn('ENEMY', 'Enemy stuck, repositioning', {
                       id: enemy.id,
                       position: { x: enemy.x, y: enemy.y }
                   });
                   
                   // Find valid position
                   const validPosition = this.findValidPosition(enemy);
                   enemy.setPosition(validPosition.x, validPosition.y);
                   enemy.stuckFrames = 0;
               }
           } else {
               enemy.stuckFrames = 0;
               enemy.prevX = enemy.x;
               enemy.prevY = enemy.y;
           }
       });
   }
   ```

2. **State machine issues**
   - Check for invalid state transitions
   - Verify state update logic

   ```javascript
   // Debug enemy state machine
   create() {
       // Log state changes
       this.enemies.getChildren().forEach(enemy => {
           const originalSetState = enemy.setState;
           enemy.setState = function(newState) {
               Logger.log('ENEMY', `State change: ${this.state} -> ${newState}`, {
                   id: this.id,
                   position: { x: this.x, y: this.y }
               });
               return originalSetState.call(this, newState);
           };
       });
   }
   ```

3. **Target selection issues**
   - Verify target priority logic
   - Check target visibility detection

   ```javascript
   // Debug target selection
   updateEnemyTarget(enemy) {
       // Log target changes
       const oldTarget = enemy.target;
       const newTarget = this.findBestTarget(enemy);
       
       if (oldTarget !== newTarget) {
           Logger.log('ENEMY', 'Target changed', {
               id: enemy.id,
               oldTarget: oldTarget ? { id: oldTarget.id } : null,
               newTarget: newTarget ? { id: newTarget.id } : null
           });
       }
       
       enemy.target = newTarget;
   }
   ```

### Player Control Issues

**Symptoms:**
- Unresponsive controls
- Character movement issues
- Weapon firing problems

**Possible Causes and Solutions:**

1. **Input handling issues**
   - Check for conflicting input handlers
   - Verify input state is being updated

   ```javascript
   // Debug player input
   update() {
       // Log input state
       const inputState = {
           up: this.keys.up.isDown,
           down: this.keys.down.isDown,
           left: this.keys.left.isDown,
           right: this.keys.right.isDown,
           fire: this.input.activePointer.isDown
       };
       
       // Only log when state changes
       if (JSON.stringify(inputState) !== JSON.stringify(this.lastInputState)) {
           Logger.log('INPUT', 'Input state changed', inputState);
           this.lastInputState = inputState;
       }
   }
   ```

2. **Physics constraints**
   - Check for physics body constraints
   - Verify collision handling

   ```javascript
   // Debug player physics
   create() {
       // Monitor player velocity
       this.time.addEvent({
           delay: 500,
           callback: () => {
               const vel = this.player.body.velocity;
               if (vel.x === 0 && vel.y === 0 && this.playerShouldBeMoving()) {
                   Logger.warn('PLAYER', 'Player not moving despite input', {
                       position: { x: this.player.x, y: this.player.y },
                       velocity: { x: vel.x, y: vel.y },
                       input: {
                           up: this.keys.up.isDown,
                           down: this.keys.down.isDown,
                           left: this.keys.left.isDown,
                           right: this.keys.right.isDown
                       }
                   });
               }
           },
           loop: true
       });
   }
   ```

3. **Animation transitions**
   - Check for animation conflicts
   - Verify animation transition logic

   ```javascript
   // Debug player animations
   create() {
       // Log animation changes
       this.player.on('animationstart', (animation) => {
           Logger.log('PLAYER', `Animation started: ${animation.key}`, {
               prevAnim: this.player.prevAnim
           });
           this.player.prevAnim = animation.key;
       });
   }
   ```

### Game State Issues

**Symptoms:**
- Game not progressing correctly
- Waves not spawning or completing
- Score or resources not updating

**Possible Causes and Solutions:**

1. **Event handling issues**
   - Check event emission and handling
   - Verify event parameters

   ```javascript
   // Debug event system
   create() {
       // Log all events
       const originalEmit = this.events.emit;
       this.events.emit = function(event, ...args) {
           Logger.log('EVENT', `Event emitted: ${event}`, args);
           return originalEmit.call(this, event, ...args);
       };
   }
   ```

2. **State transition issues**
   - Check game state machine
   - Verify condition checks for state changes

   ```javascript
   // Debug game state
   update() {
       // Monitor wave state
       const waveState = {
           currentWave: this.waveManager.currentWave,
           waveState: this.waveManager.waveState,
           enemiesRemaining: this.waveManager.enemiesRemaining
       };
       
       // Only log when state changes
       if (JSON.stringify(waveState) !== JSON.stringify(this.lastWaveState)) {
           Logger.log('WAVE', 'Wave state changed', waveState);
           this.lastWaveState = waveState;
       }
   }
   ```

3. **Resource calculation issues**
   - Check resource update logic
   - Verify resource limits and constraints

   ```javascript
   // Debug resource changes
   addXP(amount) {
       Logger.log('RESOURCES', `Adding XP: ${amount}`, {
           before: this.currentXP,
           after: this.currentXP + amount
       });
       
       this.currentXP += amount;
       
       // Check for level up
       if (this.currentXP >= this.xpForNextLevel) {
           this.levelUp();
       }
   }
   ```

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
