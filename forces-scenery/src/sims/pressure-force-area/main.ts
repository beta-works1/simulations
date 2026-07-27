import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PressureForceAreaStrings } from './PressureForceAreaStrings.js'
import { PressureForceAreaScreen } from './PressureForceAreaScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = PressureForceAreaStrings.titleStringProperty
  const screens = [new PressureForceAreaScreen()]

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
