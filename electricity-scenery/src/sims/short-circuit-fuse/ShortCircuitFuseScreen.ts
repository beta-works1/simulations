import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PhetFont } from 'scenerystack/scenery-phet'
import { ShortCircuitFuseModel } from './model/ShortCircuitFuseModel.js'
import { ShortCircuitFuseScreenView } from './view/ShortCircuitFuseScreenView.js'
import { ElectricityConstants } from '../../shared/ElectricityConstants.js'
import { ShortCircuitFuseStrings } from './ShortCircuitFuseStrings.js'
import { ElectricityColors } from '../../shared/ElectricityColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class ShortCircuitFuseScreen extends Screen<ShortCircuitFuseModel, ShortCircuitFuseScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ElectricityConstants.SCREEN_OPTIONS,
      {
        name: ShortCircuitFuseStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ElectricityColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new ShortCircuitFuseModel(), (model) => new ShortCircuitFuseScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Path(new Shape().rect(18, 28, 64, 44), { stroke: '#fbbf24', lineWidth: 3 }))
  iconNode.addChild(new Rectangle(36, 24, 28, 12, { fill: '#94a3b8' }))
  iconNode.addChild(new Text('F', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#ef4444', centerX: 50, centerY: 70 }))
  return new ScreenIcon(iconNode, { fill: ElectricityColors.screenBackgroundColorProperty })
}
