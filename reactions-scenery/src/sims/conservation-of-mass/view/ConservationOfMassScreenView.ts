import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Line, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { ConservationOfMassModel, MassScenario } from '../model/ConservationOfMassModel.js'
import { ESCAPED_MASS, TOTAL_MASS } from '../../../shared/conservationOfMassModel.js'
import { ReactionsConstants, clamp, lerp } from '../../../shared/ReactionsConstants.js'
import { ReactionsColors } from '../../../shared/ReactionsColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { StageBackdrop } from '../../../shared/ui/StageBackdrop.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { controlSection } from '../../../shared/ui/controlPanelBits.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { ReactionsSounds } from '../../../shared/ReactionsSounds.js'
import { ConservationOfMassStrings } from '../ConservationOfMassStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly MassScenario[] = ['explore', 'sealed-demo', 'open-demo']

const REACTANT_COLOR = '#2980b9'
const PRODUCT_COLOR = '#e67e22'

const SCENARIO_FILL: Record<MassScenario, string> = {
  explore: ReactionsColors.accent,
  'sealed-demo': '#16a34a',
  'open-demo': '#e74c3c',
}

const SCENARIO_GUIDE: Record<MassScenario, string> = {
  explore: ConservationOfMassStrings.guideExploreStringProperty.value,
  'sealed-demo': ConservationOfMassStrings.guideSealedDemoStringProperty.value,
  'open-demo': ConservationOfMassStrings.guideOpenDemoStringProperty.value,
}

const SCENARIO_TRIAD: Record<MassScenario, [string, string, string]> = {
  explore: [
    'Exploring freely.',
    'The law of conservation of mass says matter can\u2019t be created or destroyed \u2014 reactants\u2019 mass always equals products\u2019 mass.',
    'Try the Sealed demo and Open demo to see why a sealed container keeps the balance level.',
  ],
  'sealed-demo': [
    'Running the sealed demo.',
    'With the lid on, no gas can escape \u2014 so the container\u2019s mass never changes, and the balance stays perfectly level.',
    'Try the Open demo to see what happens when gas is allowed to escape.',
  ],
  'open-demo': [
    'Running the open demo.',
    'Without a lid, gas made by the reaction escapes into the air \u2014 the container looks lighter, even though no mass was truly destroyed.',
    'Return to Sealed demo, or switch to Explore to test the seal yourself.',
  ],
}

/** Small read-only pill, used for the sealed/open badge on the flask. */
function makeChip(text: string, fill: string, textFill = '#0f172a'): Node {
  const label = new Text(text, {
    font: new PhetFont({ size: 11, weight: 'bold' }),
    fill: textFill,
  })
  const bg = new Rectangle(0, 0, label.width + 18, label.height + 10, {
    cornerRadius: 9,
    fill,
    stroke: 'rgba(15,23,42,0.35)',
    lineWidth: 1,
  })
  label.centerX = bg.rectWidth / 2
  label.centerY = bg.rectHeight / 2
  return new Node({ children: [bg, label] })
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function blendColor(fromHex: string, toHex: string, t: number): string {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  const r = Math.round(lerp(from.r, to.r, clamp(t, 0, 1)))
  const g = Math.round(lerp(from.g, to.g, clamp(t, 0, 1)))
  const b = Math.round(lerp(from.b, to.b, clamp(t, 0, 1)))
  return `rgb(${r}, ${g}, ${b})`
}

const MAX_TILT = 0.28
const TILT_K = MAX_TILT / ESCAPED_MASS

/**
 * Dense ecology-style control surface for the conservation-of-mass lab
 * (PTB Grade 8 Ch 6 parity) \u2014 a sealed vs. open reaction flask paired with a
 * balance scale, so students can see mass "disappear" only when gas escapes.
 */
export class ConservationOfMassScreenView extends ScreenView {
  private readonly model: ConservationOfMassModel
  private readonly sounds: ReactionsSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0
  private burstTimer = 0

  // Stage geometry
  private readonly flaskLeft: number
  private readonly flaskTop: number
  private readonly flaskW: number
  private readonly flaskH: number
  private readonly flaskCenterX: number
  private readonly neckW: number
  private readonly neckH: number
  private readonly fulcrumX: number
  private readonly fulcrumY: number
  private readonly beamHalfLen: number
  private readonly panDrop: number
  private readonly panRadius: number
  private readonly barX: number
  private readonly barY: number
  private readonly barW: number
  private readonly barH: number

  // Stage nodes
  private readonly flaskPath: Path
  private readonly flaskLid: Node
  private readonly sealedBadgeLayer: Node
  private readonly labelsLayer: Node
  private readonly balanceLayer: Node
  private readonly beamNode: Node
  private readonly leftPan: Node
  private readonly rightPan: Node
  private readonly leftString: Line
  private readonly rightString: Line
  private readonly leftMassText: Text
  private readonly rightMassText: Text
  private readonly progressFillBar: Rectangle
  private readonly progressPercentText: Text
  private readonly bigMassText: Text
  private readonly bigMassCaption: Text

  // Panel widgets
  private readonly sealedBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly balanceBtn: SoftButton
  private readonly escapeGasBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: ConservationOfMassModel, providedOptions?: Options) {
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
      title: ConservationOfMassStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(ConservationOfMassStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ReactionsColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    // Big digital mass readout, top-center of the stage.
    const readoutW = 216
    const readoutH = 76
    const readoutCard = new DepthCard(readoutW, readoutH, { variant: 'light', cornerRadius: 14 })
    readoutCard.centerX = stageCenterX
    readoutCard.top = stageTop + 8
    readoutCard.content.addChild(
      new Text(ConservationOfMassStrings.massReadoutTitleStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: ReactionsColors.accent,
        left: 16,
        top: 9,
      }),
    )
    this.bigMassText = new Text('', {
      font: new PhetFont({ size: 30, weight: 'bold' }),
      fill: ReactionsColors.ink,
      left: 16,
      top: 26,
    })
    readoutCard.content.addChild(this.bigMassText)
    this.bigMassCaption = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: ReactionsColors.muted,
      right: readoutW - 16,
      bottom: readoutH - 12,
    })
    readoutCard.content.addChild(this.bigMassCaption)
    this.addChild(readoutCard)

    // Flask / container ---------------------------------------------------------
    this.flaskW = stageW * 0.24
    this.flaskH = stageH * 0.44
    this.flaskLeft = stageLeft + stageW * 0.06
    this.flaskTop = stageTop + stageH * 0.32
    this.flaskCenterX = this.flaskLeft + this.flaskW / 2
    this.neckW = this.flaskW * 0.3
    this.neckH = this.flaskH * 0.22

    const flaskShape = new Shape()
      .moveTo(this.flaskCenterX - this.neckW / 2, this.flaskTop)
      .lineTo(this.flaskCenterX + this.neckW / 2, this.flaskTop)
      .lineTo(this.flaskCenterX + this.neckW / 2, this.flaskTop + this.neckH)
      .lineTo(this.flaskCenterX + this.flaskW / 2, this.flaskTop + this.flaskH)
      .lineTo(this.flaskCenterX - this.flaskW / 2, this.flaskTop + this.flaskH)
      .lineTo(this.flaskCenterX - this.neckW / 2, this.flaskTop + this.neckH)
      .close()
    this.flaskPath = new Path(flaskShape, {
      fill: REACTANT_COLOR,
      stroke: '#334155',
      lineWidth: 2.5,
      opacity: 0.88,
    })
    this.addChild(this.flaskPath)

    this.flaskLid = new Node({
      children: [
        new Rectangle(this.flaskCenterX - this.neckW * 0.62, this.flaskTop - 9, this.neckW * 1.24, 10, {
          cornerRadius: 4,
          fill: '#475569',
          stroke: '#1e293b',
          lineWidth: 1.5,
        }),
        new Rectangle(this.flaskCenterX - 3, this.flaskTop - 20, 6, 12, {
          cornerRadius: 2,
          fill: '#334155',
        }),
      ],
    })
    this.addChild(this.flaskLid)

    this.particles = new ParticleBurst(50)
    this.addChild(this.particles)

    this.labelsLayer = new Node({ pickable: false })

    const flaskCaption = new Text('Container', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.flaskCenterX,
      top: this.flaskTop + this.flaskH + 8,
    })
    this.labelsLayer.addChild(flaskCaption)

    this.sealedBadgeLayer = new Node()
    this.labelsLayer.addChild(this.sealedBadgeLayer)

    // Balance scale ---------------------------------------------------------
    this.fulcrumX = stageLeft + stageW * 0.67
    this.fulcrumY = stageTop + stageH * 0.36
    this.beamHalfLen = stageW * 0.16
    this.panDrop = stageH * 0.15
    this.panRadius = Math.min(stageW, stageH) * 0.05
    const standBaseY = this.fulcrumY + stageH * 0.32
    const standHalfW = stageW * 0.045

    this.balanceLayer = new Node()

    const standShape = new Shape()
      .moveTo(this.fulcrumX, this.fulcrumY)
      .lineTo(this.fulcrumX - standHalfW, standBaseY)
      .lineTo(this.fulcrumX + standHalfW, standBaseY)
      .close()
    this.balanceLayer.addChild(new Path(standShape, { fill: '#7f8c8d', stroke: '#334155', lineWidth: 1.5 }))
    this.balanceLayer.addChild(
      new Rectangle(this.fulcrumX - standHalfW * 1.6, standBaseY, standHalfW * 3.2, 8, {
        cornerRadius: 4,
        fill: '#5c6b73',
        stroke: '#334155',
        lineWidth: 1.5,
      }),
    )
    this.balanceLayer.addChild(
      new Circle(6, { fill: '#f1c40f', stroke: '#7f5a00', lineWidth: 1.5, centerX: this.fulcrumX, centerY: this.fulcrumY }),
    )

    this.beamNode = new Node()
    this.beamNode.addChild(
      new Rectangle(-this.beamHalfLen, -3, this.beamHalfLen * 2, 6, {
        cornerRadius: 3,
        fill: '#94a3b8',
        stroke: '#334155',
        lineWidth: 1.5,
      }),
    )
    this.beamNode.x = this.fulcrumX
    this.beamNode.y = this.fulcrumY
    this.balanceLayer.addChild(this.beamNode)

    this.leftString = new Line(0, 0, 0, 0, { stroke: '#475569', lineWidth: 1.5 })
    this.rightString = new Line(0, 0, 0, 0, { stroke: '#475569', lineWidth: 1.5 })
    this.balanceLayer.addChild(this.leftString)
    this.balanceLayer.addChild(this.rightString)

    const makePan = (): Node => {
      const tray = new Path(
        new Shape().moveTo(-this.panRadius, 0).quadraticCurveTo(0, this.panRadius * 0.9, this.panRadius, 0).close(),
        { fill: '#cbd5e1', stroke: '#334155', lineWidth: 1.5 },
      )
      return new Node({ children: [tray] })
    }
    this.leftPan = makePan()
    this.rightPan = makePan()
    this.balanceLayer.addChild(this.leftPan)
    this.balanceLayer.addChild(this.rightPan)

    this.leftMassText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#0f172a',
    })
    this.rightMassText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#0f172a',
    })
    this.balanceLayer.addChild(this.leftMassText)
    this.balanceLayer.addChild(this.rightMassText)

    const leftCaption = new Text(ConservationOfMassStrings.reactantsPanelLabelStringProperty.value, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#334155',
      centerX: this.fulcrumX - this.beamHalfLen,
      top: this.fulcrumY - 46,
      maxWidth: this.beamHalfLen * 1.6,
    })
    const rightCaption = new Text(ConservationOfMassStrings.nowPanelLabelStringProperty.value, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#334155',
      centerX: this.fulcrumX + this.beamHalfLen,
      top: this.fulcrumY - 46,
      maxWidth: this.beamHalfLen * 1.6,
    })
    this.labelsLayer.addChild(leftCaption)
    this.labelsLayer.addChild(rightCaption)

    this.addChild(this.balanceLayer)

    // Progress bar ------------------------------------------------------------
    this.barX = stageLeft + stageW * 0.07
    this.barY = stageTop + stageH * 0.9
    this.barW = stageW * 0.86
    this.barH = 14

    const progressCaption = new Text(ConservationOfMassStrings.progressLabelStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#0f172a',
      left: this.barX,
      bottom: this.barY - 3,
    })
    this.labelsLayer.addChild(progressCaption)

    this.progressPercentText = new Text('0%', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: ReactionsColors.accent,
      right: this.barX + this.barW,
      bottom: this.barY - 3,
    })
    this.labelsLayer.addChild(this.progressPercentText)

    this.addChild(
      new Rectangle(this.barX, this.barY, this.barW, this.barH, {
        cornerRadius: 7,
        fill: 'rgba(15,23,42,0.14)',
        stroke: '#94a3b8',
        lineWidth: 1,
      }),
    )
    this.progressFillBar = new Rectangle(this.barX, this.barY, 4, this.barH, {
      cornerRadius: 7,
      fill: ReactionsColors.accent,
    })
    this.addChild(this.progressFillBar)

    this.addChild(this.labelsLayer)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = stageCenterX
    this.tipCard.top = stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(ConservationOfMassStrings.tipTitleStringProperty.value, {
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

    // Scenario ----------------------------------------------------------------
    const scenarioHeader = controlSection(ConservationOfMassStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    const scenarioLabels: Record<MassScenario, string> = {
      explore: ConservationOfMassStrings.scenarioExploreStringProperty.value,
      'sealed-demo': ConservationOfMassStrings.scenarioSealedDemoStringProperty.value,
      'open-demo': ConservationOfMassStrings.scenarioOpenDemoStringProperty.value,
    }
    const scenarioButtons = {} as Record<MassScenario, SoftButton>
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

    // System --------------------------------------------------------------------
    const systemHeader = controlSection(ConservationOfMassStrings.sectionSystemStringProperty.value, contentW)
    panelContent.addChild(systemHeader)

    this.sealedBtn = new SoftButton(
      ConservationOfMassStrings.sealedOnLabelStringProperty.value,
      () => {
        model.toggleSealed()
        sounds.toggle(model.sealedProperty.value)
      },
      { width: contentW, height: btnH, fill: '#16a34a', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.sealedBtn)

    // Conditions ----------------------------------------------------------------
    const conditionsHeader = controlSection(ConservationOfMassStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: ConservationOfMassStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: ReactionsColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(ConservationOfMassStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      ConservationOfMassStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.balanceBtn = new SoftButton(
      ConservationOfMassStrings.balanceOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showBalanceProperty.value = !model.showBalanceProperty.value
      },
      { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 11, selected: true },
    )
    this.escapeGasBtn = new SoftButton(
      ConservationOfMassStrings.escapeGasOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showEscapeGasProperty.value = !model.showEscapeGasProperty.value
      },
      { width: contentW, height: btnH, fill: '#e74c3c', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.balanceBtn)
    panelContent.addChild(this.escapeGasBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(ConservationOfMassStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      ConservationOfMassStrings.pauseButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: halfW, height: 38, fill: ReactionsColors.accent, fontSize: 12 },
    )
    const resetReactionBtn = new SoftButton(
      ConservationOfMassStrings.resetButtonStringProperty.value,
      () => {
        model.resetReaction()
        this.particles.clear()
        sounds.softClick()
      },
      { width: halfW, height: 38, fill: '#64748b', fontSize: 11 },
    )
    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(resetReactionBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(ConservationOfMassStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? ConservationOfMassStrings.soundOnStringProperty.value
        : ConservationOfMassStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? ConservationOfMassStrings.soundOnStringProperty.value : ConservationOfMassStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    // Status / quiz ---------------------------------------------------
    const statusHeader = controlSection(ConservationOfMassStrings.sectionStatusStringProperty.value, contentW)
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

    const learnTip = createPanelTip(ConservationOfMassStrings.learnMoreStringProperty.value, {
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

      systemHeader.left = 0
      systemHeader.top = py
      py = systemHeader.bottom + 6
      this.sealedBtn.left = 0
      this.sealedBtn.top = py
      py = this.sealedBtn.bottom + 12

      conditionsHeader.left = 0
      conditionsHeader.top = py
      py = conditionsHeader.bottom + 6
      speedSlider.left = 0
      speedSlider.top = py
      py = speedSlider.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.balanceBtn.left = halfW + 8
      this.balanceBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.escapeGasBtn.left = 0
      this.escapeGasBtn.top = py
      py = this.escapeGasBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      resetReactionBtn.left = halfW + 8
      resetReactionBtn.top = py
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
      this.starsText.string = `${ConservationOfMassStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? ConservationOfMassStrings.pauseButtonStringProperty.value
          : ConservationOfMassStrings.playButtonStringProperty.value,
      )
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) {
        scenarioButtons[s].setSelected(s === scenario)
      }
      this.guide.setGuidance(ConservationOfMassStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncSealed = () => {
      const sealed = model.sealedProperty.value
      this.sealedBtn.setSelected(sealed)
      this.sealedBtn.setLabel(
        sealed
          ? ConservationOfMassStrings.sealedOnLabelStringProperty.value
          : ConservationOfMassStrings.sealedOffLabelStringProperty.value,
      )
      this.flaskLid.visible = sealed
      this.sealedBadgeLayer.removeAllChildren()
      const badge = makeChip(
        sealed ? ConservationOfMassStrings.sealedBadgeStringProperty.value : ConservationOfMassStrings.openBadgeStringProperty.value,
        sealed ? '#bbf7d0' : '#fecaca',
      )
      badge.centerX = this.flaskCenterX
      badge.top = this.flaskTop - 42
      this.sealedBadgeLayer.addChild(badge)
      this.updateBalance()
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? ConservationOfMassStrings.labelsOnStringProperty.value
          : ConservationOfMassStrings.labelsOffStringProperty.value,
      )
      this.labelsLayer.visible = model.showLabelsProperty.value
    }
    const syncBalanceDisplay = () => {
      this.balanceBtn.setSelected(model.showBalanceProperty.value)
      this.balanceBtn.setLabel(
        model.showBalanceProperty.value
          ? ConservationOfMassStrings.balanceOnStringProperty.value
          : ConservationOfMassStrings.balanceOffStringProperty.value,
      )
      this.balanceLayer.visible = model.showBalanceProperty.value
    }
    const syncEscapeGas = () => {
      this.escapeGasBtn.setSelected(model.showEscapeGasProperty.value)
      this.escapeGasBtn.setLabel(
        model.showEscapeGasProperty.value
          ? ConservationOfMassStrings.escapeGasOnStringProperty.value
          : ConservationOfMassStrings.escapeGasOffStringProperty.value,
      )
      if (!model.showEscapeGasProperty.value) this.particles.clear()
    }

    model.scenarioProperty.link(syncScenario)
    model.sealedProperty.link(syncSealed)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncLabels)
    model.showBalanceProperty.link(syncBalanceDisplay)
    model.showEscapeGasProperty.link(syncEscapeGas)
    model.progressProperty.link(() => this.updateProgress())
    model.massProperty.link(() => this.updateBalance())
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
    syncSealed()
    syncLabels()
    syncBalanceDisplay()
    syncEscapeGas()
    this.updateProgress()
    this.updateBalance()
  }

  private updateProgress(): void {
    const progress = this.model.progressProperty.value
    this.progressFillBar.setRectWidth(Math.max(4, progress * this.barW))
    this.progressPercentText.string = `${Math.round(progress * 100)}%`
    this.flaskPath.fill = blendColor(REACTANT_COLOR, PRODUCT_COLOR, progress)
  }

  private updateBalance(): void {
    const massNow = this.model.massProperty.value
    this.bigMassText.string = `${massNow.toFixed(1)} g`
    this.bigMassCaption.string = this.model.sealedProperty.value ? 'sealed' : 'open'

    const diff = TOTAL_MASS - massNow
    const angle = clamp(-diff * TILT_K, -MAX_TILT, MAX_TILT)
    this.beamNode.rotation = angle

    const leftEndX = this.fulcrumX - this.beamHalfLen * Math.cos(angle)
    const leftEndY = this.fulcrumY - this.beamHalfLen * Math.sin(angle)
    const rightEndX = this.fulcrumX + this.beamHalfLen * Math.cos(angle)
    const rightEndY = this.fulcrumY + this.beamHalfLen * Math.sin(angle)

    this.leftPan.centerX = leftEndX
    this.leftPan.top = leftEndY + this.panDrop
    this.rightPan.centerX = rightEndX
    this.rightPan.top = rightEndY + this.panDrop

    this.leftString.setLine(leftEndX, leftEndY, this.leftPan.centerX, this.leftPan.top)
    this.rightString.setLine(rightEndX, rightEndY, this.rightPan.centerX, this.rightPan.top)

    this.leftMassText.string = `${TOTAL_MASS.toFixed(1)} g`
    this.leftMassText.centerX = this.leftPan.centerX
    this.leftMassText.top = this.leftPan.bottom + 4
    this.rightMassText.string = `${massNow.toFixed(1)} g`
    this.rightMassText.centerX = this.rightPan.centerX
    this.rightMassText.top = this.rightPan.bottom + 4
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      ConservationOfMassStrings.quizQuestionStringProperty.value,
      [
        { label: ConservationOfMassStrings.quizStaysSameStringProperty.value, correct: true },
        { label: ConservationOfMassStrings.quizIncreasesStringProperty.value, correct: false },
        { label: ConservationOfMassStrings.quizDecreasesStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.particles.step(dt, -60)

    if (this.model.runningProperty.value) {
      const scaledDt = dt * clamp(this.model.simSpeedProperty.value, 0.25, 3)
      const reacting = this.model.progressProperty.value < 1
      if (
        !this.model.sealedProperty.value &&
        reacting &&
        this.model.showEscapeGasProperty.value
      ) {
        this.burstTimer += scaledDt
        if (this.burstTimer >= 0.35) {
          this.burstTimer = 0
          this.particles.burst(this.flaskCenterX, this.flaskTop - 4, {
            count: 2,
            color: 'rgba(148,163,184,0.85)',
            speed: 18,
            life: 1.1,
            radius: 3.4,
          })
        }
      }
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
