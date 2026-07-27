import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { BalancedForcesModel } from './model/BalancedForcesModel.js'
import { BalancedForcesScreenView } from './view/BalancedForcesScreenView.js'
import { ForcesConstants } from '../../shared/ForcesConstants.js'
import { BalancedForcesStrings } from './BalancedForcesStrings.js'
import { ForcesColors } from '../../shared/ForcesColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class BalancedForcesScreen extends Screen<BalancedForcesModel, BalancedForcesScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ForcesConstants.SCREEN_OPTIONS,
      {
        name: BalancedForcesStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ForcesColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new BalancedForcesModel(),
      (model) => new BalancedForcesScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(12, 62, 76, 6, { fill: '#64748b' }))
  iconNode.addChild(new Rectangle(38, 42, 24, 20, { fill: '#5dade2', stroke: '#f8fafc', lineWidth: 2 }))
  iconNode.addChild(new Rectangle(18, 50, 20, 4, { fill: '#e74c3c' }))
  iconNode.addChild(new Rectangle(62, 50, 20, 4, { fill: '#27ae60' }))
  return new ScreenIcon(iconNode, { fill: ForcesColors.screenBackgroundColorProperty })
}
