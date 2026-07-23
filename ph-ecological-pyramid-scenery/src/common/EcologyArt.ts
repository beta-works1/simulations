/**
 * Friendly Class-8 ecology icons (inline SVG → Image).
 * Relatable pictures beat plain circles for student understanding.
 */
import { Image, Node } from 'scenerystack/scenery'

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const RABBIT = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="42" rx="16" ry="14" fill="#f5f5f5" stroke="#94a3b8" stroke-width="1.5"/>
  <ellipse cx="22" cy="18" rx="6" ry="16" fill="#f5f5f5" stroke="#94a3b8" stroke-width="1.2"/>
  <ellipse cx="42" cy="18" rx="6" ry="16" fill="#f5f5f5" stroke="#94a3b8" stroke-width="1.2"/>
  <ellipse cx="22" cy="18" rx="3" ry="10" fill="#fda4af"/>
  <ellipse cx="42" cy="18" rx="3" ry="10" fill="#fda4af"/>
  <circle cx="26" cy="40" r="2.2" fill="#1e293b"/>
  <circle cx="38" cy="40" r="2.2" fill="#1e293b"/>
  <ellipse cx="32" cy="46" rx="3" ry="2" fill="#fda4af"/>
  <ellipse cx="48" cy="48" rx="5" ry="4" fill="#e2e8f0"/>
</svg>`)

const FOX = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="40" rx="18" ry="14" fill="#ea580c" stroke="#9a3412" stroke-width="1.5"/>
  <path d="M14 28 L22 18 L28 30 Z" fill="#ea580c" stroke="#9a3412" stroke-width="1"/>
  <path d="M50 28 L42 18 L36 30 Z" fill="#ea580c" stroke="#9a3412" stroke-width="1"/>
  <path d="M14 28 L22 18 L24 28 Z" fill="#fecaca"/>
  <path d="M50 28 L42 18 L40 28 Z" fill="#fecaca"/>
  <circle cx="26" cy="38" r="2.4" fill="#1e293b"/>
  <circle cx="38" cy="38" r="2.4" fill="#1e293b"/>
  <ellipse cx="32" cy="44" rx="3.5" ry="2.2" fill="#1e293b"/>
  <ellipse cx="50" cy="46" rx="7" ry="4" fill="#ea580c"/>
  <ellipse cx="54" cy="46" rx="4" ry="2.5" fill="#f8fafc"/>
</svg>`)

const GRASS = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="0" y="48" width="64" height="16" fill="#65a30d"/>
  <path d="M12 48 Q14 20 10 8" stroke="#4d7c0f" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M22 48 Q24 16 20 6" stroke="#65a30d" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M32 48 Q34 14 32 4" stroke="#4d7c0f" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M42 48 Q40 18 44 8" stroke="#65a30d" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M52 48 Q50 22 54 10" stroke="#4d7c0f" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="20" cy="28" r="3" fill="#facc15"/>
  <circle cx="44" cy="24" r="3" fill="#f472b6"/>
</svg>`)

const TREE = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="28" y="40" width="8" height="18" rx="2" fill="#92400e"/>
  <circle cx="32" cy="28" r="18" fill="#16a34a"/>
  <circle cx="22" cy="32" r="10" fill="#15803d"/>
  <circle cx="42" cy="30" r="11" fill="#22c55e"/>
  <circle cx="32" cy="18" r="9" fill="#4ade80"/>
</svg>`)

const DEER = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="34" cy="40" rx="16" ry="12" fill="#b45309"/>
  <ellipse cx="48" cy="30" rx="8" ry="7" fill="#b45309"/>
  <path d="M44 24 L40 10 M44 24 L48 8 M50 24 L54 10" stroke="#78350f" stroke-width="2" fill="none"/>
  <circle cx="52" cy="28" r="1.8" fill="#1e293b"/>
  <rect x="24" y="48" width="4" height="10" fill="#92400e"/>
  <rect x="40" y="48" width="4" height="10" fill="#92400e"/>
</svg>`)

const HAWK = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="34" rx="10" ry="8" fill="#78716c"/>
  <path d="M8 36 Q32 10 56 36 Q32 28 8 36" fill="#a8a29e"/>
  <circle cx="38" cy="32" r="2" fill="#1e293b"/>
  <path d="M40 36 L48 40" stroke="#f59e0b" stroke-width="2"/>
</svg>`)

const FROG = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="38" rx="18" ry="14" fill="#22c55e"/>
  <circle cx="22" cy="28" r="7" fill="#4ade80"/>
  <circle cx="42" cy="28" r="7" fill="#4ade80"/>
  <circle cx="22" cy="28" r="3" fill="#1e293b"/>
  <circle cx="42" cy="28" r="3" fill="#1e293b"/>
  <ellipse cx="32" cy="44" rx="6" ry="3" fill="#15803d"/>
</svg>`)

const SNAKE = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M10 40 C20 20, 28 52, 38 28 C46 12, 54 40, 58 34" stroke="#84cc16" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="56" cy="32" r="5" fill="#65a30d"/>
  <circle cx="58" cy="31" r="1.5" fill="#1e293b"/>
</svg>`)

const FUNGI = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M16 36 Q32 12 48 36 Z" fill="#ef4444"/>
  <ellipse cx="32" cy="36" rx="16" ry="5" fill="#fca5a5"/>
  <rect x="28" y="36" width="8" height="16" rx="2" fill="#fef3c7"/>
  <circle cx="24" cy="28" r="2" fill="#fff"/>
  <circle cx="36" cy="24" r="2.5" fill="#fff"/>
</svg>`)

const FACTORY = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="8" y="28" width="40" height="28" fill="#64748b"/>
  <rect x="40" y="16" width="10" height="40" fill="#94a3b8"/>
  <rect x="14" y="34" width="8" height="8" fill="#38bdf8"/>
  <rect x="28" y="34" width="8" height="8" fill="#38bdf8"/>
  <path d="M44 16 Q50 8 56 4" stroke="#94a3b8" stroke-width="4" fill="none" opacity="0.7"/>
  <path d="M48 16 Q56 6 60 2" stroke="#cbd5e1" stroke-width="3" fill="none" opacity="0.5"/>
</svg>`)

const EARTH = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="26" fill="#38bdf8"/>
  <path d="M18 24 Q28 20 34 28 Q40 36 28 40 Q16 38 18 24" fill="#22c55e"/>
  <path d="M40 18 Q50 22 48 34 Q44 42 38 36 Q36 24 40 18" fill="#16a34a"/>
  <path d="M12 40 Q22 44 30 42" stroke="#15803d" stroke-width="3" fill="none"/>
</svg>`)

const SUN = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="14" fill="#facc15"/>
  <g stroke="#fbbf24" stroke-width="3" stroke-linecap="round">
    <line x1="32" y1="4" x2="32" y2="12"/><line x1="32" y1="52" x2="32" y2="60"/>
    <line x1="4" y1="32" x2="12" y2="32"/><line x1="52" y1="32" x2="60" y2="32"/>
    <line x1="12" y1="12" x2="18" y2="18"/><line x1="46" y1="46" x2="52" y2="52"/>
    <line x1="52" y1="12" x2="46" y2="18"/><line x1="12" y1="52" x2="18" y2="46"/>
  </g>
</svg>`)

const COW = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="38" rx="18" ry="14" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
  <ellipse cx="20" cy="34" rx="5" ry="4" fill="#1e293b"/>
  <ellipse cx="40" cy="42" rx="6" ry="5" fill="#1e293b"/>
  <ellipse cx="48" cy="28" rx="9" ry="8" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
  <circle cx="52" cy="26" r="2" fill="#1e293b"/>
  <ellipse cx="50" cy="32" rx="4" ry="2.5" fill="#fda4af"/>
  <rect x="22" y="48" width="5" height="10" fill="#64748b"/>
  <rect x="38" y="48" width="5" height="10" fill="#64748b"/>
</svg>`)

const MOUSE = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="34" cy="38" rx="16" ry="12" fill="#a8a29e"/>
  <circle cx="48" cy="32" r="9" fill="#a8a29e"/>
  <circle cx="18" cy="28" r="7" fill="#d6d3d1"/>
  <circle cx="52" cy="30" r="2" fill="#1e293b"/>
  <ellipse cx="54" cy="36" rx="3" ry="2" fill="#fda4af"/>
  <path d="M18 44 Q8 50 6 58" stroke="#78716c" stroke-width="2" fill="none"/>
</svg>`)

const BIRD = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="34" cy="36" rx="12" ry="9" fill="#38bdf8"/>
  <path d="M10 36 Q32 18 54 36 Q32 30 10 36" fill="#0ea5e9"/>
  <circle cx="42" cy="34" r="2" fill="#1e293b"/>
  <path d="M44 38 L52 40" stroke="#f59e0b" stroke-width="2"/>
</svg>`)

const BUSH = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="24" cy="36" r="14" fill="#15803d"/>
  <circle cx="40" cy="34" r="16" fill="#16a34a"/>
  <circle cx="32" cy="42" r="12" fill="#22c55e"/>
  <circle cx="28" cy="30" r="3" fill="#f472b6"/>
  <circle cx="40" cy="28" r="2.5" fill="#facc15"/>
</svg>`)

const ALGAE = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="48" rx="24" ry="8" fill="#0ea5e9" opacity="0.5"/>
  <path d="M20 48 Q18 28 24 16" stroke="#4ade80" stroke-width="4" fill="none"/>
  <path d="M32 48 Q34 24 30 12" stroke="#22c55e" stroke-width="5" fill="none"/>
  <path d="M44 48 Q46 30 42 18" stroke="#86efac" stroke-width="4" fill="none"/>
</svg>`)

const BEETLE = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="36" rx="16" ry="12" fill="#1e293b"/>
  <ellipse cx="32" cy="36" rx="14" ry="10" fill="#334155"/>
  <line x1="32" y1="26" x2="32" y2="46" stroke="#64748b" stroke-width="2"/>
  <circle cx="24" cy="28" r="2" fill="#f8fafc"/>
  <circle cx="40" cy="28" r="2" fill="#f8fafc"/>
</svg>`)

const WORM = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M12 40 C20 28, 28 48, 36 32 C44 18, 52 42, 58 36" stroke="#f472b6" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>`)

const BACTERIA = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="32" rx="18" ry="10" fill="#a3e635" stroke="#65a30d" stroke-width="2"/>
  <circle cx="24" cy="30" r="2" fill="#365314"/>
  <circle cx="34" cy="34" r="2" fill="#365314"/>
  <circle cx="42" cy="30" r="1.5" fill="#365314"/>
</svg>`)

const GOAT = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="40" rx="16" ry="12" fill="#e7e5e4"/>
  <ellipse cx="46" cy="30" rx="8" ry="7" fill="#e7e5e4"/>
  <path d="M42 24 L38 12 M48 24 L52 12" stroke="#78716c" stroke-width="2"/>
  <circle cx="50" cy="28" r="1.8" fill="#1e293b"/>
  <rect x="22" y="48" width="4" height="10" fill="#a8a29e"/>
  <rect x="38" y="48" width="4" height="10" fill="#a8a29e"/>
</svg>`)

const GRASSHOPPER = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="34" cy="36" rx="16" ry="8" fill="#84cc16"/>
  <circle cx="48" cy="32" r="6" fill="#65a30d"/>
  <circle cx="50" cy="30" r="1.5" fill="#1e293b"/>
  <path d="M20 40 Q10 20 16 12" stroke="#4d7c0f" stroke-width="3" fill="none"/>
  <path d="M28 42 L18 52" stroke="#365314" stroke-width="2"/>
</svg>`)

const EAGLE = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="34" rx="11" ry="9" fill="#78716c"/>
  <path d="M4 38 Q32 8 60 38 Q32 26 4 38" fill="#a8a29e"/>
  <circle cx="38" cy="32" r="2.2" fill="#1e293b"/>
  <path d="M40 36 L50 42" stroke="#f59e0b" stroke-width="2.5"/>
  <path d="M26 28 L22 18 L30 22" fill="#e7e5e4"/>
</svg>`)

const PHYTO = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="24" cy="28" r="8" fill="#4ade80"/>
  <circle cx="38" cy="36" r="10" fill="#22c55e"/>
  <circle cx="30" cy="44" r="7" fill="#86efac"/>
  <circle cx="44" cy="24" r="6" fill="#16a34a"/>
</svg>`)

const ICONS: Record<string, string> = {
  rabbit: RABBIT,
  fox: FOX,
  grass: GRASS,
  tree: TREE,
  deer: DEER,
  hawk: HAWK,
  frog: FROG,
  snake: SNAKE,
  fungi: FUNGI,
  factory: FACTORY,
  earth: EARTH,
  sun: SUN,
  cow: COW,
  mouse: MOUSE,
  bird: BIRD,
  bush: BUSH,
  algae: ALGAE,
  beetle: BEETLE,
  earthworm: WORM,
  bacteria: BACTERIA,
  goat: GOAT,
  grasshopper: GRASSHOPPER,
  eagle: EAGLE,
  phytoplankton: PHYTO,
  prey: RABBIT,
  predator: FOX,
  producer: GRASS,
  herbivore: RABBIT,
  carnivore: FOX,
  decomposer: FUNGI,
}

export function ecologyIconKey(name: string): string {
  const key = name.trim().toLowerCase().replace(/\s+/g, '')
  if (ICONS[key]) return key
  if (key.includes('rabbit')) return 'rabbit'
  if (key.includes('fox')) return 'fox'
  if (key.includes('tree')) return 'tree'
  if (key.includes('grass')) return 'grass'
  if (key.includes('deer')) return 'deer'
  if (key.includes('hawk') || key.includes('eagle')) return key.includes('eagle') ? 'eagle' : 'hawk'
  if (key.includes('frog')) return 'frog'
  if (key.includes('snake')) return 'snake'
  if (key.includes('fung')) return 'fungi'
  if (key.includes('factory')) return 'factory'
  if (key.includes('mouse')) return 'mouse'
  if (key.includes('bird')) return 'bird'
  if (key.includes('bush')) return 'bush'
  if (key.includes('algae')) return 'algae'
  if (key.includes('beetle')) return 'beetle'
  if (key.includes('worm')) return 'earthworm'
  if (key.includes('bacteria')) return 'bacteria'
  if (key.includes('goat')) return 'goat'
  if (key.includes('hopper')) return 'grasshopper'
  if (key.includes('phyto')) return 'phytoplankton'
  if (key.includes('cow') || key.includes('animal')) return 'cow'
  return 'grass'
}

export function createEcologyIcon(nameOrKey: string, size = 36): Image {
  const key = ecologyIconKey(nameOrKey)
  const img = new Image(ICONS[key] ?? GRASS, {
    maxWidth: size,
    maxHeight: size,
    pickable: false,
  })
  img.centerX = 0
  img.centerY = 0
  return img
}

export function createLabeledEcologyIcon(name: string, size = 40): Node {
  const node = new Node({ pickable: false })
  node.addChild(createEcologyIcon(name, size))
  return node
}
