export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface Simulation {
  id: string
  title: string
  grade: Grade
  chapter?: string
  description: string
  learningGoals: string[]
  keywords: string[]
  color: string
  accent: string
}

export const GRADES: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8]

export function gradeLabel(grade: Grade): string {
  return `Grade ${grade}`
}

export const simulations: Simulation[] = [
  {
    id: 'shapes-and-colors',
    title: 'Shapes & Colors',
    grade: 1,
    description: 'Explore basic shapes and colors through playful matching games.',
    learningGoals: [
      'Identify common shapes',
      'Name primary colors',
      'Sort objects by color and shape',
    ],
    keywords: ['shapes', 'colors', 'sorting', 'primary'],
    color: '#c0392b',
    accent: '#f1c40f',
  },
  {
    id: 'counting-1-to-20',
    title: 'Counting 1 to 20',
    grade: 1,
    description: 'Practice counting objects and recognizing numbers from 1 to 20.',
    learningGoals: [
      'Count objects up to 20',
      'Match numbers to quantities',
      'Order numbers from smallest to largest',
    ],
    keywords: ['counting', 'numbers', 'math'],
    color: '#2980b9',
    accent: '#2ecc71',
  },
  {
    id: 'plant-life',
    title: 'Plant Life',
    grade: 2,
    description: 'See how plants grow from seeds with water, light, and soil.',
    learningGoals: [
      'Name basic plant parts',
      'Explain what plants need to grow',
      'Observe a simple life cycle',
    ],
    keywords: ['plants', 'seeds', 'growth', 'biology'],
    color: '#1e8449',
    accent: '#a3e4d7',
  },
  {
    id: 'fraction-matcher',
    title: 'Fraction Matcher',
    grade: 3,
    description: 'Match shapes and numbers to earn stars while building fluency with equivalent fractions.',
    learningGoals: [
      'Identify equivalent fractions',
      'Compare fractions using visual models',
      'Connect area models to numerical forms',
    ],
    keywords: ['fractions', 'equivalence', 'ratio', 'numbers'],
    color: '#a04000',
    accent: '#8e44ad',
  },
  {
    id: 'balancing-act',
    title: 'Balancing Act',
    grade: 4,
    description: 'Play with objects on a teeter-totter to learn about balance and mass.',
    learningGoals: [
      'Explain balance using equal sides',
      'Predict which side will tip',
      'Connect balance ideas to everyday tools',
    ],
    keywords: ['balance', 'mass', 'forces'],
    color: '#1e8449',
    accent: '#3498db',
  },
  {
    id: 'build-an-atom',
    title: 'Build an Atom',
    grade: 5,
    description: 'Build atoms out of protons, neutrons, and electrons.',
    learningGoals: [
      'Identify protons, neutrons, and electrons',
      'Build simple atomic models',
      'Relate particle counts to atom identity',
    ],
    keywords: ['atom', 'electron', 'proton', 'chemistry'],
    color: '#0e6655',
    accent: '#e74c3c',
  },
  {
    id: 'circuit-construction',
    title: 'Circuit Construction Kit',
    grade: 6,
    description: 'Build circuits with batteries, resistors, light bulbs, and switches.',
    learningGoals: [
      'Construct simple series circuits',
      'Explain how a closed path makes a bulb light',
      'Identify open and closed circuits',
    ],
    keywords: ['electricity', 'current', 'circuits'],
    color: '#922b21',
    accent: '#f1c40f',
  },
  {
    id: 'projectile-motion',
    title: 'Projectile Motion',
    grade: 7,
    description: 'Blast a car out of a cannon and explore how angle and speed affect trajectories.',
    learningGoals: [
      'Describe a projectile path',
      'Relate launch angle to distance',
      'Explore motion under gravity',
    ],
    keywords: ['motion', 'gravity', 'trajectory'],
    color: '#1a5276',
    accent: '#f5a623',
  },
  {
    id: 'ph-scale',
    title: 'pH Scale',
    grade: 7,
    description: 'Test the pH of everyday liquids and explore acids and bases.',
    learningGoals: [
      'Classify substances as acidic, basic, or neutral',
      'Relate pH values to strength',
      'Compare household chemicals',
    ],
    keywords: ['acids', 'bases', 'pH', 'chemistry'],
    color: '#6c3483',
    accent: '#e67e22',
  },
  {
    id: 'graphing-lines',
    title: 'Graphing Lines',
    grade: 8,
    description: 'Investigate linear equations, slope, intercepts, and graphs.',
    learningGoals: [
      'Graph y = mx + b from slope and intercept',
      'Interpret slope as rate of change',
      'Write equations from graphs',
    ],
    keywords: ['algebra', 'slope', 'graph', 'linear'],
    color: '#7b241c',
    accent: '#2980b9',
  },
  {
    id: 'gravity-and-orbits',
    title: 'Gravity and Orbits',
    grade: 8,
    description: 'Move the sun, earth, and moon to see how mass and distance affect gravity.',
    learningGoals: [
      'Relate gravity to mass and distance',
      'Describe orbital motion qualitatively',
      'Model Earth–Moon–Sun relationships',
    ],
    keywords: ['gravity', 'orbit', 'planets', 'space'],
    color: '#1a252f',
    accent: '#5dade2',
  },
  {
    id: 'natural-selection',
    title: 'Natural Selection',
    grade: 8,
    description: 'Observe how traits spread in a population under environmental pressure.',
    learningGoals: [
      'Explain variation and selection',
      'Predict population change',
      'Connect traits to survival',
    ],
    keywords: ['evolution', 'adaptation', 'traits'],
    color: '#5b2c6f',
    accent: '#f39c12',
  },

  // Grade 8 — Ch 1 Ecology
  {
    id: 'carbon-oxygen-cycle',
    title: 'Carbon–Oxygen Cycle',
    grade: 8,
    chapter: 'Ch 1 – Ecology',
    description:
      'Animate carbon dioxide and oxygen flowing between atmosphere, plants, and animals through photosynthesis and respiration.',
    learningGoals: [
      'Trace CO₂ and O₂ through the cycle',
      'Relate photosynthesis to O₂ release',
      'Relate respiration to CO₂ release',
    ],
    keywords: ['ecology', 'photosynthesis', 'respiration', 'atmosphere'],
    color: '#1e8449',
    accent: '#5dade2',
  },
  {
    id: 'food-web-builder',
    title: 'Food Chain / Food Web',
    grade: 8,
    chapter: 'Ch 1 – Ecology',
    description:
      'Drag species, add producers and consumers, and watch energy flow through the food web.',
    learningGoals: [
      'Build a simple food chain and web',
      'Identify producers, consumers, decomposers',
      'Visualize energy transfer between species',
    ],
    keywords: ['food web', 'energy flow', 'trophic', 'ecology'],
    color: '#196f3d',
    accent: '#f1c40f',
  },
  {
    id: 'ecological-pyramid',
    title: 'Ecological Pyramid',
    grade: 8,
    chapter: 'Ch 1 – Ecology',
    description: 'See the 10% rule: how energy shrinks at each step up the ecological pyramid.',
    learningGoals: [
      'Explain the 10% energy rule',
      'Compare energy at trophic levels',
      'Connect pyramids to food webs',
    ],
    keywords: ['pyramid', '10% rule', 'energy', 'trophic levels'],
    color: '#145a32',
    accent: '#e67e22',
  },
  {
    id: 'predator-prey',
    title: 'Predator–Prey Dynamics',
    grade: 8,
    chapter: 'Ch 1 – Ecology',
    description:
      'Explore population oscillations for predation, and compare competition and mutualism.',
    learningGoals: [
      'Describe predator–prey cycles',
      'Compare predation, competition, mutualism',
      'Read a simple population graph',
    ],
    keywords: ['predator', 'prey', 'population', 'mutualism', 'competition'],
    color: '#0e6655',
    accent: '#e74c3c',
  },
  {
    id: 'global-warming',
    title: 'Global Warming Mechanism',
    grade: 8,
    chapter: 'Ch 1 – Ecology',
    description:
      'Raise greenhouse gases and watch sunlight and trapped infrared heat change Earth’s temperature.',
    learningGoals: [
      'Explain the greenhouse effect',
      'Relate gas levels to trapped heat',
      'Distinguish incoming sunlight from infrared',
    ],
    keywords: ['climate', 'greenhouse', 'CO2', 'global warming'],
    color: '#1a5276',
    accent: '#e74c3c',
  },

  // Grade 8 — Ch 2 Nervous system
  {
    id: 'reflex-arc',
    title: 'Reflex Arc',
    grade: 8,
    chapter: 'Ch 2 – Human Nervous System',
    description:
      'Fire a stimulus and follow the path receptor → spinal cord → effector, with or without brain involvement.',
    learningGoals: [
      'Order the steps of a reflex arc',
      'Contrast spinal vs brain-involved paths',
      'Identify receptor and effector',
    ],
    keywords: ['reflex', 'neuron', 'spinal cord', 'nervous system'],
    color: '#6c3483',
    accent: '#f5b041',
  },
  {
    id: 'neuron-signal',
    title: 'Neuron Signal Transmission',
    grade: 8,
    chapter: 'Ch 2 – Human Nervous System',
    description: 'Watch an electrical impulse travel along an axon and compare myelinated vs unmyelinated speed.',
    learningGoals: [
      'Describe impulse travel along a neuron',
      'Explain how myelin speeds conduction',
      'Name soma, axon, and terminal',
    ],
    keywords: ['neuron', 'axon', 'myelin', 'impulse'],
    color: '#5b2c6f',
    accent: '#5dade2',
  },
  {
    id: 'brain-mapping',
    title: 'Brain Region Mapping',
    grade: 8,
    chapter: 'Ch 2 – Human Nervous System',
    description: 'Click brain regions to map lobes and structures to actions like vision, balance, and planning.',
    learningGoals: [
      'Locate major brain regions',
      'Connect regions to functions',
      'Distinguish cerebrum, cerebellum, brain stem',
    ],
    keywords: ['brain', 'lobes', 'cerebellum', 'mapping'],
    color: '#4a235a',
    accent: '#85c1e9',
  },

  // Grade 8 — Ch 3 Heredity
  {
    id: 'mitosis-meiosis',
    title: 'Mitosis vs Meiosis',
    grade: 8,
    chapter: 'Ch 3 – Variation, Heredity, Cell Division',
    description: 'Step through stages of mitosis and meiosis and compare chromosome splitting and cell products.',
    learningGoals: [
      'Sequence mitosis stages',
      'Contrast mitosis and meiosis outcomes',
      'Relate meiosis to genetic variation',
    ],
    keywords: ['mitosis', 'meiosis', 'chromosomes', 'cell division'],
    color: '#922b21',
    accent: '#5dade2',
  },
  {
    id: 'dna-chromosome-gene',
    title: 'DNA → Chromosome → Gene',
    grade: 8,
    chapter: 'Ch 3 – Variation, Heredity, Cell Division',
    description: 'Zoom from a cell to nucleus, chromosome, DNA helix, and a highlighted gene.',
    learningGoals: [
      'Order cell → nucleus → chromosome → DNA → gene',
      'Describe DNA as a double helix',
      'Define a gene as a DNA segment',
    ],
    keywords: ['DNA', 'gene', 'chromosome', 'nucleus'],
    color: '#7b241c',
    accent: '#58d68d',
  },
  {
    id: 'punnett-square',
    title: 'Trait Inheritance',
    grade: 8,
    chapter: 'Ch 3 – Variation, Heredity, Cell Division',
    description: 'Use a Punnett square to predict dominant and recessive offspring traits.',
    learningGoals: [
      'Complete a monohybrid Punnett square',
      'Distinguish dominant and recessive alleles',
      'Estimate phenotype probabilities',
    ],
    keywords: ['Punnett', 'heredity', 'alleles', 'dominant', 'recessive'],
    color: '#a04000',
    accent: '#f39c12',
  },

  // Grade 8 — Ch 4 Biotechnology
  {
    id: 'plasmid-insertion',
    title: 'Genetic Engineering',
    grade: 8,
    chapter: 'Ch 4 – Biotechnology',
    description: 'Animate cutting a plasmid, inserting a gene, and transforming a bacterium.',
    learningGoals: [
      'Describe recombinant plasmid formation',
      'Explain bacterial transformation',
      'Outline steps of simple genetic engineering',
    ],
    keywords: ['plasmid', 'biotechnology', 'recombinant DNA', 'bacteria'],
    color: '#0e6655',
    accent: '#f4d03f',
  },
  {
    id: 'fermentation',
    title: 'Fermentation Process',
    grade: 8,
    chapter: 'Ch 4 – Biotechnology',
    description: 'Watch yeast convert sugar into carbon dioxide and alcohol over time.',
    learningGoals: [
      'Relate yeast + sugar to CO₂ and alcohol',
      'Describe how temperature affects fermentation rate',
      'Connect fermentation to biotechnology uses',
    ],
    keywords: ['fermentation', 'yeast', 'CO2', 'biotech'],
    color: '#7e5109',
    accent: '#f1c40f',
  },

  // Grade 8 — Ch 9 Light: Reflection & Refraction
  {
    id: 'laws-of-reflection',
    title: 'Laws of Reflection',
    grade: 8,
    chapter: 'Ch 9 – Light: Reflection & Refraction',
    description:
      'Explore how light reflects from a plane mirror and verify that the angle of incidence equals the angle of reflection.',
    learningGoals: [
      'Identify incident ray, reflected ray, and normal',
      'Verify ∠i = ∠r for a plane mirror',
      'Predict reflected ray direction from incidence angle',
    ],
    keywords: ['light', 'reflection', 'mirror', 'optics'],
    color: '#1a5276',
    accent: '#f4d03f',
  },
  {
    id: 'regular-vs-diffuse',
    title: 'Regular vs Diffuse Reflection',
    grade: 8,
    chapter: 'Ch 9 – Light: Reflection & Refraction',
    description:
      'Compare smooth and rough surfaces to see how regular reflection forms clear images and diffuse reflection scatters light.',
    learningGoals: [
      'Distinguish regular and diffuse reflection',
      'Relate surface texture to image clarity',
      'Explain why most everyday surfaces do not form sharp images',
    ],
    keywords: ['light', 'diffuse', 'regular', 'surface'],
    color: '#154360',
    accent: '#85c1e9',
  },
  {
    id: 'plane-mirror-periscope',
    title: 'Plane Mirror & Periscope',
    grade: 8,
    chapter: 'Ch 9 – Light: Reflection & Refraction',
    description:
      'Form a virtual image in a plane mirror, then trace rays through a two-mirror periscope.',
    learningGoals: [
      'Locate the virtual image behind a plane mirror',
      'Describe image properties (erect, same size)',
      'Explain how a periscope uses two reflections',
    ],
    keywords: ['mirror', 'periscope', 'image', 'optics'],
    color: '#1b4f72',
    accent: '#48c9b0',
  },
  {
    id: 'refraction-media',
    title: 'Refraction Through Media',
    grade: 8,
    chapter: 'Ch 9 – Light: Reflection & Refraction',
    description:
      'Bend a light ray as it travels from air into water or glass and apply Snell’s law live.',
    learningGoals: [
      'Describe refraction toward/away from the normal',
      'Relate refractive index to bending',
      'Predict ray direction when entering denser media',
    ],
    keywords: ['refraction', 'Snell', 'optics', 'glass', 'water'],
    color: '#0e6655',
    accent: '#5dade2',
  },
  {
    id: 'rainbow-dispersion',
    title: 'Rainbow Formation',
    grade: 8,
    chapter: 'Ch 9 – Light: Reflection & Refraction',
    description:
      'Watch white light disperse into a spectrum inside a raindrop to understand rainbow colors.',
    learningGoals: [
      'Explain dispersion of white light',
      'Relate droplet refraction and reflection to rainbows',
      'Order spectrum colors from the model',
    ],
    keywords: ['rainbow', 'dispersion', 'spectrum', 'optics'],
    color: '#6c3483',
    accent: '#f5b041',
  },
  {
    id: 'curved-mirrors',
    title: 'Concave & Convex Mirrors',
    grade: 8,
    chapter: 'Ch 9 – Light: Reflection & Refraction',
    description:
      'Move an object in front of concave and convex mirrors to see how image type and position change.',
    learningGoals: [
      'Identify focus and center of curvature',
      'Predict real vs virtual images from object distance',
      'Compare concave and convex mirror behavior',
    ],
    keywords: ['concave', 'convex', 'mirror', 'optics'],
    color: '#1a5276',
    accent: '#e74c3c',
  },

  // Grade 8 — Ch 10 Electricity & Magnetism
  {
    id: 'ohm-law-circuit',
    title: "Ohm's Law Circuit",
    grade: 8,
    chapter: 'Ch 10 – Electricity & Magnetism',
    description:
      'Build a simple circuit and relate voltage, current, and resistance with a glowing bulb.',
    learningGoals: [
      'Apply I = V / R',
      'Explain open vs closed circuits',
      'Relate current to bulb brightness',
    ],
    keywords: ['electricity', 'Ohm', 'current', 'voltage'],
    color: '#922b21',
    accent: '#f4d03f',
  },
  {
    id: 'series-parallel',
    title: 'Series vs Parallel Circuits',
    grade: 8,
    chapter: 'Ch 10 – Electricity & Magnetism',
    description:
      'Compare two-bulb series and parallel circuits to see how current and brightness change.',
    learningGoals: [
      'Contrast series and parallel paths',
      'Predict brightness differences',
      'Explain shared vs divided current',
    ],
    keywords: ['series', 'parallel', 'circuits', 'electricity'],
    color: '#7b241c',
    accent: '#f39c12',
  },
  {
    id: 'short-circuit-fuse',
    title: 'Short Circuit & Fuse',
    grade: 8,
    chapter: 'Ch 10 – Electricity & Magnetism',
    description:
      'Create a short circuit, watch current spike, and see how a fuse protects the circuit.',
    learningGoals: [
      'Describe what a short circuit is',
      'Explain the role of a fuse',
      'Relate overload to fuse blowing',
    ],
    keywords: ['fuse', 'short circuit', 'safety', 'electricity'],
    color: '#641e16',
    accent: '#ec7063',
  },
  {
    id: 'electric-motor',
    title: 'Electric Motor',
    grade: 8,
    chapter: 'Ch 10 – Electricity & Magnetism',
    description:
      'See how current in a magnetic field produces continuous rotation in a simple motor.',
    learningGoals: [
      'Relate current and magnetic field to force',
      'Explain conversion of electrical to mechanical energy',
      'Describe the role of the coil and magnets',
    ],
    keywords: ['motor', 'magnetism', 'electromagnetism'],
    color: '#1a5276',
    accent: '#e67e22',
  },
  {
    id: 'speaker-mechanism',
    title: 'Speaker Mechanism',
    grade: 8,
    chapter: 'Ch 10 – Electricity & Magnetism',
    description:
      'Drive an electromagnet with alternating current and watch the diaphragm launch sound waves.',
    learningGoals: [
      'Connect AC current to diaphragm motion',
      'Relate frequency to sound pitch',
      'Model electromagnet + coil speaker action',
    ],
    keywords: ['speaker', 'sound', 'electromagnet'],
    color: '#4a235a',
    accent: '#5dade2',
  },

  // Grade 8 — Ch 11 Technology in Everyday Life
  {
    id: 'solar-cooker',
    title: 'Solar Cooker',
    grade: 8,
    chapter: 'Ch 11 – Technology in Everyday Life',
    description:
      'Align a parabolic reflector so sunlight concentrates on a pot and temperature rises.',
    learningGoals: [
      'Explain concentration of solar energy by reflection',
      'Relate alignment to heating rate',
      'Connect renewable heat to everyday technology',
    ],
    keywords: ['solar', 'reflection', 'energy', 'technology'],
    color: '#b9770e',
    accent: '#f9e79f',
  },
  {
    id: 'wind-turbine',
    title: 'Wind Turbine',
    grade: 8,
    chapter: 'Ch 11 – Technology in Everyday Life',
    description:
      'Change wind speed to spin turbine blades and convert wind energy into electrical power.',
    learningGoals: [
      'Trace wind → mechanical → electrical conversion',
      'Relate wind speed to power output',
      'Describe renewable electricity generation',
    ],
    keywords: ['wind', 'turbine', 'energy', 'technology'],
    color: '#1e8449',
    accent: '#85c1e9',
  },

  // Grade 8 — Ch 12 Our Universe
  {
    id: 'star-life-cycle',
    title: 'Star Life Cycle',
    grade: 8,
    chapter: 'Ch 12 – Our Universe',
    description:
      'Follow a star from nebula to remnant and compare low-mass and high-mass death paths.',
    learningGoals: [
      'Sequence major stages of stellar evolution',
      'Compare low-mass and high-mass outcomes',
      'Identify white dwarf, neutron star, and black hole endpoints',
    ],
    keywords: ['star', 'nebula', 'supernova', 'universe'],
    color: '#1a252f',
    accent: '#f5b041',
  },
  {
    id: 'galaxy-types',
    title: 'Galaxy Types',
    grade: 8,
    chapter: 'Ch 12 – Our Universe',
    description: 'Compare spiral, elliptical, and irregular galaxies and their main features.',
    learningGoals: [
      'Classify galaxies by shape',
      'Describe spiral arm structure',
      'Contrast stellar distributions across types',
    ],
    keywords: ['galaxy', 'spiral', 'elliptical', 'universe'],
    color: '#0b5345',
    accent: '#a569bd',
  },
  {
    id: 'black-hole',
    title: 'Black Hole & Light Bending',
    grade: 8,
    chapter: 'Ch 12 – Our Universe',
    description:
      'Watch stellar collapse form a black hole and see how nearby light paths bend.',
    learningGoals: [
      'Describe black hole formation from massive stars',
      'Explain the idea of an event horizon',
      'Visualize gravitational bending of light',
    ],
    keywords: ['black hole', 'gravity', 'light', 'universe'],
    color: '#0d0d0d',
    accent: '#5dade2',
  },
  {
    id: 'solar-system-timeline',
    title: 'Solar System Timeline',
    grade: 8,
    chapter: 'Ch 12 – Our Universe',
    description:
      'Scrub a space exploration timeline from solar system formation to modern observatories.',
    learningGoals: [
      'Place major solar system eras in order',
      'Connect exploration milestones to discovery',
      'Appreciate scale of cosmic time',
    ],
    keywords: ['solar system', 'timeline', 'space', 'exploration'],
    color: '#1a252f',
    accent: '#58d68d',
  },
]

export function getSimulationById(id: string): Simulation | undefined {
  return simulations.find((s) => s.id === id)
}

export function getSimulationsByGrade(grade: Grade): Simulation[] {
  return simulations.filter((s) => s.grade === grade)
}

export function getRelatedSimulations(sim: Simulation, limit = 4): Simulation[] {
  const sameChapter = sim.chapter
    ? simulations.filter((s) => s.id !== sim.id && s.chapter === sim.chapter)
    : []
  const sameGrade = simulations.filter(
    (s) => s.id !== sim.id && s.grade === sim.grade && s.chapter !== sim.chapter,
  )
  return [...sameChapter, ...sameGrade].slice(0, limit)
}

export function isGrade(value: string | number): value is Grade {
  const n = typeof value === 'string' ? Number(value) : value
  return GRADES.includes(n as Grade)
}
