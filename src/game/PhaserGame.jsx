import PropTypes from 'prop-types';
import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from './main';
import { EventBus } from './EventBus';

/**
 * PhaserGame component that integrates the Phaser game engine with React
 * 
 * @param {Object} props - Component props
 * @param {React.Ref} ref - Forwarded ref to access game and scene objects
 */
export const PhaserGame = forwardRef(function PhaserGame(props, ref) {
    const game = useRef();
    const containerId = "game-container";

    // Create the game instance when component mounts
    useLayoutEffect(() => {
        if (game.current === undefined) {
            initializeGame();
        }

        return cleanupGame;
    }, [ref]);

    // Listen for scene updates
    useEffect(() => {
        setupEventListeners();
        
        // Disable right-click context menu within the game container
        const gameContainer = document.getElementById(containerId);
        if (gameContainer) {
            gameContainer.addEventListener('contextmenu', preventContextMenu);
        }
        
        return () => {
            removeEventListeners();
            
            // Clean up right-click event listener
            const gameContainer = document.getElementById(containerId);
            if (gameContainer) {
                gameContainer.removeEventListener('contextmenu', preventContextMenu);
            }
        };
    }, [ref]);

    /**
     * Prevent the context menu from appearing on right-click within the game
     * @param {Event} event - The context menu event
     */
    const preventContextMenu = (event) => {
        event.preventDefault();
        return false;
    };

    /**
     * Initialize the Phaser game instance
     */
    const initializeGame = () => {
        game.current = StartGame(containerId);
            
        if (ref !== null) {
            ref.current = { game: game.current, scene: null };
        }
    };
    
    /**
     * Clean up the Phaser game instance when component unmounts
     */
    const cleanupGame = () => {
        if (game.current) {
            game.current.destroy(true);
            game.current = undefined;
        }
    };
    
    /**
     * Set up event listeners for scene updates
     */
    const setupEventListeners = () => {
        EventBus.on('current-scene-ready', handleSceneReady);
    };
    
    /**
     * Remove event listeners when component unmounts
     */
    const removeEventListeners = () => {
        EventBus.removeListener('current-scene-ready');
    };
    
    /**
     * Handle when a scene becomes ready
     * @param {Phaser.Scene} currentScene - The current active scene
     */
    const handleSceneReady = (currentScene) => {
        if (ref) {
            ref.current.scene = currentScene;
        }
    };

    return (
        <div id={containerId}></div>
    );
});

// PropTypes for documentation and validation
PhaserGame.propTypes = {
    children: PropTypes.node
};
