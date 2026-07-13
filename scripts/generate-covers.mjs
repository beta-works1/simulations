/**
 * Generates a unique, topic-relevant cover SVG for each simulation.
 * Run: node scripts/generate-covers.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = path.join(root, 'src/data/simulations.ts')
const data = fs.readFileSync(dataPath, 'utf8')

const entries = []
const blockRe =
  /\{\s*id:\s*'([^']+)',\s*title:\s*(['"])([\s\S]*?)\2[\s\S]*?color:\s*'([^']+)',\s*accent:\s*'([^']+)'/g
let m
while ((m = blockRe.exec(data))) {
  entries.push({ id: m[1], title: m[3], color: m[4], accent: m[5] })
}

/** Unique scene artwork (viewBox content for inset 0 0 200 120). */
const scenes = {
  'shapes-and-colors': `
    <rect x="30" y="35" width="40" height="40" rx="4" fill="#f1c40f"/>
    <circle cx="115" cy="55" r="22" fill="#e74c3c"/>
    <polygon points="155,80 175,35 195,80" fill="#3498db"/>
    <rect x="55" y="85" width="36" height="20" fill="#2ecc71"/>`,

  'counting-1-to-20': `
    <text x="40" y="70" font-size="36" font-weight="700" fill="#fff" font-family="Arial">1</text>
    <text x="85" y="70" font-size="36" font-weight="700" fill="#f4d03f" font-family="Arial">2</text>
    <text x="130" y="70" font-size="36" font-weight="700" fill="#fff" font-family="Arial">3</text>
    <circle cx="50" cy="95" r="6" fill="#2ecc71"/><circle cx="95" cy="95" r="6" fill="#2ecc71"/>
    <circle cx="140" cy="95" r="6" fill="#2ecc71"/><circle cx="162" cy="95" r="6" fill="#2ecc71"/>`,

  'plant-life': `
    <rect x="88" y="70" width="24" height="40" fill="#8B5A2B"/>
    <ellipse cx="100" cy="55" rx="36" ry="28" fill="#27ae60"/>
    <ellipse cx="70" cy="70" rx="18" ry="12" fill="#2ecc71"/>
    <ellipse cx="130" cy="70" rx="18" ry="12" fill="#2ecc71"/>
    <circle cx="55" cy="100" r="4" fill="#f1c40f"/><circle cx="145" cy="105" r="3" fill="#f1c40f"/>`,

  'fraction-matcher': `
    <circle cx="70" cy="60" r="32" fill="#fff" opacity="0.2"/>
    <path d="M70 28 A32 32 0 0 1 70 92 L70 60 Z" fill="#f39c12"/>
    <path d="M70 28 A32 32 0 0 0 70 92 L70 60 Z" fill="#8e44ad"/>
    <text x="130" y="55" fill="#fff" font-size="22" font-family="Arial" font-weight="700">1/2</text>
    <text x="130" y="85" fill="#f4d03f" font-size="22" font-family="Arial" font-weight="700">2/4</text>`,

  'balancing-act': `
    <line x1="30" y1="70" x2="170" y2="70" stroke="#fff" stroke-width="4"/>
    <polygon points="100,70 90,100 110,100" fill="#3498db"/>
    <rect x="40" y="45" width="28" height="22" fill="#f1c40f"/>
    <rect x="135" y="50" width="22" height="18" fill="#e74c3c"/>
    <circle cx="100" cy="70" r="5" fill="#fff"/>`,

  'build-an-atom': `
    <circle cx="100" cy="60" r="10" fill="#e74c3c"/>
    <ellipse cx="100" cy="60" rx="55" ry="22" fill="none" stroke="#5dade2" stroke-width="2.5"/>
    <ellipse cx="100" cy="60" rx="22" ry="50" fill="none" stroke="#58d68d" stroke-width="2.5" transform="rotate(60 100 60)"/>
    <circle cx="155" cy="60" r="5" fill="#5dade2"/>
    <circle cx="100" cy="15" r="5" fill="#58d68d"/>
    <circle cx="78" cy="95" r="5" fill="#f4d03f"/>`,

  'circuit-construction': `
    <rect x="25" y="40" width="22" height="40" rx="3" fill="#f1c40f"/>
    <text x="29" y="65" font-size="10" fill="#000" font-family="Arial">+</text>
    <path d="M47 60 H75 M75 45 V75 M85 45 V75 M85 60 H115" stroke="#fff" stroke-width="3" fill="none"/>
    <circle cx="135" cy="60" r="18" fill="none" stroke="#f4d03f" stroke-width="3"/>
    <path d="M128 60h14M135 53v14" stroke="#f4d03f" stroke-width="2"/>
    <path d="M153 60 H175" stroke="#fff" stroke-width="3"/>
    <rect x="175" y="50" width="12" height="20" fill="#95a5a6"/>`,

  'projectile-motion': `
    <path d="M30 95 Q100 10 180 95" fill="none" stroke="#f5a623" stroke-width="3" stroke-dasharray="6 4"/>
    <circle cx="30" cy="95" r="8" fill="#e74c3c"/>
    <circle cx="100" cy="28" r="7" fill="#fff"/>
    <circle cx="170" cy="88" r="7" fill="#5dade2"/>
    <line x1="20" y1="100" x2="185" y2="100" stroke="#fff" stroke-width="2" opacity="0.5"/>`,

  'ph-scale': `
    <defs>
      <linearGradient id="ph" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#e74c3c"/><stop offset="50%" stop-color="#f1c40f"/>
        <stop offset="100%" stop-color="#3498db"/>
      </linearGradient>
    </defs>
    <rect x="25" y="50" width="150" height="28" rx="8" fill="url(#ph)"/>
    <text x="35" y="70" fill="#fff" font-size="12" font-family="Arial" font-weight="700">Acid</text>
    <text x="130" y="70" fill="#fff" font-size="12" font-family="Arial" font-weight="700">Base</text>
    <polygon points="100,40 108,50 92,50" fill="#fff"/>
    <text x="88" y="100" fill="#f4d03f" font-size="16" font-family="Arial" font-weight="700">pH 7</text>`,

  'graphing-lines': `
    <line x1="35" y1="95" x2="35" y2="20" stroke="#fff" stroke-width="2"/>
    <line x1="35" y1="95" x2="175" y2="95" stroke="#fff" stroke-width="2"/>
    <line x1="35" y1="80" x2="160" y2="30" stroke="#5dade2" stroke-width="3"/>
    <circle cx="90" cy="58" r="5" fill="#f39c12"/>
    <text x="145" y="28" fill="#f4d03f" font-size="14" font-family="Arial">y=mx+b</text>`,

  'gravity-and-orbits': `
    <circle cx="100" cy="60" r="18" fill="#f5b041"/>
    <ellipse cx="100" cy="60" rx="70" ry="35" fill="none" stroke="#5dade2" stroke-width="2" stroke-dasharray="4 3"/>
    <circle cx="165" cy="60" r="8" fill="#3498db"/>
    <circle cx="155" cy="52" r="3" fill="#bdc3c7"/>`,

  'natural-selection': `
    <ellipse cx="55" cy="75" rx="22" ry="14" fill="#8e44ad"/>
    <ellipse cx="100" cy="70" rx="20" ry="12" fill="#27ae60"/>
    <ellipse cx="145" cy="78" rx="18" ry="11" fill="#8e44ad" opacity="0.55"/>
    <path d="M40 40 Q55 20 70 40" stroke="#f39c12" stroke-width="2" fill="none"/>
    <text x="75" y="105" fill="#fff" font-size="11" font-family="Arial">traits survive</text>`,

  'carbon-oxygen-cycle': `
    <circle cx="100" cy="30" r="16" fill="#5dade2"/>
    <text x="90" y="35" fill="#fff" font-size="11" font-family="Arial">Air</text>
    <rect x="40" y="75" width="40" height="30" fill="#27ae60"/>
    <text x="48" y="95" fill="#fff" font-size="10" font-family="Arial">Plant</text>
    <circle cx="150" cy="90" r="18" fill="#e67e22"/>
    <text x="138" y="95" fill="#fff" font-size="10" font-family="Arial">Animal</text>
    <path d="M100 46 L60 75" stroke="#2ecc71" stroke-width="2" marker-end="url(#arrow)"/>
    <path d="M100 46 L150 75" stroke="#e74c3c" stroke-width="2"/>
    <path d="M80 90 L132 90" stroke="#f4d03f" stroke-width="2"/>
    <text x="70" y="60" fill="#a3e4d7" font-size="10" font-family="Arial">O₂</text>
    <text x="125" y="60" fill="#f5b7b1" font-size="10" font-family="Arial">CO₂</text>`,

  'food-web-builder': `
    <rect x="80" y="20" width="40" height="18" rx="3" fill="#27ae60"/>
    <text x="88" y="33" fill="#fff" font-size="9" font-family="Arial">Grass</text>
    <rect x="30" y="55" width="40" height="18" rx="3" fill="#f39c12"/>
    <text x="38" y="68" fill="#fff" font-size="9" font-family="Arial">Rabbit</text>
    <rect x="130" y="55" width="40" height="18" rx="3" fill="#e67e22"/>
    <text x="140" y="68" fill="#fff" font-size="9" font-family="Arial">Mouse</text>
    <rect x="80" y="90" width="40" height="18" rx="3" fill="#c0392b"/>
    <text x="90" y="103" fill="#fff" font-size="9" font-family="Arial">Fox</text>
    <path d="M100 38 L50 55 M100 38 L150 55 M50 73 L100 90 M150 73 L100 90" stroke="#fff" stroke-width="1.5" opacity="0.8"/>`,

  'ecological-pyramid': `
    <polygon points="100,20 160,100 40,100" fill="none" stroke="#fff" stroke-width="2"/>
    <line x1="55" y1="75" x2="145" y2="75" stroke="#f39c12" stroke-width="2"/>
    <line x1="70" y1="50" x2="130" y2="50" stroke="#e74c3c" stroke-width="2"/>
    <text x="85" y="40" fill="#fff" font-size="9" font-family="Arial">10%</text>
    <text x="78" y="68" fill="#f4d03f" font-size="9" font-family="Arial">Energy</text>
    <text x="72" y="95" fill="#2ecc71" font-size="9" font-family="Arial">Producers</text>`,

  'predator-prey': `
    <path d="M30 80 C50 30 80 100 100 50 C120 20 150 90 175 55" fill="none" stroke="#e74c3c" stroke-width="2.5"/>
    <path d="M30 90 C55 50 85 110 110 70 C130 40 155 95 175 75" fill="none" stroke="#5dade2" stroke-width="2.5"/>
    <text x="35" y="25" fill="#e74c3c" font-size="11" font-family="Arial">Predator</text>
    <text x="120" y="25" fill="#5dade2" font-size="11" font-family="Arial">Prey</text>
    <line x1="25" y1="105" x2="180" y2="105" stroke="#fff" opacity="0.4"/>`,

  'global-warming': `
    <circle cx="100" cy="65" r="28" fill="#3498db"/>
    <path d="M75 50 Q90 45 100 55 Q110 40 125 50" fill="#27ae60"/>
    <path d="M55 65 Q40 40 60 25" stroke="#f39c12" stroke-width="2" fill="none"/>
    <path d="M145 65 Q160 40 140 25" stroke="#f39c12" stroke-width="2" fill="none"/>
    <path d="M70 85 Q100 100 130 85" stroke="#e74c3c" stroke-width="3" fill="none"/>
    <text x="60" y="115" fill="#e74c3c" font-size="11" font-family="Arial">trapped heat (IR)</text>`,

  'reflex-arc': `
    <circle cx="40" cy="60" r="12" fill="#f5b041"/>
    <text x="33" y="64" fill="#000" font-size="9" font-family="Arial">S</text>
    <path d="M52 60 H90" stroke="#fff" stroke-width="3"/>
    <rect x="90" y="45" width="30" height="30" rx="4" fill="#9b59b6"/>
    <text x="96" y="64" fill="#fff" font-size="9" font-family="Arial">SC</text>
    <path d="M120 60 H155" stroke="#fff" stroke-width="3"/>
    <rect x="155" y="48" width="28" height="24" rx="3" fill="#e74c3c"/>
    <text x="160" y="64" fill="#fff" font-size="9" font-family="Arial">M</text>
    <text x="50" y="100" fill="#ddd" font-size="10" font-family="Arial">stimulus → reflex → action</text>`,

  'neuron-signal': `
    <circle cx="35" cy="60" r="16" fill="#9b59b6"/>
    <path d="M50 60 C80 40 110 80 145 60 L175 60" stroke="#5dade2" stroke-width="4" fill="none"/>
    <circle cx="80" cy="48" r="5" fill="#f4d03f"/>
    <circle cx="115" cy="72" r="5" fill="#f4d03f"/>
    <circle cx="150" cy="58" r="5" fill="#f4d03f"/>
    <text x="55" y="100" fill="#fff" font-size="11" font-family="Arial">impulse along axon →</text>`,

  'brain-mapping': `
    <ellipse cx="100" cy="58" rx="55" ry="40" fill="#c39bd3"/>
    <path d="M55 55 Q100 20 145 55" stroke="#6c3483" stroke-width="2" fill="none"/>
    <path d="M60 70 Q100 95 140 70" stroke="#6c3483" stroke-width="2" fill="none"/>
    <circle cx="75" cy="50" r="6" fill="#f4d03f"/>
    <circle cx="115" cy="45" r="6" fill="#5dade2"/>
    <circle cx="100" cy="75" r="6" fill="#e74c3c"/>
    <text x="55" y="112" fill="#fff" font-size="10" font-family="Arial">click regions → functions</text>`,

  'mitosis-meiosis': `
    <circle cx="55" cy="55" r="28" fill="none" stroke="#5dade2" stroke-width="2"/>
    <line x1="55" y1="35" x2="55" y2="75" stroke="#e74c3c" stroke-width="3"/>
    <line x1="40" y1="55" x2="70" y2="55" stroke="#f4d03f" stroke-width="3"/>
    <circle cx="145" cy="40" r="18" fill="none" stroke="#58d68d" stroke-width="2"/>
    <circle cx="145" cy="78" r="18" fill="none" stroke="#58d68d" stroke-width="2"/>
    <text x="35" y="105" fill="#5dade2" font-size="10" font-family="Arial">Mitosis</text>
    <text x="125" y="105" fill="#58d68d" font-size="10" font-family="Arial">Meiosis</text>`,

  'dna-chromosome-gene': `
    <path d="M50 25 C70 45 70 65 50 95" stroke="#5dade2" stroke-width="4" fill="none"/>
    <path d="M90 25 C70 45 70 65 90 95" stroke="#e74c3c" stroke-width="4" fill="none"/>
    <line x1="55" y1="40" x2="85" y2="40" stroke="#f4d03f" stroke-width="2"/>
    <line x1="55" y1="55" x2="85" y2="55" stroke="#f4d03f" stroke-width="2"/>
    <line x1="55" y1="70" x2="85" y2="70" stroke="#58d68d" stroke-width="3"/>
    <line x1="55" y1="85" x2="85" y2="85" stroke="#f4d03f" stroke-width="2"/>
    <rect x="115" y="50" width="55" height="22" rx="4" fill="#58d68d"/>
    <text x="125" y="65" fill="#000" font-size="11" font-family="Arial" font-weight="700">GENE</text>`,

  'punnett-square': `
    <rect x="50" y="25" width="100" height="80" fill="none" stroke="#fff" stroke-width="2"/>
    <line x1="100" y1="25" x2="100" y2="105" stroke="#fff" stroke-width="2"/>
    <line x1="50" y1="65" x2="150" y2="65" stroke="#fff" stroke-width="2"/>
    <text x="65" y="50" fill="#f39c12" font-size="16" font-family="Arial" font-weight="700">Aa</text>
    <text x="115" y="50" fill="#f39c12" font-size="16" font-family="Arial" font-weight="700">Aa</text>
    <text x="65" y="90" fill="#5dade2" font-size="16" font-family="Arial" font-weight="700">Aa</text>
    <text x="115" y="90" fill="#27ae60" font-size="16" font-family="Arial" font-weight="700">aa</text>`,

  'plasmid-insertion': `
    <circle cx="70" cy="60" r="28" fill="none" stroke="#58d68d" stroke-width="4"/>
    <path d="M70 32 A28 28 0 0 1 95 75" stroke="#f4d03f" stroke-width="5" fill="none"/>
    <rect x="120" y="40" width="50" height="40" rx="8" fill="#1abc9c" opacity="0.8"/>
    <circle cx="145" cy="60" r="10" fill="#0e6655"/>
    <path d="M98 70 L120 60" stroke="#f4d03f" stroke-width="2"/>
    <text x="55" y="110" fill="#fff" font-size="10" font-family="Arial">plasmid → bacterium</text>`,

  'fermentation': `
    <path d="M70 30 h40 v15 l18 50 a28 28 0 0 1 -76 0 l18 -50 z" fill="#f4d03f" opacity="0.85"/>
    <rect x="82" y="22" width="16" height="12" fill="#fff"/>
    <circle cx="85" cy="75" r="4" fill="#fff" opacity="0.7"/>
    <circle cx="100" cy="85" r="5" fill="#fff" opacity="0.6"/>
    <circle cx="130" cy="40" r="6" fill="#85c1e9" opacity="0.8"/>
    <circle cx="150" cy="55" r="8" fill="#85c1e9" opacity="0.6"/>
    <text x="125" y="100" fill="#fff" font-size="11" font-family="Arial">CO₂ ↑</text>`,

  'laws-of-reflection': `
    <line x1="20" y1="95" x2="180" y2="95" stroke="#85c1e9" stroke-width="5"/>
    <line x1="100" y1="20" x2="100" y2="95" stroke="#fff" stroke-width="2" stroke-dasharray="5 4"/>
    <line x1="35" y1="35" x2="100" y2="95" stroke="#f4d03f" stroke-width="3"/>
    <line x1="165" y1="35" x2="100" y2="95" stroke="#5dade2" stroke-width="3"/>
    <text x="40" y="55" fill="#f4d03f" font-size="12" font-family="Arial">i</text>
    <text x="150" y="55" fill="#5dade2" font-size="12" font-family="Arial">r</text>
    <text x="55" y="115" fill="#fff" font-size="11" font-family="Arial">∠i = ∠r</text>`,

  'regular-vs-diffuse': `
    <line x1="20" y1="50" x2="90" y2="50" stroke="#bdc3c7" stroke-width="4"/>
    <line x1="30" y1="25" x2="30" y2="50" stroke="#f4d03f" stroke-width="2"/>
    <line x1="50" y1="25" x2="50" y2="50" stroke="#f4d03f" stroke-width="2"/>
    <line x1="70" y1="25" x2="70" y2="50" stroke="#f4d03f" stroke-width="2"/>
    <line x1="30" y1="50" x2="30" y2="75" stroke="#5dade2" stroke-width="2"/>
    <line x1="50" y1="50" x2="50" y2="75" stroke="#5dade2" stroke-width="2"/>
    <line x1="70" y1="50" x2="70" y2="75" stroke="#5dade2" stroke-width="2"/>
    <path d="M115 55 L175 45 L125 60 L170 70 L120 72 Z" fill="none" stroke="#bdc3c7" stroke-width="3"/>
    <line x1="125" y1="25" x2="130" y2="55" stroke="#f4d03f" stroke-width="2"/>
    <line x1="145" y1="25" x2="150" y2="50" stroke="#f4d03f" stroke-width="2"/>
    <line x1="130" y1="55" x2="120" y2="85" stroke="#5dade2" stroke-width="2"/>
    <line x1="150" y1="50" x2="175" y2="80" stroke="#5dade2" stroke-width="2"/>
    <text x="30" y="100" fill="#fff" font-size="9" font-family="Arial">regular</text>
    <text x="130" y="100" fill="#fff" font-size="9" font-family="Arial">diffuse</text>`,

  'plane-mirror-periscope': `
    <rect x="95" y="20" width="10" height="90" fill="#7f8c8d"/>
    <line x1="95" y1="35" x2="55" y2="55" stroke="#85c1e9" stroke-width="3"/>
    <line x1="105" y1="35" x2="145" y2="55" stroke="#85c1e9" stroke-width="3"/>
    <line x1="55" y1="55" x2="55" y2="95" stroke="#f4d03f" stroke-width="2"/>
    <line x1="145" y1="55" x2="145" y2="95" stroke="#5dade2" stroke-width="2"/>
    <polygon points="50,95 55,80 60,95" fill="#e74c3c"/>
    <text x="40" y="115" fill="#fff" font-size="10" font-family="Arial">periscope mirrors</text>`,

  'refraction-media': `
    <rect x="20" y="20" width="160" height="40" fill="#85c1e9" opacity="0.35"/>
    <rect x="20" y="60" width="160" height="50" fill="#1abc9c" opacity="0.45"/>
    <text x="130" y="45" fill="#fff" font-size="10" font-family="Arial">air</text>
    <text x="125" y="90" fill="#fff" font-size="10" font-family="Arial">water</text>
    <line x1="40" y1="25" x2="90" y2="60" stroke="#f4d03f" stroke-width="3"/>
    <line x1="90" y1="60" x2="130" y2="105" stroke="#f39c12" stroke-width="3"/>
    <line x1="90" y1="20" x2="90" y2="110" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3"/>`,

  'rainbow-dispersion': `
    <circle cx="55" cy="60" r="28" fill="#85c1e9" opacity="0.45" stroke="#fff" stroke-width="2"/>
    <line x1="20" y1="50" x2="45" y2="55" stroke="#fff" stroke-width="3"/>
    <line x1="75" y1="45" x2="160" y2="30" stroke="#e74c3c" stroke-width="2"/>
    <line x1="78" y1="52" x2="165" y2="48" stroke="#f39c12" stroke-width="2"/>
    <line x1="80" y1="58" x2="168" y2="62" stroke="#f1c40f" stroke-width="2"/>
    <line x1="78" y1="65" x2="165" y2="75" stroke="#2ecc71" stroke-width="2"/>
    <line x1="75" y1="72" x2="160" y2="90" stroke="#3498db" stroke-width="2"/>
    <line x1="72" y1="78" x2="150" y2="100" stroke="#9b59b6" stroke-width="2"/>`,

  'curved-mirrors': `
    <path d="M130 20 Q70 60 130 100" fill="none" stroke="#85c1e9" stroke-width="5"/>
    <line x1="40" y1="60" x2="130" y2="60" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 3"/>
    <line x1="50" y1="40" x2="115" y2="55" stroke="#f4d03f" stroke-width="2"/>
    <line x1="50" y1="80" x2="115" y2="65" stroke="#f4d03f" stroke-width="2"/>
    <polygon points="50,35 50,85 42,60" fill="#e74c3c"/>
    <text x="95" y="55" fill="#f4d03f" font-size="10" font-family="Arial">F</text>
    <text x="35" y="110" fill="#fff" font-size="10" font-family="Arial">concave / convex</text>`,

  'ohm-law-circuit': `
    <rect x="30" y="45" width="24" height="40" rx="3" fill="#f1c40f"/>
    <text x="36" y="70" font-size="12" fill="#000" font-family="Arial">V</text>
    <path d="M54 65 H85" stroke="#fff" stroke-width="3"/>
    <path d="M85 50 v30 M95 50 v30 M90 65 H120" stroke="#fff" stroke-width="2.5" fill="none"/>
    <text x="82" y="95" fill="#ec7063" font-size="11" font-family="Arial">R</text>
    <circle cx="145" cy="65" r="16" fill="#f4d03f" opacity="0.9"/>
    <path d="M120 65 H129 M161 65 H175 V100 H30 V65 H30" stroke="#fff" stroke-width="2.5" fill="none"/>
    <text x="60" y="30" fill="#fff" font-size="14" font-family="Arial" font-weight="700">I = V / R</text>`,

  'series-parallel': `
    <text x="40" y="28" fill="#f39c12" font-size="11" font-family="Arial">series</text>
    <path d="M30 45 H80 M80 35 V55 M90 35 V55 M90 45 H140" stroke="#fff" stroke-width="2" fill="none"/>
    <circle cx="55" cy="45" r="7" fill="#f4d03f"/><circle cx="115" cy="45" r="7" fill="#f4d03f"/>
    <text x="40" y="78" fill="#5dade2" font-size="11" font-family="Arial">parallel</text>
    <path d="M40 95 H70 V85 H110 V95 H150 M70 95 V105 H110 V95" stroke="#fff" stroke-width="2" fill="none"/>
    <circle cx="90" cy="85" r="6" fill="#58d68d"/><circle cx="90" cy="105" r="6" fill="#58d68d"/>`,

  'short-circuit-fuse': `
    <path d="M30 60 H70" stroke="#fff" stroke-width="3"/>
    <rect x="70" y="48" width="40" height="24" rx="4" fill="#e74c3c"/>
    <text x="78" y="65" fill="#fff" font-size="11" font-family="Arial" font-weight="700">FUSE</text>
    <path d="M110 60 H160" stroke="#fff" stroke-width="3"/>
    <path d="M85 40 L95 55 L88 55 L100 75 L90 58 L98 58 Z" fill="#f4d03f"/>
    <text x="45" y="100" fill="#ec7063" font-size="12" font-family="Arial">overload → blows</text>`,

  'electric-motor': `
    <rect x="55" y="35" width="20" height="50" rx="3" fill="#e74c3c"/>
    <rect x="125" y="35" width="20" height="50" rx="3" fill="#3498db"/>
    <text x="60" y="65" fill="#fff" font-size="14" font-family="Arial">N</text>
    <text x="130" y="65" fill="#fff" font-size="14" font-family="Arial">S</text>
    <rect x="85" y="45" width="30" height="30" rx="2" fill="#f39c12" transform="rotate(25 100 60)"/>
    <circle cx="100" cy="60" r="5" fill="#fff"/>
    <path d="M100 25 A35 35 0 0 1 130 45" stroke="#f4d03f" stroke-width="2" fill="none"/>
    <text x="55" y="110" fill="#fff" font-size="10" font-family="Arial">current → rotation</text>`,

  'speaker-mechanism': `
    <rect x="40" y="40" width="30" height="40" fill="#7f8c8d"/>
    <circle cx="55" cy="60" r="10" fill="#e74c3c"/>
    <path d="M70 40 Q100 20 100 60 Q100 100 70 80" fill="#bdc3c7" stroke="#fff" stroke-width="2"/>
    <path d="M115 40 Q145 60 115 80" fill="none" stroke="#5dade2" stroke-width="2"/>
    <path d="M125 30 Q165 60 125 90" fill="none" stroke="#5dade2" stroke-width="2" opacity="0.7"/>
    <path d="M135 22 Q180 60 135 98" fill="none" stroke="#5dade2" stroke-width="2" opacity="0.45"/>
    <text x="40" y="115" fill="#fff" font-size="10" font-family="Arial">coil + diaphragm → sound</text>`,

  'solar-cooker': `
    <path d="M30 95 Q100 15 170 95" fill="none" stroke="#f39c12" stroke-width="5"/>
    <path d="M40 30 L95 70" stroke="#f9e79f" stroke-width="2"/>
    <path d="M55 20 L98 68" stroke="#f9e79f" stroke-width="2"/>
    <path d="M145 25 L105 68" stroke="#f9e79f" stroke-width="2"/>
    <path d="M160 35 L108 72" stroke="#f9e79f" stroke-width="2"/>
    <circle cx="100" cy="22" r="12" fill="#f1c40f"/>
    <rect x="88" y="68" width="24" height="18" fill="#7f8c8d"/>
    <ellipse cx="100" cy="68" rx="14" ry="4" fill="#95a5a6"/>`,

  'wind-turbine': `
    <rect x="95" y="55" width="10" height="55" fill="#bdc3c7"/>
    <circle cx="100" cy="55" r="8" fill="#ecf0f1"/>
    <line x1="100" y1="55" x2="100" y2="15" stroke="#fff" stroke-width="5"/>
    <line x1="100" y1="55" x2="140" y2="75" stroke="#fff" stroke-width="5"/>
    <line x1="100" y1="55" x2="60" y2="75" stroke="#fff" stroke-width="5"/>
    <path d="M25 40 Q40 35 35 50" stroke="#85c1e9" stroke-width="2" fill="none"/>
    <path d="M30 55 Q50 48 42 65" stroke="#85c1e9" stroke-width="2" fill="none"/>
    <text x="125" y="40" fill="#f4d03f" font-size="12" font-family="Arial">kW</text>`,

  'star-life-cycle': `
    <circle cx="35" cy="60" r="14" fill="#9b59b6" opacity="0.7"/>
    <circle cx="75" cy="55" r="12" fill="#f5b041"/>
    <circle cx="115" cy="50" r="18" fill="#e74c3c"/>
    <circle cx="160" cy="60" r="8" fill="#ecf0f1"/>
    <path d="M48 60 L63 55 M87 52 L100 50 M132 52 L152 58" stroke="#fff" stroke-width="1.5" opacity="0.6"/>
    <text x="25" y="95" fill="#bbb" font-size="8" font-family="Arial">nebula</text>
    <text x="60" y="95" fill="#bbb" font-size="8" font-family="Arial">star</text>
    <text x="100" y="95" fill="#bbb" font-size="8" font-family="Arial">giant</text>
    <text x="145" y="95" fill="#bbb" font-size="8" font-family="Arial">dwarf</text>`,

  'galaxy-types': `
    <ellipse cx="50" cy="55" rx="28" ry="14" fill="none" stroke="#a569bd" stroke-width="2"/>
    <circle cx="50" cy="55" r="6" fill="#f5b041"/>
    <path d="M30 50 Q50 40 70 55 Q50 70 30 58" stroke="#d2b4de" stroke-width="1.5" fill="none"/>
    <ellipse cx="115" cy="55" rx="20" ry="24" fill="#7d3c98" opacity="0.8"/>
    <circle cx="165" cy="45" r="3" fill="#fff"/><circle cx="155" cy="60" r="2" fill="#fff"/>
    <circle cx="175" cy="70" r="2.5" fill="#f4d03f"/><circle cx="160" cy="75" r="2" fill="#fff"/>
    <text x="30" y="100" fill="#fff" font-size="8" font-family="Arial">spiral</text>
    <text x="95" y="100" fill="#fff" font-size="8" font-family="Arial">elliptical</text>
    <text x="150" y="100" fill="#fff" font-size="8" font-family="Arial">irregular</text>`,

  'black-hole': `
    <!-- accretion disk -->
    <ellipse cx="100" cy="62" rx="70" ry="18" fill="none" stroke="#f39c12" stroke-width="6" opacity="0.85"/>
    <ellipse cx="100" cy="62" rx="55" ry="12" fill="none" stroke="#e74c3c" stroke-width="4" opacity="0.7"/>
    <!-- event horizon -->
    <circle cx="100" cy="60" r="22" fill="#000"/>
    <circle cx="100" cy="60" r="22" fill="none" stroke="#5dade2" stroke-width="2" opacity="0.5"/>
    <!-- light bending -->
    <path d="M25 40 Q70 55 25 75" fill="none" stroke="#85c1e9" stroke-width="2"/>
    <path d="M175 35 Q130 55 175 80" fill="none" stroke="#85c1e9" stroke-width="2"/>
    <path d="M20 55 Q60 60 20 65" fill="none" stroke="#f4d03f" stroke-width="1.5"/>
    <circle cx="22" cy="40" r="3" fill="#fff"/>
    <circle cx="178" cy="35" r="3" fill="#fff"/>
    <text x="55" y="105" fill="#5dade2" font-size="10" font-family="Arial">light bends near horizon</text>`,

  'solar-system-timeline': `
    <line x1="25" y1="60" x2="175" y2="60" stroke="#58d68d" stroke-width="3"/>
    <circle cx="40" cy="60" r="7" fill="#f5b041"/>
    <circle cx="85" cy="60" r="7" fill="#3498db"/>
    <circle cx="130" cy="60" r="7" fill="#e67e22"/>
    <circle cx="165" cy="60" r="7" fill="#9b59b6"/>
    <text x="28" y="40" fill="#bbb" font-size="8" font-family="Arial">4.6 By</text>
    <text x="75" y="40" fill="#bbb" font-size="8" font-family="Arial">life</text>
    <text x="118" y="40" fill="#bbb" font-size="8" font-family="Arial">Apollo</text>
    <text x="155" y="40" fill="#bbb" font-size="8" font-family="Arial">JWST</text>
    <path d="M150 75 l10 8 l-4 0 l8 12 l-14 -10 z" fill="#ecf0f1"/>`,
}

function wrapCover(entry, scene) {
  const label = entry.title.length > 30 ? `${entry.title.slice(0, 28)}…` : entry.title
  const safe = label.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="340" viewBox="0 0 520 340">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${entry.color}"/>
      <stop offset="100%" stop-color="${entry.accent}"/>
    </linearGradient>
  </defs>
  <rect width="520" height="340" rx="16" fill="url(#bg)"/>
  <rect x="16" y="14" width="488" height="250" rx="12" fill="rgba(0,0,0,0.28)"/>
  <svg x="60" y="40" width="400" height="200" viewBox="0 0 200 120">
    ${scene}
  </svg>
  <text x="260" y="305" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="20" font-weight="700" fill="#ffffff">${safe}</text>
</svg>
`
}

const dir = path.join(root, 'public/covers')
fs.mkdirSync(dir, { recursive: true })

let custom = 0
for (const e of entries) {
  const scene = scenes[e.id]
  if (!scene) {
    console.warn('No custom scene for', e.id)
    continue
  }
  fs.writeFileSync(path.join(dir, `${e.id}.svg`), wrapCover(e, scene))
  custom++
}
console.log(`Wrote ${custom}/${entries.length} unique topic covers`)
