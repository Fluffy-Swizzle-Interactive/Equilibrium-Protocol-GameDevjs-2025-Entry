# Development Guidelines

## Overview

This document outlines the development guidelines, coding standards, and best practices for the Fluffy-Swizz Interactive game project. Following these guidelines ensures consistent, maintainable, and high-quality code.

## Code Structure

### Project Organization

The project follows a modular architecture with clear separation of concerns:

```
src/
├── App.jsx                # Main React entry point
├── main.jsx               # React initialization
└── game/                  # Game logic
    ├── EventBus.js        # Events communication system
    ├── main.js            # Phaser game initialization
    ├── PhaserGame.jsx     # React-Phaser integration
    ├── debug/             # Debug tools
    ├── entities/          # Game objects
    ├── managers/          # Game system managers
    ├── mapping/           # Tile map handling
    └── scenes/            # Game screens
```

### File Naming Conventions

- **React Components**: PascalCase with `.jsx` extension (e.g., `PhaserGame.jsx`)
- **JavaScript Classes**: PascalCase with `.js` extension (e.g., `Player.js`)
- **Utility Functions**: camelCase with `.js` extension (e.g., `mathUtils.js`)
- **Asset Files**: lowercase with hyphens (e.g., `player-sprite.png`)

## Coding Standards

### General Guidelines

1. **Readability**: Write clear, self-documenting code
2. **Simplicity**: Keep functions and classes focused on a single responsibility
3. **Consistency**: Follow established patterns throughout the codebase
4. **Performance**: Consider performance implications, especially for game logic

### JavaScript/ES6 Standards

1. **Use ES6 Features**:
   - Arrow functions for callbacks
   - Template literals for string interpolation
   - Destructuring for cleaner parameter handling
   - Classes for object-oriented code
   - Modules for code organization

2. **Variable Declarations**:
   - Use `const` for values that won't be reassigned
   - Use `let` for variables that will be reassigned
   - Avoid `var` entirely

3. **Naming Conventions**:
   - Classes: PascalCase (e.g., `Player`, `EnemyFactory`)
   - Variables/Functions: camelCase (e.g., `playerHealth`, `calculateDamage()`)
   - Constants: UPPER_SNAKE_CASE (e.g., `MAX_ENEMIES`, `DEFAULT_HEALTH`)
   - Private properties/methods: Prefix with underscore (e.g., `_privateMethod()`)

### React Guidelines

1. **Component Structure**:
   - Use functional components with hooks when possible
   - Use class components for complex state management or lifecycle needs
   - Keep components focused on a single responsibility

2. **Props and State**:
   - Validate props using PropTypes
   - Use destructuring for props and state
   - Minimize state, lift state up when needed
   - Use React Context for global state when appropriate

3. **Hooks Usage**:
   - Follow the Rules of Hooks
   - Use custom hooks to share stateful logic
   - Prefer `useReducer` for complex state logic

### Phaser Guidelines

1. **Scene Management**:
   - Each scene should be in its own file
   - Use the standard Phaser scene methods (`init`, `preload`, `create`, `update`)
   - Clean up resources in scene shutdown/destroy

2. **Asset Management**:
   - Preload all assets in the Preloader scene
   - Use texture atlases for sprites when possible
   - Properly destroy assets when no longer needed

3. **Physics and Collisions**:
   - Use appropriate physics systems (Arcade for most cases)
   - Set up collision groups for better organization
   - Use callbacks for collision handling

4. **Performance Optimization**:
   - Use object pooling for frequently created/destroyed objects
   - Implement culling for off-screen objects
   - Minimize update method complexity

## Documentation Standards

### Code Documentation

1. **Class Documentation**:
   ```javascript
   /**
    * Player - The main player character controlled by the user
    * Handles movement, weapons, health, and player state
    */
   class Player extends Phaser.Physics.Arcade.Sprite {
       // Class implementation...
   }
   ```

2. **Method Documentation**:
   ```javascript
   /**
    * Fires the current weapon
    * @param {number} angle - Firing angle in radians
    * @param {boolean} isAltFire - Whether to use alternate fire mode
    * @returns {Bullet|null} The created bullet or null if firing failed
    */
   fire(angle, isAltFire = false) {
       // Method implementation...
   }
   ```

3. **Property Documentation**:
   ```javascript
   /**
    * @property {number} health - Current health points
    * @property {number} maxHealth - Maximum health points
    * @property {string} weaponType - Current weapon type ('minigun' or 'shotgun')
    */
   ```

### Project Documentation

1. **README Files**:
   - Each major component should have a README.md
   - Include purpose, usage examples, and dependencies

2. **Architecture Documentation**:
   - Document system interactions and dependencies
   - Include diagrams for complex systems

3. **API Documentation**:
   - Document public APIs and events
   - Include parameter types and return values

## Git Workflow

### Branching Strategy

We follow a simplified Git Flow model:

1. **`main`**: Production-ready code
2. **`dev`**: Integration branch for development
3. **Feature branches**: For new features (`feature/feature-name`)
4. **Bug fix branches**: For bug fixes (`bugfix/issue-description`)

### Commit Guidelines

1. **Commit Messages**:
   - Use present tense ("Add feature" not "Added feature")
   - First line is a summary (max 50 characters)
   - Optionally followed by a blank line and detailed description

2. **Commit Frequency**:
   - Commit logical chunks of work
   - Avoid large, monolithic commits
   - Ensure each commit leaves the codebase in a working state

### Pull Request Process

1. Create a pull request from your feature branch to `dev`
2. Ensure all tests pass
3. Request code review from at least one team member
4. Address review comments
5. Merge only when approved

## Testing Guidelines

### Unit Testing

1. **Test Framework**:
   - Use Jest for unit testing
   - Use React Testing Library for React components

2. **Test Coverage**:
   - Aim for at least 70% code coverage
   - Focus on critical game systems

3. **Test Organization**:
   - Place tests in a `__tests__` directory next to the code being tested
   - Name test files with `.test.js` suffix

### Game Testing

1. **Playtest Regularly**:
   - Test gameplay after each significant change
   - Focus on player experience and fun factor

2. **Performance Testing**:
   - Test with various enemy counts
   - Monitor frame rate and memory usage
   - Test on target platforms

3. **Debug Tools**:
   - Use the built-in debug panel
   - Add temporary visual indicators for hitboxes, paths, etc.
   - Use console.log with descriptive tags

## Performance Optimization

### General Principles

1. **Measure First**:
   - Identify actual bottlenecks before optimizing
   - Use browser profiling tools

2. **Common Optimizations**:
   - Object pooling for bullets, effects, etc.
   - Efficient collision detection
   - Texture atlas usage
   - Culling off-screen objects

3. **Memory Management**:
   - Properly destroy objects when no longer needed
   - Watch for memory leaks, especially with event listeners

### Specific Techniques

1. **Object Pooling**:
   ```javascript
   // Example of object pooling
   class BulletPool {
       constructor(scene) {
           this.scene = scene;
           this.group = scene.physics.add.group({
               classType: Bullet,
               maxSize: 100,
               runChildUpdate: true
           });
       }
       
       getBullet() {
           return this.group.get();
       }
       
       releaseBullet(bullet) {
           bullet.setActive(false);
           bullet.setVisible(false);
       }
   }
   ```

2. **Event Optimization**:
   ```javascript
   // Bad: Creating new function reference on each update
   update() {
       this.physics.add.overlap(
           this.player, 
           this.enemies, 
           (player, enemy) => this.handleCollision(player, enemy)
       );
   }
   
   // Good: Reusing the same function reference
   create() {
       this.collisionHandler = this.handleCollision.bind(this);
   }
   
   update() {
       this.physics.add.overlap(
           this.player, 
           this.enemies, 
           this.collisionHandler
       );
   }
   ```

## Asset Guidelines

### Graphics

1. **Sprite Sheets**:
   - Use texture atlases for related sprites
   - Keep individual sprite dimensions consistent
   - Use power-of-two textures when possible

2. **Resolution and Scaling**:
   - Design for target resolution (1024x768)
   - Consider scaling for different devices
   - Use vector graphics when appropriate

3. **File Formats**:
   - PNG for sprites with transparency
   - JPEG for background images
   - SVG for UI elements when possible

### Audio

1. **Sound Effects**:
   - Keep sound effects short and impactful
   - Use MP3 and OGG formats for cross-browser support
   - Normalize volume levels

2. **Music**:
   - Loop seamlessly
   - Consider dynamic music system
   - Provide options for different music tracks

3. **File Organization**:
   - Organize by type (sfx, music)
   - Use consistent naming conventions

## Debugging and Troubleshooting

### Debug Tools

1. **Debug Panel**:
   - Use the built-in debug panel for real-time metrics
   - Add custom metrics as needed

2. **Visual Debugging**:
   - Use `this.add.graphics()` for temporary visual indicators
   - Show hitboxes, paths, and other invisible elements
   - Press `U` key in development mode to toggle hitbox visualization for enemies and bullets
   - Hitboxes will be displayed as red circles for enemies and green circles for bullets
   - **Stuck enemy detection**: Enemies stuck in walls will be highlighted in magenta
   - Use the debug panel to monitor enemy counts and detect discrepancies

3. **Console Logging**:
   ```javascript
   // Use descriptive tags for filtering
   console.log('[PLAYER]', 'Health changed:', this.health);
   console.log('[ENEMY]', 'Spawned enemy at:', x, y);
   ```

### Common Issues

1. **Physics Problems**:
   - Check collision groups and masks
   - Verify object is enabled for physics
   - Check body size and offset

2. **Rendering Issues**:
   - Check z-index/depth values
   - Verify assets are properly loaded
   - Check for WebGL compatibility

3. **Performance Issues**:
   - Look for objects not being properly destroyed
   - Check for excessive object creation in update loops
   - Monitor event listener creation and removal

## Deployment Process

### Build Process

1. **Development Build**:
   ```bash
   npm run dev
   ```

2. **Production Build**:
   ```bash
   npm run build
   ```

3. **Build Artifacts**:
   - Minified JavaScript
   - Optimized assets
   - HTML entry point

### Deployment Targets

1. **Web Deployment**:
   - Deploy to itch.io using Butler
   - Test in multiple browsers

2. **Desktop Deployment**:
   - Package with Electron
   - Test on target platforms

3. **CI/CD Pipeline**:
   - Automated builds on GitHub Actions
   - Automated deployment to itch.io

## Accessibility Guidelines

1. **Controls**:
   - Allow key rebinding
   - Support alternative input methods
   - Provide clear control instructions

2. **Visual Accessibility**:
   - Ensure sufficient color contrast
   - Avoid relying solely on color for information
   - Include options for larger UI elements

3. **Audio Accessibility**:
   - Provide separate volume controls for music and sound effects
   - Include options for visual cues for important audio events

## Conclusion

Following these guidelines will help maintain code quality, consistency, and performance throughout the development of Fluffy-Swizz Interactive. These guidelines should evolve as the project grows and new best practices emerge.

---

*This documentation is maintained by the Fluffy-Swizz Interactive development team.*
