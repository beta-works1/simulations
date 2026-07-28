import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { SpeakerMechanismModel } from './model/SpeakerMechanismModel.js'
import { SpeakerMechanismScreenView } from './view/SpeakerMechanismScreenView.js'
import { ElectricityConstants } from '../../shared/ElectricityConstants.js'
import { SpeakerMechanismStrings } from './SpeakerMechanismStrings.js'
import { ElectricityColors } from '../../shared/ElectricityColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class SpeakerMechanismScreen extends Screen<SpeakerMechanismModel, SpeakerMechanismScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ElectricityConstants.SCREEN_OPTIONS,
      {
        name: SpeakerMechanismStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ElectricityColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new SpeakerMechanismModel(), (model) => new SpeakerMechanismScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Circle(28, { stroke: '#94a3b8', lineWidth: 3, centerX: 40, centerY: 50 }))
  iconNode.addChild(new Path(new Shape().arc(70, 50, 18, -0.8, 0.8), { stroke: '#38bdf8', lineWidth: 2 }))
  iconNode.addChild(new Path(new Shape().arc(70, 50, 26, -0.8, 0.8), { stroke: '#38bdf8', lineWidth: 2 }))
  return new ScreenIcon(iconNode, { fill: ElectricityColors.screenBackgroundColorProperty })
}
