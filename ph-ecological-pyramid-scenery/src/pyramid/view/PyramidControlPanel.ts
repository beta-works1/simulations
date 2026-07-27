import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { Panel, PanelOptions } from 'scenerystack/sun'
import { HBox, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PyramidColors, PyramidConstants } from '../../common/PyramidColors.js'
import { PyramidStrings } from '../../PyramidStrings.js'
import { SimTheme } from '../../common/SimTheme.js'
import { SoftButton } from '../../common/ui/SoftButton.js'
import { DepthSlider } from '../../common/ui/DepthSlider.js'
import { MiniQuiz } from '../../common/ui/MiniQuiz.js'
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

/** Plain hex mirrors of PyramidColors defaults — SoftButton wants a CSS string, not a Color/Property. */
const GREEN = '#27ae60'
const BLUE = '#2980b9'
const YELLOW = '#f4d03f'
const RED = '#c0392b'

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
        fill: SimTheme.panelDark,
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, fill = SimTheme.accent, width = w - 16) =>
      new SoftButton(label, fn, { width, height: 34, fill, fontSize: 13 })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 13, weight: 'bold' }), fill: '#7dcea0', maxWidth: w })

    const help = (t: string) =>
      new Text(t, { font: new PhetFont(12), fill: '#94a3b8', maxWidth: w })

    const modeReadout = new Text('', { font: new PhetFont(13), fill: '#ecf0f1', maxWidth: w })
    const detailBox = new VBox({ align: 'left', spacing: 4 })
    const compareBox = new VBox({ align: 'left', spacing: 3 })
    const quizExplain = new Text('', { font: new PhetFont(12), fill: '#a8d4a0', maxWidth: w - 8 })
    const quizScore = new Text('', { font: new PhetFont(13), fill: '#f4d03f', maxWidth: w })
    const miniQuiz = new MiniQuiz(w - 4)
    const advancedBox = new VBox({ align: 'left', spacing: 6 })

    const refreshDetail = () => {
      const mode = model.modeProperty.value
      const tier = model.selectedTierProperty.value
      const base = model.baseEnergyProperty.value
      const transfer = model.transferProperty.value
      modeReadout.string = `Showing: ${modeUnit(mode)}`

      if (tier < 0 || model.decomposerFocusProperty.value) {
        detailBox.children = [
          new Text('Decomposers', {
            font: new PhetFont({ size: 14, weight: 'bold' }),
            fill: '#f4d03f',
            maxWidth: w,
          }),
          new Text('Recycle nutrients back to plants', {
            font: new PhetFont(12),
            fill: '#bdc3c7',
            maxWidth: w,
          }),
        ]
      } else {
        const d = tierDetail(base, tier, mode, transfer)
        const lines = [
          new Text(d.label, {
            font: new PhetFont({ size: 14, weight: 'bold' }),
            fill: '#f4d03f',
            maxWidth: w,
          }),
          new Text(`Amount: ${formatTierValue(d.energy, mode)}`, {
            font: new PhetFont(13),
            fill: '#ecf0f1',
            maxWidth: w,
          }),
        ]
        if (mode === 'energy' && tier > 0) {
          lines.push(
            new Text(`From below: ${d.pctFromBelow.toFixed(0)}% · lost as heat: ~${d.lostFromBelow.toFixed(0)}%`, {
              font: new PhetFont(12),
              fill: '#fecaca',
              maxWidth: w,
            }),
          )
        }
        detailBox.children = lines
      }

      compareBox.children = PYRAMID_LABELS.map((label, i) => {
        const v = formatTierValue(tierDetail(base, i, mode, transfer).energy, mode)
        return new Text(`${i + 1}. ${label}: ${v}`, {
          font: new PhetFont(12),
          fill: i === tier ? '#f4d03f' : '#bdc3c7',
          maxWidth: w,
        })
      })
    }

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
          if (correct) sounds.quizCorrect()
          else sounds.quizWrong()
          quizExplain.string = model.quizFeedbackProperty.value
        },
      )
    }

    model.baseEnergyProperty.link(refreshDetail)
    model.transferProperty.link(refreshDetail)
    model.modeProperty.link(refreshDetail)
    model.selectedTierProperty.link(refreshDetail)
    model.decomposerFocusProperty.link(refreshDetail)
    model.quizIndexProperty.link(refreshQuiz)
    model.quizScoreProperty.link(() => {
      quizScore.string = `Score: ${model.quizScoreProperty.value}`
    })
    refreshQuiz()

    const modes: PyramidMode[] = ['energy', 'biomass', 'numbers']
    const setMode = (mode: PyramidMode) => () => {
      const prev = modes.indexOf(model.modeProperty.value)
      const next = modes.indexOf(mode)
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
      { width: w - 16, height: 34, fill: '#0f766e', fontSize: 13, selected: true },
    )
    model.soundEnabledProperty.link(on => {
      soundBtn.setLabel(on ? 'Sound: On' : 'Sound: Off')
      soundBtn.setSelected(on)
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
        help('Use these after you understand Plants → Rabbits → Foxes → Eagles.'),
        section('Plant energy (base)'),
        new DepthSlider(model.baseEnergyProperty, {
          min: PyramidConstants.BASE_MIN,
          max: PyramidConstants.BASE_MAX,
          width: w - 28,
          label: 'Producer energy',
          format: n => formatTierValue(n, 'energy'),
          fill: '#38bdf8',
          onTick: () => sounds.sliderTick(),
        }),
        section('How much moves up?'),
        new DepthSlider(model.transferProperty, {
          min: PyramidConstants.TRANSFER_MIN,
          max: PyramidConstants.TRANSFER_MAX,
          width: w - 28,
          label: 'Transfer efficiency',
          format: n => `${(n * 100).toFixed(0)}%`,
          fill: '#f97316',
          onTick: () => sounds.sliderTick(),
        }),
        section('Try a place'),
        ...SCENARIOS.map(s =>
          mkBtn(
            s.name,
            () => {
              model.applyScenario(s.id)
              sounds.scenario()
            },
            GREEN,
          ),
        ),
        section('All levels'),
        compareBox,
        section('Quick check'),
        quizScore,
        miniQuiz,
        quizExplain,
        mkBtn(
          'Next question',
          () => {
            model.nextQuiz()
            sounds.button()
          },
          BLUE,
        ),
      ]
    }
    model.showAdvancedProperty.link(buildAdvanced)

    const advancedBtn = new SoftButton(
      'Show more options',
      () => {
        model.showAdvancedProperty.value = !model.showAdvancedProperty.value
        sounds.button()
      },
      { width: w - 16, height: 34, fill: BLUE, fontSize: 13 },
    )
    model.showAdvancedProperty.link(on => {
      advancedBtn.setLabel(on ? 'Hide extra options' : 'Show more options')
    })

    const content = new VBox({
      align: 'left',
      spacing: 8,
      children: [
        new Text(PyramidStrings.controlsStringProperty, {
          font: new PhetFont({ size: 17, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        help('Read NOW / Why / Next on the left. Tap a level, then play the cascade.'),
        section('This level'),
        detailBox,
        section('Move between levels'),
        new HBox({
          spacing: 8,
          children: [
            mkBtn('◀ Prev', () => {
              model.nudgeTier(-1)
              sounds.tierSelect()
            }, BLUE, (w - 24) / 2),
            mkBtn('Next ▶', () => {
              model.nudgeTier(1)
              sounds.tierSelect()
            }, BLUE, (w - 24) / 2),
          ],
        }),
        mkBtn(
          'Play 10% cascade',
          () => {
            model.startCascadeDemo()
            sounds.scenario()
          },
          YELLOW,
        ),
        mkBtn(
          'Compare next level',
          () => {
            model.toggleCompareNext()
            sounds.button()
          },
          BLUE,
        ),
        section('Pyramid type'),
        modeReadout,
        mkBtn('Energy (10% rule)', setMode('energy')),
        mkBtn('Biomass (living mass)', setMode('biomass')),
        mkBtn('How many animals', setMode('numbers')),
        section('Simple controls'),
        soundBtn,
        playPauseBtn,
        advancedBtn,
        advancedBox,
        mkBtn(
          'Reset',
          () => {
            model.reset()
            sounds.resetAll()
          },
          RED,
        ),
      ],
    })

    const scrollable = new ScrollableNode(content, w - 4, Math.max(200, panelMaxHeight - 16))
    super(scrollable, options)
  }
}
