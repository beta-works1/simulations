import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

/**
 * Ensure /downloads/*.html always comes from public/, never SPA index fallback.
 */
function serveDownloadHtml(): Plugin {
  return {
    name: 'serve-download-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/downloads/') || !url.endsWith('.html')) {
          next()
          return
        }
        const filePath = path.join(server.config.root, 'public', url.slice(1))
        if (!fs.existsSync(filePath)) {
          next()
          return
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    serveDownloadHtml(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'General Science 8 Simulations',
        short_name: 'GS8 Sims',
        description: 'SNC 2022 Grade 8 interactive simulations (offline-capable)',
        theme_color: '#0ea5e9',
        background_color: '#f7f4ef',
        display: 'standalone',
        start_url: '/gs8',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/downloads/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/downloads\//],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  server: {
    watch: {
      ignored: ['**/.phet-src/**', '**/nervous-scenery/**', '**/ecology-scenery/**', '**/ph-*-scenery/**'],
    },
  },
})
