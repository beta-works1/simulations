import { Range, Dimension2 } from 'scenerystack/dot'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { HSlider, Panel, PanelOptions, RectangularPushButton } from 'scenerystack/sun'
import { HBox, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PyramidColors, PyramidConstants } from '../../common/PyramidColors.js'
import { PyramidStrings } from '../../PyramidStrings.js'
import {
  EcologicalPyramidModel,
  formatTierValue,
  modeUnit,
  PyramidMode,
  QUIZ_BANK,
  SCENARIOS,
  tierDetail,
  PYRAMID_LABELS,
} from '../model/EcologicalPyramidModel.js'
import { PyramidSounds } from './PyramidSounds.js'
import { ScrollableNode } from './ScrollableNode.js'

type SelfOptions = {
  panelMaxHeight?: number
}

type Options = SelfOptions & EmptySelfOptions & PanelOptions

export class PyramidControlPanel extends Panel {
  public constructor(model: EcologicalPyramidModel, sounds: PyramidSounds, providedOptions: Options) {
    const w = (providedOptions.maxWidth as number | undefined) ?? 250
    const panelMaxHeight = providedOptions.panelMaxHeight ?? 520
    const options = optionize<Options, SelfOptions, PanelOptions>()(
      {
        panelMaxHeight: 520,
        xMargin: 10,
        yMargin: 10,
        stroke: PyramidColors.panelBorderProperty,
        lineWidth: 2,
        fill: 'rgba(11, 22, 40, 0.94)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, baseColor = PyramidColors.buttonProperty) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(11), fill: 'white', maxWidth: w - 28 }),
        baseColor,
        xMargin: 8,
        yMargin: 5,
        listener: fn,
        minWidth: w - 16,
      })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: '#7dcea0', maxWidth: w })

    const help = (t: string) =>
      new Text(t, { font: new PhetFont(10), fill: '#94a3b8', maxWidth: w })

    const modeReadout = new Text('', { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: w })
    const detailBox = new VBox({ align: 'left', spacing: 3 })
    const compareBox = new VBox({ align: 'left', spacing: 2 })
    const baseReadout = new Text('', { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: 90 })
    const transferReadout = new Text('', { font: new PhetFont(11), fill: '#fecaca', maxWidth: w })
    const tipReadout = new Text(model.tipProperty, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: w,
    })
    const whyReadout = new Text(model.whyProperty, {
      font: new PhetFont(11),
      fill: '#a7f3d0',
      maxWidth: w,
    })
    const nextReadout = new Text(model.nextHintProperty, {
      font: new PhetFont(11),
      fill: '#e2e8f0',
      maxWidth: w,
    })
    const quizPrompt = new Text('', { font: new PhetFont(11), fill: '#e2e8f0', maxWidth: w - 8 })
    const quizFeedback = new Text('', { font: new PhetFont(10), fill: '#a8d4a0', maxWidth: w - 8 })
    const quizScore = new Text('', { font: new PhetFont(11), fill: '#f4d03f', maxWidth: w })
    const quizChoices = new VBox({ align: 'left', spacing: 4 })
    const advancedBox = new VBox({ align: 'left', spacing: 5 })

    const refreshDetail = () => {
      const mode = model.modeProperty.value
      const tier = model.selectedTierProperty.value
      const base = model.baseEnergyProperty.value
      const transfer = model.transferProperty.value
      modeReadout.string = `Showing: ${modeUnit(mode)}`
      transferReadout.string = `Keep ${(transfer * 100).toFixed(0)}% each step · lose ~${((1 - transfer) * 100).toFixed(0)}%`

      if (tier < 0 || model.decomposerFocusProperty.value) {
        detailBox.children = [
          new Text('Decomposers', {
            font: new PhetFont({ size: 13, weight: 'bold' }),
            fill: '#f4d03f',
            maxWidth: w,
          }),
          new Text('Recycle nutrients back to plants', {
            font: new PhetFont(11),
            fill: '#bdc3c7',
            maxWidth: w,
          }),
        ]
      } else {
        const d = tierDetail(base, tier, mode, transfer)
        const lines = [
          new Text(d.label, {
            font: new PhetFont({ size: 13, weight: 'bold' }),
            fill: '#f4d03f',
            maxWidth: w,
          }),
          new Text(`Value: ${formatTierValue(d.energy, mode)}`, {
            font: new PhetFont(12),
            fill: '#ecf0f1',
            maxWidth: w,
          }),
        ]
        if (mode === 'energy') {
          lines.push(
            new Text(`${d.pctOfBase.toFixed(2)}% of plant base`, {
              font: new PhetFont(11),
              fill: '#bdc3c7',
              maxWidth: w,
            }),
          )
          if (tier > 0) {
            lines.push(
              new Text(`From level below: ${d.pctFromBelow.toFixed(0)}%`, {
                font: new PhetFont(11),
                fill: '#bdc3c7',
                maxWidth: w,
              }),
              new Text(`Lost as heat: ~${d.lostFromBelow.toFixed(0)}%`, {
                font: new PhetFont(11),
                fill: '#e74c3c',
                maxWidth: w,
              }),
            )
          }
        } else if (mode === 'numbers') {
          lines.push(
            new Text(`Organisms: ${Math.round(d.organisms).toLocaleString()}`, {
              font: new PhetFont(11),
              fill: '#bdc3c7',
              maxWidth: w,
            }),
          )
        } else {
          lines.push(
            new Text(`Living mass: ${formatTierValue(d.biomass, 'biomass')}`, {
              font: new PhetFont(11),
              fill: '#bdc3c7',
              maxWidth: w,
            }),
          )
        }
        detailBox.children = lines
      }

      compareBox.children = PYRAMID_LABELS.map((label, i) => {
        const v = formatTierValue(tierDetail(base, i, mode, transfer).energy, mode)
        return new Text(`${i + 1}. ${label}: ${v}`, {
          font: new PhetFont(10),
          fill: i === tier ? '#f4d03f' : '#bdc3c7',
          maxWidth: w,
        })
      })

      baseReadout.string = formatTierValue(base, mode === 'energy' ? 'energy' : mode)
    }

    const refreshQuiz = () => {
      const q = QUIZ_BANK[model.quizIndexProperty.value % QUIZ_BANK.length]!
      quizPrompt.string = q.prompt
      quizScore.string = `Score: ${model.quizScoreProperty.value}`
      quizFeedback.string = model.quizFeedbackProperty.value
      quizChoices.children = q.choices.map((c, i) =>
        mkBtn(
          c,
          () => {
            model.answerQuiz(i)
            if (i === q.correct) sounds.quizCorrect()
            else sounds.quizWrong()
          },
          PyramidColors.playbackButtonProperty,
        ),
      )
    }

    model.baseEnergyProperty.link(refreshDetail)
    model.transferProperty.link(refreshDetail)
    model.modeProperty.link(refreshDetail)
    model.selectedTierProperty.link(refreshDetail)
    model.decomposerFocusProperty.link(refreshDetail)
    model.quizIndexProperty.link(refreshQuiz)
    model.quizScoreProperty.link(refreshQuiz)
    model.quizFeedbackProperty.link(refreshQuiz)
    refreshQuiz()

    const modes: PyramidMode[] = ['energy', 'biomass', 'numbers']
    const setMode = (mode: PyramidMode) => () => {
      const prev = modes.indexOf(model.modeProperty.value)
      const next = modes.indexOf(mode)
      model.setMode(mode)
      sounds.modeChange(next >= prev)
    }

    const playPauseLabel = new Text(model.runningProperty.value ? 'Pause flow' : 'Play flow', {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: w - 24,
    })
    const playPauseBtn = new RectangularPushButton({
      content: playPauseLabel,
      baseColor: PyramidColors.playbackButtonProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => {
        model.runningProperty.value = !model.runningProperty.value
        sounds.playPause(model.runningProperty.value)
      },
      minWidth: w - 16,
    })
    model.runningProperty.link(running => {
      playPauseLabel.string = running ? 'Pause flow' : 'Play flow'
    })

    const soundLabel = new Text(model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off', {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: w - 24,
    })
    const soundBtn = new RectangularPushButton({
      content: soundLabel,
      baseColor: PyramidColors.accentProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => {
        model.soundEnabledProperty.value = !model.soundEnabledProperty.value
        sounds.setEnabled(model.soundEnabledProperty.value)
        if (model.soundEnabledProperty.value) sounds.button()
      },
      minWidth: w - 16,
    })
    model.soundEnabledProperty.link(on => {
      soundLabel.string = on ? 'Sound: On' : 'Sound: Off'
    })

    const tipsLabel = new Text(model.showTipsProperty.value ? 'Tips on screen: On' : 'Tips on screen: Off', {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: w - 24,
    })
    const tipsBtn = new RectangularPushButton({
      content: tipsLabel,
      baseColor: PyramidColors.playbackButtonProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => {
        model.showTipsProperty.value = !model.showTipsProperty.value
        sounds.button()
      },
      minWidth: w - 16,
    })
    model.showTipsProperty.link(on => {
      tipsLabel.string = on ? 'Tips on screen: On' : 'Tips on screen: Off'
    })

    let lastTransfer = model.transferProperty.value
    model.transferProperty.lazyLink(v => {
      if (Math.abs(v - lastTransfer) > 0.004) sounds.sliderTick()
      lastTransfer = v
    })

    const buildAdvanced = () => {
      if (!model.showAdvancedProperty.value) {
        advancedBox.children = [help('Extra tools stay hidden. Learn the 10% rule first.')]
        return
      }
      advancedBox.children = [
        help('Use these after you can explain Plants → Rabbits → Foxes → Eagles.'),
        section('Producer energy (base)'),
        new HBox({
          spacing: 6,
          children: [new Text('Base', { font: new PhetFont(11), fill: '#bdc3c7' }), baseReadout],
        }),
        new HSlider(model.baseEnergyProperty, new Range(PyramidConstants.BASE_MIN, PyramidConstants.BASE_MAX), {
          trackSize: new Dimension2(w - 28, 6),
          thumbSize: new Dimension2(16, 24),
          majorTickLength: 0,
          minorTickLength: 0,
        }),
        section('How much moves up?'),
        transferReadout,
        new HSlider(
          model.transferProperty,
          new Range(PyramidConstants.TRANSFER_MIN, PyramidConstants.TRANSFER_MAX),
          {
            trackSize: new Dimension2(w - 28, 6),
            thumbSize: new Dimension2(16, 24),
            majorTickLength: 0,
            minorTickLength: 0,
          },
        ),
        section('Ecosystem stories'),
        ...SCENARIOS.map(s =>
          mkBtn(s.name, () => {
            model.applyScenario(s.id)
            sounds.scenario()
          }),
        ),
        section('Compare all levels'),
        compareBox,
        section('Quick check'),
        quizScore,
        quizPrompt,
        quizChoices,
        quizFeedback,
        mkBtn('Next question', () => {
          model.nextQuiz()
          sounds.button()
        }, PyramidColors.playbackButtonProperty),
      ]
    }
    model.showAdvancedProperty.link(buildAdvanced)

    const advancedLabel = new Text('Show more options', {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: w - 24,
    })
    const advancedBtn = new RectangularPushButton({
      content: advancedLabel,
      baseColor: PyramidColors.playbackButtonProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => {
        model.showAdvancedProperty.value = !model.showAdvancedProperty.value
        sounds.button()
      },
      minWidth: w - 16,
    })
    model.showAdvancedProperty.link(on => {
      advancedLabel.string = on ? 'Hide extra options' : 'Show more options'
    })

    const content = new VBox({
      align: 'left',
      spacing: 7,
      children: [
        new Text(PyramidStrings.controlsStringProperty, {
          font: new PhetFont({ size: 16, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        help('How to learn: tap a level, read NOW / Why / Next, then play the cascade.'),
        section('NOW happening'),
        tipReadout,
        whyReadout,
        nextReadout,
        section('Selected level'),
        detailBox,
        section('Navigate levels'),
        new HBox({
          spacing: 6,
          children: [
            new RectangularPushButton({
              content: new Text('◀ Prev', { font: new PhetFont(11), fill: 'white' }),
              baseColor: PyramidColors.playbackButtonProperty,
              xMargin: 10,
              yMargin: 5,
              listener: () => {
                model.nudgeTier(-1)
                sounds.tierSelect()
              },
              minWidth: (w - 22) / 2,
            }),
            new RectangularPushButton({
              content: new Text('Next ▶', { font: new PhetFont(11), fill: 'white' }),
              baseColor: PyramidColors.playbackButtonProperty,
              xMargin: 10,
              yMargin: 5,
              listener: () => {
                model.nudgeTier(1)
                sounds.tierSelect()
              },
              minWidth: (w - 22) / 2,
            }),
          ],
        }),
        mkBtn(
          'Play 10% cascade',
          () => {
            model.startCascadeDemo()
            sounds.scenario()
          },
          PyramidColors.accentProperty,
        ),
        mkBtn(
          'Compare with next level',
          () => {
            model.toggleCompareNext()
            sounds.button()
          },
          PyramidColors.playbackButtonProperty,
        ),
        section('Pyramid type'),
        modeReadout,
        mkBtn('Energy (10% rule)', setMode('energy')),
        mkBtn('Biomass (living mass)', setMode('biomass')),
        mkBtn('How many animals', setMode('numbers')),
        section('Simple controls'),
        soundBtn,
        tipsBtn,
        playPauseBtn,
        advancedBtn,
        advancedBox,
        mkBtn(
          'Reset',
          () => {
            model.reset()
            sounds.resetAll()
          },
          PyramidColors.dangerProperty,
        ),
      ],
    })

    const scrollInnerWidth = w - 4
    const scrollViewport = Math.max(200, panelMaxHeight - 16)
    const scrollable = new ScrollableNode(content, scrollInnerWidth, scrollViewport)

    super(scrollable, options)
  }
}
