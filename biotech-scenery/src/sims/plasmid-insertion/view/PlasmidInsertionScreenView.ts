import { EmptySelfOptions } from 'scenerystack/phet-core'
import { NumberProperty } from 'scenerystack/axon'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { PlasmidInsertionModel, PLASMID_STAGES } from '../model/PlasmidInsertionModel.js'
import { BiotechConstants, clamp } from '../../../shared/BiotechConstants.js'
import { BiotechColors } from '../../../shared/BiotechColors.js'
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
import { BiotechSounds } from '../../../shared/BiotechSounds.js'
import { PlasmidInsertionStrings } from '../PlasmidInsertionStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

/** Short readouts so the Process DepthSlider's value text never clips. */
const SHORT_STAGE_NAMES: readonly string[] = ['Cut', 'Insert', 'Join DNA', 'Transform', 'Replicate']

const STAGE_ACCENTS: readonly string[] = ['#ef4444', '#eab308', '#0d9488', '#22c55e', '#38bdf8']

type Triad = [string, string, string]

const STAGE_TRIADS: readonly Triad[] = [
  [
    'A restriction enzyme cuts the plasmid.',
    'It slices the circular DNA open at one specific site, leaving matching \u201csticky ends.\u201d',
    'Next: line up the target gene with the cut.',
  ],
  [
    'The target gene lines up with the gap.',
    'The same enzyme cut the gene from its source DNA, so its sticky ends match the plasmid\u2019s.',
    'Next: seal the gene into place.',
  ],
  [
    'DNA ligase joins the pieces.',
    'Ligase acts like glue, sealing the gene into the plasmid backbone to form recombinant DNA.',
    'Next: get this new plasmid into a living cell.',
  ],
  [
    'The plasmid enters a bacterium.',
    'Bacteria can take up plasmids from their surroundings \u2014 this step is called transformation.',
    'Next: let the bacterium multiply.',
  ],
  [
    'The bacterium copies itself.',
    'Every division copies the recombinant plasmid too, mass-producing the new gene in each cell.',
    'Press Next or Play to loop back, or try another scenario.',
  ],
]

export class PlasmidInsertionScreenView extends ScreenView {
  private readonly model: PlasmidInsertionModel
  private readonly sounds: BiotechSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private readonly stageNameText: Text
  private readonly stageLayer: Node
  private readonly scenarioButtons: SoftButton[] = []
  private readonly stageSliderProperty: NumberProperty
  private readonly labelsBtn: SoftButton
  private readonly enzymeBtn: SoftButton
  private readonly bacteriumBtn: SoftButton
  private readonly autoAdvanceBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly panelSoundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText
  private readonly cx: number
  private readonly cy: number
  private readonly ringR: number
  private readonly geneRestX: number
  private readonly geneRestY: number
  private readonly bx: number
  private readonly by: number
  private readonly stageCenterX: number
  private time = 0
  private tipTimer = 0

  public constructor(model: PlasmidInsertionModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new BiotechSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = BiotechConstants.SCREEN_VIEW_X_MARGIN
    const my = BiotechConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 280
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78
    this.stageCenterX = stageLeft + stageW / 2

    this.cx = stageLeft + stageW * 0.32
    this.cy = stageTop + stageH * 0.5
    this.ringR = Math.min(stageW, stageH) * 0.15
    this.geneRestX = stageLeft + stageW * 0.78
    this.geneRestY = stageTop + stageH * 0.2
    this.bx = stageLeft + stageW * 0.76
    this.by = stageTop + stageH * 0.68

    // ── Guidance banner ──────────────────────────────────────────────────────
    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: PlasmidInsertionStrings.guideTitleStringProperty.value,
      body: PlasmidInsertionStrings.guideExploreStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    // ── Left column: teaching triad + learn-more tip ─────────────────────────
    const leftCard = new DepthCard(leftW, stageH)
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.leftLearnTip = createPanelTip(PlasmidInsertionStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: BiotechColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(
      new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#a7d0d6', bottom: '#dfeef0' }),
    )

    this.stageNameText = new Text('', {
      font: new PhetFont({ size: 19, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.stageCenterX,
      top: stageTop + 10,
      pickable: false,
    })
    this.addChild(this.stageNameText)

    this.stageLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer)

    this.particles = new ParticleBurst(80)
    this.addChild(this.particles)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX
    this.tipCard.top = stageTop + 44
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(PlasmidInsertionStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: BiotechColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: BiotechColors.ink,
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
    const contentW = rightW - 42
    const halfW = (contentW - 8) / 2
    const btnH = 32
    const gridGap = 6

    // Scenario ----------------------------------------------------------------
    const scenarioHeader = controlSection(PlasmidInsertionStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    const scenarioDefs: { label: string; fill: string; scenario: 'explore' | 'insulin' | 'antibiotic' }[] = [
      { label: PlasmidInsertionStrings.scenarioExploreStringProperty.value, fill: BiotechColors.accent, scenario: 'explore' },
      { label: PlasmidInsertionStrings.scenarioInsulinStringProperty.value, fill: '#16a34a', scenario: 'insulin' },
      { label: PlasmidInsertionStrings.scenarioAntibioticStringProperty.value, fill: '#7c3aed', scenario: 'antibiotic' },
    ]
    scenarioDefs.forEach((def, i) => {
      const btn = new SoftButton(def.label, () => {
        model.setScenario(def.scenario)
      }, {
        width: contentW,
        height: btnH,
        fill: def.fill,
        selected: i === 0,
        fontSize: 12,
        onSound: () => sounds.scenario(),
      })
      this.scenarioButtons.push(btn)
      panelContent.addChild(btn)
    })

    // Process -------------------------------------------------------------------
    const processHeader = controlSection(PlasmidInsertionStrings.sectionProcessStringProperty.value, contentW)
    panelContent.addChild(processHeader)

    this.stageSliderProperty = new NumberProperty(model.stageProperty.value)
    const stageSlider = new DepthSlider(this.stageSliderProperty, {
      min: 0,
      max: PLASMID_STAGES.length - 1,
      width: contentW,
      label: PlasmidInsertionStrings.stageSliderStringProperty.value,
      format: (n) => SHORT_STAGE_NAMES[clamp(Math.round(n), 0, PLASMID_STAGES.length - 1)],
      fill: BiotechColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(stageSlider)

    const prevBtn = new SoftButton(PlasmidInsertionStrings.prevStageStringProperty.value, () => {
      model.stepStage(-1)
      sounds.softClick()
    }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11 })
    const nextBtn = new SoftButton(PlasmidInsertionStrings.nextStageStringProperty.value, () => {
      model.stepStage(1)
      sounds.softClick()
    }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11 })
    panelContent.addChild(prevBtn)
    panelContent.addChild(nextBtn)

    const processHint = controlHint(PlasmidInsertionStrings.processHintStringProperty.value, contentW)
    panelContent.addChild(processHint)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(PlasmidInsertionStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(PlasmidInsertionStrings.labelsOnStringProperty.value, () => {
      sounds.softClick()
      model.showLabelsProperty.value = !model.showLabelsProperty.value
    }, { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 11, selected: true })
    this.enzymeBtn = new SoftButton(PlasmidInsertionStrings.enzymeOnStringProperty.value, () => {
      sounds.softClick()
      model.showEnzymeProperty.value = !model.showEnzymeProperty.value
    }, { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 11, selected: true })
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.enzymeBtn)

    this.bacteriumBtn = new SoftButton(PlasmidInsertionStrings.bacteriumOnStringProperty.value, () => {
      sounds.softClick()
      model.showBacteriumProperty.value = !model.showBacteriumProperty.value
    }, { width: contentW, height: btnH, fill: '#16a34a', fontSize: 11, selected: true })
    panelContent.addChild(this.bacteriumBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(PlasmidInsertionStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    const simSpeedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: PlasmidInsertionStrings.simSpeedStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: BiotechColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(simSpeedSlider)

    this.autoAdvanceBtn = new SoftButton(PlasmidInsertionStrings.autoAdvanceOnStringProperty.value, () => {
      sounds.softClick()
      model.autoAdvanceProperty.value = !model.autoAdvanceProperty.value
    }, { width: contentW, height: btnH, fill: '#7c3aed', fontSize: 11, selected: true })
    panelContent.addChild(this.autoAdvanceBtn)

    this.playPauseBtn = new SoftButton(PlasmidInsertionStrings.playButtonStringProperty.value, () => {
      model.togglePlay()
      sounds.playPause(model.runningProperty.value)
    }, { width: halfW, height: 38, fill: BiotechColors.accent, fontSize: 12 })
    const stepBtn = new SoftButton(PlasmidInsertionStrings.stepButtonStringProperty.value, () => {
      model.stepOnce()
      sounds.softClick()
    }, { width: halfW, height: 38, fill: '#64748b', fontSize: 11 })
    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(stepBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(PlasmidInsertionStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.panelSoundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? PlasmidInsertionStrings.soundOnStringProperty.value
        : PlasmidInsertionStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.panelSoundBtn.setLabel(
          on ? PlasmidInsertionStrings.soundOnStringProperty.value : PlasmidInsertionStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.panelSoundBtn)

    // Status --------------------------------------------------------------------
    const statusHeader = controlSection(PlasmidInsertionStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: BiotechColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(PlasmidInsertionStrings.learnMoreStringProperty.value, {
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
      for (const btn of this.scenarioButtons) {
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6

      processHeader.left = 0
      processHeader.top = py
      py = processHeader.bottom + 6
      stageSlider.left = 0
      stageSlider.top = py
      py = stageSlider.bottom + 8
      prevBtn.left = 0
      prevBtn.top = py
      nextBtn.left = halfW + 8
      nextBtn.top = py
      py = prevBtn.bottom + 4
      processHint.left = 0
      processHint.top = py
      py = processHint.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.enzymeBtn.left = halfW + 8
      this.enzymeBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.bacteriumBtn.left = 0
      this.bacteriumBtn.top = py
      py = this.bacteriumBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      simSpeedSlider.left = 0
      simSpeedSlider.top = py
      py = simSpeedSlider.bottom + 8
      this.autoAdvanceBtn.left = 0
      this.autoAdvanceBtn.top = py
      py = this.autoAdvanceBtn.bottom + gridGap
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      stepBtn.left = halfW + 8
      stepBtn.top = py
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

    // ── Wiring ───────────────────────────────────────────────────────────────
    const syncStars = () => {
      this.starsText.string = `${PlasmidInsertionStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncStatus = () => {
      this.statusText.string = model.statusProperty.value
      relayoutPanel()
    }
    const syncScenario = () => {
      const s = model.scenarioProperty.value
      this.scenarioButtons[0].setSelected(s === 'explore')
      this.scenarioButtons[1].setSelected(s === 'insulin')
      this.scenarioButtons[2].setSelected(s === 'antibiotic')
      this.updateGuidance()
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? PlasmidInsertionStrings.pauseButtonStringProperty.value
          : PlasmidInsertionStrings.playButtonStringProperty.value,
      )
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? PlasmidInsertionStrings.labelsOnStringProperty.value
          : PlasmidInsertionStrings.labelsOffStringProperty.value,
      )
    }
    const syncEnzyme = () => {
      this.enzymeBtn.setSelected(model.showEnzymeProperty.value)
      this.enzymeBtn.setLabel(
        model.showEnzymeProperty.value
          ? PlasmidInsertionStrings.enzymeOnStringProperty.value
          : PlasmidInsertionStrings.enzymeOffStringProperty.value,
      )
    }
    const syncBacterium = () => {
      this.bacteriumBtn.setSelected(model.showBacteriumProperty.value)
      this.bacteriumBtn.setLabel(
        model.showBacteriumProperty.value
          ? PlasmidInsertionStrings.bacteriumOnStringProperty.value
          : PlasmidInsertionStrings.bacteriumOffStringProperty.value,
      )
    }
    const syncAutoAdvance = () => {
      this.autoAdvanceBtn.setSelected(model.autoAdvanceProperty.value)
      this.autoAdvanceBtn.setLabel(
        model.autoAdvanceProperty.value
          ? PlasmidInsertionStrings.autoAdvanceOnStringProperty.value
          : PlasmidInsertionStrings.autoAdvanceOffStringProperty.value,
      )
    }

    let sliderDrivenStage = model.stageProperty.value
    this.stageSliderProperty.lazyLink((v) => {
      const rounded = clamp(Math.round(v), 0, PLASMID_STAGES.length - 1)
      if (rounded !== sliderDrivenStage) {
        sliderDrivenStage = rounded
        model.setStage(rounded)
      }
    })

    model.stageProperty.link((stage, oldStage) => {
      sliderDrivenStage = stage
      if (this.stageSliderProperty.value !== stage) {
        this.stageSliderProperty.value = stage
      }
      this.stageNameText.string = `Step ${stage + 1}: ${PLASMID_STAGES[stage]}`
      this.stageNameText.centerX = this.stageCenterX
      this.updateGuidance()

      if (oldStage !== null && oldStage !== undefined) {
        sounds.hop()
        this.particles.burst(this.stageMarkerX(stage), this.stageMarkerY(stage), {
          count: 16,
          color: STAGE_ACCENTS[stage],
          speed: 80,
          life: 0.5,
          radius: 3,
        })
      }
    })

    model.scenarioProperty.link(syncScenario)
    model.showLabelsProperty.link(syncLabels)
    model.showEnzymeProperty.link(syncEnzyme)
    model.showBacteriumProperty.link(syncBacterium)
    model.autoAdvanceProperty.link(syncAutoAdvance)
    model.runningProperty.link(syncPlayPause)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link(syncStatus)
    model.tipsProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.cycleCountProperty.lazyLink(() => sounds.celebrate())

    syncStars()
    syncStatus()
    syncScenario()
    syncPlayPause()
    syncLabels()
    syncEnzyme()
    syncBacterium()
    syncAutoAdvance()
    this.stageNameText.string = `Step 1: ${PLASMID_STAGES[0]}`
    this.stageNameText.centerX = this.stageCenterX
    this.updateGuidance()
    this.redrawStage()
  }

  private stageMarkerX(stage: number): number {
    if (stage >= 3) return this.bx
    return this.cx
  }

  private stageMarkerY(stage: number): number {
    if (stage >= 3) return this.by
    return this.cy
  }

  private updateGuidance(): void {
    const model = this.model
    const stage = model.stageProperty.value
    const scenario = model.scenarioProperty.value

    const scenarioBody =
      scenario === 'insulin'
        ? PlasmidInsertionStrings.guideInsulinStringProperty.value
        : scenario === 'antibiotic'
          ? PlasmidInsertionStrings.guideAntibioticStringProperty.value
          : PlasmidInsertionStrings.guideExploreStringProperty.value

    this.guide.setGuidance(
      PlasmidInsertionStrings.guideTitleStringProperty.value,
      stage === 0 ? scenarioBody : PlasmidInsertionStrings.guideStageStringProperty.value,
    )

    const triad = STAGE_TRIADS[stage] ?? STAGE_TRIADS[0]
    this.teachingTriad.setTriad(triad[0], triad[1], triad[2], () => {
      this.leftLearnTip.top = this.teachingTriad.bottom + 16
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
      PlasmidInsertionStrings.quizQuestionStringProperty.value,
      [
        { label: PlasmidInsertionStrings.quizCorrectStringProperty.value, correct: true },
        { label: PlasmidInsertionStrings.quizWrongStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  /** Rebuild the animated center-stage drawing for the current stage / blend progress. */
  private redrawStage(): void {
    this.stageLayer.removeAllChildren()
    const model = this.model
    const stage = model.stageProperty.value
    const f = clamp(model.stageBlendProperty.value, 0, 1)
    const showLabels = model.showLabelsProperty.value
    const showEnzyme = model.showEnzymeProperty.value
    const showBacterium = model.showBacteriumProperty.value
    const { cx, cy, ringR, geneRestX, geneRestY, bx, by } = this

    const addLabel = (text: string, x: number, y: number, color = BiotechColors.ink) => {
      if (!showLabels) return
      this.stageLayer.addChild(
        new Text(text, {
          font: new PhetFont({ size: 11, weight: 'bold' }),
          fill: color,
          centerX: x,
          centerY: y,
          pickable: false,
        }),
      )
    }

    const addIcon = (x: number, y: number, letter: string, fill: string) => {
      const icon = new Node({ x, y })
      icon.addChild(new Circle(11, { fill, stroke: '#1f2937', lineWidth: 1.5 }))
      icon.addChild(
        new Text(letter, {
          font: new PhetFont({ size: 11, weight: 'bold' }),
          fill: '#0f172a',
          centerX: 0,
          centerY: 0,
        }),
      )
      this.stageLayer.addChild(icon)
    }

    // ── Bacterium (drawn first, behind the plasmid pieces) ───────────────────
    if (showBacterium) {
      this.stageLayer.addChild(
        new Path(Shape.ellipse(bx, by, ringR * 1.7, ringR * 1.05, 0), {
          fill: '#1abc9c',
          stroke: '#0e6655',
          lineWidth: 2.5,
          opacity: 0.92,
        }),
      )
      addLabel(PlasmidInsertionStrings.labelBacteriumStringProperty.value, bx, by + ringR * 1.05 + 14, '#0e6655')
    }

    // ── Plasmid ring: a gap opens while cutting (stage 0), stays open through
    //    insertion (stage 1), then seals from stage 2 onward. ──────────────────
    const gapAngle = stage === 0 ? f * 0.4 : stage === 1 ? 0.4 : 0
    const ringOpacity = stage >= 3 ? Math.max(0, 1 - f) : 1
    if (ringOpacity > 0.01) {
      const ringShape = new Shape()
      if (gapAngle > 0.001) {
        ringShape.arc(cx, cy, ringR, gapAngle, Math.PI * 2 - gapAngle, false)
      }
      else {
        ringShape.arc(cx, cy, ringR, 0, Math.PI * 2, false)
      }
      this.stageLayer.addChild(
        new Path(ringShape, { stroke: '#22c55e', lineWidth: 7, lineCap: 'round', opacity: ringOpacity }),
      )
      if (stage >= 2) {
        // Recombinant seam highlight — marks where the gene was sealed in.
        const seamShape = new Shape().arc(cx, cy, ringR, -0.35, 0.35, false)
        this.stageLayer.addChild(
          new Path(seamShape, { stroke: '#eab308', lineWidth: 9, lineCap: 'round', opacity: ringOpacity }),
        )
      }
      addLabel(
        stage >= 2
          ? PlasmidInsertionStrings.labelRecombinantStringProperty.value
          : PlasmidInsertionStrings.labelPlasmidStringProperty.value,
        cx,
        cy - ringR - 16,
        '#166534',
      )
    }

    // ── Restriction enzyme / ligase icon ─────────────────────────────────────
    if (showEnzyme) {
      if (stage === 0) {
        addIcon(cx + ringR, cy, 'E', '#f59e0b')
        addLabel(PlasmidInsertionStrings.labelEnzymeStringProperty.value, cx + ringR, cy - 22, '#92400e')
      }
      else if (stage === 2) {
        addIcon(cx + ringR * Math.cos(0), cy, 'L', '#fb923c')
        addLabel(PlasmidInsertionStrings.labelLigaseStringProperty.value, cx + ringR, cy - 22, '#9a3412')
      }
    }

    // ── Target gene: rests off to the side, slides into the gap, then travels
    //    with the plasmid into the bacterium and replicates. ─────────────────
    const insertX = cx + ringR * Math.cos(-0.2)
    const insertY = cy + ringR * Math.sin(-0.2)
    let geneX: number
    let geneY: number
    if (stage === 0) {
      geneX = geneRestX
      geneY = geneRestY
    }
    else if (stage === 1) {
      geneX = geneRestX + (insertX - geneRestX) * f
      geneY = geneRestY + (insertY - geneRestY) * f
    }
    else if (stage === 3) {
      geneX = insertX + (bx - insertX) * f
      geneY = insertY + (by - insertY) * f
    }
    else if (stage >= 4) {
      geneX = bx
      geneY = by
    }
    else {
      geneX = insertX
      geneY = insertY
    }

    if (stage < 4 || f < 0.999) {
      this.stageLayer.addChild(
        new Rectangle(-40, -8, 80, 16, {
          cornerRadius: 4,
          fill: '#facc15',
          stroke: '#a16207',
          lineWidth: 1.5,
          x: geneX,
          y: geneY,
        }),
      )
      addLabel(PlasmidInsertionStrings.labelGeneStringProperty.value, geneX, geneY - 16, '#854d0e')
    }

    // ── Transformation: a small recombinant marker rides along with the gene
    //    from the plasmid into the bacterium during stage 3. ─────────────────
    if (stage === 3) {
      this.stageLayer.addChild(
        new Circle(16, {
          stroke: '#22c55e',
          lineWidth: 3.5,
          x: geneX,
          y: geneY,
        }),
      )
    }

    // ── Replication: copies of the recombinant plasmid multiply inside the
    //    growing bacterial colony. ────────────────────────────────────────────
    if (stage === 4 && showBacterium) {
      const copies = 1 + Math.round(f * 2)
      for (let i = 0; i < copies; i++) {
        const angle = (i / 3) * Math.PI * 2 + this.time * 0.6
        const ox = bx + Math.cos(angle) * ringR * 0.9
        const oy = by + Math.sin(angle) * ringR * 0.55 - ringR * 0.55
        this.stageLayer.addChild(
          new Circle(11, { stroke: '#22c55e', lineWidth: 2.6, x: ox, y: oy }),
        )
        this.stageLayer.addChild(
          new Rectangle(-9, -3.5, 18, 7, { cornerRadius: 3, fill: '#facc15', x: ox, y: oy }),
        )
      }
      addLabel('Copies multiplying', bx, by - ringR * 1.5, '#166534')
    }
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
