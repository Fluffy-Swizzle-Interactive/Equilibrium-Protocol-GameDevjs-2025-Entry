// filepath: z:\COLLAB PROJECTS\GameJam1\src\game\debug\DebugPanel.jsx
import { useState, useEffect } from 'react';

export function DebugPanel({ gameRef }) {
    const [debugInfo, setDebugInfo] = useState({
        fps: 0,
        enemyCount: 0,
        bulletCount: 0,
        playerX: 0,
        playerY: 0,
        mouseX: 0,
        mouseY: 0,
        killCount: 0,
        gameMode: '',
        survivalTime: 0,
        droneCount: 0,
        maxDrones: 0
    });
    
    // Style objects
    const styles = {
        panel: {
            width: '220px',
            color: 'white',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '10px',
            border: '1px solid #444'
        },
        panelHeader: {
            fontSize: '18px',
            textAlign: 'center',
            marginBottom: '10px',
            color: '#ffcc00',
            fontWeight: 'bold'
        },
        section: {
            marginTop: '10px',
            padding: '5px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '5px',
        },
        sectionHeader: {
            color: '#ffcc00',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '5px',
        },
        infoItem: {
            display: 'flex',
            justifyContent: 'space-between',
            margin: '3px 0',
        },
        label: {
            color: '#aaaaaa',
        },
        value: {
            color: '#ffffff',
            fontFamily: 'monospace',
        },
        button: {
            backgroundColor: '#2a4d2a',
            color: 'white',
            border: '1px solid #44aa44',
            borderRadius: '4px',
            padding: '5px 10px',
            margin: '5px 0',
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%',
            fontSize: '14px',
            textAlign: 'center'
        }
    };
    
    // Update debug info periodically
    useEffect(() => {
        const updateInterval = setInterval(updateDebugInfo, 100); // Update 10 times per second
        return () => clearInterval(updateInterval);
    }, [gameRef]);
    
    /**
     * Update the debug information from the current game scene
     */
    const updateDebugInfo = () => {
        if (gameRef.current && gameRef.current.scene) {
            const scene = gameRef.current.scene;
            const game = gameRef.current.game;
            
            // Get weapon manager if available
            const weaponManager = scene.player?.weaponManager || null;
            
            // Extract all the debug info from the current scene
            const newInfo = {
                fps: Math.round(game.loop.actualFps),
                enemyCount: scene.enemies ? scene.enemies.getChildren().length : 0,
                bulletCount: scene.bullets ? scene.bullets.getChildren().length : 0,
                playerX: scene.player ? Math.round(scene.player.graphics.x) : 0,
                playerY: scene.player ? Math.round(scene.player.graphics.y) : 0,
                mouseX: scene.mouseX ? Math.round(scene.mouseX) : 0,
                mouseY: scene.mouseY ? Math.round(scene.mouseY) : 0,
                killCount: scene.killCount || 0,
                gameMode: scene.gameMode || 'N/A',
                survivalTime: scene.survivalTime ? Math.floor(scene.survivalTime) : 0,
                droneCount: weaponManager ? weaponManager.drones.length : 0,
                maxDrones: weaponManager ? weaponManager.maxDrones : 0
            };
            
            setDebugInfo(newInfo);
        }
    };
    
    /**
     * Open the shop from debug panel
     */
    const openShop = () => {
        if (gameRef.current?.scene?.shopManager) {
            gameRef.current.scene.shopManager.openShop();
        } else {
            console.warn('ShopManager not found in current scene');
        }
    };
    
    /**
     * Spawn a test drone for the player
     */
    const spawnDrone = () => {
        const scene = gameRef.current?.scene;
        if (!scene || !scene.player || !scene.player.weaponManager) {
            console.warn('Player or WeaponManager not found in current scene');
            return;
        }
        
        const weaponManager = scene.player.weaponManager;
        
        // Temporarily increase max drones if needed
        if (weaponManager.drones.length >= weaponManager.maxDrones) {
            weaponManager.maxDrones++;
        }
        
        // Add a new drone
        const newDrone = weaponManager.addDrone();
        
        if (newDrone) {
            console.log('Debug drone added successfully');
        } else {
            console.warn('Failed to add debug drone');
        }
    };

    /**
     * Execute a debug action with visual feedback on button
     * @param {Function} action - The action to execute
     * @param {Event} e - The click event object
     */
    const executeDebugAction = (action, e) => {
        // Visual feedback on button click
        const button = e.target;
        const originalBg = button.style.backgroundColor;
        
        button.style.backgroundColor = '#3a5d3a';
        
        // Execute the action
        action();
        
        // Restore button appearance after a brief delay
        setTimeout(() => {
            button.style.backgroundColor = originalBg;
        }, 200);
    };
    
    /**
     * Render a section of debug information
     * @param {string} title - The section title
     * @param {React.ReactNode} children - The section content
     */
    const renderSection = (title, children) => (
        <div style={styles.section}>
            <div style={styles.sectionHeader}>{title}</div>
            {children}
        </div>
    );
    
    /**
     * Render a single information item with label and value
     * @param {string} label - The information label
     * @param {string|number} value - The information value
     */
    const renderInfoItem = (label, value) => (
        <div style={styles.infoItem}>
            <span style={styles.label}>{label}:</span>
            <span style={styles.value}>{value}</span>
        </div>
    );
    
    /**
     * Render a debug action button
     * @param {string} label - The button label
     * @param {Function} action - The action to perform when clicked
     */
    const renderActionButton = (label, action) => (
        <button 
            style={styles.button}
            onClick={(e) => executeDebugAction(action, e)}
        >
            {label}
        </button>
    );
    
    // Render the debug panel with different sections
    return (
        <div style={styles.panel}>
            <div style={styles.panelHeader}>
                Debug Info
            </div>
            
            {/* Game Stats Section */}
            {renderSection("Game Stats", <>
                {renderInfoItem("FPS", debugInfo.fps)}
                {renderInfoItem("Game Mode", debugInfo.gameMode)}
                {renderInfoItem("Survival Time", `${debugInfo.survivalTime}s`)}
                {renderInfoItem("Kills", debugInfo.killCount)}
            </>)}
            
            {/* Entity Counts */}
            {renderSection("Entities", <>
                {renderInfoItem("Enemies", debugInfo.enemyCount)}
                {renderInfoItem("Bullets", debugInfo.bulletCount)}
                {renderInfoItem("Drones", `${debugInfo.droneCount}/${debugInfo.maxDrones}`)}
            </>)}
            
            {/* Player Info */}
            {renderSection("Player", <>
                {renderInfoItem("Position", `${debugInfo.playerX}, ${debugInfo.playerY}`)}
            </>)}
            
            {/* Mouse Info */}
            {renderSection("Mouse", <>
                {renderInfoItem("Position", `${debugInfo.mouseX}, ${debugInfo.mouseY}`)}
            </>)}
            
            {/* Debug Actions Section */}
            {renderSection("Debug Actions", <>
                {renderActionButton("Open Shop", openShop)}
                {renderActionButton("Spawn Drone", spawnDrone)}
            </>)}
        </div>
    );
}