import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { CurvedMirrorsStrings } from './CurvedMirrorsStrings.js'
import { CurvedMirrorsScreen } from './CurvedMirrorsScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = CurvedMirrorsStrings.titleStringProperty
  const screens = [new CurvedMirrorsScreen()]

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
