import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Line, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { ExoEndoModel } from './model/ExoEndoModel.js'
import { ExoEndoScreenView } from './view/ExoEndoScreenView.js'
import { ReactionsConstants } from '../../shared/ReactionsConstants.js'
import { ExoEndoStrings } from './ExoEndoStrings.js'
import { ReactionsColors } from '../../shared/ReactionsColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class ExoEndoScreen extends Screen<ExoEndoModel, ExoEndoScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ReactionsConstants.SCREEN_OPTIONS,
      {
        name: ExoEndoStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ReactionsColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new ExoEndoModel(),
      (model) => new ExoEndoScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0b1628',
    cornerRadius: 12,
  })

  // Beaker with a hot glow.
  iconNode.addChild(new Circle(20, { fill: 'rgba(239,68,68,0.35)', centerX: 34, centerY: 66 }))
  iconNode.addChild(
    new Rectangle(20, 46, 28, 30, {
      cornerRadius: 5,
      fill: '#ef4444',
      stroke: '#f8fafc',
      lineWidth: 2,
    }),
  )
  iconNode.addChild(new Rectangle(26, 40, 16, 8, { cornerRadius: 3, fill: '#f8fafc', opacity: 0.85 }))

  // Thermometer.
  iconNode.addChild(new Rectangle(70, 18, 8, 42, { cornerRadius: 4, fill: '#f8fafc' }))
  iconNode.addChild(new Rectangle(72, 30, 4, 30, { fill: '#38bdf8' }))
  iconNode.addChild(new Circle(9, { fill: '#38bdf8', stroke: '#f8fafc', lineWidth: 2, centerX: 74, centerY: 66 }))

  // Energy-out arrow above the beaker.
  iconNode.addChild(new Line(34, 40, 34, 20, { stroke: '#f59e0b', lineWidth: 4, lineCap: 'round' }))
  iconNode.addChild(new Line(28, 28, 34, 18, { stroke: '#f59e0b', lineWidth: 4, lineCap: 'round' }))
  iconNode.addChild(new Line(40, 28, 34, 18, { stroke: '#f59e0b', lineWidth: 4, lineCap: 'round' }))

  return new ScreenIcon(iconNode, {
    fill: ReactionsColors.screenBackgroundColorProperty,
  })
}
