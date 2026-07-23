import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { BrainMappingStrings } from './BrainMappingStrings.js'
import { BrainMappingScreen } from './BrainMappingScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = BrainMappingStrings.titleStringProperty
  const screens = [new BrainMappingScreen()]

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
