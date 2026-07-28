import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { ShortCircuitFuseStrings } from './ShortCircuitFuseStrings.js'
import { ShortCircuitFuseScreen } from './ShortCircuitFuseScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = ShortCircuitFuseStrings.titleStringProperty
  const screens = [new ShortCircuitFuseScreen()]
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
