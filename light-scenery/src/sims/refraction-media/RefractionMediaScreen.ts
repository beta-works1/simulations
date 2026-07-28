import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { RefractionMediaModel } from './model/RefractionMediaModel.js'
import { RefractionMediaScreenView } from './view/RefractionMediaScreenView.js'
import { LightConstants } from '../../shared/LightConstants.js'
import { RefractionMediaStrings } from './RefractionMediaStrings.js'
import { LightColors } from '../../shared/LightColors.js'
import { RAY_CYAN, RAY_YELLOW } from '../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class RefractionMediaScreen extends Screen<RefractionMediaModel, RefractionMediaScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      LightConstants.SCREEN_OPTIONS,
      {
        name: RefractionMediaStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: LightColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(
      () => new RefractionMediaModel(),
      (model) => new RefractionMediaScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(0, 52, 100, 48, { fill: 'rgba(56,189,248,0.35)' }))
  iconNode.addChild(new Path(new Shape().moveTo(30, 22).lineTo(50, 52).lineTo(68, 72), {
    stroke: RAY_YELLOW,
    lineWidth: 3,
  }))
  iconNode.addChild(new Path(new Shape().moveTo(50, 52).lineTo(62, 78), {
    stroke: RAY_CYAN,
    lineWidth: 3,
  }))
  return new ScreenIcon(iconNode, { fill: LightColors.screenBackgroundColorProperty })
}
