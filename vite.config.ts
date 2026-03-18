import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enable service worker in dev mode so beforeinstallprompt fires
      devOptions: {
        enabled: true,
        type: 'module'
      },
      // Disable precache glob scanning — avoids the "dev-dist does not exist" warning.
      // The service worker still works; it just won't pre-cache assets in dev mode.
      workbox: {
        globPatterns: []
      },
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
          {
            src: 'pwa-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})
