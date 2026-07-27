import { EmptySelfOptions } from 'scenerystack/phet-core'
import { NumberProperty } from 'scenerystack/axon'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { BalanceEquationsModel, MAX_COEFFICIENT, MIN_COEFFICIENT } from '../model/BalanceEquationsModel.js'
import {
  EQUATIONS,
  countAtoms,
  formatAtomCounts,
  formatEquation,
} from '../../../shared/balanceEquationsModel.js'
import type { MoleculeSpec } from '../../../shared/balanceEquationsModel.js'
import { ReactionsConstants } from '../../../shared/ReactionsConstants.js'
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
import { BalanceEquationsStrings } from '../BalanceEquationsStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type Triad = [string, string, string]

const EQUATION_ACCENTS: readonly string[] = ['#0d9488', '#2563eb', '#c0392b', '#f97316']

const EQUATION_GUIDES: readonly string[] = [
  BalanceEquationsStrings.guideH2OStringProperty.value,
  BalanceEquationsStrings.guideNH3StringProperty.value,
  BalanceEquationsStrings.guideFe2O3StringProperty.value,
  BalanceEquationsStrings.guideCombustionStringProperty.value,
]

const EQUATION_TRIADS: readonly Triad[] = [
  [
    'Hydrogen and oxygen gas react to form water.',
    'Atoms rearrange during a reaction, but none are created or destroyed \u2014 the Law of Conservation of Mass.',
    'Set each coefficient until H and O atoms match, or press Auto-balance to check.',
  ],
  [
    'Nitrogen and hydrogen gas combine to form ammonia.',
    'The same number of N and H atoms must appear on both sides \u2014 atoms just regroup into new molecules.',
    'Try the sliders, then use Hint if you get stuck.',
  ],
  [
    'Iron reacts with oxygen gas to form rust.',
    'Rust looks like a new substance, but every Fe and O atom from the metal and air is still there.',
    'Balance Fe and O, then compare with the other reactions.',
  ],
  [
    'Methane burns in oxygen, releasing energy as it forms carbon dioxide and water.',
    'Combustion looks dramatic, but carbon, hydrogen, and oxygen atoms are only rearranged, never lost.',
    'This one has the most atoms to track \u2014 take it one element at a time.',
  ],
]

const EQUATION_BUTTON_LABELS: readonly string[] = [
  BalanceEquationsStrings.eqH2OStringProperty.value,
  BalanceEquationsStrings.eqNH3StringProperty.value,
  BalanceEquationsStrings.eqFe2O3StringProperty.value,
  BalanceEquationsStrings.eqCombustionStringProperty.value,
]

/**
 * Dense ecology-style control surface for the balance-equations (conservation of atoms) lab.
 */
export class BalanceEquationsScreenView extends ScreenView {
  private readonly model: BalanceEquationsModel
  private readonly sounds: ReactionsSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private readonly equationTitleText: Text
  private readonly balancedBadgeText: Text
  private readonly stageLayer: Node
  private readonly equationButtons: SoftButton[] = []
  private readonly labelsBtn: SoftButton
  private readonly atomCountsBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly panelSoundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText
  private readonly moleculeSliderNodes: Node[] = []
  private readonly sliderPropsById = new Map<string, NumberProperty>()
  private readonly panelContent: Node
  private readonly panelContentW: number
  private readonly atomsCache = new Map<string, readonly string[]>()
  private tipTimer = 0

  // Stage geometry
  private readonly stageCenterX: number
  private readonly groupTop: number
  private readonly groupCenterY: number
  private readonly chipsY: number
  private readonly reactantsAreaLeft: number
  private readonly reactantsAreaRight: number
  private readonly productsAreaLeft: number
  private readonly productsAreaRight: number

  private relayoutPanel: () => void = () => {}

  public constructor(model: BalanceEquationsModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new ReactionsSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = ReactionsConstants.SCREEN_VIEW_X_MARGIN
    const my = ReactionsConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 280
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78
    this.stageCenterX = stageLeft + stageW / 2

    this.groupTop = stageTop + 62
    this.groupCenterY = this.groupTop + stageH * 0.22
    this.chipsY = this.groupCenterY + stageH * 0.28
    const arrowGap = 46
    this.reactantsAreaLeft = stageLeft + 18
    this.reactantsAreaRight = this.stageCenterX - arrowGap
    this.productsAreaLeft = this.stageCenterX + arrowGap
    this.productsAreaRight = stageLeft + stageW - 18

    // \u2500\u2500 Guidance banner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: BalanceEquationsStrings.guideTitleStringProperty.value,
      body: EQUATION_GUIDES[0],
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    // \u2500\u2500 Left column: teaching triad + learn-more tip \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const leftCard = new DepthCard(leftW, stageH)
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.leftLearnTip = createPanelTip(BalanceEquationsStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ReactionsColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // \u2500\u2500 Center stage \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#bfe6e2', bottom: '#eafaf8' }))

    this.equationTitleText = new Text('', {
      font: new PhetFont({ size: 19, weight: 'bold' }),
      fill: ReactionsColors.ink,
      centerX: this.stageCenterX,
      top: stageTop + 8,
      maxWidth: stageW - 20,
      pickable: false,
    })
    this.addChild(this.equationTitleText)

    this.balancedBadgeText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: ReactionsColors.panelMuted,
      centerX: this.stageCenterX,
      top: this.equationTitleText.bottom + 2,
      pickable: false,
    })
    this.addChild(this.balancedBadgeText)

    this.addChild(
      new Text(BalanceEquationsStrings.reactantsLabelStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: ReactionsColors.muted,
        centerX: (this.reactantsAreaLeft + this.reactantsAreaRight) / 2,
        top: this.groupTop - 14,
        pickable: false,
      }),
    )
    this.addChild(
      new Text(BalanceEquationsStrings.productsLabelStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: ReactionsColors.muted,
        centerX: (this.productsAreaLeft + this.productsAreaRight) / 2,
        top: this.groupTop - 14,
        pickable: false,
      }),
    )

    this.stageLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer)

    this.particles = new ParticleBurst(80)
    this.addChild(this.particles)

    // \u2500\u2500 Timed hint card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    this.tipCard = new DepthCard(260, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX
    this.tipCard.top = stageTop + stageH - 118
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text('\u2764 Hint', {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: ReactionsColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: ReactionsColors.ink,
      lineWrap: 232,
      leading: 3,
      left: 14,
      top: 30,
      maxWidth: 232,
    })
    this.tipCard.content.addChild(this.tipBodyText)
    this.addChild(this.tipCard)

    // \u2500\u2500 Mini quiz overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    this.miniQuiz = new MiniQuiz(240)
    this.miniQuiz.centerX = this.stageCenterX
    this.miniQuiz.centerY = stageTop + stageH * 0.5
    this.addChild(this.miniQuiz)

    // \u2500\u2500 Right column: dense scrollable control panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const card = new DepthCard(rightW, stageH)
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    this.panelContent = panelContent
    const contentW = rightW - 42
    this.panelContentW = contentW
    const halfW = (contentW - 8) / 2
    const btnH = 32
    const gridGap = 6

    // Equation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const equationHeader = controlSection(BalanceEquationsStrings.sectionEquationStringProperty.value, contentW)
    panelContent.addChild(equationHeader)

    EQUATIONS.forEach((eq, i) => {
      const btn = new SoftButton(
        EQUATION_BUTTON_LABELS[i] ?? eq.label,
        () => model.setEquation(i),
        {
          width: contentW,
          height: btnH,
          fill: EQUATION_ACCENTS[i] ?? ReactionsColors.accent,
          selected: i === 0,
          fontSize: 12,
          onSound: () => sounds.scenario(),
        },
      )
      this.equationButtons.push(btn)
      panelContent.addChild(btn)
    })

    // Coefficients (dynamic \u2014 rebuilt whenever the equation changes) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const coefficientsHeader = controlSection(BalanceEquationsStrings.sectionCoefficientsStringProperty.value, contentW)
    panelContent.addChild(coefficientsHeader)

    const coefficientsHint = controlHint(BalanceEquationsStrings.coefficientsHintStringProperty.value, contentW)
    panelContent.addChild(coefficientsHint)

    const autoBalanceBtn = new SoftButton(
      BalanceEquationsStrings.autoBalanceButtonStringProperty.value,
      () => {
        model.autoBalance()
        sounds.button()
      },
      { width: halfW, height: btnH, fill: ReactionsColors.accent, fontSize: 11 },
    )
    const hintBtn = new SoftButton(
      BalanceEquationsStrings.hintButtonStringProperty.value,
      () => {
        model.hint()
        sounds.softClick()
      },
      { width: halfW, height: btnH, fill: '#7c3aed', fontSize: 11 },
    )
    panelContent.addChild(autoBalanceBtn)
    panelContent.addChild(hintBtn)

    // Display \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const displayHeader = controlSection(BalanceEquationsStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      BalanceEquationsStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 11, selected: true },
    )
    this.atomCountsBtn = new SoftButton(
      BalanceEquationsStrings.atomCountsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showAtomCountsProperty.value = !model.showAtomCountsProperty.value
      },
      { width: halfW, height: btnH, fill: '#16a34a', fontSize: 11, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.atomCountsBtn)

    // Playback \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const playbackHeader = controlSection(BalanceEquationsStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    const simSpeedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: BalanceEquationsStrings.simSpeedStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: ReactionsColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(simSpeedSlider)

    this.playPauseBtn = new SoftButton(
      BalanceEquationsStrings.playButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: 36, fill: ReactionsColors.accent, fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)

    const playbackHint = controlHint(BalanceEquationsStrings.playbackHintStringProperty.value, contentW)
    panelContent.addChild(playbackHint)

    // Sound \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const soundHeader = controlSection(BalanceEquationsStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.panelSoundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? BalanceEquationsStrings.soundOnStringProperty.value
        : BalanceEquationsStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.panelSoundBtn.setLabel(
          on ? BalanceEquationsStrings.soundOnStringProperty.value : BalanceEquationsStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.panelSoundBtn)

    // Status \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const statusHeader = controlSection(BalanceEquationsStrings.sectionStatusStringProperty.value, contentW)
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

    const learnTip = createPanelTip(BalanceEquationsStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 11,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      equationHeader.left = 0
      equationHeader.top = py
      py = equationHeader.bottom + 6
      for (const btn of this.equationButtons) {
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6

      coefficientsHeader.left = 0
      coefficientsHeader.top = py
      py = coefficientsHeader.bottom + 6
      for (const slider of this.moleculeSliderNodes) {
        slider.left = 0
        slider.top = py
        py = slider.bottom + 8
      }
      autoBalanceBtn.left = 0
      autoBalanceBtn.top = py
      hintBtn.left = halfW + 8
      hintBtn.top = py
      py = autoBalanceBtn.bottom + 4
      coefficientsHint.left = 0
      coefficientsHint.top = py
      py = coefficientsHint.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.atomCountsBtn.left = halfW + 8
      this.atomCountsBtn.top = py
      py = this.labelsBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      simSpeedSlider.left = 0
      simSpeedSlider.top = py
      py = simSpeedSlider.bottom + 8
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      py = this.playPauseBtn.bottom + 4
      playbackHint.left = 0
      playbackHint.top = py
      py = playbackHint.bottom + 12

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
    this.relayoutPanel = relayoutPanel

    this.rebuildMoleculeControls()

    const scroller = new ScrollableNode(panelContent, rightW - 24, stageH - 72)
    scroller.left = 12
    scroller.top = 12
    card.content.addChild(scroller)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          sounds.resetAll()
          model.reset()
          this.rebuildMoleculeControls()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    // \u2500\u2500 Wiring \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    const syncStars = () => {
      this.starsText.string = `${BalanceEquationsStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncStatus = () => {
      this.statusText.string = model.statusProperty.value
      relayoutPanel()
    }
    const syncEquation = () => {
      const idx = model.equationIndexProperty.value
      this.equationButtons.forEach((btn, i) => btn.setSelected(i === idx))
      this.guide.setGuidance(BalanceEquationsStrings.guideTitleStringProperty.value, EQUATION_GUIDES[idx] ?? EQUATION_GUIDES[0])
      const triad = EQUATION_TRIADS[idx] ?? EQUATION_TRIADS[0]
      this.teachingTriad.setTriad(triad[0], triad[1], triad[2], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? BalanceEquationsStrings.pauseButtonStringProperty.value
          : BalanceEquationsStrings.playButtonStringProperty.value,
      )
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? BalanceEquationsStrings.labelsOnStringProperty.value
          : BalanceEquationsStrings.labelsOffStringProperty.value,
      )
    }
    const syncAtomCounts = () => {
      this.atomCountsBtn.setSelected(model.showAtomCountsProperty.value)
      this.atomCountsBtn.setLabel(
        model.showAtomCountsProperty.value
          ? BalanceEquationsStrings.atomCountsOnStringProperty.value
          : BalanceEquationsStrings.atomCountsOffStringProperty.value,
      )
    }

    model.equationIndexProperty.link(syncEquation)
    model.equationRebuiltProperty.lazyLink(() => this.rebuildMoleculeControls())
    model.showLabelsProperty.link(syncLabels)
    model.showAtomCountsProperty.link(syncAtomCounts)
    model.runningProperty.link(syncPlayPause)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link(syncStatus)
    model.tipsProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.celebrateProperty.lazyLink(() => {
      sounds.celebrate()
      this.syncSlidersFromModel()
      this.particles.burst(this.stageCenterX, this.groupCenterY, {
        count: 26,
        color: '#16a34a',
        speed: 110,
        life: 0.6,
        radius: 3.4,
      })
    })

    syncStars()
    syncStatus()
    syncPlayPause()
    syncLabels()
    syncAtomCounts()
    syncEquation()
    this.redrawStage()
  }

  /** Rebuilds the per-molecule coefficient sliders \u2014 called on init, equation switch, and reset. */
  private rebuildMoleculeControls(): void {
    for (const node of this.moleculeSliderNodes) {
      this.panelContent.removeChild(node)
    }
    this.moleculeSliderNodes.length = 0
    this.sliderPropsById.clear()

    for (const mol of this.model.molecules) {
      const prop = new NumberProperty(this.model.getCoefficient(mol.id))
      prop.lazyLink((v) => this.model.setCoefficient(mol.id, v))
      this.sliderPropsById.set(mol.id, prop)
      const slider = new DepthSlider(prop, {
        min: MIN_COEFFICIENT,
        max: MAX_COEFFICIENT,
        width: this.panelContentW,
        label: mol.label,
        format: (n) => `${Math.round(n)}`,
        fill: mol.color,
        onTick: () => this.sounds.sliderTick(),
      })
      this.moleculeSliderNodes.push(slider)
      this.panelContent.addChild(slider)
    }
    this.relayoutPanel()
  }

  /** Pushes model coefficients (e.g. after Auto-balance) back into the slider widgets. */
  private syncSlidersFromModel(): void {
    for (const [id, prop] of this.sliderPropsById) {
      const value = this.model.getCoefficient(id)
      if (prop.value !== value) {
        prop.value = value
      }
    }
  }

  private atomsList(molecule: MoleculeSpec): readonly string[] {
    let list = this.atomsCache.get(molecule.id)
    if (!list) {
      const built: string[] = []
      for (const [el, n] of Object.entries(molecule.atoms)) {
        for (let i = 0; i < n; i++) built.push(el)
      }
      list = built
      this.atomsCache.set(molecule.id, list)
    }
    return list
  }

  private clusterOffsets(count: number): { x: number; y: number }[] {
    if (count <= 1) return [{ x: 0, y: 0 }]
    if (count === 2) return [{ x: -6, y: 0 }, { x: 6, y: 0 }]
    const r = 6 + count * 1.15
    const offsets: { x: number; y: number }[] = []
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2
      offsets.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
    }
    return offsets
  }

  /** Draws one molecule as a row of up to four little atom clusters, with a coefficient\u00d7formula label. */
  private drawMoleculeGroup(molecule: MoleculeSpec, coefficient: number, centerX: number, centerY: number): void {
    const showLabels = this.model.showLabelsProperty.value
    const running = this.model.runningProperty.value
    const animTime = this.model.animTimeProperty.value
    const offsets = this.clusterOffsets(this.atomsList(molecule).length)
    const clusterSpan = 38
    const copyGap = 8
    const visibleCopies = Math.max(1, Math.min(coefficient, 4))
    const totalW = visibleCopies * clusterSpan + (visibleCopies - 1) * copyGap
    let x = centerX - totalW / 2 + clusterSpan / 2

    for (let c = 0; c < visibleCopies; c++) {
      const cluster = new Node({ x, y: centerY })
      offsets.forEach((off, i) => {
        const jitter = running ? 1.6 : 0
        const seed = c * 7 + i * 3 + molecule.id.length
        const dx = Math.sin(animTime * 2.2 + seed) * jitter
        const dy = Math.cos(animTime * 2.6 + seed * 1.3) * jitter
        cluster.addChild(
          new Circle(6.4, {
            fill: molecule.color,
            stroke: 'rgba(15,23,42,0.55)',
            lineWidth: 1.1,
            x: off.x + dx,
            y: off.y + dy,
          }),
        )
      })
      this.stageLayer.addChild(cluster)
      x += clusterSpan + copyGap
    }

    if (showLabels) {
      const labelStr = coefficient > 1 ? `${coefficient} \u00d7 ${molecule.label}` : molecule.label
      this.stageLayer.addChild(
        new Text(labelStr, {
          font: new PhetFont({ size: 12, weight: 'bold' }),
          fill: ReactionsColors.ink,
          centerX,
          top: centerY + 26,
          maxWidth: 150,
        }),
      )
    }
  }

  private drawChip(text: string, cx: number, cy: number, balanced: boolean): void {
    const label = new Text(text, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: balanced ? '#052e19' : '#e2e8f0',
    })
    const w = label.width + 20
    const bg = new Rectangle(0, 0, w, 26, {
      cornerRadius: 13,
      fill: balanced ? '#4ade80' : 'rgba(15,23,42,0.55)',
      stroke: balanced ? '#16a34a' : 'rgba(148,163,184,0.4)',
      lineWidth: 1.5,
      centerX: cx,
      centerY: cy,
    })
    label.centerX = cx
    label.centerY = cy
    this.stageLayer.addChild(bg)
    this.stageLayer.addChild(label)
  }

  private drawPlus(cx: number, cy: number): void {
    this.stageLayer.addChild(
      new Text('+', {
        font: new PhetFont({ size: 20, weight: 'bold' }),
        fill: ReactionsColors.muted,
        centerX: cx,
        centerY: cy,
      }),
    )
  }

  /** Rebuilds the animated center-stage drawing for the current equation / coefficients. */
  private redrawStage(): void {
    this.stageLayer.removeAllChildren()
    const model = this.model
    const eq = model.equation
    const coeffs = model.getCoefficients()
    const balanced = model.balancedProperty.value

    this.equationTitleText.string = formatEquation(eq, coeffs)
    this.equationTitleText.fill = balanced ? '#16a34a' : ReactionsColors.ink
    this.equationTitleText.centerX = this.stageCenterX

    this.balancedBadgeText.string = balanced
      ? BalanceEquationsStrings.balancedLabelStringProperty.value
      : BalanceEquationsStrings.notBalancedLabelStringProperty.value
    this.balancedBadgeText.fill = balanced ? '#16a34a' : ReactionsColors.panelMuted
    this.balancedBadgeText.centerX = this.stageCenterX
    this.balancedBadgeText.top = this.equationTitleText.bottom + 2

    const reactants = eq.reactants
    const reactantCellW = (this.reactantsAreaRight - this.reactantsAreaLeft) / reactants.length
    reactants.forEach((mol, i) => {
      const cx = this.reactantsAreaLeft + reactantCellW * (i + 0.5)
      this.drawMoleculeGroup(mol, coeffs[mol.id] ?? 1, cx, this.groupCenterY)
      if (i < reactants.length - 1) {
        this.drawPlus(this.reactantsAreaLeft + reactantCellW * (i + 1), this.groupCenterY)
      }
    })

    this.stageLayer.addChild(
      new Text('\u2192', {
        font: new PhetFont({ size: 30, weight: 'bold' }),
        fill: balanced ? '#16a34a' : ReactionsColors.accent,
        centerX: this.stageCenterX,
        centerY: this.groupCenterY,
      }),
    )

    const products = eq.products
    const productCellW = (this.productsAreaRight - this.productsAreaLeft) / products.length
    products.forEach((mol, i) => {
      const cx = this.productsAreaLeft + productCellW * (i + 0.5)
      this.drawMoleculeGroup(mol, coeffs[mol.id] ?? 1, cx, this.groupCenterY)
      if (i < products.length - 1) {
        this.drawPlus(this.productsAreaLeft + productCellW * (i + 1), this.groupCenterY)
      }
    })

    if (model.showAtomCountsProperty.value) {
      const left = countAtoms(reactants, coeffs)
      const right = countAtoms(products, coeffs)
      this.drawChip(
        formatAtomCounts(left),
        (this.reactantsAreaLeft + this.reactantsAreaRight) / 2,
        this.chipsY,
        balanced,
      )
      this.drawChip(
        formatAtomCounts(right),
        (this.productsAreaLeft + this.productsAreaRight) / 2,
        this.chipsY,
        balanced,
      )
    }
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 5.2
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      BalanceEquationsStrings.quizQuestionStringProperty.value,
      [
        { label: BalanceEquationsStrings.quizCorrectStringProperty.value, correct: true },
        { label: BalanceEquationsStrings.quizWrongStringProperty.value, correct: false },
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
