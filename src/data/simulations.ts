export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface Simulation {
  id: string
  title: string
  grade: Grade
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
]

export function getSimulationById(id: string): Simulation | undefined {
  return simulations.find((s) => s.id === id)
}

export function getSimulationsByGrade(grade: Grade): Simulation[] {
  return simulations.filter((s) => s.grade === grade)
}

export function getRelatedSimulations(sim: Simulation, limit = 4): Simulation[] {
  return simulations.filter((s) => s.id !== sim.id && s.grade === sim.grade).slice(0, limit)
}

export function isGrade(value: string | number): value is Grade {
  const n = typeof value === 'string' ? Number(value) : value
  return GRADES.includes(n as Grade)
}
