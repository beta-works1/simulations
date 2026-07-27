import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PeriodicTableStrings } from './PeriodicTableStrings.js'
import { PeriodicTableScreen } from './PeriodicTableScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = PeriodicTableStrings.titleStringProperty
  const screens = [new PeriodicTableScreen()]

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
