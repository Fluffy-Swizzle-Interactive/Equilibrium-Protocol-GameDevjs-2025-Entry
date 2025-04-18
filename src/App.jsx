import { useRef, useState, useEffect } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { DebugPanel } from './game/debug/DebugPanel';
import ChaosBar from './components/ChaosBar';
import { EventBus } from './game/EventBus';

function App() {
    // Reference to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef();
    // State to track when to show the chaos bar
    const [showChaosBar, setShowChaosBar] = useState(false);
    
    // Only show debug panel and control buttons in development mode
    const isDev = import.meta.env.DEV;
    
    // Force showing the chaos bar in development mode for debugging
    const forceShowChaosBar = isDev;

    // Check if we should show the chaos bar when the game scene changes
    useEffect(() => {
        const handleSceneReady = (scene) => {
            // Only show chaos bar in the WaveGame scene that has the chaos manager
            if (scene && scene.key === 'WaveGame') {
                setShowChaosBar(false);
                console.log('WaveGame scene detected, showing ChaosMeter bar');
            } else {
                setShowChaosBar(false);
            }
        };
        
        // Log when listeners are set up
        console.log('Setting up EventBus listeners for scene changes');
        
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
                
                {/* Chaos Bar - positioned within the game canvas */}
                {(showChaosBar || forceShowChaosBar) && (
                    <div className="chaos-bar-container" style={{
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '300px',
                        zIndex: 1000,
                        border: isDev ? '1px solid yellow' : 'none'
                    }}>
                        <ChaosBar />
                    </div>
                )}
            </div>
            
            {isDev && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                }}>
                    <div>
                        <button className="button" onClick={changeScene}>Change Scene</button>
                        <button className="button" onClick={() => setShowChaosBar(!showChaosBar)}>
                            Toggle Chaos Bar
                        </button>
                    </div>
                    
                    {/* Debug Panel */}
                    <DebugPanel gameRef={phaserRef} />
                </div>
            )}
        </div>
    );
}

export default App;

