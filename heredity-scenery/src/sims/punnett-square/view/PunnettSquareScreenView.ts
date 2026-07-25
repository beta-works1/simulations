import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import {
  PunnettSquareModel,
  TRAITS,
  TraitId,
  Genotype,
  genotypeToAlleles,
  phenotypeColor,
  phenotypeLabel,
} from '../model/PunnettSquareModel.js'
import { HeredityConstants, clamp, smoothstep } from '../../../shared/HeredityConstants.js'
import { HeredityColors } from '../../../shared/HeredityColors.js'
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
import { HereditySounds } from '../../../shared/HereditySounds.js'
import { PunnettSquareStrings } from '../PunnettSquareStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type Pt = { x: number; y: number }

export class PunnettSquareScreenView extends ScreenView {
  private readonly model: PunnettSquareModel
  private readonly sounds: HereditySounds
  private readonly particles: ParticleBurst
  private readonly soundBtn: SoftButton
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly historyChart: HistoryChart
  private readonly historySeriesIndex: number
  private readonly miniQuiz: MiniQuiz
  private readonly cellGroups: Node[] = []
  private readonly cellIcons: Circle[] = []
  private readonly cellGenotypeTexts: Text[] = []
  private readonly cellCenters: Pt[] = []
  private readonly motherAxisNodes: Node[] = []
  private readonly fatherAxisNodes: Node[] = []
  private readonly motherAxisTexts: Text[] = []
  private readonly fatherAxisTexts: Text[] = []
  private readonly probsText: RichText
  private readonly starsText: Text
  private readonly statusText: Text
  private readonly generationText: Text
  private readonly traitButtons: SoftButton[] = []
  private readonly motherButtons: SoftButton[] = []
  private readonly fatherButtons: SoftButton[] = []
  private readonly cellFractionTexts: Text[] = []
  private readonly cellHighlightRects: Rectangle[] = []
  private readonly trialCountText: Text

  public constructor(model: PunnettSquareModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new HereditySounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = HeredityConstants.SCREEN_VIEW_X_MARGIN
    const my = HeredityConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 280
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: PunnettSquareStrings.guideTitleStringProperty.value,
      body: PunnettSquareStrings.guideIdleStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    // ── Left column: teaching triad + cross-history chart ────────────────────
    const leftCard = new DepthCard(leftW, stageH)
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.historyChart = new HistoryChart(leftW - 24, 88, {
      title: PunnettSquareStrings.historyChartTitleStringProperty.value,
      maxPoints: 20,
    })
    this.historyChart.left = 12
    this.historyChart.top = 306
    leftCard.content.addChild(this.historyChart)
    this.historySeriesIndex = this.historyChart.addSeries(HeredityColors.accent)

    const historyLegend = createPanelTip(PunnettSquareStrings.historyChartLegendStringProperty.value, {
      width: leftW - 24,
      fontSize: 10,
      fill: HeredityColors.panelMuted,
    })
    historyLegend.left = 12
    historyLegend.top = this.historyChart.bottom + 6
    leftCard.content.addChild(historyLegend)

    this.addChild(
      new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#b8d4e8', bottom: '#dce7f0' }),
    )

    // ── Punnett square geometry ────────────────────────────────────────────
    const axisGap = 46
    const topLabelGap = 22
    const bottomGap = 78
    const gridMaxW = stageW - axisGap - 20
    const gridMaxH = stageH - axisGap - topLabelGap - bottomGap
    const gridSize = Math.min(gridMaxW, gridMaxH, 250)
    const gridLeft = stageLeft + axisGap + Math.max(0, (gridMaxW - gridSize) / 2)
    const gridTop = stageTop + axisGap + topLabelGap + Math.max(0, (gridMaxH - gridSize) / 2)
    const cellSize = gridSize / 2
    const axisR = 15
    const axisY = gridTop - 27
    const axisX = gridLeft - 27
    const colX = [gridLeft + cellSize * 0.5, gridLeft + cellSize * 1.5]
    const rowY = [gridTop + cellSize * 0.5, gridTop + cellSize * 1.5]

    // Father label (above columns)
    this.addChild(
      new Text('Father\u2019s alleles', {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: HeredityColors.father,
        centerX: gridLeft + gridSize / 2,
        bottom: axisY - 20,
        pickable: false,
      }),
    )
    // Mother label (left of rows), rotated
    const motherLabel = new Text('Mother\u2019s alleles', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: HeredityColors.mother,
      pickable: false,
      rotation: -Math.PI / 2,
    })
    motherLabel.centerX = axisX - 20
    motherLabel.centerY = gridTop + gridSize / 2
    this.addChild(motherLabel)

    // Corner symbol
    this.addChild(
      new Text(PunnettSquareStrings.cornerLabelStringProperty.value, {
        font: new PhetFont({ size: 13, weight: 'bold' }),
        fill: HeredityColors.muted,
        centerX: axisX,
        centerY: axisY,
        pickable: false,
      }),
    )

    // Cell backgrounds + outer border
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        this.addChild(
          new Rectangle(gridLeft + c * cellSize, gridTop + r * cellSize, cellSize, cellSize, {
            fill: 'rgba(255,255,255,0.88)',
            stroke: 'rgba(124,160,190,0.35)',
            lineWidth: 1,
            pickable: false,
          }),
        )
        const center = { x: gridLeft + c * cellSize + cellSize / 2, y: gridTop + r * cellSize + cellSize / 2 }
        this.cellCenters.push(center)

        const group = new Node({ x: center.x, y: center.y, pickable: false })
        const icon = new Circle(cellSize * 0.2, {
          fill: '#ccc',
          stroke: '#fff',
          lineWidth: 2,
          centerX: 0,
          centerY: -cellSize * 0.16,
        })
        const genotypeText = new Text('', {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: HeredityColors.ink,
          centerX: 0,
          top: cellSize * 0.06,
        })
        const fractionText = new Text('', {
          font: new PhetFont({ size: 11, weight: 'bold' }),
          fill: HeredityColors.muted,
          centerX: 0,
          top: cellSize * 0.28,
          visible: false,
        })
        const highlightRect = new Rectangle(-cellSize * 0.42, -cellSize * 0.42, cellSize * 0.84, cellSize * 0.84, {
          cornerRadius: 8,
          fill: 'rgba(13,148,136,0.18)',
          stroke: HeredityColors.accent,
          lineWidth: 2,
          visible: false,
          pickable: false,
        })
        group.addChild(highlightRect)
        group.addChild(icon)
        group.addChild(genotypeText)
        group.addChild(fractionText)
        group.opacity = 0
        group.setScaleMagnitude(0.5)
        this.addChild(group)
        this.cellGroups.push(group)
        this.cellIcons.push(icon)
        this.cellGenotypeTexts.push(genotypeText)
        this.cellFractionTexts.push(fractionText)
        this.cellHighlightRects.push(highlightRect)
      }
    }
    this.addChild(
      new Rectangle(gridLeft, gridTop, gridSize, gridSize, {
        fill: null,
        stroke: HeredityColors.ink,
        lineWidth: 3,
        cornerRadius: 3,
        pickable: false,
      }),
    )

    // Clickable axis alleles (father = columns, mother = rows)
    const makeAxisNode = (x: number, y: number, accent: string, onPress: () => void): { node: Node; text: Text } => {
      const node = new Node({ x, y, cursor: 'pointer' })
      const halo = new Circle(axisR + 8, { fill: `${accent}22`, visible: false })
      const bg = new Circle(axisR, { fill: `${accent}33`, stroke: accent, lineWidth: 2.5 })
      const text = new Text('A', {
        font: new PhetFont({ size: 15, weight: 'bold' }),
        fill: accent,
        centerX: 0,
        centerY: 0,
      })
      node.addChild(halo)
      node.addChild(bg)
      node.addChild(text)
      node.addInputListener({
        down: () => {
          sounds.softClick()
          onPress()
        },
        enter: () => {
          halo.visible = true
        },
        exit: () => {
          halo.visible = false
        },
      })
      this.addChild(node)
      return { node, text }
    }

    for (let c = 0; c < 2; c++) {
      const { node, text } = makeAxisNode(colX[c], axisY, HeredityColors.father, () => model.toggleFatherAllele(c as 0 | 1))
      this.fatherAxisNodes.push(node)
      this.fatherAxisTexts.push(text)
    }
    for (let r = 0; r < 2; r++) {
      const { node, text } = makeAxisNode(axisX, rowY[r], HeredityColors.mother, () => model.toggleMotherAllele(r as 0 | 1))
      this.motherAxisNodes.push(node)
      this.motherAxisTexts.push(text)
    }

    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    this.probsText = new RichText('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: HeredityColors.ink,
      align: 'center',
      centerX: gridLeft + gridSize / 2,
      top: gridTop + gridSize + 16,
      lineWrap: gridSize + 60,
      leading: 4,
      pickable: false,
    })
    this.addChild(this.probsText)

    // ── Mini quiz overlay (hidden until triggered) ────────────────────────────
    this.miniQuiz = new MiniQuiz(240)
    this.miniQuiz.centerX = stageLeft + stageW / 2
    this.miniQuiz.centerY = stageTop + stageH * 0.46
    this.addChild(this.miniQuiz)

    // ── Right dense control panel ─────────────────────────────────────────────
    const card = new DepthCard(rightW, stageH, { title: PunnettSquareStrings.controlsTitleStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 32
    const halfW = (contentW - 8) / 2
    const thirdW = (contentW - 16) / 3
    const gridGap = 6
    const btnH = 32

    const traitHeader = controlSection(PunnettSquareStrings.sectionTraitStringProperty.value, contentW)
    panelContent.addChild(traitHeader)

    const traitDefs: { id: TraitId; label: string }[] = [
      { id: 'seedColor', label: PunnettSquareStrings.traitSeedColorStringProperty.value },
      { id: 'height', label: PunnettSquareStrings.traitHeightStringProperty.value },
      { id: 'flower', label: PunnettSquareStrings.traitFlowerStringProperty.value },
    ]
    traitDefs.forEach((def) => {
      const btn = new SoftButton(def.label, () => {
        model.setTrait(def.id)
      }, {
        width: thirdW,
        height: btnH,
        fill: HeredityColors.accent,
        selected: def.id === model.traitProperty.value,
        fontSize: 11,
        onSound: () => sounds.modeChange(true),
      })
      panelContent.addChild(btn)
      this.traitButtons.push(btn)
    })

    const parentsHeader = controlSection(PunnettSquareStrings.sectionParentsStringProperty.value, contentW)
    panelContent.addChild(parentsHeader)

    const genotypeDefs: { g: Genotype; label: string }[] = [
      { g: 'AA', label: PunnettSquareStrings.genotypeAAStringProperty.value },
      { g: 'Aa', label: PunnettSquareStrings.genotypeAaStringProperty.value },
      { g: 'aa', label: PunnettSquareStrings.genotypeaaStringProperty.value },
    ]

    const motherLabelText = new Text(PunnettSquareStrings.motherLabelStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: HeredityColors.mother,
    })
    panelContent.addChild(motherLabelText)
    genotypeDefs.forEach((def) => {
      const btn = new SoftButton(def.label, () => {
        model.setMotherGenotype(def.g)
      }, {
        width: thirdW,
        height: btnH,
        fill: HeredityColors.mother,
        selected: def.g === model.motherGenotypeProperty.value,
        fontSize: 12,
        onSound: () => sounds.softClick(),
      })
      panelContent.addChild(btn)
      this.motherButtons.push(btn)
    })

    const fatherLabelText = new Text(PunnettSquareStrings.fatherLabelStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: HeredityColors.father,
    })
    panelContent.addChild(fatherLabelText)
    genotypeDefs.forEach((def) => {
      const btn = new SoftButton(def.label, () => {
        model.setFatherGenotype(def.g)
      }, {
        width: thirdW,
        height: btnH,
        fill: HeredityColors.father,
        selected: def.g === model.fatherGenotypeProperty.value,
        fontSize: 12,
        onSound: () => sounds.softClick(),
      })
      panelContent.addChild(btn)
      this.fatherButtons.push(btn)
    })

    const alleleHint = controlHint(PunnettSquareStrings.tapAlleleHintStringProperty.value, contentW)
    panelContent.addChild(alleleHint)

    const displayHeader = controlSection(PunnettSquareStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    const lettersBtn = new SoftButton(PunnettSquareStrings.lettersOnStringProperty.value, () => {
      model.showLettersProperty.value = !model.showLettersProperty.value
    }, {
      width: contentW,
      height: btnH,
      fill: '#64748b',
      selected: model.showLettersProperty.value,
      fontSize: 11,
      onSound: () => sounds.softClick(),
    })
    panelContent.addChild(lettersBtn)

    const iconsBtn = new SoftButton(PunnettSquareStrings.phenotypeIconsOnStringProperty.value, () => {
      model.showPhenotypeIconsProperty.value = !model.showPhenotypeIconsProperty.value
    }, {
      width: contentW,
      height: btnH,
      fill: '#0ea5e9',
      selected: model.showPhenotypeIconsProperty.value,
      fontSize: 11,
      onSound: () => sounds.softClick(),
    })
    panelContent.addChild(iconsBtn)

    const probsBtn = new SoftButton(PunnettSquareStrings.probabilitiesOnStringProperty.value, () => {
      model.showProbabilitiesProperty.value = !model.showProbabilitiesProperty.value
    }, {
      width: contentW,
      height: btnH,
      fill: '#16a34a',
      selected: model.showProbabilitiesProperty.value,
      fontSize: 11,
      onSound: () => sounds.softClick(),
    })
    panelContent.addChild(probsBtn)

    const animateBtn = new SoftButton(PunnettSquareStrings.animateFillOnStringProperty.value, () => {
      model.animateFillProperty.value = !model.animateFillProperty.value
    }, {
      width: contentW,
      height: btnH,
      fill: '#7c3aed',
      selected: model.animateFillProperty.value,
      fontSize: 11,
      onSound: () => sounds.softClick(),
    })
    panelContent.addChild(animateBtn)

    const fractionsBtn = new SoftButton(PunnettSquareStrings.fractionsOnStringProperty.value, () => {
      model.showFractionsProperty.value = !model.showFractionsProperty.value
    }, {
      width: halfW,
      height: btnH,
      fill: HeredityColors.accent,
      selected: model.showFractionsProperty.value,
      fontSize: 11,
      onSound: () => sounds.softClick(),
    })
    panelContent.addChild(fractionsBtn)

    const highlightAaBtn = new SoftButton(PunnettSquareStrings.highlightHeterozygoteOnStringProperty.value, () => {
      model.highlightHeterozygoteProperty.value = !model.highlightHeterozygoteProperty.value
    }, {
      width: halfW,
      height: btnH,
      fill: '#0ea5e9',
      selected: model.highlightHeterozygoteProperty.value,
      fontSize: 11,
      onSound: () => sounds.softClick(),
    })
    panelContent.addChild(highlightAaBtn)

    const envHeader = controlSection(PunnettSquareStrings.sectionEnvironmentStringProperty.value, contentW)
    panelContent.addChild(envHeader)

    const autoRepeatBtn = new SoftButton(PunnettSquareStrings.autoRepeatOffStringProperty.value, () => {
      model.autoRepeatProperty.value = !model.autoRepeatProperty.value
    }, {
      width: contentW,
      height: btnH,
      fill: '#10b981',
      selected: model.autoRepeatProperty.value,
      fontSize: 11,
      onSound: () => sounds.softClick(),
    })
    panelContent.addChild(autoRepeatBtn)

    const randomParentsBtn = new SoftButton(PunnettSquareStrings.randomParentsStringProperty.value, () => {
      sounds.modeChange(true)
      model.randomizeParents()
    }, {
      width: halfW,
      height: btnH,
      fill: '#64748b',
      fontSize: 11,
    })
    panelContent.addChild(randomParentsBtn)

    const lethalAaBtn = new SoftButton(PunnettSquareStrings.lethalAaOffStringProperty.value, () => {
      model.lethalityAaProperty.value = !model.lethalityAaProperty.value
    }, {
      width: halfW,
      height: btnH,
      fill: '#475569',
      selected: model.lethalityAaProperty.value,
      fontSize: 10,
      onSound: () => sounds.softClick(),
    })
    panelContent.addChild(lethalAaBtn)

    const lethalHint = controlHint(PunnettSquareStrings.lethalAaHintStringProperty.value, contentW)
    panelContent.addChild(lethalHint)

    const playbackHeader = controlSection(PunnettSquareStrings.sectionSoundPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    const fillSpeedSlider = new DepthSlider(model.fillSpeedProperty, {
      min: 0.5,
      max: 2,
      width: contentW,
      label: PunnettSquareStrings.fillSpeedStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: HeredityColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(fillSpeedSlider)

    const generationLimitSlider = new DepthSlider(model.generationLimitProperty, {
      min: 1,
      max: 5,
      width: contentW,
      label: PunnettSquareStrings.generationLimitStringProperty.value,
      format: (n) => String(Math.round(n)),
      fill: '#7c3aed',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(generationLimitSlider)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? PunnettSquareStrings.soundOnStringProperty.value
        : PunnettSquareStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? PunnettSquareStrings.soundOnStringProperty.value : PunnettSquareStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    const crossHeader = controlSection(PunnettSquareStrings.sectionCrossStringProperty.value, contentW)
    panelContent.addChild(crossHeader)

    const crossBtn = new SoftButton(PunnettSquareStrings.crossButtonStringProperty.value, () => {
      sounds.cross()
      model.fillAnimate()
    }, {
      width: halfW,
      height: 38,
      fill: HeredityColors.accent,
      fontSize: 12,
    })
    panelContent.addChild(crossBtn)

    const clearBtn = new SoftButton(PunnettSquareStrings.clearButtonStringProperty.value, () => {
      sounds.softClick()
      model.clearFill()
    }, {
      width: halfW,
      height: 38,
      fill: '#475569',
      fontSize: 12,
    })
    panelContent.addChild(clearBtn)

    const statusHeader = controlSection(PunnettSquareStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.generationText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: HeredityColors.panelMuted,
    })
    panelContent.addChild(this.generationText)

    this.trialCountText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: HeredityColors.panelMuted,
    })
    panelContent.addChild(this.trialCountText)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new Text(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: HeredityColors.panelText,
      maxWidth: contentW,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(PunnettSquareStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 12,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      traitHeader.left = 0
      traitHeader.top = py
      py = traitHeader.bottom + 6
      this.traitButtons[0].left = 0
      this.traitButtons[0].top = py
      this.traitButtons[1].left = thirdW + 8
      this.traitButtons[1].top = py
      this.traitButtons[2].left = (thirdW + 8) * 2
      this.traitButtons[2].top = py
      py = this.traitButtons[0].bottom + 12

      parentsHeader.left = 0
      parentsHeader.top = py
      py = parentsHeader.bottom + 4
      motherLabelText.left = 0
      motherLabelText.top = py
      py = motherLabelText.bottom + 4
      this.motherButtons[0].left = 0
      this.motherButtons[0].top = py
      this.motherButtons[1].left = thirdW + 8
      this.motherButtons[1].top = py
      this.motherButtons[2].left = (thirdW + 8) * 2
      this.motherButtons[2].top = py
      py = this.motherButtons[0].bottom + 8
      fatherLabelText.left = 0
      fatherLabelText.top = py
      py = fatherLabelText.bottom + 4
      this.fatherButtons[0].left = 0
      this.fatherButtons[0].top = py
      this.fatherButtons[1].left = thirdW + 8
      this.fatherButtons[1].top = py
      this.fatherButtons[2].left = (thirdW + 8) * 2
      this.fatherButtons[2].top = py
      py = this.fatherButtons[0].bottom + 4
      alleleHint.left = 0
      alleleHint.top = py
      py = alleleHint.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      lettersBtn.left = 0
      lettersBtn.top = py
      py = lettersBtn.bottom + gridGap
      iconsBtn.left = 0
      iconsBtn.top = py
      py = iconsBtn.bottom + gridGap
      probsBtn.left = 0
      probsBtn.top = py
      py = probsBtn.bottom + gridGap
      animateBtn.left = 0
      animateBtn.top = py
      py = animateBtn.bottom + gridGap
      fractionsBtn.left = 0
      fractionsBtn.top = py
      highlightAaBtn.left = halfW + 8
      highlightAaBtn.top = py
      py = fractionsBtn.bottom + 12

      envHeader.left = 0
      envHeader.top = py
      py = envHeader.bottom + 6
      autoRepeatBtn.left = 0
      autoRepeatBtn.top = py
      py = autoRepeatBtn.bottom + gridGap
      randomParentsBtn.left = 0
      randomParentsBtn.top = py
      lethalAaBtn.left = halfW + 8
      lethalAaBtn.top = py
      py = randomParentsBtn.bottom + 4
      lethalHint.left = 0
      lethalHint.top = py
      py = lethalHint.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      fillSpeedSlider.left = 0
      fillSpeedSlider.top = py
      py = fillSpeedSlider.bottom + 8
      generationLimitSlider.left = 0
      generationLimitSlider.top = py
      py = generationLimitSlider.bottom + 8
      this.soundBtn.left = 0
      this.soundBtn.top = py
      py = this.soundBtn.bottom + 12

      crossHeader.left = 0
      crossHeader.top = py
      py = crossHeader.bottom + 6
      crossBtn.left = 0
      crossBtn.top = py
      clearBtn.left = halfW + 8
      clearBtn.top = py
      py = crossBtn.bottom + 6
      statusHeader.left = 0
      statusHeader.top = py
      py = statusHeader.bottom + 6
      this.generationText.left = 0
      this.generationText.top = py
      py = this.generationText.bottom + 4
      this.trialCountText.left = 0
      this.trialCountText.top = py
      py = this.trialCountText.bottom + 8

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

    const scroller = new ScrollableNode(panelContent, rightW - 24, stageH - 56)
    scroller.left = 12
    scroller.top = 38
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

    // ── Sync helpers ───────────────────────────────────────────────────────────
    const syncAxisLetters = () => {
      const motherPair = genotypeToAlleles(model.motherGenotypeProperty.value)
      const fatherPair = genotypeToAlleles(model.fatherGenotypeProperty.value)
      this.motherAxisTexts[0].string = motherPair[0]
      this.motherAxisTexts[1].string = motherPair[1]
      this.fatherAxisTexts[0].string = fatherPair[0]
      this.fatherAxisTexts[1].string = fatherPair[1]
    }

    const syncGridContent = () => {
      const grid = model.computeGrid()
      const trait = model.traitProperty.value
      const lethal = model.lethalityAaProperty.value
      const showFrac = model.showFractionsProperty.value && model.cellRevealProperty.value >= 4
      const highlightHet = model.highlightHeterozygoteProperty.value && model.cellRevealProperty.value >= 4
      const genotypeCounts = new Map<Genotype, number>()
      for (const row of grid) {
        for (const cell of row) {
          genotypeCounts.set(cell.genotype, (genotypeCounts.get(cell.genotype) ?? 0) + 1)
        }
      }

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const i = r * 2 + c
          const cell = grid[r][c]
          const isLethal = lethal && cell.genotype === 'Aa'
          this.cellGenotypeTexts[i].string = cell.genotype
          this.cellGenotypeTexts[i].centerX = 0
          this.cellIcons[i].fill = isLethal ? '#94a3b8' : phenotypeColor(trait, cell.dominant)
          this.cellIcons[i].opacity = isLethal ? 0.35 : 1
          this.cellGenotypeTexts[i].opacity = isLethal ? 0.45 : 1

          if (showFrac) {
            const count = genotypeCounts.get(cell.genotype) ?? 0
            this.cellFractionTexts[i].string = count > 1 ? `${count}/4` : '1/4'
            this.cellFractionTexts[i].visible = true
          }
          else {
            this.cellFractionTexts[i].visible = false
          }

          this.cellHighlightRects[i].visible = highlightHet && cell.genotype === 'Aa' && !isLethal
        }
      }
      syncAxisLetters()
    }

    const syncProbabilities = () => {
      if (!model.showProbabilitiesProperty.value) {
        this.probsText.visible = false
        return
      }
      this.probsText.visible = true
      if (model.cellRevealProperty.value < 4) {
        this.probsText.string = PunnettSquareStrings.probabilitiesNoneStringProperty.value
        return
      }
      const trait = model.traitProperty.value
      const dom = model.dominantCount()
      const domLabel = phenotypeLabel(trait, true)
      const recLabel = phenotypeLabel(trait, false)
      if (model.showFractionsProperty.value) {
        this.probsText.string =
          `${domLabel}: ${dom}/4 · ${recLabel}: ${4 - dom}/4` +
          (model.lethalityAaProperty.value && model.heterozygoteCount() > 0
            ? `<br>Viable: ${model.viableCount()}/4`
            : '')
      }
      else {
        this.probsText.string =
          `${domLabel}: ${dom}/4 (${Math.round((dom / 4) * 100)}%)<br>${recLabel}: ${4 - dom}/4 ` +
          `(${Math.round(((4 - dom) / 4) * 100)}%)` +
          (model.lethalityAaProperty.value && model.heterozygoteCount() > 0
            ? `<br>Viable offspring: ${model.viableCount()}/4`
            : '')
      }
    }

    const syncSelections = () => {
      this.traitButtons.forEach((b, i) => b.setSelected(traitDefs[i].id === model.traitProperty.value))
      this.motherButtons.forEach((b, i) => b.setSelected(genotypeDefs[i].g === model.motherGenotypeProperty.value))
      this.fatherButtons.forEach((b, i) => b.setSelected(genotypeDefs[i].g === model.fatherGenotypeProperty.value))
    }

    model.traitProperty.link(() => {
      syncGridContent()
      syncProbabilities()
      syncSelections()
      this.updateGuidance()
    })
    model.motherGenotypeProperty.link(() => {
      syncGridContent()
      syncProbabilities()
      syncSelections()
      this.updateGuidance()
    })
    model.fatherGenotypeProperty.link(() => {
      syncGridContent()
      syncProbabilities()
      syncSelections()
      this.updateGuidance()
    })

    model.showLettersProperty.link((on) => {
      this.cellGenotypeTexts.forEach((t) => (t.visible = on))
      lettersBtn.setLabel(
        on ? PunnettSquareStrings.lettersOnStringProperty.value : PunnettSquareStrings.lettersOffStringProperty.value,
      )
      lettersBtn.setSelected(on)
    })
    model.showPhenotypeIconsProperty.link((on) => {
      this.cellIcons.forEach((c) => (c.visible = on))
      iconsBtn.setLabel(
        on
          ? PunnettSquareStrings.phenotypeIconsOnStringProperty.value
          : PunnettSquareStrings.phenotypeIconsOffStringProperty.value,
      )
      iconsBtn.setSelected(on)
    })
    model.showProbabilitiesProperty.link((on) => {
      syncProbabilities()
      probsBtn.setLabel(
        on
          ? PunnettSquareStrings.probabilitiesOnStringProperty.value
          : PunnettSquareStrings.probabilitiesOffStringProperty.value,
      )
      probsBtn.setSelected(on)
    })
    model.animateFillProperty.link((on) => {
      animateBtn.setLabel(
        on
          ? PunnettSquareStrings.animateFillOnStringProperty.value
          : PunnettSquareStrings.animateFillOffStringProperty.value,
      )
      animateBtn.setSelected(on)
    })
    model.showFractionsProperty.link((on) => {
      syncGridContent()
      syncProbabilities()
      fractionsBtn.setLabel(
        on ? PunnettSquareStrings.fractionsOnStringProperty.value : PunnettSquareStrings.fractionsOffStringProperty.value,
      )
      fractionsBtn.setSelected(on)
    })
    model.highlightHeterozygoteProperty.link((on) => {
      syncGridContent()
      highlightAaBtn.setLabel(
        on
          ? PunnettSquareStrings.highlightHeterozygoteOnStringProperty.value
          : PunnettSquareStrings.highlightHeterozygoteOffStringProperty.value,
      )
      highlightAaBtn.setSelected(on)
    })
    model.autoRepeatProperty.link((on) => {
      autoRepeatBtn.setLabel(
        on ? PunnettSquareStrings.autoRepeatOnStringProperty.value : PunnettSquareStrings.autoRepeatOffStringProperty.value,
      )
      autoRepeatBtn.setSelected(on)
    })
    model.lethalityAaProperty.link((on) => {
      syncGridContent()
      syncProbabilities()
      lethalAaBtn.setLabel(
        on ? PunnettSquareStrings.lethalAaOnStringProperty.value : PunnettSquareStrings.lethalAaOffStringProperty.value,
      )
      lethalAaBtn.setSelected(on)
    })

    model.cellRevealProperty.link((count, oldCountRaw) => {
      const oldCount = oldCountRaw ?? 0
      const grid = model.computeGrid()
      const trait = model.traitProperty.value
      for (let i = oldCount; i < count; i++) {
        const pos = this.cellCenters[i]
        const r = Math.floor(i / 2)
        const c = i % 2
        const color = phenotypeColor(trait, grid[r][c].dominant)
        this.particles.burst(pos.x, pos.y, { count: 12, color, speed: 65, life: 0.4, radius: 2.6 })
        sounds.hop()
      }
      if (count === 4 && oldCount < 4) {
        sounds.celebrate()
        syncGridContent()
      }
      syncProbabilities()
    })

    model.starsProperty.link((n) => {
      this.starsText.string = `${PunnettSquareStrings.starsStringProperty.value} ${n}`
    })
    model.generationProperty.link((n) => {
      this.generationText.string = `${PunnettSquareStrings.generationLabelStringProperty.value}: ${n}`
    })
    model.trialCountProperty.link((n) => {
      this.trialCountText.string = `${PunnettSquareStrings.trialCountLabelStringProperty.value}: ${n}`
    })
    model.statusProperty.link((status) => {
      this.statusText.string = status
    })
    model.soundEnabledProperty.link((on) => {
      sounds.setEnabled(on)
      this.soundBtn.setLabel(
        on ? PunnettSquareStrings.soundOnStringProperty.value : PunnettSquareStrings.soundOffStringProperty.value,
      )
    })
    model.fillingProperty.link(() => this.updateGuidance())

    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.historyPushProperty.lazyLink(() => {
      this.historyChart.push(this.historySeriesIndex, (model.dominantCount() / 4) * 100)
    })

    syncGridContent()
    syncProbabilities()
    syncSelections()
    this.updateGuidance()
  }

  private showQuiz(): void {
    const options = this.model.quizOptions()
    this.miniQuiz.showQuiz(
      PunnettSquareStrings.quizQuestionStringProperty.value,
      options,
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  private updateGuidance(): void {
    const filling = this.model.fillingProperty.value
    const progress = this.model.fillProgressProperty.value
    const trait = TRAITS[this.model.traitProperty.value]

    if (filling) {
      this.guide.setGuidance(
        PunnettSquareStrings.guideTitleStringProperty.value,
        PunnettSquareStrings.guideFillingStringProperty.value,
      )
      this.teachingTriad.setTriad(
        'Crossing in progress…',
        'Each of the 4 boxes gets one allele from Mother and one from Father.',
        'Watch the genotype letters and colored phenotype appear.',
      )
    }
    else if (progress >= 1) {
      const dom = this.model.dominantCount()
      this.guide.setGuidance(
        PunnettSquareStrings.guideTitleStringProperty.value,
        PunnettSquareStrings.guideDoneStringProperty.value,
      )
      this.teachingTriad.setTriad(
        `${dom}/4 offspring show ${trait.dominantLabel.toLowerCase()}.`,
        dom === 4 || dom === 0
          ? 'A homozygous parent forces the same outcome for every offspring.'
          : 'Only "aa" offspring show the recessive trait — one hidden "a" is not enough.',
        'Try a new genotype combo, or switch traits and cross again.',
      )
    }
    else {
      this.guide.setGuidance(
        PunnettSquareStrings.guideTitleStringProperty.value,
        PunnettSquareStrings.guideIdleStringProperty.value,
      )
      this.teachingTriad.setTriad(
        'Set up a cross.',
        'Capital A is dominant, lowercase a is recessive — every offspring gets one allele from each parent.',
        'Tap an allele letter to flip it, then press Cross.',
      )
    }
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.particles.step(dt)

    const progress = this.model.fillProgressProperty.value
    for (let i = 0; i < 4; i++) {
      const local = clamp(progress * 4 - i, 0, 1)
      const eased = smoothstep(local)
      const group = this.cellGroups[i]
      group.opacity = eased
      group.setScaleMagnitude(0.5 + 0.5 * eased)
    }
  }
}
