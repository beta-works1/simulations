import { GAS_TINT, HEAT_TINT } from './previewModel'

function hexToRgb(hex: string) {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

/** Same gas-to-heat colour shift the WebGL scene does, in plain CSS terms. */
function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const k = Math.min(1, Math.max(0, t))
  return `rgb(${Math.round(r1 + (r2 - r1) * k)}, ${Math.round(g1 + (g2 - g1) * k)}, ${Math.round(
    b1 + (b2 - b1) * k,
  )})`
}

const DOTS = 18

/**
 * Stand-in for the WebGL globe, used when WebGL is unavailable or the visitor
 * prefers reduced motion. Same composition and palette as the 3D scene, so the
 * hero never shows a dead frame or a different-looking design.
 */
export function PreviewScene2D({ co2, animated }: { co2: number; animated: boolean }) {
  const blanket = mix(GAS_TINT, HEAT_TINT, co2 * 0.7)
  const haloOpacity = 0.35 + co2 * 0.5

  return (
    <svg
      className="preview-svg"
      viewBox="0 0 320 320"
      role="img"
      aria-label="Earth wrapped in a layer of greenhouse gas"
    >
      <defs>
        <radialGradient id="hero-ocean" cx="34%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#2a86ad" />
          <stop offset="62%" stopColor="#1c6d94" />
          <stop offset="100%" stopColor="#124b6c" />
        </radialGradient>
        <radialGradient id="hero-shade" cx="32%" cy="26%" r="88%">
          <stop offset="48%" stopColor="#04101c" stopOpacity="0" />
          <stop offset="100%" stopColor="#04101c" stopOpacity="0.8" />
        </radialGradient>
        {/* soft limb glow, the flat equivalent of the fresnel rim in the 3D scene */}
        <radialGradient id="hero-halo" cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor={blanket} stopOpacity="0" />
          <stop offset="76%" stopColor={blanket} stopOpacity="0.28" />
          <stop offset="86%" stopColor={blanket} stopOpacity="0.6" />
          <stop offset="100%" stopColor={blanket} stopOpacity="0" />
        </radialGradient>
        <clipPath id="hero-globe-clip">
          <circle cx="160" cy="160" r="84" />
        </clipPath>
      </defs>

      <circle cx="160" cy="160" r="116" fill="url(#hero-halo)" opacity={haloOpacity} />

      <g className={animated ? 'preview-gas-dots is-drifting' : 'preview-gas-dots'}>
        {Array.from({ length: DOTS }, (_, i) => {
          const angle = (i / DOTS) * Math.PI * 2
          const r = i % 3 === 0 ? 92 : i % 3 === 1 ? 101 : 110
          return (
            <circle
              key={i}
              cx={160 + Math.cos(angle) * r}
              cy={160 + Math.sin(angle) * r}
              r={1.4 + (i % 3) * 0.6}
              fill="#bae6fd"
              opacity={0.2 + co2 * 0.55}
            />
          )
        })}
      </g>

      <circle cx="160" cy="160" r="84" fill="url(#hero-ocean)" />

      <g clipPath="url(#hero-globe-clip)">
        {/* continents, drawn to echo the low-poly land masses in the 3D scene */}
        <path
          d="M104 112 q30 -18 58 -2 q26 16 12 42 q-14 26 -46 22 q-30 -4 -32 -30 q-2 -20 8 -32 z"
          fill="#22c55e"
        />
        <path d="M108 104 q22 -14 46 -4 q-18 10 -46 12 z" fill="#4d7c0f" opacity="0.85" />
        <path
          d="M186 100 q30 -4 40 20 q8 20 -14 28 q-26 8 -36 -12 q-6 -20 10 -36 z"
          fill="#15803d"
        />
        <path
          d="M124 198 q28 -12 48 6 q16 16 -4 30 q-28 18 -48 -4 q-10 -16 4 -32 z"
          fill="#22c55e"
        />
        <path d="M204 176 q22 6 22 26 q-2 18 -22 16 q-18 -4 -16 -24 q2 -16 16 -18 z" fill="#d98c4a" />
        <path d="M96 168 q16 -8 26 4 q6 12 -8 16 q-16 4 -22 -8 q-2 -8 4 -12 z" fill="#4d7c0f" />
        {/* ice caps */}
        <ellipse cx="160" cy="80" rx="46" ry="14" fill="#e4eef4" opacity="0.9" />
        <ellipse cx="160" cy="242" rx="40" ry="12" fill="#e4eef4" opacity="0.82" />
      </g>

      <circle cx="160" cy="160" r="84" fill="url(#hero-shade)" />
    </svg>
  )
}
