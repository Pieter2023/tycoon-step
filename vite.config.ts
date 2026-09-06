/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  // Pre-bundle Three.js with its example loaders so opening the 3D city in `vite dev`
  // neither triggers a mid-session full reload nor loads two copies of Three.
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/loaders/GLTFLoader.js', 'three/examples/jsm/loaders/DRACOLoader.js', 'three/examples/jsm/environments/RoomEnvironment.js', 'three/examples/jsm/geometries/RoundedBoxGeometry.js']
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/.netlify/functions')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Code-splitting to keep initial bundle size reasonable.
    // (Helps performance on mobile/tablet and avoids giant single-chunk output.)
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          confetti: ['canvas-confetti']
        }
      }
    }
  },
});
