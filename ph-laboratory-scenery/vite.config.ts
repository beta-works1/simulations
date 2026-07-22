import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import raw from 'vite-raw-plugin'

// PhET-style offline artifact: one self-contained HTML (JS/CSS inlined).
export default defineConfig({
  base: './',
  plugins: [
    raw({ fileRegex: /\.ftl$/ }),
    viteSingleFile(),
  ],
  build: {
    target: 'es2018',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    outDir: 'dist',
    emptyOutDir: true,
  },
})
