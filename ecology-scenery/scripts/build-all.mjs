import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const destDir = join(root, '../public/downloads')

const SIMS = [
  'carbon-oxygen-cycle',
  'food-web-builder',
  'ecological-pyramid',
  'predator-prey',
  'global-warming',
]

mkdirSync(destDir, { recursive: true })

console.log('Typechecking…')
execSync('npx tsc --noEmit', { cwd: root, stdio: 'inherit' })

for (const sim of SIMS) {
  console.log(`\nBuilding ${sim}…`)
  execSync(`npx vite build`, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ECOLOGY_SIM: sim },
  })
  const src = join(root, `dist/${sim}/entries/${sim}.html`)
  const alt = join(root, `dist/${sim}/${sim}.html`)
  const from = existsSync(src) ? src : alt
  if (!existsSync(from)) {
    // vite-plugin-singlefile may flatten to index.html inside outDir
    const flat = join(root, `dist/${sim}/index.html`)
    if (!existsSync(flat)) {
      console.error('Missing build output for', sim, 'looked at', from, flat)
      process.exit(1)
    }
    copyFileSync(flat, join(destDir, `${sim}-offline.html`))
  } else {
    copyFileSync(from, join(destDir, `${sim}-offline.html`))
  }
  // Catalog aliases used by simulations.ts for a couple of sims
  const aliases = {
    'carbon-oxygen-cycle': 'carbon-oxygen-offline.html',
    'food-web-builder': 'food-web-offline.html',
  }
  if (aliases[sim]) {
    copyFileSync(join(destDir, `${sim}-offline.html`), join(destDir, aliases[sim]))
  }
  console.log(`→ public/downloads/${sim}-offline.html`)
}

console.log('\nAll ecology SceneryStack sims built.')
