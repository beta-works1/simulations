import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Ensure /downloads/*.html always comes from public/, never SPA index fallback.
 * Vite can briefly 404→SPA if a download is requested before the file lands on disk.
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
  plugins: [serveDownloadHtml(), react()],
  server: {
    // PhET clones / SceneryStack packages are separate builds; watching them
    // forces noisy full reloads of the main app.
    watch: {
      ignored: ['**/.phet-src/**', '**/nervous-scenery/**', '**/ecology-scenery/**', '**/ph-*-scenery/**'],
    },
  },
})
