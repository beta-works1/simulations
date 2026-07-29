import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { SolarSystemTimelineStrings } from './SolarSystemTimelineStrings.js'
import { SolarSystemTimelineScreen } from './SolarSystemTimelineScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = SolarSystemTimelineStrings.titleStringProperty
  const screens = [new SolarSystemTimelineScreen()]
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
