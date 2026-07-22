import './brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PyramidStrings } from './PyramidStrings.js'
import { EcologicalPyramidScreen } from './pyramid/EcologicalPyramidScreen.js'

onReadyToLaunch(() => {
  const sim = new Sim(PyramidStrings.titleStringProperty, [new EcologicalPyramidScreen()], {
    credits: {
      leadDesign: 'SimLab',
      softwareDevelopment: 'SimLab',
      team: 'Built with SceneryStack (PhET framework)',
      thanks: 'Grade 8 ecology — ecological pyramids and the 10% energy rule.',
    },
  } satisfies SimOptions)
  sim.start()
})
