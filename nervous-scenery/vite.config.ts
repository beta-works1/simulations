import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import raw from 'vite-raw-plugin'
import { resolve } from 'node:path'

const sim = process.env.NERVOUS_SIM || 'reflex-arc'

export default defineConfig({
  base: './',
  plugins: [raw({ fileRegex: /\.ftl$/ }), viteSingleFile()],
  build: {
    target: 'es2018',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    outDir: `dist/${sim}`,
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, `entries/${sim}.html`),
    },
  },
  server: {
    open: `/entries/${sim}.html`,
  },
})
