import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { NeuronSignalStrings } from './NeuronSignalStrings.js'
import { NeuronSignalScreen } from './NeuronSignalScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = NeuronSignalStrings.titleStringProperty
  const screens = [new NeuronSignalScreen()]

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
