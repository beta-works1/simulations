import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { OhmLawCircuitModel } from './model/OhmLawCircuitModel.js'
import { OhmLawCircuitScreenView } from './view/OhmLawCircuitScreenView.js'
import { ElectricityConstants } from '../../shared/ElectricityConstants.js'
import { OhmLawCircuitStrings } from './OhmLawCircuitStrings.js'
import { ElectricityColors } from '../../shared/ElectricityColors.js'
import { WIRE } from '../../shared/circuitDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class OhmLawCircuitScreen extends Screen<OhmLawCircuitModel, OhmLawCircuitScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ElectricityConstants.SCREEN_OPTIONS,
      {
        name: OhmLawCircuitStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ElectricityColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(
      () => new OhmLawCircuitModel(),
      (model) => new OhmLawCircuitScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Path(new Shape().rect(18, 28, 64, 44), { stroke: WIRE, lineWidth: 3 }))
  iconNode.addChild(new Circle(10, { fill: '#fde68a', centerX: 72, centerY: 50 }))
  return new ScreenIcon(iconNode, { fill: ElectricityColors.screenBackgroundColorProperty })
}
