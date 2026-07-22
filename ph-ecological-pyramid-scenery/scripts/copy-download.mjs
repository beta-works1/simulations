import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = join(here, '../dist/index.html')
const dest = join(here, '../../public/downloads/ecological-pyramid-offline.html')

if (!existsSync(src)) {
  console.error('Missing build output:', src)
  process.exit(1)
}
mkdirSync(dirname(dest), { recursive: true })
copyFileSync(src, dest)
console.log('Copied downloadable HTML →', dest)
