import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://af-frontend-075ecd5ff9fe.herokuapp.com/',
        changeOrigin: true,
      },
    },
  },
});
