import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Line, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import {
  IonicCovalentModel,
  MODE_CAPTION,
  MODE_TITLE,
  Scenario,
} from '../model/IonicCovalentModel.js'
import { BondMode, covalentShareOffset, ionicElectronPos } from '../../../shared/ionicCovalentModel.js'
import { ReactionsConstants, clamp, lerp } from '../../../shared/ReactionsConstants.js'
import { ReactionsColors } from '../../../shared/ReactionsColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { StageBackdrop } from '../../../shared/ui/StageBackdrop.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { RippleFX } from '../../../shared/ui/RippleFX.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { controlSection } from '../../../shared/ui/controlPanelBits.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { ReactionsSounds } from '../../../shared/ReactionsSounds.js'
import { IonicCovalentStrings } from '../IonicCovalentStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const MODES: readonly BondMode[] = ['ionic', 'covalent-h2', 'covalent-h2o']
const SCENARIOS: readonly Scenario[] = ['explore', 'transfer', 'sharing']

const MODE_FILL: Record<BondMode, string> = {
  ionic: '#c0392b',
  'covalent-h2': '#2980b9',
  'covalent-h2o': '#16a085',
}

const SCENARIO_FILL: Record<Scenario, string> = {
  explore: ReactionsColors.accent,
  transfer: '#c0392b',
  sharing: '#2980b9',
}

const SCENARIO_GUIDE: Record<Scenario, string> = {
  explore: IonicCovalentStrings.guideExploreStringProperty.value,
  transfer: IonicCovalentStrings.guideTransferStringProperty.value,
  sharing: IonicCovalentStrings.guideSharingStringProperty.value,
}

const SCENARIO_TRIAD: Record<Scenario, [string, string, string]> = {
  explore: [
    'Exploring freely.',
    'Ionic bonds transfer electrons; covalent bonds share them. Pick a bond type to see the difference.',
    'Try Transfer focus or Sharing focus to zoom in on each behavior.',
  ],
  transfer: [
    'Testing electron transfer.',
    'Na completely gives up its outer electron to Cl, forming Na\u207a and Cl\u207b ions that attract each other.',
    'Turn on Charges to see the ionic charges appear once the electron fully transfers.',
  ],
  sharing: [
    'Testing electron sharing.',
    'In a covalent bond the electron pair stays between the two nuclei, oscillating instead of transferring.',
    'Try Covalent H\u2082O to see two shared pairs holding a bent molecule together.',
  ],
}

interface AtomSpec {
  x: number
  y: number
  r: number
  fill: string
  stroke: string
  label: string
}

interface BondSpec {
  kind: 'ionic' | 'covalent'
  ax: number
  ay: number
  bx: number
  by: number
}

interface StageLayout {
  atoms: AtomSpec[]
  bonds: BondSpec[]
}

function layoutFor(mode: BondMode, stageLeft: number, stageTop: number, stageW: number, stageH: number): StageLayout {
  const scale = Math.min(stageW, stageH)

  if (mode === 'ionic') {
    const y = stageTop + stageH * 0.42
    const naX = stageLeft + stageW * 0.26
    const clX = stageLeft + stageW * 0.74
    return {
      atoms: [
        { x: naX, y, r: scale * 0.15, fill: '#bdc3c7', stroke: '#7f8c8d', label: 'Na' },
        { x: clX, y, r: scale * 0.17, fill: '#27ae60', stroke: '#1e8449', label: 'Cl' },
      ],
      bonds: [{ kind: 'ionic', ax: naX, ay: y, bx: clX, by: y }],
    }
  }

  if (mode === 'covalent-h2') {
    const y = stageTop + stageH * 0.46
    const dist = scale * 0.28
    const cx = stageLeft + stageW * 0.5
    const h1X = cx - dist / 2
    const h2X = cx + dist / 2
    return {
      atoms: [
        { x: h1X, y, r: scale * 0.11, fill: '#eaf2f8', stroke: '#5dade2', label: 'H' },
        { x: h2X, y, r: scale * 0.11, fill: '#eaf2f8', stroke: '#5dade2', label: 'H' },
      ],
      bonds: [{ kind: 'covalent', ax: h1X, ay: y, bx: h2X, by: y }],
    }
  }

  // covalent-h2o — bent molecule, ~104.5° H-O-H angle.
  const oX = stageLeft + stageW * 0.5
  const oY = stageTop + stageH * 0.26
  const dist = scale * 0.34
  const halfAngle = ((104.5 / 2) * Math.PI) / 180
  const h1X = oX - dist * Math.sin(halfAngle)
  const h2X = oX + dist * Math.sin(halfAngle)
  const hY = oY + dist * Math.cos(halfAngle)
  return {
    atoms: [
      { x: oX, y: oY, r: scale * 0.15, fill: '#e74c3c', stroke: '#a93226', label: 'O' },
      { x: h1X, y: hY, r: scale * 0.1, fill: '#eaf2f8', stroke: '#5dade2', label: 'H' },
      { x: h2X, y: hY, r: scale * 0.1, fill: '#eaf2f8', stroke: '#5dade2', label: 'H' },
    ],
    bonds: [
      { kind: 'covalent', ax: oX, ay: oY, bx: h1X, by: hY },
      { kind: 'covalent', ax: oX, ay: oY, bx: h2X, by: hY },
    ],
  }
}

/**
 * Dense ecology-style control surface for the ionic vs covalent bonding lab
 * (PTB Grade 8 Ch 6 parity) \u2014 an ionic mode where one electron transfers
 * completely (Na \u2192 Cl), and two covalent modes (H\u2082, H\u2082O) where electron
 * pairs are shared and oscillate in place between the bonded atoms.
 */
export class IonicCovalentScreenView extends ScreenView {
  private readonly model: IonicCovalentModel
  private readonly sounds: ReactionsSounds
  private readonly ripples: RippleFX
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  // Stage geometry
  private readonly stageLeft: number
  private readonly stageTop: number
  private readonly stageW: number
  private readonly stageH: number
  private readonly stageCenterX: number

  // Stage nodes
  private readonly modeTitleText: Text
  private readonly modeCaptionText: RichText
  private readonly atomsLayer: Node
  private readonly orbitLayer: Node
  private readonly chargesLayer: Node
  private readonly electronsLayer: Node
  private stageLayout: StageLayout

  // Panel widgets
  private readonly modeButtons: Record<BondMode, SoftButton>
  private readonly scenarioButtons: Record<Scenario, SoftButton>
  private readonly chargesBtn: SoftButton
  private readonly electronLabelsBtn: SoftButton
  private readonly orbitHintsBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: IonicCovalentModel, providedOptions?: Options) {
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
    this.stageLeft = stageLeft
    this.stageTop = stageTop
    this.stageW = stageW
    this.stageH = stageH
    this.stageCenterX = stageCenterX
    this.stageLayout = layoutFor(model.bondModeProperty.value, stageLeft, stageTop, stageW, stageH)

    // ── Guidance banner ──────────────────────────────────────────────────────
    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: IonicCovalentStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(IonicCovalentStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ReactionsColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    this.modeTitleText = new Text('', {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      fill: '#0f172a',
      centerX: stageCenterX,
      top: stageTop + 10,
      maxWidth: stageW - 40,
    })
    this.addChild(this.modeTitleText)

    this.modeCaptionText = new RichText('', {
      font: new PhetFont(12),
      fill: '#475569',
      lineWrap: stageW * 0.72,
      leading: 3,
      align: 'center',
      centerX: stageCenterX,
      top: this.modeTitleText.bottom + 4,
    })
    this.addChild(this.modeCaptionText)

    this.atomsLayer = new Node({ pickable: false })
    this.orbitLayer = new Node({ pickable: false })
    this.chargesLayer = new Node({ pickable: false })
    this.electronsLayer = new Node({ pickable: false })
    this.addChild(this.atomsLayer)
    this.addChild(this.orbitLayer)
    this.addChild(this.chargesLayer)
    this.addChild(this.electronsLayer)

    this.ripples = new RippleFX()
    this.addChild(this.ripples)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = stageCenterX
    this.tipCard.top = stageTop + stageH - 122
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(IonicCovalentStrings.tipTitleStringProperty.value, {
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

    // Bond Mode -----------------------------------------------------------------
    const modeHeader = controlSection(IonicCovalentStrings.sectionBondModeStringProperty.value, contentW)
    panelContent.addChild(modeHeader)

    const modeLabels: Record<BondMode, string> = {
      ionic: IonicCovalentStrings.modeIonicStringProperty.value,
      'covalent-h2': IonicCovalentStrings.modeCovalentH2StringProperty.value,
      'covalent-h2o': IonicCovalentStrings.modeCovalentH2oStringProperty.value,
    }
    this.modeButtons = {} as Record<BondMode, SoftButton>
    for (const mode of MODES) {
      const btn = new SoftButton(modeLabels[mode], () => model.setBondMode(mode), {
        width: contentW,
        height: btnH,
        fill: MODE_FILL[mode],
        selected: mode === model.bondModeProperty.value,
        fontSize: 12,
        onSound: () => sounds.modeChange(),
      })
      this.modeButtons[mode] = btn
      panelContent.addChild(btn)
    }

    // Scenario ------------------------------------------------------------------
    const scenarioHeader = controlSection(IonicCovalentStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    const scenarioLabels: Record<Scenario, string> = {
      explore: IonicCovalentStrings.scenarioExploreStringProperty.value,
      transfer: IonicCovalentStrings.scenarioTransferStringProperty.value,
      sharing: IonicCovalentStrings.scenarioSharingStringProperty.value,
    }
    this.scenarioButtons = {} as Record<Scenario, SoftButton>
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[scenario], () => model.setScenario(scenario), {
        width: contentW,
        height: btnH,
        fill: SCENARIO_FILL[scenario],
        selected: scenario === 'explore',
        fontSize: 12,
        onSound: () => sounds.scenario(),
      })
      this.scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    // Conditions ------------------------------------------------------------------
    const conditionsHeader = controlSection(IonicCovalentStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: IonicCovalentStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: ReactionsColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(IonicCovalentStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.chargesBtn = new SoftButton(
      IonicCovalentStrings.chargesOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showChargesProperty.value = !model.showChargesProperty.value
      },
      { width: halfW, height: btnH, fill: '#c0392b', fontSize: 11, selected: true },
    )
    this.electronLabelsBtn = new SoftButton(
      IonicCovalentStrings.electronLabelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showElectronLabelsProperty.value = !model.showElectronLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#d4ac0d', fontSize: 10, selected: true },
    )
    this.orbitHintsBtn = new SoftButton(
      IonicCovalentStrings.orbitHintsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showOrbitHintsProperty.value = !model.showOrbitHintsProperty.value
      },
      { width: contentW, height: btnH, fill: '#8e44ad', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.chargesBtn)
    panelContent.addChild(this.electronLabelsBtn)
    panelContent.addChild(this.orbitHintsBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(IonicCovalentStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      IonicCovalentStrings.pauseButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: halfW, height: 38, fill: ReactionsColors.accent, fontSize: 12 },
    )
    const stepPhaseBtn = new SoftButton(
      IonicCovalentStrings.stepPhaseButtonStringProperty.value,
      () => {
        model.stepPhaseOnce()
        sounds.softClick()
      },
      { width: halfW, height: 38, fill: '#64748b', fontSize: 11 },
    )
    const resetDemoBtn = new SoftButton(
      IonicCovalentStrings.resetDemoButtonStringProperty.value,
      () => {
        model.resetDemo()
        this.ripples.clear()
        sounds.softClick()
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(stepPhaseBtn)
    panelContent.addChild(resetDemoBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(IonicCovalentStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? IonicCovalentStrings.soundOnStringProperty.value
        : IonicCovalentStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? IonicCovalentStrings.soundOnStringProperty.value : IonicCovalentStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    // Status / quiz ---------------------------------------------------
    const statusHeader = controlSection(IonicCovalentStrings.sectionStatusStringProperty.value, contentW)
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

    const learnTip = createPanelTip(IonicCovalentStrings.learnMoreStringProperty.value, {
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
      for (const mode of MODES) {
        const btn = this.modeButtons[mode]
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6

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
      py = speedSlider.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.chargesBtn.left = 0
      this.chargesBtn.top = py
      this.electronLabelsBtn.left = halfW + 8
      this.electronLabelsBtn.top = py
      py = this.chargesBtn.bottom + gridGap
      this.orbitHintsBtn.left = 0
      this.orbitHintsBtn.top = py
      py = this.orbitHintsBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      stepPhaseBtn.left = halfW + 8
      stepPhaseBtn.top = py
      py = this.playPauseBtn.bottom + gridGap
      resetDemoBtn.left = 0
      resetDemoBtn.top = py
      py = resetDemoBtn.bottom + 12

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
          this.ripples.clear()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    // ── Wiring ───────────────────────────────────────────────────────────────
    const syncStars = () => {
      this.starsText.string = `${IonicCovalentStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? IonicCovalentStrings.pauseButtonStringProperty.value
          : IonicCovalentStrings.playButtonStringProperty.value,
      )
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) {
        this.scenarioButtons[s].setSelected(s === scenario)
      }
      this.guide.setGuidance(IonicCovalentStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncMode = () => {
      const mode = model.bondModeProperty.value
      for (const mo of MODES) {
        this.modeButtons[mo].setSelected(mo === mode)
      }
      this.rebuildStage(mode)
    }
    const syncCharges = () => {
      this.chargesBtn.setSelected(model.showChargesProperty.value)
      this.chargesBtn.setLabel(
        model.showChargesProperty.value
          ? IonicCovalentStrings.chargesOnStringProperty.value
          : IonicCovalentStrings.chargesOffStringProperty.value,
      )
      this.updateCharges()
    }
    const syncElectronLabels = () => {
      this.electronLabelsBtn.setSelected(model.showElectronLabelsProperty.value)
      this.electronLabelsBtn.setLabel(
        model.showElectronLabelsProperty.value
          ? IonicCovalentStrings.electronLabelsOnStringProperty.value
          : IonicCovalentStrings.electronLabelsOffStringProperty.value,
      )
    }
    const syncOrbitHints = () => {
      this.orbitHintsBtn.setSelected(model.showOrbitHintsProperty.value)
      this.orbitHintsBtn.setLabel(
        model.showOrbitHintsProperty.value
          ? IonicCovalentStrings.orbitHintsOnStringProperty.value
          : IonicCovalentStrings.orbitHintsOffStringProperty.value,
      )
      this.orbitLayer.visible = model.showOrbitHintsProperty.value
    }

    model.scenarioProperty.link(syncScenario)
    model.bondModeProperty.link(syncMode)
    model.runningProperty.link(syncPlayPause)
    model.showChargesProperty.link(syncCharges)
    model.showElectronLabelsProperty.link(syncElectronLabels)
    model.showOrbitHintsProperty.link(syncOrbitHints)
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
    model.transferredProperty.lazyLink((transferred) => {
      this.updateCharges()
      if (transferred) {
        const na = this.stageLayout.bonds[0]
        this.ripples.burst(na.bx, na.by, { color: 'rgba(39,174,96,0.7)', maxR: 40, life: 0.5 })
        sounds.reveal()
      }
    })

    syncStars()
    syncPlayPause()
    syncScenario()
    syncMode()
    syncCharges()
    syncElectronLabels()
    syncOrbitHints()
    this.redrawElectrons()
  }

  /** Rebuilds the static atom/bond/orbit-hint layers for the current bond mode. */
  private rebuildStage(mode: BondMode): void {
    this.stageLayout = layoutFor(mode, this.stageLeft, this.stageTop, this.stageW, this.stageH)
    this.modeTitleText.string = MODE_TITLE[mode]
    this.modeTitleText.centerX = this.stageCenterX
    this.modeCaptionText.string = MODE_CAPTION[mode]
    this.modeCaptionText.centerX = this.stageCenterX
    this.modeCaptionText.top = this.modeTitleText.bottom + 4

    this.atomsLayer.removeAllChildren()
    this.orbitLayer.removeAllChildren()
    this.chargesLayer.removeAllChildren()

    for (const bond of this.stageLayout.bonds) {
      this.atomsLayer.addChild(
        new Line(bond.ax, bond.ay, bond.bx, bond.by, {
          stroke: 'rgba(71,85,105,0.4)',
          lineWidth: 3,
          lineDash: bond.kind === 'ionic' ? [6, 5] : [],
        }),
      )
    }

    for (const atom of this.stageLayout.atoms) {
      this.atomsLayer.addChild(
        new Circle(atom.r, {
          fill: atom.fill,
          stroke: atom.stroke,
          lineWidth: 2.5,
          centerX: atom.x,
          centerY: atom.y,
        }),
      )
      this.atomsLayer.addChild(
        new Text(atom.label, {
          font: new PhetFont({ size: Math.max(12, atom.r * 0.5), weight: 'bold' }),
          fill: '#0f172a',
          centerX: atom.x,
          centerY: atom.y,
        }),
      )
      this.orbitLayer.addChild(
        new Circle(atom.r + 13, {
          stroke: 'rgba(13,148,136,0.5)',
          lineWidth: 1.5,
          lineDash: [3, 4],
          centerX: atom.x,
          centerY: atom.y,
        }),
      )
    }
    this.orbitLayer.visible = this.model.showOrbitHintsProperty.value

    if (mode === 'ionic') {
      const na = this.stageLayout.atoms[0]
      const cl = this.stageLayout.atoms[1]
      this.chargesLayer.addChild(
        new Text('Na\u207a', {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: '#c0392b',
          centerX: na.x,
          bottom: na.y - na.r - 6,
        }),
      )
      this.chargesLayer.addChild(
        new Text('Cl\u207b', {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: '#16a085',
          centerX: cl.x,
          bottom: cl.y - cl.r - 6,
        }),
      )
    }
    this.updateCharges()
    this.redrawElectrons()
  }

  private updateCharges(): void {
    const visible = this.model.bondModeProperty.value === 'ionic'
      && this.model.showChargesProperty.value
      && this.model.transferredProperty.value
    for (const child of this.chargesLayer.children) {
      child.visible = visible
    }
  }

  private redrawElectrons(): void {
    this.electronsLayer.removeAllChildren()
    const phase = this.model.phaseProperty.value
    const time = this.model.timeProperty.value
    const showLabels = this.model.showElectronLabelsProperty.value

    for (const bond of this.stageLayout.bonds) {
      if (bond.kind === 'ionic') {
        const { cl } = ionicElectronPos(phase)
        const ex = lerp(bond.ax, bond.bx, cl)
        const ey = lerp(bond.ay, bond.by, cl)
        this.addElectronDot(ex, ey, showLabels)
      }
      else {
        const dx = bond.bx - bond.ax
        const dy = bond.by - bond.ay
        const len = Math.max(1, Math.hypot(dx, dy))
        const perpX = -dy / len
        const perpY = dx / len
        const midX = (bond.ax + bond.bx) / 2
        const midY = (bond.ay + bond.by) / 2
        const offset = covalentShareOffset(phase, time)
        this.addElectronDot(midX + perpX * offset, midY + perpY * offset, showLabels)
        this.addElectronDot(midX - perpX * offset, midY - perpY * offset, showLabels)
      }
    }
  }

  private addElectronDot(x: number, y: number, showLabel: boolean): void {
    this.electronsLayer.addChild(
      new Circle(5.5, { fill: '#f1c40f', stroke: '#a16207', lineWidth: 1, centerX: x, centerY: y }),
    )
    if (showLabel) {
      this.electronsLayer.addChild(
        new Text('e\u207b', {
          font: new PhetFont({ size: 10, weight: 'bold' }),
          fill: '#7d6608',
          centerX: x,
          top: y + 7,
        }),
      )
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
      IonicCovalentStrings.quizQuestionStringProperty.value,
      [
        { label: IonicCovalentStrings.quizCorrectStringProperty.value, correct: true },
        { label: IonicCovalentStrings.quizWrongStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  public override step(dt: number): void {
    this.model.step(dt)
    if (this.model.runningProperty.value) {
      this.ripples.step(dt * clamp(this.model.simSpeedProperty.value, 0.25, 3))
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
