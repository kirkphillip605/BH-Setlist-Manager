import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'setlist.kirknetllc.com', // Allow a specific domain
      '.kirknetllc.com' // Allow a domain and all its subdomains
    ],
  },
});