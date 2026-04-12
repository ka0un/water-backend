import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTarget = process.env.VITE_DEV_PROXY_TARGET || process.env.VITE_API_URL;

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        proxy: proxyTarget
            ? {
                  '/api': {
                      target: proxyTarget,
                      changeOrigin: true,
                  },
              }
            : undefined,
    },
})
