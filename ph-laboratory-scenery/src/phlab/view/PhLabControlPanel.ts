import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { Panel, PanelOptions, RectangularPushButton } from 'scenerystack/sun'
import { Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PhLabModel } from '../model/PhLabModel.js'
import { PhLabColors } from '../../common/PhLabColors.js'
import { PhLabStrings } from '../../PhLabStrings.js'
import type { IndicatorKind } from '../model/PhLabGuide.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & PanelOptions

export class PhLabControlPanel extends Panel {
  public constructor(model: PhLabModel, providedOptions: Options) {
    const contentWidth = (providedOptions.maxWidth as number | undefined) ?? 220

    const options = optionize<Options, SelfOptions, PanelOptions>()(
      {
        xMargin: 10,
        yMargin: 10,
        stroke: PhLabColors.controlPanelBorderColorProperty,
        lineWidth: 2,
      },
      providedOptions,
    )

    const title = new Text(PhLabStrings.controlsStringProperty, {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      maxWidth: contentWidth,
    })

    const tip = new Text('Tap reagent beakers or use buttons below.', {
      font: new PhetFont(11),
      maxWidth: contentWidth,
    })

    const mkBtn = (label: string, listener: () => void, color?: string) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(12), maxWidth: contentWidth - 24 }),
        baseColor: color ?? PhLabColors.controlPanelButtonColorProperty,
        xMargin: 8,
        yMargin: 5,
        listener,
        minWidth: contentWidth - 8,
      })

    const mkPropBtn = (
      labelProperty: typeof PhLabStrings.pourAcidStringProperty,
      listener: () => void,
    ) =>
      new RectangularPushButton({
        content: new Text(labelProperty, { font: new PhetFont(12), maxWidth: contentWidth - 24 }),
        baseColor: PhLabColors.controlPanelButtonColorProperty,
        xMargin: 8,
        yMargin: 5,
        listener,
        minWidth: contentWidth - 8,
      })

    const section = (label: string) =>
      new Text(label, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#475569',
        maxWidth: contentWidth,
      })

    const setInd = (kind: IndicatorKind) => () => model.setIndicator(kind)

    const content = new VBox({
      align: 'left',
      spacing: 5,
      children: [
        title,
        tip,
        section('Pour'),
        mkPropBtn(PhLabStrings.pourAcidStringProperty, () => model.pour('acid')),
        mkPropBtn(PhLabStrings.pourBaseStringProperty, () => model.pour('base')),
        mkPropBtn(PhLabStrings.pourWaterStringProperty, () => model.pour('water')),
        section('Test'),
        mkPropBtn(PhLabStrings.dipLitmusStringProperty, () => model.dipLitmus()),
        mkPropBtn(PhLabStrings.emptyBeakerStringProperty, () => model.empty()),
        section('Color indicator'),
        mkBtn('Universal', setInd('universal'), '#86efac'),
        mkBtn('Litmus', setInd('litmus'), '#fda4af'),
        mkBtn('Phenolphthalein', setInd('phenolphthalein'), '#f9a8d4'),
        mkBtn('Methyl orange', setInd('methyl-orange'), '#fdba74'),
        new Text(PhLabStrings.litmusGuideStringProperty, {
          font: new PhetFont(11),
          maxWidth: contentWidth,
        }),
      ],
    })

    super(content, options)
  }
}
