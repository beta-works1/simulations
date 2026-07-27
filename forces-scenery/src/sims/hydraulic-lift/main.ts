import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { HydraulicLiftStrings } from './HydraulicLiftStrings.js'
import { HydraulicLiftScreen } from './HydraulicLiftScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = HydraulicLiftStrings.titleStringProperty
  const screens = [new HydraulicLiftScreen()]

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
