import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { FloatingSinkingStrings } from './FloatingSinkingStrings.js'
import { FloatingSinkingScreen } from './FloatingSinkingScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = FloatingSinkingStrings.titleStringProperty
  const screens = [new FloatingSinkingScreen()]

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
