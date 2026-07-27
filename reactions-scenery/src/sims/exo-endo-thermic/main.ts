import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { ExoEndoStrings } from './ExoEndoStrings.js'
import { ExoEndoScreen } from './ExoEndoScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = ExoEndoStrings.titleStringProperty
  const screens = [new ExoEndoScreen()]

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
