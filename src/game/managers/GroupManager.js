import { EventBus } from '../EventBus';
import { GROUP_MODIFIERS, GroupId } from '../constants';

/**
 * GroupManager
 * Manages enemy groups and their stats across the game, applying appropriate
 * modifiers based on group type. Tracks counts of active enemies by group.
 */
export class GroupManager {
    /**
     * Create a new Group Manager
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     */
    constructor(scene) {
        this.scene = scene;
        
        // Initialize group counts
        this.counts = {
            [GroupId.AI]: 0,
            [GroupId.CODER]: 0,
            [GroupId.NEUTRAL]: 0
        };
        
        // Initialize hostility relationships between groups
        this.hostilityMap = {
            [GroupId.AI]: [GroupId.CODER], // AI enemies are hostile to CODER enemies
            [GroupId.CODER]: [GroupId.AI], // CODER enemies are hostile to AI enemies
            [GroupId.NEUTRAL]: []          // NEUTRAL enemies are not hostile to any group
        };
        
        // Track all enemies by group for quick access
        this.enemiesByGroup = {
            [GroupId.AI]: [],
            [GroupId.CODER]: [],
            [GroupId.NEUTRAL]: []
        };
        
        // Register this manager with the scene for easy access
        scene.groupManager = this;
        
        // Listen for game-wide events
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners
     * @private
     */
    setupEventListeners() {
        // Listen for enemy group changes
        EventBus.on('enemy-group-changed', this.onEnemyGroupChanged, this);
    }
    
    /**
     * Register an enemy with a specific group
     * @param {BaseEnemy} enemy - The enemy instance
     * @param {string} groupId - The group ID from GroupId enum
     * @returns {Object} Applied modifiers
     */
    register(enemy, groupId) {
        // Validate group ID
        if (!Object.values(GroupId).includes(groupId)) {
            console.warn(`Invalid group ID: ${groupId}`);
            return null;
        }
        
        // Get WaveManager reference if available
        const waveManager = this.scene.waveManager;
        
        // Check if this enemy was already registered with another group
        const previousGroup = enemy._groupId;
        if (previousGroup && previousGroup !== groupId) {
            // Move enemy from one group to another
            this.deregister(enemy, previousGroup);
        } else if (!previousGroup && waveManager) {
            // If this is a completely new enemy (not previously registered) and
            // if it wasn't created by the WaveManager itself, count it as an external spawn
            if (!enemy._registeredWithWaveManager && typeof waveManager.registerExternalEnemySpawn === 'function') {
                waveManager.registerExternalEnemySpawn(1);
                enemy._registeredWithWaveManager = true;
            }
        }
        
        // Update counts
        this.counts[groupId]++;
        
        // Add enemy to the group's tracking array
        if (!this.enemiesByGroup[groupId].includes(enemy)) {
            this.enemiesByGroup[groupId].push(enemy);
        }
        
        // Store group ID directly on the enemy for easier lookup
        enemy._groupId = groupId;
        
        // Apply group-specific modifiers
        const modifiers = this.applyModifiers(enemy, groupId);
        
        // Return the applied modifiers for reference
        return modifiers;
    }
    
    /**
     * Register an entity with a specific group (alias for register method)
     * @param {BaseEnemy} entity - The entity instance
     * @param {string} groupId - The group ID from GroupId enum
     * @returns {Object} Applied modifiers
     */
    registerEntity(entity, groupId) {
        return this.register(entity, groupId);
    }
    
    /**
     * Deregister an enemy from its group (usually when defeated)
     * @param {BaseEnemy} enemy - The enemy instance
     * @param {string} groupId - The group ID from GroupId enum 
     */
    deregister(enemy, groupId) {
        // Validate group ID
        if (!Object.values(GroupId).includes(groupId)) {
            console.warn(`Invalid group ID: ${groupId}`);
            return;
        }
        
        // Update counts (ensure we don't go below 0)
        this.counts[groupId] = Math.max(0, this.counts[groupId] - 1);
        
        // Remove enemy from the group's tracking array
        const index = this.enemiesByGroup[groupId].indexOf(enemy);
        if (index !== -1) {
            this.enemiesByGroup[groupId].splice(index, 1);
        }
    }
    
    /**
     * Handle enemy group change events
     * @param {Object} data - Event data with enemy and oldGroup/newGroup info
     * @private
     */
    onEnemyGroupChanged(data) {
        const { enemy, oldGroupId, newGroupId } = data;
        
        // Deregister from old group if valid
        if (oldGroupId && Object.values(GroupId).includes(oldGroupId)) {
            this.deregister(enemy, oldGroupId);
        }
        
        // Register with new group if valid
        if (newGroupId && Object.values(GroupId).includes(newGroupId)) {
            this.register(enemy, newGroupId);
        }
    }
    
    /**
     * Get the current count of enemies in a specific group
     * @param {string} groupId - The group ID from GroupId enum
     * @returns {number} Number of active enemies in the group
     */
    getGroupCount(groupId) {
        return this.counts[groupId] || 0;
    }
    
    /**
     * Get all current group counts
     * @returns {Object} Object with counts for all groups
     */
    getAllGroupCounts() {
        return { ...this.counts };
    }
    
    /**
     * Apply group-specific modifiers to an enemy
     * @param {BaseEnemy} enemy - The enemy to apply modifiers to
     * @param {string} groupId - The group ID from GroupId enum
     * @returns {Object} Applied modifiers
     */
    applyModifiers(enemy, groupId) {
        const modifiers = GROUP_MODIFIERS[groupId];
        if (!modifiers) return null;
        
        // Store original values if not already saved
        if (!enemy._originalStats) {
            enemy._originalStats = {
                health: enemy.health,
                baseHealth: enemy.baseHealth,
                speed: enemy.speed,
                damage: enemy.damage,
                color: enemy.color
            };
        }
        
        // Apply modifiers
        if (modifiers.health) {
            enemy.health = Math.round(enemy._originalStats.health * modifiers.health);
            enemy.baseHealth = Math.round(enemy._originalStats.baseHealth * modifiers.health);
        }
        
        if (modifiers.speed) {
            enemy.speed = enemy._originalStats.speed * modifiers.speed;
        }
        
        if (modifiers.damage) {
            enemy.damage = enemy._originalStats.damage * modifiers.damage;
        }
        
        if (modifiers.color) {
            enemy.color = modifiers.color;
            
            // Update visual representation if it exists
            if (enemy.graphics && enemy.graphics.setFillStyle) {
                enemy.graphics.setFillStyle(modifiers.color);
            }
        }
        
        return modifiers;
    }
    
    /**
     * Determine which group should spawn next based on current counts
     * Implements the 1:1 ratio requirement from the PRD
     * @returns {string} The group ID that should spawn next
     */
    getNextSpawnGroup() {
        // If no enemies exist yet, randomly choose between AI and CODER
        const totalEnemies = this.getTotalCount();
        if (totalEnemies === 0) {
            return Math.random() < 0.5 ? GroupId.AI : GroupId.CODER;
        }
        
        // Get current counts
        const aiCount = this.counts[GroupId.AI];
        const coderCount = this.counts[GroupId.CODER];
        
        // Maintain approximately 1:1 ratio between AI and CODER
        if (aiCount < coderCount) {
            return GroupId.AI;
        } else if (coderCount < aiCount) {
            return GroupId.CODER;
        } else {
            // If equal, randomly select
            return Math.random() < 0.5 ? GroupId.AI : GroupId.CODER;
        }
    }
    
    /**
     * Check if one group is hostile toward another
     * @param {string} sourceGroupId - The group checking for hostility
     * @param {string} targetGroupId - The potential target group
     * @returns {boolean} True if source group is hostile toward target group
     */
    isHostileTo(sourceGroupId, targetGroupId) {
        // Validate group IDs
        if (!Object.values(GroupId).includes(sourceGroupId) || 
            !Object.values(GroupId).includes(targetGroupId)) {
            return false;
        }
        
        // Check if target group is in source's hostility list
        return this.hostilityMap[sourceGroupId].includes(targetGroupId);
    }
    
    /**
     * Set hostility relationship between groups
     * @param {string} sourceGroupId - The group initiating hostility
     * @param {string} targetGroupId - The target of hostility
     * @param {boolean} isHostile - Whether source should be hostile to target
     */
    setHostility(sourceGroupId, targetGroupId, isHostile = true) {
        // Validate group IDs
        if (!Object.values(GroupId).includes(sourceGroupId) || 
            !Object.values(GroupId).includes(targetGroupId)) {
            console.warn(`Invalid group ID in setHostility: ${sourceGroupId} or ${targetGroupId}`);
            return;
        }
        
        // Update hostility relationship
        const hostileGroups = this.hostilityMap[sourceGroupId];
        const targetIndex = hostileGroups.indexOf(targetGroupId);
        
        if (isHostile && targetIndex === -1) {
            // Add target to hostile list
            hostileGroups.push(targetGroupId);
        } else if (!isHostile && targetIndex !== -1) {
            // Remove target from hostile list
            hostileGroups.splice(targetIndex, 1);
        }
        
        // Emit event for game systems to react
        EventBus.emit('group-hostility-changed', {
            sourceGroupId,
            targetGroupId,
            isHostile
        });
    }
    
    /**
     * Find nearest hostile enemy for a given entity
     * Useful for enemy targeting other enemy groups in hostile-vs-hostile combat
     * @param {BaseEnemy} sourceEnemy - The source enemy looking for targets
     * @param {number} maxDistance - Maximum search distance (optional)
     * @returns {BaseEnemy|null} Nearest hostile enemy or null if none found
     */
    findNearestHostileEnemy(sourceEnemy, maxDistance = Infinity) {
        // Validate source enemy
        if (!sourceEnemy || !sourceEnemy.groupId) {
            return null;
        }
        
        const sourceGroupId = sourceEnemy.groupId;
        let nearestEnemy = null;
        let minDistance = maxDistance;
        
        // Check each group that the source is hostile to
        for (const targetGroupId of this.hostilityMap[sourceGroupId]) {
            // Skip empty groups
            if (this.enemiesByGroup[targetGroupId].length === 0) continue;
            
            // Check each enemy in this hostile group
            for (const targetEnemy of this.enemiesByGroup[targetGroupId]) {
                // Skip inactive enemies
                if (!targetEnemy || !targetEnemy.active || !targetEnemy.graphics) continue;
                
                // Calculate distance
                const distance = Phaser.Math.Distance.Between(
                    sourceEnemy.graphics.x, sourceEnemy.graphics.y,
                    targetEnemy.graphics.x, targetEnemy.graphics.y
                );
                
                // Update nearest enemy if this one is closer
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestEnemy = targetEnemy;
                }
            }
        }
        
        return nearestEnemy;
    }
    
    /**
     * Get all enemies hostile to a specific group within a range
     * @param {string} groupId - Group ID to find enemies hostile to
     * @param {number} x - Center X position for search
     * @param {number} y - Center Y position for search
     * @param {number} range - Search radius
     * @returns {Array} Array of hostile enemies within range
     */
    getHostileEnemiesInRange(groupId, x, y, range) {
        const results = [];
        
        // Find all groups that are hostile to the specified group
        const hostileGroups = Object.keys(this.hostilityMap).filter(sourceGroup =>
            this.hostilityMap[sourceGroup].includes(groupId)
        );
        
        // Check enemies in each hostile group
        for (const hostileGroup of hostileGroups) {
            for (const enemy of this.enemiesByGroup[hostileGroup]) {
                // Skip inactive enemies
                if (!enemy || !enemy.active || !enemy.graphics) continue;
                
                // Calculate distance
                const distance = Phaser.Math.Distance.Between(
                    x, y, enemy.graphics.x, enemy.graphics.y
                );
                
                // Add to results if within range
                if (distance <= range) {
                    results.push(enemy);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Get total count of all enemies across groups
     * @returns {number} Total enemy count
     */
    getTotalCount() {
        return Object.values(this.counts).reduce((sum, count) => sum + count, 0);
    }
    
    /**
     * Get all entities in a specific group
     * @param {string} groupId - The group ID from GroupId enum
     * @returns {Array} Array of entities in the specified group
     */
    getEntitiesInGroup(groupId) {
        if (!Object.values(GroupId).includes(groupId)) {
            console.warn(`Invalid group ID in getEntitiesInGroup: ${groupId}`);
            return [];
        }
        
        return [...this.enemiesByGroup[groupId]];
    }
    
    /**
     * Reset all group counts to zero
     */
    reset() {
        Object.keys(this.counts).forEach(groupId => {
            this.counts[groupId] = 0;
            this.enemiesByGroup[groupId] = [];
        });
    }
    
    /**
     * Debug method to log current group counts
     */
    debugCounts() {
        console.debug('Group Counts:', {
            ai: this.counts[GroupId.AI],
            coder: this.counts[GroupId.CODER],
            neutral: this.counts[GroupId.NEUTRAL],
            total: this.getTotalCount()
        });
    }
}