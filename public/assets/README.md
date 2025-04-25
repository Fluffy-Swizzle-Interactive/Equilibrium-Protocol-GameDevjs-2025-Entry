# Assets Directory Structure

This directory contains all the game assets organized in a logical structure.

## Directory Structure

- **audio/** - Sound effects and music files
  - Contains audio files like ambient_loop.mp3, laserShoot.wav, etc.

- **config/** - Configuration files for asset loading
  - boot-asset-pack.json - Assets loaded during the Boot scene
  - preload-asset-pack.json - Assets loaded during the Preloader scene

- **images/** - General image assets
  - bg.png - Background image
  - logo.png - Game logo
  - star.png - Particle texture

- **maps/** - Map and tileset files
  - level1.json/png - Main level map and tileset
  - darkcavenet.json/png - Dark cave tilemap
  - Other tileset images and map data

- **scripts/** - JavaScript files used as assets
  - Boot.js - Boot scene script

- **sprites/** - Character and object sprites
  - PLAYER1/ - Individual player animation frames
  - testplayer.json/png - Player sprite atlas
  - TESTPLAYER1.json - Player sprite atlas configuration

## Asset Loading

Assets are loaded in the Preloader.js file. The paths in this file have been updated to reflect the new directory structure.

## Notes

- The TESTPLAYER1.png file appears to be missing from the original assets. The code has been updated to use testplayer.png as a fallback.
- Audio files remain in their original location.
