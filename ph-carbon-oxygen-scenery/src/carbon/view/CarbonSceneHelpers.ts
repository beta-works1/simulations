import { Circle, Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { ProcessRates } from '../model/CarbonOxygenModel.js'

export type GasParticle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  kind: 'co2' | 'o2'
}

export type Cloud = { x: number; y: number; scale: number; speed: number }

export function makeClouds(): Cloud[] {
  return [
    { x: 0.15, y: 0.1, scale: 1, speed: 0.012 },
    { x: 0.45, y: 0.16, scale: 0.75, speed: 0.008 },
    { x: 0.78, y: 0.12, scale: 1.15, speed: 0.01 },
  ]
}

export class CarbonParticleLayer extends Node {
  private readonly particles: GasParticle[] = []
  private readonly gfxLayer: Node

  public constructor() {
    super()
    this.gfxLayer = new Node()
    this.addChild(this.gfxLayer)
  }

  public update(
    dt: number,
    bounds: { left: number; top: number; width: number; height: number },
    isDay: boolean,
    sunlight: number,
    plantCount: number,
    factoryCount: number,
    rates: ProcessRates,
  ): void {
    const groundY = bounds.top + bounds.height * 0.68
    const skyY = bounds.top + bounds.height * 0.12
    const spawnBudget = Math.min(10, 2 + Math.floor(dt * 60))
    const plantFactor = Math.max(0.15, plantCount / 12)

    if (isDay && rates.photosynthesis > 0.1) {
      const chance = rates.photosynthesis * 0.08 * plantFactor * (sunlight / 80)
      for (let i = 0; i < spawnBudget && Math.random() < chance; i++) {
        this.particles.push({
          x: bounds.left + bounds.width * (0.08 + Math.random() * 0.45),
          y: groundY - 40,
          vx: (Math.random() - 0.5) * 10,
          vy: -22 - Math.random() * 28,
          life: 1,
          kind: 'o2',
        })
      }
    }
    if (rates.respiration > 0.1) {
      for (let i = 0; i < spawnBudget && Math.random() < rates.respiration * 0.08; i++) {
        this.particles.push({
          x: bounds.left + bounds.width * (0.1 + Math.random() * 0.45),
          y: groundY - 10,
          vx: (Math.random() - 0.5) * 8,
          vy: -12 - Math.random() * 18,
          life: 1,
          kind: 'co2',
        })
      }
    }
    if (rates.decomposition > 0.12) {
      for (let i = 0; i < 3 && Math.random() < rates.decomposition * 0.2; i++) {
        this.particles.push({
          x: bounds.left + bounds.width * (0.12 + Math.random() * 0.4),
          y: bounds.top + bounds.height * 0.9,
          vx: (Math.random() - 0.5) * 6,
          vy: -8 - Math.random() * 10,
          life: 1,
          kind: 'co2',
        })
      }
    }
    if (rates.combustion > 0.15) {
      const chance = rates.combustion * 0.07 * Math.max(0.2, factoryCount / 8)
      for (let i = 0; i < spawnBudget && Math.random() < chance; i++) {
        this.particles.push({
          x: bounds.left + bounds.width * (0.58 + Math.random() * 0.35),
          y: groundY - 55,
          vx: (Math.random() - 0.5) * 12,
          vy: -20 - Math.random() * 24,
          life: 1.1,
          kind: 'co2',
        })
      }
    }

    while (this.particles.length > 120) this.particles.shift()

    this.gfxLayer.removeAllChildren()
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt * 0.55
      if (p.life <= 0 || p.y < skyY - 20) {
        this.particles.splice(i, 1)
        continue
      }
      const alpha = Math.max(0, Math.min(1, p.life))
      this.gfxLayer.addChild(
        new Circle(p.kind === 'o2' ? 4 : 3.5, {
          fill: p.kind === 'o2' ? `rgba(46,204,113,${alpha})` : `rgba(231,76,60,${alpha})`,
          centerX: p.x,
          centerY: p.y,
        }),
      )
    }
  }
}

export class CarbonCloudLayer extends Node {
  private readonly clouds: Cloud[]

  public constructor(initial: Cloud[]) {
    super()
    this.clouds = initial
  }

  public step(dt: number, bounds: { left: number; top: number; width: number; height: number }, blend: number): void {
    this.removeAllChildren()
    for (const c of this.clouds) {
      c.x += c.speed * dt
      if (c.x > 1.25) c.x = -0.25
      const x = bounds.left + c.x * bounds.width
      const y = bounds.top + c.y * bounds.height
      const r = 14 * c.scale
      const a = 0.2 + blend * 0.35
      const fill = blend > 0.15 ? `rgba(255,255,255,${a})` : `rgba(160,175,200,${a * 0.55})`
      const cloud = new Node({ x, y })
      cloud.addChild(new Circle(r, { fill }))
      cloud.addChild(new Circle(r * 0.75, { fill, centerX: r * 0.9, centerY: 2 }))
      cloud.addChild(new Circle(r * 0.7, { fill, centerX: -r * 0.85, centerY: 3 }))
      this.addChild(cloud)
    }
  }
}

export function makeAtmosphereGauge(
  model: {
    co2Property: { link: (fn: (v: number) => void) => void; value: number }
    o2Property: { link: (fn: (v: number) => void) => void; value: number }
  },
  x: number,
  y: number,
  width: number,
): Node {
  const root = new Node({ x, y })
  const bg = new Rectangle(0, 0, width + 8, 62, { fill: 'rgba(0,0,0,0.5)', cornerRadius: 8 })
  root.addChild(bg)
  root.addChild(new Text('Atmosphere', { font: new PhetFont({ size: 10, weight: 'bold' }), fill: 'white', x: 4, y: 2 }))

  const co2BarBg = new Rectangle(4, 18, width, 12, { fill: 'rgba(255,255,255,0.15)', cornerRadius: 4 })
  const co2Bar = new Rectangle(4, 18, width * 0.42, 12, { fill: '#e74c3c', cornerRadius: 4 })
  const co2Label = new Text('', { font: new PhetFont(9), fill: 'white', x: 8, y: 27 })
  const o2BarBg = new Rectangle(4, 35, width, 12, { fill: 'rgba(255,255,255,0.15)', cornerRadius: 4 })
  const o2Bar = new Rectangle(4, 35, width * 0.58, 12, { fill: '#27ae60', cornerRadius: 4 })
  const o2Label = new Text('', { font: new PhetFont(9), fill: 'white', x: 8, y: 44 })

  root.addChild(co2BarBg)
  root.addChild(co2Bar)
  root.addChild(co2Label)
  root.addChild(o2BarBg)
  root.addChild(o2Bar)
  root.addChild(o2Label)

  model.co2Property.link((v) => {
    co2Bar.rectWidth = (v / 100) * width
    co2Label.string = `CO₂ ${v.toFixed(0)}%`
  })
  model.o2Property.link((v) => {
    o2Bar.rectWidth = (v / 100) * width
    o2Label.string = `O₂ ${v.toFixed(0)}%`
  })

  return root
}

export function makeEquationPanel(
  activeProcessProperty: { link: (fn: (v: string) => void) => void; value: string },
  x: number,
  y: number,
  width: number,
): Node {
  const root = new Node({ x, y })
  const bg = new Rectangle(0, 0, width, 68, { fill: 'rgba(11,28,44,0.9)', cornerRadius: 8 })
  const photoHighlight = new Rectangle(4, 4, width - 8, 26, { cornerRadius: 5, fill: 'rgba(39,174,96,0.35)', visible: false })
  const respHighlight = new Rectangle(4, 34, width - 8, 28, { cornerRadius: 5, fill: 'rgba(231,76,60,0.3)', visible: false })
  const photoTitle = new Text('Photosynthesis', { font: new PhetFont({ size: 9, weight: 'bold' }), fill: '#2ecc71', x: 10, y: 8 })
  const photoEq = new Text('6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', { font: new PhetFont(8), fill: '#ecf0f1', x: 10, y: 20 })
  const respTitle = new Text('Respiration', { font: new PhetFont({ size: 9, weight: 'bold' }), fill: '#e74c3c', x: 10, y: 38 })
  const respEq = new Text('C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy', { font: new PhetFont(8), fill: '#ecf0f1', x: 10, y: 50 })

  root.addChild(bg)
  root.addChild(photoHighlight)
  root.addChild(respHighlight)
  root.addChild(photoTitle)
  root.addChild(photoEq)
  root.addChild(respTitle)
  root.addChild(respEq)

  activeProcessProperty.link((active) => {
    const photo = active === 'photosynthesis'
    photoHighlight.visible = photo
    respHighlight.visible = !photo
    photoTitle.fill = photo ? '#2ecc71' : 'rgba(255,255,255,0.55)'
    photoEq.fill = photo ? '#ecf0f1' : 'rgba(255,255,255,0.4)'
    respTitle.fill = !photo ? '#e74c3c' : 'rgba(255,255,255,0.55)'
    respEq.fill = !photo ? '#ecf0f1' : 'rgba(255,255,255,0.4)'
  })

  return root
}

export function makeProcessChip(label: string, x: number, y: number, hot: boolean): Node {
  const pill = new Rectangle(-4, -10, label.length * 5.5 + 16, 18, {
    fill: hot ? 'rgba(14,116,144,0.92)' : 'rgba(21,32,51,0.82)',
    cornerRadius: 9,
    centerX: x,
    centerY: y,
  })
  const text = new Text(label, {
    font: new PhetFont({ size: 9, weight: 'bold' }),
    fill: 'white',
    center: pill.center,
  })
  const n = new Node()
  n.addChild(pill)
  n.addChild(text)
  return n
}
