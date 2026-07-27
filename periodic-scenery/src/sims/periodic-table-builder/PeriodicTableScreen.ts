import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PeriodicTableModel } from './model/PeriodicTableModel.js'
import { PeriodicTableScreenView } from './view/PeriodicTableScreenView.js'
import { PeriodicConstants } from '../../shared/PeriodicConstants.js'
import { PeriodicTableStrings } from './PeriodicTableStrings.js'
import { PeriodicColors } from '../../shared/PeriodicColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class PeriodicTableScreen extends Screen<PeriodicTableModel, PeriodicTableScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      PeriodicConstants.SCREEN_OPTIONS,
      {
        name: PeriodicTableStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: PeriodicColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new PeriodicTableModel(),
      (model) => new PeriodicTableScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#083344',
    cornerRadius: 12,
  })
  const art = new Node()

  // Mini periodic-table tiles.
  const tileColors = ['#e74c3c', '#e67e22', '#3498db', '#27ae60']
  tileColors.forEach((fill, i) => {
    art.addChild(
      new Rectangle(10 + i * 14, 12, 12, 14, {
        cornerRadius: 2,
        fill,
        stroke: '#0f172a',
        lineWidth: 1,
      }),
    )
  })

  // Bohr model: nucleus with an orbiting shell of electrons.
  const cx = 66
  const cy = 66
  art.addChild(new Circle(30, { stroke: 'rgba(226,232,240,0.7)', lineWidth: 2, lineDash: [3, 3], x: cx, y: cy }))
  art.addChild(new Circle(9, { fill: '#dc2626', stroke: '#7f1d1d', lineWidth: 1.5, x: cx, y: cy }))
  art.addChild(new Text('+', { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#fff', centerX: cx, centerY: cy }))
  ;[0, Math.PI * 0.66, Math.PI * 1.33].forEach((angle) => {
    art.addChild(
      new Circle(5, {
        fill: '#38bdf8',
        stroke: '#0369a1',
        lineWidth: 1,
        x: cx + Math.cos(angle) * 30,
        y: cy + Math.sin(angle) * 30,
      }),
    )
  })

  iconNode.addChild(art)
  return new ScreenIcon(iconNode, {
    fill: PeriodicColors.screenBackgroundColorProperty,
  })
}
