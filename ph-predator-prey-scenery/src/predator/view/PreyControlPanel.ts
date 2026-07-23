import { Range, Dimension2 } from 'scenerystack/dot'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { HSlider, Panel, PanelOptions, RectangularPushButton, ToggleSwitch } from 'scenerystack/sun'
import { HBox, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NumberProperty } from 'scenerystack/axon'
import { PreyColors, PreyConstants } from '../../common/PreyColors.js'
import { PreyStrings } from '../../PreyStrings.js'
import {
  ADVANCED_SCENARIOS,
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
        xMargin: 10,
        yMargin: 10,
        stroke: PreyColors.panelBorderProperty,
        lineWidth: 2,
        fill: 'rgba(11, 28, 40, 0.94)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, baseColor = PreyColors.buttonProperty) =>
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

    const preyReadout = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#2ecc71', maxWidth: w })
    const predReadout = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#e74c3c', maxWidth: w })
    const phaseReadout = new Text(model.phaseLabelProperty, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: w,
    })
    const guideReadout = new Text(model.guideProperty, {
      font: new PhetFont(11),
      fill: '#e2e8f0',
      maxWidth: w,
    })
    const tipReadout = new Text(model.tipProperty, {
      font: new PhetFont(11),
      fill: '#a7f3d0',
      maxWidth: w,
    })

    const quizPrompt = new Text('', { font: new PhetFont(11), fill: '#e2e8f0', maxWidth: w - 8 })
    const quizFeedback = new Text('', { font: new PhetFont(10), fill: '#a8d4a0', maxWidth: w - 8 })
    const quizScore = new Text('', { font: new PhetFont(11), fill: '#f4d03f', maxWidth: w })
    const quizChoices = new VBox({ align: 'left', spacing: 4 })
    const advancedBox = new VBox({ align: 'left', spacing: 5 })

    const refresh = () => {
      preyReadout.string = `Prey (rabbits): ${Math.round(model.preyProperty.value)}`
      predReadout.string = `Predators (foxes): ${Math.round(model.predatorsProperty.value)}`
    }
    model.preyProperty.link(refresh)
    model.predatorsProperty.link(refresh)

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
            else sounds.softClick()
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
    tick(model.growthProperty, 0.03)
    tick(model.simSpeedProperty, 0.05)
    tick(model.predationRateProperty, 0.002)
    tick(model.predatorGrowthProperty, 0.002)
    tick(model.deathProperty, 0.03)
    tick(model.carryingCapacityProperty, 2)

    const sliderRow = (label: string, property: NumberProperty, range: Range, digits = 2) => {
      const readout = new Text('', { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: 48 })
      property.link(v => {
        readout.string = v.toFixed(digits)
      })
      return new VBox({
        align: 'left',
        spacing: 3,
        children: [
          new HBox({
            spacing: 6,
            children: [
              new Text(label, { font: new PhetFont(11), fill: '#bdc3c7', maxWidth: w - 60 }),
              readout,
            ],
          }),
          new HSlider(property, range, {
            trackSize: new Dimension2(w - 28, 6),
            thumbSize: new Dimension2(16, 24),
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
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: w - 24,
    })
    const playPauseBtn = new RectangularPushButton({
      content: playPauseLabel,
      baseColor: PreyColors.playbackButtonProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => {
        model.runningProperty.value = !model.runningProperty.value
        sounds.playPause(model.runningProperty.value)
      },
      minWidth: w - 16,
    })
    model.runningProperty.link(running => {
      playPauseLabel.string = running ? 'Pause' : 'Play'
    })

    const buildAdvanced = () => {
      if (!model.showAdvancedProperty.value) {
        advancedBox.children = [
          help('Extra tools stay hidden so the main lesson stays clear.'),
        ]
        return
      }
      advancedBox.children = [
        help('Use these after you understand the basic cycle.'),
        sliderRow('How often prey are eaten', model.predationRateProperty, new Range(0.01, 0.05), 3),
        sliderRow('Predator birth rate', model.predatorGrowthProperty, new Range(0.01, 0.04), 3),
        sliderRow('Predator death rate', model.deathProperty, new Range(0.35, 1.0)),
        sliderRow('Space / food limit', model.carryingCapacityProperty, new Range(50, 120), 0),
        new HBox({
          spacing: 8,
          children: [
            new Text('Hide in bush', { font: new PhetFont(11), fill: '#bdc3c7', maxWidth: 110 }),
            new ToggleSwitch(model.refugeEnabledProperty, false, true, { scale: 0.55 }),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            new Text('Show chase lines', { font: new PhetFont(11), fill: '#bdc3c7', maxWidth: 110 }),
            new ToggleSwitch(model.showChaseLinesProperty, false, true, { scale: 0.55 }),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            new Text('Day / night auto', { font: new PhetFont(11), fill: '#bdc3c7', maxWidth: 110 }),
            new ToggleSwitch(model.autoDayNightProperty, false, true, { scale: 0.55 }),
          ],
        }),
        section('What if…?'),
        mkBtn('Drought (slower prey growth)', () => {
          model.triggerEvent('drought')
          sounds.scenario()
        }, PreyColors.dangerProperty),
        mkBtn('Predator disease', () => {
          model.triggerEvent('disease')
          sounds.scenario()
        }, PreyColors.predatorProperty),
        mkBtn('Plant bloom (+ prey)', () => {
          model.triggerEvent('bloom')
          sounds.spawnPrey()
        }, PreyColors.preyProperty),
        ...ADVANCED_SCENARIOS.map(s =>
          mkBtn(s.name, () => {
            model.applyScenario(s.id)
            sounds.scenario()
          }),
        ),
        section('Quick check'),
        quizScore,
        quizPrompt,
        quizChoices,
        quizFeedback,
        mkBtn('Next question', () => {
          model.nextQuiz()
          sounds.button()
        }, PreyColors.playbackButtonProperty),
        mkBtn('Clear graph', () => {
          model.clearHistory()
          sounds.softClick()
        }, PreyColors.playbackButtonProperty),
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
      baseColor: PreyColors.playbackButtonProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => {
        model.showAdvancedProperty.value = !model.showAdvancedProperty.value
        advancedLabel.string = model.showAdvancedProperty.value ? 'Hide extra options' : 'Show more options'
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
        new Text(PreyStrings.controlsStringProperty, {
          font: new PhetFont({ size: 16, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        help('Grade 8 tip: watch one full cycle before changing settings.'),
        section('What to notice'),
        tipReadout,
        guideReadout,
        section('Populations now'),
        preyReadout,
        predReadout,
        phaseReadout,
        section('Lesson modes'),
        mkBtn('Predator–prey cycle', setMode('predation')),
        mkBtn('Competition', setMode('competition')),
        mkBtn('Mutualism (help)', setMode('mutualism')),
        section('Try a starting story'),
        ...SCENARIOS.map(s =>
          mkBtn(s.name, () => {
            model.applyScenario(s.id)
            sounds.scenario()
          }),
        ),
        section('Add animals'),
        help('Or tap the meadow: left = prey, right = predators.'),
        new HBox({
          spacing: 6,
          children: [
            new RectangularPushButton({
              content: new Text('+ Prey', { font: new PhetFont(11), fill: 'white' }),
              baseColor: PreyColors.preyProperty,
              xMargin: 10,
              yMargin: 5,
              listener: () => {
                model.addPrey()
                sounds.spawnPrey()
              },
              minWidth: (w - 22) / 2,
            }),
            new RectangularPushButton({
              content: new Text('+ Predators', { font: new PhetFont(11), fill: 'white' }),
              baseColor: PreyColors.predatorProperty,
              xMargin: 10,
              yMargin: 5,
              listener: () => {
                model.addPredators()
                sounds.spawnPredator()
              },
              minWidth: (w - 22) / 2,
            }),
          ],
        }),
        section('Simple controls'),
        sliderRow('Prey growth (how fast rabbits increase)', model.growthProperty, new Range(PreyConstants.GROWTH_MIN, PreyConstants.GROWTH_MAX)),
        sliderRow('Watching speed (slower = easier)', model.simSpeedProperty, new Range(PreyConstants.SPEED_MIN, PreyConstants.SPEED_MAX)),
        playPauseBtn,
        mkBtn(
          'Reset to start',
          () => {
            model.reset()
            sounds.resetAll()
          },
          PreyColors.dangerProperty,
        ),
        advancedBtn,
        advancedBox,
      ],
    })

    const scrollable = new ScrollableNode(content, w - 4, Math.max(200, panelMaxHeight - 16))
    super(scrollable, options)
  }
}
