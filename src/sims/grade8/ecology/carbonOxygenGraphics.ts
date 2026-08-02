/**
 * Polished canvas graphics for the Carbon–Oxygen Cycle React sim:
 * friendly SVG agents, animated landscape, continuous glowing gas emission.
 */

function svgUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const TREE_SVG = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="58" rx="14" ry="4" fill="#000" opacity="0.18"/>
  <rect x="28" y="40" width="8" height="18" rx="2" fill="#92400e"/>
  <circle cx="32" cy="28" r="18" fill="#16a34a"/>
  <circle cx="22" cy="32" r="10" fill="#15803d"/>
  <circle cx="42" cy="30" r="11" fill="#22c55e"/>
  <circle cx="32" cy="18" r="9" fill="#4ade80"/>
</svg>`)

const COW_SVG = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="56" rx="14" ry="3.5" fill="#000" opacity="0.16"/>
  <ellipse cx="32" cy="38" rx="18" ry="14" fill="#f8fafc" stroke="#64748b" stroke-width="1.5"/>
  <ellipse cx="20" cy="34" rx="5" ry="4" fill="#1e293b"/>
  <ellipse cx="40" cy="42" rx="6" ry="5" fill="#1e293b"/>
  <ellipse cx="48" cy="28" rx="9" ry="8" fill="#f8fafc" stroke="#64748b" stroke-width="1"/>
  <circle cx="52" cy="26" r="2" fill="#1e293b"/>
  <ellipse cx="50" cy="32" rx="4" ry="2.5" fill="#fda4af"/>
  <rect x="22" y="48" width="5" height="10" rx="1" fill="#64748b"/>
  <rect x="38" y="48" width="5" height="10" rx="1" fill="#64748b"/>
</svg>`)

const DEER_SVG = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="34" cy="56" rx="12" ry="3" fill="#000" opacity="0.16"/>
  <ellipse cx="34" cy="40" rx="16" ry="12" fill="#b45309"/>
  <ellipse cx="48" cy="30" rx="8" ry="7" fill="#b45309"/>
  <path d="M44 24 L40 10 M44 24 L48 8 M50 24 L54 10" stroke="#78350f" stroke-width="2" fill="none"/>
  <circle cx="52" cy="28" r="1.8" fill="#1e293b"/>
  <rect x="24" y="48" width="4" height="10" rx="1" fill="#92400e"/>
  <rect x="40" y="48" width="4" height="10" rx="1" fill="#92400e"/>
</svg>`)

const FACTORY_SVG = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <ellipse cx="32" cy="58" rx="22" ry="4" fill="#000" opacity="0.18"/>
  <rect x="8" y="28" width="40" height="28" rx="2" fill="#64748b"/>
  <rect x="40" y="16" width="10" height="40" rx="1" fill="#94a3b8"/>
  <rect x="14" y="34" width="8" height="8" rx="1" fill="#38bdf8"/>
  <rect x="28" y="34" width="8" height="8" rx="1" fill="#38bdf8"/>
  <rect x="14" y="46" width="8" height="6" rx="1" fill="#0f172a" opacity="0.35"/>
  <rect x="28" y="46" width="8" height="6" rx="1" fill="#0f172a" opacity="0.35"/>
</svg>`)

const FUNGI_SVG = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M16 36 Q32 12 48 36 Z" fill="#ef4444"/>
  <ellipse cx="32" cy="36" rx="16" ry="5" fill="#fca5a5"/>
  <rect x="28" y="36" width="8" height="16" rx="2" fill="#fef3c7"/>
  <circle cx="24" cy="28" r="2" fill="#fff"/>
  <circle cx="36" cy="24" r="2.5" fill="#fff"/>
</svg>`)

function loadImg(src: string): HTMLImageElement {
  const img = new Image()
  img.src = src
  return img
}

const art = {
  tree: loadImg(TREE_SVG),
  cow: loadImg(COW_SVG),
  deer: loadImg(DEER_SVG),
  factory: loadImg(FACTORY_SVG),
  fungi: loadImg(FUNGI_SVG),
}

export type GasKind = 'co2' | 'o2'
export type GasSource = 'photo' | 'respire' | 'decay' | 'burn' | 'ocean' | 'oceanOut'

export type GasParticle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  kind: GasKind
  size: number
  showLabel: boolean
  wobble: number
  phase: number
  source: GasSource
}

export type EmitAcc = {
  photo: number
  respire: number
  decay: number
  burn: number
  ocean: number
}

export function createEmitAcc(): EmitAcc {
  return { photo: 0, respire: 0, decay: 0, burn: 0, ocean: 0 }
}

type Pt = { x: number; y: number }

function pick<T>(arr: T[]): T | null {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null
}

function spawn(
  particles: GasParticle[],
  x: number,
  y: number,
  kind: GasKind,
  source: GasSource,
  opts?: Partial<Pick<GasParticle, 'vx' | 'vy' | 'life' | 'size'>>,
) {
  const life = opts?.life ?? 1.15 + Math.random() * 0.45
  particles.push({
    x,
    y,
    vx: opts?.vx ?? (Math.random() - 0.5) * 18,
    vy: opts?.vy ?? -28 - Math.random() * 36,
    life,
    maxLife: life,
    kind,
    size: opts?.size ?? 4.5 + Math.random() * 2.5,
    showLabel: Math.random() < 0.35,
    wobble: 8 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2,
    source,
  })
}

/** Continuous emission: accumulate rate × dt, spawn whole molecules. */
export function emitGases(
  particles: GasParticle[],
  acc: EmitAcc,
  dt: number,
  time: number,
  isDay: boolean,
  rates: {
    photosynthesis: number
    respiration: number
    decomposition: number
    combustion: number
    oceanAbsorb: number
  },
  emitters: { plants: Pt[]; animals: Pt[]; factories: Pt[] },
  scene: { w: number; h: number; oceanW: number },
) {
  const speed = Math.max(0.4, Math.min(2.2, dt * 55))

  if (isDay && rates.photosynthesis > 0.08 && emitters.plants.length) {
    acc.photo += rates.photosynthesis * dt * 2.4 * speed
    while (acc.photo >= 1) {
      acc.photo -= 1
      const src = pick(emitters.plants)
      if (!src) break
      const sway = Math.sin(time * 2.2 + src.x * 0.05) * 4
      spawn(particles, src.x + sway + (Math.random() - 0.5) * 14, src.y - 30, 'o2', 'photo', {
        vx: (Math.random() - 0.5) * 14,
        vy: -26 - Math.random() * 40,
        size: 5 + Math.random() * 3,
      })
    }
  }

  if (rates.respiration > 0.08 && emitters.animals.length) {
    acc.respire += rates.respiration * dt * 2.8 * speed
    while (acc.respire >= 1) {
      acc.respire -= 1
      const src = pick(emitters.animals)
      if (!src) break
      const breathe = Math.sin(time * 3.4 + src.x) * 2
      spawn(particles, src.x + 10 + breathe, src.y - 18, 'co2', 'respire', {
        vx: (Math.random() - 0.5) * 12,
        vy: -16 - Math.random() * 22,
        size: 4.2 + Math.random() * 2,
      })
    }
  }

  // Mild plant respiration
  if (rates.respiration > 0.1 && emitters.plants.length && Math.random() < rates.respiration * 0.08 * speed) {
    const src = pick(emitters.plants)
    if (src) {
      spawn(particles, src.x, src.y - 10, 'co2', 'respire', {
        vx: (Math.random() - 0.5) * 8,
        vy: -10 - Math.random() * 12,
        life: 0.85,
        size: 3.5,
      })
    }
  }

  if (rates.decomposition > 0.1) {
    acc.decay += rates.decomposition * dt * 2.2 * speed
    while (acc.decay >= 1) {
      acc.decay -= 1
      spawn(
        particles,
        scene.w * (0.38 + Math.random() * 0.28),
        scene.h * 0.86 + Math.random() * 10,
        'co2',
        'decay',
        {
          vx: (Math.random() - 0.5) * 10,
          vy: -12 - Math.random() * 16,
          size: 4 + Math.random() * 2,
        },
      )
    }
  }

  if (rates.combustion > 0.1 && emitters.factories.length) {
    acc.burn += rates.combustion * dt * 2.6 * speed
    while (acc.burn >= 1) {
      acc.burn -= 1
      const src = pick(emitters.factories)
      if (!src) break
      spawn(particles, src.x + 8 + (Math.random() - 0.5) * 6, src.y - 52, 'co2', 'burn', {
        vx: (Math.random() - 0.5) * 16 + 4,
        vy: -24 - Math.random() * 34,
        life: 1.4,
        size: 5.5 + Math.random() * 3,
      })
    }
  }

  if (rates.oceanAbsorb > 0.1) {
    acc.ocean += rates.oceanAbsorb * dt * 3.2 * speed
    while (acc.ocean >= 1) {
      acc.ocean -= 1
      spawn(
        particles,
        Math.random() * scene.oceanW,
        scene.h * 0.18 + Math.random() * 50,
        'co2',
        'ocean',
        {
          vx: (Math.random() - 0.5) * 6,
          vy: 18 + Math.random() * 22,
          life: 1.35,
          size: 4.5 + Math.random() * 2,
        },
      )
      if (Math.random() < 0.35) {
        spawn(
          particles,
          Math.random() * scene.oceanW * 0.9,
          scene.h * 0.78,
          'o2',
          'oceanOut',
          {
            vx: (Math.random() - 0.5) * 5,
            vy: -6 - Math.random() * 8,
            life: 0.8,
            size: 3.5,
          },
        )
      }
    }
  }

  while (particles.length > 220) particles.shift()
}

export function stepAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: GasParticle[],
  dt: number,
  _time: number,
  h: number,
) {
  const waterTop = h * 0.72
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.phase += dt * 3
    p.x += (p.vx + Math.sin(p.phase) * p.wobble * 0.15) * dt
    p.y += p.vy * dt
    // Soft drag / float
    p.vx *= 1 - dt * 0.15
    if (p.source === 'ocean') {
      p.vy += dt * 6
    } else if (p.kind === 'o2') {
      p.vy *= 1 - dt * 0.08
    } else {
      p.vy *= 1 - dt * 0.05
    }
    p.life -= dt * 0.42
    if (p.source === 'ocean' && p.y > waterTop) p.life -= dt * 0.9
    if (p.life <= 0 || p.y < -30 || p.y > h + 20) {
      particles.splice(i, 1)
      continue
    }

    const t = p.life / p.maxLife
    const alpha = Math.max(0, Math.min(1, t))
    const sinking = p.source === 'ocean'
    const r = p.size * (0.75 + 0.35 * t)
    const core =
      sinking
        ? [56, 189, 248]
        : p.kind === 'o2'
          ? [46, 204, 113]
          : [231, 76, 60]

    // Soft glow
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2)
    glow.addColorStop(0, `rgba(${core[0]},${core[1]},${core[2]},${0.55 * alpha})`)
    glow.addColorStop(0.45, `rgba(${core[0]},${core[1]},${core[2]},${0.22 * alpha})`)
    glow.addColorStop(1, `rgba(${core[0]},${core[1]},${core[2]},0)`)
    ctx.beginPath()
    ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2)
    ctx.fillStyle = glow
    ctx.fill()

    // Core bubble
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${core[0]},${core[1]},${core[2]},${0.85 * alpha})`
    ctx.fill()
    ctx.beginPath()
    ctx.arc(p.x - r * 0.28, p.y - r * 0.28, r * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${0.45 * alpha})`
    ctx.fill()

    if (p.showLabel && alpha > 0.35) {
      ctx.font = `700 ${Math.max(9, r * 1.6)}px Roboto, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`
      ctx.fillText(p.kind === 'o2' ? 'O₂' : 'CO₂', p.x, p.y - r - 8)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
  }
}

type Cloud = { x: number; y: number; scale: number; speed: number }

export function makeClouds(): Cloud[] {
  return [
    { x: 0.12, y: 0.1, scale: 1, speed: 0.018 },
    { x: 0.42, y: 0.16, scale: 0.8, speed: 0.012 },
    { x: 0.72, y: 0.11, scale: 1.2, speed: 0.015 },
    { x: 0.9, y: 0.2, scale: 0.65, speed: 0.01 },
  ]
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number) {
  ctx.fillStyle = `rgba(255,255,255,${a})`
  ctx.beginPath()
  ctx.ellipse(x, y, 22 * s, 12 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x - 16 * s, y + 2 * s, 14 * s, 10 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 18 * s, y + 1 * s, 16 * s, 11 * s, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 4 * s, y - 8 * s, 12 * s, 10 * s, 0, 0, Math.PI * 2)
  ctx.fill()
}

export function drawLandscape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  isDay: boolean,
  sunlight: number,
  clouds: Cloud[],
  oceanW: number,
  groundY: number,
) {
  const blend = isDay ? 0.28 + (sunlight / 100) * 0.72 : 0.05
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  if (isDay) {
    sky.addColorStop(0, `rgb(${Math.round(90 + 50 * blend)},${Math.round(160 + 40 * blend)},${Math.round(220)})`)
    sky.addColorStop(0.55, `rgb(${Math.round(140 + 40 * blend)},${Math.round(190 + 20 * blend)},${Math.round(230)})`)
    sky.addColorStop(1, `rgb(${Math.round(180 + 30 * blend)},${Math.round(210)},${Math.round(170 + 20 * blend)})`)
  } else {
    sky.addColorStop(0, '#0b1220')
    sky.addColorStop(0.5, '#152238')
    sky.addColorStop(1, '#1e3a2f')
  }
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // Stars at night
  if (!isDay) {
    for (let i = 0; i < 28; i++) {
      const sx = ((i * 97) % w) + Math.sin(time * 0.3 + i) * 2
      const sy = ((i * 53) % (h * 0.45)) + 8
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 2 + i))
      ctx.beginPath()
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${tw})`
      ctx.fill()
    }
  }

  // Sun / moon
  const orbX = w * 0.42
  const orbY = h * 0.13
  if (isDay) {
    const pulse = 1 + Math.sin(time * 1.6) * 0.04
    const glow = ctx.createRadialGradient(orbX, orbY, 8, orbX, orbY, 70 * pulse)
    glow.addColorStop(0, 'rgba(255,220,80,0.85)')
    glow.addColorStop(0.35, 'rgba(255,200,60,0.35)')
    glow.addColorStop(1, 'rgba(255,180,40,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(orbX, orbY, 70 * pulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(orbX, orbY, 26 * pulse, 0, Math.PI * 2)
    ctx.fillStyle = '#facc15'
    ctx.fill()
    // Rays
    ctx.strokeStyle = 'rgba(250,204,21,0.45)'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + time * 0.35
      const r0 = 34 * pulse
      const r1 = 48 * pulse + Math.sin(time * 2 + i) * 3
      ctx.beginPath()
      ctx.moveTo(orbX + Math.cos(a) * r0, orbY + Math.sin(a) * r0)
      ctx.lineTo(orbX + Math.cos(a) * r1, orbY + Math.sin(a) * r1)
      ctx.stroke()
    }
  } else {
    ctx.beginPath()
    ctx.arc(orbX, orbY, 16, 0, Math.PI * 2)
    ctx.fillStyle = '#e8eef8'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(orbX + 6, orbY - 2, 14, 0, Math.PI * 2)
    ctx.fillStyle = '#0b1220'
    ctx.fill()
  }

  // Clouds
  for (const c of clouds) {
    c.x += c.speed * (isDay ? 1 : 0.4) * 0.016
    if (c.x > 1.3) c.x = -0.3
    drawCloud(ctx, c.x * w, c.y * h, c.scale, isDay ? 0.55 : 0.12)
  }

  // Distant hills
  ctx.fillStyle = isDay ? 'rgba(74,122,90,0.55)' : 'rgba(30,55,42,0.7)'
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.quadraticCurveTo(w * 0.18, groundY - 52, w * 0.36, groundY - 28)
  ctx.quadraticCurveTo(w * 0.55, groundY - 70, w * 0.78, groundY - 32)
  ctx.quadraticCurveTo(w * 0.92, groundY - 48, w, groundY - 22)
  ctx.lineTo(w, groundY)
  ctx.closePath()
  ctx.fill()

  // Ocean with animated waves
  const oceanGrad = ctx.createLinearGradient(0, h * 0.58, 0, h)
  oceanGrad.addColorStop(0, isDay ? '#38bdf8' : '#0369a1')
  oceanGrad.addColorStop(0.45, isDay ? '#0ea5e9' : '#075985')
  oceanGrad.addColorStop(1, isDay ? '#0369a1' : '#0c4a6e')
  ctx.fillStyle = oceanGrad
  ctx.beginPath()
  ctx.moveTo(0, h * 0.62)
  for (let x = 0; x <= oceanW + 20; x += 8) {
    const y = h * 0.62 + Math.sin(time * 2.2 + x * 0.08) * 3.5 + Math.sin(time * 1.1 + x * 0.04) * 2
    ctx.lineTo(x, y)
  }
  ctx.lineTo(oceanW + 20, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()

  // Wave highlights
  ctx.strokeStyle = isDay ? 'rgba(255,255,255,0.35)' : 'rgba(125,211,252,0.25)'
  ctx.lineWidth = 1.5
  for (let row = 0; row < 3; row++) {
    ctx.beginPath()
    const base = h * (0.68 + row * 0.06)
    for (let x = 0; x <= oceanW; x += 6) {
      const y = base + Math.sin(time * 2.8 + x * 0.1 + row) * 2.5
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Land / meadow
  const landGrad = ctx.createLinearGradient(0, groundY - 10, 0, h)
  landGrad.addColorStop(0, isDay ? '#86b05a' : '#3d5c32')
  landGrad.addColorStop(0.35, isDay ? '#5a8f3d' : '#2f4a28')
  landGrad.addColorStop(1, isDay ? '#3f6b2a' : '#243820')
  ctx.fillStyle = landGrad
  ctx.beginPath()
  ctx.moveTo(oceanW - 16, groundY + 8)
  ctx.quadraticCurveTo(oceanW + 40, groundY - 6, oceanW + 90, groundY)
  ctx.lineTo(w, groundY)
  ctx.lineTo(w, h)
  ctx.lineTo(oceanW - 16, h)
  ctx.closePath()
  ctx.fill()

  // Grass blades near foreground
  ctx.strokeStyle = isDay ? 'rgba(34,100,40,0.45)' : 'rgba(20,60,30,0.5)'
  ctx.lineWidth = 1.4
  ctx.lineCap = 'round'
  for (let i = 0; i < 40; i++) {
    const gx = oceanW + 20 + ((i * 47) % (w - oceanW - 40))
    const gy = h * 0.78 + ((i * 19) % 40)
    const sway = Math.sin(time * 2.4 + i) * 3
    ctx.beginPath()
    ctx.moveTo(gx, gy)
    ctx.quadraticCurveTo(gx + sway, gy - 10, gx + sway * 1.4, gy - 18)
    ctx.stroke()
  }

  // Soil patch for decay
  ctx.fillStyle = isDay ? 'rgba(120,72,40,0.55)' : 'rgba(70,42,24,0.65)'
  ctx.beginPath()
  ctx.ellipse(w * 0.52, h * 0.88, w * 0.12, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  if (art.fungi.complete) {
    ctx.drawImage(art.fungi, w * 0.48 - 14, h * 0.84 - 18, 28, 28)
    ctx.drawImage(art.fungi, w * 0.54 - 10, h * 0.86 - 14, 22, 22)
  }
}

export function drawAgent(
  ctx: CanvasRenderingContext2D,
  kind: 'plant' | 'animal' | 'factory',
  x: number,
  y: number,
  time: number,
  id: string,
  rates: { photosynthesis: number; respiration: number; combustion: number },
  isDay: boolean,
) {
  const seed = id.length + id.charCodeAt(0)
  if (kind === 'plant') {
    const sway = Math.sin(time * 2.1 + seed) * 2.5
    const pulse = rates.photosynthesis > 0.3 && isDay ? 1 + Math.sin(time * 3 + seed) * 0.04 : 1
    if (rates.photosynthesis > 0.3 && isDay) {
      const g = ctx.createRadialGradient(x, y - 22, 4, x, y - 22, 36)
      g.addColorStop(0, 'rgba(74,222,128,0.35)')
      g.addColorStop(1, 'rgba(74,222,128,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x + sway, y - 22, 36, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.save()
    ctx.translate(x + sway, y)
    ctx.scale(pulse, pulse)
    if (art.tree.complete) ctx.drawImage(art.tree, -28, -56, 56, 56)
    ctx.restore()
  } else if (kind === 'animal') {
    const bob = Math.sin(time * 3.2 + seed) * 2.2
    const breathe = 1 + Math.sin(time * 2.6 + seed) * 0.03
    if (rates.respiration > 0.15) {
      const g = ctx.createRadialGradient(x + 8, y - 16 + bob, 2, x + 8, y - 16 + bob, 22)
      g.addColorStop(0, 'rgba(248,113,113,0.28)')
      g.addColorStop(1, 'rgba(248,113,113,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x + 8, y - 16 + bob, 22, 0, Math.PI * 2)
      ctx.fill()
    }
    const img = seed % 2 === 0 ? art.deer : art.cow
    ctx.save()
    ctx.translate(x, y + bob)
    ctx.scale(breathe, breathe)
    if (img.complete) ctx.drawImage(img, -26, -48, 52, 52)
    ctx.restore()
  } else {
    const shake = rates.combustion > 0.2 ? Math.sin(time * 18) * 0.6 : 0
    if (rates.combustion > 0.15) {
      const g = ctx.createRadialGradient(x + 8, y - 48, 2, x + 8, y - 48, 28)
      g.addColorStop(0, 'rgba(148,163,184,0.35)')
      g.addColorStop(1, 'rgba(148,163,184,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x + 8 + shake, y - 48, 28, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.save()
    ctx.translate(x + shake, y)
    if (art.factory.complete) ctx.drawImage(art.factory, -30, -58, 60, 60)
    // Animated smoke puffs from stack
    if (rates.combustion > 0.1) {
      for (let p = 0; p < 4; p++) {
        const t = (time * 0.7 + p * 0.35) % 1.4
        const px = 10 + Math.sin(time + p) * 4 + t * 10
        const py = -52 - t * 28
        const pr = 4 + t * 8
        ctx.beginPath()
        ctx.arc(px, py, pr, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(70,70,80,${(0.45 - t * 0.28) * Math.min(1, rates.combustion / 4)})`
        ctx.fill()
      }
    }
    ctx.restore()
  }
}
