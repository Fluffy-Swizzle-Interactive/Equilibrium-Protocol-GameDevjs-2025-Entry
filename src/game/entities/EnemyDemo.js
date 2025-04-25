import { EnemyRegistry } from './EnemyRegistry';
import { GROUP_IDS } from '../constants';

/**
 * EnemyDemo - Demonstration of how to use the sprite-based enemy system
 * Shows how to create different enemy types and set their factions
 */
export class EnemyDemo {
    /**
     * Create a new EnemyDemo
     * @param {Phaser.Scene} scene - The scene to add enemies to
     */
    constructor(scene) {
        this.scene = scene;
        
        // Create enemy registry
        this.enemyRegistry = new EnemyRegistry(this.scene);
    }
    
    /**
     * Demonstrate different enemy types
     * @param {number} x - Base X position for enemies
     * @param {number} y - Base Y position for enemies
     */
    demonstrateEnemyTypes(x, y) {
        // Create a basic enemy (SpriteEnemy1)
        const enemy1 = this.enemyRegistry.createEnemy('enemy1', x - 150, y);
        enemy1.setGroupId(GROUP_IDS.HOSTILE);
        
        // Create a tank enemy (SpriteEnemy2)
        const enemy2 = this.enemyRegistry.createEnemy('enemy2', x, y);
        enemy2.setGroupId(GROUP_IDS.FACTION_A);
        
        // Create a ranged enemy (SpriteEnemy3)
        const enemy3 = this.enemyRegistry.createEnemy('enemy3', x + 150, y);
        enemy3.setGroupId(GROUP_IDS.FACTION_B);
        
        return [enemy1, enemy2, enemy3];
    }
    
    /**
     * Demonstrate different enemy factions with the same enemy type
     * @param {number} x - Base X position for enemies
     * @param {number} y - Base Y position for enemies
     */
    demonstrateEnemyFactions(x, y) {
        const enemies = [];
        const factions = [
            GROUP_IDS.FRIENDLY,
            GROUP_IDS.HOSTILE,
            GROUP_IDS.NEUTRAL,
            GROUP_IDS.FACTION_A,
            GROUP_IDS.FACTION_B,
            GROUP_IDS.FACTION_C
        ];
        
        // Create the same enemy type with different factions
        factions.forEach((faction, index) => {
            const enemy = this.enemyRegistry.createEnemy('enemy1', x + (index - 2.5) * 80, y);
            enemy.setGroupId(faction);
            enemies.push(enemy);
        });
        
        return enemies;
    }
    
    /**
     * Create a boss enemy
     * @param {number} x - X position for boss
     * @param {number} y - Y position for boss
     */
    createBoss(x, y) {
        const boss = this.enemyRegistry.createBoss('boss1', x, y);
        boss.setGroupId(GROUP_IDS.HOSTILE);
        return boss;
    }
    
    /**
     * Create enemies with random types
     * @param {number} count - Number of enemies to create
     * @param {Object} bounds - Bounds for enemy positions {x1, y1, x2, y2}
     * @param {Object} weights - Optional weight configuration for enemy types
     */
    createRandomEnemies(count, bounds, weights = null) {
        const enemies = [];
        
        for (let i = 0; i < count; i++) {
            // Random position within bounds
            const x = Phaser.Math.Between(bounds.x1, bounds.x2);
            const y = Phaser.Math.Between(bounds.y1, bounds.y2);
            
            // Get random enemy type based on weights
            const enemyType = this.enemyRegistry.getRandomEnemyType(weights);
            
            // Create enemy
            const enemy = this.enemyRegistry.createEnemy(enemyType, x, y);
            
            // Set random faction (excluding friendly)
            const factions = [
                GROUP_IDS.HOSTILE,
                GROUP_IDS.FACTION_A,
                GROUP_IDS.FACTION_B,
                GROUP_IDS.FACTION_C
            ];
            const randomFaction = factions[Phaser.Math.Between(0, factions.length - 1)];
            enemy.setGroupId(randomFaction);
            
            enemies.push(enemy);
        }
        
        return enemies;
    }
    
    /**
     * Set up a simple faction battle between two groups
     * @param {number} count - Number of enemies per faction
     * @param {Object} factionAPos - Position for faction A {x, y}
     * @param {Object} factionBPos - Position for faction B {x, y}
     */
    setupFactionBattle(count, factionAPos, factionBPos) {
        const enemies = [];
        
        // Create faction A enemies
        for (let i = 0; i < count; i++) {
            // Random offset
            const offsetX = Phaser.Math.Between(-100, 100);
            const offsetY = Phaser.Math.Between(-50, 50);
            
            // Random enemy type with higher weight for enemy2 (tank)
            const enemyType = this.enemyRegistry.getRandomEnemyType({
                enemy1: 0.4,
                enemy2: 0.4,
                enemy3: 0.2
            });
            
            // Create enemy
            const enemy = this.enemyRegistry.createEnemy(
                enemyType, 
                factionAPos.x + offsetX, 
                factionAPos.y + offsetY
            );
            
            // Set to faction A
            enemy.setGroupId(GROUP_IDS.FACTION_A);
            enemies.push(enemy);
        }
        
        // Create faction B enemies
        for (let i = 0; i < count; i++) {
            // Random offset
            const offsetX = Phaser.Math.Between(-100, 100);
            const offsetY = Phaser.Math.Between(-50, 50);
            
            // Random enemy type with higher weight for enemy3 (ranged)
            const enemyType = this.enemyRegistry.getRandomEnemyType({
                enemy1: 0.3,
                enemy2: 0.3,
                enemy3: 0.4
            });
            
            // Create enemy
            const enemy = this.enemyRegistry.createEnemy(
                enemyType, 
                factionBPos.x + offsetX, 
                factionBPos.y + offsetY
            );
            
            // Set to faction B
            enemy.setGroupId(GROUP_IDS.FACTION_B);
            enemies.push(enemy);
        }
        
        return enemies;
    }
}