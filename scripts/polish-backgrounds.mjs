/**
 * Replace flat canvas background fills with themed gradients.
 * Does NOT touch step/physics functions — only presentation paint lines.
 */
import fs from 'node:fs'
import path from 'node:path'

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(p)
  }
  return out
}

const replacements = [
  {
    files: /src[\\/]simulations[\\/](ohm-law|series-parallel|short-circuit|electric-motor|speaker)/,
    from: /ctx\.fillStyle\s*=\s*'#111827'\s*\n\s*ctx\.fillRect\(0,\s*0,\s*w,\s*h\)/g,
    to: `fillThemeBackground(ctx, w, h, 'electric')`,
    importFrom: '../../shared/canvasTheme',
    importNames: ['fillThemeBackground'],
  },
  {
    files: /src[\\/]simulations[\\/](black-hole|galaxy-types)/,
    from: /ctx\.fillStyle\s*=\s*'#020617'\s*\n\s*ctx\.fillRect\(0,\s*0,\s*\w+,\s*\w+\)/g,
    to: `fillThemeBackground(ctx, WIDTH_PLACEHOLDER, HEIGHT_PLACEHOLDER, 'space')\n  drawStarfield(ctx, WIDTH_PLACEHOLDER, HEIGHT_PLACEHOLDER)`,
    // handled specially below
    special: 'space020617',
  },
]

// Simpler global string replacements with import injection
const jobs = [
  {
    match: (p) => /simulations[\\/](ohm-law-circuit|series-parallel|short-circuit-fuse|electric-motor|speaker-mechanism)/.test(p),
    replace: (src) => {
      let next = src.replace(
        /ctx\.fillStyle\s*=\s*'#111827'\s*;\s*\n\s*ctx\.fillRect\(0,\s*0,\s*w,\s*h\)\s*;?/g,
        "fillThemeBackground(ctx, w, h, 'electric')",
      )
      if (next !== src && !next.includes('fillThemeBackground')) {
        // shouldn't happen if replace failed
      }
      if (next !== src) next = ensureImport(next, '../shared/canvasTheme', ['fillThemeBackground'])
      // fix relative path depth - files are in folder/Foo.tsx so ../shared is wrong; should be ../shared from simulations/x - actually from ohm-law-circuit it's ../shared/canvasTheme
      next = next.replace("from '../shared/canvasTheme'", "from '../shared/canvasTheme'")
      // from simulations/ohm-law-circuit -> ../shared = simulations/shared YES
      return next
    },
  },
  {
    match: (p) => /simulations[\\/](black-hole|galaxy-types|star-life-cycle|solar-system-timeline)/.test(p),
    replace: (src) => {
      let next = src
      next = next.replace(
        /ctx\.fillStyle\s*=\s*'#020617'\s*;\s*\n\s*ctx\.fillRect\(0,\s*0,\s*(\w+),\s*(\w+)\)\s*;?/g,
        (_m, ww, hh) =>
          `fillThemeBackground(ctx, ${ww}, ${hh}, 'space')\n  drawStarfield(ctx, ${ww}, ${hh})`,
      )
      next = next.replace(
        /ctx\.fillStyle\s*=\s*'#030712'\s*;\s*\n\s*ctx\.fillRect\(0,\s*0,\s*(\w+),\s*(\w+)\)\s*;?/g,
        (_m, ww, hh) =>
          `fillThemeBackground(ctx, ${ww}, ${hh}, 'space')\n  drawStarfield(ctx, ${ww}, ${hh})`,
      )
      if (next !== src) {
        next = ensureImport(next, '../shared/canvasTheme', ['fillThemeBackground', 'drawStarfield'])
      }
      return next
    },
  },
  {
    match: (p) => /sims[\\/]grade8[\\/]forces/.test(p),
    replace: (src) => {
      let next = src.replace(
        /ctx\.fillStyle\s*=\s*'#f7f9fb'\s*;\s*\n\s*ctx\.fillRect\(0,\s*0,\s*w,\s*h\)\s*;?/g,
        "clearThemedScene(ctx, w, h, 'force')\n      drawFaintGrid(ctx, w, h, 36, 'rgba(14, 116, 144, 0.08)')",
      )
      if (next !== src) {
        next = ensureImport(next, '../../shared/drawHelpers', ['clearThemedScene'])
        next = ensureImport(next, '../../shared/canvasTheme', ['drawFaintGrid'])
      }
      return next
    },
  },
  {
    match: (p) => /sims[\\/]grade8[\\/]acids/.test(p),
    replace: (src) => {
      let next = src.replace(
        /ctx\.fillStyle\s*=\s*'#f7f9fb'\s*;\s*\n\s*ctx\.fillRect\(0,\s*0,\s*w,\s*h\)\s*;?/g,
        "clearThemedScene(ctx, w, h, 'chemistry')",
      )
      if (next !== src) next = ensureImport(next, '../../shared/drawHelpers', ['clearThemedScene'])
      return next
    },
  },
  {
    match: (p) => /sims[\\/]grade8[\\/]heredity[\\/]PunnettSquareSim/.test(p),
    replace: (src) => {
      let next = src.replace(
        /ctx\.fillStyle\s*=\s*'#f7f9fb'\s*;\s*\n\s*ctx\.fillRect\(0,\s*0,\s*w,\s*h\)\s*;?/g,
        "clearThemedScene(ctx, w, h, 'biology')",
      )
      if (next !== src) next = ensureImport(next, '../../shared/drawHelpers', ['clearThemedScene'])
      return next
    },
  },
]

function ensureImport(src, from, names) {
  // If already importing from that path, merge names
  const re = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
  const m = src.match(re)
  if (m) {
    const existing = m[1].split(',').map((s) => s.trim()).filter(Boolean)
    const merged = [...new Set([...existing, ...names])]
    return src.replace(re, `import { ${merged.join(', ')} } from '${from}'`)
  }
  // Prefer after first import
  const firstImport = src.indexOf('import ')
  if (firstImport === -1) return `import { ${names.join(', ')} } from '${from}'\n` + src
  const lineEnd = src.indexOf('\n', firstImport)
  return src.slice(0, lineEnd + 1) + `import { ${names.join(', ')} } from '${from}'\n` + src.slice(lineEnd + 1)
}

const files = [
  ...walk('src/simulations'),
  ...walk('src/sims/grade8'),
]

let changed = 0
for (const file of files) {
  const abs = path.resolve(file)
  let src = fs.readFileSync(abs, 'utf8')
  const original = src
  for (const job of jobs) {
    if (job.match(abs.replace(/\\/g, '/'))) {
      src = job.replace(src)
    }
  }
  // Fix import path for simulations/* - from folder it's ../shared
  if (/simulations[/\\][^/\\]+[/\\]/.test(abs)) {
    src = src.replace("from '../../shared/canvasTheme'", "from '../shared/canvasTheme'")
  }
  if (src !== original) {
    fs.writeFileSync(abs, src)
    changed++
    console.log('updated', file)
  }
}
console.log('files changed', changed)
