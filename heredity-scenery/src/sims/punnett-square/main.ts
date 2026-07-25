import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PunnettSquareStrings } from './PunnettSquareStrings.js'
import { PunnettSquareScreen } from './PunnettSquareScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = PunnettSquareStrings.titleStringProperty
  const screens = [new PunnettSquareScreen()]

  const options: SimOptions = {
    credits: {
      leadDesign: 'SimLab',
      softwareDevelopment: 'SimLab',
      team: 'Built with SceneryStack (PhET framework)',
      thanks: 'Inspired by PhET Interactive Simulations, University of Colorado Boulder.',
    },
  }

  const sim = new Sim(titleStringProperty, screens, options)
  sim.start()
})
