import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'src/data/simulations.ts')
const data = fs.readFileSync(dataPath, 'utf8')

const entries = []
const re =
  /\{\s*id:\s*'([^']+)',\s*title:\s*'((?:\\'|[^'])*)'[\s\S]*?color:\s*'([^']+)',\s*accent:\s*'([^']+)',?/g
let m
while ((m = re.exec(data))) {
  entries.push({
    id: m[1],
    title: m[2].replace(/\\'/g, "'"),
    color: m[3],
    accent: m[4],
  })
}

function art(id, accent) {
  if (
    /mirror|reflection|refraction|rainbow|diffuse/.test(id)
  ) {
    return `
      <line x1="40" y1="70" x2="160" y2="70" stroke="${accent}" stroke-width="3"/>
      <line x1="100" y1="20" x2="100" y2="70" stroke="#fff" stroke-width="2" stroke-dasharray="4 3"/>
      <line x1="40" y1="30" x2="100" y2="70" stroke="#f4d03f" stroke-width="3"/>
      <line x1="160" y1="30" x2="100" y2="70" stroke="#5dade2" stroke-width="3"/>
      <circle cx="40" cy="30" r="6" fill="#f4d03f"/>`
  }
  if (/circuit|ohm|series|fuse|motor|speaker/.test(id)) {
    return `
      <rect x="30" y="55" width="140" height="8" rx="2" fill="${accent}"/>
      <rect x="50" y="40" width="28" height="38" rx="4" fill="#f4d03f"/>
      <circle cx="140" cy="59" r="16" fill="none" stroke="#fff" stroke-width="3"/>
      <path d="M132 59h16M140 51v16" stroke="#fff" stroke-width="2"/>`
  }
  if (/star|galaxy|black|solar-system|orbit|gravity/.test(id)) {
    return `
      <circle cx="100" cy="60" r="18" fill="${accent}"/>
      <circle cx="100" cy="60" r="28" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.5"/>
      <circle cx="145" cy="45" r="6" fill="#fff"/>
      <circle cx="55" cy="80" r="4" fill="#f4d03f"/>
      <circle cx="160" cy="85" r="3" fill="#85c1e9"/>`
  }
  if (/solar-cooker|wind/.test(id)) {
    return `
      <path d="M40 90 Q100 20 160 90" fill="none" stroke="${accent}" stroke-width="4"/>
      <circle cx="100" cy="55" r="10" fill="#f9e79f"/>
      <rect x="90" y="65" width="20" height="18" fill="#fff" opacity="0.85"/>`
  }
  if (/carbon|food|ecological|predator|global|plant|natural/.test(id)) {
    return `
      <circle cx="100" cy="35" r="14" fill="#5dade2"/>
      <circle cx="55" cy="80" r="16" fill="#58d68d"/>
      <circle cx="145" cy="80" r="16" fill="#e74c3c"/>
      <path d="M100 49 L55 64 M100 49 L145 64 M55 80 L145 80" stroke="#fff" stroke-width="2" opacity="0.7"/>`
  }
  if (/neuron|reflex|brain/.test(id)) {
    return `
      <ellipse cx="70" cy="55" rx="22" ry="16" fill="${accent}"/>
      <path d="M90 55 C120 40 140 70 170 55" stroke="#fff" stroke-width="3" fill="none"/>
      <circle cx="170" cy="55" r="5" fill="#f4d03f"/>`
  }
  if (/dna|mitosis|punnett|plasmid|ferment/.test(id)) {
    return `
      <path d="M70 25 C90 45 90 65 70 85" stroke="${accent}" stroke-width="4" fill="none"/>
      <path d="M130 25 C110 45 110 65 130 85" stroke="#fff" stroke-width="4" fill="none"/>
      <line x1="78" y1="40" x2="122" y2="40" stroke="#f4d03f" stroke-width="2"/>
      <line x1="78" y1="55" x2="122" y2="55" stroke="#f4d03f" stroke-width="2"/>
      <line x1="78" y1="70" x2="122" y2="70" stroke="#f4d03f" stroke-width="2"/>`
  }
  return `
    <path d="M80 30 h40 v20 l20 45 a25 25 0 0 1 -80 0 l20 -45 z" fill="${accent}" opacity="0.9"/>
    <rect x="88" y="22" width="24" height="12" rx="2" fill="#fff"/>
    <circle cx="95" cy="75" r="4" fill="#fff" opacity="0.8"/>
    <circle cx="110" cy="82" r="3" fill="#fff" opacity="0.7"/>`
}

const dir = path.join(root, 'public/covers')
fs.mkdirSync(dir, { recursive: true })

for (const e of entries) {
  const label = e.title.length > 28 ? `${e.title.slice(0, 26)}…` : e.title
  const safe = label.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="340" viewBox="0 0 520 340">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${e.color}"/>
      <stop offset="100%" stop-color="${e.accent}"/>
    </linearGradient>
  </defs>
  <rect width="520" height="340" rx="18" fill="url(#g)"/>
  <rect x="18" y="18" width="484" height="304" rx="12" fill="rgba(0,0,0,0.18)"/>
  <g transform="translate(160,80) scale(1.15)">
    ${art(e.id, e.accent)}
  </g>
  <text x="260" y="290" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#ffffff">${safe}</text>
</svg>
`
  fs.writeFileSync(path.join(dir, `${e.id}.svg`), svg)
}

// Ensure every sim object has required image field.
let next = data
if (!next.includes('image: string')) {
  next = next.replace(
    /keywords: string\[\]\n  color: string\n  accent: string/,
    `keywords: string[]\n  color: string\n  accent: string\n  /** Cover image path under /public */\n  image: string`,
  )
}

for (const e of entries) {
  const imageLine = `image: '/covers/${e.id}.svg',`
  // Skip if already present after this id
  const idBlock = new RegExp(`(id:\\s*'${e.id}'[\\s\\S]*?accent:\\s*'[^']+',)(\\s*image:)?`)
  next = next.replace(idBlock, (full, before, hasImage) => {
    if (hasImage || full.includes(`image: '/covers/${e.id}.svg'`)) return full
    return `${before}\n    ${imageLine}`
  })
}

fs.writeFileSync(dataPath, next)
console.log(`covers=${entries.length}`)
