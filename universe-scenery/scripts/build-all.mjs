import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const destDir = join(root, '../public/downloads')
const SIMS = ['star-life-cycle', 'galaxy-types', 'black-hole', 'solar-system-timeline']
mkdirSync(destDir, { recursive: true })
console.log('Typechecking…')
execSync('npx tsc --noEmit', { cwd: root, stdio: 'inherit' })
for (const sim of SIMS) {
  console.log(`\nBuilding ${sim}…`)
  execSync('npx vite build', { cwd: root, stdio: 'inherit', env: { ...process.env, UNIVERSE_SIM: sim } })
  const candidates = [
    join(root, `dist/${sim}/entries/${sim}.html`),
    join(root, `dist/${sim}/${sim}.html`),
    join(root, `dist/${sim}/index.html`),
  ]
  const from = candidates.find((p) => existsSync(p))
  if (!from) { console.error('Missing', sim); process.exit(1) }
  copyFileSync(from, join(destDir, `${sim}-offline.html`))
  console.log(`→ public/downloads/${sim}-offline.html`)
}
console.log('\nAll universe SceneryStack sims built.')
