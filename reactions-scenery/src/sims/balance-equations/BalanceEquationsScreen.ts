import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle, Text } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { PhetFont } from 'scenerystack/scenery-phet'
import { Tandem } from 'scenerystack/tandem'
import { BalanceEquationsModel } from './model/BalanceEquationsModel.js'
import { BalanceEquationsScreenView } from './view/BalanceEquationsScreenView.js'
import { ReactionsConstants } from '../../shared/ReactionsConstants.js'
import { ReactionsColors } from '../../shared/ReactionsColors.js'
import { BalanceEquationsStrings } from './BalanceEquationsStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class BalanceEquationsScreen extends Screen<BalanceEquationsModel, BalanceEquationsScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ReactionsConstants.SCREEN_OPTIONS,
      {
        name: BalanceEquationsStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ReactionsColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new BalanceEquationsModel(),
      (model) => new BalanceEquationsScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#083344',
    cornerRadius: 12,
  })
  const art = new Node()

  // Two reactant atoms, an arrow, and a product molecule \u2014 the balance-equations motif.
  art.addChild(new Circle(10, { fill: '#3498db', stroke: '#1f2937', lineWidth: 1.5, centerX: 22, centerY: 40 }))
  art.addChild(new Circle(10, { fill: '#e74c3c', stroke: '#1f2937', lineWidth: 1.5, centerX: 22, centerY: 66 }))
  art.addChild(
    new Text('\u2192', {
      font: new PhetFont({ size: 22, weight: 'bold' }),
      fill: '#0d9488',
      centerX: 50,
      centerY: 53,
    }),
  )
  art.addChild(new Circle(9, { fill: '#9b59b6', stroke: '#1f2937', lineWidth: 1.5, centerX: 74, centerY: 44 }))
  art.addChild(new Circle(6, { fill: '#9b59b6', stroke: '#1f2937', lineWidth: 1.5, centerX: 86, centerY: 56 }))
  art.addChild(new Circle(6, { fill: '#9b59b6', stroke: '#1f2937', lineWidth: 1.5, centerX: 64, centerY: 56 }))

  iconNode.addChild(art)
  return new ScreenIcon(iconNode, {
    fill: ReactionsColors.screenBackgroundColorProperty,
  })
}
