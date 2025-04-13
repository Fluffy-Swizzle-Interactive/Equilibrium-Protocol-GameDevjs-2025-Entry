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

    // Event emitted from the PhaserGame component
    const currentScene = (scene) => {
        // We'll use phaserRef directly in the DebugPanel
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
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
        </div>
    )
}

export default App
