import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { LawsOfReflectionStrings } from './LawsOfReflectionStrings.js'
import { LawsOfReflectionScreen } from './LawsOfReflectionScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = LawsOfReflectionStrings.titleStringProperty
  const screens = [new LawsOfReflectionScreen()]

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
