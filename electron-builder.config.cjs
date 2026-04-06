'use strict'

/**
 * electron-builder configuration.
 * Icons: add build-resources/icon.ico (Windows) and build-resources/icon.png
 * (Linux, 512x512) when game art is finalised. electron-builder uses a
 * default icon until then — no build failure without them.
 */
module.exports = {
  appId: 'com.fluffyswizzle.equilibriumprotocol',
  productName: 'Equilibrium Protocol',

  directories: {
    output: 'release',
  },

  // Files included in the packaged app
  files: [
    'dist/electron/**/*',
    'electron/**/*',
    'package.json',
  ],

  // electron-builder needs the package.json "main" field to point here
  // Already set to "electron/main.cjs" in Task 4.

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    // icon: 'build-resources/icon.ico',  // uncomment when icon is ready
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },

  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    category: 'Game',
    // icon: 'build-resources/icon.png',  // uncomment when icon is ready
  },
}
