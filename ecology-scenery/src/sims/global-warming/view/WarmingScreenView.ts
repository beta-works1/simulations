import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  Circle,
  Color,
  DragListener,
  LinearGradient,
  Line,
  Node,
  Path,
  Rectangle,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { WarmingModel } from '../model/WarmingModel.js'
import { clamp, damp, lerp } from '../../../shared/EcologyConstants.js'
import { createEcologyIcon } from '../../../shared/EcologyArt.js'
import { WarmingControlPanel } from './WarmingControlPanel.js'
import { WarmingSounds } from './WarmingSounds.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

/** Presentation/clarity view — model physics unchanged. */
export class WarmingScreenView extends ScreenView {
  private readonly model: WarmingModel
  private readonly sounds: WarmingSounds

  private readonly sky: Rectangle
  private readonly hills: Path
  private readonly sunNode: Node
  private readonly risePath: Path
  private readonly trapPath: Path
  private readonly escapePath: Path
  private readonly escapeArrow: Path
  private readonly escapeLabel: Text
  private readonly heatDots: Circle[] = []
  private readonly smokePuffs: Circle[] = []
  private readonly ghgBand: Rectangle
  private readonly ghgHandle: Node
  private readonly ghgLabel: Text
  private readonly ghgPill: Rectangle
  private readonly ground: Rectangle
  private readonly tempBg: Rectangle
  private readonly tempChip: Text
  private readonly trapValueLabel: Text
  private readonly nowCard: Node
  private readonly nowText: Text
  private readonly nowBg: Rectangle
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private readonly sunX: number
  private readonly sunY: number
  private readonly bandLeft: number
  private readonly bandWidth: number
  private readonly bandMinTop: number
  private readonly bandMaxBottom: number
  private readonly groundTop: number

  private visualHeat = 0.2
  private visualCo2 = 0.4
  private animTime = 0
  private syncingCo2 = false
  private lastBandSound = 0
  private lastSkyHeat = -1

  public constructor(model: WarmingModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new WarmingSounds()
    this.sounds.warm()
    this.sounds.setEnabled(model.soundEnabledProperty.value)
    model.soundEnabledProperty.link(on => this.sounds.setEnabled(on))

    const margin = 10
    const panelW = 250
    const b = this.layoutBounds

    // No top status banner — explanation lives only in the scene callout
    const sceneLeft = b.left + margin
    const sceneTop = b.top + margin
    const sceneW = b.width - panelW - margin * 3
    const sceneH = b.height - margin * 2
    this.sceneBounds = { left: sceneLeft, top: sceneTop, width: sceneW, height: sceneH }

    this.sky = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: '#38bdf8',
      cornerRadius: 14,
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1,
    })
    this.addChild(this.sky)

    const hillShape = new Shape()
    hillShape.moveTo(sceneLeft, sceneTop + sceneH * 0.72)
    hillShape.quadraticCurveTo(
      sceneLeft + sceneW * 0.25,
      sceneTop + sceneH * 0.58,
      sceneLeft + sceneW * 0.5,
      sceneTop + sceneH * 0.68,
    )
    hillShape.quadraticCurveTo(
      sceneLeft + sceneW * 0.75,
      sceneTop + sceneH * 0.78,
      sceneLeft + sceneW,
      sceneTop + sceneH * 0.62,
    )
    hillShape.lineTo(sceneLeft + sceneW, sceneTop + sceneH)
    hillShape.lineTo(sceneLeft, sceneTop + sceneH)
    hillShape.close()
    this.hills = new Path(hillShape, { fill: 'rgba(34, 100, 60, 0.4)', pickable: false })
    this.addChild(this.hills)

    this.sunX = sceneLeft + sceneW * 0.84
    this.sunY = sceneTop + sceneH * 0.13
    this.sunNode = createEcologyIcon('sun', 48)
    this.sunNode.centerX = this.sunX
    this.sunNode.centerY = this.sunY
    this.sunNode.pickable = false
    this.addChild(this.sunNode)

    // Sunlight label on a chip above the sun (clear of ray lines)
    const sunLabel = new Text('Sunlight in', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fde68a',
      pickable: false,
    })
    const sunChip = new Rectangle(0, 0, sunLabel.width + 14, 22, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.82)',
      pickable: false,
    })
    sunChip.centerX = this.sunX
    sunChip.bottom = this.sunY - 26
    sunLabel.center = sunChip.center
    this.addChild(sunChip)
    this.addChild(sunLabel)

    this.groundTop = sceneTop + sceneH * 0.76
    this.bandLeft = sceneLeft + sceneW * 0.3
    this.bandWidth = sceneW * 0.4
    this.bandMinTop = sceneTop + sceneH * 0.34
    this.bandMaxBottom = this.groundTop - 28

    const beamTargets = [
      { x: sceneLeft + sceneW * 0.42, y: this.groundTop - 4 },
      { x: sceneLeft + sceneW * 0.52, y: this.groundTop - 4 },
      { x: sceneLeft + sceneW * 0.62, y: this.groundTop - 4 },
    ]
    for (const t of beamTargets) {
      this.addChild(
        new Path(new Shape().moveTo(this.sunX - 10, this.sunY + 18).lineTo(t.x, t.y), {
          stroke: 'rgba(250,204,21,0.55)',
          lineWidth: 2.5,
          lineCap: 'round',
          pickable: false,
        }),
      )
    }

    this.ghgBand = new Rectangle(this.bandLeft, this.bandMinTop, this.bandWidth, 40, {
      cornerRadius: 12,
      fill: 'rgba(100,90,80,0.45)',
      stroke: 'rgba(255,255,255,0.45)',
      lineWidth: 2,
      cursor: 'ns-resize',
    })
    this.addChild(this.ghgBand)

    this.ghgLabel = new Text('Gas blanket — drag ↕', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fff',
      pickable: false,
    })
    this.ghgPill = new Rectangle(0, 0, 200, 26, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.65)',
      pickable: false,
    })
    this.addChild(this.ghgPill)
    this.addChild(this.ghgLabel)

    // Drag handle fully below the band (clear spacing from instruction pill)
    this.ghgHandle = new Node({ cursor: 'ns-resize' })
    this.ghgHandle.addChild(
      new Rectangle(-42, -14, 84, 28, {
        cornerRadius: 14,
        fill: '#f8fafc',
        stroke: '#0ea5e9',
        lineWidth: 2.5,
      }),
    )
    this.ghgHandle.addChild(
      new Text('↕ Drag', {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#0f172a',
        centerX: 0,
        centerY: 0,
        pickable: false,
      }),
    )
    this.addChild(this.ghgHandle)

    this.risePath = new Path(null, {
      stroke: 'rgba(248,113,113,0.75)',
      lineWidth: 3,
      lineCap: 'round',
      pickable: false,
    })
    this.trapPath = new Path(null, {
      stroke: 'rgba(239,68,68,0.85)',
      lineWidth: 3,
      lineCap: 'round',
      pickable: false,
    })
    this.escapePath = new Path(null, {
      stroke: 'rgba(251,146,60,0.85)',
      lineWidth: 2.5,
      lineCap: 'round',
      lineDash: [6, 5],
      pickable: false,
    })
    this.escapeArrow = new Path(null, {
      fill: 'rgba(251,146,60,0.95)',
      pickable: false,
      visible: false,
    })
    this.addChild(this.risePath)
    this.addChild(this.trapPath)
    this.addChild(this.escapePath)
    this.addChild(this.escapeArrow)
    this.escapeLabel = new Text('Escapes to space', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#fdba74',
      pickable: false,
      visible: false,
    })
    this.addChild(this.escapeLabel)

    // Moving heat packets — labeled via legend as “Heat moving”
    for (let i = 0; i < 3; i++) {
      const dot = new Circle(5, {
        fill: '#f87171',
        stroke: '#fff',
        lineWidth: 1,
        pickable: false,
      })
      this.heatDots.push(dot)
      this.addChild(dot)
    }

    this.ground = new Rectangle(sceneLeft, this.groundTop, sceneW, sceneTop + sceneH - this.groundTop, {
      fill: '#a16207',
    })
    this.addChild(this.ground)

    const treeL = createEcologyIcon('tree', 38)
    treeL.centerX = sceneLeft + sceneW * 0.2
    treeL.centerY = this.groundTop + 30
    treeL.pickable = false
    this.addChild(treeL)

    const earth = createEcologyIcon('earth', 50)
    earth.centerX = sceneLeft + sceneW * 0.5
    earth.centerY = this.groundTop + 34
    earth.pickable = false
    this.addChild(earth)

    const factory = createEcologyIcon('factory', 42)
    factory.centerX = sceneLeft + sceneW * 0.78
    factory.centerY = this.groundTop + 30
    factory.pickable = false
    this.addChild(factory)

    for (let i = 0; i < 3; i++) {
      const puff = new Circle(6, {
        fill: 'rgba(148,163,184,0.35)',
        pickable: false,
        visible: false,
      })
      this.smokePuffs.push(puff)
      this.addChild(puff)
    }

    this.addChild(
      new Text('Heat radiating ↑', {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#fecaca',
        left: sceneLeft + 12,
        bottom: this.groundTop - 90,
        pickable: false,
      }),
    )

    this.trapValueLabel = new Text('Heat trapped: 40%', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fecaca',
      right: sceneLeft + sceneW - 12,
      top: this.bandMinTop - 24,
      pickable: false,
    })
    this.addChild(this.trapValueLabel)

    // Single Earth temperature (shared model.temperatureProperty)
    this.tempBg = new Rectangle(0, 0, 160, 40, {
      cornerRadius: 12,
      fill: 'rgba(15,23,42,0.9)',
      stroke: 'rgba(251,146,60,0.7)',
      lineWidth: 1.5,
      centerX: sceneLeft + sceneW / 2,
      bottom: this.groundTop - 10,
      pickable: false,
    })
    this.tempChip = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#fdba74',
      pickable: false,
    })
    this.addChild(this.tempBg)
    this.addChild(this.tempChip)
    const refreshTemp = (temp: number) => {
      this.tempChip.string = `Earth ${temp.toFixed(1)} °C`
      this.tempBg.rectWidth = Math.max(160, this.tempChip.width + 24)
      this.tempBg.centerX = sceneLeft + sceneW / 2
      this.tempChip.center = this.tempBg.center
    }
    model.temperatureProperty.link(refreshTemp)

    // Single live explanation callout
    this.nowText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: sceneW * 0.52,
    })
    this.nowBg = new Rectangle(0, 0, 20, 20, {
      fill: 'rgba(8, 18, 32, 0.92)',
      cornerRadius: 8,
      stroke: 'rgba(250, 204, 21, 0.45)',
      lineWidth: 1.5,
    })
    this.nowCard = new Node({ children: [this.nowBg, this.nowText], pickable: false })
    this.addChild(this.nowCard)

    const refreshNow = () => {
      this.nowText.string = model.tipProperty.value
      this.nowBg.rectWidth = Math.min(sceneW * 0.55, this.nowText.width + 20)
      this.nowBg.rectHeight = this.nowText.height + 14
      this.nowText.center = this.nowBg.center
      this.nowCard.left = sceneLeft + 10
      this.nowCard.top = sceneTop + 10
      this.nowCard.visible = model.showTipsProperty.value
    }
    model.tipProperty.link(refreshNow)
    model.showTipsProperty.link(refreshNow)

    // Ray legend (permanent key)
    this.addChild(this.buildLegend(sceneLeft + 10, this.groundTop - 78))

    const applyBandFromCo2 = (co2: number) => {
      const maxThick = this.bandMaxBottom - this.bandMinTop
      const thick = 36 + co2 * (maxThick - 36)
      this.ghgBand.setRect(this.bandLeft, this.bandMinTop, this.bandWidth, thick)
      this.ghgBand.fill = `rgba(100, 90, 80, ${0.28 + co2 * 0.45})`

      // Instruction pill inside the band
      this.ghgPill.rectWidth = Math.max(180, this.ghgLabel.width + 16)
      this.ghgPill.centerX = this.bandLeft + this.bandWidth * 0.5
      this.ghgPill.centerY = this.bandMinTop + Math.min(thick * 0.4, thick - 18)
      this.ghgLabel.center = this.ghgPill.center

      // Handle fully below the band with clear spacing (not straddling the border)
      this.ghgHandle.centerX = this.bandLeft + this.bandWidth * 0.5
      this.ghgHandle.centerY = this.bandMinTop + thick + 22

      this.trapValueLabel.string = `Heat trapped: ${Math.round(co2 * 100)}%`
      this.trapValueLabel.right = sceneLeft + sceneW - 12

      this.rebuildHeatPaths(co2)
    }
    applyBandFromCo2(model.co2LevelProperty.value)

    const dragBand = (y: number) => {
      const maxThick = this.bandMaxBottom - this.bandMinTop
      const thick = clamp(y - this.bandMinTop, 36, maxThick)
      const co2 = clamp((thick - 36) / Math.max(1, maxThick - 36), 0.05, 1)
      this.syncingCo2 = true
      model.setCo2(co2)
      this.syncingCo2 = false
      applyBandFromCo2(co2)
      const now = Date.now()
      if (now - this.lastBandSound > 110) {
        this.lastBandSound = now
        this.sounds.sliderTick()
      }
    }

    const bandListener = new DragListener({
      start: () => this.sounds.grabHandle(),
      drag: event => {
        const pt = this.globalToLocalPoint(event.pointer.point)
        dragBand(pt.y)
      },
      end: () => this.sounds.releaseHandle(),
    })
    this.ghgBand.addInputListener(bandListener)
    this.ghgHandle.addInputListener(
      new DragListener({
        start: () => this.sounds.grabHandle(),
        drag: event => {
          const pt = this.globalToLocalPoint(event.pointer.point)
          dragBand(pt.y)
        },
        end: () => this.sounds.releaseHandle(),
      }),
    )

    model.co2LevelProperty.link(co2 => {
      if (!this.syncingCo2) applyBandFromCo2(co2)
      this.visualCo2 = co2
    })

    this.addChild(
      new WarmingControlPanel(model, this.sounds, {
        right: b.right - margin,
        top: sceneTop,
        maxWidth: panelW,
        panelMaxHeight: sceneH,
      }),
    )

    this.visualHeat = (model.temperatureProperty.value - 10) / 28
    this.visualCo2 = model.co2LevelProperty.value
    this.updateSky(true)
  }

  private buildLegend(left: number, top: number): Node {
    const rows: { stroke: string; dash?: number[]; label: string; swatch?: 'dot' }[] = [
      { stroke: 'rgba(250,204,21,0.9)', label: 'Sunlight in' },
      { stroke: 'rgba(239,68,68,0.9)', label: 'Heat moving (red dots)', swatch: 'dot' },
      { stroke: 'rgba(251,146,60,0.9)', dash: [5, 4], label: 'Escapes to space' },
    ]
    const bg = new Rectangle(0, 0, 188, 72, {
      cornerRadius: 8,
      fill: 'rgba(8, 18, 32, 0.88)',
      stroke: 'rgba(255,255,255,0.2)',
      lineWidth: 1,
      pickable: false,
    })
    const title = new Text('Key', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#cbd5e1',
      left: 8,
      top: 6,
      pickable: false,
    })
    const node = new Node({ children: [bg, title], left, top, pickable: false })
    rows.forEach((row, i) => {
      const y = 26 + i * 15
      if (row.swatch === 'dot') {
        node.addChild(
          new Circle(4, {
            fill: row.stroke,
            stroke: '#fff',
            lineWidth: 0.8,
            left: 10,
            centerY: y,
            pickable: false,
          }),
        )
      }
      else {
        node.addChild(
          new Line(10, y, 34, y, {
            stroke: row.stroke,
            lineWidth: 2.5,
            lineDash: row.dash,
            pickable: false,
          }),
        )
      }
      node.addChild(
        new Text(row.label, {
          font: new PhetFont(11),
          fill: '#e2e8f0',
          left: 40,
          centerY: y,
          pickable: false,
        }),
      )
    })
    return node
  }

  private rebuildHeatPaths(co2: number): void {
    const s = this.sceneBounds
    const groundY = this.groundTop - 4
    const hitY = this.ghgBand.bottom - 2
    const midX = this.bandLeft + this.bandWidth * 0.5
    const leftX = s.left + s.width * 0.4
    const rightX = this.bandLeft + this.bandWidth * 0.7

    this.risePath.shape = new Shape().moveTo(leftX, groundY).lineTo(midX - 10, hitY)
    this.trapPath.shape = new Shape().moveTo(midX + 10, hitY).lineTo(rightX, groundY - 8)

    const escapeOn = co2 < 0.42
    this.escapePath.visible = escapeOn
    this.escapeArrow.visible = escapeOn
    this.escapeLabel.visible = escapeOn
    if (escapeOn) {
      const x0 = midX
      const y0 = this.ghgBand.top + 2
      const x1 = midX + 6
      const y1 = s.top + 36
      this.escapePath.shape = new Shape().moveTo(x0, y0).lineTo(x1, y1)
      // Clear arrowhead pointing up / off toward space
      const arrow = new Shape()
      arrow.moveTo(x1, y1 - 10)
      arrow.lineTo(x1 - 9, y1 + 4)
      arrow.lineTo(x1 + 9, y1 + 4)
      arrow.close()
      this.escapeArrow.shape = arrow
      this.escapeLabel.left = x1 + 14
      this.escapeLabel.centerY = y1 - 2
    }

    this.trapPath.opacity = 0.45 + co2 * 0.55
    this.risePath.opacity = 0.55 + co2 * 0.35
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.animTime += dt

    const targetHeat = clamp((this.model.temperatureProperty.value - 10) / 28, 0, 1)
    this.visualHeat = damp(this.visualHeat, targetHeat, 4, dt)
    this.visualCo2 = damp(this.visualCo2, this.model.co2LevelProperty.value, 6, dt)

    this.updateSky(false)
    this.updateHeatDots()
    this.updateSmoke()
  }

  private updateSky(force: boolean): void {
    const heat = this.visualHeat
    if (!force && Math.abs(heat - this.lastSkyHeat) < 0.03) return
    this.lastSkyHeat = heat

    const top = Color.interpolateRGBA(new Color(40, 90, 150), new Color(130, 45, 80), heat)
    const bottom = Color.interpolateRGBA(new Color(170, 130, 55), new Color(240, 95, 40), heat)
    const s = this.sceneBounds
    this.sky.fill = new LinearGradient(0, s.top, 0, s.top + s.height)
      .addColorStop(0, top)
      .addColorStop(1, bottom)
    this.hills.fill = Color.interpolateRGBA(
      new Color('#22643c'),
      new Color('#50321e'),
      heat,
    ).withAlpha(0.4)
    this.ground.fill = Color.interpolateRGBA(new Color(161, 98, 7), new Color(220, 80, 30), heat)
  }

  private updateHeatDots(): void {
    const co2 = this.visualCo2
    const groundY = this.groundTop - 4
    const hitY = this.ghgBand.bottom - 2
    const s = this.sceneBounds
    const midX = this.bandLeft + this.bandWidth * 0.5
    const leftX = s.left + s.width * 0.4
    const rightX = this.bandLeft + this.bandWidth * 0.7
    const t = this.animTime

    for (let i = 0; i < this.heatDots.length; i++) {
      const dot = this.heatDots[i]!
      const cycle = (t * 0.35 + i * 0.33) % 1
      if (cycle < 0.5) {
        const u = cycle / 0.5
        dot.centerX = lerp(leftX, midX - 10, u)
        dot.centerY = lerp(groundY, hitY, u)
        dot.fill = '#fca5a5'
        dot.visible = true
      }
      else {
        const u = (cycle - 0.5) / 0.5
        const bounce = 0.35 + co2 * 0.65
        if (u > bounce) {
          dot.visible = co2 >= 0.35
          if (!dot.visible) continue
        }
        else {
          dot.visible = true
        }
        const v = Math.min(1, u / Math.max(0.2, bounce))
        dot.centerX = lerp(midX + 10, rightX, v)
        dot.centerY = lerp(hitY, groundY - 8, v)
        dot.fill = '#ef4444'
      }
      dot.opacity = 0.55 + co2 * 0.4
    }
  }

  private updateSmoke(): void {
    const co2 = this.visualCo2
    const show = co2 >= 0.4
    const fx = this.sceneBounds.left + this.sceneBounds.width * 0.78
    const fy = this.groundTop + 6
    for (let i = 0; i < this.smokePuffs.length; i++) {
      const puff = this.smokePuffs[i]!
      if (!show) {
        puff.visible = false
        continue
      }
      puff.visible = true
      const u = (this.animTime * 0.22 + i * 0.28) % 1
      puff.setRadius(5 + u * 5)
      puff.centerX = fx + Math.sin(u * 5 + i) * 6
      puff.centerY = fy - u * 42
      puff.opacity = 0.35 * (1 - u) * Math.min(1, (co2 - 0.35) / 0.4)
    }
  }
}
