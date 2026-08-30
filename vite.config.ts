import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

/**
 * Ensure standalone HTML under /downloads and /final-sims comes from public/,
 * never SPA index fallback (dev server).
 */
function serveStandaloneHtml(): Plugin {
  const prefixes = ['/downloads/', '/final-sims/']
  return {
    name: 'serve-standalone-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const hit = prefixes.some(
          (p) => url === p.slice(0, -1) || url.startsWith(p),
        )
        if (!hit) {
          next()
          return
        }
        const rel = url === '/final-sims' || url === '/final-sims/'
          ? 'final-sims/index.html'
          : url === '/downloads' || url === '/downloads/'
            ? 'downloads/index.html'
            : url.slice(1)
        const filePath = path.join(server.config.root, 'public', rel)
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          next()
          return
        }
        const type = filePath.endsWith('.html')
          ? 'text/html; charset=utf-8'
          : filePath.endsWith('.md')
            ? 'text/markdown; charset=utf-8'
            : 'application/octet-stream'
        res.statusCode = 200
        res.setHeader('Content-Type', type)
        res.setHeader('Cache-Control', 'no-cache')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    serveStandaloneHtml(),
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
        globIgnores: ['**/downloads/**', '**/final-sims/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/downloads\//, /^\/final-sims\//],
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
