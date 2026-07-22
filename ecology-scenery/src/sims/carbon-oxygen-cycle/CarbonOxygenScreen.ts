import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { CarbonOxygenModel } from './model/CarbonOxygenModel.js'
import { CarbonOxygenScreenView } from './view/CarbonOxygenScreenView.js'
import { EcologyConstants } from '../../shared/EcologyConstants.js'
import { EcologyColors } from '../../shared/EcologyColors.js'
import { CarbonOxygenStrings } from './CarbonOxygenStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class CarbonOxygenScreen extends Screen<CarbonOxygenModel, CarbonOxygenScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      EcologyConstants.SCREEN_OPTIONS,
      {
        name: CarbonOxygenStrings.screen.cycleStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: EcologyColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new CarbonOxygenModel(),
      (model) => new CarbonOxygenScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const icon = new Node()
  icon.addChild(
    new Rectangle(0, 0, 100, 100, {
      fill: '#87b8e8',
      cornerRadius: 12,
    }),
  )
  icon.addChild(
    new Rectangle(0, 62, 100, 38, {
      fill: '#4a7c46',
      cornerRadius: 0,
    }),
  )
  // Tree
  icon.addChild(
    new Rectangle(28, 48, 8, 22, {
      fill: '#6b3f24',
    }),
  )
  icon.addChild(
    new Circle(16, {
      fill: '#22a35a',
      centerX: 32,
      centerY: 42,
    }),
  )
  // Sun / CO2 hint
  icon.addChild(
    new Circle(10, {
      fill: '#f59e0b',
      centerX: 74,
      centerY: 28,
    }),
  )
  icon.addChild(
    new Circle(7, {
      fill: '#38bdf8',
      centerX: 78,
      centerY: 52,
    }),
  )
  return new ScreenIcon(icon, {
    fill: EcologyColors.screenBackgroundColorProperty,
  })
}
