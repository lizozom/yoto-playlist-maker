import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import { builtinModules } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: path.join(__dirname, 'electron/main.ts'),
        onstart(args) {
          args.startup();
        },
        vite: {
          build: {
            outDir: path.join(__dirname, 'dist-electron'),
            minify: false,
            sourcemap: true,
            rollupOptions: {
              external: [
                'electron',
                ...builtinModules,
                ...builtinModules.map(m => `node:${m}`),
              ],
            },
          },
        },
      },
      {
        entry: path.join(__dirname, 'electron/preload.ts'),
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: path.join(__dirname, 'dist-electron'),
            minify: false,
            sourcemap: true,
            rollupOptions: {
              external: [
                'electron',
                ...builtinModules,
                ...builtinModules.map(m => `node:${m}`),
              ],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  root: 'renderer',
  base: './',
  build: {
    outDir: '../dist-electron/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer/src'),
    },
  },
});
