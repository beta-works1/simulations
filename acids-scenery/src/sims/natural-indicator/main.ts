import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { NaturalIndicatorStrings } from './NaturalIndicatorStrings.js'
import { NaturalIndicatorScreen } from './NaturalIndicatorScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = NaturalIndicatorStrings.titleStringProperty
  const screens = [new NaturalIndicatorScreen()]

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
