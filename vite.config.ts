import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true, type: 'module' },
      workbox: { globPatterns: [] },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-icon.png'],
      manifest: {
        name: 'Flash Deliveries',
        short_name: 'Flash',
        description: 'Fast and reliable delivery service for gas and packages.',
        theme_color: '#e63946',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-icon.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-icon.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    }),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})