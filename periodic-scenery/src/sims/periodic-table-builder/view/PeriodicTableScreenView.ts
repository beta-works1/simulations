import { EmptySelfOptions } from 'scenerystack/phet-core'
import { NumberProperty } from 'scenerystack/axon'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { PeriodicTableModel, Scenario, SCENARIO_CATEGORY } from '../model/PeriodicTableModel.js'
import { PeriodicConstants, clamp } from '../../../shared/PeriodicConstants.js'
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
import { CATEGORY_COLORS, CATEGORY_LABELS, ELEMENTS, ElementInfo, tableCell } from '../../../shared/elementsData.js'
import { PeriodicTableStrings } from '../PeriodicTableStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const NEUTRAL_TILE_FILL = '#475569'

type Tile = { node: Node; bg: Rectangle; z: number }
type QuickPick = { button: SoftButton; z: number }

export class PeriodicTableScreenView extends ScreenView {
  private readonly model: PeriodicTableModel
  private readonly sounds: PeriodicSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private readonly titleText: Text
  private readonly subtitleText: Text
  private readonly bohrLayer: Node
  private readonly tileMap = new Map<number, Tile>()
  private readonly quickPicks: QuickPick[] = []
  private readonly scenarioButtons: SoftButton[] = []
  private readonly elementSliderProperty: NumberProperty
  private readonly labelsBtn: SoftButton
  private readonly spinBtn: SoftButton
  private readonly colorsBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly panelSoundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText
  private readonly stageCenterX: number
  private readonly bohrCx: number
  private readonly bohrCy: number
  private readonly bohrMaxR: number
  private tipTimer = 0

  public constructor(model: PeriodicTableModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new PeriodicSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = PeriodicConstants.SCREEN_VIEW_X_MARGIN
    const my = PeriodicConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 280
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78
    this.stageCenterX = stageLeft + stageW / 2

    // ── Stage sub-layout: title strip, table (left), Bohr model (right), legend ──
    const titleTop = stageTop + 8
    const tableTop = titleTop + 46
    const legendH = 34
    const tableX0 = stageLeft + 12
    const tableAreaW = stageW * 0.5
    const tableAreaH = stageH - (tableTop - stageTop) - legendH - 14
    const cols = 8
    const rows = 3
    const cellW = tableAreaW / cols
    const cellH = tableAreaH / rows
    const tilePad = 3

    const bohrX0 = tableX0 + tableAreaW + 26
    const bohrAreaW = stageLeft + stageW - 12 - bohrX0
    this.bohrCx = bohrX0 + bohrAreaW / 2
    this.bohrCy = tableTop + tableAreaH / 2
    this.bohrMaxR = Math.min(bohrAreaW, tableAreaH) * 0.42

    // ── Guidance banner ──────────────────────────────────────────────────────
    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: PeriodicTableStrings.guideTitleStringProperty.value,
      body: PeriodicTableStrings.guideExploreStringProperty.value,
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

    this.leftLearnTip = createPanelTip(PeriodicTableStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: PeriodicColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    // ── Center stage ─────────────────────────────────────────────────────────
    this.addChild(
      new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#93c5cf', bottom: '#e5f1ee' }),
    )

    this.titleText = new Text('', {
      font: new PhetFont({ size: 20, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.stageCenterX,
      top: titleTop,
      pickable: false,
      maxWidth: stageW - 24,
    })
    this.addChild(this.titleText)

    this.subtitleText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#475569',
      centerX: this.stageCenterX,
      top: titleTop + 24,
      pickable: false,
      maxWidth: stageW - 24,
    })
    this.addChild(this.subtitleText)

    // ── Short-form periodic table (8 cols × 3 rows for the first 18) ─────────
    const tableLayer = new Node()
    for (const el of ELEMENTS) {
      const cell = tableCell(el.period, el.group)
      if (!cell) continue
      const x = tableX0 + cell.col * cellW + tilePad
      const y = tableTop + cell.row * cellH + tilePad
      const w = cellW - tilePad * 2
      const h = cellH - tilePad * 2

      const bg = new Rectangle(0, 0, w, h, { cornerRadius: 6 })
      const zText = new Text(String(el.z), {
        font: new PhetFont(8),
        fill: 'rgba(255,255,255,0.85)',
        left: 4,
        top: 2,
      })
      const symText = new Text(el.symbol, {
        font: new PhetFont({ size: Math.min(15, h * 0.34), weight: 'bold' }),
        fill: '#ffffff',
        centerX: w / 2,
        centerY: h / 2 + 4,
        maxWidth: w - 6,
      })
      const tileNode = new Node({ x, y, cursor: 'pointer', children: [bg, zText, symText] })
      tileNode.addInputListener({
        down: () => {
          sounds.select()
          model.setElement(el.z)
        },
      })
      tableLayer.addChild(tileNode)
      this.tileMap.set(el.z, { node: tileNode, bg, z: el.z })
    }
    this.addChild(tableLayer)

    // ── Category color legend ─────────────────────────────────────────────────
    const legendLayer = new Node({ pickable: false, left: tableX0, top: tableTop + tableAreaH + 10 })
    const legendEntries = Object.entries(CATEGORY_LABELS) as [keyof typeof CATEGORY_LABELS, string][]
    const legendColW = tableAreaW / 4
    legendEntries.forEach(([cat, label], i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const chip = new Node({ x: col * legendColW, y: row * 16 })
      chip.addChild(new Circle(4, { fill: CATEGORY_COLORS[cat], x: 4, y: 6 }))
      chip.addChild(
        new Text(label, {
          font: new PhetFont(8),
          fill: '#334155',
          left: 12,
          centerY: 6,
          maxWidth: legendColW - 14,
        }),
      )
      legendLayer.addChild(chip)
    })
    this.addChild(legendLayer)

    // ── Bohr model ───────────────────────────────────────────────────────────
    this.bohrLayer = new Node({ pickable: false })
    this.addChild(this.bohrLayer)

    this.particles = new ParticleBurst(80)
    this.addChild(this.particles)

    // ── Timed tip card ───────────────────────────────────────────────────────
    this.tipCard = new DepthCard(252, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX
    this.tipCard.top = tableTop + 4
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(PeriodicTableStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: PeriodicColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: PeriodicColors.ink,
      lineWrap: 224,
      leading: 3,
      left: 14,
      top: 30,
      maxWidth: 224,
    })
    this.tipCard.content.addChild(this.tipBodyText)
    this.addChild(this.tipCard)

    // ── Mini quiz overlay ────────────────────────────────────────────────────
    this.miniQuiz = new MiniQuiz(260)
    this.miniQuiz.centerX = this.stageCenterX
    this.miniQuiz.centerY = tableTop + tableAreaH * 0.5
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

    // Tour ----------------------------------------------------------------------
    const tourHeader = controlSection(PeriodicTableStrings.sectionTourStringProperty.value, contentW)
    panelContent.addChild(tourHeader)

    const scenarioDefs: { label: string; fill: string; scenario: Scenario }[] = [
      { label: PeriodicTableStrings.scenarioExploreStringProperty.value, fill: PeriodicColors.accent, scenario: 'explore' },
      { label: PeriodicTableStrings.scenarioAlkaliStringProperty.value, fill: '#e74c3c', scenario: 'alkali' },
      { label: PeriodicTableStrings.scenarioNobleStringProperty.value, fill: '#9b59b6', scenario: 'noble' },
      { label: PeriodicTableStrings.scenarioHalogenStringProperty.value, fill: '#27ae60', scenario: 'halogen' },
    ]
    scenarioDefs.forEach((def, i) => {
      const btn = new SoftButton(def.label, () => {
        model.setScenario(def.scenario)
      }, {
        width: halfW,
        height: btnH,
        fill: def.fill,
        selected: i === 0,
        fontSize: 11,
        onSound: () => sounds.scenario(),
      })
      this.scenarioButtons.push(btn)
      panelContent.addChild(btn)
    })

    // Element ---------------------------------------------------------------------
    const elementHeader = controlSection(PeriodicTableStrings.sectionElementStringProperty.value, contentW)
    panelContent.addChild(elementHeader)

    this.elementSliderProperty = new NumberProperty(model.selectedZProperty.value)
    const elementSlider = new DepthSlider(this.elementSliderProperty, {
      min: 1,
      max: 18,
      width: contentW,
      label: PeriodicTableStrings.elementSliderStringProperty.value,
      format: (n) => {
        const el = ELEMENTS[clamp(Math.round(n), 1, 18) - 1]
        return `${el.symbol} (${el.z})`
      },
      fill: PeriodicColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(elementSlider)

    const elementNameText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: PeriodicColors.panelText,
      maxWidth: contentW,
    })
    panelContent.addChild(elementNameText)

    const prevBtn = new SoftButton(PeriodicTableStrings.prevElementStringProperty.value, () => {
      model.stepElement(-1)
      sounds.softClick()
    }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11 })
    const nextBtn = new SoftButton(PeriodicTableStrings.nextElementStringProperty.value, () => {
      model.stepElement(1)
      sounds.softClick()
    }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11 })
    panelContent.addChild(prevBtn)
    panelContent.addChild(nextBtn)

    const elementHint = controlHint(PeriodicTableStrings.elementHintStringProperty.value, contentW)
    panelContent.addChild(elementHint)

    // Quick picks -------------------------------------------------------------------
    const quickHeader = controlSection(PeriodicTableStrings.sectionQuickPicksStringProperty.value, contentW)
    panelContent.addChild(quickHeader)

    const period1 = ELEMENTS.filter((e) => e.period === 1)
    const period2 = ELEMENTS.filter((e) => e.period === 2)
    const period3 = ELEMENTS.filter((e) => e.period === 3)

    const makeQuickRow = (elements: readonly ElementInfo[]): SoftButton[] => {
      const n = elements.length
      const rowGap = 4
      const w = (contentW - (n - 1) * rowGap) / n
      return elements.map((el) => {
        const btn = new SoftButton(el.symbol, () => {
          sounds.select()
          model.setElement(el.z)
        }, { width: w, height: 26, fill: CATEGORY_COLORS[el.category], fontSize: 10 })
        this.quickPicks.push({ button: btn, z: el.z })
        panelContent.addChild(btn)
        return btn
      })
    }
    const period1Row = makeQuickRow(period1)
    const period2Row = makeQuickRow(period2)
    const period3Row = makeQuickRow(period3)

    // Display ---------------------------------------------------------------
    const displayHeader = controlSection(PeriodicTableStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(PeriodicTableStrings.labelsOnStringProperty.value, () => {
      sounds.softClick()
      model.showLabelsProperty.value = !model.showLabelsProperty.value
    }, { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 11, selected: true })
    this.spinBtn = new SoftButton(PeriodicTableStrings.spinOnStringProperty.value, () => {
      sounds.softClick()
      model.spinElectronsProperty.value = !model.spinElectronsProperty.value
    }, { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 11, selected: true })
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.spinBtn)

    this.colorsBtn = new SoftButton(PeriodicTableStrings.colorsOnStringProperty.value, () => {
      sounds.softClick()
      model.showCategoryColorsProperty.value = !model.showCategoryColorsProperty.value
    }, { width: contentW, height: btnH, fill: '#16a34a', fontSize: 11, selected: true })
    panelContent.addChild(this.colorsBtn)

    // Playback ----------------------------------------------------------------
    const playbackHeader = controlSection(PeriodicTableStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    const simSpeedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: PeriodicTableStrings.simSpeedStringProperty.value,
      format: (n) => `${n.toFixed(2)}\u00d7`,
      fill: PeriodicColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(simSpeedSlider)

    this.playPauseBtn = new SoftButton(PeriodicTableStrings.playButtonStringProperty.value, () => {
      model.togglePlay()
      sounds.playPause(model.runningProperty.value)
    }, { width: contentW, height: 38, fill: PeriodicColors.accent, fontSize: 12 })
    panelContent.addChild(this.playPauseBtn)

    // Sound -------------------------------------------------------------------
    const soundHeader = controlSection(PeriodicTableStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.panelSoundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? PeriodicTableStrings.soundOnStringProperty.value
        : PeriodicTableStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.panelSoundBtn.setLabel(
          on ? PeriodicTableStrings.soundOnStringProperty.value : PeriodicTableStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.panelSoundBtn)

    // Status --------------------------------------------------------------------
    const statusHeader = controlSection(PeriodicTableStrings.sectionStatusStringProperty.value, contentW)
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

    const learnTip = createPanelTip(PeriodicTableStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 11,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      tourHeader.left = 0
      tourHeader.top = py
      py = tourHeader.bottom + 6
      this.scenarioButtons[0].left = 0
      this.scenarioButtons[0].top = py
      this.scenarioButtons[1].left = halfW + 8
      this.scenarioButtons[1].top = py
      py = this.scenarioButtons[0].bottom + gridGap
      this.scenarioButtons[2].left = 0
      this.scenarioButtons[2].top = py
      this.scenarioButtons[3].left = halfW + 8
      this.scenarioButtons[3].top = py
      py = this.scenarioButtons[2].bottom + 12

      elementHeader.left = 0
      elementHeader.top = py
      py = elementHeader.bottom + 6
      elementSlider.left = 0
      elementSlider.top = py
      py = elementSlider.bottom + 6
      elementNameText.left = 0
      elementNameText.top = py
      py = elementNameText.bottom + 8
      prevBtn.left = 0
      prevBtn.top = py
      nextBtn.left = halfW + 8
      nextBtn.top = py
      py = prevBtn.bottom + 4
      elementHint.left = 0
      elementHint.top = py
      py = elementHint.bottom + 12

      quickHeader.left = 0
      quickHeader.top = py
      py = quickHeader.bottom + 6
      period1Row.forEach((btn, i) => {
        btn.left = i === 0 ? 0 : halfW + 8
        btn.top = py
      })
      py = period1Row[0].bottom + gridGap
      let rowX = 0
      period2Row.forEach((btn) => {
        btn.left = rowX
        btn.top = py
        rowX = btn.right + 4
      })
      py = period2Row[0].bottom + gridGap
      rowX = 0
      period3Row.forEach((btn) => {
        btn.left = rowX
        btn.top = py
        rowX = btn.right + 4
      })
      py = period3Row[0].bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.spinBtn.left = halfW + 8
      this.spinBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.colorsBtn.left = 0
      this.colorsBtn.top = py
      py = this.colorsBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      simSpeedSlider.left = 0
      simSpeedSlider.top = py
      py = simSpeedSlider.bottom + 8
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
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
      this.starsText.string = `${PeriodicTableStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncStatus = () => {
      this.statusText.string = model.statusProperty.value
      relayoutPanel()
    }
    const syncScenario = () => {
      const s = model.scenarioProperty.value
      this.scenarioButtons[0].setSelected(s === 'explore')
      this.scenarioButtons[1].setSelected(s === 'alkali')
      this.scenarioButtons[2].setSelected(s === 'noble')
      this.scenarioButtons[3].setSelected(s === 'halogen')
      this.syncTable()
      this.updateGuidance()
    }
    const syncPlayPause = () => {
      this.playPauseBtn.setLabel(
        model.runningProperty.value
          ? PeriodicTableStrings.pauseButtonStringProperty.value
          : PeriodicTableStrings.playButtonStringProperty.value,
      )
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? PeriodicTableStrings.labelsOnStringProperty.value
          : PeriodicTableStrings.labelsOffStringProperty.value,
      )
    }
    const syncSpin = () => {
      this.spinBtn.setSelected(model.spinElectronsProperty.value)
      this.spinBtn.setLabel(
        model.spinElectronsProperty.value
          ? PeriodicTableStrings.spinOnStringProperty.value
          : PeriodicTableStrings.spinOffStringProperty.value,
      )
    }
    const syncColors = () => {
      this.colorsBtn.setSelected(model.showCategoryColorsProperty.value)
      this.colorsBtn.setLabel(
        model.showCategoryColorsProperty.value
          ? PeriodicTableStrings.colorsOnStringProperty.value
          : PeriodicTableStrings.colorsOffStringProperty.value,
      )
      this.syncTable()
    }
    const syncElement = () => {
      const el = model.currentElement
      this.titleText.string = `${el.name} (${el.symbol})`
      this.titleText.centerX = this.stageCenterX
      this.subtitleText.string = `${CATEGORY_LABELS[el.category]} \u2022 Electron config: ${el.electronConfig}`
      this.subtitleText.centerX = this.stageCenterX
      elementNameText.string = `${el.name} \u2014 ${CATEGORY_LABELS[el.category]}`
      this.syncTable()
      this.updateGuidance()
      relayoutPanel()
    }

    let sliderDrivenZ = model.selectedZProperty.value
    this.elementSliderProperty.lazyLink((v) => {
      const rounded = clamp(Math.round(v), 1, 18)
      if (rounded !== sliderDrivenZ) {
        sliderDrivenZ = rounded
        model.setElement(rounded)
      }
    })

    model.selectedZProperty.link((z, oldZ) => {
      sliderDrivenZ = clamp(Math.round(z), 1, 18)
      if (this.elementSliderProperty.value !== z) {
        this.elementSliderProperty.value = z
      }
      syncElement()
      if (oldZ !== null && oldZ !== undefined) {
        sounds.hop()
        this.particles.burst(this.bohrCx, this.bohrCy, {
          count: 16,
          color: CATEGORY_COLORS[model.currentElement.category],
          speed: 90,
          life: 0.5,
          radius: 3,
        })
      }
    })

    model.scenarioProperty.link(syncScenario)
    model.showLabelsProperty.link(syncLabels)
    model.spinElectronsProperty.link(syncSpin)
    model.showCategoryColorsProperty.link(syncColors)
    model.runningProperty.link(syncPlayPause)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link(syncStatus)
    model.tipsProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())

    syncStars()
    syncStatus()
    syncScenario()
    syncPlayPause()
    syncLabels()
    syncSpin()
    syncColors()
    syncElement()
    this.redrawBohr()
  }

  private syncTable(): void {
    const model = this.model
    const scenario = model.scenarioProperty.value
    const selectedZ = model.selectedZProperty.value
    for (const [z, tile] of this.tileMap) {
      const el = ELEMENTS[z - 1]
      const isSelected = z === selectedZ
      const isTourMember = scenario !== 'explore' && el.category === SCENARIO_CATEGORY[scenario]
      tile.bg.fill = model.showCategoryColorsProperty.value ? CATEGORY_COLORS[el.category] : NEUTRAL_TILE_FILL
      tile.bg.stroke = isSelected ? '#f8fafc' : isTourMember ? PeriodicColors.accent : 'rgba(255,255,255,0.28)'
      tile.bg.lineWidth = isSelected ? 3 : isTourMember ? 2.5 : 1.2
    }
    for (const pick of this.quickPicks) {
      pick.button.setSelected(pick.z === selectedZ)
    }
  }

  private updateGuidance(): void {
    const model = this.model

    this.guide.setGuidance(PeriodicTableStrings.guideTitleStringProperty.value, model.guidanceBody)

    const [now, why, next] = model.triad
    this.teachingTriad.setTriad(now, why, next, () => {
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
      PeriodicTableStrings.quizQuestionStringProperty.value,
      [
        { label: PeriodicTableStrings.quizCorrectStringProperty.value, correct: true },
        { label: PeriodicTableStrings.quizWrongStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  /** Rebuild the Bohr-model drawing for the currently selected element. */
  private redrawBohr(): void {
    this.bohrLayer.removeAllChildren()
    const model = this.model
    const el = model.currentElement
    const showLabels = model.showLabelsProperty.value
    const spinning = model.spinElectronsProperty.value
    const { bohrCx, bohrCy, bohrMaxR } = this

    const nucleusR = bohrMaxR * 0.15
    this.bohrLayer.addChild(
      new Circle(nucleusR, {
        fill: '#dc2626',
        stroke: '#7f1d1d',
        lineWidth: 2,
        x: bohrCx,
        y: bohrCy,
      }),
    )
    this.bohrLayer.addChild(
      new Text(`${el.z}+`, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#fff',
        centerX: bohrCx,
        centerY: bohrCy,
        pickable: false,
      }),
    )
    if (showLabels) {
      this.bohrLayer.addChild(
        new Text(PeriodicTableStrings.labelNucleusStringProperty.value, {
          font: new PhetFont({ size: 10, weight: 'bold' }),
          fill: '#b91c1c',
          centerX: bohrCx,
          top: bohrCy + nucleusR + 4,
          pickable: false,
        }),
      )
    }

    el.shells.forEach((count, shellIdx) => {
      const r = bohrMaxR * (0.34 + shellIdx * 0.24)
      this.bohrLayer.addChild(
        new Circle(r, {
          stroke: 'rgba(15,23,42,0.32)',
          lineWidth: 1.5,
          lineDash: [4, 4],
          x: bohrCx,
          y: bohrCy,
          pickable: false,
        }),
      )
      if (showLabels) {
        this.bohrLayer.addChild(
          new Text(`${PeriodicTableStrings.labelShellStringProperty.value} ${shellIdx + 1}: ${count}e\u207B`, {
            font: new PhetFont(9),
            fill: '#334155',
            centerX: bohrCx,
            top: bohrCy - r - 13,
            pickable: false,
          }),
        )
      }
      for (let i = 0; i < count; i++) {
        const base = (i / count) * Math.PI * 2
        const angle = spinning
          ? base + model.spinTime * (1.1 - shellIdx * 0.18) * (shellIdx % 2 === 0 ? 1 : -1)
          : base
        const ex = bohrCx + Math.cos(angle) * r
        const ey = bohrCy + Math.sin(angle) * r
        this.bohrLayer.addChild(
          new Circle(Math.max(4, bohrMaxR * 0.045), {
            fill: '#38bdf8',
            stroke: '#0369a1',
            lineWidth: 1,
            x: ex,
            y: ey,
            pickable: false,
          }),
        )
      }
    })
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

    this.redrawBohr()
  }
}
