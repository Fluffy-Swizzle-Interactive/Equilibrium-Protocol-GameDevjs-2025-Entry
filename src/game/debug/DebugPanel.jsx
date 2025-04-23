// filepath: z:\COLLAB PROJECTS\GameJam1\src\game\debug\DebugPanel.jsx
import { useState, useEffect } from 'react';
import { GroupId } from '../constants';

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
        maxDrones: 0,
        currentWave: 0,
        maxWaves: 0,
        activeEnemies: 0,
        enemiesToSpawn: 0,
        enemiesSpawned: 0,
        waveActive: false,
        inPausePhase: false,
        hasBoss: false,
        xpLevel: 0,
        currentXP: 0,
        xpToNext: 0,
        cash: 0,
        cashMultiplier: 1.0,
        chaosValue: 0,
        aiFaction: 0,
        coderFaction: 0,
        neutralFaction: 0,
        collectibles: 0,
        weaponDamage: 0,
        weaponFireRate: 0,
        critChance: 0,
        critMultiplier: 0,
        playerHealth: 0,
        playerMaxHealth: 0,
        playerSpeed: 0,
        playerDefense: 0,
        poolStats: {},
        gridCellSize: 0,
        spatialGridSize: 0,
    });

    const styles = {
        panel: {
            width: '280px',
            maxHeight: '80vh',
            color: 'white',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '10px',
            border: '1px solid #444',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#444 #222'
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
            display: 'flex',
            justifyContent: 'space-between',
        },
        sectionToggle: {
            color: '#aaaaaa',
            cursor: 'pointer',
            fontSize: '14px',
            userSelect: 'none',
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
        },
        progressBar: {
            height: '8px',
            width: '100%',
            backgroundColor: '#333333',
            borderRadius: '4px',
            marginTop: '3px',
            position: 'relative',
            overflow: 'hidden'
        },
        progressFill: {
            height: '100%',
            backgroundColor: '#44aa44',
            borderRadius: '4px'
        }
    };

    const [collapsedSections, setCollapsedSections] = useState({});

    const toggleSection = (section) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    useEffect(() => {
        const updateInterval = setInterval(updateDebugInfo, 100);
        return () => clearInterval(updateInterval);
    }, [gameRef]);

    const updateDebugInfo = () => {
        if (gameRef.current && gameRef.current.scene) {
            const scene = gameRef.current.scene;
            const game = gameRef.current.game;

            try {
                const weaponManager = scene.player?.weaponManager || null;
                const xpManager = scene.xpManager || null;
                const cashManager = scene.cashManager || null;
                const waveManager = scene.waveManager || null;
                const chaosManager = scene.chaosManager || null;
                const groupManager = scene.groupManager || null;
                const collectibleManager = scene.collectibleManager || null;
                const objectManager = scene.gameObjectManager || null;
                const playerHealth = scene.playerHealth || scene.player?.playerHealth || null;

                const newInfo = {
                    fps: Math.round(game.loop.actualFps),
                    enemyCount: scene.enemies ? scene.enemies.getChildren().length : 0,
                    bulletCount: scene.bullets ? scene.bullets.getChildren().length : 0,
                    playerX: scene.player ? Math.round(scene.player.graphics?.x || scene.player.x || 0) : 0,
                    playerY: scene.player ? Math.round(scene.player.graphics?.y || scene.player.y || 0) : 0,
                    mouseX: scene.mouseX ? Math.round(scene.mouseX) : 0,
                    mouseY: scene.mouseY ? Math.round(scene.mouseY) : 0,
                    killCount: scene.killCount || 0,
                    gameMode: scene.gameMode || 'N/A',
                    survivalTime: scene.survivalTime ? Math.floor(scene.survivalTime) : 0,
                    droneCount: weaponManager ? weaponManager.drones?.length || 0 : 0,
                    maxDrones: weaponManager ? weaponManager.maxDrones || 0 : 0,
                    currentWave: waveManager ? waveManager.currentWave : 0,
                    maxWaves: waveManager ? waveManager.maxWaves : 0,
                    activeEnemies: waveManager ? waveManager.activeEnemies : 0,
                    enemiesToSpawn: waveManager ? waveManager.enemiesToSpawn : 0,
                    enemiesSpawned: waveManager ? waveManager.enemiesSpawned : 0,
                    waveActive: waveManager ? waveManager.isWaveActive : false,
                    inPausePhase: waveManager ? (typeof waveManager.isInPausePhase === 'function' ? waveManager.isInPausePhase() : waveManager.inPausePhase) : false,
                    hasBoss: waveManager ? waveManager.hasBoss : false,
                    xpLevel: xpManager ? (xpManager.getCurrentLevel?.() || xpManager.currentLevel) : 0,
                    currentXP: xpManager ? Math.floor(xpManager.getCurrentXP?.() || xpManager.currentXP) : 0,
                    xpToNext: xpManager ? Math.floor(xpManager.getXPToNextLevel?.() || xpManager.nextLevelXP || xpManager.xpToNextLevel) : 100,
                    cash: cashManager ? cashManager.cash || cashManager.currentCash : 0,
                    cashMultiplier: cashManager ? parseFloat(cashManager.cashMultiplier?.toFixed(2) || 1.0) : 1.0,
                    chaosValue: chaosManager ? (typeof chaosManager.getChaos === 'function' ? Math.round(chaosManager.getChaos()) : chaosManager.chaosValue || 0) : 0,
                    aiFaction: groupManager ? (groupManager.getAllGroupCounts()?.[GroupId.AI] || 0) : 0,
                    coderFaction: groupManager ? (groupManager.getAllGroupCounts()?.[GroupId.CODER] || 0) : 0,
                    neutralFaction: groupManager ? (groupManager.getAllGroupCounts()?.[GroupId.NEUTRAL] || 0) : 0,
                    collectibles: collectibleManager ? (typeof collectibleManager.getActiveCount === 'function' ? collectibleManager.getActiveCount() : Object.values(collectibleManager.pools || {}).reduce((acc, pool) => acc + (pool?.getActiveCount() || 0), 0)) : 0,
                    poolStats: objectManager ? objectManager.getStats() || {} : {},
                    gridCellSize: scene.gridCellSize || 0,
                    spatialGridSize: scene.spatialGrid ? Object.keys(scene.spatialGrid).length : 0,
                    weaponDamage: scene.player ? Math.round(scene.player.bulletDamage || 0) : 0,
                    weaponFireRate: scene.player ? Math.round(scene.player.fireRate || 0) : 0,
                    critChance: scene.player ? Math.round(scene.player.criticalHitChance || 0) : 0,
                    critMultiplier: scene.player ? parseFloat(scene.player.criticalDamageMultiplier?.toFixed(1) || 1.0) : 1.0,
                    playerHealth: playerHealth ? Math.round(playerHealth.currentHealth) : (scene.player ? Math.round(scene.player.health || 0) : 0),
                    playerMaxHealth: playerHealth ? Math.round(playerHealth.maxHealth) : (scene.player ? Math.round(scene.player.maxHealth || 100) : 100),
                    playerSpeed: scene.player ? Math.round(scene.player.speed || 0) : 0,
                    playerDefense: scene.player ? Math.round(scene.player.defense || 0) : 0,
                };

                setDebugInfo(newInfo);
            } catch (error) {
                console.error("Error updating debug info:", error);
            }
        }
    };

    const openShop = () => {
        if (gameRef.current?.scene?.shopManager) {
            gameRef.current.scene.shopManager.openShop();
        } else {
            console.warn('ShopManager not found in current scene');
        }
    };

    const spawnDrone = () => {
        const scene = gameRef.current?.scene;
        if (!scene || !scene.player || !scene.player.weaponManager) {
            console.warn('Player or WeaponManager not found in current scene');
            return;
        }

        const weaponManager = scene.player.weaponManager;

        if (weaponManager.drones.length >= weaponManager.maxDrones) {
            weaponManager.maxDrones++;
        }

        const newDrone = weaponManager.addDrone();

        if (newDrone) {
            console.log('Debug drone added successfully');
        } else {
            console.warn('Failed to add debug drone');
        }
    };

    const startNextWave = () => {
        const waveManager = gameRef.current?.scene?.waveManager;
        if (waveManager && (waveManager.isInPausePhase?.() || waveManager.inPausePhase)) {
            waveManager.startNextWave();
        } else {
            console.warn('Cannot start next wave - Wave Manager not found or not in pause phase');
        }
    };

    const addXP = () => {
        const xpManager = gameRef.current?.scene?.xpManager;
        if (xpManager) {
            xpManager.addXP(50);
        } else {
            console.warn('XP Manager not found in current scene');
        }
    };

    const addCash = () => {
        const cashManager = gameRef.current?.scene?.cashManager;
        if (cashManager) {
            const method = cashManager.addCash || cashManager.addMoney;
            if (typeof method === 'function') {
                method.call(cashManager, 100);
            }
        } else {
            console.warn('Cash Manager not found in current scene');
        }
    };

    const switchChaos = () => {
        const chaosManager = gameRef.current?.scene?.chaosManager;
        if (chaosManager) {
            const currentValue = chaosManager.getChaos?.() || chaosManager.chaosValue || 0;
            const newValue = currentValue > 0 ? -50 : 50;

            if (typeof chaosManager.setChaos === 'function') {
                chaosManager.setChaos(newValue);
            } else if (typeof chaosManager.updateChaos === 'function') {
                chaosManager.updateChaos(newValue - currentValue);
            }
        } else {
            console.warn('Chaos Manager not found in current scene');
        }
    };

    const executeDebugAction = (action, e) => {
        const button = e.target;
        const originalBg = button.style.backgroundColor;

        button.style.backgroundColor = '#3a5d3a';

        action();

        setTimeout(() => {
            button.style.backgroundColor = originalBg;
        }, 200);
    };

    const formatPoolStats = (poolStats) => {
        if (!poolStats || typeof poolStats !== 'object') return 'No data';

        return Object.entries(poolStats)
            .filter(([_, stats]) => stats && typeof stats === 'object')
            .map(([type, stats]) => `${type}: ${stats.active}/${stats.total}`)
            .join('\n');
    };

    const renderSection = (title, children, id) => {
        const isCollapsed = collapsedSections[id];

        return (
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    {title}
                    <span
                        style={styles.sectionToggle}
                        onClick={() => toggleSection(id)}
                    >
                        {isCollapsed ? '[+]' : '[-]'}
                    </span>
                </div>
                {!isCollapsed && children}
            </div>
        );
    };

    const renderInfoItem = (label, value) => (
        <div style={styles.infoItem}>
            <span style={styles.label}>{label}:</span>
            <span style={styles.value}>{value}</span>
        </div>
    );

    const renderProgressBar = (value, max, color = '#44aa44') => {
        const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
        return (
            <div style={styles.progressBar}>
                <div
                    style={{
                        ...styles.progressFill,
                        width: `${percentage}%`,
                        backgroundColor: color
                    }}
                />
            </div>
        );
    };

    const renderActionButton = (label, action) => (
        <button
            style={styles.button}
            onClick={(e) => executeDebugAction(action, e)}
        >
            {label}
        </button>
    );

    return (
        <div style={styles.panel}>
            <div style={styles.panelHeader}>
                Debug Panel
            </div>

            {renderSection("Game Stats", <>
                {renderInfoItem("FPS", debugInfo.fps)}
                {renderInfoItem("Game Mode", debugInfo.gameMode)}
                {renderInfoItem("Survival Time", `${debugInfo.survivalTime}s`)}
                {renderInfoItem("Kills", debugInfo.killCount)}
            </>, "gameStats")}

            {renderSection("Wave Info", <>
                {renderInfoItem("Wave", `${debugInfo.currentWave}/${debugInfo.maxWaves}`)}
                {renderInfoItem("Status", debugInfo.waveActive ? "Active" : (debugInfo.inPausePhase ? "Paused" : "Inactive"))}
                {renderInfoItem("Enemies", `${debugInfo.activeEnemies}/${debugInfo.enemiesSpawned}/${debugInfo.enemiesToSpawn}`)}
                {debugInfo.hasBoss && renderInfoItem("Boss Wave", "Yes")}
            </>, "waveInfo")}

            {renderSection("XP & Level", <>
                {renderInfoItem("Level", debugInfo.xpLevel)}
                {renderInfoItem("XP", `${debugInfo.currentXP}/${debugInfo.xpToNext}`)}
                {renderProgressBar(debugInfo.currentXP, debugInfo.xpToNext, '#00ff99')}
            </>, "xpLevel")}

            {renderSection("Cash", <>
                {renderInfoItem("Current Cash", `$${debugInfo.cash}`)}
                {renderInfoItem("Cash Multiplier", `${debugInfo.cashMultiplier}x`)}
            </>, "cash")}

            {renderSection("Chaos & Factions", <>
                {renderInfoItem("Chaos", debugInfo.chaosValue)}
                {renderInfoItem("AI Faction", debugInfo.aiFaction)}
                {renderInfoItem("Coder Faction", debugInfo.coderFaction)}
                {renderInfoItem("Neutral Faction", debugInfo.neutralFaction)}
            </>, "chaos")}

            {renderSection("Player Stats", <>
                {renderInfoItem("Health", `${debugInfo.playerHealth}/${debugInfo.playerMaxHealth}`)}
                {renderProgressBar(debugInfo.playerHealth, debugInfo.playerMaxHealth, '#ff0000')}
                {renderInfoItem("Speed", debugInfo.playerSpeed)}
                {renderInfoItem("Defense", debugInfo.playerDefense)}
            </>, "playerStats")}

            {renderSection("Weapon Stats", <>
                {renderInfoItem("Damage", debugInfo.weaponDamage)}
                {renderInfoItem("Fire Rate", debugInfo.weaponFireRate)}
                {renderInfoItem("Crit Chance", `${debugInfo.critChance}%`)}
                {renderInfoItem("Crit Multiplier", `${debugInfo.critMultiplier}x`)}
                {renderInfoItem("Drones", `${debugInfo.droneCount}/${debugInfo.maxDrones}`)}
            </>, "weaponStats")}

            {renderSection("Entity Counts", <>
                {renderInfoItem("Enemies", debugInfo.enemyCount)}
                {renderInfoItem("Bullets", debugInfo.bulletCount)}
                {renderInfoItem("Collectibles", debugInfo.collectibles)}
                {debugInfo.spatialGridSize > 0 && renderInfoItem("Grid Cells", debugInfo.spatialGridSize)}
                {debugInfo.gridCellSize > 0 && renderInfoItem("Cell Size", debugInfo.gridCellSize)}
            </>, "entities")}

            {renderSection("Object Pools", <>
                <pre style={{
                    color: '#aaffaa',
                    fontSize: '11px',
                    margin: '0',
                    whiteSpace: 'pre-wrap'
                }}>
                    {formatPoolStats(debugInfo.poolStats)}
                </pre>
            </>, "pools")}

            {renderSection("Position", <>
                {renderInfoItem("Player", `${debugInfo.playerX}, ${debugInfo.playerY}`)}
                {renderInfoItem("Mouse", `${debugInfo.mouseX}, ${debugInfo.mouseY}`)}
            </>, "position")}

            {renderSection("Debug Actions", <>
                {renderActionButton("Open Shop", openShop)}
                {renderActionButton("Spawn Drone", spawnDrone)}
                {renderActionButton("Next Wave", startNextWave)}
                {renderActionButton("Add XP (50)", addXP)}
                {renderActionButton("Add Cash ($100)", addCash)}
                {renderActionButton("Toggle Chaos", switchChaos)}
            </>, "actions")}
        </div>
    );
}