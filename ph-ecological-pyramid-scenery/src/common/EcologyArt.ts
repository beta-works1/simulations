/**
 * Friendly Class-8 ecology icons + circular pfp avatars (inline SVG → Image).
 */
import { Circle, Image, Node } from 'scenerystack/scenery'

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Circular profile-picture style avatar with soft tinted background. */
function pfp(bg: string, art: string): string {
  return svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="32" fill="${bg}"/>
  ${art}
</svg>`)
}

const RABBIT = pfp(
  '#fef9c3',
  `<ellipse cx="22" cy="14" rx="7" ry="16" fill="#f8fafc"/><ellipse cx="42" cy="14" rx="7" ry="16" fill="#f8fafc"/>
   <ellipse cx="22" cy="14" rx="3.5" ry="10" fill="#fda4af"/><ellipse cx="42" cy="14" rx="3.5" ry="10" fill="#fda4af"/>
   <circle cx="32" cy="38" r="18" fill="#f8fafc"/>
   <circle cx="25" cy="36" r="2.8" fill="#1e293b"/><circle cx="39" cy="36" r="2.8" fill="#1e293b"/>
   <ellipse cx="32" cy="44" rx="4" ry="3" fill="#fda4af"/>
   <circle cx="26" cy="35" r="1" fill="#fff"/><circle cx="40" cy="35" r="1" fill="#fff"/>`,
)

const FOX = pfp(
  '#ffedd5',
  `<path d="M12 22 L22 6 L28 26 Z" fill="#ea580c"/><path d="M52 22 L42 6 L36 26 Z" fill="#ea580c"/>
   <path d="M12 22 L22 6 L24 24 Z" fill="#fecaca"/><path d="M52 22 L42 6 L40 24 Z" fill="#fecaca"/>
   <circle cx="32" cy="36" r="18" fill="#ea580c"/>
   <path d="M18 42 L32 52 L46 42 Z" fill="#ffedd5"/>
   <circle cx="25" cy="34" r="2.8" fill="#1e293b"/><circle cx="39" cy="34" r="2.8" fill="#1e293b"/>
   <ellipse cx="32" cy="42" rx="4" ry="2.5" fill="#1e293b"/>
   <circle cx="26" cy="33" r="1" fill="#fff"/><circle cx="40" cy="33" r="1" fill="#fff"/>`,
)

const GRASS = pfp(
  '#dcfce7',
  `<ellipse cx="32" cy="52" rx="28" ry="10" fill="#86efac"/>
   <path d="M14 48 Q16 18 12 6" stroke="#166534" stroke-width="4" fill="none" stroke-linecap="round"/>
   <path d="M24 50 Q26 14 22 4" stroke="#22c55e" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="M32 50 Q34 10 32 2" stroke="#15803d" stroke-width="5.5" fill="none" stroke-linecap="round"/>
   <path d="M40 50 Q38 14 42 4" stroke="#22c55e" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="M50 48 Q48 20 52 8" stroke="#166534" stroke-width="4" fill="none" stroke-linecap="round"/>
   <circle cx="20" cy="28" r="3.5" fill="#facc15"/><circle cx="44" cy="24" r="3.5" fill="#f472b6"/>`,
)

const TREE = pfp(
  '#dcfce7',
  `<rect x="28" y="40" width="8" height="18" rx="2" fill="#92400e"/>
   <circle cx="32" cy="26" r="18" fill="#16a34a"/><circle cx="20" cy="32" r="11" fill="#15803d"/>
   <circle cx="44" cy="30" r="12" fill="#22c55e"/><circle cx="32" cy="16" r="10" fill="#4ade80"/>`,
)

const DEER = pfp(
  '#ffedd5',
  `<path d="M22 18 L18 4 M26 18 L28 2 M38 18 L36 2 M42 18 L46 4" stroke="#78350f" stroke-width="2.5" fill="none"/>
   <circle cx="32" cy="36" r="18" fill="#b45309"/>
   <circle cx="25" cy="34" r="2.5" fill="#1e293b"/><circle cx="39" cy="34" r="2.5" fill="#1e293b"/>
   <ellipse cx="32" cy="44" rx="5" ry="3" fill="#78350f"/>`,
)

const HAWK = pfp(
  '#fee2e2',
  `<path d="M6 38 Q32 10 58 38 Q32 28 6 38" fill="#a8a29e"/>
   <circle cx="32" cy="36" r="14" fill="#78716c"/>
   <circle cx="38" cy="34" r="2.5" fill="#1e293b"/>
   <path d="M40 38 L50 44" stroke="#f59e0b" stroke-width="3"/>`,
)

const FROG = pfp(
  '#dcfce7',
  `<circle cx="32" cy="36" r="20" fill="#22c55e"/>
   <circle cx="20" cy="24" r="8" fill="#4ade80"/><circle cx="44" cy="24" r="8" fill="#4ade80"/>
   <circle cx="20" cy="24" r="3.5" fill="#1e293b"/><circle cx="44" cy="24" r="3.5" fill="#1e293b"/>
   <ellipse cx="32" cy="44" rx="7" ry="3.5" fill="#15803d"/>`,
)

const SNAKE = pfp(
  '#ecfccb',
  `<path d="M12 40 C22 18, 30 50, 40 26 C48 10, 54 42, 58 34" stroke="#84cc16" stroke-width="9" fill="none" stroke-linecap="round"/>
   <circle cx="54" cy="32" r="7" fill="#65a30d"/><circle cx="56" cy="30" r="2" fill="#1e293b"/>`,
)

const FUNGI = pfp(
  '#f3e8ff',
  `<path d="M12 38 Q32 8 52 38 Z" fill="#ef4444"/>
   <ellipse cx="32" cy="38" rx="20" ry="6" fill="#fca5a5"/>
   <rect x="27" y="38" width="10" height="18" rx="3" fill="#fef3c7"/>
   <circle cx="22" cy="28" r="2.5" fill="#fff"/><circle cx="36" cy="22" r="3" fill="#fff"/>`,
)

const FACTORY = pfp(
  '#e2e8f0',
  `<rect x="8" y="28" width="40" height="28" fill="#64748b"/><rect x="40" y="14" width="12" height="42" fill="#94a3b8"/>
   <rect x="14" y="34" width="8" height="8" fill="#38bdf8"/><rect x="28" y="34" width="8" height="8" fill="#38bdf8"/>
   <path d="M46 14 Q54 6 60 2" stroke="#94a3b8" stroke-width="4" fill="none"/>`,
)

const EARTH = pfp(
  '#e0f2fe',
  `<circle cx="32" cy="32" r="24" fill="#38bdf8"/>
   <path d="M18 24 Q28 20 34 28 Q40 36 28 40 Q16 38 18 24" fill="#22c55e"/>
   <path d="M40 18 Q50 22 48 34 Q44 42 38 36 Q36 24 40 18" fill="#16a34a"/>`,
)

const SUN = pfp(
  '#fef9c3',
  `<circle cx="32" cy="32" r="14" fill="#facc15"/>
   <g stroke="#fbbf24" stroke-width="3" stroke-linecap="round">
     <line x1="32" y1="6" x2="32" y2="14"/><line x1="32" y1="50" x2="32" y2="58"/>
     <line x1="6" y1="32" x2="14" y2="32"/><line x1="50" y1="32" x2="58" y2="32"/>
     <line x1="12" y1="12" x2="18" y2="18"/><line x1="46" y1="46" x2="52" y2="52"/>
     <line x1="52" y1="12" x2="46" y2="18"/><line x1="12" y1="52" x2="18" y2="46"/>
   </g>`,
)

const COW = pfp(
  '#f1f5f9',
  `<circle cx="32" cy="36" r="18" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
   <ellipse cx="22" cy="32" rx="5" ry="4" fill="#1e293b"/><ellipse cx="40" cy="40" rx="6" ry="5" fill="#1e293b"/>
   <circle cx="26" cy="34" r="2.2" fill="#1e293b"/><circle cx="38" cy="34" r="2.2" fill="#1e293b"/>
   <ellipse cx="32" cy="44" rx="5" ry="3" fill="#fda4af"/>`,
)

const MOUSE = pfp(
  '#f5f5f4',
  `<circle cx="18" cy="22" r="8" fill="#d6d3d1"/><circle cx="46" cy="22" r="8" fill="#d6d3d1"/>
   <circle cx="32" cy="36" r="18" fill="#a8a29e"/>
   <circle cx="26" cy="34" r="2.5" fill="#1e293b"/><circle cx="38" cy="34" r="2.5" fill="#1e293b"/>
   <ellipse cx="32" cy="44" rx="4" ry="2.5" fill="#fda4af"/>`,
)

const BIRD = pfp(
  '#e0f2fe',
  `<path d="M8 38 Q32 14 56 38 Q32 30 8 38" fill="#0ea5e9"/>
   <circle cx="34" cy="36" r="14" fill="#38bdf8"/>
   <circle cx="40" cy="34" r="2.5" fill="#1e293b"/>
   <path d="M42 38 L52 42" stroke="#f59e0b" stroke-width="3"/>`,
)

const BUSH = pfp(
  '#dcfce7',
  `<circle cx="22" cy="36" r="16" fill="#15803d"/><circle cx="42" cy="34" r="18" fill="#16a34a"/>
   <circle cx="32" cy="42" r="14" fill="#22c55e"/>
   <circle cx="26" cy="28" r="3.5" fill="#f472b6"/><circle cx="42" cy="26" r="3" fill="#facc15"/>`,
)

const ALGAE = pfp(
  '#ecfeff',
  `<ellipse cx="32" cy="48" rx="24" ry="10" fill="#7dd3fc"/>
   <path d="M18 48 Q16 24 22 10" stroke="#4ade80" stroke-width="5" fill="none"/>
   <path d="M32 48 Q34 18 30 6" stroke="#22c55e" stroke-width="6" fill="none"/>
   <path d="M46 48 Q48 26 44 12" stroke="#86efac" stroke-width="5" fill="none"/>`,
)

const BEETLE = pfp(
  '#f1f5f9',
  `<ellipse cx="32" cy="36" rx="18" ry="14" fill="#1e293b"/>
   <ellipse cx="32" cy="36" rx="15" ry="11" fill="#334155"/>
   <line x1="32" y1="24" x2="32" y2="48" stroke="#64748b" stroke-width="2"/>
   <circle cx="24" cy="28" r="2.5" fill="#f8fafc"/><circle cx="40" cy="28" r="2.5" fill="#f8fafc"/>`,
)

const WORM = pfp(
  '#fce7f3',
  `<path d="M10 40 C20 22, 28 50, 38 28 C46 12, 52 44, 58 36" stroke="#f472b6" stroke-width="8" fill="none" stroke-linecap="round"/>`,
)

const BACTERIA = pfp(
  '#ecfccb',
  `<ellipse cx="32" cy="32" rx="20" ry="12" fill="#a3e635" stroke="#65a30d" stroke-width="2"/>
   <circle cx="22" cy="30" r="2.5" fill="#365314"/><circle cx="34" cy="34" r="2.5" fill="#365314"/>
   <circle cx="44" cy="30" r="2" fill="#365314"/>`,
)

const GOAT = pfp(
  '#f5f5f4',
  `<path d="M22 20 L18 6 M42 20 L46 6" stroke="#78716c" stroke-width="2.5"/>
   <circle cx="32" cy="36" r="18" fill="#e7e5e4"/>
   <circle cx="25" cy="34" r="2.4" fill="#1e293b"/><circle cx="39" cy="34" r="2.4" fill="#1e293b"/>
   <ellipse cx="32" cy="44" rx="4" ry="2.5" fill="#a8a29e"/>`,
)

const GRASSHOPPER = pfp(
  '#ecfccb',
  `<ellipse cx="34" cy="36" rx="18" ry="10" fill="#84cc16"/>
   <circle cx="48" cy="30" r="8" fill="#65a30d"/><circle cx="50" cy="28" r="2" fill="#1e293b"/>
   <path d="M18 40 Q8 18 14 8" stroke="#4d7c0f" stroke-width="3.5" fill="none"/>`,
)

const EAGLE = pfp(
  '#fee2e2',
  `<path d="M4 40 Q32 8 60 40 Q32 26 4 40" fill="#a8a29e"/>
   <circle cx="32" cy="36" r="14" fill="#78716c"/>
   <path d="M24 26 L20 14 L30 20" fill="#e7e5e4"/>
   <circle cx="38" cy="34" r="2.5" fill="#1e293b"/>
   <path d="M40 38 L52 46" stroke="#f59e0b" stroke-width="3"/>`,
)

const PHYTO = pfp(
  '#ecfccb',
  `<circle cx="22" cy="28" r="10" fill="#4ade80"/><circle cx="40" cy="36" r="12" fill="#22c55e"/>
   <circle cx="30" cy="44" r="8" fill="#86efac"/><circle cx="44" cy="22" r="7" fill="#16a34a"/>`,
)

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
  // Re-center whenever bounds resolve (data-URI images often start empty).
  const center = () => {
    if (img.localBounds.isEmpty()) return
    img.centerX = 0
    img.centerY = 0
  }
  center()
  img.localBoundsProperty.link(center)
  return img
}

/** Circular avatar with a perfectly matched ring (same local origin). */
export function createEcologyAvatar(nameOrKey: string, radius: number, ringColor = 'rgba(255,255,255,0.75)'): {
  root: Node
  ring: Circle
} {
  const size = radius * 2
  const root = new Node({ pickable: false })
  const img = createEcologyIcon(nameOrKey, size)
  const ring = new Circle(radius, {
    fill: null,
    stroke: ringColor,
    lineWidth: 2.5,
    centerX: 0,
    centerY: 0,
    pickable: false,
  })
  root.addChild(img)
  root.addChild(ring)
  // Keep image locked to ring center after load
  img.localBoundsProperty.link(() => {
    if (!img.localBounds.isEmpty()) {
      img.centerX = 0
      img.centerY = 0
    }
  })
  return { root, ring }
}

export function createLabeledEcologyIcon(name: string, size = 40): Node {
  const node = new Node({ pickable: false })
  node.addChild(createEcologyIcon(name, size))
  return node
}
