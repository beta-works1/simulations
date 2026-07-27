import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PressureForceAreaModel } from './model/PressureForceAreaModel.js'
import { PressureForceAreaScreenView } from './view/PressureForceAreaScreenView.js'
import { ForcesConstants } from '../../shared/ForcesConstants.js'
import { PressureForceAreaStrings } from './PressureForceAreaStrings.js'
import { ForcesColors } from '../../shared/ForcesColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class PressureForceAreaScreen extends Screen<PressureForceAreaModel, PressureForceAreaScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ForcesConstants.SCREEN_OPTIONS,
      {
        name: PressureForceAreaStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ForcesColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new PressureForceAreaModel(),
      (model) => new PressureForceAreaScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(30, 58, 40, 8, { fill: '#bdc3c7' }))
  iconNode.addChild(new Rectangle(42, 22, 16, 36, { fill: '#85929e', stroke: '#f8fafc', lineWidth: 2 }))
  iconNode.addChild(new Rectangle(48, 58, 4, 8, { fill: '#e74c3c' }))
  return new ScreenIcon(iconNode, { fill: ForcesColors.screenBackgroundColorProperty })
}
