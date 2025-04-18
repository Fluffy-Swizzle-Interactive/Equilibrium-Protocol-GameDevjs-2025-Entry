import { useRef, useState, useEffect } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { DebugPanel } from './game/debug/DebugPanel';
import { EventBus } from './game/EventBus';

function App() {
    // Reference to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef();
    
    // Only show debug panel and control buttons in development mode
    const isDev = import.meta.env.DEV;

    // Listen for scene changes
    useEffect(() => {
        const handleSceneReady = (scene) => {
            console.log(`Scene ready: ${scene ? scene.key : 'unknown'}`);
        };
        
        // Subscribe to scene ready event
        EventBus.on('current-scene-ready', handleSceneReady);
        
        // Cleanup on unmount
        return () => {
            EventBus.off('current-scene-ready', handleSceneReady);
        };
    }, []);

    const changeScene = () => {
        const scene = phaserRef.current.scene;
        if (scene) {
            scene.changeScene();
        }
    };

    return (
        <div id="app">
            <div style={{ position: 'relative' }}>
                <PhaserGame ref={phaserRef} />
            </div>
            
            {isDev && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                }}>
                    <div>
                        <button className="button" onClick={changeScene}>Change Scene</button>
                    </div>
                    
                    {/* Debug Panel */}
                    <DebugPanel gameRef={phaserRef} />
                </div>
            )}
        </div>
    );
}

export default App;

