import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { NeutralizationStrings } from './NeutralizationStrings.js'
import { NeutralizationScreen } from './NeutralizationScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = NeutralizationStrings.titleStringProperty
  const screens = [new NeutralizationScreen()]

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
