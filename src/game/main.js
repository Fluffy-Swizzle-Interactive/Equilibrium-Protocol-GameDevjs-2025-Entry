import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game.jsx';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';

// Find out more information about the Game Config at:
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    // FPS configuration
    fps: {
        target: 60,           // Target framerate
        forceSetTimeOut: false, // Use setTimeout instead of requestAnimationFrame
        min: 30,
        max: 60,              // Min framerate to throttle down to
        deltaHistory: 10,     // Number of frames to calculate average
        panicMax: 60         // FPS threshold to reset delta history if exceeded
    },
    // Enable physics
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // No gravity (top-down game)
            debug: false
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver
    ]
};

const StartGame = (parent) => {

    return new Phaser.Game({ ...config, parent });

}

export default StartGame;
