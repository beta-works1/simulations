import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Line, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { ExoEndoModel, ThermicScenario } from '../model/ExoEndoModel.js'
import { ThermicMode } from '../../../shared/exoEndoModel.js'
import { ReactionsConstants, clamp, lerp } from '../../../shared/ReactionsConstants.js'
import { ReactionsColors } from '../../../shared/ReactionsColors.js'
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
import { ReactionsSounds } from '../../../shared/ReactionsSounds.js'
import { ExoEndoStrings } from '../ExoEndoStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const MODES: readonly ThermicMode[] = ['exothermic', 'endothermic']
const SCENARIOS: readonly ThermicScenario[] = ['explore', 'combustion', 'meltingIce', 'photosynthesis']

/** Reference points from shared/exoEndoModel.ts (BASE 22°C, exo target 48°C, endo target 8°C). */
const BASE_TEMP = 22
const EXO_TARGET = 48
const ENDO_TARGET = 8
const TEMP_DISPLAY_MIN = -2
const TEMP_DISPLAY_MAX = 56

const MODE_FILL: Record<ThermicMode, string> = {
  exothermic: '#ef4444',
  endothermic: '#38bdf8',
}

const SCENARIO_FILL: Record<ThermicScenario, string> = {
  explore: ReactionsColors.accent,
  combustion: '#ef4444',
  meltingIce: '#38bdf8',
  photosynthesis: '#22c55e',
}

const SCENARIO_GUIDE: Record<ThermicScenario, string> = {
  explore: ExoEndoStrings.guideExploreStringProperty.value,
  combustion: ExoEndoStrings.guideCombustionStringProperty.value,
  meltingIce: ExoEndoStrings.guideMeltingIceStringProperty.value,
  photosynthesis: ExoEndoStrings.guidePhotosynthesisStringProperty.value,
}

const SCENARIO_TRIAD: Record<ThermicScenario, [string, string, string]> = {
  explore: [
    'Exploring freely.',
    'Exothermic reactions release energy to their surroundings. Endothermic reactions absorb energy from their surroundings.',
    'Try Combustion, Melting ice, or Photosynthesis-style to see real examples of each.',
  ],
  combustion: [
    'Testing combustion.',
    'Burning fuel releases stored chemical energy fast \u2014 the beaker glows hot and the temperature climbs (exothermic).',
    'Try Melting ice or Photosynthesis-style to see an endothermic reaction cool things down instead.',
  ],
  meltingIce: [
    'Testing melting ice.',
    'Melting ice pulls heat in from its surroundings to break the bonds holding the solid together \u2014 that\u2019s endothermic.',
    'Try Photosynthesis-style for another endothermic example, or Combustion to compare with an exothermic one.',
  ],
  photosynthesis: [
    'Testing photosynthesis-style.',
    'Plants absorb light energy to build sugars, cooling their immediate surroundings \u2014 another endothermic process.',
    'Return to Explore to test exothermic and endothermic reactions side by side.',
  ],
}

/** Compact chip used for the "Energy released / absorbed" readout near the beaker. */
function makeChip(text: string, fill: string): Node {
  const label = new Text(text, {
    font: new PhetFont({ size: 11, weight: 'bold' }),
    fill: '#0f172a',
  })
  const bg = new Rectangle(0, 0, label.width + 16, label.height + 10, {
    cornerRadius: 8,
    fill,
    stroke: 'rgba(15,23,42,0.35)',
    lineWidth: 1,
  })
  label.centerX = bg.rectWidth / 2
  label.centerY = bg.rectHeight / 2
  return new Node({ children: [bg, label] })
}

/**
 * Dense ecology-style control surface for the exothermic vs endothermic energy lab
 * (PTB Grade 8 Ch 4 parity) \u2014 a glowing beaker + rising/falling thermometer show
 * energy being released (hot, red-orange) or absorbed (cool, blue).
 */
export class ExoEndoScreenView extends ScreenView {
  private readonly model: ExoEndoModel
  private readonly sounds: ReactionsSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  // Stage geometry
  private readonly beakerX: number
  private readonly beakerY: number
  private readonly beakerW: number
  private readonly beakerH: number
  private readonly beakerCenterX: number
  private readonly thermX: number
  private readonly thermTubeY: number
  private readonly thermTubeH: number
  private readonly thermTubeW: number
  private readonly thermBulbR: number
  private readonly thermBulbY: number
  private readonly chipY: number

  // Stage nodes
  private readonly modeTitleText: Text
  private readonly tempReadoutText: Text
  private readonly glowLayer: Node
  private readonly glowOuter: Circle
  private readonly glowMid: Circle
  private readonly glowInner: Circle
  private readonly beakerLiquid: Rectangle
  private readonly thermMercury: Rectangle
  private readonly thermBulb: Circle
  private readonly labelsLayer: Node
  private readonly energyChipLayer: Node
  private readonly energyArrowsLayer: Node
  private arrowPhase = 0
  private ambientBurstTimer = 0

  // Panel widgets
  private readonly modeButtons: Record<ThermicMode, SoftButton>
  private readonly scenarioButtons: Record<ThermicScenario, SoftButton>
  private readonly labelsBtn: SoftButton
  private readonly arrowsBtn: SoftButton
  private readonly particlesBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: ExoEndoModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new ReactionsSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = ReactionsConstants.SCREEN_VIEW_X_MARGIN
    const my = ReactionsConstants.SCREEN_VIEW_Y_MARGIN
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
      title: ExoEndoStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(ExoEndoStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ReactionsColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    this.modeTitleText = new Text(ExoEndoStrings.modeTitleExothermicStringProperty.value, {
      font: new PhetFont({ size: 18, weight: 'bold' }),
      fill: '#0f172a',
      centerX: stageCenterX,
      top: stageTop + 10,
    })
    this.addChild(this.modeTitleText)

    this.tempReadoutText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: ReactionsColors.accent,
      centerX: stageCenterX,
      top: this.modeTitleText.bottom + 4,
    })
    this.addChild(this.tempReadoutText)

    // Beaker geometry (left-of-center) and thermometer geometry (right-of-center).
    this.beakerW = stageW * 0.22
    this.beakerH = stageH * 0.34
    this.beakerX = stageLeft + stageW * 0.24 - this.beakerW / 2
    this.beakerY = stageTop + stageH * 0.5
    this.beakerCenterX = this.beakerX + this.beakerW / 2

    this.thermTubeW = 14
    this.thermTubeH = stageH * 0.4
    this.thermBulbR = 17
    this.thermX = stageLeft + stageW * 0.64
    this.thermTubeY = this.beakerY - stageH * 0.02
    this.thermBulbY = this.thermTubeY + this.thermTubeH + this.thermBulbR - 6

    // Glow behind the beaker (layered circles stand in for a radial glow).
    this.glowLayer = new Node({ pickable: false })
    this.glowOuter = new Circle(this.beakerW * 0.9, {
      fill: '#94a3b8',
      opacity: 0.12,
      centerX: this.beakerCenterX,
      centerY: this.beakerY + this.beakerH * 0.55,
    })
    this.glowMid = new Circle(this.beakerW * 0.65, {
      fill: '#94a3b8',
      opacity: 0.16,
      centerX: this.beakerCenterX,
      centerY: this.beakerY + this.beakerH * 0.55,
    })
    this.glowInner = new Circle(this.beakerW * 0.42, {
      fill: '#94a3b8',
      opacity: 0.22,
      centerX: this.beakerCenterX,
      centerY: this.beakerY + this.beakerH * 0.55,
    })
    this.glowLayer.addChild(this.glowOuter)
    this.glowLayer.addChild(this.glowMid)
    this.glowLayer.addChild(this.glowInner)
    this.addChild(this.glowLayer)

    // Beaker glass + liquid.
    this.addChild(
      new Rectangle(this.beakerX + this.beakerW * 0.3, this.beakerY - 12, this.beakerW * 0.4, 14, {
        cornerRadius: 4,
        fill: 'rgba(248,250,252,0.85)',
        stroke: '#334155',
        lineWidth: 1.5,
      }),
    )
    this.addChild(
      new Rectangle(this.beakerX, this.beakerY, this.beakerW, this.beakerH, {
        cornerRadius: 10,
        fill: 'rgba(248,250,252,0.35)',
        stroke: '#334155',
        lineWidth: 2,
      }),
    )
    this.beakerLiquid = new Rectangle(
      this.beakerX + 4,
      this.beakerY + this.beakerH * 0.32,
      this.beakerW - 8,
      this.beakerH * 0.64,
      {
        cornerRadius: 7,
        fill: '#94a3b8',
      },
    )
    this.addChild(this.beakerLiquid)
    this.addChild(
      new Rectangle(this.beakerX, this.beakerY, this.beakerW, this.beakerH, {
        cornerRadius: 10,
        stroke: '#334155',
        lineWidth: 2,
      }),
    )

    // Thermometer tube + bulb + mercury.
    this.addChild(
      new Rectangle(this.thermX - this.thermTubeW / 2, this.thermTubeY, this.thermTubeW, this.thermTubeH, {
        cornerRadius: this.thermTubeW / 2,
        fill: '#f8fafc',
        stroke: '#334155',
        lineWidth: 2,
      }),
    )
    this.thermMercury = new Rectangle(
      this.thermX - this.thermTubeW / 2 + 3,
      this.thermTubeY + this.thermTubeH - 4,
      this.thermTubeW - 6,
      4,
      { cornerRadius: (this.thermTubeW - 6) / 2, fill: '#94a3b8' },
    )
    this.addChild(this.thermMercury)
    this.thermBulb = new Circle(this.thermBulbR, {
      fill: '#94a3b8',
      stroke: '#334155',
      lineWidth: 2,
      centerX: this.thermX,
      centerY: this.thermBulbY,
    })
    this.addChild(this.thermBulb)

    // Labels layer (beaker/thermometer captions) toggled by Display → Labels.
    this.labelsLayer = new Node({ pickable: false })
    this.labelsLayer.addChild(
      new Text(ExoEndoStrings.beakerLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: this.beakerCenterX,
        top: this.beakerY + this.beakerH + 6,
      }),
    )
    this.labelsLayer.addChild(
      new Text(ExoEndoStrings.thermometerLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: this.thermX,
        top: this.thermBulbY + this.thermBulbR + 6,
      }),
    )
    this.addChild(this.labelsLayer)

    this.chipY = this.beakerY + this.beakerH + 26
    this.energyChipLayer = new Node({ pickable: false })
    this.addChild(this.energyChipLayer)

    // Energy arrows animate out of (exo) or into (endo) the top of the beaker.
    this.energyArrowsLayer = new Node({ pickable: false })
    this.addChild(this.energyArrowsLayer)

    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = stageCenterX
    this.tipCard.top = stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(ExoEndoStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: ReactionsColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: ReactionsColors.ink,
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
    const btnH = 32
    const gridGap = 6

    // Mode ----------------------------------------------------------------
    const modeHeader = controlSection(ExoEndoStrings.sectionModeStringProperty.value, contentW)
    panelContent.addChild(modeHeader)

    const modeLabels: Record<ThermicMode, string> = {
      exothermic: ExoEndoStrings.modeExothermicStringProperty.value,
      endothermic: ExoEndoStrings.modeEndothermicStringProperty.value,
    }
    this.modeButtons = {} as Record<ThermicMode, SoftButton>
    for (const mode of MODES) {
      const btn = new SoftButton(
        modeLabels[mode],
        () => {
          model.setMode(mode)
          sounds.modeChange(mode === 'exothermic')
        },
        { width: halfW, height: btnH, fill: MODE_FILL[mode], selected: mode === 'exothermic', fontSize: 12 },
      )
      this.modeButtons[mode] = btn
      panelContent.addChild(btn)
    }

    // Scenario ----------------------------------------------------------------
    const scenarioHeader = controlSection(ExoEndoStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    const scenarioLabels: Record<ThermicScenario, string> = {
      explore: ExoEndoStrings.scenarioExploreStringProperty.value,
      combustion: ExoEndoStrings.scenarioCombustionStringProperty.value,
      meltingIce: ExoEndoStrings.scenarioMeltingIceStringProperty.value,
      photosynthesis: ExoEndoStrings.scenarioPhotosynthesisStringProperty.value,
    }
    this.scenarioButtons = {} as Record<ThermicScenario, SoftButton>
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
      this.scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    // Conditions ----------------------------------------------------------------
    const conditionsHeader = controlSection(ExoEndoStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: ExoEndoStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: ReactionsColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(ExoEndoStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(ExoEndoStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      ExoEndoStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.arrowsBtn = new SoftButton(
      ExoEndoStrings.arrowsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showEnergyArrowsProperty.value = !model.showEnergyArrowsProperty.value
      },
      { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 11, selected: true },
    )
    this.particlesBtn = new SoftButton(
      ExoEndoStrings.particlesOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showParticlesProperty.value = !model.showParticlesProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.arrowsBtn)
    panelContent.addChild(this.particlesBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(ExoEndoStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      ExoEndoStrings.pauseButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: halfW, height: 38, fill: ReactionsColors.accent, fontSize: 12 },
    )
    const resetTempBtn = new SoftButton(
      ExoEndoStrings.resetTempButtonStringProperty.value,
      () => {
        model.resetTemp()
        this.particles.clear()
        sounds.softClick()
      },
      { width: halfW, height: 38, fill: '#64748b', fontSize: 11 },
    )
    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(resetTempBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(ExoEndoStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? ExoEndoStrings.soundOnStringProperty.value
        : ExoEndoStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? ExoEndoStrings.soundOnStringProperty.value : ExoEndoStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    // Status / quiz ---------------------------------------------------
    const statusHeader = controlSection(ExoEndoStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: ReactionsColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(ExoEndoStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 11,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      modeHeader.left = 0
      modeHeader.top = py
      py = modeHeader.bottom + 6
      this.modeButtons.exothermic.left = 0
      this.modeButtons.exothermic.top = py
      this.modeButtons.endothermic.left = halfW + 8
      this.modeButtons.endothermic.top = py
      py = this.modeButtons.exothermic.bottom + 12

      scenarioHeader.left = 0
      scenarioHeader.top = py
      py = scenarioHeader.bottom + 6
      for (const scenario of SCENARIOS) {
        const btn = this.scenarioButtons[scenario]
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6

      conditionsHeader.left = 0
      conditionsHeader.top = py
      py = conditionsHeader.bottom + 6
      speedSlider.left = 0
      speedSlider.top = py
      py = speedSlider.bottom + 4
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.arrowsBtn.left = halfW + 8
      this.arrowsBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.particlesBtn.left = 0
      this.particlesBtn.top = py
      py = this.particlesBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      resetTempBtn.left = halfW + 8
      resetTempBtn.top = py
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
      this.starsText.string = `${ExoEndoStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? ExoEndoStrings.pauseButtonStringProperty.value
          : ExoEndoStrings.playButtonStringProperty.value,
      )
    }
    const syncMode = () => {
      const mode = model.modeProperty.value
      for (const mo of MODES) {
        this.modeButtons[mo].setSelected(mo === mode)
      }
      this.modeTitleText.string =
        mode === 'exothermic'
          ? ExoEndoStrings.modeTitleExothermicStringProperty.value
          : ExoEndoStrings.modeTitleEndothermicStringProperty.value
      this.modeTitleText.centerX = stageCenterX
      this.tempReadoutText.centerX = stageCenterX
      this.syncEnergyChip()
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) {
        this.scenarioButtons[s].setSelected(s === scenario)
      }
      this.guide.setGuidance(ExoEndoStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? ExoEndoStrings.labelsOnStringProperty.value
          : ExoEndoStrings.labelsOffStringProperty.value,
      )
      this.labelsLayer.visible = model.showLabelsProperty.value
      this.energyChipLayer.visible = model.showLabelsProperty.value
    }
    const syncArrows = () => {
      this.arrowsBtn.setSelected(model.showEnergyArrowsProperty.value)
      this.arrowsBtn.setLabel(
        model.showEnergyArrowsProperty.value
          ? ExoEndoStrings.arrowsOnStringProperty.value
          : ExoEndoStrings.arrowsOffStringProperty.value,
      )
    }
    const syncParticles = () => {
      this.particlesBtn.setSelected(model.showParticlesProperty.value)
      this.particlesBtn.setLabel(
        model.showParticlesProperty.value
          ? ExoEndoStrings.particlesOnStringProperty.value
          : ExoEndoStrings.particlesOffStringProperty.value,
      )
    }
    const syncTemperature = () => {
      const temp = model.temperatureProperty.value
      this.tempReadoutText.string = `${ExoEndoStrings.tempLabelStringProperty.value}: ${temp.toFixed(1)}\u00b0C`
      this.tempReadoutText.centerX = stageCenterX
      this.updateBeakerAndThermometer(temp)
    }

    model.modeProperty.link(syncMode)
    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncLabels)
    model.showEnergyArrowsProperty.link(syncArrows)
    model.showParticlesProperty.link(syncParticles)
    model.temperatureProperty.link(syncTemperature)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.modeSwitchesProperty.lazyLink(() => this.onModeSwitch())
    model.starsProperty.lazyLink((stars, oldStars) => {
      if (oldStars !== undefined && stars > oldStars) sounds.celebrate()
    })

    syncStars()
    syncPlayPause()
    syncMode()
    syncScenario()
    syncLabels()
    syncArrows()
    syncParticles()
    syncTemperature()
  }

  private syncEnergyChip(): void {
    this.energyChipLayer.removeAllChildren()
    const mode = this.model.modeProperty.value
    const chip =
      mode === 'exothermic'
        ? makeChip(ExoEndoStrings.energyReleasedChipStringProperty.value, '#fca5a5')
        : makeChip(ExoEndoStrings.energyAbsorbedChipStringProperty.value, '#93c5fd')
    chip.centerX = this.beakerCenterX
    chip.top = this.chipY
    this.energyChipLayer.addChild(chip)
  }

  /** Maps temperature to a color between cool blue, neutral gray, and hot red-orange. */
  private tempColor(temp: number): string {
    if (temp >= BASE_TEMP) {
      const t = clamp((temp - BASE_TEMP) / (EXO_TARGET - BASE_TEMP), 0, 1)
      return blendColor('#94a3b8', '#f97316', t)
    }
    const t = clamp((BASE_TEMP - temp) / (BASE_TEMP - ENDO_TARGET), 0, 1)
    return blendColor('#94a3b8', '#38bdf8', t)
  }

  private updateBeakerAndThermometer(temp: number): void {
    const color = this.tempColor(temp)
    this.beakerLiquid.fill = color
    this.thermBulb.fill = color

    const heightFrac = clamp((temp - TEMP_DISPLAY_MIN) / (TEMP_DISPLAY_MAX - TEMP_DISPLAY_MIN), 0, 1)
    const mercuryH = Math.max(4, heightFrac * (this.thermTubeH - 8))
    this.thermMercury.setRectHeight(mercuryH)
    this.thermMercury.fill = color
    this.thermMercury.rectY = this.thermTubeY + this.thermTubeH - 4 - mercuryH

    const intensity = clamp(Math.abs(temp - BASE_TEMP) / (EXO_TARGET - BASE_TEMP), 0, 1)
    this.glowOuter.fill = color
    this.glowMid.fill = color
    this.glowInner.fill = color
    this.glowOuter.opacity = 0.08 + intensity * 0.16
    this.glowMid.opacity = 0.1 + intensity * 0.22
    this.glowInner.opacity = 0.14 + intensity * 0.32
    this.glowOuter.radius = this.beakerW * (0.75 + intensity * 0.35)
    this.glowMid.radius = this.beakerW * (0.5 + intensity * 0.3)
    this.glowInner.radius = this.beakerW * (0.3 + intensity * 0.25)
  }

  private onModeSwitch(): void {
    if (!this.model.showParticlesProperty.value) return
    const color = this.tempColor(this.model.temperatureProperty.value)
    this.particles.burst(this.beakerCenterX, this.beakerY + this.beakerH * 0.5, {
      count: 26,
      color,
      speed: 110,
      life: 0.6,
      radius: 3.4,
    })
  }

  private redrawEnergyArrows(): void {
    this.energyArrowsLayer.removeAllChildren()
    if (!this.model.showEnergyArrowsProperty.value) return
    if (!this.model.runningProperty.value) return

    const mode = this.model.modeProperty.value
    const color = mode === 'exothermic' ? '#f97316' : '#38bdf8'
    const count = 3
    const travel = 40
    const beakerTopY = this.beakerY

    for (let i = 0; i < count; i++) {
      const t = (this.arrowPhase + i / count) % 1
      const xOff = (i - (count - 1) / 2) * 22

      if (mode === 'exothermic') {
        const y = beakerTopY - t * travel
        const arrow = this.makeArrow(this.beakerCenterX + xOff, y, color, 'up')
        arrow.opacity = 1 - t
        this.energyArrowsLayer.addChild(arrow)
      }
      else {
        const y = beakerTopY - travel + t * travel
        const arrow = this.makeArrow(this.beakerCenterX + xOff, y, color, 'down')
        arrow.opacity = t
        this.energyArrowsLayer.addChild(arrow)
      }
    }
  }

  private makeArrow(cx: number, cy: number, color: string, dir: 'up' | 'down'): Node {
    const node = new Node()
    const len = 16
    const sign = dir === 'up' ? -1 : 1
    const tailY = cy
    const headY = cy + sign * len
    node.addChild(new Line(cx, tailY, cx, headY, { stroke: color, lineWidth: 3, lineCap: 'round' }))
    node.addChild(new Line(cx - 5, headY - sign * 6, cx, headY, { stroke: color, lineWidth: 3, lineCap: 'round' }))
    node.addChild(new Line(cx + 5, headY - sign * 6, cx, headY, { stroke: color, lineWidth: 3, lineCap: 'round' }))
    return node
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      ExoEndoStrings.quizQuestionStringProperty.value,
      [
        { label: ExoEndoStrings.quizCorrectStringProperty.value, correct: true },
        { label: ExoEndoStrings.quizWrongStringProperty.value, correct: false },
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
      this.arrowPhase = (this.arrowPhase + scaledDt * 0.55) % 1

      if (this.model.showParticlesProperty.value) {
        const temp = this.model.temperatureProperty.value
        const intensity = clamp(Math.abs(temp - BASE_TEMP) / (EXO_TARGET - BASE_TEMP), 0, 1)
        if (intensity > 0.08) {
          this.ambientBurstTimer += scaledDt
          const interval = Math.max(0.35, lerp(1.6, 0.4, intensity))
          if (this.ambientBurstTimer >= interval) {
            this.ambientBurstTimer = 0
            const color = this.tempColor(temp)
            this.particles.burst(this.beakerCenterX, this.beakerY + this.beakerH * 0.4, {
              count: Math.round(3 + intensity * 6),
              color,
              speed: 40 + intensity * 40,
              life: 0.5 + intensity * 0.3,
              radius: 2.2 + intensity * 1.4,
            })
          }
        }
      }
    }

    this.redrawEnergyArrows()

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

/** Simple RGB lerp between two hex colors for the beaker/thermometer/glow fill. */
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
