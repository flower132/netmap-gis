import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'sample-stations.csv'],
      manifest: {
        name: 'NetMap GIS - 基站管理系统',
        short_name: 'NetMap GIS',
        description: '专业的 Web GIS 基站管理与可视化平台',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        display: 'standalone',
        scope: '.',
        start_url: '.',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,csv,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/webrd0[1-4]\.is\.autonavi\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'amap-tiles',
              expiration: { maxEntries: 2000, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/webst0[1-4]\.is\.autonavi\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'amap-satellite-tiles',
              expiration: { maxEntries: 2000, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/t[0-7]\.tianditu\.gov\.cn\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tianditu-tiles',
              expiration: { maxEntries: 2000, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/xlsx')) return 'vendor-xlsx'
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'vendor-leaflet'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
