import { Range, Dimension2 } from 'scenerystack/dot'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { HSlider, Panel, PanelOptions, RectangularPushButton } from 'scenerystack/sun'
import { HBox, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { WarmingModel, WARMING_SCENARIOS } from '../model/WarmingModel.js'
import { ScrollableNode } from './ScrollableNode.js'
import { WarmingSounds } from './WarmingSounds.js'

type SelfOptions = {
  panelMaxHeight?: number
}

type Options = SelfOptions & EmptySelfOptions & PanelOptions

/** Class-8 panel: mechanism story, meters, gas blanket, human-cause scenarios. */
export class WarmingControlPanel extends Panel {
  public constructor(model: WarmingModel, sounds: WarmingSounds, providedOptions: Options) {
    const w = (providedOptions.maxWidth as number | undefined) ?? 250
    const panelMaxHeight = providedOptions.panelMaxHeight ?? 520
    const options = optionize<Options, SelfOptions, PanelOptions>()(
      {
        panelMaxHeight: 520,
        xMargin: 10,
        yMargin: 10,
        stroke: 'rgba(125, 211, 252, 0.45)',
        lineWidth: 2,
        fill: 'rgba(11, 22, 40, 0.94)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, baseColor = '#2980b9') =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(12), fill: 'white', maxWidth: w - 28 }),
        baseColor,
        xMargin: 8,
        yMargin: 6,
        listener: fn,
        minWidth: w - 16,
      })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 13, weight: 'bold' }), fill: '#7dcea0', maxWidth: w })

    const help = (t: string) =>
      new Text(t, { font: new PhetFont(12), fill: '#94a3b8', maxWidth: w })

    const tipReadout = new Text(model.tipProperty, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: w,
    })
    const whyReadout = new Text(model.whyProperty, {
      font: new PhetFont(12),
      fill: '#a7f3d0',
      maxWidth: w,
    })
    const effectReadout = new Text(model.effectProperty, {
      font: new PhetFont(12),
      fill: '#fdba74',
      maxWidth: w,
    })
    const tempReadout = new Text('', {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      fill: '#fb923c',
      maxWidth: w,
    })
    const gasReadout = new Text('', {
      font: new PhetFont(13),
      fill: '#e2e8f0',
      maxWidth: w,
    })

    const refreshMeters = () => {
      tempReadout.string = `Earth: ${model.temperatureProperty.value.toFixed(1)} °C`
      gasReadout.string = `Greenhouse gases: ${Math.round(model.co2LevelProperty.value * 100)}%`
    }
    model.temperatureProperty.link(refreshMeters)
    model.co2LevelProperty.link(refreshMeters)

    let lastCo2 = model.co2LevelProperty.value
    model.co2LevelProperty.lazyLink(v => {
      if (Math.abs(v - lastCo2) > 0.03) sounds.sliderTick()
      lastCo2 = v
    })

    const soundLabel = new Text(model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off', {
      font: new PhetFont(12),
      fill: 'white',
      maxWidth: w - 24,
    })
    const soundBtn = new RectangularPushButton({
      content: soundLabel,
      baseColor: '#0e6655',
      xMargin: 8,
      yMargin: 6,
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

    const storyOrder = ['today', 'factories', 'trees', 'clean'] as const
    const storyBtns = storyOrder.map(id => {
      const s = WARMING_SCENARIOS.find(x => x.id === id)!
      const color =
        id === 'factories' ? '#c0392b' : id === 'clean' ? '#2980b9' : id === 'trees' ? '#1e8449' : '#f1c40f'
      return mkBtn(
        s.name.replace(/^\d+\.\s*/, ''),
        () => {
          model.applyScenario(s.id)
          sounds.scenario()
        },
        color,
      )
    })

    const content = new VBox({
      align: 'left',
      spacing: 7,
      children: [
        new Text('Controls', {
          font: new PhetFont({ size: 17, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        section('How it works'),
        help('1. Sunlight reaches Earth and warms land & oceans.'),
        help('2. Earth gives energy back as heat (infrared).'),
        help('3. Greenhouse gases (CO₂, CH₄…) absorb heat.'),
        help('4. Gases re-radiate heat — some back to Earth.'),
        help('5. Extra gases → thicker blanket → global warming.'),
        section('What is happening'),
        tipReadout,
        whyReadout,
        effectReadout,
        section('Meters'),
        tempReadout,
        gasReadout,
        section('Greenhouse-gas blanket'),
        help('Thicker = more gases = more trapped heat.'),
        new HBox({
          spacing: 8,
          children: [
            new RectangularPushButton({
              content: new Text('− Thinner', { font: new PhetFont(12), fill: 'white' }),
              baseColor: '#2980b9',
              xMargin: 10,
              yMargin: 6,
              listener: () => {
                model.nudgeCo2(-0.1)
                sounds.button()
              },
              minWidth: (w - 24) / 2,
            }),
            new RectangularPushButton({
              content: new Text('+ Thicker', { font: new PhetFont(12), fill: 'white' }),
              baseColor: '#c0392b',
              xMargin: 10,
              yMargin: 6,
              listener: () => {
                model.nudgeCo2(0.1)
                sounds.button()
              },
              minWidth: (w - 24) / 2,
            }),
          ],
        }),
        new HSlider(model.co2LevelProperty, new Range(0.05, 1), {
          trackSize: new Dimension2(w - 28, 6),
          thumbSize: new Dimension2(16, 24),
          majorTickLength: 0,
          minorTickLength: 0,
        }),
        section('Human causes'),
        help('Burning fuels and cutting forests add CO₂.'),
        ...storyBtns,
        soundBtn,
        mkBtn(
          'Reset',
          () => {
            model.reset()
            sounds.resetAll()
          },
          '#c0392b',
        ),
      ],
    })

    const scrollable = new ScrollableNode(content, w - 4, Math.max(200, panelMaxHeight - 16))
    super(scrollable, options)
  }
}
