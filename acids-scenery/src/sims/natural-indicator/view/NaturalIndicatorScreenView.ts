import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { IndicatorScenario, NaturalIndicatorModel } from '../model/NaturalIndicatorModel.js'
import {
  expectedColor,
  IndicatorType,
  indicatorColor,
  phCategory,
  SubstanceType,
} from '../../../shared/naturalIndicatorModel.js'
import { AcidsConstants, clamp, lerp } from '../../../shared/AcidsConstants.js'
import { AcidsColors } from '../../../shared/AcidsColors.js'
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
import { AcidsSounds } from '../../../shared/AcidsSounds.js'
import { NaturalIndicatorStrings } from '../NaturalIndicatorStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const INDICATORS: readonly IndicatorType[] = ['cabbage', 'turmeric']
const SUBSTANCES: readonly SubstanceType[] = ['acid', 'neutral', 'base']
const SCENARIOS: readonly IndicatorScenario[] = ['explore', 'acidTest', 'baseTest']

const INDICATOR_FILL: Record<IndicatorType, string> = {
  cabbage: '#7c3aed',
  turmeric: '#eab308',
}

const SUBSTANCE_FILL: Record<SubstanceType, string> = {
  acid: '#ef4444',
  neutral: '#8b5cf6',
  base: '#0ea5e9',
}

const SCENARIO_FILL: Record<IndicatorScenario, string> = {
  explore: AcidsColors.accent,
  acidTest: '#ef4444',
  baseTest: '#0ea5e9',
}

const SCENARIO_GUIDE: Record<IndicatorScenario, string> = {
  explore: NaturalIndicatorStrings.guideExploreStringProperty.value,
  acidTest: NaturalIndicatorStrings.guideAcidTestStringProperty.value,
  baseTest: NaturalIndicatorStrings.guideBaseTestStringProperty.value,
}

const SCENARIO_TRIAD: Record<IndicatorScenario, [string, string, string]> = {
  explore: [
    'Exploring freely.',
    'Natural indicators are plant dyes that change color in acids, neutral liquids, and bases (alkalis).',
    'Try Acid test or Base test to see a clean, one-substance reaction.',
  ],
  acidTest: [
    'Testing an acid.',
    'Cabbage juice turns pink/red in acids; turmeric barely changes and stays yellow \u2014 acids don\u2019t trigger turmeric\u2019s color change.',
    'Try Base test to see the opposite reaction, or switch indicators to compare.',
  ],
  baseTest: [
    'Testing a base.',
    'Cabbage juice turns blue/green in bases, and turmeric turns a distinctive red-brown \u2014 a classic kitchen test for alkalis.',
    'Return to Explore to test acids, neutrals, and bases side by side.',
  ],
}

/** Compact chip used for the "Expected: <color>" readout near the beaker. */
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
 * Dense ecology-style control surface for the natural indicator lab
 * (PTB Grade 8 Ch 7 parity) \u2014 a beaker of cabbage juice or turmeric
 * changes color as a dropper drips in an acid, neutral liquid, or base.
 */
export class NaturalIndicatorScreenView extends ScreenView {
  private readonly model: NaturalIndicatorModel
  private readonly sounds: AcidsSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0
  private dropPhase = 0
  private ambientBurstTimer = 0

  // Stage geometry
  private readonly beakerX: number
  private readonly beakerY: number
  private readonly beakerW: number
  private readonly beakerH: number
  private readonly beakerCenterX: number
  private readonly dropperTipY: number
  private readonly dropperBulbY: number
  private readonly dropperBulbR: number
  private readonly dropperTubeY: number
  private readonly dropperTubeH: number
  private readonly meterX: number
  private readonly meterTubeY: number
  private readonly meterTubeH: number
  private readonly meterW: number
  private readonly chipY: number

  // Stage nodes
  private readonly indicatorTitleText: Text
  private readonly captionText: Text
  private readonly beakerLiquid: Rectangle
  private readonly labelsLayer: Node
  private readonly expectedChipLayer: Node
  private readonly phMeterLayer: Node
  private readonly phMeterFill: Rectangle
  private readonly phMeterReadout: Text
  private readonly dropperBulb: Circle
  private readonly droplet: Circle

  // Panel widgets
  private readonly indicatorButtons: Record<IndicatorType, SoftButton>
  private readonly substanceButtons: Record<SubstanceType, SoftButton>
  private readonly scenarioButtons: Record<IndicatorScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly expectedBtn: SoftButton
  private readonly phMeterBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: NaturalIndicatorModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new AcidsSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = AcidsConstants.SCREEN_VIEW_X_MARGIN
    const my = AcidsConstants.SCREEN_VIEW_Y_MARGIN
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
      title: NaturalIndicatorStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(NaturalIndicatorStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: AcidsColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    this.indicatorTitleText = new Text(NaturalIndicatorStrings.indicatorTitleCabbageStringProperty.value, {
      font: new PhetFont({ size: 18, weight: 'bold' }),
      fill: '#0f172a',
      centerX: stageCenterX,
      top: stageTop + 10,
    })
    this.addChild(this.indicatorTitleText)

    this.captionText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: AcidsColors.accent,
      centerX: stageCenterX,
      top: this.indicatorTitleText.bottom + 4,
    })
    this.addChild(this.captionText)

    // Beaker (left-of-center) and pH meter gauge (right-of-center).
    this.beakerW = stageW * 0.3
    this.beakerH = stageH * 0.4
    this.beakerX = stageLeft + stageW * 0.32 - this.beakerW / 2
    this.beakerY = stageTop + stageH * 0.5
    this.beakerCenterX = this.beakerX + this.beakerW / 2

    // Dropper geometry — bulb + tube directly above the beaker.
    this.dropperBulbR = 15
    this.dropperBulbY = this.beakerY - stageH * 0.36
    this.dropperTubeY = this.dropperBulbY + this.dropperBulbR - 2
    this.dropperTubeH = Math.max(20, this.beakerY - this.dropperTubeY - 16)
    this.dropperTipY = this.dropperTubeY + this.dropperTubeH

    // pH meter (gauge) geometry.
    this.meterW = 24
    this.meterX = stageLeft + stageW * 0.68
    this.meterTubeY = this.beakerY - stageH * 0.02
    this.meterTubeH = stageH * 0.4

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
      this.beakerY + this.beakerH * 0.28,
      this.beakerW - 8,
      this.beakerH * 0.68,
      {
        cornerRadius: 7,
        fill: indicatorColor('cabbage', 7),
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

    // Dropper — glass tube, rubber bulb, and a falling droplet while dripping.
    this.addChild(
      new Rectangle(this.beakerCenterX - 6, this.dropperTubeY, 12, this.dropperTubeH, {
        cornerRadius: 4,
        fill: 'rgba(226,232,240,0.85)',
        stroke: '#334155',
        lineWidth: 1.5,
      }),
    )
    this.addChild(
      new Rectangle(this.beakerCenterX - 3, this.dropperTipY - 4, 6, 8, {
        fill: '#64748b',
      }),
    )
    this.dropperBulb = new Circle(this.dropperBulbR, {
      fill: '#dc2626',
      stroke: '#7f1d1d',
      lineWidth: 1.5,
      centerX: this.beakerCenterX,
      centerY: this.dropperBulbY,
    })
    this.addChild(this.dropperBulb)
    this.droplet = new Circle(4, {
      fill: 'rgba(148,163,184,0.9)',
      visible: false,
      pickable: false,
    })
    this.addChild(this.droplet)

    // pH meter gauge (digital-style tube that fills from 0–14).
    this.phMeterLayer = new Node({ pickable: false })
    this.phMeterReadout = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.meterX,
    })
    this.phMeterLayer.addChild(
      new Rectangle(this.meterX - this.meterW / 2, this.meterTubeY, this.meterW, this.meterTubeH, {
        cornerRadius: this.meterW / 2,
        fill: '#0b1628',
        stroke: '#334155',
        lineWidth: 2,
      }),
    )
    this.phMeterFill = new Rectangle(
      this.meterX - this.meterW / 2 + 3,
      this.meterTubeY + this.meterTubeH - 4,
      this.meterW - 6,
      4,
      { cornerRadius: (this.meterW - 6) / 2, fill: indicatorColor('cabbage', 7) },
    )
    this.phMeterLayer.addChild(this.phMeterFill)
    this.phMeterLayer.addChild(
      new Text('14', {
        font: new PhetFont({ size: 9, weight: 'bold' }),
        fill: '#475569',
        centerX: this.meterX,
        bottom: this.meterTubeY - 2,
      }),
    )
    this.phMeterLayer.addChild(
      new Text('0', {
        font: new PhetFont({ size: 9, weight: 'bold' }),
        fill: '#475569',
        centerX: this.meterX,
        top: this.meterTubeY + this.meterTubeH + 2,
      }),
    )
    this.phMeterReadout.top = this.meterTubeY - 20
    this.phMeterLayer.addChild(this.phMeterReadout)
    this.addChild(this.phMeterLayer)

    // Labels layer (beaker/dropper/meter captions) toggled by Display → Labels.
    this.labelsLayer = new Node({ pickable: false })
    this.labelsLayer.addChild(
      new Text(NaturalIndicatorStrings.beakerLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: this.beakerCenterX,
        top: this.beakerY + this.beakerH + 6,
      }),
    )
    this.labelsLayer.addChild(
      new Text(NaturalIndicatorStrings.dropperLabelStringProperty.value, {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#0f172a',
        centerX: this.beakerCenterX,
        bottom: this.dropperBulbY - this.dropperBulbR - 4,
      }),
    )
    this.labelsLayer.addChild(
      new Text(NaturalIndicatorStrings.phLabelStringProperty.value, {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#0f172a',
        centerX: this.meterX,
        top: this.meterTubeY + this.meterTubeH + 14,
      }),
    )
    this.addChild(this.labelsLayer)

    this.chipY = this.beakerY + this.beakerH + 26
    this.expectedChipLayer = new Node({ pickable: false })
    this.addChild(this.expectedChipLayer)

    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = stageCenterX
    this.tipCard.top = stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(NaturalIndicatorStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: AcidsColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: AcidsColors.ink,
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
    const thirdW = (contentW - 12) / 3
    const btnH = 32
    const gridGap = 6

    // Indicator ----------------------------------------------------------------
    const indicatorHeader = controlSection(NaturalIndicatorStrings.sectionIndicatorStringProperty.value, contentW)
    panelContent.addChild(indicatorHeader)

    const indicatorLabels: Record<IndicatorType, string> = {
      cabbage: NaturalIndicatorStrings.indicatorCabbageStringProperty.value,
      turmeric: NaturalIndicatorStrings.indicatorTurmericStringProperty.value,
    }
    this.indicatorButtons = {} as Record<IndicatorType, SoftButton>
    for (const indicator of INDICATORS) {
      const btn = new SoftButton(
        indicatorLabels[indicator],
        () => {
          model.setIndicator(indicator)
          sounds.modeChange(indicator === 'turmeric')
        },
        { width: halfW, height: btnH, fill: INDICATOR_FILL[indicator], selected: indicator === 'cabbage', fontSize: 12 },
      )
      this.indicatorButtons[indicator] = btn
      panelContent.addChild(btn)
    }

    // Substance ----------------------------------------------------------------
    const substanceHeader = controlSection(NaturalIndicatorStrings.sectionSubstanceStringProperty.value, contentW)
    panelContent.addChild(substanceHeader)

    const substanceLabels: Record<SubstanceType, string> = {
      acid: NaturalIndicatorStrings.substanceAcidStringProperty.value,
      neutral: NaturalIndicatorStrings.substanceNeutralStringProperty.value,
      base: NaturalIndicatorStrings.substanceBaseStringProperty.value,
    }
    this.substanceButtons = {} as Record<SubstanceType, SoftButton>
    for (const substance of SUBSTANCES) {
      const btn = new SoftButton(
        substanceLabels[substance],
        () => {
          model.setSubstance(substance)
          sounds.select()
        },
        { width: thirdW, height: btnH, fill: SUBSTANCE_FILL[substance], selected: substance === 'acid', fontSize: 11 },
      )
      this.substanceButtons[substance] = btn
      panelContent.addChild(btn)
    }

    // Scenario ----------------------------------------------------------------
    const scenarioHeader = controlSection(NaturalIndicatorStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    const scenarioLabels: Record<IndicatorScenario, string> = {
      explore: NaturalIndicatorStrings.scenarioExploreStringProperty.value,
      acidTest: NaturalIndicatorStrings.scenarioAcidTestStringProperty.value,
      baseTest: NaturalIndicatorStrings.scenarioBaseTestStringProperty.value,
    }
    this.scenarioButtons = {} as Record<IndicatorScenario, SoftButton>
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
    const conditionsHeader = controlSection(NaturalIndicatorStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    this.runningToggleBtn = new SoftButton(
      NaturalIndicatorStrings.runningOnStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: AcidsColors.accent, fontSize: 12, selected: false },
    )
    panelContent.addChild(this.runningToggleBtn)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: NaturalIndicatorStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: AcidsColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(NaturalIndicatorStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(NaturalIndicatorStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      NaturalIndicatorStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.expectedBtn = new SoftButton(
      NaturalIndicatorStrings.expectedOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showExpectedProperty.value = !model.showExpectedProperty.value
      },
      { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true },
    )
    this.phMeterBtn = new SoftButton(
      NaturalIndicatorStrings.phMeterOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showPhMeterProperty.value = !model.showPhMeterProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.expectedBtn)
    panelContent.addChild(this.phMeterBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(NaturalIndicatorStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      NaturalIndicatorStrings.startDripButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: halfW, height: 38, fill: AcidsColors.accent, fontSize: 11 },
    )
    const resetBeakerBtn = new SoftButton(
      NaturalIndicatorStrings.resetBeakerButtonStringProperty.value,
      () => {
        model.resetBeaker()
        this.particles.clear()
        sounds.softClick()
      },
      { width: halfW, height: 38, fill: '#64748b', fontSize: 10 },
    )
    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(resetBeakerBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(NaturalIndicatorStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? NaturalIndicatorStrings.soundOnStringProperty.value
        : NaturalIndicatorStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? NaturalIndicatorStrings.soundOnStringProperty.value : NaturalIndicatorStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    // Status / quiz ---------------------------------------------------
    const statusHeader = controlSection(NaturalIndicatorStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: AcidsColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(NaturalIndicatorStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 11,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      indicatorHeader.left = 0
      indicatorHeader.top = py
      py = indicatorHeader.bottom + 6
      this.indicatorButtons.cabbage.left = 0
      this.indicatorButtons.cabbage.top = py
      this.indicatorButtons.turmeric.left = halfW + 8
      this.indicatorButtons.turmeric.top = py
      py = this.indicatorButtons.cabbage.bottom + 12

      substanceHeader.left = 0
      substanceHeader.top = py
      py = substanceHeader.bottom + 6
      this.substanceButtons.acid.left = 0
      this.substanceButtons.acid.top = py
      this.substanceButtons.neutral.left = thirdW + 6
      this.substanceButtons.neutral.top = py
      this.substanceButtons.base.left = (thirdW + 6) * 2
      this.substanceButtons.base.top = py
      py = this.substanceButtons.acid.bottom + 12

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
      this.runningToggleBtn.left = 0
      this.runningToggleBtn.top = py
      py = this.runningToggleBtn.bottom + gridGap
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
      this.expectedBtn.left = halfW + 8
      this.expectedBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.phMeterBtn.left = 0
      this.phMeterBtn.top = py
      py = this.phMeterBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      resetBeakerBtn.left = halfW + 8
      resetBeakerBtn.top = py
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
      this.starsText.string = `${NaturalIndicatorStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(
        running
          ? NaturalIndicatorStrings.pauseButtonStringProperty.value
          : NaturalIndicatorStrings.startDripButtonStringProperty.value,
      )
      this.runningToggleBtn.setLabel(
        running
          ? NaturalIndicatorStrings.runningOnStringProperty.value
          : NaturalIndicatorStrings.runningOffStringProperty.value,
      )
      this.runningToggleBtn.setSelected(running)
    }
    const syncIndicator = () => {
      const indicator = model.indicatorProperty.value
      for (const ind of INDICATORS) {
        this.indicatorButtons[ind].setSelected(ind === indicator)
      }
      this.indicatorTitleText.string =
        indicator === 'cabbage'
          ? NaturalIndicatorStrings.indicatorTitleCabbageStringProperty.value
          : NaturalIndicatorStrings.indicatorTitleTurmericStringProperty.value
      this.indicatorTitleText.centerX = stageCenterX
      this.syncExpectedChip()
    }
    const syncSubstance = () => {
      const substance = model.substanceProperty.value
      for (const sub of SUBSTANCES) {
        this.substanceButtons[sub].setSelected(sub === substance)
      }
      this.syncExpectedChip()
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) {
        this.scenarioButtons[s].setSelected(s === scenario)
      }
      this.guide.setGuidance(NaturalIndicatorStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? NaturalIndicatorStrings.labelsOnStringProperty.value
          : NaturalIndicatorStrings.labelsOffStringProperty.value,
      )
      this.labelsLayer.visible = model.showLabelsProperty.value
    }
    const syncExpected = () => {
      this.expectedBtn.setSelected(model.showExpectedProperty.value)
      this.expectedBtn.setLabel(
        model.showExpectedProperty.value
          ? NaturalIndicatorStrings.expectedOnStringProperty.value
          : NaturalIndicatorStrings.expectedOffStringProperty.value,
      )
      this.expectedChipLayer.visible = model.showExpectedProperty.value
    }
    const syncPhMeter = () => {
      this.phMeterBtn.setSelected(model.showPhMeterProperty.value)
      this.phMeterBtn.setLabel(
        model.showPhMeterProperty.value
          ? NaturalIndicatorStrings.phMeterOnStringProperty.value
          : NaturalIndicatorStrings.phMeterOffStringProperty.value,
      )
      this.phMeterLayer.visible = model.showPhMeterProperty.value
    }
    const syncDisplayPh = () => {
      const ph = model.displayPhProperty.value
      const indicator = model.indicatorProperty.value
      const color = indicatorColor(indicator, ph)
      this.beakerLiquid.fill = color
      this.captionText.string = `${phCategory(ph)} \u2022 pH ${ph.toFixed(1)}`
      this.captionText.centerX = stageCenterX
      this.updatePhMeter(ph, color)
    }

    model.indicatorProperty.link(syncIndicator)
    model.substanceProperty.link(syncSubstance)
    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncLabels)
    model.showExpectedProperty.link(syncExpected)
    model.showPhMeterProperty.link(syncPhMeter)
    model.displayPhProperty.link(syncDisplayPh)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.indicatorSwitchesProperty.lazyLink(() => this.onChangeBurst())
    model.substanceSwitchesProperty.lazyLink(() => this.onChangeBurst())
    model.beakerResetsProperty.lazyLink(() => this.onChangeBurst())
    model.starsProperty.lazyLink((stars, oldStars) => {
      if (oldStars !== undefined && stars > oldStars) sounds.celebrate()
    })

    syncStars()
    syncPlayPause()
    syncIndicator()
    syncSubstance()
    syncScenario()
    syncLabels()
    syncExpected()
    syncPhMeter()
    syncDisplayPh()
  }

  private syncExpectedChip(): void {
    this.expectedChipLayer.removeAllChildren()
    const indicator = this.model.indicatorProperty.value
    const substance = this.model.substanceProperty.value
    const chip = makeChip(
      `${NaturalIndicatorStrings.expectedChipPrefixStringProperty.value} ${expectedColor(indicator, substance)}`,
      indicatorColor(indicator, this.model.targetPh),
    )
    chip.centerX = this.beakerCenterX
    chip.top = this.chipY
    this.expectedChipLayer.addChild(chip)
  }

  private updatePhMeter(ph: number, color: string): void {
    const heightFrac = clamp(ph / 14, 0, 1)
    const fillH = Math.max(4, heightFrac * (this.meterTubeH - 8))
    this.phMeterFill.setRectHeight(fillH)
    this.phMeterFill.fill = color
    this.phMeterFill.rectY = this.meterTubeY + this.meterTubeH - 4 - fillH
    this.phMeterReadout.string = `${NaturalIndicatorStrings.phLabelStringProperty.value} ${ph.toFixed(1)}`
    this.phMeterReadout.centerX = this.meterX
  }

  private onChangeBurst(): void {
    const color = indicatorColor(this.model.indicatorProperty.value, this.model.displayPhProperty.value)
    this.particles.burst(this.beakerCenterX, this.beakerY + this.beakerH * 0.5, {
      count: 26,
      color,
      speed: 110,
      life: 0.6,
      radius: 3.4,
    })
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      NaturalIndicatorStrings.quizQuestionStringProperty.value,
      [
        { label: NaturalIndicatorStrings.quizCorrectStringProperty.value, correct: true },
        { label: NaturalIndicatorStrings.quizWrongStringProperty.value, correct: false },
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

    const running = this.model.runningProperty.value
    const dripping = running && this.model.dripProgress < 1
    const scaledDt = dt * clamp(this.model.simSpeedProperty.value, 0.25, 3)

    if (dripping) {
      const period = 0.55
      this.dropPhase = (this.dropPhase + scaledDt / period) % 1
      this.droplet.visible = true
      this.droplet.centerX = this.beakerCenterX
      this.droplet.centerY = lerp(this.dropperTipY, this.beakerY + this.beakerH * 0.2, this.dropPhase)
      this.droplet.opacity = 1 - this.dropPhase * 0.3
      // Gentle squeeze animation on the bulb while dripping.
      this.dropperBulb.setScaleMagnitude(1, 1 - Math.sin(this.dropPhase * Math.PI) * 0.08)

      this.ambientBurstTimer += scaledDt
      if (this.ambientBurstTimer >= period) {
        this.ambientBurstTimer = 0
        this.particles.burst(this.beakerCenterX, this.beakerY + this.beakerH * 0.25, {
          count: 4,
          color: 'rgba(226,232,240,0.85)',
          speed: 30,
          life: 0.35,
          radius: 1.8,
        })
      }
    }
    else {
      this.droplet.visible = false
      this.dropperBulb.setScaleMagnitude(1, 1)
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
