import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { ReflexArcStrings } from './ReflexArcStrings.js'
import { ReflexArcScreen } from './ReflexArcScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = ReflexArcStrings.titleStringProperty
  const screens = [new ReflexArcScreen()]

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
