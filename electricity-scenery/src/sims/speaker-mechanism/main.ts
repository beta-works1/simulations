import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { SpeakerMechanismStrings } from './SpeakerMechanismStrings.js'
import { SpeakerMechanismScreen } from './SpeakerMechanismScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = SpeakerMechanismStrings.titleStringProperty
  const screens = [new SpeakerMechanismScreen()]
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
