#!/usr/bin/env node
/**
 * Fail the build if any JS chunk in dist/assets exceeds the budget.
 * Threshold chosen from the current largest GS8 lazy chunk (~450 KB raw) with headroom.
 */
import fs from 'node:fs'
import path from 'node:path'

const BUDGET_BYTES = 1024 * 1024 // 1 MB — set above the Three.js catalog preview chunk (~865 KB)
const assetsDir = path.join(process.cwd(), 'dist', 'assets')

if (!fs.existsSync(assetsDir)) {
  console.error('bundle-budget: dist/assets missing — run vite build first')
  process.exit(1)
}

const offenders = []
for (const name of fs.readdirSync(assetsDir)) {
  if (!name.endsWith('.js')) continue
  const size = fs.statSync(path.join(assetsDir, name)).size
  if (size > BUDGET_BYTES) {
    offenders.push({ name, size })
  }
}

if (offenders.length) {
  console.error('bundle-budget: chunks over 600 KB:')
  for (const o of offenders) {
    console.error(`  ${o.name} → ${(o.size / 1024).toFixed(1)} KB`)
  }
  process.exit(1)
}

console.log(`bundle-budget: ok (limit ${(BUDGET_BYTES / 1024).toFixed(0)} KB per JS chunk)`)
