import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: { outDir: 'dist-electron', sourcemap: true }
        }
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: { outDir: 'dist-electron', sourcemap: 'inline' }
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#shared': fileURLToPath(new URL('./shared', import.meta.url))
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    sourcemap: true
  }
}));



