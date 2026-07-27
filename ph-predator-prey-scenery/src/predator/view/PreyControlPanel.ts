import { Range } from 'scenerystack/dot'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { Panel, PanelOptions, ToggleSwitch } from 'scenerystack/sun'
import { HBox, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NumberProperty } from 'scenerystack/axon'
import { PreyColors, PreyConstants } from '../../common/PreyColors.js'
import { PreyStrings } from '../../PreyStrings.js'
import { SimTheme } from '../../common/SimTheme.js'
import { SoftButton } from '../../common/ui/SoftButton.js'
import { DepthSlider } from '../../common/ui/DepthSlider.js'
import { MiniQuiz } from '../../common/ui/MiniQuiz.js'
import {
  ADVANCED_SCENARIOS,
  CYCLE_STEPS,
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

/** Plain hex mirrors of PreyColors defaults — SoftButton wants a CSS string, not a Color/Property. */
const GREEN = '#16a085'
const BLUE = '#2980b9'
const PREY_GREEN = '#27ae60'
const PRED_RED = '#e74c3c'
const YELLOW = '#f1c40f'
const RED = '#c0392b'

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
        fill: SimTheme.panelDark,
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, fill = SimTheme.accent, width = w - 16) =>
      new SoftButton(label, fn, { width, height: 34, fill, fontSize: 12 })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: '#7dcea0', maxWidth: w })

    const help = (t: string) =>
      new Text(t, { font: new PhetFont(10), fill: '#94a3b8', maxWidth: w })

    const preyReadout = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#2ecc71', maxWidth: w })
    const predReadout = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#e74c3c', maxWidth: w })
    const tipReadout = new Text(model.tipProperty, {
      font: new PhetFont(11),
      fill: '#bae6fd',
      maxWidth: w,
    })
    const stepMap = new Text('', {
      font: new PhetFont(10),
      fill: '#cbd5e1',
      maxWidth: w,
    })

    const quizExplain = new Text('', { font: new PhetFont(11), fill: '#a8d4a0', maxWidth: w - 8 })
    const quizScore = new Text('', { font: new PhetFont(11), fill: '#f4d03f', maxWidth: w })
    const miniQuiz = new MiniQuiz(w - 4)
    const advancedBox = new VBox({ align: 'left', spacing: 5 })

    const refresh = () => {
      preyReadout.string = `Rabbits (green): ${Math.round(model.preyProperty.value)}`
      predReadout.string = `Foxes (red): ${Math.round(model.predatorsProperty.value)}`
      const step = model.storyStepProperty.value
      if (step >= 1 && step <= 4) {
        stepMap.string = CYCLE_STEPS.map(s => (s.n === step ? `【${s.n}】` : `${s.n}`)).join(' → ') + ' → …'
      } else {
        stepMap.string = 'Not in the 4-step hunt cycle right now'
      }
    }
    model.preyProperty.link(refresh)
    model.predatorsProperty.link(refresh)
    model.storyStepProperty.link(refresh)

    const refreshQuiz = () => {
      const q = QUIZ_BANK[model.quizIndexProperty.value % QUIZ_BANK.length]!
      quizScore.string = `Score: ${model.quizScoreProperty.value}`
      quizExplain.string = ''
      miniQuiz.showQuiz(
        q.prompt,
        q.choices.map((c, i) => ({ label: c, correct: i === q.correct })),
        correct => {
          // MiniQuiz only reports correct/wrong; model.answerQuiz just needs an index
          // that matches (correct) or does not match (wrong) the answer key.
          model.answerQuiz(correct ? q.correct : (q.correct + 1) % q.choices.length)
          if (correct) sounds.cyclePeak()
          else sounds.softClick()
          quizExplain.string = model.quizFeedbackProperty.value
        },
      )
    }
    model.quizIndexProperty.link(refreshQuiz)
    model.quizScoreProperty.link(() => {
      quizScore.string = `Score: ${model.quizScoreProperty.value}`
    })
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

    const depthSliderRow = (
      label: string,
      property: NumberProperty,
      range: Range,
      digits = 2,
      fill = '#38bdf8',
    ) =>
      new DepthSlider(property, {
        min: range.min,
        max: range.max,
        width: w - 28,
        label,
        format: n => n.toFixed(digits),
        fill,
        onTick: () => sounds.sliderTick(),
      })

    const setMode = (mode: InteractionMode) => () => {
      const prev = MODES.indexOf(model.modeProperty.value)
      const next = MODES.indexOf(mode)
      model.setMode(mode)
      sounds.modeChange(next >= prev)
    }

    const playPauseBtn = new SoftButton(
      model.runningProperty.value ? 'Pause' : 'Play',
      () => {
        model.runningProperty.value = !model.runningProperty.value
        sounds.playPause(model.runningProperty.value)
      },
      { width: w - 16, height: 36, fill: SimTheme.accent, fontSize: 13, selected: true },
    )
    model.runningProperty.link(running => {
      playPauseBtn.setLabel(running ? 'Pause' : 'Play')
      playPauseBtn.setSelected(running)
    })

    const soundBtn = new SoftButton(
      model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off',
      () => {
        sounds.unlock()
        model.soundEnabledProperty.value = !model.soundEnabledProperty.value
        sounds.setEnabled(model.soundEnabledProperty.value)
        if (model.soundEnabledProperty.value) sounds.button()
      },
      { width: w - 16, height: 34, fill: '#0f766e', fontSize: 12, selected: true },
    )
    model.soundEnabledProperty.link(on => {
      soundBtn.setLabel(on ? 'Sound: On' : 'Sound: Off')
      soundBtn.setSelected(on)
    })

    const buildAdvanced = () => {
      if (!model.showAdvancedProperty.value) {
        advancedBox.children = [help('Extra tools stay hidden. Learn the 4 steps first.')]
        return
      }
      advancedBox.children = [
        help('Use these after you can explain the 4 hunt steps.'),
        section('Other lessons (compare)'),
        mkBtn('Both fight for same food', setMode('competition'), GREEN),
        mkBtn('Both help each other', setMode('mutualism'), GREEN),
        section('Other starting stories'),
        ...SCENARIOS.filter(s => s.id !== 'classic').map(s =>
          mkBtn(s.name, () => {
            model.applyScenario(s.id)
            sounds.scenario()
          }, GREEN),
        ),
        depthSliderRow('How often foxes catch rabbits', model.predationRateProperty, new Range(0.01, 0.05), 3, '#38bdf8'),
        depthSliderRow('How fast foxes have babies', model.predatorGrowthProperty, new Range(0.01, 0.04), 3, '#f97316'),
        depthSliderRow('How fast foxes die', model.deathProperty, new Range(0.35, 1.0), 2, '#a78bfa'),
        depthSliderRow('Food / space limit', model.carryingCapacityProperty, new Range(50, 120), 0, '#facc15'),
        new HBox({
          spacing: 8,
          children: [
            new Text('Rabbits hide in bush', { font: new PhetFont(11), fill: '#bdc3c7', maxWidth: 110 }),
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
        mkBtn('Drought (rabbits grow slower)', () => {
          model.triggerEvent('drought')
          sounds.scenario()
        }, RED),
        mkBtn('Fox disease', () => {
          model.triggerEvent('disease')
          sounds.scenario()
        }, PRED_RED),
        mkBtn('Plant bloom (+ rabbits)', () => {
          model.triggerEvent('bloom')
          sounds.spawnPrey()
        }, PREY_GREEN),
        ...ADVANCED_SCENARIOS.map(s =>
          mkBtn(s.name, () => {
            model.applyScenario(s.id)
            sounds.scenario()
          }, GREEN),
        ),
        section('Quick check'),
        quizScore,
        miniQuiz,
        quizExplain,
        mkBtn('Next question', () => {
          model.nextQuiz()
          sounds.button()
        }, BLUE),
        mkBtn('Clear graph', () => {
          model.clearHistory()
          sounds.softClick()
        }, BLUE),
      ]
    }
    model.showAdvancedProperty.link(buildAdvanced)

    const advancedBtn = new SoftButton(
      'Show more options',
      () => {
        model.showAdvancedProperty.value = !model.showAdvancedProperty.value
        sounds.button()
      },
      { width: w - 16, height: 34, fill: BLUE, fontSize: 12 },
    )
    model.showAdvancedProperty.link(on => {
      advancedBtn.setLabel(on ? 'Hide extra options' : 'Show more options')
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
        help('How to learn: Play → watch the graph → say which colour rose first.'),
        section('The 4 steps (main lesson)'),
        tipReadout,
        stepMap,
        section('How many animals?'),
        preyReadout,
        predReadout,
        section('Main lesson'),
        mkBtn('Foxes eat rabbits (start here)', setMode('predation'), YELLOW),
        mkBtn('Restart classic cycle', () => {
          model.applyScenario('classic')
          sounds.scenario()
        }, GREEN),
        section('Add animals'),
        help('Or tap the meadow: left = rabbits, right = foxes.'),
        new HBox({
          spacing: 6,
          children: [
            mkBtn('+ Rabbits', () => {
              model.addPrey()
              sounds.spawnPrey()
            }, PREY_GREEN, (w - 22) / 2),
            mkBtn('+ Foxes', () => {
              model.addPredators()
              sounds.spawnPredator()
            }, PRED_RED, (w - 22) / 2),
          ],
        }),
        section('Simple controls'),
        depthSliderRow('Watching speed (slower = easier)', model.simSpeedProperty, new Range(PreyConstants.SPEED_MIN, PreyConstants.SPEED_MAX), 2, SimTheme.accent),
        soundBtn,
        playPauseBtn,
        mkBtn(
          'Reset to start',
          () => {
            model.reset()
            sounds.resetAll()
          },
          RED,
        ),
        advancedBtn,
        advancedBox,
      ],
    })

    const scrollable = new ScrollableNode(content, w - 4, Math.max(200, panelMaxHeight - 16))
    super(scrollable, options)
  }
}
