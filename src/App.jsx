import { useRef, useEffect } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { DebugPanel } from './game/debug/DebugPanel';
import { EventBus } from './game/EventBus';
import { ErrorBoundary } from './ErrorBoundary';

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

    // F11 toggles fullscreen in Electron desktop builds.
    // In web/browser builds window.electronAPI is undefined, so we let the
    // event fall through to the browser's native fullscreen behavior.
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F11' && window.electronAPI) {
                e.preventDefault()
                window.electronAPI.toggleFullscreen()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const changeScene = () => {
        const scene = phaserRef.current.scene;
        if (scene) {
            scene.changeScene();
        }
    };

    return (
        <div id="app">
            <div style={{ position: 'relative' }}>
                <ErrorBoundary>
                    <PhaserGame ref={phaserRef} />
                </ErrorBoundary>
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

