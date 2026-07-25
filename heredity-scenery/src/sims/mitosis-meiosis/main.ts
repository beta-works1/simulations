import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { MitosisMeiosisStrings } from './MitosisMeiosisStrings.js'
import { MitosisMeiosisScreen } from './MitosisMeiosisScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = MitosisMeiosisStrings.titleStringProperty
  const screens = [new MitosisMeiosisScreen()]

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
