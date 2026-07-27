import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Line, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { MetalNonmetalModel } from './model/MetalNonmetalModel.js'
import { MetalNonmetalScreenView } from './view/MetalNonmetalScreenView.js'
import { PeriodicConstants } from '../../shared/PeriodicConstants.js'
import { MetalNonmetalStrings } from './MetalNonmetalStrings.js'
import { PeriodicColors } from '../../shared/PeriodicColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class MetalNonmetalScreen extends Screen<MetalNonmetalModel, MetalNonmetalScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      PeriodicConstants.SCREEN_OPTIONS,
      {
        name: MetalNonmetalStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: PeriodicColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new MetalNonmetalModel(),
      (model) => new MetalNonmetalScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0b1628',
    cornerRadius: 12,
  })

  iconNode.addChild(
    new Rectangle(14, 30, 32, 22, {
      cornerRadius: 5,
      fill: '#95a5a6',
      stroke: '#334155',
      lineWidth: 2,
    }),
  )
  iconNode.addChild(
    new Rectangle(54, 30, 32, 22, {
      cornerRadius: 5,
      fill: '#e74c3c',
      stroke: '#334155',
      lineWidth: 2,
    }),
  )
  iconNode.addChild(new Line(14, 62, 46, 62, { stroke: '#f59e0b', lineWidth: 4, lineCap: 'round' }))
  iconNode.addChild(new Line(54, 62, 86, 62, { stroke: '#94a3b8', lineWidth: 4, lineCap: 'round' }))
  iconNode.addChild(new Circle(4, { fill: '#f1c40f', centerX: 24, centerY: 62 }))
  iconNode.addChild(new Circle(4, { fill: '#f1c40f', centerX: 36, centerY: 62 }))
  iconNode.addChild(new Circle(3.5, { fill: '#cbd5e1', centerX: 64, centerY: 62 }))
  iconNode.addChild(new Circle(3.5, { fill: '#cbd5e1', centerX: 76, centerY: 62 }))
  const sparkGroup = new Node()
  sparkGroup.addChild(new Circle(5, { fill: '#e74c3c', centerX: 26, centerY: 82, opacity: 0.85 }))
  iconNode.addChild(sparkGroup)

  return new ScreenIcon(iconNode, {
    fill: PeriodicColors.screenBackgroundColorProperty,
  })
}
