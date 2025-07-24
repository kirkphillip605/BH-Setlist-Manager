import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['lucide-react', 'react-beautiful-dnd'],
          'vendor-editor': ['react-quill'],
          'vendor-pdf': ['jspdf'],
          // App modules
          'services': [
            './src/services/apiService.js',
            './src/services/songsService.js',
            './src/services/setlistsService.js',
            './src/services/setsService.js',
            './src/services/songCollectionsService.js',
            './src/services/performanceService.js'
          ]
        }
      }
    },
    // Increase chunk size warning limit since we're optimizing chunks
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging if needed
    sourcemap: false,
    // Optimize build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    hmr: false,
    host: true,
    allowedHosts: [
      'setlist.kirknetllc.com',
      '.kirknetllc.com',
      'badhabits.live',
      '.badhabits.live',
    ],
  },
});