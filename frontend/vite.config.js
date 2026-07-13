import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend dev server proxies /api to the local Express backend so we avoid
// CORS during development. In production the app calls VITE_API_BASE directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
