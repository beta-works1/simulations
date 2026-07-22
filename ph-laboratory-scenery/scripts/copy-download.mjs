import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = join(here, '../dist/index.html')
const destDir = join(here, '../../public/downloads')
const dest = join(destDir, 'ph-laboratory-offline.html')

if (!existsSync(src)) {
  console.error('Missing build output:', src)
  process.exit(1)
}
mkdirSync(destDir, { recursive: true })
copyFileSync(src, dest)
console.log('Copied downloadable HTML →', dest)
