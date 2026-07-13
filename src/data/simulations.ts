export type Subject =
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'earth-and-space'
  | 'math-and-statistics'

/** Punjab Student Learning Outcomes / SNC-aligned grade bands */
export type GradeLevel = '6-8' | '9-10' | '11-12'

export interface Simulation {
  id: string
  title: string
  subject: Subject
  grades: GradeLevel[]
  description: string
  learningGoals: string[]
  keywords: string[]
  color: string
  accent: string
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  'earth-and-space': 'Earth Science',
  'math-and-statistics': 'Math',
}

export const GRADE_LABELS: Record<GradeLevel, string> = {
  '6-8': 'Grades 6–8',
  '9-10': 'Grades 9–10',
  '11-12': 'Grades 11–12',
}

export const SUBJECT_ICONS: Record<Subject, string> = {
  physics: '⚛',
  chemistry: '🧪',
  biology: '🧬',
  'earth-and-space': '🌍',
  'math-and-statistics': '📐',
}

export const simulations: Simulation[] = [
  {
    id: 'projectile-motion',
    title: 'Projectile Motion',
    subject: 'physics',
    grades: ['9-10', '11-12'],
    description:
      'Blast a car out of a cannon and challenge yourself to hit a target. Explore how angle, speed, and gravity affect trajectories.',
    learningGoals: [
      'Describe the path of a projectile under gravity',
      'Relate launch angle and speed to range and height',
      'Apply 2D motion concepts from Punjab SNC Physics',
    ],
    keywords: ['motion', 'gravity', 'trajectory', 'kinematics', 'forces'],
    color: '#1a5276',
    accent: '#f5a623',
  },
  {
    id: 'circuit-construction',
    title: 'Circuit Construction Kit',
    subject: 'physics',
    grades: ['6-8', '9-10'],
    description:
      'Build circuits with batteries, resistors, light bulbs, and switches. See current and voltage change in real time.',
    learningGoals: [
      'Construct series and parallel circuits',
      'Explain how resistance affects current',
      'Identify open and closed circuit paths',
    ],
    keywords: ['electricity', 'current', 'voltage', 'resistance', 'circuits'],
    color: '#922b21',
    accent: '#f1c40f',
  },
  {
    id: 'balancing-act',
    title: 'Balancing Act',
    subject: 'physics',
    grades: ['6-8', '9-10'],
    description:
      'Play with objects on a teeter-totter to learn about balance, torque, and centre of mass.',
    learningGoals: [
      'Explain equilibrium using forces and distances',
      'Predict which side of a balance will tip',
      'Connect torque ideas to everyday tools',
    ],
    keywords: ['balance', 'torque', 'forces', 'equilibrium', 'levers'],
    color: '#1e8449',
    accent: '#3498db',
  },
  {
    id: 'ph-scale',
    title: 'pH Scale',
    subject: 'chemistry',
    grades: ['9-10', '11-12'],
    description:
      'Test the pH of everyday liquids and explore acid–base chemistry on a logarithmic scale.',
    learningGoals: [
      'Classify substances as acidic, basic, or neutral',
      'Relate pH values to H⁺ concentration',
      'Compare household chemicals by strength',
    ],
    keywords: ['acids', 'bases', 'pH', 'solutions', 'indicators'],
    color: '#6c3483',
    accent: '#e67e22',
  },
  {
    id: 'build-an-atom',
    title: 'Build an Atom',
    subject: 'chemistry',
    grades: ['6-8', '9-10'],
    description:
      'Build atoms out of protons, neutrons, and electrons. Discover isotopes, ions, and the periodic table.',
    learningGoals: [
      'Identify protons, neutrons, and electrons',
      'Build neutral atoms and common ions',
      'Relate atomic number to element identity',
    ],
    keywords: ['atom', 'electron', 'proton', 'isotope', 'periodic table'],
    color: '#0e6655',
    accent: '#e74c3c',
  },
  {
    id: 'molecule-shapes',
    title: 'Molecule Shapes',
    subject: 'chemistry',
    grades: ['9-10', '11-12'],
    description:
      'Explore molecule shapes by building molecules in 3D and relating electron domains to geometry.',
    learningGoals: [
      'Predict molecular geometry from electron domains',
      'Distinguish bonded pairs from lone pairs',
      'Connect shape to polarity',
    ],
    keywords: ['molecules', 'VSEPR', 'geometry', 'bonds', '3D'],
    color: '#1c2833',
    accent: '#2ecc71',
  },
  {
    id: 'natural-selection',
    title: 'Natural Selection',
    subject: 'biology',
    grades: ['9-10', '11-12'],
    description:
      'Observe evolution in a population of rabbits with different traits under changing environments.',
    learningGoals: [
      'Explain how variation and selection drive adaptation',
      'Predict population change under environmental pressure',
      'Connect Punnett ideas to phenotype frequencies',
    ],
    keywords: ['evolution', 'adaptation', 'genes', 'traits', 'ecology'],
    color: '#5b2c6f',
    accent: '#f39c12',
  },
  {
    id: 'gene-expression',
    title: 'Gene Expression Essentials',
    subject: 'biology',
    grades: ['11-12'],
    description:
      'Explore how genes are transcribed and translated, and how expression can be regulated in cells.',
    learningGoals: [
      'Outline the path from DNA to protein',
      'Describe roles of mRNA, tRNA, and ribosomes',
      'Explain simple regulation of gene expression',
    ],
    keywords: ['DNA', 'RNA', 'protein', 'transcription', 'translation'],
    color: '#0b5345',
    accent: '#d35400',
  },
  {
    id: 'gravity-and-orbits',
    title: 'Gravity and Orbits',
    subject: 'earth-and-space',
    grades: ['6-8', '9-10'],
    description:
      'Move the sun, earth, moon, and space station to see how mass and distance affect gravity and orbits.',
    learningGoals: [
      'Relate gravitational force to mass and distance',
      'Describe orbital motion qualitatively',
      'Model Earth–Moon–Sun relationships',
    ],
    keywords: ['gravity', 'orbit', 'planets', 'space', 'astronomy'],
    color: '#1a252f',
    accent: '#5dade2',
  },
  {
    id: 'greenhouse-effect',
    title: 'The Greenhouse Effect',
    subject: 'earth-and-space',
    grades: ['6-8', '9-10', '11-12'],
    description:
      'Learn how greenhouse gases interact with sunlight and infrared radiation to warm Earth’s atmosphere.',
    learningGoals: [
      'Explain the greenhouse effect mechanism',
      'Identify major greenhouse gases',
      'Connect human activity to climate change',
    ],
    keywords: ['climate', 'atmosphere', 'CO2', 'energy', 'environment'],
    color: '#145a32',
    accent: '#2980b9',
  },
  {
    id: 'graphing-lines',
    title: 'Graphing Lines',
    subject: 'math-and-statistics',
    grades: ['6-8', '9-10'],
    description:
      'Investigate the relationships between linear equations, slope, intercepts, and graphs.',
    learningGoals: [
      'Graph y = mx + b from slope and intercept',
      'Interpret slope as rate of change',
      'Write equations from graphs and points',
    ],
    keywords: ['algebra', 'slope', 'graph', 'linear', 'equations'],
    color: '#7b241c',
    accent: '#2980b9',
  },
  {
    id: 'fraction-matcher',
    title: 'Fraction Matcher',
    subject: 'math-and-statistics',
    grades: ['6-8'],
    description:
      'Match shapes and numbers to earn stars while building fluency with equivalent fractions.',
    learningGoals: [
      'Identify equivalent fractions',
      'Compare fractions using visual models',
      'Connect area models to numerical forms',
    ],
    keywords: ['fractions', 'equivalence', 'ratio', 'numbers', 'geometry'],
    color: '#a04000',
    accent: '#8e44ad',
  },
]

export function getSimulationById(id: string): Simulation | undefined {
  return simulations.find((s) => s.id === id)
}

export function getRelatedSimulations(sim: Simulation, limit = 4): Simulation[] {
  return simulations
    .filter((s) => s.id !== sim.id && s.subject === sim.subject)
    .slice(0, limit)
}
