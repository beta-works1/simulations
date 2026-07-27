import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { FermentationModel, FermentationScenario, tempBand } from '../model/FermentationModel.js'
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
import { HistoryChart } from '../../../shared/ui/HistoryChart.js'
import { BiotechSounds } from '../../../shared/BiotechSounds.js'
import { FermentationStrings } from '../FermentationStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type Bubble = { x: number; y: number; r: number; v: number }

type Bar = { fill: Rectangle; value: Text }

const SCENARIOS: readonly FermentationScenario[] = ['explore', 'bread', 'brewing', 'optimal']

const SCENARIO_FILL: Record<FermentationScenario, string> = {
  explore: BiotechColors.accent,
  bread: '#d97706',
  brewing: '#7c3aed',
  optimal: '#16a34a',
}

const SCENARIO_GUIDE: Record<FermentationScenario, string> = {
  explore: FermentationStrings.guideExploreStringProperty.value,
  bread: FermentationStrings.guideBreadStringProperty.value,
  brewing: FermentationStrings.guideBrewingStringProperty.value,
  optimal: FermentationStrings.guideOptimalStringProperty.value,
}

const SCENARIO_TRIAD: Record<FermentationScenario, [string, string, string]> = {
  explore: [
    'Exploring freely.',
    'Yeast ferment sugar into CO₂ and alcohol \u2014 temperature and yeast amount control how fast.',
    'Try the Bread, Brewing, or Optimal scenarios to see real recipes in action.',
  ],
  bread: [
    'Baking bread dough.',
    'A warm temperature plus extra yeast make CO₂ fast, inflating the dough with gas bubbles.',
    'Compare with Brewing to see how a cooler temperature changes the pace.',
  ],
  brewing: [
    'Brewing a beverage.',
    'A cooler, steady temperature ferments slowly, giving brewers more control over flavor.',
    'Try Optimal to find the temperature where fermentation runs fastest.',
  ],
  optimal: [
    'Finding the optimal temperature.',
    'Yeast enzymes work fastest in a specific temperature range \u2014 too hot and they denature.',
    'Watch the CO₂ bar climb quickly, then try Explore to test other temperatures yourself.',
  ],
}

/**
 * Dense ecology-style control surface for the yeast fermentation lab
 * (PTB Grade 8 Ch 6 parity — sugar + yeast → CO₂ + alcohol).
 */
export class FermentationScreenView extends ScreenView {
  private readonly model: FermentationModel
  private readonly sounds: BiotechSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  // Stage geometry
  private readonly flaskX: number
  private readonly flaskTop: number
  private readonly flaskBottom: number
  private readonly flaskBodyW: number
  private readonly flaskNeckW: number
  private readonly liquidRangeTop: number
  private readonly thX: number
  private readonly thTop: number
  private readonly thH: number
  private readonly thW: number
  private readonly bulbR: number
  private readonly barTopY: number
  private readonly barH: number
  private readonly barW: number

  // Stage nodes
  private readonly liquidPath: Path
  private readonly yeastLayer: Node
  private readonly bubbleLayer: Node
  private readonly labelsLayer: Node
  private readonly mercuryRect: Rectangle
  private readonly tempReadoutText: Text
  private readonly sugarBar: Bar
  private readonly co2Bar: Bar
  private readonly alcoholBar: Bar
  private bubbles: Bubble[] = []

  // Panel widgets
  private readonly bubblesBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText
  private readonly historyChart: HistoryChart
  private readonly sugarSeriesIdx: number
  private readonly co2SeriesIdx: number
  private readonly alcoholSeriesIdx: number

  public constructor(model: FermentationModel, providedOptions?: Options) {
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
    const stageCenterX = stageLeft + stageW / 2

    // ── Guidance banner ──────────────────────────────────────────────────────
    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: FermentationStrings.guideTitleStringProperty.value,
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

    const fact = createPanelTip(FermentationStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: BiotechColors.panelMuted,
    })
    fact.left = 12
    fact.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(fact)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#bfe0d8', bottom: '#e6f3ee' }))

    // Flask geometry
    const fx = stageLeft + stageW * 0.28
    const flaskTop = stageTop + stageH * 0.14
    const flaskBottom = stageTop + stageH * 0.86
    const neckTransitionY = stageTop + stageH * 0.36
    const neckW = Math.min(32, stageW * 0.045)
    const bodyW = Math.min(92, stageW * 0.16)
    this.flaskX = fx
    this.flaskTop = flaskTop
    this.flaskBottom = flaskBottom
    this.flaskBodyW = bodyW
    this.flaskNeckW = neckW
    this.liquidRangeTop = stageTop + stageH * 0.4

    const flaskShape = new Shape()
      .moveTo(fx - neckW, flaskTop)
      .lineTo(fx - neckW, neckTransitionY)
      .lineTo(fx - bodyW, flaskBottom)
      .lineTo(fx + bodyW, flaskBottom)
      .lineTo(fx + neckW, neckTransitionY)
      .lineTo(fx + neckW, flaskTop)

    this.liquidPath = new Path(null, { pickable: false })
    this.addChild(this.liquidPath)

    this.yeastLayer = new Node({ pickable: false })
    this.addChild(this.yeastLayer)

    this.addChild(new Path(flaskShape, { stroke: '#334155', lineWidth: 3, lineJoin: 'round', pickable: false }))
    this.addChild(
      new Rectangle(fx - neckW - 5, flaskTop - 7, neckW * 2 + 10, 9, {
        fill: '#94a3b8',
        stroke: '#334155',
        lineWidth: 1.5,
        cornerRadius: 3,
        pickable: false,
      }),
    )

    this.bubbleLayer = new Node({ pickable: false })
    this.addChild(this.bubbleLayer)

    this.labelsLayer = new Node({ pickable: false })

    const flaskLabel = new Text(FermentationStrings.flaskLabelStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#0f172a',
      centerX: fx,
      top: flaskBottom + 10,
    })
    this.labelsLayer.addChild(flaskLabel)

    // Thermometer (read-only visual reflecting the Conditions temperature slider)
    this.thX = stageLeft + stageW * 0.52
    this.thTop = stageTop + stageH * 0.22
    this.thH = stageH * 0.46
    this.thW = 14
    this.bulbR = 15
    this.addChild(
      new Rectangle(this.thX - this.thW / 2, this.thTop, this.thW, this.thH, {
        fill: 'rgba(255,255,255,0.22)',
        stroke: 'rgba(51,65,85,0.6)',
        lineWidth: 2,
        cornerRadius: 6,
      }),
    )
    this.mercuryRect = new Rectangle(this.thX - this.thW / 2 + 2, this.thTop + this.thH, this.thW - 4, 0, {
      fill: '#e74c3c',
      cornerRadius: 4,
    })
    this.addChild(this.mercuryRect)
    this.addChild(
      new Circle(this.bulbR, {
        fill: '#e74c3c',
        stroke: 'rgba(51,65,85,0.6)',
        lineWidth: 2,
        centerX: this.thX,
        centerY: this.thTop + this.thH + this.bulbR * 0.4,
      }),
    )
    this.tempReadoutText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.thX,
      top: this.thTop + this.thH + this.bulbR * 2 + 8,
    })
    this.addChild(this.tempReadoutText)
    const thermometerLabel = new Text(FermentationStrings.thermometerLabelStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.thX,
      bottom: this.thTop - 8,
    })
    this.labelsLayer.addChild(thermometerLabel)

    // Product bars — Sugar / CO2 / Alcohol
    this.barTopY = stageTop + stageH * 0.26
    this.barH = stageH * 0.48
    this.barW = 20
    const barsX = [stageLeft + stageW * 0.68, stageLeft + stageW * 0.79, stageLeft + stageW * 0.9]

    const makeBar = (x: number, color: string, label: string): Bar => {
      this.addChild(
        new Rectangle(x, this.barTopY, this.barW, this.barH, {
          cornerRadius: 6,
          fill: 'rgba(15,23,42,0.14)',
        }),
      )
      const fill = new Rectangle(x, this.barTopY + this.barH, this.barW, 0, {
        cornerRadius: 6,
        fill: color,
      })
      this.addChild(fill)
      const labelText = new Text(label, {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#0f172a',
        centerX: x + this.barW / 2,
        bottom: this.barTopY - 6,
        maxWidth: 64,
      })
      this.labelsLayer.addChild(labelText)
      const value = new Text('0', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: x + this.barW / 2,
        top: this.barTopY + this.barH + 6,
      })
      this.addChild(value)
      return { fill, value }
    }
    this.sugarBar = makeBar(barsX[0], BiotechColors.gene, FermentationStrings.sugarBarLabelStringProperty.value)
    this.co2Bar = makeBar(barsX[1], '#38bdf8', FermentationStrings.co2BarLabelStringProperty.value)
    this.alcoholBar = makeBar(barsX[2], '#f97316', FermentationStrings.alcoholBarLabelStringProperty.value)

    this.addChild(this.labelsLayer)

    this.particles = new ParticleBurst(60)
    this.addChild(this.particles)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = stageCenterX
    this.tipCard.top = stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(FermentationStrings.tipTitleStringProperty.value, {
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
    const scenarioHeader = controlSection(FermentationStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    const scenarioLabels: Record<FermentationScenario, string> = {
      explore: FermentationStrings.scenarioExploreStringProperty.value,
      bread: FermentationStrings.scenarioBreadStringProperty.value,
      brewing: FermentationStrings.scenarioBrewingStringProperty.value,
      optimal: FermentationStrings.scenarioOptimalStringProperty.value,
    }
    const scenarioButtons = {} as Record<FermentationScenario, SoftButton>
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
    // Conditions ----------------------------------------------------------------
    const conditionsHeader = controlSection(FermentationStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    const tempSlider = new DepthSlider(model.tempProperty, {
      min: 0.1,
      max: 1,
      width: contentW,
      label: FermentationStrings.tempSliderStringProperty.value,
      format: (n) => tempBand(n),
      fill: '#e74c3c',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(tempSlider)

    const yeastSlider = new DepthSlider(model.yeastProperty, {
      min: 5,
      max: 60,
      width: contentW,
      label: FermentationStrings.yeastSliderStringProperty.value,
      format: (n) => `${Math.round(n)}`,
      fill: '#be185d',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(yeastSlider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: FermentationStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: BiotechColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const addSugarBtn = new SoftButton(
      FermentationStrings.addSugarButtonStringProperty.value,
      () => {
        model.addSugar()
        sounds.softClick()
      },
      { width: contentW, height: btnH, fill: BiotechColors.gene, textFill: '#3f2d00', fontSize: 12 },
    )
    panelContent.addChild(addSugarBtn)

    const conditionsHint = controlHint(FermentationStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    // Display ---------------------------------------------------------------
    this.bubblesBtn = new SoftButton(
      FermentationStrings.bubblesOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showBubblesProperty.value = !model.showBubblesProperty.value
      },
      { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 11, selected: true },
    )
    this.labelsBtn = new SoftButton(
      FermentationStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    const displayHeader = controlSection(FermentationStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)
    panelContent.addChild(this.bubblesBtn)
    panelContent.addChild(this.labelsBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(FermentationStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      FermentationStrings.pauseButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: halfW, height: 38, fill: BiotechColors.accent, fontSize: 12 },
    )
    const resetBatchBtn = new SoftButton(
      FermentationStrings.resetBatchButtonStringProperty.value,
      () => {
        model.resetBatch()
        this.bubbles = []
        this.historyChart.clear()
        sounds.softClick()
      },
      { width: halfW, height: 38, fill: '#64748b', fontSize: 11 },
    )
    panelContent.addChild(this.playPauseBtn)
    panelContent.addChild(resetBatchBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(FermentationStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? FermentationStrings.soundOnStringProperty.value
        : FermentationStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? FermentationStrings.soundOnStringProperty.value : FermentationStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    // Status / history / quiz ---------------------------------------------------
    const statusHeader = controlSection(FermentationStrings.sectionStatusStringProperty.value, contentW)
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

    this.historyChart = new HistoryChart(contentW, 90, {
      title: FermentationStrings.historyTitleStringProperty.value,
      maxPoints: 40,
    })
    panelContent.addChild(this.historyChart)
    this.sugarSeriesIdx = this.historyChart.addSeries(BiotechColors.gene)
    this.co2SeriesIdx = this.historyChart.addSeries('#38bdf8')
    this.alcoholSeriesIdx = this.historyChart.addSeries('#f97316')

    const historyLegend = createPanelTip(FermentationStrings.historyLegendStringProperty.value, {
      width: contentW,
      fontSize: 10,
      fill: BiotechColors.panelMuted,
    })
    panelContent.addChild(historyLegend)

    const learnTip = createPanelTip(FermentationStrings.learnMoreStringProperty.value, {
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

      conditionsHeader.left = 0
      conditionsHeader.top = py
      py = conditionsHeader.bottom + 6
      tempSlider.left = 0
      tempSlider.top = py
      py = tempSlider.bottom + 8
      yeastSlider.left = 0
      yeastSlider.top = py
      py = yeastSlider.bottom + 8
      speedSlider.left = 0
      speedSlider.top = py
      py = speedSlider.bottom + 8
      addSugarBtn.left = 0
      addSugarBtn.top = py
      py = addSugarBtn.bottom + 4
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.bubblesBtn.left = 0
      this.bubblesBtn.top = py
      this.labelsBtn.left = halfW + 8
      this.labelsBtn.top = py
      py = this.bubblesBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      resetBatchBtn.left = halfW + 8
      resetBatchBtn.top = py
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
      this.historyChart.left = 0
      this.historyChart.top = py
      py = this.historyChart.bottom + 4
      historyLegend.left = 0
      historyLegend.top = py
      py = historyLegend.bottom + 10
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
          this.bubbles = []
          this.historyChart.clear()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    // ── Wiring ───────────────────────────────────────────────────────────────
    const syncStars = () => {
      this.starsText.string = `${FermentationStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? FermentationStrings.pauseButtonStringProperty.value
          : FermentationStrings.playButtonStringProperty.value,
      )
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) {
        scenarioButtons[s].setSelected(s === scenario)
      }
      this.guide.setGuidance(FermentationStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario])
    }
    const syncBubbles = () => {
      this.bubblesBtn.setSelected(model.showBubblesProperty.value)
      this.bubblesBtn.setLabel(
        model.showBubblesProperty.value
          ? FermentationStrings.bubblesOnStringProperty.value
          : FermentationStrings.bubblesOffStringProperty.value,
      )
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? FermentationStrings.labelsOnStringProperty.value
          : FermentationStrings.labelsOffStringProperty.value,
      )
      this.labelsLayer.visible = model.showLabelsProperty.value
    }

    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showBubblesProperty.link(syncBubbles)
    model.showLabelsProperty.link(syncLabels)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.historyPushProperty.lazyLink(() => {
      this.historyChart.push(this.sugarSeriesIdx, model.sugarProperty.value)
      this.historyChart.push(this.co2SeriesIdx, model.co2Property.value)
      this.historyChart.push(this.alcoholSeriesIdx, model.alcoholProperty.value)
    })
    model.starsProperty.lazyLink((stars, oldStars) => {
      if (oldStars !== undefined && stars > oldStars) sounds.celebrate()
    })

    syncStars()
    syncPlayPause()
    syncScenario()
    syncBubbles()
    syncLabels()
    this.updateLiquid()
    this.redrawYeast()
    this.updateThermometer()
    this.updateBars()
  }

  private liquidTopFor(sugar: number): number {
    const range = this.flaskBottom - this.liquidRangeTop
    const fillH = range * (0.35 + sugar / 200)
    return this.flaskBottom - fillH
  }

  private updateLiquid(): void {
    const sugar = this.model.sugarProperty.value
    const level = this.liquidTopFor(sugar)
    const fx = this.flaskX
    const bodyW = this.flaskBodyW
    const neckW = this.flaskNeckW
    const bottom = this.flaskBottom
    const shape = new Shape()
      .moveTo(fx - bodyW + 6, bottom - 2)
      .lineTo(fx + bodyW - 6, bottom - 2)
      .lineTo(fx + neckW - 3, level)
      .lineTo(fx - neckW + 3, level)
      .close()
    this.liquidPath.shape = shape
    this.liquidPath.fill = `rgba(241,196,15,${0.4 + sugar / 280})`
  }

  private redrawYeast(): void {
    this.yeastLayer.removeAllChildren()
    const model = this.model
    const level = this.liquidTopFor(model.sugarProperty.value)
    const count = Math.round(model.yeastProperty.value / 3)
    const bodyW = this.flaskBodyW
    const bottom = this.flaskBottom
    const span = Math.max(12, bottom - level - 14)
    for (let i = 0; i < count; i++) {
      const x = this.flaskX - bodyW * 0.55 + ((i * 37) % Math.round(bodyW * 1.1))
      const y = level + 12 + ((i * 19) % span)
      this.yeastLayer.addChild(new Circle(2.6, { fill: '#be185d', opacity: 0.85, centerX: x, centerY: y }))
    }
  }

  private spawnAndStepBubbles(dt: number): void {
    const model = this.model
    if (model.runningProperty.value && model.sugarProperty.value > 0.5) {
      const spawnChance = model.tempProperty.value * 0.45
      if (Math.random() < spawnChance) {
        this.bubbles.push({
          x: this.flaskX - 28 + Math.random() * 56,
          y: this.liquidTopFor(model.sugarProperty.value),
          r: 2 + Math.random() * 3.4,
          v: 20 + Math.random() * 34,
        })
      }
    }
    if (this.bubbles.length > 0) {
      const top = this.flaskTop
      this.bubbles = this.bubbles.filter((b) => {
        b.y -= b.v * dt
        return b.y > top
      })
    }
    this.bubbleLayer.removeAllChildren()
    if (model.showBubblesProperty.value) {
      for (const b of this.bubbles) {
        this.bubbleLayer.addChild(
          new Circle(b.r, { stroke: 'rgba(236,240,241,0.9)', lineWidth: 1.4, centerX: b.x, centerY: b.y }),
        )
      }
    }
  }

  private updateThermometer(): void {
    const temp = this.model.tempProperty.value
    const fillFrac = clamp((temp - 0.1) / 0.9, 0, 1)
    const mercuryH = this.thH * fillFrac
    this.mercuryRect.setRect(this.thX - this.thW / 2 + 2, this.thTop + this.thH - mercuryH, this.thW - 4, mercuryH)
    this.tempReadoutText.string = tempBand(temp)
    this.tempReadoutText.centerX = this.thX
  }

  private updateBars(): void {
    const model = this.model
    const setBar = (bar: Bar, value: number) => {
      const h = this.barH * clamp(value / 100, 0, 1)
      bar.fill.setRect(bar.fill.rectX, this.barTopY + this.barH - h, this.barW, h)
      bar.value.string = value.toFixed(0)
    }
    setBar(this.sugarBar, model.sugarProperty.value)
    setBar(this.co2Bar, model.co2Property.value)
    setBar(this.alcoholBar, model.alcoholProperty.value)
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      FermentationStrings.quizQuestionStringProperty.value,
      [
        { label: FermentationStrings.quizCorrectStringProperty.value, correct: true },
        { label: FermentationStrings.quizWrongStringProperty.value, correct: false },
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
    this.updateLiquid()
    this.redrawYeast()
    this.spawnAndStepBubbles(dt)
    this.updateThermometer()
    this.updateBars()

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
