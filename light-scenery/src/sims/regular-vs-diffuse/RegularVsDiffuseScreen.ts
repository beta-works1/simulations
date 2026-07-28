import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { RegularVsDiffuseModel } from './model/RegularVsDiffuseModel.js'
import { RegularVsDiffuseScreenView } from './view/RegularVsDiffuseScreenView.js'
import { LightConstants } from '../../shared/LightConstants.js'
import { RegularVsDiffuseStrings } from './RegularVsDiffuseStrings.js'
import { LightColors } from '../../shared/LightColors.js'
import { MIRROR_COLOR, RAY_CYAN, RAY_YELLOW } from '../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class RegularVsDiffuseScreen extends Screen<RegularVsDiffuseModel, RegularVsDiffuseScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      LightConstants.SCREEN_OPTIONS,
      {
        name: RegularVsDiffuseStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: LightColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(
      () => new RegularVsDiffuseModel(),
      (model) => new RegularVsDiffuseScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(10, 58, 80, 4, { fill: MIRROR_COLOR }))
  for (let i = 0; i < 5; i++) {
    const x = 18 + i * 16
    iconNode.addChild(new Path(new Shape().moveTo(x, 20).lineTo(x + 4, 58).lineTo(x + 8, 24), {
      stroke: i < 3 ? RAY_YELLOW : RAY_CYAN,
      lineWidth: 2,
    }))
  }
  return new ScreenIcon(iconNode, { fill: LightColors.screenBackgroundColorProperty })
}
