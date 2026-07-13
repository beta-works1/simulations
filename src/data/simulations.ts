export type Subject =
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'earth-and-space'
  | 'math-and-statistics'

export interface Simulation {
  id: string
  title: string
  subject: Subject
  description: string
  color: string
  accent: string
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  'earth-and-space': 'Earth & Space',
  'math-and-statistics': 'Math & Statistics',
}

export const simulations: Simulation[] = [
  {
    id: 'projectile-motion',
    title: 'Projectile Motion',
    subject: 'physics',
    description: 'Blast a car out of a cannon and challenge yourself to hit a target.',
    color: '#4a90d9',
    accent: '#f5a623',
  },
  {
    id: 'circuit-construction',
    title: 'Circuit Construction Kit',
    subject: 'physics',
    description: 'Build circuits with batteries, resistors, light bulbs, and switches.',
    color: '#e74c3c',
    accent: '#f1c40f',
  },
  {
    id: 'balancing-act',
    title: 'Balancing Act',
    subject: 'physics',
    description: 'Play with objects on a teeter totter to learn about balance.',
    color: '#27ae60',
    accent: '#3498db',
  },
  {
    id: 'ph-scale',
    title: 'pH Scale',
    subject: 'chemistry',
    description: 'Test the pH of everyday liquids and explore acid-base chemistry.',
    color: '#9b59b6',
    accent: '#e67e22',
  },
  {
    id: 'build-an-atom',
    title: 'Build an Atom',
    subject: 'chemistry',
    description: 'Build atoms out of protons, neutrons, and electrons.',
    color: '#1abc9c',
    accent: '#e74c3c',
  },
  {
    id: 'molecule-shapes',
    title: 'Molecule Shapes',
    subject: 'chemistry',
    description: 'Explore molecule shapes by building molecules in 3D.',
    color: '#34495e',
    accent: '#2ecc71',
  },
  {
    id: 'natural-selection',
    title: 'Natural Selection',
    subject: 'biology',
    description: 'Observe evolution in a population of bunnies with different traits.',
    color: '#8e44ad',
    accent: '#f39c12',
  },
  {
    id: 'gene-expression',
    title: 'Gene Expression Essentials',
    subject: 'biology',
    description: 'Explore how genes are expressed and regulated in cells.',
    color: '#16a085',
    accent: '#d35400',
  },
  {
    id: 'gravity-and-orbits',
    title: 'Gravity and Orbits',
    subject: 'earth-and-space',
    description: 'Move the sun, earth, moon and space station to see how it affects gravity.',
    color: '#2c3e50',
    accent: '#3498db',
  },
  {
    id: 'greenhouse-effect',
    title: 'The Greenhouse Effect',
    subject: 'earth-and-space',
    description: 'Learn how greenhouse gases affect Earth\'s temperature.',
    color: '#27ae60',
    accent: '#2980b9',
  },
  {
    id: 'graphing-lines',
    title: 'Graphing Lines',
    subject: 'math-and-statistics',
    description: 'Explore the world of lines. Investigate the relationships between linear equations, slope, and graphs.',
    color: '#c0392b',
    accent: '#2980b9',
  },
  {
    id: 'fraction-matcher',
    title: 'Fraction Matcher',
    subject: 'math-and-statistics',
    description: 'Match shapes and numbers to earn stars in this fractions game.',
    color: '#d35400',
    accent: '#8e44ad',
  },
]
