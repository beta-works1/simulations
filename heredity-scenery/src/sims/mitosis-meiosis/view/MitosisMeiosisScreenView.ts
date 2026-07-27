import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Line, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { DivisionMode, MitosisMeiosisModel } from '../model/MitosisMeiosisModel.js'
import { HeredityConstants, clamp, lerp, smoothstep } from '../../../shared/HeredityConstants.js'
import { HeredityColors } from '../../../shared/HeredityColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { StageBackdrop } from '../../../shared/ui/StageBackdrop.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { controlHint, controlSection } from '../../../shared/ui/controlPanelBits.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { HereditySounds } from '../../../shared/HereditySounds.js'
import { MitosisMeiosisStrings } from '../MitosisMeiosisStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type Pt = { x: number; y: number }
type Unit = { x: number; y: number; rotation: number; doubled: boolean; color: string }
type PhaseKind = 'prophase' | 'metaphase' | 'anaphase' | 'telophase' | 'divisionII' | 'result'

const MITOSIS_PHASES: readonly PhaseKind[] = ['prophase', 'metaphase', 'anaphase', 'telophase', 'result']
const MEIOSIS_PHASES: readonly PhaseKind[] = [
  'prophase',
  'metaphase',
  'anaphase',
  'telophase',
  'divisionII',
  'result',
]

const SPINDLE_GRAY = '#95a5a6'

const PALETTE: readonly string[] = [
  HeredityColors.chromosome,
  HeredityColors.father,
  HeredityColors.dominant,
  HeredityColors.gene,
  HeredityColors.mother,
  HeredityColors.dnaStrandA,
]

const POOL_SIZE = 12

function phaseKindFor(mode: DivisionMode, stageIdx: number): PhaseKind {
  const list = mode === 'mitosis' ? MITOSIS_PHASES : MEIOSIS_PHASES
  return list[Math.min(stageIdx, list.length - 1)]
}

/** Deterministic pseudo-random offsets so chromosome scatter looks organic but doesn't reshuffle every frame. */
function seededJitter(i: number): { dx: number; dy: number; rot: number } {
  const a = Math.sin(i * 12.9898) * 43758.5453
  const b = Math.sin(i * 78.233 + 4.7) * 12345.6789
  const frac = (x: number) => x - Math.floor(x)
  return {
    dx: (frac(a) - 0.5) * 2,
    dy: (frac(b) - 0.5) * 2,
    rot: (frac(a + b) - 0.5) * 0.8,
  }
}

/** A single chromosome: two capsule-shaped sister chromatids joined at a centromere dot, or one single chromatid. */
class ChromosomeNode extends Node {
  private readonly barA: Rectangle
  private readonly barB: Rectangle
  private readonly centromere: Circle

  public constructor() {
    super()
    this.barA = new Rectangle(-4, -14, 8, 28, {
      cornerRadius: 4,
      stroke: 'rgba(15,23,42,0.45)',
      lineWidth: 1,
    })
    this.barB = new Rectangle(-4, -14, 8, 28, {
      cornerRadius: 4,
      stroke: 'rgba(15,23,42,0.45)',
      lineWidth: 1,
    })
    this.centromere = new Circle(3, { fill: '#1f2937' })
    this.addChild(this.barA)
    this.addChild(this.barB)
    this.addChild(this.centromere)
  }

  public apply(unit: Unit, condensation = 1): void {
    this.visible = true
    this.x = unit.x
    this.y = unit.y
    this.rotation = unit.rotation
    const barW = 8 * condensation
    const barH = 28 * condensation
    this.barA.setRect(-barW / 2, -barH / 2, barW, barH)
    this.barB.setRect(-barW / 2, -barH / 2, barW, barH)
    this.barA.cornerRadius = 4 * condensation
    this.barB.cornerRadius = 4 * condensation
    this.centromere.radius = 3 * condensation
    this.barA.fill = unit.color
    this.barB.fill = unit.color
    if (unit.doubled) {
      const sep = 7 * condensation
      this.barA.x = -sep
      this.barB.x = sep
      this.barB.visible = true
      this.centromere.visible = true
    }
    else {
      this.barA.x = 0
      this.barB.visible = false
      this.centromere.visible = false
    }
  }

  public hide(): void {
    this.visible = false
  }
}

export class MitosisMeiosisScreenView extends ScreenView {
  private readonly model: MitosisMeiosisModel
  private readonly sounds: HereditySounds
  private readonly particles: ParticleBurst
  private readonly chromosomePool: ChromosomeNode[] = []
  private readonly chromosomeLayer: Node
  private readonly membraneLayer: Node
  private readonly spindleLayer: Node
  private readonly labelLayer: Node
  private readonly stageNameText: Text
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly compareCard: Node
  private readonly compareMitosisText: Text
  private readonly compareMeiosisText: Text
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private readonly soundBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly spindleBtn: SoftButton
  private readonly envelopeBtn: SoftButton
  private readonly centriolesBtn: SoftButton
  private readonly compareBtn: SoftButton
  private readonly autoAdvanceBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly cytoplasmBtn: SoftButton
  private readonly crossingOverBtn: SoftButton
  private readonly pauseAtEndBtn: SoftButton
  private readonly loopBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: Text
  private readonly cx: number
  private readonly cy: number
  private readonly cellR: number
  private time = 0
  private assortment: number[] = []
  private assortmentValid = false
  private tipTimer = 0
  private quizShown = false

  public constructor(model: MitosisMeiosisModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new HereditySounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = HeredityConstants.SCREEN_VIEW_X_MARGIN
    const my = HeredityConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 200
    const rightW = 280
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78
    this.cx = stageLeft + stageW / 2
    this.cy = stageTop + stageH / 2 + 12
    this.cellR = Math.min(stageW, stageH) * 0.23

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: MitosisMeiosisStrings.guideTitleStringProperty.value,
      body: MitosisMeiosisStrings.guideExploreStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    // ── Left column: teaching triad + compare hint ────────────────────────────
    const leftCard = new DepthCard(leftW, stageH)
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.compareCard = new Node({ left: 12, visible: false })
    const compareBg = new Rectangle(0, 0, leftW - 24, 76, {
      cornerRadius: 10,
      fill: 'rgba(255,255,255,0.08)',
      stroke: 'rgba(148,163,184,0.35)',
    })
    this.compareCard.addChild(compareBg)
    this.compareCard.addChild(
      new Text('Compare', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: HeredityColors.accent,
        left: 10,
        top: 6,
      }),
    )
    this.compareMitosisText = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#e5e7eb',
      left: 10,
      top: 24,
      maxWidth: leftW - 44,
    })
    this.compareMeiosisText = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#e5e7eb',
      left: 10,
      top: 48,
      maxWidth: leftW - 44,
    })
    this.compareCard.addChild(this.compareMitosisText)
    this.compareCard.addChild(this.compareMeiosisText)
    leftCard.content.addChild(this.compareCard)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? MitosisMeiosisStrings.soundOnStringProperty.value
        : MitosisMeiosisStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on
            ? MitosisMeiosisStrings.soundOnStringProperty.value
            : MitosisMeiosisStrings.soundOffStringProperty.value,
        )
      },
      { width: leftW - 24, height: 32, fill: '#64748b', fontSize: 12 },
    )
    this.soundBtn.left = 12
    this.soundBtn.bottom = stageH - 12
    leftCard.content.addChild(this.soundBtn)

    // ── Center stage ───────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#a8c8e8', bottom: '#eef4f8' }))

    this.stageNameText = new Text('', {
      font: new PhetFont({ size: 20, weight: 'bold' }),
      fill: HeredityColors.ink,
      centerX: this.cx,
      top: stageTop + 12,
      pickable: false,
    })
    this.addChild(this.stageNameText)

    this.membraneLayer = new Node({ pickable: false })
    this.spindleLayer = new Node({ pickable: false })
    this.chromosomeLayer = new Node({ pickable: false })
    this.labelLayer = new Node({ pickable: false })
    this.particles = new ParticleBurst(100)
    this.addChild(this.membraneLayer)
    this.addChild(this.spindleLayer)
    for (let i = 0; i < POOL_SIZE; i++) {
      const c = new ChromosomeNode()
      c.visible = false
      this.chromosomePool.push(c)
      this.chromosomeLayer.addChild(c)
    }
    this.addChild(this.chromosomeLayer)
    this.addChild(this.labelLayer)
    this.addChild(this.particles)

    // ── Timed tip card ──────────────────────────────────────────────────────────
    this.tipCard = new DepthCard(240, 96, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.cx
    this.tipCard.top = stageTop + 44
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(MitosisMeiosisStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: HeredityColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: HeredityColors.ink,
      lineWrap: 212,
      leading: 3,
      left: 14,
      top: 30,
      maxWidth: 212,
    })
    this.tipCard.content.addChild(this.tipBodyText)
    this.addChild(this.tipCard)

    // ── Mini quiz overlay ────────────────────────────────────────────────────────
    this.miniQuiz = new MiniQuiz(240)
    this.miniQuiz.centerX = this.cx
    this.miniQuiz.centerY = this.cy
    this.addChild(this.miniQuiz)

    // ── Right column: dense scrollable control panel ────────────────────────────
    const card = new DepthCard(rightW, stageH)
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 42
    const halfW = (contentW - 8) / 2
    const gridGap = 6
    const btnH = 32

    // Section 1 — Scenarios
    const scenariosHeader = controlSection(MitosisMeiosisStrings.sectionScenariosStringProperty.value, contentW)
    panelContent.addChild(scenariosHeader)

    const exploreBtn = new SoftButton(MitosisMeiosisStrings.scenarioExploreStringProperty.value, () => {
      model.setScenario('explore')
    }, { width: contentW, height: btnH, fill: HeredityColors.accent, selected: true, onSound: () => sounds.modeChange(true) })
    const growthBtn = new SoftButton(MitosisMeiosisStrings.scenarioGrowthStringProperty.value, () => {
      model.setScenario('growth')
    }, { width: contentW, height: btnH, fill: '#16a34a', selected: false, onSound: () => sounds.scenario() })
    const gametesBtn = new SoftButton(MitosisMeiosisStrings.scenarioGametesStringProperty.value, () => {
      model.setScenario('gametes')
    }, { width: contentW, height: btnH, fill: HeredityColors.nucleusFill, selected: false, onSound: () => sounds.scenario() })
    panelContent.addChild(exploreBtn)
    panelContent.addChild(growthBtn)
    panelContent.addChild(gametesBtn)

    // Section 2 — Division type
    const divisionHeader = controlSection(MitosisMeiosisStrings.sectionDivisionStringProperty.value, contentW)
    panelContent.addChild(divisionHeader)

    const mitosisBtn = new SoftButton(MitosisMeiosisStrings.modeMitosisStringProperty.value, () => {
      model.setMode('mitosis')
    }, { width: halfW, height: btnH, fill: HeredityColors.chromosome, selected: true, onSound: () => sounds.toggle(true) })
    const meiosisBtn = new SoftButton(MitosisMeiosisStrings.modeMeiosisStringProperty.value, () => {
      model.setMode('meiosis')
    }, { width: halfW, height: btnH, fill: HeredityColors.nucleusFill, selected: false, onSound: () => sounds.toggle(false) })
    panelContent.addChild(mitosisBtn)
    panelContent.addChild(meiosisBtn)

    // Section 3 — Chromosomes
    const chromosomesHeader = controlSection(MitosisMeiosisStrings.sectionChromosomesStringProperty.value, contentW)
    panelContent.addChild(chromosomesHeader)

    const chromosomeSlider = new DepthSlider(model.chromosomeCountProperty, {
      min: 2,
      max: 6,
      width: contentW,
      label: MitosisMeiosisStrings.chromosomeCountStringProperty.value,
      format: (n) => `${Math.round(n)}`,
      fill: HeredityColors.chromosome,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(chromosomeSlider)

    const visualHeader = controlSection(MitosisMeiosisStrings.sectionVisualStringProperty.value, contentW)
    panelContent.addChild(visualHeader)

    const stageSlider = new DepthSlider(model.stageProperty, {
      min: 0,
      max: MEIOSIS_PHASES.length,
      width: contentW,
      label: MitosisMeiosisStrings.stageSliderStringProperty.value,
      format: (n) => {
        const names = model.getStageNames()
        const full = names[clamp(Math.round(n), 0, names.length - 1)] ?? ''
        // Short readout so DepthSlider value is not clipped (full name is on stage).
        if (full.length <= 8) return full
        const word = full.split(/[\s/]/)[0]
        return word.length <= 8 ? word : `${word.slice(0, 7)}…`
      },
      fill: '#7c3aed',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(stageSlider)

    const stageBlendSlider = new DepthSlider(model.stageBlendProperty, {
      min: 0,
      max: 1,
      width: contentW,
      label: MitosisMeiosisStrings.stageBlendStringProperty.value,
      format: (n) => `${Math.round(n * 100)}%`,
      fill: HeredityColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(stageBlendSlider)

    const cellSizeSlider = new DepthSlider(model.cellSizeProperty, {
      min: 0.7,
      max: 1.3,
      width: contentW,
      label: MitosisMeiosisStrings.cellSizeStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: HeredityColors.cellMembrane,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(cellSizeSlider)

    const condensationSlider = new DepthSlider(model.condensationProperty, {
      min: 0.4,
      max: 1.4,
      width: contentW,
      label: MitosisMeiosisStrings.condensationStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: HeredityColors.chromosome,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(condensationSlider)

    const particleIntensitySlider = new DepthSlider(model.particleIntensityProperty, {
      min: 0,
      max: 2,
      width: contentW,
      label: MitosisMeiosisStrings.particleIntensityStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: HeredityColors.dnaStrandA,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(particleIntensitySlider)

    // Section 4 — Display
    const displayHeader = controlSection(MitosisMeiosisStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(MitosisMeiosisStrings.labelsOnStringProperty.value, () => {
      model.showLabelsProperty.value = !model.showLabelsProperty.value
    }, { width: halfW, height: btnH, fill: '#64748b', selected: true, fontSize: 11, onSound: () => sounds.softClick() })
    this.spindleBtn = new SoftButton(MitosisMeiosisStrings.spindleOnStringProperty.value, () => {
      model.showSpindleProperty.value = !model.showSpindleProperty.value
    }, { width: halfW, height: btnH, fill: SPINDLE_GRAY, selected: true, fontSize: 11, onSound: () => sounds.softClick() })
    this.envelopeBtn = new SoftButton(MitosisMeiosisStrings.envelopeOnStringProperty.value, () => {
      model.showEnvelopeProperty.value = !model.showEnvelopeProperty.value
    }, { width: halfW, height: btnH, fill: '#0ea5e9', selected: true, fontSize: 11, onSound: () => sounds.softClick() })
    this.centriolesBtn = new SoftButton(MitosisMeiosisStrings.centriolesOnStringProperty.value, () => {
      model.showCentriolesProperty.value = !model.showCentriolesProperty.value
    }, { width: halfW, height: btnH, fill: HeredityColors.spindle, selected: true, fontSize: 11, onSound: () => sounds.softClick() })
    this.cytoplasmBtn = new SoftButton(MitosisMeiosisStrings.cytoplasmOnStringProperty.value, () => {
      model.showCytoplasmProperty.value = !model.showCytoplasmProperty.value
    }, { width: halfW, height: btnH, fill: HeredityColors.cellMembrane, selected: true, fontSize: 11, onSound: () => sounds.softClick() })
    this.crossingOverBtn = new SoftButton(MitosisMeiosisStrings.crossingOverOnStringProperty.value, () => {
      model.showCrossingOverProperty.value = !model.showCrossingOverProperty.value
    }, { width: halfW, height: btnH, fill: HeredityColors.chromosomeAlt, selected: true, fontSize: 11, onSound: () => sounds.softClick() })
    this.compareBtn = new SoftButton(MitosisMeiosisStrings.compareOnStringProperty.value, () => {
      model.compareModeProperty.value = !model.compareModeProperty.value
    }, { width: halfW, height: btnH, fill: '#16a34a', selected: false, fontSize: 11, onSound: () => sounds.softClick() })
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.spindleBtn)
    panelContent.addChild(this.envelopeBtn)
    panelContent.addChild(this.centriolesBtn)
    panelContent.addChild(this.cytoplasmBtn)
    panelContent.addChild(this.crossingOverBtn)
    panelContent.addChild(this.compareBtn)

    const compareHint = controlHint(MitosisMeiosisStrings.compareHintStringProperty.value, contentW)
    panelContent.addChild(compareHint)

    // Section 5 — Playback
    const playbackHeader = controlSection(MitosisMeiosisStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(MitosisMeiosisStrings.playButtonStringProperty.value, () => {
      model.togglePlay()
      sounds.playPause(model.runningProperty.value)
    }, { width: halfW, height: 36, fill: '#7c3aed', fontSize: 12 })
    const stepOnceBtn = new SoftButton(MitosisMeiosisStrings.stepOnceStringProperty.value, () => {
      model.stepOnce()
      sounds.softClick()
    }, { width: halfW, height: 36, fill: '#475569', fontSize: 12 })
    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(stepOnceBtn)

    const prevBtn = new SoftButton(MitosisMeiosisStrings.prevStageStringProperty.value, () => {
      model.prevStage()
      sounds.softClick()
    }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11 })
    const nextBtn = new SoftButton(MitosisMeiosisStrings.nextStageStringProperty.value, () => {
      model.nextStage()
      sounds.softClick()
    }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11 })
    panelContent.addChild(prevBtn)
    panelContent.addChild(nextBtn)

    const simSpeedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: MitosisMeiosisStrings.simSpeedStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: HeredityColors.dnaStrandA,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(simSpeedSlider)

    this.autoAdvanceBtn = new SoftButton(MitosisMeiosisStrings.autoAdvanceOnStringProperty.value, () => {
      model.autoAdvanceProperty.value = !model.autoAdvanceProperty.value
    }, { width: contentW, height: btnH, fill: '#0ea5e9', selected: true, fontSize: 11, onSound: () => sounds.softClick() })
    this.pauseAtEndBtn = new SoftButton(MitosisMeiosisStrings.pauseAtEndOnStringProperty.value, () => {
      model.pauseAtEndProperty.value = !model.pauseAtEndProperty.value
    }, { width: halfW, height: btnH, fill: '#64748b', selected: false, fontSize: 11, onSound: () => sounds.softClick() })
    this.loopBtn = new SoftButton(MitosisMeiosisStrings.loopOnStringProperty.value, () => {
      model.loopProperty.value = !model.loopProperty.value
    }, { width: halfW, height: btnH, fill: HeredityColors.accent, selected: true, fontSize: 11, onSound: () => sounds.softClick() })
    panelContent.addChild(this.autoAdvanceBtn)
    panelContent.addChild(this.pauseAtEndBtn)
    panelContent.addChild(this.loopBtn)

    const soundToggleBtn = new SoftButton(
      MitosisMeiosisStrings.soundOnStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        soundToggleBtn.setLabel(
          on
            ? MitosisMeiosisStrings.soundOnStringProperty.value
            : MitosisMeiosisStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', selected: true, fontSize: 11, onSound: () => sounds.softClick() },
    )
    panelContent.addChild(soundToggleBtn)

    // Section 6 — Status, stars, quiz, tip
    const quickCheckBtn = new SoftButton(MitosisMeiosisStrings.quickCheckButtonStringProperty.value, () => {
      this.showQuiz()
      sounds.softClick()
    }, { width: contentW, height: btnH, fill: '#0d9488', fontSize: 11 })
    panelContent.addChild(quickCheckBtn)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: HeredityColors.accent,
    })
    panelContent.addChild(this.starsText)

    this.statusText = new Text(model.statusProperty.value, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: HeredityColors.panelText,
      maxWidth: contentW,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(MitosisMeiosisStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 12,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenariosHeader.left = 0
      scenariosHeader.top = py
      py = scenariosHeader.bottom + 6
      exploreBtn.left = 0
      exploreBtn.top = py
      py = exploreBtn.bottom + gridGap
      growthBtn.left = 0
      growthBtn.top = py
      py = growthBtn.bottom + gridGap
      gametesBtn.left = 0
      gametesBtn.top = py
      py = gametesBtn.bottom + 12

      divisionHeader.left = 0
      divisionHeader.top = py
      py = divisionHeader.bottom + 6
      mitosisBtn.left = 0
      mitosisBtn.top = py
      meiosisBtn.left = halfW + 8
      meiosisBtn.top = py
      py = mitosisBtn.bottom + 12

      chromosomesHeader.left = 0
      chromosomesHeader.top = py
      py = chromosomesHeader.bottom + 6
      chromosomeSlider.left = 0
      chromosomeSlider.top = py
      py = chromosomeSlider.bottom + 12

      visualHeader.left = 0
      visualHeader.top = py
      py = visualHeader.bottom + 6
      stageSlider.left = 0
      stageSlider.top = py
      py = stageSlider.bottom + 8
      stageBlendSlider.left = 0
      stageBlendSlider.top = py
      py = stageBlendSlider.bottom + 8
      cellSizeSlider.left = 0
      cellSizeSlider.top = py
      py = cellSizeSlider.bottom + 8
      condensationSlider.left = 0
      condensationSlider.top = py
      py = condensationSlider.bottom + 8
      particleIntensitySlider.left = 0
      particleIntensitySlider.top = py
      py = particleIntensitySlider.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.spindleBtn.left = halfW + 8
      this.spindleBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.envelopeBtn.left = 0
      this.envelopeBtn.top = py
      this.centriolesBtn.left = halfW + 8
      this.centriolesBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.cytoplasmBtn.left = 0
      this.cytoplasmBtn.top = py
      this.crossingOverBtn.left = halfW + 8
      this.crossingOverBtn.top = py
      py = this.cytoplasmBtn.bottom + gridGap
      this.compareBtn.left = 0
      this.compareBtn.top = py
      py = this.compareBtn.bottom + 4
      compareHint.left = 0
      compareHint.top = py
      py = compareHint.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      stepOnceBtn.left = halfW + 8
      stepOnceBtn.top = py
      py = this.playPauseBtn.bottom + gridGap
      prevBtn.left = 0
      prevBtn.top = py
      nextBtn.left = halfW + 8
      nextBtn.top = py
      py = prevBtn.bottom + 8
      simSpeedSlider.left = 0
      simSpeedSlider.top = py
      py = simSpeedSlider.bottom + 8
      this.autoAdvanceBtn.left = 0
      this.autoAdvanceBtn.top = py
      py = this.autoAdvanceBtn.bottom + gridGap
      this.pauseAtEndBtn.left = 0
      this.pauseAtEndBtn.top = py
      this.loopBtn.left = halfW + 8
      this.loopBtn.top = py
      py = this.pauseAtEndBtn.bottom + gridGap
      soundToggleBtn.left = 0
      soundToggleBtn.top = py
      py = soundToggleBtn.bottom + 12

      quickCheckBtn.left = 0
      quickCheckBtn.top = py
      py = quickCheckBtn.bottom + 10
      this.starsText.left = 0
      this.starsText.top = py
      py = this.starsText.bottom + 6
      this.statusText.left = 0
      this.statusText.top = py
      py = this.statusText.bottom + 6
      learnTip.left = 0
      learnTip.top = py
      py = learnTip.bottom + 4
      bottomPad.top = py
    }
    relayoutPanel()

    const scroller = new ScrollableNode(panelContent, rightW - 24, stageH - 72)
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

    // ── Sync helpers ─────────────────────────────────────────────────────────
    const syncStars = () => {
      this.starsText.string = `${MitosisMeiosisStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncStatus = () => {
      this.statusText.string = model.statusProperty.value
      relayoutPanel()
    }
    const syncScenario = () => {
      const s = model.scenarioProperty.value
      exploreBtn.setSelected(s === 'explore')
      growthBtn.setSelected(s === 'growth')
      gametesBtn.setSelected(s === 'gametes')
    }
    const syncMode = () => {
      const mode = model.modeProperty.value
      mitosisBtn.setSelected(mode === 'mitosis')
      meiosisBtn.setSelected(mode === 'meiosis')
      this.updateGuidance()
      this.updateCompareCard()
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? MitosisMeiosisStrings.pauseButtonStringProperty.value
          : MitosisMeiosisStrings.playButtonStringProperty.value,
      )
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? MitosisMeiosisStrings.labelsOnStringProperty.value
          : MitosisMeiosisStrings.labelsOffStringProperty.value,
      )
    }
    const syncSpindle = () => {
      this.spindleBtn.setSelected(model.showSpindleProperty.value)
      this.spindleBtn.setLabel(
        model.showSpindleProperty.value
          ? MitosisMeiosisStrings.spindleOnStringProperty.value
          : MitosisMeiosisStrings.spindleOffStringProperty.value,
      )
    }
    const syncEnvelope = () => {
      this.envelopeBtn.setSelected(model.showEnvelopeProperty.value)
      this.envelopeBtn.setLabel(
        model.showEnvelopeProperty.value
          ? MitosisMeiosisStrings.envelopeOnStringProperty.value
          : MitosisMeiosisStrings.envelopeOffStringProperty.value,
      )
    }
    const syncCentrioles = () => {
      this.centriolesBtn.setSelected(model.showCentriolesProperty.value)
      this.centriolesBtn.setLabel(
        model.showCentriolesProperty.value
          ? MitosisMeiosisStrings.centriolesOnStringProperty.value
          : MitosisMeiosisStrings.centriolesOffStringProperty.value,
      )
    }
    const syncCompare = () => {
      this.compareBtn.setSelected(model.compareModeProperty.value)
      this.compareBtn.setLabel(
        model.compareModeProperty.value
          ? MitosisMeiosisStrings.compareOnStringProperty.value
          : MitosisMeiosisStrings.compareOffStringProperty.value,
      )
      this.updateCompareCard()
      this.updateGuidance()
    }
    const syncAutoAdvance = () => {
      this.autoAdvanceBtn.setSelected(model.autoAdvanceProperty.value)
      this.autoAdvanceBtn.setLabel(
        model.autoAdvanceProperty.value
          ? MitosisMeiosisStrings.autoAdvanceOnStringProperty.value
          : MitosisMeiosisStrings.autoAdvanceOffStringProperty.value,
      )
    }
    const syncCytoplasm = () => {
      this.cytoplasmBtn.setSelected(model.showCytoplasmProperty.value)
      this.cytoplasmBtn.setLabel(
        model.showCytoplasmProperty.value
          ? MitosisMeiosisStrings.cytoplasmOnStringProperty.value
          : MitosisMeiosisStrings.cytoplasmOffStringProperty.value,
      )
    }
    const syncCrossingOver = () => {
      this.crossingOverBtn.setSelected(model.showCrossingOverProperty.value)
      this.crossingOverBtn.setLabel(
        model.showCrossingOverProperty.value
          ? MitosisMeiosisStrings.crossingOverOnStringProperty.value
          : MitosisMeiosisStrings.crossingOverOffStringProperty.value,
      )
    }
    const syncPauseAtEnd = () => {
      this.pauseAtEndBtn.setSelected(model.pauseAtEndProperty.value)
      this.pauseAtEndBtn.setLabel(
        model.pauseAtEndProperty.value
          ? MitosisMeiosisStrings.pauseAtEndOnStringProperty.value
          : MitosisMeiosisStrings.pauseAtEndOffStringProperty.value,
      )
    }
    const syncLoop = () => {
      this.loopBtn.setSelected(model.loopProperty.value)
      this.loopBtn.setLabel(
        model.loopProperty.value
          ? MitosisMeiosisStrings.loopOnStringProperty.value
          : MitosisMeiosisStrings.loopOffStringProperty.value,
      )
    }

    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.scenarioProperty.link(syncScenario)
    model.modeProperty.link(syncMode)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncLabels)
    model.showSpindleProperty.link(syncSpindle)
    model.showEnvelopeProperty.link(syncEnvelope)
    model.showCentriolesProperty.link(syncCentrioles)
    model.compareModeProperty.link(syncCompare)
    model.autoAdvanceProperty.link(syncAutoAdvance)
    model.showCytoplasmProperty.link(syncCytoplasm)
    model.showCrossingOverProperty.link(syncCrossingOver)
    model.pauseAtEndProperty.link(syncPauseAtEnd)
    model.loopProperty.link(syncLoop)
    model.starsProperty.link(syncStars)
    model.statusProperty.link(syncStatus)
    model.chromosomeCountProperty.link(() => {
      this.assortmentValid = false
      this.updateCompareCard()
    })

    model.stageProperty.lazyLink((stage) => {
      if (stage <= 1) {
        this.assortmentValid = false
      }
      const intensity = Math.max(0, model.particleIntensityProperty.value)
      if (intensity > 0) {
        this.particles.burst(this.cx, this.cy, {
          count: Math.round(16 * intensity),
          color: PALETTE[stage % PALETTE.length],
          speed: 70,
          life: 0.45,
          radius: 3,
        })
      }
      sounds.hop()
      this.updateGuidance()
    })
    model.modeProperty.lazyLink((mode) => {
      this.assortmentValid = false
      sounds.modeChange(mode === 'meiosis')
      this.showTipCard(
        mode === 'mitosis'
          ? 'Mitosis: 1 division → 2 identical, diploid cells. Used for growth, repair, and replacing worn-out cells.'
          : 'Meiosis: 2 divisions → 4 unique, haploid gametes (sex cells) with half the chromosomes.',
      )
    })
    model.cycleCountProperty.lazyLink(() => {
      sounds.celebrate()
      const intensity = Math.max(0, model.particleIntensityProperty.value)
      if (intensity > 0) {
        this.particles.burst(this.cx, this.cy, {
          count: Math.round(30 * intensity),
          color: HeredityColors.gene,
          speed: 110,
          life: 0.7,
          radius: 4,
        })
      }
      if (!this.quizShown) {
        this.quizShown = true
        this.showQuiz()
      }
    })

    syncStars()
    syncStatus()
    syncScenario()
    syncMode()
    syncPlayPause()
    syncLabels()
    syncSpindle()
    syncEnvelope()
    syncCentrioles()
    syncCompare()
    syncAutoAdvance()
    syncCytoplasm()
    syncCrossingOver()
    syncPauseAtEnd()
    syncLoop()
    this.updateGuidance()
    this.updateCompareCard()
  }

  private ensureAssortment(numPairs: number): void {
    if (!this.assortmentValid || this.assortment.length !== numPairs) {
      this.assortment = Array.from({ length: numPairs }, () => (Math.random() < 0.5 ? 0 : 1))
      this.assortmentValid = true
    }
  }

  private computeUnitsScaled(
    phase: PhaseKind,
    mode: DivisionMode,
    n: number,
    progress: number,
    R: number,
    cx: number,
    cy: number,
    leftCellCenter: Pt,
    rightCellCenter: Pt,
    gameteCenters: Pt[],
  ): Unit[] {
    return this.computeUnits(phase, mode, n, progress, R, cx, cy, leftCellCenter, rightCellCenter, gameteCenters)
  }

  private computeUnits(
    phase: PhaseKind,
    mode: DivisionMode,
    n: number,
    progress: number,
    R: number,
    cx: number,
    cy: number,
    leftCellCenter: Pt,
    rightCellCenter: Pt,
    gameteCenters: Pt[],
  ): Unit[] {
    const numPairs = Math.max(1, Math.floor(n / 2))
    const units: Unit[] = []

    if (phase === 'prophase') {
      for (let i = 0; i < n; i++) {
        const pairIndex = Math.floor(i / 2)
        const homolog = i % 2
        const jitter = seededJitter(i)
        const scatterX = cx + jitter.dx * R * 0.6
        const scatterY = cy + jitter.dy * R * 0.6
        let x = scatterX
        let y = scatterY
        let rot = jitter.rot
        if (mode === 'meiosis') {
          const pj = seededJitter(pairIndex + 50)
          const baseX = cx + pj.dx * R * 0.35
          const baseY = cy + pj.dy * R * 0.35
          const tangent = homolog === 0 ? -10 : 10
          x = lerp(scatterX, baseX + tangent, progress)
          y = lerp(scatterY, baseY, progress)
          rot = lerp(jitter.rot, 0, progress)
        }
        units.push({ x, y, rotation: rot, doubled: true, color: PALETTE[i % PALETTE.length] })
      }
      return units
    }

    if (phase === 'metaphase') {
      if (mode === 'mitosis') {
        const spacing = n > 1 ? (R * 1.1) / (n - 1) : 0
        for (let i = 0; i < n; i++) {
          const x = n === 1 ? cx : cx - R * 0.55 + i * spacing
          units.push({ x, y: cy, rotation: 0, doubled: true, color: PALETTE[i % PALETTE.length] })
        }
      }
      else {
        const spacing = numPairs > 1 ? (R * 1.1) / (numPairs - 1) : 0
        for (let p = 0; p < numPairs; p++) {
          const slotX = numPairs === 1 ? cx : cx - R * 0.55 + p * spacing
          units.push({ x: slotX - 9, y: cy, rotation: 0, doubled: true, color: PALETTE[(p * 2) % PALETTE.length] })
          units.push({ x: slotX + 9, y: cy, rotation: 0, doubled: true, color: PALETTE[(p * 2 + 1) % PALETTE.length] })
        }
      }
      return units
    }

    if (phase === 'anaphase') {
      const poleTopY = cy - R * 1.15
      const poleBottomY = cy + R * 1.15
      if (mode === 'mitosis') {
        const spacing = n > 1 ? (R * 1.1) / (n - 1) : 0
        for (let i = 0; i < n; i++) {
          const plateX = n === 1 ? cx : cx - R * 0.55 + i * spacing
          const yTop = lerp(cy, poleTopY, progress)
          const yBottom = lerp(cy, poleBottomY, progress)
          const color = PALETTE[i % PALETTE.length]
          units.push({ x: plateX, y: yTop, rotation: 0, doubled: false, color })
          units.push({ x: plateX, y: yBottom, rotation: 0, doubled: false, color })
        }
      }
      else {
        this.ensureAssortment(numPairs)
        const spacing = numPairs > 1 ? (R * 1.1) / (numPairs - 1) : 0
        for (let p = 0; p < numPairs; p++) {
          const slotX = numPairs === 1 ? cx : cx - R * 0.55 + p * spacing
          const goesTopFirst = this.assortment[p] === 0
          const yA = lerp(cy, goesTopFirst ? poleTopY : poleBottomY, progress)
          const yB = lerp(cy, goesTopFirst ? poleBottomY : poleTopY, progress)
          const xA = lerp(slotX - 9, cx, progress)
          const xB = lerp(slotX + 9, cx, progress)
          units.push({ x: xA, y: yA, rotation: 0, doubled: true, color: PALETTE[(p * 2) % PALETTE.length] })
          units.push({ x: xB, y: yB, rotation: 0, doubled: true, color: PALETTE[(p * 2 + 1) % PALETTE.length] })
        }
      }
      return units
    }

    if (phase === 'telophase') {
      const pinchT = progress
      const leftC = leftCellCenter
      const rightC = rightCellCenter
      if (mode === 'mitosis') {
        for (let i = 0; i < n; i++) {
          const jTop = seededJitter(i)
          const jBottom = seededJitter(i + 6)
          const color = PALETTE[i % PALETTE.length]
          const xTop = lerp(cx, leftC.x + jTop.dx * R * 0.28, pinchT)
          const yTop = lerp(cy - R * 0.9, leftC.y + jTop.dy * R * 0.28, pinchT)
          const xBottom = lerp(cx, rightC.x + jBottom.dx * R * 0.28, pinchT)
          const yBottom = lerp(cy + R * 0.9, rightC.y + jBottom.dy * R * 0.28, pinchT)
          units.push({ x: xTop, y: yTop, rotation: 0, doubled: false, color })
          units.push({ x: xBottom, y: yBottom, rotation: 0, doubled: false, color })
        }
      }
      else {
        this.ensureAssortment(numPairs)
        for (let p = 0; p < numPairs; p++) {
          const goesLeftFirst = this.assortment[p] === 0
          const targetA = goesLeftFirst ? leftC : rightC
          const targetB = goesLeftFirst ? rightC : leftC
          const jA = seededJitter(p + 20)
          const jB = seededJitter(p + 30)
          const xA = lerp(cx, targetA.x + jA.dx * R * 0.25, pinchT)
          const yA = lerp(cy - R * 0.9, targetA.y + jA.dy * R * 0.25, pinchT)
          const xB = lerp(cx, targetB.x + jB.dx * R * 0.25, pinchT)
          const yB = lerp(cy + R * 0.9, targetB.y + jB.dy * R * 0.25, pinchT)
          units.push({ x: xA, y: yA, rotation: 0, doubled: true, color: PALETTE[(p * 2) % PALETTE.length] })
          units.push({ x: xB, y: yB, rotation: 0, doubled: true, color: PALETTE[(p * 2 + 1) % PALETTE.length] })
        }
      }
      return units
    }

    if (phase === 'divisionII') {
      this.ensureAssortment(numPairs)
      const splitProgress = clamp((progress - 0.5) * 2, 0, 1)
      const cells = [
        { center: leftCellCenter, sign: 0 },
        { center: rightCellCenter, sign: 1 },
      ]
      for (const cell of cells) {
        for (let p = 0; p < numPairs; p++) {
          const colorIdx = this.assortment[p] === cell.sign ? p * 2 : p * 2 + 1
          const color = PALETTE[colorIdx % PALETTE.length]
          const slotOffsetX = numPairs === 1 ? 0 : (p - (numPairs - 1) / 2) * 20
          const plateX = cell.center.x + slotOffsetX
          const plateY = cell.center.y
          if (splitProgress <= 0) {
            units.push({ x: plateX, y: plateY, rotation: 0, doubled: true, color })
          }
          else {
            const poleTopY = cell.center.y - R * 0.55
            const poleBottomY = cell.center.y + R * 0.55
            const yTop = lerp(plateY, poleTopY, splitProgress)
            const yBottom = lerp(plateY, poleBottomY, splitProgress)
            units.push({ x: plateX, y: yTop, rotation: 0, doubled: false, color })
            units.push({ x: plateX, y: yBottom, rotation: 0, doubled: false, color })
          }
        }
      }
      return units
    }

    // result
    if (mode === 'mitosis') {
      for (const center of [leftCellCenter, rightCellCenter]) {
        const cols = Math.max(1, Math.ceil(n / 2))
        for (let i = 0; i < n; i++) {
          const row = Math.floor(i / cols)
          const col = i % cols
          const x = center.x + (col - (cols - 1) / 2) * 16
          const y = center.y + (row - 0.5) * 18
          units.push({ x, y, rotation: 0, doubled: false, color: PALETTE[i % PALETTE.length] })
        }
      }
    }
    else {
      this.ensureAssortment(numPairs)
      for (let g = 0; g < 4; g++) {
        const secondaryCellSign = g < 2 ? 0 : 1
        const center = gameteCenters[g]
        for (let p = 0; p < numPairs; p++) {
          const colorIdx = this.assortment[p] === secondaryCellSign ? p * 2 : p * 2 + 1
          const color = PALETTE[colorIdx % PALETTE.length]
          const x = center.x + (p - (numPairs - 1) / 2) * 14
          const y = center.y
          units.push({ x, y, rotation: 0, doubled: false, color })
        }
      }
    }
    return units
  }

  private redrawStage(): void {
    const model = this.model
    const mode = model.modeProperty.value
    const stageIdx = model.stageProperty.value
    const n = model.chromosomeCountProperty.value
    const phase = phaseKindFor(mode, stageIdx)
    const sizeScale = model.cellSizeProperty.value
    const condensation = model.condensationProperty.value
    const progress = smoothstep(clamp(model.stageBlendProperty.value, 0, 1))
    const R = this.cellR * sizeScale
    const cx = this.cx
    const cy = this.cy
    const leftCellCenter = { x: cx - this.cellR * 1.35 * sizeScale, y: cy }
    const rightCellCenter = { x: cx + this.cellR * 1.35 * sizeScale, y: cy }
    const gameteCenters = [0, 1, 2, 3].map((i) => ({
      x: cx + (i - 1.5) * this.cellR * 1.15 * sizeScale,
      y: cy,
    }))

    this.stageNameText.string = model.getStageNames()[stageIdx] ?? ''
    this.stageNameText.centerX = cx

    const units = this.computeUnitsScaled(phase, mode, n, progress, R, cx, cy, leftCellCenter, rightCellCenter, gameteCenters)
    for (let i = 0; i < this.chromosomePool.length; i++) {
      if (i < units.length) {
        this.chromosomePool[i].apply(units[i], condensation)
      }
      else {
        this.chromosomePool[i].hide()
      }
    }

    this.membraneLayer.removeAllChildren()
    this.spindleLayer.removeAllChildren()
    this.labelLayer.removeAllChildren()

    const pulse = 0.5 + 0.5 * Math.sin(this.time * 1.6)
    const showLabels = model.showLabelsProperty.value
    const showSpindle = model.showSpindleProperty.value
    const showEnvelope = model.showEnvelopeProperty.value
    const showCentrioles = model.showCentriolesProperty.value
    const showCytoplasm = model.showCytoplasmProperty.value
    const showCrossingOver = model.showCrossingOverProperty.value

    const drawCytoplasm = (center: Pt, rx: number, ry: number, opacity = 1) => {
      if (!showCytoplasm || opacity <= 0.02) return
      this.membraneLayer.addChild(
        new Path(Shape.ellipse(center.x, center.y, rx * 0.92, ry * 0.92, 0), {
          fill: HeredityColors.cytoplasm,
          opacity,
        }),
      )
    }

    const drawMembrane = (center: Pt, rx: number, ry: number, opacity = 1) => {
      drawCytoplasm(center, rx, ry, opacity)
      this.membraneLayer.addChild(
        new Path(Shape.ellipse(center.x, center.y, rx + 4, ry + 4, 0), {
          fill: 'rgba(15,23,42,0.12)',
          opacity,
        }),
      )
      this.membraneLayer.addChild(
        new Path(Shape.ellipse(center.x, center.y, rx, ry, 0), {
          fill: 'rgba(219,234,254,0.55)',
          stroke: `rgba(71,85,105,${0.5 + 0.15 * pulse})`,
          lineWidth: 1.6,
          opacity,
        }),
      )
    }

    const drawEnvelope = (center: Pt, r: number, opacity: number) => {
      if (!showEnvelope || opacity <= 0.02) return
      this.membraneLayer.addChild(
        new Path(Shape.ellipse(center.x, center.y, r, r, 0), {
          stroke: HeredityColors.nucleusFill,
          lineWidth: 1.4,
          fill: 'rgba(142,68,173,0.08)',
          opacity,
        }),
      )
    }

    const drawCentrioles = (poleCenter: Pt) => {
      if (!showCentrioles) return
      const g = new Node()
      g.addChild(new Circle(3.2, { fill: '#334155', x: -3, y: 0 }))
      g.addChild(new Circle(3.2, { fill: '#334155', x: 3, y: 0 }))
      g.x = poleCenter.x
      g.y = poleCenter.y
      this.membraneLayer.addChild(g)
    }

    const drawSpindle = (poleTop: Pt, poleBottom: Pt, targets: Unit[]) => {
      if (!showSpindle) return
      for (const t of targets) {
        this.spindleLayer.addChild(
          new Line(poleTop.x, poleTop.y, t.x, t.y, {
            stroke: `rgba(148,163,184,${0.35 + 0.15 * pulse})`,
            lineWidth: 1,
          }),
        )
        this.spindleLayer.addChild(
          new Line(poleBottom.x, poleBottom.y, t.x, t.y, {
            stroke: `rgba(148,163,184,${0.35 + 0.15 * pulse})`,
            lineWidth: 1,
          }),
        )
      }
    }

    const drawCrossingOver = (pairCenters: Pt[]) => {
      if (!showCrossingOver || mode !== 'meiosis' || phase !== 'prophase') return
      for (const center of pairCenters) {
        const s = 8 * condensation
        this.spindleLayer.addChild(
          new Line(center.x - s, center.y - s, center.x + s, center.y + s, {
            stroke: HeredityColors.accent,
            lineWidth: 2,
            opacity: 0.75 + 0.2 * progress,
          }),
        )
        this.spindleLayer.addChild(
          new Line(center.x + s, center.y - s, center.x - s, center.y + s, {
            stroke: HeredityColors.accent,
            lineWidth: 2,
            opacity: 0.75 + 0.2 * progress,
          }),
        )
      }
    }

    if (phase === 'prophase' || phase === 'metaphase' || phase === 'anaphase') {
      const stretch = phase === 'anaphase' ? 1 + 0.18 * progress : 1
      drawMembrane({ x: cx, y: cy }, R / stretch, R * stretch)
      if (phase === 'prophase') {
        drawEnvelope({ x: cx, y: cy }, R * 0.7, Math.max(0, 1 - progress * 1.3))
        if (mode === 'meiosis') {
          const numPairs = Math.max(1, Math.floor(n / 2))
          const pairCenters: Pt[] = []
          for (let p = 0; p < numPairs; p++) {
            const pj = seededJitter(p + 50)
            pairCenters.push({ x: cx + pj.dx * R * 0.35, y: cy + pj.dy * R * 0.35 })
          }
          drawCrossingOver(pairCenters)
        }
      }
      if (phase === 'metaphase' || phase === 'anaphase') {
        const poleTop = { x: cx, y: cy - R * 1.35 }
        const poleBottom = { x: cx, y: cy + R * 1.35 }
        drawSpindle(poleTop, poleBottom, units)
        drawCentrioles(poleTop)
        drawCentrioles(poleBottom)
        if (showLabels) {
          this.labelLayer.addChild(
            new Text(MitosisMeiosisStrings.poleLabelStringProperty.value, {
              font: new PhetFont(10),
              fill: HeredityColors.muted,
              centerX: poleTop.x,
              bottom: poleTop.y - 6,
            }),
          )
        }
      }
      if (showLabels) {
        this.labelLayer.addChild(
          new Text(MitosisMeiosisStrings.cellLabelStringProperty.value, {
            font: new PhetFont({ size: 12, weight: 'bold' }),
            fill: HeredityColors.muted,
            centerX: cx,
            top: cy + R * stretch + 10,
          }),
        )
      }
    }
    else if (phase === 'telophase') {
      const pinchT = progress
      const leftC = { x: lerp(cx, leftCellCenter.x, pinchT), y: lerp(cy, leftCellCenter.y, pinchT) }
      const rightC = { x: lerp(cx, rightCellCenter.x, pinchT), y: lerp(cy, rightCellCenter.y, pinchT) }
      const r = lerp(R, R * 0.72, pinchT)
      drawMembrane(leftC, r, r)
      drawMembrane(rightC, r, r)
      drawEnvelope(leftC, r * 0.65, pinchT)
      drawEnvelope(rightC, r * 0.65, pinchT)
      if (showLabels && pinchT > 0.6) {
        for (const c of [leftC, rightC]) {
          this.labelLayer.addChild(
            new Text(MitosisMeiosisStrings.daughterCellLabelStringProperty.value, {
              font: new PhetFont({ size: 11, weight: 'bold' }),
              fill: HeredityColors.muted,
              centerX: c.x,
              top: c.y + r + 8,
              opacity: (pinchT - 0.6) / 0.4,
            }),
          )
        }
      }
    }
    else if (phase === 'divisionII') {
      const r = R * 0.72
      const splitProgress = clamp((progress - 0.5) * 2, 0, 1)
      for (const center of [leftCellCenter, rightCellCenter]) {
        drawMembrane(center, r, r)
        if (showSpindle) {
          const poleTop = { x: center.x, y: center.y - r * 0.85 }
          const poleBottom = { x: center.x, y: center.y + r * 0.85 }
          const targets = units.filter((u) => Math.abs(u.x - center.x) < r * 1.2 && Math.abs(u.y - center.y) < r * 1.2)
          drawSpindle(poleTop, poleBottom, targets)
          if (splitProgress < 1) {
            drawCentrioles(poleTop)
            drawCentrioles(poleBottom)
          }
        }
      }
      if (showLabels) {
        this.labelLayer.addChild(
          new Text(
            splitProgress < 0.5
              ? MitosisMeiosisStrings.spindleLabelStringProperty.value
              : MitosisMeiosisStrings.gameteCellLabelStringProperty.value,
            {
              font: new PhetFont({ size: 11, weight: 'bold' }),
              fill: HeredityColors.muted,
              centerX: cx,
              top: cy + r + 10,
            },
          ),
        )
      }
    }
    else {
      // result
      if (mode === 'mitosis') {
        const r = R * 0.72
        for (const center of [leftCellCenter, rightCellCenter]) {
          drawMembrane(center, r, r)
          drawEnvelope(center, r * 0.6, 1)
          if (showLabels) {
            this.labelLayer.addChild(
              new Text(MitosisMeiosisStrings.daughterCellLabelStringProperty.value, {
                font: new PhetFont({ size: 11, weight: 'bold' }),
                fill: HeredityColors.muted,
                centerX: center.x,
                top: center.y + r + 8,
              }),
            )
          }
        }
      }
      else {
        const r = R * 0.5
        gameteCenters.forEach((center, i) => {
          drawMembrane(center, r, r)
          drawEnvelope(center, r * 0.55, 1)
          if (showLabels) {
            this.labelLayer.addChild(
              new Text(`${MitosisMeiosisStrings.gameteCellLabelStringProperty.value} ${i + 1}`, {
                font: new PhetFont({ size: 10, weight: 'bold' }),
                fill: HeredityColors.muted,
                centerX: center.x,
                top: center.y + r + 6,
              }),
            )
          }
        })
      }
    }
  }

  private updateCompareCard(): void {
    const model = this.model
    const n = model.chromosomeCountProperty.value
    this.compareCard.visible = model.compareModeProperty.value
    this.compareMitosisText.string =
      `${MitosisMeiosisStrings.compareMitosisSummaryStringProperty.value} (${n} chromosomes each)`
    this.compareMeiosisText.string =
      `${MitosisMeiosisStrings.compareMeiosisSummaryStringProperty.value} (${n / 2} chromosomes each)`
    this.teachingTriad.top = 12
    this.compareCard.top = this.teachingTriad.bottom + 10
    this.soundBtn.top = this.compareCard.visible ? this.compareCard.bottom + 12 : this.teachingTriad.bottom + 12
  }

  private updateGuidance(): void {
    const model = this.model
    const mode = model.modeProperty.value
    const stageIdx = model.stageProperty.value
    const phase = phaseKindFor(mode, stageIdx)
    const stageName = model.getStageNames()[stageIdx] ?? ''

    if (model.compareModeProperty.value) {
      this.guide.setGuidance(
        MitosisMeiosisStrings.guideTitleStringProperty.value,
        'Comparing: switch Mitosis ↔ Meiosis and watch the cell/chromosome counts change in the Compare card.',
      )
      this.teachingTriad.setTriad(
        `Currently viewing: ${mode === 'mitosis' ? 'Mitosis' : 'Meiosis'} — ${stageName}.`,
        mode === 'mitosis'
          ? 'Mitosis keeps the chromosome number the same in both daughter cells.'
          : 'Meiosis cuts the chromosome number in half across four gametes.',
        'Switch the other division type to compare cell counts side by side.',
      )
      return
    }

    if (phase === 'result') {
      this.guide.setGuidance(MitosisMeiosisStrings.guideTitleStringProperty.value, MitosisMeiosisStrings.guideResultStringProperty.value)
      this.teachingTriad.setTriad(
        mode === 'mitosis' ? '2 identical cells formed!' : '4 unique gametes formed!',
        mode === 'mitosis'
          ? 'Each daughter cell got a full, identical set of chromosomes — perfect for growth and repair.'
          : 'Each gamete got half the chromosomes — combining with another gamete restores the full number.',
        'Press Next/Play to loop again, or switch division type to compare.',
      )
    }
    else if (phase === 'prophase') {
      this.guide.setGuidance(MitosisMeiosisStrings.guideTitleStringProperty.value, MitosisMeiosisStrings.guideStageStringProperty.value)
      this.teachingTriad.setTriad(
        `${stageName}: chromosomes condense.`,
        mode === 'mitosis'
          ? 'Each chromosome has already copied itself into two sister chromatids.'
          : 'Homologous chromosome pairs come together (synapsis), each already doubled.',
        'Press Next or Play to watch them line up at the middle of the cell.',
      )
    }
    else if (phase === 'metaphase') {
      this.teachingTriad.setTriad(
        `${stageName}: lined up at the equator.`,
        'Spindle fibers from each pole attach to every chromosome, ready to pull them apart.',
        'Next stage: the chromosomes separate toward opposite poles.',
      )
      this.guide.setGuidance(MitosisMeiosisStrings.guideTitleStringProperty.value, MitosisMeiosisStrings.guideStageStringProperty.value)
    }
    else if (phase === 'anaphase') {
      this.teachingTriad.setTriad(
        `${stageName}: pulling apart.`,
        mode === 'mitosis'
          ? 'Sister chromatids split — one identical copy heads to each pole.'
          : 'Whole homologous chromosomes (still doubled) move to opposite poles.',
        'Watch the cell start to elongate as the poles are pulled further apart.',
      )
      this.guide.setGuidance(MitosisMeiosisStrings.guideTitleStringProperty.value, MitosisMeiosisStrings.guideStageStringProperty.value)
    }
    else if (phase === 'telophase') {
      this.teachingTriad.setTriad(
        `${stageName}: the cell pinches in two.`,
        'A new nuclear envelope re-forms around each cluster of chromosomes.',
        mode === 'mitosis' ? 'Next: two identical daughter cells.' : 'Next: Meiosis II splits the sister chromatids.',
      )
      this.guide.setGuidance(MitosisMeiosisStrings.guideTitleStringProperty.value, MitosisMeiosisStrings.guideStageStringProperty.value)
    }
    else {
      this.teachingTriad.setTriad(
        'Meiosis II: a second division.',
        'Inside each of the 2 cells, sister chromatids now separate — just like a mini mitosis.',
        'Next: 4 unique gametes, each with half the original chromosome number.',
      )
      this.guide.setGuidance(MitosisMeiosisStrings.guideTitleStringProperty.value, MitosisMeiosisStrings.guideStageStringProperty.value)
    }
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      MitosisMeiosisStrings.quizQuestionStringProperty.value,
      [
        { label: MitosisMeiosisStrings.quizMeiosisStringProperty.value, correct: true },
        { label: MitosisMeiosisStrings.quizMitosisStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuizAnswered(correct)
      },
    )
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.time += dt
    this.particles.step(dt)

    if (this.tipTimer > 0) {
      this.tipTimer -= dt
      if (this.tipTimer < 0.6) {
        this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6)
      }
      if (this.tipTimer <= 0) {
        this.tipCard.visible = false
      }
    }

    this.redrawStage()
  }
}
