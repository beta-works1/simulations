import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { AcidsPhScaleModel } from './model/AcidsPhScaleModel.js'
import { AcidsPhScaleScreenView } from './view/AcidsPhScaleScreenView.js'
import { AcidsConstants } from '../../shared/AcidsConstants.js'
import { AcidsPhScaleStrings } from './AcidsPhScaleStrings.js'
import { AcidsColors } from '../../shared/AcidsColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class AcidsPhScaleScreen extends Screen<AcidsPhScaleModel, AcidsPhScaleScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      AcidsConstants.SCREEN_OPTIONS,
      {
        name: AcidsPhScaleStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: AcidsColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new AcidsPhScaleModel(),
      (model) => new AcidsPhScaleScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0d9488',
    cornerRadius: 12,
  })
  const bars = new Node()
  const colors = ['#dc2626', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#7c3aed']
  colors.forEach((c, i) => {
    bars.addChild(new Rectangle(10 + i * 14, 44, 12, 34, { fill: c, cornerRadius: 2 }))
  })
  iconNode.addChild(bars)
  iconNode.addChild(
    new Circle(6, { fill: '#fff', stroke: '#0f172a', lineWidth: 1.5, centerX: 50, centerY: 28 }),
  )
  return new ScreenIcon(iconNode, {
    fill: AcidsColors.screenBackgroundColorProperty,
  })
}
