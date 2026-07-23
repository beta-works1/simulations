import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const sim = process.env.NERVOUS_SIM || 'reflex-arc'
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const destDir = join(root, '../public/downloads')
mkdirSync(destDir, { recursive: true })

const candidates = [
  join(root, `dist/${sim}/entries/${sim}.html`),
  join(root, `dist/${sim}/${sim}.html`),
  join(root, `dist/${sim}/index.html`),
]
const src = candidates.find((p) => existsSync(p))
if (!src) {
  console.error('Missing build output for', sim)
  process.exit(1)
}
copyFileSync(src, join(destDir, `${sim}-offline.html`))
console.log('Copied →', join(destDir, `${sim}-offline.html`))
