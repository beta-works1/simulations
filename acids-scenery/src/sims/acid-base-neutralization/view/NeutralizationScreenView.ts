import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Line, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { NeutralizationModel, NeutralizationScenario } from '../model/NeutralizationModel.js'
import { AcidsConstants, clamp } from '../../../shared/AcidsConstants.js'
import { AcidsColors } from '../../../shared/AcidsColors.js'
import { phLabel, phToColor } from '../../../shared/phScaleModel.js'
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
import { AcidsSounds } from '../../../shared/AcidsSounds.js'
import { NeutralizationStrings } from '../NeutralizationStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly NeutralizationScenario[] = ['explore', 'equalVolumes', 'excessAcid', 'excessBase']

const ACID_COLOR = '#ef4444'
const BASE_COLOR = '#3b82f6'

const SCENARIO_FILL: Record<NeutralizationScenario, string> = {
  explore: AcidsColors.accent,
  equalVolumes: '#16a34a',
  excessAcid: ACID_COLOR,
  excessBase: BASE_COLOR,
}

const SCENARIO_GUIDE: Record<NeutralizationScenario, string> = {
  explore: NeutralizationStrings.guideExploreStringProperty.value,
  equalVolumes: NeutralizationStrings.guideEqualVolumesStringProperty.value,
  excessAcid: NeutralizationStrings.guideExcessAcidStringProperty.value,
  excessBase: NeutralizationStrings.guideExcessBaseStringProperty.value,
}

const SCENARIO_TRIAD: Record<NeutralizationScenario, [string, string, string]> = {
  explore: [
    'Exploring freely.',
    'A strong acid and a strong base react to form a salt and water: Acid + Base \u2192 Salt + Water. Whatever is left over after the reaction decides the final pH.',
    'Try Equal volumes, Excess acid, or Excess base to see how the mixing ratio changes the result.',
  ],
  equalVolumes: [
    'Testing equal volumes.',
    'With matching amounts of acid and base, both react completely \u2014 nothing is left over, so the pH settles at 7 (neutral).',
    'Try Excess acid or Excess base to see what happens when the amounts don\u2019t match.',
  ],
  excessAcid: [
    'Testing excess acid.',
    'More acid than base is poured. The base reacts completely, but extra acid remains \u2014 so the final mixture stays acidic (pH below 7).',
    'Try Excess base to compare, or Equal volumes to see a full neutralization.',
  ],
  excessBase: [
    'Testing excess base.',
    'More base than acid is poured. The acid reacts completely, but extra base remains \u2014 so the final mixture stays basic (pH above 7).',
    'Try Excess acid to compare, or Equal volumes to see a full neutralization.',
  ],
}

/** pH window (inclusive) used to trigger the "near neutral" caption/crystal visuals in the view. */
const NEAR_NEUTRAL = 1.0

/**
 * Dense ecology-style control surface for the acid\u2013base neutralization lab
 * (PTB Grade 8 Ch 7 parity) \u2014 two source beakers pour acid and base into a
 * central mixture beaker whose color and pH readout track the shared kinetics model.
 */
export class NeutralizationScreenView extends ScreenView {
  private readonly model: NeutralizationModel
  private readonly sounds: AcidsSounds
  private readonly particles: ParticleBurst
  private readonly ripples: RippleFX
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0
  private splashTimer = 0

  // Stage geometry
  private readonly stageCenterX: number
  private readonly acidBeakerX: number
  private readonly acidBeakerY: number
  private readonly acidBeakerW: number
  private readonly acidBeakerH: number
  private readonly baseBeakerX: number
  private readonly baseBeakerY: number
  private readonly baseBeakerW: number
  private readonly baseBeakerH: number
  private readonly mixBeakerX: number
  private readonly mixBeakerY: number
  private readonly mixBeakerW: number
  private readonly mixBeakerH: number
  private readonly acidTargetX: number
  private readonly baseTargetX: number
  private readonly mixRimY: number
  private readonly chipY: number
  private readonly progressBarW: number

  // Stage nodes
  private readonly progressTrack: Rectangle
  private readonly progressFill: Rectangle
  private readonly acidLiquid: Rectangle
  private readonly baseLiquid: Rectangle
  private readonly mixLiquid: Rectangle
  private readonly acidStream: Line
  private readonly baseStream: Line
  private readonly labelsLayer: Node
  private readonly phMeterLayer: Node
  private readonly phChipBg: Rectangle
  private readonly phChipText: Text
  private readonly saltCaptionText: Text
  private readonly saltLayer: Node
  private readonly saltCrystalNodes: Node[] = []
  private crystalGrowTimer = 0

  // Panel widgets
  private readonly scenarioButtons: Record<NeutralizationScenario, SoftButton>
  private readonly labelsBtn: SoftButton
  private readonly phMeterBtn: SoftButton
  private readonly saltCrystalsBtn: SoftButton
  private readonly pourPlayBtn: SoftButton
  private readonly pauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: NeutralizationModel, providedOptions?: Options) {
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
    this.stageCenterX = stageLeft + stageW / 2

    // ── Guidance banner ──────────────────────────────────────────────────────
    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: NeutralizationStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(NeutralizationStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: AcidsColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    const stageTitle = new Text(NeutralizationStrings.stageTitleStringProperty.value, {
      font: new PhetFont({ size: 18, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.stageCenterX,
      top: stageTop + 10,
    })
    this.addChild(stageTitle)

    const progressLabel = new Text(NeutralizationStrings.pourProgressLabelStringProperty.value, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: AcidsColors.muted,
      centerX: this.stageCenterX,
      top: stageTitle.bottom + 6,
    })
    this.addChild(progressLabel)

    this.progressBarW = stageW * 0.42
    this.progressTrack = new Rectangle(0, 0, this.progressBarW, 8, {
      cornerRadius: 4,
      fill: 'rgba(15,23,42,0.16)',
      centerX: this.stageCenterX,
      top: progressLabel.bottom + 4,
    })
    this.addChild(this.progressTrack)
    this.progressFill = new Rectangle(0, 0, 4, 8, {
      cornerRadius: 4,
      fill: AcidsColors.accent,
      left: this.progressTrack.left,
      top: this.progressTrack.top,
    })
    this.addChild(this.progressFill)

    // Beaker geometry: acid (upper-left), base (upper-right), mixture (lower-center).
    this.acidBeakerW = stageW * 0.15
    this.acidBeakerH = stageH * 0.24
    this.acidBeakerX = stageLeft + stageW * 0.08
    this.acidBeakerY = stageTop + stageH * 0.2

    this.baseBeakerW = this.acidBeakerW
    this.baseBeakerH = this.acidBeakerH
    this.baseBeakerX = stageLeft + stageW * 0.92 - this.baseBeakerW
    this.baseBeakerY = this.acidBeakerY

    this.mixBeakerW = stageW * 0.3
    this.mixBeakerH = stageH * 0.4
    this.mixBeakerX = this.stageCenterX - this.mixBeakerW / 2
    this.mixBeakerY = stageTop + stageH * 0.52

    this.acidTargetX = this.mixBeakerX + this.mixBeakerW * 0.26
    this.baseTargetX = this.mixBeakerX + this.mixBeakerW * 0.74
    this.mixRimY = this.mixBeakerY - 4

    // Acid beaker glass + liquid.
    this.acidLiquid = new Rectangle(this.acidBeakerX + 3, this.acidBeakerY, this.acidBeakerW - 6, 0, {
      cornerRadius: 6,
      fill: ACID_COLOR,
    })
    this.addChild(this.acidLiquid)
    this.addChild(
      new Rectangle(this.acidBeakerX, this.acidBeakerY, this.acidBeakerW, this.acidBeakerH, {
        cornerRadius: 8,
        fill: 'rgba(248,250,252,0.3)',
        stroke: '#334155',
        lineWidth: 2,
      }),
    )

    // Base beaker glass + liquid.
    this.baseLiquid = new Rectangle(this.baseBeakerX + 3, this.baseBeakerY, this.baseBeakerW - 6, 0, {
      cornerRadius: 6,
      fill: BASE_COLOR,
    })
    this.addChild(this.baseLiquid)
    this.addChild(
      new Rectangle(this.baseBeakerX, this.baseBeakerY, this.baseBeakerW, this.baseBeakerH, {
        cornerRadius: 8,
        fill: 'rgba(248,250,252,0.3)',
        stroke: '#334155',
        lineWidth: 2,
      }),
    )

    // Pour streams (dashed lines animate via lineDashOffset while pouring).
    this.acidStream = new Line(
      this.acidBeakerX + this.acidBeakerW,
      this.acidBeakerY + this.acidBeakerH * 0.3,
      this.acidTargetX,
      this.mixRimY,
      { stroke: ACID_COLOR, lineWidth: 5, lineCap: 'round', lineDash: [8, 6], visible: false, pickable: false },
    )
    this.baseStream = new Line(
      this.baseBeakerX,
      this.baseBeakerY + this.baseBeakerH * 0.3,
      this.baseTargetX,
      this.mixRimY,
      { stroke: BASE_COLOR, lineWidth: 5, lineCap: 'round', lineDash: [8, 6], visible: false, pickable: false },
    )
    this.addChild(this.acidStream)
    this.addChild(this.baseStream)

    this.ripples = new RippleFX()
    this.addChild(this.ripples)

    // Mixture beaker glass + liquid + salt-crystal layer.
    this.mixLiquid = new Rectangle(this.mixBeakerX + 4, this.mixBeakerY, this.mixBeakerW - 8, 0, {
      cornerRadius: 8,
      fill: '#cbd5e1',
    })
    this.addChild(this.mixLiquid)

    this.saltLayer = new Node({ pickable: false })
    this.addChild(this.saltLayer)

    this.addChild(
      new Rectangle(
        this.mixBeakerX + this.mixBeakerW * 0.28,
        this.mixBeakerY - 12,
        this.mixBeakerW * 0.44,
        14,
        { cornerRadius: 4, fill: 'rgba(248,250,252,0.85)', stroke: '#334155', lineWidth: 1.5 },
      ),
    )
    this.addChild(
      new Rectangle(this.mixBeakerX, this.mixBeakerY, this.mixBeakerW, this.mixBeakerH, {
        cornerRadius: 10,
        fill: 'rgba(248,250,252,0.22)',
        stroke: '#334155',
        lineWidth: 2.5,
      }),
    )

    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    // Labels layer (beaker captions) toggled by Display → Labels.
    this.labelsLayer = new Node({ pickable: false })
    this.labelsLayer.addChild(
      new Text(NeutralizationStrings.acidBeakerLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: this.acidBeakerX + this.acidBeakerW / 2,
        top: this.acidBeakerY + this.acidBeakerH + 6,
      }),
    )
    this.labelsLayer.addChild(
      new Text(NeutralizationStrings.baseBeakerLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: this.baseBeakerX + this.baseBeakerW / 2,
        top: this.baseBeakerY + this.baseBeakerH + 6,
      }),
    )
    this.labelsLayer.addChild(
      new Text(NeutralizationStrings.mixBeakerLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: this.stageCenterX,
        top: this.mixBeakerY + this.mixBeakerH + 30,
      }),
    )
    this.addChild(this.labelsLayer)

    // pH meter chip + salt/water caption, toggled by Display → pH meter.
    this.chipY = this.mixBeakerY + this.mixBeakerH + 6
    this.phMeterLayer = new Node({ pickable: false })
    this.phChipBg = new Rectangle(0, 0, 90, 26, {
      cornerRadius: 8,
      fill: '#cbd5e1',
      stroke: 'rgba(15,23,42,0.35)',
      lineWidth: 1,
      centerX: this.stageCenterX,
      top: this.chipY,
    })
    this.phChipText = new Text('pH 7.0', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.phChipBg.centerX,
      centerY: this.phChipBg.centerY,
    })
    this.saltCaptionText = new Text(NeutralizationStrings.saltWaterCaptionStringProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#16a34a',
      centerX: this.stageCenterX,
      top: this.phChipBg.bottom + 4,
      visible: false,
    })
    this.phMeterLayer.addChild(this.phChipBg)
    this.phMeterLayer.addChild(this.phChipText)
    this.phMeterLayer.addChild(this.saltCaptionText)
    this.addChild(this.phMeterLayer)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX
    this.tipCard.top = stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(NeutralizationStrings.tipTitleStringProperty.value, {
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
    this.miniQuiz.centerX = this.stageCenterX
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

    // Scenario ------------------------------------------------------------
    const scenarioHeader = controlSection(NeutralizationStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    const scenarioLabels: Record<NeutralizationScenario, string> = {
      explore: NeutralizationStrings.scenarioExploreStringProperty.value,
      equalVolumes: NeutralizationStrings.scenarioEqualVolumesStringProperty.value,
      excessAcid: NeutralizationStrings.scenarioExcessAcidStringProperty.value,
      excessBase: NeutralizationStrings.scenarioExcessBaseStringProperty.value,
    }
    this.scenarioButtons = {} as Record<NeutralizationScenario, SoftButton>
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(
        scenarioLabels[scenario],
        () => {
          this.clearSaltCrystals()
          model.setScenario(scenario)
        },
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

    // Conditions ------------------------------------------------------------
    const conditionsHeader = controlSection(NeutralizationStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    const acidSlider = new DepthSlider(model.acidVolumeProperty, {
      min: 0,
      max: 100,
      width: contentW,
      label: NeutralizationStrings.acidVolumeSliderStringProperty.value,
      format: (n) => `${Math.round(n)} mL`,
      fill: ACID_COLOR,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(acidSlider)

    const baseSlider = new DepthSlider(model.baseVolumeProperty, {
      min: 0,
      max: 100,
      width: contentW,
      label: NeutralizationStrings.baseVolumeSliderStringProperty.value,
      format: (n) => `${Math.round(n)} mL`,
      fill: BASE_COLOR,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(baseSlider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: NeutralizationStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: AcidsColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(NeutralizationStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(NeutralizationStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      NeutralizationStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.phMeterBtn = new SoftButton(
      NeutralizationStrings.phMeterOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showPhMeterProperty.value = !model.showPhMeterProperty.value
      },
      { width: halfW, height: btnH, fill: AcidsColors.accent, fontSize: 11, selected: true },
    )
    this.saltCrystalsBtn = new SoftButton(
      NeutralizationStrings.saltCrystalsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showSaltCrystalsProperty.value = !model.showSaltCrystalsProperty.value
      },
      { width: contentW, height: btnH, fill: '#a855f7', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.phMeterBtn)
    panelContent.addChild(this.saltCrystalsBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(NeutralizationStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.pourPlayBtn = new SoftButton(
      NeutralizationStrings.pourButtonStringProperty.value,
      () => {
        model.startPour()
        sounds.playPause(true)
      },
      { width: halfW, height: 38, fill: AcidsColors.accent, fontSize: 12 },
    )
    this.pauseBtn = new SoftButton(
      NeutralizationStrings.pauseButtonStringProperty.value,
      () => {
        model.pause()
        sounds.playPause(false)
      },
      { width: halfW, height: 38, fill: '#64748b', fontSize: 12 },
    )
    const resetMixBtn = new SoftButton(
      NeutralizationStrings.resetMixButtonStringProperty.value,
      () => {
        this.clearSaltCrystals()
        model.resetMix()
        this.particles.clear()
        this.ripples.clear()
        sounds.softClick()
      },
      { width: contentW, height: 32, fill: '#64748b', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.pourPlayBtn)
    panelContent.addChild(this.pauseBtn)
    panelContent.addChild(resetMixBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(NeutralizationStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? NeutralizationStrings.soundOnStringProperty.value
        : NeutralizationStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? NeutralizationStrings.soundOnStringProperty.value : NeutralizationStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    // Status / quiz ---------------------------------------------------
    const statusHeader = controlSection(NeutralizationStrings.sectionStatusStringProperty.value, contentW)
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

    const learnTip = createPanelTip(NeutralizationStrings.learnMoreStringProperty.value, {
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
        const btn = this.scenarioButtons[scenario]
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6

      conditionsHeader.left = 0
      conditionsHeader.top = py
      py = conditionsHeader.bottom + 6
      acidSlider.left = 0
      acidSlider.top = py
      py = acidSlider.bottom + 10
      baseSlider.left = 0
      baseSlider.top = py
      py = baseSlider.bottom + 10
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
      this.phMeterBtn.left = halfW + 8
      this.phMeterBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.saltCrystalsBtn.left = 0
      this.saltCrystalsBtn.top = py
      py = this.saltCrystalsBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.pourPlayBtn.left = 0
      this.pourPlayBtn.top = py
      this.pauseBtn.left = halfW + 8
      this.pauseBtn.top = py
      py = this.pourPlayBtn.bottom + gridGap
      resetMixBtn.left = 0
      resetMixBtn.top = py
      py = resetMixBtn.bottom + 12

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
          this.ripples.clear()
          this.clearSaltCrystals()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    // ── Wiring ───────────────────────────────────────────────────────────────
    const syncStars = () => {
      this.starsText.string = `${NeutralizationStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayback = () => {
      const running = model.runningProperty.value
      const started = model.pourProgressProperty.value > 0.01
      this.pourPlayBtn.setLabel(
        started ? NeutralizationStrings.playButtonStringProperty.value : NeutralizationStrings.pourButtonStringProperty.value,
      )
      this.pourPlayBtn.setSelected(running)
      this.pauseBtn.setSelected(!running)
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) {
        this.scenarioButtons[s].setSelected(s === scenario)
      }
      this.guide.setGuidance(NeutralizationStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? NeutralizationStrings.labelsOnStringProperty.value
          : NeutralizationStrings.labelsOffStringProperty.value,
      )
      this.labelsLayer.visible = model.showLabelsProperty.value
    }
    const syncPhMeter = () => {
      this.phMeterBtn.setSelected(model.showPhMeterProperty.value)
      this.phMeterBtn.setLabel(
        model.showPhMeterProperty.value
          ? NeutralizationStrings.phMeterOnStringProperty.value
          : NeutralizationStrings.phMeterOffStringProperty.value,
      )
      this.phMeterLayer.visible = model.showPhMeterProperty.value
    }
    const syncSaltToggle = () => {
      this.saltCrystalsBtn.setSelected(model.showSaltCrystalsProperty.value)
      this.saltCrystalsBtn.setLabel(
        model.showSaltCrystalsProperty.value
          ? NeutralizationStrings.saltCrystalsOnStringProperty.value
          : NeutralizationStrings.saltCrystalsOffStringProperty.value,
      )
      this.saltLayer.visible = model.showSaltCrystalsProperty.value
    }

    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayback)
    model.pourProgressProperty.link(syncPlayback)
    model.showLabelsProperty.link(syncLabels)
    model.showPhMeterProperty.link(syncPhMeter)
    model.showSaltCrystalsProperty.link(syncSaltToggle)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.neutralHitsProperty.lazyLink(() => this.onNeutralHit())
    model.scenarioSwitchesProperty.lazyLink(() => {
      this.ripples.burst(this.stageCenterX, this.mixBeakerY + this.mixBeakerH * 0.5, {
        color: 'rgba(148,163,184,0.6)',
        count: 2,
        maxR: 30,
      })
    })
    model.starsProperty.lazyLink((stars, oldStars) => {
      if (oldStars !== undefined && stars > oldStars) sounds.celebrate()
    })

    syncStars()
    syncPlayback()
    syncScenario()
    syncLabels()
    syncPhMeter()
    syncSaltToggle()
    this.updateMixVisuals()
  }

  /** Current liquid surface height (top y) inside the mixture beaker for ripple placement. */
  private mixSurfaceY(): number {
    const fill = clamp(this.model.pourProgressProperty.value, 0, 1)
    const liquidH = fill * (this.mixBeakerH - 10)
    return this.mixBeakerY + this.mixBeakerH - liquidH
  }

  private updateMixVisuals(): void {
    const ph = this.model.phProperty.value
    const pourProgress = clamp(this.model.pourProgressProperty.value, 0, 1)
    const color = phToColor(ph)

    // Mixture beaker liquid rises with pour progress; colored by the shared pH→color scale.
    const mixLiquidH = pourProgress * (this.mixBeakerH - 10)
    this.mixLiquid.setRectHeight(Math.max(0, mixLiquidH))
    this.mixLiquid.rectY = this.mixBeakerY + this.mixBeakerH - mixLiquidH
    this.mixLiquid.fill = color

    // Source beakers drain visually as they pour out.
    const acidFrac = clamp(this.model.acidVolumeProperty.value / 100, 0, 1) * (1 - pourProgress)
    const acidLiquidH = acidFrac * (this.acidBeakerH - 6)
    this.acidLiquid.setRectHeight(Math.max(0, acidLiquidH))
    this.acidLiquid.rectY = this.acidBeakerY + this.acidBeakerH - acidLiquidH - 3

    const baseFrac = clamp(this.model.baseVolumeProperty.value / 100, 0, 1) * (1 - pourProgress)
    const baseLiquidH = baseFrac * (this.baseBeakerH - 6)
    this.baseLiquid.setRectHeight(Math.max(0, baseLiquidH))
    this.baseLiquid.rectY = this.baseBeakerY + this.baseBeakerH - baseLiquidH - 3

    // Progress bar.
    this.progressFill.setRectWidth(Math.max(4, pourProgress * this.progressBarW))

    // pH chip + salt/water caption.
    this.phChipBg.fill = color
    this.phChipText.string = `${NeutralizationStrings.phChipPrefixStringProperty.value} ${ph.toFixed(1)}`
    this.phChipText.fill = ph > 6.2 && ph < 9 ? '#0f172a' : '#f8fafc'
    this.phChipText.centerX = this.phChipBg.centerX
    this.phChipText.centerY = this.phChipBg.centerY

    const nearNeutral = pourProgress > 0.05 && Math.abs(ph - 7) <= NEAR_NEUTRAL
    this.saltCaptionText.visible = nearNeutral
    this.saltCaptionText.string = `${phLabel(ph)} \u2014 ${NeutralizationStrings.saltWaterCaptionStringProperty.value}`
    if (!nearNeutral) {
      this.saltCaptionText.string = phLabel(ph)
      this.saltCaptionText.fill = ph < 6.5 ? ACID_COLOR : ph > 7.5 ? BASE_COLOR : '#16a34a'
      this.saltCaptionText.visible = pourProgress > 0.05
    }
    else {
      this.saltCaptionText.fill = '#16a34a'
    }
    this.saltCaptionText.centerX = this.stageCenterX
  }

  private growSaltCrystals(scaledDt: number): void {
    const ph = this.model.phProperty.value
    const pourProgress = this.model.pourProgressProperty.value
    const canGrow = this.model.runningProperty.value && pourProgress > 0.5 && Math.abs(ph - 7) <= NEAR_NEUTRAL

    if (!canGrow) return
    this.crystalGrowTimer += scaledDt
    const interval = 0.35
    while (this.crystalGrowTimer >= interval && this.saltCrystalNodes.length < 16) {
      this.crystalGrowTimer -= interval
      this.addSaltCrystal()
    }
  }

  private addSaltCrystal(): void {
    const liquidH = clamp(this.model.pourProgressProperty.value, 0, 1) * (this.mixBeakerH - 10)
    const bottomY = this.mixBeakerY + this.mixBeakerH - 6
    const topY = Math.max(this.mixBeakerY + this.mixBeakerH - liquidH + 4, bottomY - 26)
    const x = this.mixBeakerX + 10 + Math.random() * (this.mixBeakerW - 20)
    const y = topY + Math.random() * Math.max(2, bottomY - topY)
    const size = 3 + Math.random() * 2.5
    const crystal = new Rectangle(-size / 2, -size / 2, size, size, {
      fill: 'rgba(248,250,252,0.92)',
      stroke: 'rgba(15,23,42,0.25)',
      lineWidth: 0.5,
      rotation: Math.random() * Math.PI,
      centerX: x,
      centerY: y,
      pickable: false,
    })
    this.saltCrystalNodes.push(crystal)
    this.saltLayer.addChild(crystal)
  }

  private clearSaltCrystals(): void {
    for (const node of this.saltCrystalNodes) {
      this.saltLayer.removeChild(node)
    }
    this.saltCrystalNodes.length = 0
    this.crystalGrowTimer = 0
  }

  private onNeutralHit(): void {
    const color = phToColor(this.model.phProperty.value)
    this.particles.burst(this.stageCenterX, this.mixBeakerY + this.mixBeakerH * 0.4, {
      count: 30,
      color,
      speed: 120,
      life: 0.65,
      radius: 3.4,
    })
    this.ripples.burst(this.stageCenterX, this.mixSurfaceY(), { color: 'rgba(34,197,94,0.6)', count: 3, maxR: 46 })
    this.sounds.celebrate()
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      NeutralizationStrings.quizQuestionStringProperty.value,
      [
        { label: NeutralizationStrings.quizCorrectStringProperty.value, correct: true },
        { label: NeutralizationStrings.quizWrong1StringProperty.value, correct: false },
        { label: NeutralizationStrings.quizWrong2StringProperty.value, correct: false },
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
    this.ripples.step(dt)

    const scaledDt = dt * clamp(this.model.simSpeedProperty.value, 0.25, 3)
    const running = this.model.runningProperty.value
    const pourProgress = this.model.pourProgressProperty.value
    const acidPouring = running && pourProgress < 0.98 && this.model.acidVolumeProperty.value > 0.5
    const basePouring = running && pourProgress < 0.98 && this.model.baseVolumeProperty.value > 0.5

    this.acidStream.visible = acidPouring
    this.baseStream.visible = basePouring
    if (acidPouring) this.acidStream.lineDashOffset -= scaledDt * 90
    if (basePouring) this.baseStream.lineDashOffset -= scaledDt * 90

    if (acidPouring || basePouring) {
      this.splashTimer += scaledDt
      if (this.splashTimer >= 0.18) {
        this.splashTimer = 0
        const surfaceY = this.mixSurfaceY()
        if (acidPouring) {
          this.ripples.burst(this.acidTargetX, surfaceY, { color: 'rgba(239,68,68,0.55)', count: 1, maxR: 20, life: 0.4 })
        }
        if (basePouring) {
          this.ripples.burst(this.baseTargetX, surfaceY, { color: 'rgba(59,130,246,0.55)', count: 1, maxR: 20, life: 0.4 })
        }
      }
    }

    this.updateMixVisuals()
    this.growSaltCrystals(scaledDt)

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