import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { HydraulicLiftModel } from './model/HydraulicLiftModel.js'
import { HydraulicLiftScreenView } from './view/HydraulicLiftScreenView.js'
import { ForcesConstants } from '../../shared/ForcesConstants.js'
import { HydraulicLiftStrings } from './HydraulicLiftStrings.js'
import { ForcesColors } from '../../shared/ForcesColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class HydraulicLiftScreen extends Screen<HydraulicLiftModel, HydraulicLiftScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ForcesConstants.SCREEN_OPTIONS,
      {
        name: HydraulicLiftStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ForcesColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new HydraulicLiftModel(),
      (model) => new HydraulicLiftScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(14, 62, 72, 14, { fill: 'rgba(52,152,219,0.5)' }))
  iconNode.addChild(new Rectangle(22, 38, 18, 24, { fill: '#7f8c8d' }))
  iconNode.addChild(new Rectangle(58, 28, 28, 34, { fill: '#7f8c8d' }))
  iconNode.addChild(new Rectangle(54, 18, 36, 12, { fill: '#e67e22' }))
  return new ScreenIcon(iconNode, { fill: ForcesColors.screenBackgroundColorProperty })
}
