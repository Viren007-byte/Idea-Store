import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: { output: { manualChunks: {
      material: ['@mui/material', '@emotion/react', '@emotion/styled'],
      validation: ['zod'],
    } } },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': process.env.API_PROXY_TARGET || 'http://localhost:8000' },
  },
})
