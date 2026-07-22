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
  tierDetail,
  PYRAMID_LABELS,
} from '../model/EcologicalPyramidModel.js'

type Options = EmptySelfOptions & PanelOptions

export class PyramidControlPanel extends Panel {
  public constructor(model: EcologicalPyramidModel, providedOptions: Options) {
    const w = (providedOptions.maxWidth as number | undefined) ?? 250
    const options = optionize<Options, EmptySelfOptions, PanelOptions>()(
      {
        xMargin: 10,
        yMargin: 10,
        stroke: PyramidColors.panelBorderProperty,
        lineWidth: 2,
        fill: 'rgba(11, 22, 40, 0.92)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, baseColor = PyramidColors.buttonProperty) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(10), fill: 'white', maxWidth: w - 24 }),
        baseColor,
        xMargin: 6,
        yMargin: 4,
        listener: fn,
        minWidth: w - 8,
      })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#a8d4a0', maxWidth: w })

    const modeReadout = new Text('', { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: w })
    const detailBox = new VBox({ align: 'left', spacing: 3 })
    const compareBox = new VBox({ align: 'left', spacing: 2 })
    const baseReadout = new Text('', { font: new PhetFont(10), fill: '#ecf0f1', maxWidth: 80 })

    const refreshDetail = () => {
      const mode = model.modeProperty.value
      const tier = model.selectedTierProperty.value
      const base = model.baseEnergyProperty.value
      const d = tierDetail(base, tier, mode)
      modeReadout.string = `Showing: ${modeUnit(mode)}`
      const lines = [
        new Text(d.label, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: '#f4d03f', maxWidth: w }),
        new Text(`Value: ${formatTierValue(d.energy, mode)}`, { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: w }),
      ]
      if (mode === 'energy') {
        lines.push(
          new Text(`${d.pctOfBase.toFixed(1)}% of producer base`, {
            font: new PhetFont(10),
            fill: '#bdc3c7',
            maxWidth: w,
          }),
        )
        if (tier > 0) {
          lines.push(
            new Text(`From level below: ${d.pctFromBelow.toFixed(0)}%`, {
              font: new PhetFont(10),
              fill: '#bdc3c7',
              maxWidth: w,
            }),
            new Text(`Lost as heat: ~${d.lostFromBelow.toFixed(0)}%`, {
              font: new PhetFont(10),
              fill: '#e74c3c',
              maxWidth: w,
            }),
          )
        }
      } else if (mode === 'numbers') {
        lines.push(
          new Text(`Organisms: ${Math.round(d.organisms).toLocaleString()}`, {
            font: new PhetFont(10),
            fill: '#bdc3c7',
            maxWidth: w,
          }),
        )
      } else {
        lines.push(
          new Text(`Biomass: ${formatTierValue(d.biomass, 'biomass')}`, {
            font: new PhetFont(10),
            fill: '#bdc3c7',
            maxWidth: w,
          }),
        )
      }
      detailBox.children = lines

      compareBox.children = PYRAMID_LABELS.map((label, i) => {
        const v = formatTierValue(tierDetail(base, i, mode).energy, mode)
        return new Text(`${i + 1}. ${label}: ${v}`, {
          font: new PhetFont(10),
          fill: i === tier ? '#f4d03f' : '#bdc3c7',
          maxWidth: w,
        })
      })

      baseReadout.string = formatTierValue(base, mode)
    }

    model.baseEnergyProperty.link(refreshDetail)
    model.modeProperty.link(refreshDetail)
    model.selectedTierProperty.link(refreshDetail)

    const setMode = (mode: PyramidMode) => () => model.setMode(mode)

    const playPauseLabel = new Text(model.runningProperty.value ? 'Pause' : 'Play', {
      font: new PhetFont(10),
      fill: 'white',
      maxWidth: w - 24,
    })
    const playPauseBtn = new RectangularPushButton({
      content: playPauseLabel,
      baseColor: PyramidColors.playbackButtonProperty,
      xMargin: 6,
      yMargin: 4,
      listener: () => {
        model.runningProperty.value = !model.runningProperty.value
      },
      minWidth: w - 8,
    })
    model.runningProperty.link((running) => {
      playPauseLabel.string = running ? 'Pause' : 'Play'
    })

    const content = new VBox({
      align: 'left',
      spacing: 5,
      children: [
        new Text(PyramidStrings.controlsStringProperty, {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        section('Pyramid type'),
        modeReadout,
        mkBtn('Energy (10% rule)', setMode('energy')),
        mkBtn('Biomass (kg)', setMode('biomass')),
        mkBtn('Organism count', setMode('numbers')),
        section('Selected level'),
        detailBox,
        section('Producer energy'),
        new HBox({
          spacing: 6,
          children: [
            new Text('Base', { font: new PhetFont(10), fill: '#bdc3c7' }),
            baseReadout,
          ],
        }),
        new HSlider(model.baseEnergyProperty, new Range(PyramidConstants.BASE_MIN, PyramidConstants.BASE_MAX), {
          trackSize: new Dimension2(w - 24, 5),
          thumbSize: new Dimension2(14, 22),
          majorTickLength: 0,
          minorTickLength: 0,
        }),
        section('Compare levels'),
        compareBox,
        section('Simulation Controls'),
        playPauseBtn,
        mkBtn('Reset', () => model.reset(), PyramidColors.playbackButtonProperty),
      ],
    })

    super(content, options)
  }
}
