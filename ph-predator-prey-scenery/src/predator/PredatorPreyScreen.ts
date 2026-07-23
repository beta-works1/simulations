import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PreyColors, PreyConstants } from '../common/PreyColors.js'
import { PreyStrings } from '../PreyStrings.js'
import { PredatorPreyModel } from './model/PredatorPreyModel.js'
import { PredatorPreyScreenView } from './view/PredatorPreyScreenView.js'

type Options = EmptySelfOptions & ScreenOptions

export class PredatorPreyScreen extends Screen<PredatorPreyModel, PredatorPreyScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, EmptySelfOptions, ScreenOptions>()(
      {},
      PreyConstants.SCREEN_OPTIONS,
      {
        name: PreyStrings.screen.meadowStringProperty,
        homeScreenIcon: createIcon(),
        backgroundColorProperty: PreyColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new PredatorPreyModel(),
      model => new PredatorPreyScreenView(model),
      options,
    )
  }
}

function createIcon(): ScreenIcon {
  const icon = new Rectangle(0, 0, 100, 100, { fill: '#145a32', cornerRadius: 12 })
  icon.addChild(new Circle(10, { fill: '#27ae60', centerX: 35, centerY: 55 }))
  icon.addChild(new Circle(8, { fill: '#2ecc71', centerX: 55, centerY: 40 }))
  icon.addChild(new Circle(12, { fill: '#e74c3c', centerX: 68, centerY: 62 }))
  return new ScreenIcon(icon, { fill: PreyColors.screenBackgroundColorProperty })
}
