import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000,
    hmr: false,
    host: true,
    allowedHosts: [
      'setlist.kirknetllc.com', // Allow a specific domain
      '.kirknetllc.com', // Allow a domain and all its subdomains
      'badhabits.live',
      '.badhabits.live',
    ],
  },
});