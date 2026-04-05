import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './config.prod.mjs'

// Electron renderer build — identical to web production build
// except it outputs to dist/electron so electron-builder can find it.
// base './' is required so loadFile() resolves assets correctly.
export default mergeConfig(baseConfig, defineConfig({
  base: './',
  build: {
    outDir: 'dist/electron',
    emptyOutDir: true,
  }
}))
