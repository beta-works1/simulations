import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { WindTurbineStrings } from './WindTurbineStrings.js'
import { WindTurbineScreen } from './WindTurbineScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = WindTurbineStrings.titleStringProperty
  const screens = [new WindTurbineScreen()]
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
