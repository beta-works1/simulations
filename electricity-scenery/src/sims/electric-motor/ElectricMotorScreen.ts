import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { ElectricMotorModel } from './model/ElectricMotorModel.js'
import { ElectricMotorScreenView } from './view/ElectricMotorScreenView.js'
import { ElectricityConstants } from '../../shared/ElectricityConstants.js'
import { ElectricMotorStrings } from './ElectricMotorStrings.js'
import { ElectricityColors } from '../../shared/ElectricityColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class ElectricMotorScreen extends Screen<ElectricMotorModel, ElectricMotorScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ElectricityConstants.SCREEN_OPTIONS,
      {
        name: ElectricMotorStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ElectricityColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new ElectricMotorModel(), (model) => new ElectricMotorScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(12, 20, 18, 60, { fill: '#ef4444' }))
  iconNode.addChild(new Rectangle(70, 20, 18, 60, { fill: '#3b82f6' }))
  iconNode.addChild(new Circle(16, { stroke: '#fbbf24', lineWidth: 3, centerX: 50, centerY: 50 }))
  return new ScreenIcon(iconNode, { fill: ElectricityColors.screenBackgroundColorProperty })
}
