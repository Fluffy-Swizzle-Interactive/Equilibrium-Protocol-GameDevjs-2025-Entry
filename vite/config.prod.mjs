import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            const line = "---------------------------------------------------------";
            const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
            process.stdout.write(`${line}\n${msg}\n${line}\n`);

            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}

export default defineConfig({
    base: './',
    plugins: [
        react(),
        phasermsg()
    ],
    logLevel: 'warning',
    define: {
        // Define global constants that will be replaced at build time
        __DEBUG__: false,
    },
    preview: {
        port: 5173,
        host: '0.0.0.0',
        strictPort: true
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            },
            // Exclude the debug panel from the build
            external: ['src/game/debug/*'],
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2,
                // Remove debug-only code
                pure_funcs: ['console.log', 'console.debug'],
                // Remove code guarded by DEV checks
                global_defs: {
                    'import.meta.env.DEV': false
                }
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    }
});
