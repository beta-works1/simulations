import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, LinearGradient, Line, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { ElementSpec, findElement, METALS, MetalNonmetalModel, MetalNonmetalScenario, NONMETALS } from '../model/MetalNonmetalModel.js'
import { PeriodicConstants, clamp, lerp } from '../../../shared/PeriodicConstants.js'
import { PeriodicColors } from '../../../shared/PeriodicColors.js'
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
import { PeriodicSounds } from '../../../shared/PeriodicSounds.js'
import { MetalNonmetalStrings } from '../MetalNonmetalStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly MetalNonmetalScenario[] = ['explore', 'conductivity', 'reactivity', 'compare']

const SCENARIO_FILL: Record<MetalNonmetalScenario, string> = {
  explore: PeriodicColors.accent,
  conductivity: '#f59e0b',
  reactivity: '#e74c3c',
  compare: '#16a34a',
}

const SCENARIO_GUIDE: Record<MetalNonmetalScenario, string> = {
  explore: MetalNonmetalStrings.guideExploreStringProperty.value,
  conductivity: MetalNonmetalStrings.guideConductivityStringProperty.value,
  reactivity: MetalNonmetalStrings.guideReactivityStringProperty.value,
  compare: MetalNonmetalStrings.guideCompareStringProperty.value,
}

const SCENARIO_TRIAD: Record<MetalNonmetalScenario, [string, string, string]> = {
  explore: [
    'Exploring freely.',
    'Metals have loosely held outer electrons that move freely \u2014 that makes them conductors and reactive.',
    'Try the Conductivity, Reactivity, or Compare scenarios to see these properties in action.',
  ],
  conductivity: [
    'Testing conductivity.',
    'A metal\u2019s "sea of electrons" drifts along the wire, carrying current. A non-metal\u2019s electrons stay put.',
    'Switch materials to see that every metal conducts, while non-metals mostly don\u2019t.',
  ],
  reactivity: [
    'Testing reactivity.',
    'Turning up reactivity speeds up the reaction between the metal and non-metal, forming an oxide.',
    'Try Compare to see how conductivity and reactivity relate to each other.',
  ],
  compare: [
    'Comparing properties.',
    'Metals: shiny, malleable, ductile, conduct well. Non-metals: dull, brittle, poor conductors.',
    'Return to Explore to test your own metal and non-metal combinations.',
  ],
}

/** Compact chip used for read-only "Conducts: High/Low" and reactivity readouts. */
function makeChip(text: string, accent: boolean): Node {
  const label = new Text(text, {
    font: new PhetFont({ size: 11, weight: 'bold' }),
    fill: accent ? '#0f172a' : '#475569',
  })
  const bg = new Rectangle(0, 0, label.width + 16, label.height + 10, {
    cornerRadius: 8,
    fill: accent ? '#facc15' : 'rgba(15,23,42,0.08)',
    stroke: accent ? '#a16207' : 'rgba(71,85,105,0.35)',
    lineWidth: 1,
  })
  label.centerX = bg.rectWidth / 2
  label.centerY = bg.rectHeight / 2
  return new Node({ children: [bg, label] })
}

/**
 * Dense ecology-style control surface for the metal vs non-metal properties lab
 * (PTB Grade 8 Ch 5 parity \u2014 conductivity via a "sea of electrons", reactivity via an oxidation demo).
 */
export class MetalNonmetalScreenView extends ScreenView {
  private readonly model: MetalNonmetalModel
  private readonly sounds: PeriodicSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  // Stage geometry
  private readonly panelW: number
  private readonly panelH: number
  private readonly metalPanelX: number
  private readonly nonmetalPanelX: number
  private readonly panelY: number
  private readonly wireY: number
  private readonly chipY: number
  private readonly demoX: number
  private readonly demoY: number
  private readonly demoW: number
  private readonly demoH: number
  private readonly sampleX: number
  private readonly sampleY: number
  private readonly sampleR: number

  // Stage nodes
  private readonly metalPanelRect: Rectangle
  private readonly nonmetalPanelRect: Rectangle
  private readonly metalSymbolText: Text
  private readonly nonmetalSymbolText: Text
  private readonly wiresStaticLayer: Node
  private readonly electronsLayer: Node
  private readonly conductsChipLayer: Node
  private readonly labelsLayer: Node
  private readonly sampleCircle: Circle
  private readonly formulaText: Text
  private readonly reactivityReadoutText: Text
  private electronPhase = 0
  private burstTimer = 0

  // Panel widgets
  private readonly metalButtons: Record<string, SoftButton>
  private readonly nonmetalButtons: Record<string, SoftButton>
  private readonly metalReadout: Text
  private readonly nonmetalReadout: Text
  private readonly conductivityBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly sparksBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: MetalNonmetalModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new PeriodicSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = PeriodicConstants.SCREEN_VIEW_X_MARGIN
    const my = PeriodicConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 300
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78
    const stageCenterX = stageLeft + stageW / 2

    // ── Guidance banner ──────────────────────────────────────────────────────
    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: MetalNonmetalStrings.guideTitleStringProperty.value,
      body: SCENARIO_GUIDE.explore,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    // ── Left column: teaching triad + fact ────────────────────────────────────
    const leftCard = new DepthCard(leftW, stageH)
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.leftLearnTip = createPanelTip(MetalNonmetalStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: PeriodicColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    // Metal / non-metal comparison panels
    this.panelW = stageW * 0.38
    this.panelH = stageH * 0.22
    this.metalPanelX = stageLeft + stageW * 0.08
    this.nonmetalPanelX = stageLeft + stageW * 0.54
    this.panelY = stageTop + stageH * 0.1

    this.labelsLayer = new Node({ pickable: false })

    const metalPanelLabel = new Text(MetalNonmetalStrings.metalPanelLabelStringProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.metalPanelX + this.panelW / 2,
      bottom: this.panelY - 8,
    })
    const nonmetalPanelLabel = new Text(MetalNonmetalStrings.nonmetalPanelLabelStringProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.nonmetalPanelX + this.panelW / 2,
      bottom: this.panelY - 8,
    })
    this.labelsLayer.addChild(metalPanelLabel)
    this.labelsLayer.addChild(nonmetalPanelLabel)

    this.metalPanelRect = new Rectangle(this.metalPanelX, this.panelY, this.panelW, this.panelH, {
      cornerRadius: 10,
      stroke: '#334155',
      lineWidth: 2,
    })
    this.nonmetalPanelRect = new Rectangle(this.nonmetalPanelX, this.panelY, this.panelW, this.panelH, {
      cornerRadius: 10,
      stroke: '#334155',
      lineWidth: 2,
    })
    this.addChild(this.metalPanelRect)
    this.addChild(this.nonmetalPanelRect)

    this.metalSymbolText = new Text('', {
      font: new PhetFont({ size: 22, weight: 'bold' }),
      fill: '#ffffff',
      centerX: this.metalPanelX + this.panelW / 2,
      centerY: this.panelY + this.panelH / 2,
    })
    this.nonmetalSymbolText = new Text('', {
      font: new PhetFont({ size: 22, weight: 'bold' }),
      fill: '#ffffff',
      centerX: this.nonmetalPanelX + this.panelW / 2,
      centerY: this.panelY + this.panelH / 2,
    })
    this.addChild(this.metalSymbolText)
    this.addChild(this.nonmetalSymbolText)

    // Wires + flowing / stuck electrons
    this.wireY = this.panelY + this.panelH + stageH * 0.09
    this.wiresStaticLayer = new Node({ pickable: false })
    this.wiresStaticLayer.addChild(
      new Line(this.metalPanelX, this.wireY, this.metalPanelX + this.panelW, this.wireY, {
        stroke: '#f59e0b',
        lineWidth: 4,
        lineCap: 'round',
      }),
    )
    this.wiresStaticLayer.addChild(
      new Line(this.nonmetalPanelX, this.wireY, this.nonmetalPanelX + this.panelW, this.wireY, {
        stroke: '#94a3b8',
        lineWidth: 4,
        lineCap: 'round',
      }),
    )
    this.addChild(this.wiresStaticLayer)

    this.electronsLayer = new Node({ pickable: false })
    this.addChild(this.electronsLayer)

    this.chipY = this.wireY + 26
    this.conductsChipLayer = new Node({ pickable: false })
    const conductsHighChip = makeChip(MetalNonmetalStrings.conductsHighLabelStringProperty.value, true)
    conductsHighChip.centerX = this.metalPanelX + this.panelW / 2
    conductsHighChip.top = this.chipY
    const conductsLowChip = makeChip(MetalNonmetalStrings.conductsLowLabelStringProperty.value, false)
    conductsLowChip.centerX = this.nonmetalPanelX + this.panelW / 2
    conductsLowChip.top = this.chipY
    this.conductsChipLayer.addChild(conductsHighChip)
    this.conductsChipLayer.addChild(conductsLowChip)
    this.labelsLayer.addChild(this.conductsChipLayer)

    this.addChild(this.labelsLayer)

    // Reactivity / oxidation demo panel
    this.demoX = stageLeft + stageW * 0.06
    this.demoY = stageTop + stageH * 0.58
    this.demoW = stageW * 0.88
    this.demoH = stageH * 0.34
    this.addChild(
      new Rectangle(this.demoX, this.demoY, this.demoW, this.demoH, {
        cornerRadius: 12,
        fill: '#ffffff',
        stroke: '#bdc3c7',
        lineWidth: 2,
      }),
    )
    const demoTitle = new Text(MetalNonmetalStrings.reactivityDemoLabelStringProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#0f172a',
      left: this.demoX + 16,
      top: this.demoY + 10,
    })
    this.addChild(demoTitle)

    this.sampleX = this.demoX + this.demoW * 0.2
    this.sampleY = this.demoY + this.demoH * 0.6
    this.sampleR = Math.min(stageW, stageH) * 0.075

    this.sampleCircle = new Circle(this.sampleR, {
      stroke: '#334155',
      lineWidth: 2,
      centerX: this.sampleX,
      centerY: this.sampleY,
    })
    this.addChild(this.sampleCircle)

    this.formulaText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#0f172a',
      left: this.demoX + this.demoW * 0.42,
      top: this.sampleY - 26,
    })
    this.addChild(this.formulaText)

    this.reactivityReadoutText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#e74c3c',
      left: this.demoX + this.demoW * 0.42,
      top: this.sampleY + 2,
    })
    this.addChild(this.reactivityReadoutText)

    this.particles = new ParticleBurst(60)
    this.addChild(this.particles)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = stageCenterX
    this.tipCard.top = stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(MetalNonmetalStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: PeriodicColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: PeriodicColors.ink,
      lineWrap: 222,
      leading: 3,
      left: 14,
      top: 30,
      maxWidth: 222,
    })
    this.tipCard.content.addChild(this.tipBodyText)
    this.addChild(this.tipCard)

    // ── Mini quiz overlay ────────────────────────────────────────────────────
    this.miniQuiz = new MiniQuiz(260)
    this.miniQuiz.centerX = stageCenterX
    this.miniQuiz.centerY = stageTop + stageH * 0.5
    this.addChild(this.miniQuiz)

    // ── Right column: dense scrollable control panel ────────────────────────
    const card = new DepthCard(rightW, stageH)
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 42
    const halfW = (contentW - 8) / 2
    const quarterGap = 6
    const quarterW = (contentW - 3 * quarterGap) / 4
    const btnH = 32
    const gridGap = 6

    // Scenario ----------------------------------------------------------------
    const scenarioHeader = controlSection(MetalNonmetalStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    const scenarioLabels: Record<MetalNonmetalScenario, string> = {
      explore: MetalNonmetalStrings.scenarioExploreStringProperty.value,
      conductivity: MetalNonmetalStrings.scenarioConductivityStringProperty.value,
      reactivity: MetalNonmetalStrings.scenarioReactivityStringProperty.value,
      compare: MetalNonmetalStrings.scenarioCompareStringProperty.value,
    }
    const scenarioButtons = {} as Record<MetalNonmetalScenario, SoftButton>
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(
        scenarioLabels[scenario],
        () => model.setScenario(scenario),
        {
          width: contentW,
          height: btnH,
          fill: SCENARIO_FILL[scenario],
          selected: scenario === 'explore',
          fontSize: 12,
          onSound: () => sounds.scenario(),
        },
      )
      scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    // Materials -----------------------------------------------------------------
    const materialsHeader = controlSection(MetalNonmetalStrings.sectionMaterialsStringProperty.value, contentW)
    panelContent.addChild(materialsHeader)

    const metalRowLabel = controlHint(MetalNonmetalStrings.metalLabelStringProperty.value, contentW)
    panelContent.addChild(metalRowLabel)

    this.metalButtons = {}
    for (const spec of METALS) {
      const btn = new SoftButton(
        spec.symbol,
        () => {
          model.setMetal(spec.symbol)
          sounds.select()
        },
        { width: quarterW, height: btnH, fill: '#7f8c8d', fontSize: 12 },
      )
      this.metalButtons[spec.symbol] = btn
      panelContent.addChild(btn)
    }
    this.metalReadout = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: PeriodicColors.panelText,
      maxWidth: contentW,
    })
    panelContent.addChild(this.metalReadout)

    const nonmetalRowLabel = controlHint(MetalNonmetalStrings.nonmetalLabelStringProperty.value, contentW)
    panelContent.addChild(nonmetalRowLabel)

    this.nonmetalButtons = {}
    for (const spec of NONMETALS) {
      const btn = new SoftButton(
        spec.symbol,
        () => {
          model.setNonmetal(spec.symbol)
          sounds.select()
        },
        { width: quarterW, height: btnH, fill: '#3498db', fontSize: 12 },
      )
      this.nonmetalButtons[spec.symbol] = btn
      panelContent.addChild(btn)
    }
    this.nonmetalReadout = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: PeriodicColors.panelText,
      maxWidth: contentW,
    })
    panelContent.addChild(this.nonmetalReadout)

    // Conditions ----------------------------------------------------------------
    const conditionsHeader = controlSection(MetalNonmetalStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    const reactivitySlider = new DepthSlider(model.reactivityProperty, {
      min: 0,
      max: 1,
      width: contentW,
      label: MetalNonmetalStrings.reactivitySliderStringProperty.value,
      format: (n) => `${Math.round(n * 100)}%`,
      fill: '#e74c3c',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(reactivitySlider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: MetalNonmetalStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: PeriodicColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(MetalNonmetalStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(MetalNonmetalStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.conductivityBtn = new SoftButton(
      MetalNonmetalStrings.conductivityOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showConductivityProperty.value = !model.showConductivityProperty.value
      },
      { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 11, selected: true },
    )
    this.labelsBtn = new SoftButton(
      MetalNonmetalStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.sparksBtn = new SoftButton(
      MetalNonmetalStrings.sparksOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showSparksProperty.value = !model.showSparksProperty.value
      },
      { width: contentW, height: btnH, fill: '#e74c3c', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.conductivityBtn)
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.sparksBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(MetalNonmetalStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      MetalNonmetalStrings.pauseButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: halfW, height: 38, fill: PeriodicColors.accent, fontSize: 12 },
    )
    const resetDemoBtn = new SoftButton(
      MetalNonmetalStrings.resetDemoButtonStringProperty.value,
      () => {
        model.resetDemo()
        this.particles.clear()
        sounds.softClick()
      },
      { width: halfW, height: 38, fill: '#64748b', fontSize: 11 },
    )
    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(resetDemoBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(MetalNonmetalStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? MetalNonmetalStrings.soundOnStringProperty.value
        : MetalNonmetalStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? MetalNonmetalStrings.soundOnStringProperty.value : MetalNonmetalStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    // Status / quiz ---------------------------------------------------
    const statusHeader = controlSection(MetalNonmetalStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: PeriodicColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(MetalNonmetalStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 11,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0
      scenarioHeader.top = py
      py = scenarioHeader.bottom + 6
      for (const scenario of SCENARIOS) {
        const btn = scenarioButtons[scenario]
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6

      materialsHeader.left = 0
      materialsHeader.top = py
      py = materialsHeader.bottom + 4
      metalRowLabel.left = 0
      metalRowLabel.top = py
      py = metalRowLabel.bottom + 4
      let bx = 0
      for (const spec of METALS) {
        const btn = this.metalButtons[spec.symbol]
        btn.left = bx
        btn.top = py
        bx += quarterW + quarterGap
      }
      py += btnH + 4
      this.metalReadout.left = 0
      this.metalReadout.top = py
      py = this.metalReadout.bottom + 10

      nonmetalRowLabel.left = 0
      nonmetalRowLabel.top = py
      py = nonmetalRowLabel.bottom + 4
      bx = 0
      for (const spec of NONMETALS) {
        const btn = this.nonmetalButtons[spec.symbol]
        btn.left = bx
        btn.top = py
        bx += quarterW + quarterGap
      }
      py += btnH + 4
      this.nonmetalReadout.left = 0
      this.nonmetalReadout.top = py
      py = this.nonmetalReadout.bottom + 12

      conditionsHeader.left = 0
      conditionsHeader.top = py
      py = conditionsHeader.bottom + 6
      reactivitySlider.left = 0
      reactivitySlider.top = py
      py = reactivitySlider.bottom + 8
      speedSlider.left = 0
      speedSlider.top = py
      py = speedSlider.bottom + 4
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.conductivityBtn.left = 0
      this.conductivityBtn.top = py
      this.labelsBtn.left = halfW + 8
      this.labelsBtn.top = py
      py = this.conductivityBtn.bottom + gridGap
      this.sparksBtn.left = 0
      this.sparksBtn.top = py
      py = this.sparksBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      resetDemoBtn.left = halfW + 8
      resetDemoBtn.top = py
      py = this.playPauseBtn.bottom + 12

      soundHeader.left = 0
      soundHeader.top = py
      py = soundHeader.bottom + 6
      this.soundBtn.left = 0
      this.soundBtn.top = py
      py = this.soundBtn.bottom + 12

      statusHeader.left = 0
      statusHeader.top = py
      py = statusHeader.bottom + 6
      this.starsText.left = 0
      this.starsText.top = py
      py = this.starsText.bottom + 6
      this.statusText.left = 0
      this.statusText.top = py
      py = this.statusText.bottom + 10
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
          this.particles.clear()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    // ── Wiring ───────────────────────────────────────────────────────────────
    const syncStars = () => {
      this.starsText.string = `${MetalNonmetalStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? MetalNonmetalStrings.pauseButtonStringProperty.value
          : MetalNonmetalStrings.playButtonStringProperty.value,
      )
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) {
        scenarioButtons[s].setSelected(s === scenario)
      }
      this.guide.setGuidance(MetalNonmetalStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncMetal = () => {
      const info = findElement(METALS, model.metalProperty.value)
      for (const spec of METALS) {
        this.metalButtons[spec.symbol].setSelected(spec.symbol === info.symbol)
      }
      this.metalReadout.string = info.label
      this.metalSymbolText.string = info.symbol
      this.updateSample()
      this.updateFormula()
    }
    const syncNonmetal = () => {
      const info = findElement(NONMETALS, model.nonmetalProperty.value)
      for (const spec of NONMETALS) {
        this.nonmetalButtons[spec.symbol].setSelected(spec.symbol === info.symbol)
      }
      this.nonmetalReadout.string = info.label
      this.nonmetalSymbolText.string = info.symbol
      this.updateSample()
      this.updateFormula()
    }
    const syncConductivity = () => {
      this.conductivityBtn.setSelected(model.showConductivityProperty.value)
      this.conductivityBtn.setLabel(
        model.showConductivityProperty.value
          ? MetalNonmetalStrings.conductivityOnStringProperty.value
          : MetalNonmetalStrings.conductivityOffStringProperty.value,
      )
      this.wiresStaticLayer.visible = model.showConductivityProperty.value
      this.electronsLayer.visible = model.showConductivityProperty.value
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? MetalNonmetalStrings.labelsOnStringProperty.value
          : MetalNonmetalStrings.labelsOffStringProperty.value,
      )
      this.labelsLayer.visible = model.showLabelsProperty.value
    }
    const syncSparks = () => {
      this.sparksBtn.setSelected(model.showSparksProperty.value)
      this.sparksBtn.setLabel(
        model.showSparksProperty.value
          ? MetalNonmetalStrings.sparksOnStringProperty.value
          : MetalNonmetalStrings.sparksOffStringProperty.value,
      )
    }

    model.scenarioProperty.link(syncScenario)
    model.metalProperty.link(syncMetal)
    model.nonmetalProperty.link(syncNonmetal)
    model.runningProperty.link(syncPlayPause)
    model.showConductivityProperty.link(syncConductivity)
    model.showLabelsProperty.link(syncLabels)
    model.showSparksProperty.link(syncSparks)
    model.reactivityProperty.link(() => this.updateReactivityReadout())
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, oldStars) => {
      if (oldStars !== undefined && stars > oldStars) sounds.celebrate()
    })

    syncStars()
    syncPlayPause()
    syncScenario()
    syncMetal()
    syncNonmetal()
    syncConductivity()
    syncLabels()
    syncSparks()
    this.updateReactivityReadout()
    this.redrawElectrons()
  }

  private metalInfo(): ElementSpec {
    return findElement(METALS, this.model.metalProperty.value)
  }

  private nonmetalInfo(): ElementSpec {
    return findElement(NONMETALS, this.model.nonmetalProperty.value)
  }

  private updateSample(): void {
    const metal = this.metalInfo()
    const nonmetal = this.nonmetalInfo()
    const rust = this.model.reactivityProperty.value
    this.metalPanelRect.fill = new LinearGradient(this.metalPanelX, this.panelY, this.metalPanelX, this.panelY + this.panelH)
      .addColorStop(0, '#f8fafc')
      .addColorStop(0.35, metal.color)
      .addColorStop(1, '#334155')
    this.nonmetalPanelRect.fill = nonmetal.color
    this.nonmetalPanelRect.opacity = 0.88
    this.sampleCircle.fill = blendColor(metal.color, nonmetal.color, rust)
  }

  private updateFormula(): void {
    const metal = this.metalInfo()
    const nonmetal = this.nonmetalInfo()
    this.formulaText.string = `${metal.symbol} + ${nonmetal.symbol} \u2192 oxide`
  }

  private updateReactivityReadout(): void {
    const rust = this.model.reactivityProperty.value
    this.reactivityReadoutText.string = `${MetalNonmetalStrings.reactivityReadoutLabelStringProperty.value}: ${Math.round(rust * 100)}%`
  }

  private redrawElectrons(): void {
    this.electronsLayer.removeAllChildren()
    if (!this.model.showConductivityProperty.value) return
    const phase = this.electronPhase
    const running = this.model.runningProperty.value

    // Flowing electrons through the metal — a "sea of electrons" carrying current.
    const flowCount = 6
    for (let i = 0; i < flowCount; i++) {
      const t = (phase + i / flowCount) % 1
      const ex = this.metalPanelX + t * this.panelW
      this.electronsLayer.addChild(
        new Circle(5, { fill: '#f1c40f', stroke: '#a16207', lineWidth: 1, centerX: ex, centerY: this.wireY }),
      )
    }

    // Stuck electrons in the non-metal — they don't drift, so current can't flow.
    const stuckCount = 4
    for (let i = 0; i < stuckCount; i++) {
      const t = (i + 0.5) / stuckCount
      const ex = this.nonmetalPanelX + t * this.panelW
      this.electronsLayer.addChild(
        new Circle(5, { fill: '#cbd5e1', stroke: '#475569', lineWidth: 1, centerX: ex, centerY: this.wireY }),
      )
      const attempt = (phase * 1.6 + i * 0.3) % 1
      if (running && attempt > 0.4 && attempt < 0.58) {
        this.electronsLayer.addChild(
          new Line(ex - 7, this.wireY - 7, ex + 7, this.wireY + 7, { stroke: '#dc2626', lineWidth: 2 }),
        )
        this.electronsLayer.addChild(
          new Line(ex - 7, this.wireY + 7, ex + 7, this.wireY - 7, { stroke: '#dc2626', lineWidth: 2 }),
        )
      }
    }
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      MetalNonmetalStrings.quizQuestionStringProperty.value,
      [
        { label: MetalNonmetalStrings.quizCorrectStringProperty.value, correct: true },
        { label: MetalNonmetalStrings.quizWrongStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.particles.step(dt)

    if (this.model.runningProperty.value) {
      const scaledDt = dt * clamp(this.model.simSpeedProperty.value, 0.25, 3)
      this.electronPhase = (this.electronPhase + scaledDt * 0.6) % 1

      if (this.model.showSparksProperty.value && this.model.reactivityProperty.value > 0.05) {
        this.burstTimer += scaledDt
        const interval = Math.max(0.25, lerp(1.5, 0.3, this.model.reactivityProperty.value))
        if (this.burstTimer >= interval) {
          this.burstTimer = 0
          const rust = this.model.reactivityProperty.value
          this.particles.burst(this.sampleX, this.sampleY - this.sampleR * 0.3, {
            count: Math.round(4 + rust * 10),
            color: this.nonmetalInfo().color,
            speed: 50 + rust * 70,
            life: 0.5 + rust * 0.3,
            radius: 2.4 + rust * 1.6,
          })
        }
      }
    }

    this.redrawElectrons()

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

/** Simple RGB lerp between two hex colors for the rust/oxide sample fill. */
function blendColor(fromHex: string, toHex: string, t: number): string {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  const r = Math.round(lerp(from.r, to.r, clamp(t, 0, 1)))
  const g = Math.round(lerp(from.g, to.g, clamp(t, 0, 1)))
  const b = Math.round(lerp(from.b, to.b, clamp(t, 0, 1)))
  return `rgb(${r}, ${g}, ${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}
