import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { StarLifeCycleStrings } from './StarLifeCycleStrings.js'
import { StarLifeCycleScreen } from './StarLifeCycleScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = StarLifeCycleStrings.titleStringProperty
  const screens = [new StarLifeCycleScreen()]
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
