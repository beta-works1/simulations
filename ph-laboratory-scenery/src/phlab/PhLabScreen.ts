import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PhLabModel } from './model/PhLabModel.js'
import { PhLabScreenView } from './view/PhLabScreenView.js'
import { PhLabConstants } from '../common/PhLabConstants.js'
import { PhLabStrings } from '../PhLabStrings.js'
import { PhLabColors } from '../common/PhLabColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class PhLabScreen extends Screen<PhLabModel, PhLabScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      PhLabConstants.SCREEN_OPTIONS,
      {
        name: PhLabStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: PhLabColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new PhLabModel(),
      (model) => new PhLabScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0f766e',
    cornerRadius: 12,
  })
  const strip = new Rectangle(40, 15, 20, 70, {
    fill: '#e74c3c',
    cornerRadius: 3,
  })
  iconNode.addChild(strip)
  return new ScreenIcon(iconNode, {
    fill: PhLabColors.screenBackgroundColorProperty,
  })
}
