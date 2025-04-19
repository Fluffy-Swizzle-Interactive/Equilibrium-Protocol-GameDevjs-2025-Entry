import { useRef } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { DebugPanel } from './game/debug/DebugPanel';

function App() {
    //  Reference to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef();

    const changeScene = () => {
        const scene = phaserRef.current.scene;
        if (scene) {
            scene.changeScene();
        }
    }

    // Only show debug panel and control buttons in development mode
    const isDev = import.meta.env.DEV;

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
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
    )
}

export default App
