import { Range, Dimension2 } from 'scenerystack/dot'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { HSlider, Panel, PanelOptions, RectangularPushButton, ToggleSwitch } from 'scenerystack/sun'
import { HBox, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NumberProperty } from 'scenerystack/axon'
import { PreyColors, PreyConstants } from '../../common/PreyColors.js'
import { PreyStrings } from '../../PreyStrings.js'
import {
  InteractionMode,
  PredatorPreyModel,
  QUIZ_BANK,
  SCENARIOS,
} from '../model/PredatorPreyModel.js'
import { PreySounds } from './PreySounds.js'
import { ScrollableNode } from './ScrollableNode.js'

type SelfOptions = {
  panelMaxHeight?: number
}

type Options = SelfOptions & EmptySelfOptions & PanelOptions

const MODES: InteractionMode[] = ['predation', 'competition', 'mutualism']

export class PreyControlPanel extends Panel {
  public constructor(model: PredatorPreyModel, sounds: PreySounds, providedOptions: Options) {
    const w = (providedOptions.maxWidth as number | undefined) ?? 250
    const panelMaxHeight = providedOptions.panelMaxHeight ?? 520
    const options = optionize<Options, SelfOptions, PanelOptions>()(
      {
        panelMaxHeight: 520,
        xMargin: 8,
        yMargin: 8,
        stroke: PreyColors.panelBorderProperty,
        lineWidth: 2,
        fill: 'rgba(11, 28, 40, 0.94)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, baseColor = PreyColors.buttonProperty) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(10), fill: 'white', maxWidth: w - 28 }),
        baseColor,
        xMargin: 6,
        yMargin: 4,
        listener: fn,
        minWidth: w - 16,
      })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#7dcea0', maxWidth: w })

    const preyReadout = new Text('', { font: new PhetFont({ size: 13, weight: 'bold' }), fill: '#2ecc71', maxWidth: w })
    const predReadout = new Text('', { font: new PhetFont({ size: 13, weight: 'bold' }), fill: '#e74c3c', maxWidth: w })
    const ratioReadout = new Text('', { font: new PhetFont(11), fill: '#a5b4fc', maxWidth: w })
    const cycleReadout = new Text('', { font: new PhetFont(11), fill: '#f4d03f', maxWidth: w })
    const phaseReadout = new Text(model.phaseLabelProperty, {
      font: new PhetFont(11),
      fill: '#fde68a',
      maxWidth: w,
    })
    const modeReadout = new Text('', { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: w })
    const quizPrompt = new Text('', { font: new PhetFont(10), fill: '#e2e8f0', maxWidth: w - 8 })
    const quizFeedback = new Text('', { font: new PhetFont(9), fill: '#a8d4a0', maxWidth: w - 8 })
    const quizScore = new Text('', { font: new PhetFont(10), fill: '#f4d03f', maxWidth: w })
    const quizChoices = new VBox({ align: 'left', spacing: 3 })

    const refresh = () => {
      preyReadout.string = `Prey: ${model.preyProperty.value.toFixed(1)}`
      predReadout.string = `Predators: ${model.predatorsProperty.value.toFixed(1)}`
      ratioReadout.string = `Ratio prey∶pred = ${model.ratioProperty.value.toFixed(2)}`
      cycleReadout.string = `Completed cycles: ${model.cycleCountProperty.value}`
      modeReadout.string = `Mode: ${model.modeProperty.value}`
    }
    model.preyProperty.link(refresh)
    model.predatorsProperty.link(refresh)
    model.ratioProperty.link(refresh)
    model.cycleCountProperty.link(refresh)
    model.modeProperty.link(refresh)

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
            if (i === q.correct) sounds.cyclePeak()
            else sounds.hunt()
          },
          PreyColors.playbackButtonProperty,
        ),
      )
    }
    model.quizIndexProperty.link(refreshQuiz)
    model.quizScoreProperty.link(refreshQuiz)
    model.quizFeedbackProperty.link(refreshQuiz)
    refreshQuiz()

    const tick = (property: NumberProperty, thresh = 0.01) => {
      let last = property.value
      property.lazyLink(v => {
        if (Math.abs(v - last) > thresh) sounds.sliderTick()
        last = v
      })
    }
    tick(model.growthProperty, 0.02)
    tick(model.predationRateProperty, 0.001)
    tick(model.predatorGrowthProperty, 0.001)
    tick(model.deathProperty, 0.02)
    tick(model.simSpeedProperty, 0.05)
    tick(model.carryingCapacityProperty, 1)

    const sliderRow = (label: string, property: NumberProperty, range: Range, digits = 2) => {
      const readout = new Text('', { font: new PhetFont(10), fill: '#ecf0f1', maxWidth: 48 })
      property.link(v => {
        readout.string = v.toFixed(digits)
      })
      return new VBox({
        align: 'left',
        spacing: 2,
        children: [
          new HBox({
            spacing: 6,
            children: [
              new Text(label, { font: new PhetFont(10), fill: '#bdc3c7', maxWidth: w - 60 }),
              readout,
            ],
          }),
          new HSlider(property, range, {
            trackSize: new Dimension2(w - 28, 5),
            thumbSize: new Dimension2(14, 22),
            majorTickLength: 0,
            minorTickLength: 0,
          }),
        ],
      })
    }

    const setMode = (mode: InteractionMode) => () => {
      const prev = MODES.indexOf(model.modeProperty.value)
      const next = MODES.indexOf(mode)
      model.setMode(mode)
      sounds.modeChange(next >= prev)
    }

    const playPauseLabel = new Text(model.runningProperty.value ? 'Pause' : 'Play', {
      font: new PhetFont(10),
      fill: 'white',
      maxWidth: w - 24,
    })
    const playPauseBtn = new RectangularPushButton({
      content: playPauseLabel,
      baseColor: PreyColors.playbackButtonProperty,
      xMargin: 6,
      yMargin: 4,
      listener: () => {
        model.runningProperty.value = !model.runningProperty.value
        sounds.playPause(model.runningProperty.value)
      },
      minWidth: w - 16,
    })
    model.runningProperty.link(running => {
      playPauseLabel.string = running ? 'Pause' : 'Play'
    })

    const soundLabel = new Text(model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off', {
      font: new PhetFont(10),
      fill: 'white',
      maxWidth: w - 24,
    })
    const soundBtn = new RectangularPushButton({
      content: soundLabel,
      baseColor: PreyColors.accentProperty,
      xMargin: 6,
      yMargin: 4,
      listener: () => {
        model.soundEnabledProperty.value = !model.soundEnabledProperty.value
        sounds.setEnabled(model.soundEnabledProperty.value)
        soundLabel.string = model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off'
        if (model.soundEnabledProperty.value) sounds.button()
      },
      minWidth: w - 16,
    })

    const tipsLabel = new Text(model.showTipsProperty.value ? 'Tips: On' : 'Tips: Off', {
      font: new PhetFont(10),
      fill: 'white',
      maxWidth: w - 24,
    })
    const tipsBtn = new RectangularPushButton({
      content: tipsLabel,
      baseColor: PreyColors.playbackButtonProperty,
      xMargin: 6,
      yMargin: 4,
      listener: () => {
        model.showTipsProperty.value = !model.showTipsProperty.value
        sounds.button()
      },
      minWidth: w - 16,
    })
    model.showTipsProperty.link(on => {
      tipsLabel.string = on ? 'Tips: On' : 'Tips: Off'
    })

    model.isDayProperty.lazyLink(() => sounds.softClick())

    const content = new VBox({
      align: 'left',
      spacing: 5,
      children: [
        new Text(PreyStrings.controlsStringProperty, {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        section('Live populations'),
        preyReadout,
        predReadout,
        ratioReadout,
        cycleReadout,
        phaseReadout,
        section('Interaction mode'),
        modeReadout,
        mkBtn('Predation (cycles)', setMode('predation')),
        mkBtn('Competition', setMode('competition')),
        mkBtn('Mutualism', setMode('mutualism')),
        section('Seed meadow'),
        new HBox({
          spacing: 6,
          children: [
            new RectangularPushButton({
              content: new Text('+ Prey', { font: new PhetFont(10), fill: 'white' }),
              baseColor: PreyColors.preyProperty,
              xMargin: 8,
              yMargin: 4,
              listener: () => {
                model.addPrey()
                sounds.spawnPrey()
              },
              minWidth: (w - 22) / 2,
            }),
            new RectangularPushButton({
              content: new Text('+ Predators', { font: new PhetFont(10), fill: 'white' }),
              baseColor: PreyColors.predatorProperty,
              xMargin: 8,
              yMargin: 4,
              listener: () => {
                model.addPredators()
                sounds.spawnPredator()
              },
              minWidth: (w - 22) / 2,
            }),
          ],
        }),
        new HBox({
          spacing: 6,
          children: [
            new RectangularPushButton({
              content: new Text('− Prey', { font: new PhetFont(10), fill: 'white' }),
              baseColor: PreyColors.playbackButtonProperty,
              xMargin: 8,
              yMargin: 4,
              listener: () => {
                model.cullPrey()
                sounds.cull()
              },
              minWidth: (w - 22) / 2,
            }),
            new RectangularPushButton({
              content: new Text('− Predators', { font: new PhetFont(10), fill: 'white' }),
              baseColor: PreyColors.playbackButtonProperty,
              xMargin: 8,
              yMargin: 4,
              listener: () => {
                model.cullPredators()
                sounds.cull()
              },
              minWidth: (w - 22) / 2,
            }),
          ],
        }),
        section('Environment'),
        new HBox({
          spacing: 8,
          children: [
            new Text('Day', { font: new PhetFont(10), fill: '#bdc3c7' }),
            new ToggleSwitch(model.isDayProperty, false, true, { scale: 0.55 }),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            new Text('Auto day/night', { font: new PhetFont(10), fill: '#bdc3c7', maxWidth: 100 }),
            new ToggleSwitch(model.autoDayNightProperty, false, true, { scale: 0.55 }),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            new Text('Refuge bush', { font: new PhetFont(10), fill: '#bdc3c7', maxWidth: 100 }),
            new ToggleSwitch(model.refugeEnabledProperty, false, true, { scale: 0.55 }),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            new Text('Chase lines', { font: new PhetFont(10), fill: '#bdc3c7', maxWidth: 100 }),
            new ToggleSwitch(model.showChaseLinesProperty, false, true, { scale: 0.55 }),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            new Text('Phase plot', { font: new PhetFont(10), fill: '#bdc3c7', maxWidth: 100 }),
            new ToggleSwitch(model.showPhasePlotProperty, false, true, { scale: 0.55 }),
          ],
        }),
        section('Rates'),
        sliderRow('Prey growth', model.growthProperty, new Range(PreyConstants.GROWTH_MIN, PreyConstants.GROWTH_MAX)),
        sliderRow('Kill / predation', model.predationRateProperty, new Range(0.01, 0.06), 3),
        sliderRow('Predator birth', model.predatorGrowthProperty, new Range(0.01, 0.05), 3),
        sliderRow('Predator death', model.deathProperty, new Range(0.3, 1.2)),
        sliderRow('Carrying capacity', model.carryingCapacityProperty, new Range(40, 120), 0),
        sliderRow('Speed ×', model.simSpeedProperty, new Range(0.25, 3), 2),
        section('Disturbance events'),
        mkBtn('Drought', () => {
          model.triggerEvent('drought')
          sounds.scenario()
        }, PreyColors.dangerProperty),
        mkBtn('Predator disease', () => {
          model.triggerEvent('disease')
          sounds.scenario()
        }, PreyColors.predatorProperty),
        mkBtn('Plant bloom', () => {
          model.triggerEvent('bloom')
          sounds.spawnPrey()
        }, PreyColors.preyProperty),
        section('Scenarios'),
        ...SCENARIOS.map(s =>
          mkBtn(s.name, () => {
            model.applyScenario(s.id)
            sounds.scenario()
          }),
        ),
        section('Quiz'),
        quizScore,
        quizPrompt,
        quizChoices,
        quizFeedback,
        mkBtn('Next question', () => {
          model.nextQuiz()
          sounds.button()
        }, PreyColors.playbackButtonProperty),
        section('Simulation'),
        soundBtn,
        tipsBtn,
        playPauseBtn,
        mkBtn('Clear chart', () => {
          model.clearHistory()
          sounds.softClick()
        }, PreyColors.playbackButtonProperty),
        mkBtn(
          'Reset',
          () => {
            model.reset()
            sounds.resetAll()
          },
          PreyColors.dangerProperty,
        ),
      ],
    })

    const scrollable = new ScrollableNode(content, w - 4, Math.max(200, panelMaxHeight - 16))
    super(scrollable, options)
  }
}
