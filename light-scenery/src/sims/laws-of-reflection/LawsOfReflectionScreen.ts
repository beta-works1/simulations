import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { LawsOfReflectionModel } from './model/LawsOfReflectionModel.js'
import { LawsOfReflectionScreenView } from './view/LawsOfReflectionScreenView.js'
import { LightConstants } from '../../shared/LightConstants.js'
import { LawsOfReflectionStrings } from './LawsOfReflectionStrings.js'
import { LightColors } from '../../shared/LightColors.js'
import { MIRROR_COLOR, RAY_CYAN, RAY_YELLOW } from '../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class LawsOfReflectionScreen extends Screen<LawsOfReflectionModel, LawsOfReflectionScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      LightConstants.SCREEN_OPTIONS,
      {
        name: LawsOfReflectionStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: LightColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new LawsOfReflectionModel(),
      (model) => new LawsOfReflectionScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(10, 58, 80, 4, { fill: MIRROR_COLOR }))
  iconNode.addChild(new Path(new Shape().moveTo(22, 28).lineTo(50, 58).lineTo(78, 28), {
    stroke: RAY_YELLOW,
    lineWidth: 3,
    lineCap: 'round',
  }))
  iconNode.addChild(new Path(new Shape().moveTo(50, 58).lineTo(78, 28), {
    stroke: RAY_CYAN,
    lineWidth: 3,
    lineCap: 'round',
  }))
  return new ScreenIcon(iconNode, { fill: LightColors.screenBackgroundColorProperty })
}
