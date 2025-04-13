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
        survivalTime: 0
    });
    
    // Style objects for consistent appearance
    const sectionStyle = {
        marginTop: '10px',
        padding: '5px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '5px',
    };
    
    const headerStyle = {
        color: '#ffcc00',
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '5px',
    };
    
    const infoItemStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        margin: '3px 0',
    };
    
    const labelStyle = {
        color: '#aaaaaa',
    };
    
    const valueStyle = {
        color: '#ffffff',
        fontFamily: 'monospace',
    };
    
    // Update debug info periodically
    useEffect(() => {
        const updateInterval = setInterval(() => {
            if (gameRef.current && gameRef.current.scene) {
                const scene = gameRef.current.scene;
                const game = gameRef.current.game;
                
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
                    survivalTime: scene.survivalTime ? Math.floor(scene.survivalTime) : 0
                };
                
                setDebugInfo(newInfo);
            }
        }, 100); // Update 10 times per second
        
        return () => clearInterval(updateInterval);
    }, [gameRef]);
    
    // Render the debug panel with different sections
    return (
        <div style={{ 
            width: '220px', 
            color: 'white', 
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', 
            borderRadius: '10px',
            border: '1px solid #444'
        }}>
            <div style={{ ...headerStyle, fontSize: '18px', textAlign: 'center', marginBottom: '10px' }}>
                Debug Info
            </div>
            
            {/* Game Stats Section */}
            <div style={sectionStyle}>
                <div style={headerStyle}>Game Stats</div>
                
                <div style={infoItemStyle}>
                    <span style={labelStyle}>FPS:</span>
                    <span style={valueStyle}>{debugInfo.fps}</span>
                </div>
                
                <div style={infoItemStyle}>
                    <span style={labelStyle}>Game Mode:</span>
                    <span style={valueStyle}>{debugInfo.gameMode}</span>
                </div>
                
                <div style={infoItemStyle}>
                    <span style={labelStyle}>Survival Time:</span>
                    <span style={valueStyle}>{debugInfo.survivalTime}s</span>
                </div>
                
                <div style={infoItemStyle}>
                    <span style={labelStyle}>Kills:</span>
                    <span style={valueStyle}>{debugInfo.killCount}</span>
                </div>
            </div>
            
            {/* Entity Counts */}
            <div style={sectionStyle}>
                <div style={headerStyle}>Entities</div>
                
                <div style={infoItemStyle}>
                    <span style={labelStyle}>Enemies:</span>
                    <span style={valueStyle}>{debugInfo.enemyCount}</span>
                </div>
                
                <div style={infoItemStyle}>
                    <span style={labelStyle}>Bullets:</span>
                    <span style={valueStyle}>{debugInfo.bulletCount}</span>
                </div>
            </div>
            
            {/* Player Info */}
            <div style={sectionStyle}>
                <div style={headerStyle}>Player</div>
                
                <div style={infoItemStyle}>
                    <span style={labelStyle}>Position:</span>
                    <span style={valueStyle}>
                        {debugInfo.playerX}, {debugInfo.playerY}
                    </span>
                </div>
            </div>
            
            {/* Mouse Info */}
            <div style={sectionStyle}>
                <div style={headerStyle}>Mouse</div>
                
                <div style={infoItemStyle}>
                    <span style={labelStyle}>Position:</span>
                    <span style={valueStyle}>
                        {debugInfo.mouseX}, {debugInfo.mouseY}
                    </span>
                </div>
            </div>
        </div>
    );
}