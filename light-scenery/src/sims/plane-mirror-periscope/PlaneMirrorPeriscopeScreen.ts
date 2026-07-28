import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PlaneMirrorPeriscopeModel } from './model/PlaneMirrorPeriscopeModel.js'
import { PlaneMirrorPeriscopeScreenView } from './view/PlaneMirrorPeriscopeScreenView.js'
import { LightConstants } from '../../shared/LightConstants.js'
import { PlaneMirrorPeriscopeStrings } from './PlaneMirrorPeriscopeStrings.js'
import { LightColors } from '../../shared/LightColors.js'
import { MIRROR_COLOR, OBJECT_COLOR, RAY_CYAN } from '../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class PlaneMirrorPeriscopeScreen extends Screen<PlaneMirrorPeriscopeModel, PlaneMirrorPeriscopeScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      LightConstants.SCREEN_OPTIONS,
      {
        name: PlaneMirrorPeriscopeStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: LightColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(
      () => new PlaneMirrorPeriscopeModel(),
      (model) => new PlaneMirrorPeriscopeScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(52, 14, 4, 72, { fill: MIRROR_COLOR }))
  iconNode.addChild(new Path(new Shape().moveTo(28, 72).lineTo(28, 42).lineTo(52, 42), {
    stroke: OBJECT_COLOR,
    lineWidth: 3,
  }))
  iconNode.addChild(new Path(new Shape().moveTo(72, 72).lineTo(72, 42).lineTo(52, 42), {
    stroke: RAY_CYAN,
    lineWidth: 2,
    lineDash: [4, 3],
  }))
  return new ScreenIcon(iconNode, { fill: LightColors.screenBackgroundColorProperty })
}
