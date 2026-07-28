import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { CurvedMirrorsModel } from './model/CurvedMirrorsModel.js'
import { CurvedMirrorsScreenView } from './view/CurvedMirrorsScreenView.js'
import { LightConstants } from '../../shared/LightConstants.js'
import { CurvedMirrorsStrings } from './CurvedMirrorsStrings.js'
import { LightColors } from '../../shared/LightColors.js'
import { OBJECT_COLOR, RAY_YELLOW } from '../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class CurvedMirrorsScreen extends Screen<CurvedMirrorsModel, CurvedMirrorsScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      LightConstants.SCREEN_OPTIONS,
      {
        name: CurvedMirrorsStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: LightColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(
      () => new CurvedMirrorsModel(),
      (model) => new CurvedMirrorsScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Path(new Shape().arc(78, 50, 30, Math.PI * 0.65, Math.PI * 1.35), {
    stroke: '#e2e8f0',
    lineWidth: 4,
  }))
  iconNode.addChild(new Path(new Shape().moveTo(22, 72).lineTo(22, 38), {
    stroke: OBJECT_COLOR,
    lineWidth: 3,
  }))
  iconNode.addChild(new Path(new Shape().moveTo(22, 38).lineTo(58, 38), {
    stroke: RAY_YELLOW,
    lineWidth: 2,
  }))
  return new ScreenIcon(iconNode, { fill: LightColors.screenBackgroundColorProperty })
}
