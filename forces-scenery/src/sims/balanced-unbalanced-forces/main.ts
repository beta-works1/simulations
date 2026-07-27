import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { BalancedForcesStrings } from './BalancedForcesStrings.js'
import { BalancedForcesScreen } from './BalancedForcesScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = BalancedForcesStrings.titleStringProperty
  const screens = [new BalancedForcesScreen()]

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
