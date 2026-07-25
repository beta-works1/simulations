import { EmptySelfOptions } from 'scenerystack/phet-core'
import { NumberProperty } from 'scenerystack/axon'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Line, Node, Path, RadialGradient, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { DnaZoomModel, DNA_ZOOM_MAX_LEVEL, ZOOM_LEVEL_NAMES, ZOOM_LEVEL_SCALE } from '../model/DnaZoomModel.js'
import { HeredityConstants, clamp } from '../../../shared/HeredityConstants.js'
import { HeredityColors } from '../../../shared/HeredityColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { StageBackdrop } from '../../../shared/ui/StageBackdrop.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { RippleFX } from '../../../shared/ui/RippleFX.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { controlHint, controlSection } from '../../../shared/ui/controlPanelBits.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { HereditySounds } from '../../../shared/HereditySounds.js'
import { DnaZoomStrings } from '../DnaZoomStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type StrandPt = { x: number; y: number; depth: number }

function buildStrandPoints(
  leftX: number,
  widthSpan: number,
  centerY: number,
  amplitude: number,
  k: number,
  phase: number,
  phaseOffset: number,
  segments: number,
): StrandPt[] {
  const pts: StrandPt[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = leftX + t * widthSpan
    const theta = k * (x - leftX) + phase + phaseOffset
    pts.push({ x, y: centerY + Math.sin(theta) * amplitude, depth: Math.cos(theta) })
  }
  return pts
}

/** Split a strand into front/back chunks so the twist reads as pseudo-3D. */
function strandToPaths(pts: StrandPt[], color: string): Path[] {
  const paths: Path[] = []
  if (pts.length === 0) return paths
  let current: StrandPt[] = [pts[0]]
  let currentFront = pts[0].depth >= 0
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]
    const front = p.depth >= 0
    current.push(p)
    if (front !== currentFront || i === pts.length - 1) {
      const shape = new Shape()
      current.forEach((pt, j) => (j === 0 ? shape.moveTo(pt.x, pt.y) : shape.lineTo(pt.x, pt.y)))
      paths.push(
        new Path(shape, {
          stroke: color,
          lineWidth: currentFront ? 5 : 2.6,
          opacity: currentFront ? 1 : 0.45,
          lineCap: 'round',
          lineJoin: 'round',
          pickable: false,
        }),
      )
      current = [p]
      currentFront = front
    }
  }
  return paths
}

export class DnaZoomScreenView extends ScreenView {
  private readonly model: DnaZoomModel
  private readonly sounds: HereditySounds
  private readonly particles: ParticleBurst
  private readonly ripples: RippleFX
  private readonly cellLayer: Node
  private readonly nucleusLayer: Node
  private readonly chromosomeLayer: Node
  private readonly helixLayer: Node
  private readonly labelsLayer: Node
  private readonly scaleBarLayer: Node
  private readonly levelTitleText: Text
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private readonly panelSoundBtn: SoftButton
  private readonly tourButtons: SoftButton[] = []
  private readonly zoomSliderProperty: NumberProperty
  private readonly playPauseBtn: SoftButton
  private readonly histonesBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly scaleBarBtn: SoftButton
  private readonly autoTourBtn: SoftButton
  private readonly organellesBtn: SoftButton
  private readonly stepSpinBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText
  private readonly chromosomeHistones: Node
  private readonly organellesGroup: Node
  private readonly membraneCircle: Circle
  private readonly chromatinLayer: Node
  private readonly stageLeft: number
  private readonly stageTop: number
  private readonly stageW: number
  private readonly stageH: number
  private readonly stageCenterX: number
  private readonly stageCenterY: number
  private tipTimer = 0

  public constructor(model: DnaZoomModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new HereditySounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = HeredityConstants.SCREEN_VIEW_X_MARGIN
    const my = HeredityConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 280
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78
    this.stageLeft = stageLeft
    this.stageTop = stageTop
    this.stageW = stageW
    this.stageH = stageH
    this.stageCenterX = stageLeft + stageW / 2
    this.stageCenterY = stageTop + stageH / 2 + 6

    // ── Guidance banner ──────────────────────────────────────────────────────
    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: DnaZoomStrings.guideTitleStringProperty.value,
      body: DnaZoomStrings.guideCellStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    // ── Left column: teaching triad + sound ──────────────────────────────────
    const leftCard = new DepthCard(leftW, stageH)
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    const scaleFact = createPanelTip(DnaZoomStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: HeredityColors.panelMuted,
    })
    scaleFact.left = 12
    scaleFact.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(scaleFact)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(
      new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#b8d4e8', bottom: '#dce7f0' }),
    )

    this.organellesGroup = new Node({ pickable: false })
    this.chromatinLayer = new Node({ pickable: false })
    this.membraneCircle = new Circle(1, { pickable: false })

    this.cellLayer = new Node({ pickable: false })
    this.nucleusLayer = new Node({ pickable: false })
    this.chromosomeLayer = new Node({ pickable: false })
    this.helixLayer = new Node({ pickable: false })
    this.labelsLayer = new Node({ pickable: false })
    this.scaleBarLayer = new Node({ pickable: false })
    this.chromosomeHistones = new Node({ pickable: false })

    this.buildCellLayer()
    this.buildNucleusLayer()
    this.buildChromosomeLayer()

    this.addChild(this.cellLayer)
    this.addChild(this.nucleusLayer)
    this.addChild(this.chromosomeLayer)
    this.addChild(this.helixLayer)
    this.addChild(this.labelsLayer)
    this.addChild(this.scaleBarLayer)

    this.particles = new ParticleBurst(70)
    this.ripples = new RippleFX()
    this.addChild(this.particles)
    this.addChild(this.ripples)

    this.levelTitleText = new Text(ZOOM_LEVEL_NAMES[0], {
      font: new PhetFont({ size: 20, weight: 'bold' }),
      fill: '#ecf0f1',
      centerX: this.stageCenterX,
      top: stageTop + 10,
      pickable: false,
    })
    this.addChild(this.levelTitleText)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 110, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX
    this.tipCard.top = stageTop + 44
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(DnaZoomStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: HeredityColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: HeredityColors.ink,
      lineWrap: 222,
      leading: 3,
      left: 14,
      top: 30,
      maxWidth: 222,
    })
    this.tipCard.content.addChild(this.tipBodyText)
    this.addChild(this.tipCard)

    // ── Mini quiz overlay ────────────────────────────────────────────────────
    this.miniQuiz = new MiniQuiz(240)
    this.miniQuiz.centerX = this.stageCenterX
    this.miniQuiz.centerY = stageTop + stageH * 0.5
    this.addChild(this.miniQuiz)

    // ── Right column: dense scrollable control panel ────────────────────────
    const card = new DepthCard(rightW, stageH)
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 32
    const halfW = (contentW - 8) / 2
    const btnH = 32
    const gridGap = 6

    // Tour ------------------------------------------------------------------
    const tourHeader = controlSection(DnaZoomStrings.sectionTourStringProperty.value, contentW)
    panelContent.addChild(tourHeader)

    const tourDefs: { label: string; fill: string }[] = [
      { label: DnaZoomStrings.levelCellStringProperty.value, fill: '#38bdf8' },
      { label: DnaZoomStrings.levelNucleusStringProperty.value, fill: '#a78bfa' },
      { label: DnaZoomStrings.levelChromosomeStringProperty.value, fill: '#ef4444' },
      { label: DnaZoomStrings.levelHelixStringProperty.value, fill: '#22d3ee' },
      { label: DnaZoomStrings.levelGeneStringProperty.value, fill: '#facc15' },
    ]
    tourDefs.forEach((def, i) => {
      const btn = new SoftButton(def.label, () => {
        sounds.select()
        model.setZoom(i)
      }, {
        width: contentW,
        height: btnH,
        fill: def.fill,
        textFill: i === 4 ? '#3f2d00' : '#ecfeff',
        selected: i === 0,
        fontSize: 12,
      })
      this.tourButtons.push(btn)
      panelContent.addChild(btn)
    })

    // Zoom --------------------------------------------------------------------
    const zoomHeader = controlSection(DnaZoomStrings.sectionZoomStringProperty.value, contentW)
    panelContent.addChild(zoomHeader)

    this.zoomSliderProperty = new NumberProperty(model.zoomLevelProperty.value)
    const zoomSlider = new DepthSlider(this.zoomSliderProperty, {
      min: 0,
      max: DNA_ZOOM_MAX_LEVEL,
      width: contentW,
      label: DnaZoomStrings.zoomLevelStringProperty.value,
      format: (n) => ZOOM_LEVEL_NAMES[clamp(Math.round(n), 0, DNA_ZOOM_MAX_LEVEL)],
      fill: HeredityColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(zoomSlider)

    const zoomOutBtn = new SoftButton(DnaZoomStrings.zoomOutStringProperty.value, () => {
      sounds.zoomStep(false)
      model.stepZoom(-1)
    }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11 })
    panelContent.addChild(zoomOutBtn)

    const zoomInBtn = new SoftButton(DnaZoomStrings.zoomInStringProperty.value, () => {
      sounds.zoomStep(true)
      model.stepZoom(1)
    }, { width: halfW, height: btnH, fill: HeredityColors.accent, fontSize: 11 })
    panelContent.addChild(zoomInBtn)

    // Cell ------------------------------------------------------------------
    const cellHeader = controlSection(DnaZoomStrings.sectionCellStringProperty.value, contentW)
    panelContent.addChild(cellHeader)

    const chromatinSlider = new DepthSlider(model.chromatinDensityProperty, {
      min: 0.3,
      max: 1.5,
      width: contentW,
      label: DnaZoomStrings.chromatinDensityStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: HeredityColors.nucleusFill,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(chromatinSlider)

    const membraneSlider = new DepthSlider(model.membraneThicknessProperty, {
      min: 0.5,
      max: 1.5,
      width: contentW,
      label: DnaZoomStrings.membraneThicknessStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: HeredityColors.cellMembrane,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(membraneSlider)

    this.organellesBtn = new SoftButton(DnaZoomStrings.organellesOnStringProperty.value, () => {
      sounds.softClick()
      model.showOrganellesProperty.value = !model.showOrganellesProperty.value
    }, { width: contentW, height: btnH, fill: '#fbbf24', fontSize: 11, selected: true })
    panelContent.addChild(this.organellesBtn)

    const cellHint = controlHint(DnaZoomStrings.cellHintStringProperty.value, contentW)
    panelContent.addChild(cellHint)

    // Helix ---------------------------------------------------------------
    const helixHeader = controlSection(DnaZoomStrings.sectionHelixStringProperty.value, contentW)
    panelContent.addChild(helixHeader)

    const simSpeedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: DnaZoomStrings.simSpeedStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: HeredityColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(simSpeedSlider)

    const twistSlider = new DepthSlider(model.twistSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: DnaZoomStrings.twistSpeedStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: '#22d3ee',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(twistSlider)

    const basePairSlider = new DepthSlider(model.basePairVisibilityProperty, {
      min: 0,
      max: 1,
      width: contentW,
      label: DnaZoomStrings.basePairVisibilityStringProperty.value,
      format: (n) => `${Math.round(n * 100)}%`,
      fill: HeredityColors.basePair,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(basePairSlider)

    const geneLengthSlider = new DepthSlider(model.geneHighlightLengthProperty, {
      min: 0.2,
      max: 1,
      width: contentW,
      label: DnaZoomStrings.geneLengthStringProperty.value,
      format: (n) => `${Math.round(n * 100)}%`,
      fill: HeredityColors.gene,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(geneLengthSlider)

    const strandGapSlider = new DepthSlider(model.strandGapProperty, {
      min: 0,
      max: 1,
      width: contentW,
      label: DnaZoomStrings.strandGapStringProperty.value,
      format: (n) => `${Math.round(n * 100)}%`,
      fill: HeredityColors.dnaStrandB,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(strandGapSlider)

    const glowSlider = new DepthSlider(model.glowIntensityProperty, {
      min: 0.4,
      max: 1.4,
      width: contentW,
      label: DnaZoomStrings.glowIntensityStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: HeredityColors.gene,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(glowSlider)

    const helixHint = controlHint(DnaZoomStrings.helixHintStringProperty.value, contentW)
    panelContent.addChild(helixHint)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(DnaZoomStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.histonesBtn = new SoftButton(DnaZoomStrings.histonesOnStringProperty.value, () => {
      sounds.softClick()
      model.showHistonesProperty.value = !model.showHistonesProperty.value
    }, { width: contentW, height: btnH, fill: HeredityColors.histone, fontSize: 11, selected: true })
    panelContent.addChild(this.histonesBtn)

    this.labelsBtn = new SoftButton(DnaZoomStrings.labelsOnStringProperty.value, () => {
      sounds.softClick()
      model.showLabelsProperty.value = !model.showLabelsProperty.value
    }, { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 11, selected: true })
    panelContent.addChild(this.labelsBtn)

    this.scaleBarBtn = new SoftButton(DnaZoomStrings.scaleBarOnStringProperty.value, () => {
      sounds.softClick()
      model.showScaleBarProperty.value = !model.showScaleBarProperty.value
    }, { width: contentW, height: btnH, fill: '#16a34a', fontSize: 11, selected: true })
    panelContent.addChild(this.scaleBarBtn)

    this.autoTourBtn = new SoftButton(DnaZoomStrings.autoTourOffStringProperty.value, () => {
      sounds.toggle(!model.autoTourProperty.value)
      model.autoTourProperty.value = !model.autoTourProperty.value
    }, { width: contentW, height: btnH, fill: '#7c3aed', fontSize: 11, selected: false })
    panelContent.addChild(this.autoTourBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(DnaZoomStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(DnaZoomStrings.pauseButtonStringProperty.value, () => {
      model.togglePlay()
      sounds.playPause(model.runningProperty.value)
    }, { width: halfW, height: 38, fill: HeredityColors.accent, fontSize: 12 })

    this.stepSpinBtn = new SoftButton(DnaZoomStrings.stepSpinStringProperty.value, () => {
      sounds.zoomStep(true)
      model.stepSpinOnce()
    }, { width: halfW, height: 38, fill: '#64748b', fontSize: 11 })

    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(this.stepSpinBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(DnaZoomStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.panelSoundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? DnaZoomStrings.soundOnStringProperty.value
        : DnaZoomStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.panelSoundBtn.setLabel(
          on ? DnaZoomStrings.soundOnStringProperty.value : DnaZoomStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.panelSoundBtn)

    // Status / quiz -----------------------------------------------------------
    const statusHeader = controlSection(DnaZoomStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: HeredityColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(DnaZoomStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 11,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      tourHeader.left = 0
      tourHeader.top = py
      py = tourHeader.bottom + 6
      for (const btn of this.tourButtons) {
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6

      zoomHeader.left = 0
      zoomHeader.top = py
      py = zoomHeader.bottom + 6
      zoomSlider.left = 0
      zoomSlider.top = py
      py = zoomSlider.bottom + 8
      zoomOutBtn.left = 0
      zoomOutBtn.top = py
      zoomInBtn.left = halfW + 8
      zoomInBtn.top = py
      py = zoomOutBtn.bottom + 12

      const cellHeader = controlSection(DnaZoomStrings.sectionCellStringProperty.value, contentW)
      cellHeader.left = 0
      cellHeader.top = py
      py = cellHeader.bottom + 6
      chromatinSlider.left = 0
      chromatinSlider.top = py
      py = chromatinSlider.bottom + 8
      membraneSlider.left = 0
      membraneSlider.top = py
      py = membraneSlider.bottom + 8
      this.organellesBtn.left = 0
      this.organellesBtn.top = py
      py = this.organellesBtn.bottom + 4
      cellHint.left = 0
      cellHint.top = py
      py = cellHint.bottom + 12

      helixHeader.left = 0
      helixHeader.top = py
      py = helixHeader.bottom + 6
      simSpeedSlider.left = 0
      simSpeedSlider.top = py
      py = simSpeedSlider.bottom + 8
      twistSlider.left = 0
      twistSlider.top = py
      py = twistSlider.bottom + 8
      basePairSlider.left = 0
      basePairSlider.top = py
      py = basePairSlider.bottom + 8
      geneLengthSlider.left = 0
      geneLengthSlider.top = py
      py = geneLengthSlider.bottom + 8
      strandGapSlider.left = 0
      strandGapSlider.top = py
      py = strandGapSlider.bottom + 8
      glowSlider.left = 0
      glowSlider.top = py
      py = glowSlider.bottom + 4
      helixHint.left = 0
      helixHint.top = py
      py = helixHint.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.histonesBtn.left = 0
      this.histonesBtn.top = py
      py = this.histonesBtn.bottom + gridGap
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.scaleBarBtn.left = 0
      this.scaleBarBtn.top = py
      py = this.scaleBarBtn.bottom + gridGap
      this.autoTourBtn.left = 0
      this.autoTourBtn.top = py
      py = this.autoTourBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      this.stepSpinBtn.left = halfW + 8
      this.stepSpinBtn.top = py
      py = this.playPauseBtn.bottom + 12

      soundHeader.left = 0
      soundHeader.top = py
      py = soundHeader.bottom + 6
      this.panelSoundBtn.left = 0
      this.panelSoundBtn.top = py
      py = this.panelSoundBtn.bottom + 12

      statusHeader.left = 0
      statusHeader.top = py
      py = statusHeader.bottom + 6
      this.starsText.left = 0
      this.starsText.top = py
      py = this.starsText.bottom + 6
      this.statusText.left = 0
      this.statusText.top = py
      py = this.statusText.bottom + 8
      learnTip.left = 0
      learnTip.top = py
      py = learnTip.bottom + 4
      bottomPad.top = py
    }
    relayoutPanel()

    const scroller = new ScrollableNode(panelContent, rightW - 24, stageH - 20)
    scroller.left = 12
    scroller.top = 12
    card.content.addChild(scroller)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          sounds.resetAll()
          model.reset()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    // ── Wiring ───────────────────────────────────────────────────────────────
    const syncStars = () => {
      this.starsText.string = `${DnaZoomStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }

    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? DnaZoomStrings.pauseButtonStringProperty.value
          : DnaZoomStrings.playButtonStringProperty.value,
      )
    }

    const syncLevel = (level: number, oldLevel: number | null) => {
      this.tourButtons.forEach((btn, i) => btn.setSelected(i === level))
      if (Math.round(this.zoomSliderProperty.value) !== level) {
        this.zoomSliderProperty.value = level
      }
      this.levelTitleText.string = ZOOM_LEVEL_NAMES[level]
      this.levelTitleText.centerX = this.stageCenterX

      this.cellLayer.visible = level === 0
      this.nucleusLayer.visible = level === 1
      this.chromosomeLayer.visible = level === 2
      this.helixLayer.visible = level >= 3

      this.updateLabelsForLevel(level)
      this.updateScaleBarForLevel(level)
      this.updateGuidance(level)

      if (oldLevel !== null) {
        sounds.zoomStep(level > oldLevel)
        this.particles.burst(this.stageCenterX, this.stageCenterY, {
          count: 16,
          color: tourDefs[level].fill,
          speed: 70,
          life: 0.45,
          radius: 3,
        })
        this.ripples.burst(this.stageCenterX, this.stageCenterY, { color: tourDefs[level].fill, count: 2, maxR: 46 })
      }
    }

    let sliderDrivenLevel = model.zoomLevelProperty.value
    this.zoomSliderProperty.lazyLink((v) => {
      const rounded = clamp(Math.round(v), 0, DNA_ZOOM_MAX_LEVEL)
      if (rounded !== sliderDrivenLevel) {
        sliderDrivenLevel = rounded
        model.setZoom(rounded)
      }
    })

    model.zoomLevelProperty.link((level, oldLevel) => {
      sliderDrivenLevel = level
      syncLevel(level, oldLevel ?? null)
    })
    model.showHistonesProperty.link((on) => {
      this.chromosomeHistones.visible = on
      this.histonesBtn.setLabel(
        on ? DnaZoomStrings.histonesOnStringProperty.value : DnaZoomStrings.histonesOffStringProperty.value,
      )
      this.histonesBtn.setSelected(on)
    })
    model.showLabelsProperty.link((on) => {
      this.labelsLayer.visible = on
      this.labelsBtn.setLabel(
        on ? DnaZoomStrings.labelsOnStringProperty.value : DnaZoomStrings.labelsOffStringProperty.value,
      )
      this.labelsBtn.setSelected(on)
    })
    model.showScaleBarProperty.link((on) => {
      this.scaleBarLayer.visible = on
      this.scaleBarBtn.setLabel(
        on ? DnaZoomStrings.scaleBarOnStringProperty.value : DnaZoomStrings.scaleBarOffStringProperty.value,
      )
      this.scaleBarBtn.setSelected(on)
    })
    model.autoTourProperty.link((on) => {
      this.autoTourBtn.setLabel(
        on ? DnaZoomStrings.autoTourOnStringProperty.value : DnaZoomStrings.autoTourOffStringProperty.value,
      )
      this.autoTourBtn.setSelected(on)
    })
    model.showOrganellesProperty.link((on) => {
      this.organellesGroup.visible = on
      this.organellesBtn.setLabel(
        on ? DnaZoomStrings.organellesOnStringProperty.value : DnaZoomStrings.organellesOffStringProperty.value,
      )
      this.organellesBtn.setSelected(on)
    })
    model.membraneThicknessProperty.link(() => this.updateMembrane())
    model.chromatinDensityProperty.link(() => this.rebuildChromatin())
    model.soundEnabledProperty.link((on) => {
      sounds.setEnabled(on)
      this.panelSoundBtn.setLabel(
        on ? DnaZoomStrings.soundOnStringProperty.value : DnaZoomStrings.soundOffStringProperty.value,
      )
    })
    model.runningProperty.link(syncPlayPause)
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
    })
    model.tipsProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.tourUnlockedProperty.link((unlocked) => {
      if (unlocked) {
        sounds.celebrate()
      }
    })

    model.strandGapProperty.link(() => {
      if (this.model.zoomLevelProperty.value >= 3) this.redrawHelix()
    })
    model.glowIntensityProperty.link(() => {
      if (this.model.zoomLevelProperty.value >= 3) this.redrawHelix()
    })
    model.geneHighlightLengthProperty.link(() => {
      if (this.model.zoomLevelProperty.value >= 3) this.redrawHelix()
    })

    syncStars()
    syncPlayPause()
    syncLevel(model.zoomLevelProperty.value, null)
  }

  private buildCellLayer(): void {
    const R = Math.min(this.stageW, this.stageH) * 0.34
    const cx = this.stageCenterX
    const cy = this.stageCenterY

    this.membraneCircle.radius = R
    this.membraneCircle.fill = HeredityColors.cytoplasm
    this.membraneCircle.stroke = HeredityColors.cellMembrane
    this.membraneCircle.lineWidth = 5
    this.membraneCircle.centerX = cx
    this.membraneCircle.centerY = cy
    this.cellLayer.addChild(this.membraneCircle)

    this.organellesGroup.removeAllChildren()
    const organelles = [
      { dx: -R * 0.5, dy: R * 0.35, r: R * 0.09, fill: '#fbbf24' },
      { dx: R * 0.45, dy: -R * 0.4, r: R * 0.07, fill: '#34d399' },
      { dx: R * 0.15, dy: R * 0.55, r: R * 0.06, fill: '#f472b6' },
    ]
    for (const o of organelles) {
      this.organellesGroup.addChild(
        new Circle(o.r, { fill: o.fill, opacity: 0.75, centerX: cx + o.dx, centerY: cy + o.dy }),
      )
    }
    this.organellesGroup.visible = this.model.showOrganellesProperty.value
    this.cellLayer.addChild(this.organellesGroup)

    this.cellLayer.addChild(
      new Circle(R * 0.42, {
        fill: new RadialGradient(cx, cy, 0, cx, cy, R * 0.42)
          .addColorStop(0, HeredityColors.nucleusFill)
          .addColorStop(1, '#7c3aed'),
        stroke: '#5b21b6',
        lineWidth: 2,
        centerX: cx,
        centerY: cy,
      }),
    )
    this.updateMembrane()
  }

  private updateMembrane(): void {
    const scale = clamp(this.model.membraneThicknessProperty.value, 0.5, 1.5)
    this.membraneCircle.lineWidth = 3 + 3 * scale
  }

  private rebuildChromatin(): void {
    this.chromatinLayer.removeAllChildren()
    const R = Math.min(this.stageW, this.stageH) * 0.36
    const cx = this.stageCenterX
    const cy = this.stageCenterY
    const density = clamp(this.model.chromatinDensityProperty.value, 0.3, 1.5)
    const threadCount = Math.max(2, Math.round(4 * density))
    const lineW = 1.5 + density

    for (let s = 0; s < threadCount; s++) {
      const shape = new Shape()
      const baseAng = (s / threadCount) * Math.PI * 2 + 0.4
      const r0 = R * 0.15
      for (let i = 0; i <= 24; i++) {
        const t = i / 24
        const ang = baseAng + t * 2.4 * density
        const rr = r0 + t * R * 0.55 + Math.sin(t * 10) * 5 * density
        const x = cx + Math.cos(ang) * rr
        const y = cy + Math.sin(ang) * rr
        if (i === 0) shape.moveTo(x, y)
        else shape.lineTo(x, y)
      }
      this.chromatinLayer.addChild(
        new Path(shape, { stroke: HeredityColors.chromatin, lineWidth: lineW, pickable: false }),
      )
    }
  }

  private buildNucleusLayer(): void {
    const R = Math.min(this.stageW, this.stageH) * 0.36
    const cx = this.stageCenterX
    const cy = this.stageCenterY

    this.nucleusLayer.addChild(
      new Circle(R, {
        fill: new RadialGradient(cx, cy, 0, cx, cy, R)
          .addColorStop(0, '#c4b5fd')
          .addColorStop(1, HeredityColors.nucleusFill),
        stroke: '#5b21b6',
        lineWidth: 4,
        centerX: cx,
        centerY: cy,
      }),
    )
    this.nucleusLayer.addChild(
      new Circle(R - 6, {
        fill: null,
        stroke: 'rgba(255,255,255,0.55)',
        lineWidth: 2,
        centerX: cx,
        centerY: cy,
      }),
    )
    // Nuclear pores
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2
      this.nucleusLayer.addChild(
        new Circle(3, {
          fill: '#f5f3ff',
          centerX: cx + Math.cos(ang) * (R - 6),
          centerY: cy + Math.sin(ang) * (R - 6),
        }),
      )
    }
    // Chromatin threads (density-controlled)
    this.nucleusLayer.addChild(this.chromatinLayer)
    this.rebuildChromatin()
    // Nucleolus
    this.nucleusLayer.addChild(
      new Circle(R * 0.22, { fill: HeredityColors.nucleolus, centerX: cx - R * 0.12, centerY: cy + R * 0.1 }),
    )
  }

  private buildChromosomeLayer(): void {
    const cx = this.stageCenterX
    const cy = this.stageCenterY
    const armLen = Math.min(this.stageW, this.stageH) * 0.34
    const armW = 26

    const makeArm = (angle: number): Path => {
      const dx = Math.cos(angle)
      const dy = Math.sin(angle)
      const shape = new Shape()
        .moveTo(cx - dx * 8, cy - dy * 8)
        .quadraticCurveTo(cx - dx * armLen * 0.5 - dy * armW * 0.5, cy - dy * armLen * 0.5 + dx * armW * 0.5, cx - dx * armLen, cy - dy * armLen)
      return new Path(shape, {
        stroke: HeredityColors.chromosome,
        lineWidth: armW * 0.72,
        lineCap: 'round',
        pickable: false,
      })
    }

    const angles = [
      Math.PI * 0.28,
      Math.PI * 0.72,
      Math.PI * 1.28,
      Math.PI * 1.72,
    ]
    for (const a of angles) {
      this.chromosomeLayer.addChild(makeArm(a))
    }
    this.chromosomeLayer.addChild(
      new Circle(16, { fill: HeredityColors.centromere, stroke: '#991b1b', lineWidth: 2, centerX: cx, centerY: cy }),
    )

    // Histone beads-on-a-string along one chromatid pair (toggleable).
    this.chromosomeHistones.removeAllChildren()
    for (const a of [angles[0], angles[2]]) {
      const dx = Math.cos(a)
      const dy = Math.sin(a)
      for (let i = 1; i <= 4; i++) {
        const t = i / 5
        this.chromosomeHistones.addChild(
          new Circle(6, {
            fill: HeredityColors.histone,
            stroke: '#475569',
            lineWidth: 1,
            centerX: cx - dx * armLen * t,
            centerY: cy - dy * armLen * t,
          }),
        )
      }
    }
    this.chromosomeLayer.addChild(this.chromosomeHistones)
  }

  private updateLabelsForLevel(level: number): void {
    this.labelsLayer.removeAllChildren()
    const font = new PhetFont({ size: 11, weight: 'bold' })
    const addLabel = (text: string, x: number, y: number, color = HeredityColors.ink) => {
      this.labelsLayer.addChild(
        new Text(text, { font, fill: color, centerX: x, centerY: y, pickable: false }),
      )
    }

    const R = Math.min(this.stageW, this.stageH) * 0.34
    const cx = this.stageCenterX
    const cy = this.stageCenterY

    if (level === 0) {
      addLabel(DnaZoomStrings.labelMembraneStringProperty.value, cx, cy - R - 14, '#0369a1')
      addLabel(DnaZoomStrings.labelCytoplasmStringProperty.value, cx - R * 0.7, cy - R * 0.7, '#0369a1')
      addLabel(DnaZoomStrings.labelNucleusStringProperty.value, cx, cy + 4, '#f5f3ff')
    }
    else if (level === 1) {
      const Rn = Math.min(this.stageW, this.stageH) * 0.36
      addLabel(DnaZoomStrings.labelEnvelopeStringProperty.value, cx, cy - Rn - 14, '#5b21b6')
      addLabel(DnaZoomStrings.labelChromatinStringProperty.value, cx + Rn * 0.55, cy - Rn * 0.4, '#4c1d95')
      addLabel(DnaZoomStrings.labelNucleusStringProperty.value, cx - Rn * 0.1, cy + Rn * 0.12, '#f5f3ff')
    }
    else if (level === 2) {
      const armLen = Math.min(this.stageW, this.stageH) * 0.34
      addLabel(DnaZoomStrings.labelChromosomeStringProperty.value, cx, cy - armLen - 16, '#991b1b')
      addLabel(DnaZoomStrings.labelCentromereStringProperty.value, cx + 60, cy + 4, '#991b1b')
      addLabel(DnaZoomStrings.labelChromatidStringProperty.value, cx - armLen * 0.75, cy - armLen * 0.75, '#991b1b')
      if (this.model.showHistonesProperty.value) {
        addLabel(DnaZoomStrings.labelHistoneStringProperty.value, cx - armLen * 0.35, cy + armLen * 0.5, '#475569')
      }
    }
    else if (level === 3 || level === 4) {
      const helixW = this.stageW * 0.72
      addLabel(DnaZoomStrings.labelBackboneStringProperty.value, cx - helixW * 0.42, cy - 62, HeredityColors.dnaStrandA)
      if (this.model.basePairVisibilityProperty.value > 0.05) {
        addLabel(DnaZoomStrings.labelBasePairStringProperty.value, cx - helixW * 0.1, cy + 58, '#92400e')
      }
      if (level === 4) {
        addLabel(DnaZoomStrings.labelGeneStringProperty.value, cx, cy - 78, '#92700a')
      }
    }
  }

  private updateScaleBarForLevel(level: number): void {
    this.scaleBarLayer.removeAllChildren()
    const barW = 34 + level * 14
    const x = this.stageLeft + 22
    const y = this.stageTop + this.stageH - 20
    this.scaleBarLayer.addChild(new Line(x, y, x + barW, y, { stroke: HeredityColors.ink, lineWidth: 2.5 }))
    this.scaleBarLayer.addChild(new Line(x, y - 5, x, y + 5, { stroke: HeredityColors.ink, lineWidth: 2.5 }))
    this.scaleBarLayer.addChild(new Line(x + barW, y - 5, x + barW, y + 5, { stroke: HeredityColors.ink, lineWidth: 2.5 }))
    this.scaleBarLayer.addChild(
      new Text(ZOOM_LEVEL_SCALE[level], {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: HeredityColors.ink,
        left: x,
        top: y + 6,
      }),
    )
  }

  private updateGuidance(level: number): void {
    const guides = [
      DnaZoomStrings.guideCellStringProperty.value,
      DnaZoomStrings.guideNucleusStringProperty.value,
      DnaZoomStrings.guideChromosomeStringProperty.value,
      DnaZoomStrings.guideHelixStringProperty.value,
      DnaZoomStrings.guideGeneStringProperty.value,
    ]
    const triads: [string, string, string][] = [
      [
        'A whole cell.',
        'Every living thing is built from cells — and almost every cell has a nucleus.',
        'Zoom in to find the nucleus inside.',
      ],
      [
        'Inside the nucleus.',
        'The nucleus stores all of the cell\u2019s DNA, organized into chromosomes.',
        'Zoom in to see a single chromosome.',
      ],
      [
        'A chromosome.',
        'DNA is coiled tightly around proteins so a huge amount of it fits in a tiny nucleus.',
        'Zoom in to uncoil it into the DNA double helix.',
      ],
      [
        'The DNA double helix.',
        'Two strands twist together; the rungs between them are called base pairs.',
        'Zoom in one more step to spot a single gene.',
      ],
      [
        'A gene!',
        'A gene is a specific segment of DNA that carries instructions for one trait.',
        'Try the Tour buttons or Auto-tour to review the whole journey.',
      ],
    ]
    this.guide.setGuidance(DnaZoomStrings.guideTitleStringProperty.value, guides[level])
    this.teachingTriad.setTriad(...triads[level])
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      DnaZoomStrings.quizQuestionStringProperty.value,
      [
        { label: DnaZoomStrings.quizCorrectStringProperty.value, correct: true },
        { label: DnaZoomStrings.quizWrongStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  private redrawHelix(): void {
    this.helixLayer.removeAllChildren()
    const level = this.model.zoomLevelProperty.value
    if (level < 3) return

    const helixW = this.stageW * 0.72
    const amplitude = Math.min(this.stageH * 0.16, 54)
    const gapScale = clamp(this.model.strandGapProperty.value, 0, 1)
    const strandSep = amplitude * 0.35 * gapScale
    const centerY = this.stageCenterY
    const leftX = this.stageCenterX - helixW / 2
    const wavelengths = 3.2
    const k = (Math.PI * 2 * wavelengths) / helixW
    const segments = 100
    const phase = this.model.helixPhaseProperty.value

    const ptsA = buildStrandPoints(leftX, helixW, centerY - strandSep, amplitude, k, phase, 0, segments)
    const ptsB = buildStrandPoints(leftX, helixW, centerY + strandSep, amplitude, k, phase, Math.PI, segments)

    // Histones drawn behind the strands near the left end.
    if (this.model.showHistonesProperty.value) {
      for (let i = 0; i < 3; i++) {
        const t = 0.1 + i * 0.09
        const idx = Math.round(t * segments)
        const p = ptsA[idx]
        if (!p) continue
        this.helixLayer.addChild(
          new Circle(13, {
            fill: HeredityColors.histone,
            opacity: 0.55,
            stroke: '#475569',
            lineWidth: 1,
            centerX: p.x,
            centerY: centerY,
          }),
        )
      }
    }

    // Base-pair rungs, revealed left-to-right by basePairVisibilityProperty.
    const rungSpacing = 3
    const totalRungs = Math.floor(segments / rungSpacing)
    const rungsToShow = Math.round(totalRungs * this.model.basePairVisibilityProperty.value)
    for (let r = 0; r <= rungsToShow; r++) {
      const i = r * rungSpacing
      const a = ptsA[i]
      const b = ptsB[i]
      if (!a || !b) continue
      const avgDepth = (a.depth + b.depth) / 2
      this.helixLayer.addChild(
        new Line(a.x, a.y, b.x, b.y, {
          stroke: HeredityColors.basePair,
          lineWidth: 2.4,
          opacity: 0.4 + 0.5 * Math.max(0, avgDepth),
          pickable: false,
        }),
      )
    }

    for (const p of strandToPaths(ptsA, HeredityColors.dnaStrandA)) this.helixLayer.addChild(p)
    for (const p of strandToPaths(ptsB, HeredityColors.dnaStrandB)) this.helixLayer.addChild(p)

    if (level === 4) {
      const frac = clamp(this.model.geneHighlightLengthProperty.value, 0.2, 1)
      const glow = clamp(this.model.glowIntensityProperty.value, 0.4, 1.4)
      const geneW = helixW * frac
      const geneX = this.stageCenterX - geneW / 2
      const geneTop = centerY - amplitude - 20
      const geneH = amplitude * 2 + 40
      this.helixLayer.addChild(
        new Rectangle(geneX, geneTop, geneW, geneH, {
          cornerRadius: 14,
          fill: `rgba(234,179,8,${0.28 * glow})`,
          stroke: HeredityColors.gene,
          lineWidth: 2.5 * glow,
          lineDash: [6, 4],
          pickable: false,
        }),
      )
    }
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.particles.step(dt)
    this.ripples.step(dt)

    if (this.model.zoomLevelProperty.value >= 3) {
      this.redrawHelix()
    }
    else if (this.model.zoomLevelProperty.value === 1) {
      this.rebuildChromatin()
    }

    if (this.tipTimer > 0) {
      this.tipTimer -= dt
      if (this.tipTimer < 0.6) {
        this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6)
      }
      if (this.tipTimer <= 0) {
        this.tipCard.visible = false
      }
    }
  }
}
