import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const pkg: { version: string } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
)

const DAY_SECONDS = 60 * 60 * 24

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      includeAssets: ['favicon.ico', 'robots.txt', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Anime Statistics',
        short_name: 'AniStats',
        description: 'Персональный трекер аниме и манги',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        // The mock worker must never be served from the PWA cache: it is a dev
        // artefact and shadowing it would break the real service worker.
        navigateFallbackDenylist: [/^\/mockServiceWorker\.js$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/v1/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: DAY_SECONDS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: DAY_SECONDS * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  envDir: './env',
  build: {
    // Ace ships as one ~900 kB module; it cannot be split further and is only
    // fetched when a note is opened. The real budgets live in size-limit.
    chunkSizeWarningLimit: 700,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) only accepts the function form here. Ace is left out
        // on purpose: grouping it turns the whole editor into an entry
        // dependency, and the async MarkdownEditor already isolates it.
        manualChunks: (id: string) => {
          if (/node_modules[\\/](axios|axios-retry|change-case|zod|date-fns)/.test(id)) {
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
  server: { port: 3000, proxy: { '/api': 'http://localhost:5000' } },
})
