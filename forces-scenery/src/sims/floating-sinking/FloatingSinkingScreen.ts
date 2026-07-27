import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Rectangle, Circle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { FloatingSinkingModel } from './model/FloatingSinkingModel.js'
import { FloatingSinkingScreenView } from './view/FloatingSinkingScreenView.js'
import { ForcesConstants } from '../../shared/ForcesConstants.js'
import { FloatingSinkingStrings } from './FloatingSinkingStrings.js'
import { ForcesColors } from '../../shared/ForcesColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class FloatingSinkingScreen extends Screen<FloatingSinkingModel, FloatingSinkingScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ForcesConstants.SCREEN_OPTIONS,
      {
        name: FloatingSinkingStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ForcesColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new FloatingSinkingModel(),
      (model) => new FloatingSinkingScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(22, 28, 56, 50, { fill: 'rgba(52,152,219,0.4)', stroke: '#f8fafc', lineWidth: 2 }))
  iconNode.addChild(new Circle(12, { fill: '#f5b041', centerX: 50, centerY: 48 }))
  return new ScreenIcon(iconNode, { fill: ForcesColors.screenBackgroundColorProperty })
}
