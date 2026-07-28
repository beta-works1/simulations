import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { RainbowDispersionModel } from './model/RainbowDispersionModel.js'
import { RainbowDispersionScreenView } from './view/RainbowDispersionScreenView.js'
import { LightConstants } from '../../shared/LightConstants.js'
import { RainbowDispersionStrings } from './RainbowDispersionStrings.js'
import { LightColors } from '../../shared/LightColors.js'
import { SPECTRUM } from '../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class RainbowDispersionScreen extends Screen<RainbowDispersionModel, RainbowDispersionScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      LightConstants.SCREEN_OPTIONS,
      {
        name: RainbowDispersionStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: LightColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(
      () => new RainbowDispersionModel(),
      (model) => new RainbowDispersionScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Circle(28, { fill: 'rgba(56,189,248,0.45)', centerX: 58, centerY: 50 }))
  SPECTRUM.forEach((band, i) => {
    iconNode.addChild(new Path(new Shape().moveTo(18, 48).lineTo(78, 30 + i * 6), {
      stroke: band.color,
      lineWidth: 2,
    }))
  })
  return new ScreenIcon(iconNode, { fill: LightColors.screenBackgroundColorProperty })
}
