import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // PhET clones are reference-only; watching them forces noisy full reloads
    watch: {
      ignored: ['**/.phet-src/**'],
    },
  },
})
