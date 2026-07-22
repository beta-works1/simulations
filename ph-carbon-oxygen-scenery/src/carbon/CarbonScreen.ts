import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { CarbonColors, CarbonConstants } from '../common/CarbonColors.js'
import { CarbonStrings } from '../CarbonStrings.js'
import { CarbonOxygenModel } from './model/CarbonOxygenModel.js'
import { CarbonOxygenScreenView } from './view/CarbonOxygenScreenView.js'

type Options = EmptySelfOptions & ScreenOptions

export class CarbonOxygenScreen extends Screen<CarbonOxygenModel, CarbonOxygenScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, EmptySelfOptions, ScreenOptions>()(
      {},
      CarbonConstants.SCREEN_OPTIONS,
      {
        name: CarbonStrings.screen.cycleStringProperty,
        homeScreenIcon: createIcon(),
        backgroundColorProperty: CarbonColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new CarbonOxygenModel(),
      (model) => new CarbonOxygenScreenView(model),
      options,
    )
  }
}

function createIcon(): ScreenIcon {
  const icon = new Rectangle(0, 0, 100, 100, { fill: '#1e8449', cornerRadius: 12 })
  return new ScreenIcon(icon, { fill: CarbonColors.screenBackgroundColorProperty })
}
