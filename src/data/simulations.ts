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
  /** Cover image path (served from /public) */
  image: string
  /** Optional PhET-style single-file HTML for offline download */
  offlineHtml?: string
  /** When set, the play page embeds this SceneryStack HTML instead of the React canvas sim */
  sceneryHtml?: string
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
    image: '/covers/shapes-and-colors.svg',
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
    image: '/covers/counting-1-to-20.svg',
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
    image: '/covers/plant-life.svg',
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
    image: '/covers/fraction-matcher.svg',
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
    image: '/covers/balancing-act.svg',
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
    image: '/covers/build-an-atom.svg',
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
    image: '/covers/circuit-construction.svg',
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
    image: '/covers/projectile-motion.svg',
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
    image: '/covers/ph-scale.svg',
  },
  {
    id: 'graphing-lines',
    title: 'Graphing Lines',
    grade: 8,
    chapter: 'More Grade 8',
    description: 'Investigate linear equations, slope, intercepts, and graphs.',
    learningGoals: [
      'Graph y = mx + b from slope and intercept',
      'Interpret slope as rate of change',
      'Write equations from graphs',
    ],
    keywords: ['algebra', 'slope', 'graph', 'linear'],
    color: '#7b241c',
    accent: '#2980b9',
    image: '/covers/graphing-lines.svg',
  },
  {
    id: 'gravity-and-orbits',
    title: 'Gravity and Orbits',
    grade: 8,
    chapter: 'More Grade 8',
    description: 'Move the sun, earth, and moon to see how mass and distance affect gravity.',
    learningGoals: [
      'Relate gravity to mass and distance',
      'Describe orbital motion qualitatively',
      'Model Earth–Moon–Sun relationships',
    ],
    keywords: ['gravity', 'orbit', 'planets', 'space'],
    color: '#1a252f',
    accent: '#5dade2',
    image: '/covers/gravity-and-orbits.svg',
  },
  {
    id: 'natural-selection',
    title: 'Natural Selection',
    grade: 8,
    chapter: 'More Grade 8',
    description: 'Observe how traits spread in a population under environmental pressure.',
    learningGoals: [
      'Explain variation and selection',
      'Predict population change',
      'Connect traits to survival',
    ],
    keywords: ['evolution', 'adaptation', 'traits'],
    color: '#5b2c6f',
    accent: '#f39c12',
    image: '/covers/natural-selection.svg',
  },

  // Grade 8 — Ch 1 Ecology
  {
    id: 'carbon-oxygen-cycle',
    title: 'Carbon–Oxygen Cycle',
    grade: 8,
    chapter: 'Ch 1 – Ecology',
    description:
      'Explore how photosynthesis, respiration, decomposition, and combustion exchange CO₂ and O₂ — and how deforestation plus industry tip the balance.',
    learningGoals: [
      'Trace CO₂ and O₂ through photosynthesis, respiration, decomposition, and combustion',
      'See how day/night and forest cover change atmospheric gases',
      'Explain how burning fuels and cutting forests raise CO₂ and lower O₂',
    ],
    keywords: [
      'ecology',
      'photosynthesis',
      'respiration',
      'decomposition',
      'combustion',
      'atmosphere',
      'deforestation',
    ],
    color: '#1e8449',
    accent: '#5dade2',
    image: '/covers/carbon-oxygen-cycle.svg',
    sceneryHtml: '/downloads/carbon-oxygen-offline.html',
    offlineHtml: '/downloads/carbon-oxygen-offline.html',
  },
  {
    id: 'food-web-builder',
    title: 'Food Chain / Food Web',
    grade: 8,
    chapter: 'Ch 1 – Ecology',
    description:
      'Food chains and food webs show how energy and nutrients flow through an ecosystem — from plants to animals and finally to decomposers. Build a grassland web, compare a single chain to many linked paths, and identify producers, primary/secondary/tertiary consumers, and decomposers.',
    learningGoals: [
      'Define food chain vs. food web and give a grassland example',
      'Identify producers, primary consumers, secondary/tertiary consumers, and decomposers',
      'Describe energy flow through trophic levels (sun → producers → consumers → decomposers)',
      'Explain why diverse food webs make ecosystems more stable',
    ],
    keywords: [
      'food chain',
      'food web',
      'producer',
      'consumer',
      'decomposer',
      'trophic level',
      'energy flow',
      'ecology',
    ],
    color: '#196f3d',
    accent: '#f1c40f',
    image: '/covers/food-web-builder.svg',
    sceneryHtml: '/downloads/food-web-offline.html',
    offlineHtml: '/downloads/food-web-offline.html',
  },
  {
    id: 'ecological-pyramid',
    title: 'Ecological Pyramid',
    grade: 8,
    chapter: 'Ch 1 – Ecology',
    description:
      'See the 10% rule: at each trophic level some energy is lost as heat, so there is less energy and usually fewer organisms at higher levels — many plants, fewer herbivores, and very few top predators.',
    learningGoals: [
      'Explain the 10% energy rule between trophic levels',
      'Compare energy at producer, primary, secondary, and tertiary levels',
      'Connect pyramids to food chains and food webs',
      'Explain why ecosystems have fewer organisms at higher trophic levels',
    ],
    keywords: ['pyramid', '10% rule', 'energy', 'trophic levels', 'food web'],
    color: '#145a32',
    accent: '#e67e22',
    image: '/covers/ecological-pyramid.svg',
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
    image: '/covers/predator-prey.svg',
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
    image: '/covers/global-warming.svg',
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
    image: '/covers/reflex-arc.svg',
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
    image: '/covers/neuron-signal.svg',
  },
  {
    id: 'brain-mapping',
    title: 'Brain Region Mapping',
    grade: 8,
    chapter: 'Ch 2 – Human Nervous System',
    description:
      'Explore the cerebrum lobes, cerebellum, and brain stem — then quiz yourself on PTB Ch 2 functions.',
    learningGoals: [
      'Name the three main parts of the brain (cerebrum, cerebellum, brain stem)',
      'Map frontal, parietal, temporal, and occipital lobes to their functions',
      'Relate cerebellum to balance and brain stem to involuntary actions',
    ],
    keywords: ['brain', 'lobes', 'cerebellum', 'mapping'],
    color: '#4a235a',
    accent: '#85c1e9',
    image: '/covers/brain-mapping.svg',
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
    image: '/covers/mitosis-meiosis.svg',
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
    image: '/covers/dna-chromosome-gene.svg',
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
    image: '/covers/punnett-square.svg',
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
    image: '/covers/plasmid-insertion.svg',
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
    image: '/covers/fermentation.svg',
  },

  // Grade 8 — Ch 5 Periodic Table
  {
    id: 'periodic-table-builder',
    title: 'First 18 Elements',
    grade: 8,
    chapter: 'Ch 5 – Periodic Table',
    description:
      'Explore the first 18 elements on an interactive periodic table with Bohr models and electron configurations.',
    learningGoals: [
      'Locate elements in periods and groups',
      'Read electron configurations for simple atoms',
      'Relate atomic number to identity',
    ],
    keywords: ['periodic table', 'elements', 'electron configuration', 'atom'],
    color: '#1a5276',
    accent: '#58d68d',
    image: '/covers/periodic-table-builder.svg',
  },
  {
    id: 'metal-nonmetal',
    title: 'Metals vs Non-metals',
    grade: 8,
    chapter: 'Ch 5 – Periodic Table',
    description:
      'Compare conductivity and reactivity of metals and non-metals with animated electron flow and reaction demos.',
    learningGoals: [
      'Contrast metal and non-metal properties',
      'Relate conductivity to free electrons',
      'Describe reactivity trends qualitatively',
    ],
    keywords: ['metals', 'non-metals', 'conductivity', 'reactivity'],
    color: '#7b241c',
    accent: '#5dade2',
    image: '/covers/metal-nonmetal.svg',
  },

  // Grade 8 — Ch 6 Chemical Reactions
  {
    id: 'balance-equations',
    title: 'Balancing Equations',
    grade: 8,
    chapter: 'Ch 6 – Chemical Reactions',
    description:
      'Adjust coefficients until atoms match on both sides and see molecules rearrange while mass is conserved.',
    learningGoals: [
      'Balance simple chemical equations',
      'Count atoms on each side of a reaction',
      'Connect balancing to conservation of atoms',
    ],
    keywords: ['equations', 'balancing', 'stoichiometry', 'atoms'],
    color: '#0e6655',
    accent: '#f39c12',
    image: '/covers/balance-equations.svg',
  },
  {
    id: 'exo-endo-thermic',
    title: 'Exo vs Endothermic',
    grade: 8,
    chapter: 'Ch 6 – Chemical Reactions',
    description:
      'Watch a thermometer rise or fall as energy is released or absorbed during a reaction.',
    learningGoals: [
      'Distinguish exothermic and endothermic changes',
      'Relate temperature change to energy flow',
      'Interpret energy arrows into or out of a system',
    ],
    keywords: ['exothermic', 'endothermic', 'energy', 'thermometer'],
    color: '#922b21',
    accent: '#3498db',
    image: '/covers/exo-endo-thermic.svg',
  },
  {
    id: 'ionic-covalent-bonds',
    title: 'Ionic vs Covalent Bonds',
    grade: 8,
    chapter: 'Ch 6 – Chemical Reactions',
    description:
      'Animate electron transfer for ionic bonds and shared pairs for covalent bonds.',
    learningGoals: [
      'Describe electron transfer in ionic bonding',
      'Describe electron sharing in covalent bonding',
      'Contrast ionic and covalent models',
    ],
    keywords: ['ionic', 'covalent', 'bonds', 'electrons'],
    color: '#5b2c6f',
    accent: '#f4d03f',
    image: '/covers/ionic-covalent-bonds.svg',
  },
  {
    id: 'conservation-of-mass',
    title: 'Conservation of Mass',
    grade: 8,
    chapter: 'Ch 6 – Chemical Reactions',
    description:
      'Compare sealed and open systems to see why mass stays constant when nothing escapes.',
    learningGoals: [
      'State the law of conservation of mass',
      'Explain why sealed containers matter',
      'Relate reactants and products to total mass',
    ],
    keywords: ['conservation', 'mass', 'closed system', 'reaction'],
    color: '#1a252f',
    accent: '#58d68d',
    image: '/covers/conservation-of-mass.svg',
  },

  // Grade 8 — Ch 7 Acids, Bases, Salts
  {
    id: 'ph-laboratory',
    title: 'pH Laboratory',
    grade: 8,
    chapter: 'Ch 7 – Acids, Bases, Salts',
    description:
      'Drag substances, dip litmus paper, choose indicators, read a digital pH meter, neutralize acids and bases, mix solutions, and predict results.',
    learningGoals: [
      'Classify solutions as acidic, basic, or neutral using indicators and a pH meter',
      'Describe color changes for litmus, phenolphthalein, methyl orange, and universal indicator',
      'Explain neutralization by adding acid or base and watching pH move toward 7',
      'Predict mixture results and check them experimentally',
    ],
    keywords: [
      'pH',
      'laboratory',
      'litmus',
      'indicator',
      'neutralization',
      'acid',
      'base',
      'meter',
    ],
    color: '#0f766e',
    accent: '#f59e0b',
    image: '/covers/ph-laboratory.svg',
    sceneryHtml: '/downloads/ph-laboratory-offline.html',
    offlineHtml: '/downloads/ph-laboratory-offline.html',
  },
  {
    id: 'acids-ph-scale',
    title: 'Interactive pH Scale',
    grade: 8,
    chapter: 'Ch 7 – Acids, Bases, Salts',
    description:
      'Drag everyday substances onto a 0–14 pH scale and watch indicator colors change.',
    learningGoals: [
      'Classify substances as acid, base, or neutral',
      'Relate pH numbers to strength',
      'Predict indicator color from pH',
    ],
    keywords: ['pH', 'acids', 'bases', 'indicator'],
    color: '#6c3483',
    accent: '#e67e22',
    image: '/covers/acids-ph-scale.svg',
  },
  {
    id: 'acid-base-neutralization',
    title: 'Acid–Base Neutralization',
    grade: 8,
    chapter: 'Ch 7 – Acids, Bases, Salts',
    description:
      'Mix acid and base volumes and see the mixture approach salt, water, and pH 7.',
    learningGoals: [
      'Describe neutralization products',
      'Relate volumes to leftover acid or base',
      'Track pH toward neutral',
    ],
    keywords: ['neutralization', 'acid', 'base', 'salt'],
    color: '#1e8449',
    accent: '#e74c3c',
    image: '/covers/acid-base-neutralization.svg',
  },
  {
    id: 'natural-indicator',
    title: 'Natural Indicators',
    grade: 8,
    chapter: 'Ch 7 – Acids, Bases, Salts',
    description:
      'Test cabbage juice and turmeric indicators as acid or base drips change beaker color.',
    learningGoals: [
      'Explain how natural indicators work',
      'Link color change to acidic or basic media',
      'Compare cabbage and turmeric responses',
    ],
    keywords: ['indicator', 'cabbage', 'turmeric', 'color change'],
    color: '#7d3c98',
    accent: '#58d68d',
    image: '/covers/natural-indicator.svg',
  },

  // Grade 8 — Ch 8 Force and Pressure
  {
    id: 'balanced-unbalanced-forces',
    title: 'Balanced vs Unbalanced Forces',
    grade: 8,
    chapter: 'Ch 8 – Force and Pressure',
    description:
      'Change left and right forces on an object and see when it stays still or accelerates.',
    learningGoals: [
      'Identify balanced and unbalanced forces',
      'Relate net force to acceleration',
      'Predict motion from opposing forces',
    ],
    keywords: ['force', 'balanced', 'unbalanced', 'motion'],
    color: '#1a5276',
    accent: '#e74c3c',
    image: '/covers/balanced-unbalanced-forces.svg',
  },
  {
    id: 'floating-sinking',
    title: 'Floating and Sinking',
    grade: 8,
    chapter: 'Ch 8 – Force and Pressure',
    description:
      'Adjust object and fluid density to see objects float, sink, or suspend in a tank.',
    learningGoals: [
      'Relate density to floating and sinking',
      'Compare object density to fluid density',
      'Predict equilibrium depth qualitatively',
    ],
    keywords: ['density', 'buoyancy', 'float', 'sink'],
    color: '#1a5276',
    accent: '#5dade2',
    image: '/covers/floating-sinking.svg',
  },
  {
    id: 'pressure-force-area',
    title: 'Pressure = Force / Area',
    grade: 8,
    chapter: 'Ch 8 – Force and Pressure',
    description:
      'Vary force and contact area to see how pressure concentrates under a nail tip or spreads under a shoe.',
    learningGoals: [
      'Compute pressure from force and area',
      'Explain why sharp tips pierce more easily',
      'Connect everyday tools to P = F/A',
    ],
    keywords: ['pressure', 'force', 'area', 'contact'],
    color: '#7e5109',
    accent: '#f39c12',
    image: '/covers/pressure-force-area.svg',
  },
  {
    id: 'hydraulic-lift',
    title: 'Hydraulic Lift',
    grade: 8,
    chapter: 'Ch 8 – Force and Pressure',
    description:
      'Explore Pascal’s principle by changing piston areas and watching a small force lift a heavy load.',
    learningGoals: [
      'State Pascal’s principle qualitatively',
      'Relate F₁/A₁ to F₂/A₂',
      'Explain force multiplication in hydraulics',
    ],
    keywords: ['hydraulics', 'Pascal', 'pressure', 'pistons'],
    color: '#1a252f',
    accent: '#3498db',
    image: '/covers/hydraulic-lift.svg',
  },
  {
    id: 'water-pressure-depth',
    title: 'Water Pressure and Depth',
    grade: 8,
    chapter: 'Ch 8 – Force and Pressure',
    description:
      'Probe a water tank at different depths and see jets get stronger as pressure rises with depth.',
    learningGoals: [
      'Relate pressure to depth in a fluid',
      'Interpret P = ρgh qualitatively',
      'Compare jet strength at different depths',
    ],
    keywords: ['water pressure', 'depth', 'fluid', 'Pascal'],
    color: '#154360',
    accent: '#5dade2',
    image: '/covers/water-pressure-depth.svg',
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
    image: '/covers/laws-of-reflection.svg',
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
    image: '/covers/regular-vs-diffuse.svg',
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
    image: '/covers/plane-mirror-periscope.svg',
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
    image: '/covers/refraction-media.svg',
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
    image: '/covers/rainbow-dispersion.svg',
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
    image: '/covers/curved-mirrors.svg',
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
    image: '/covers/ohm-law-circuit.svg',
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
    image: '/covers/series-parallel.svg',
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
    image: '/covers/short-circuit-fuse.svg',
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
    image: '/covers/electric-motor.svg',
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
    image: '/covers/speaker-mechanism.svg',
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
    image: '/covers/solar-cooker.svg',
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
    image: '/covers/wind-turbine.svg',
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
    image: '/covers/star-life-cycle.svg',
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
    image: '/covers/galaxy-types.svg',
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
    image: '/covers/black-hole.svg',
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
    image: '/covers/solar-system-timeline.svg',
  },
]

export function getSimulationById(id: string): Simulation | undefined {
  return simulations.find((s) => s.id === id)
}

export function getSimulationsByGrade(grade: Grade): Simulation[] {
  return simulations.filter((s) => s.grade === grade)
}

/** Ordered Grade 8 chapter labels for browse UI. */
export const GRADE_8_CHAPTERS = [
  'Ch 1 – Ecology',
  'Ch 2 – Human Nervous System',
  'Ch 3 – Variation, Heredity, Cell Division',
  'Ch 4 – Biotechnology',
  'Ch 5 – Periodic Table',
  'Ch 6 – Chemical Reactions',
  'Ch 7 – Acids, Bases, Salts',
  'Ch 8 – Force and Pressure',
  'Ch 9 – Light: Reflection & Refraction',
  'Ch 10 – Electricity & Magnetism',
  'Ch 11 – Technology in Everyday Life',
  'Ch 12 – Our Universe',
  'More Grade 8',
] as const

export const OTHER_CHAPTER_ID = 'other'

export type GradeChapter = {
  id: string
  title: string
}

export type ChapterGroup = {
  chapter: string
  shortLabel: string
  items: Simulation[]
}

export function chapterIdFromTitle(chapter: string): string {
  if (chapter === 'More Grade 8') return OTHER_CHAPTER_ID
  return chapter
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function chapterShortLabel(chapter: string): string {
  const match = chapter.match(/^Ch\s+(\d+)/i)
  if (match) return `Ch ${match[1]}`
  if (chapter === 'More Grade 8') return 'More'
  return chapter
}

function chapterSortKey(title: string): number {
  const match = title.match(/Ch\s*(\d+)/i)
  return match ? Number(match[1]) : title === 'More Grade 8' ? 1000 : 999
}

/** Chapters available for a grade (empty when that grade has no chapter tags). */
export function getChaptersForGrade(grade: Grade): GradeChapter[] {
  const gradeSims = getSimulationsByGrade(grade)
  const byId = new Map<string, string>()
  let hasUntagged = false

  for (const sim of gradeSims) {
    if (sim.chapter?.trim()) {
      byId.set(chapterIdFromTitle(sim.chapter), sim.chapter.trim())
    } else {
      hasUntagged = true
    }
  }

  // Prefer textbook order for known Grade 8 chapters.
  const ordered: GradeChapter[] = []
  if (grade === 8) {
    for (const title of GRADE_8_CHAPTERS) {
      if (title === 'More Grade 8') continue
      const id = chapterIdFromTitle(title)
      if (byId.has(id)) {
        ordered.push({ id, title })
        byId.delete(id)
      }
    }
  }

  const extras = [...byId.entries()]
    .map(([id, title]) => ({ id, title }))
    .sort(
      (a, b) =>
        chapterSortKey(a.title) - chapterSortKey(b.title) || a.title.localeCompare(b.title),
    )

  const chapters = [...ordered, ...extras]
  if (chapters.length > 0 && hasUntagged) {
    chapters.push({ id: OTHER_CHAPTER_ID, title: 'More Grade 8' })
  }
  return chapters
}

export function getSimulationsByGradeChapter(
  grade: Grade,
  chapterId: string | null,
): Simulation[] {
  const all = getSimulationsByGrade(grade)
  if (!chapterId) return all
  if (chapterId === OTHER_CHAPTER_ID) return all.filter((s) => !s.chapter?.trim())
  return all.filter((s) => s.chapter && chapterIdFromTitle(s.chapter) === chapterId)
}

export function groupSimulationsByChapter(sims: Simulation[]): ChapterGroup[] {
  const map = new Map<string, Simulation[]>()
  for (const sim of sims) {
    const key = sim.chapter?.trim() || 'More Grade 8'
    const list = map.get(key) ?? []
    list.push(sim)
    map.set(key, list)
  }

  const groups: ChapterGroup[] = []
  for (const chapter of GRADE_8_CHAPTERS) {
    const items = map.get(chapter)
    if (items?.length) {
      groups.push({ chapter, shortLabel: chapterShortLabel(chapter), items })
      map.delete(chapter)
    }
  }
  for (const [chapter, items] of map) {
    groups.push({ chapter, shortLabel: chapterShortLabel(chapter), items })
  }
  return groups
}

export function getRelatedSimulations(sim: Simulation, limit = 4): Simulation[] {
  const sameChapter = sim.chapter
    ? simulations.filter((s) => s.id !== sim.id && s.chapter === sim.chapter)
    : []
  const sameGrade = simulations.filter(
    (s) =>
      s.id !== sim.id &&
      s.grade === sim.grade &&
      (!sim.chapter || s.chapter !== sim.chapter),
  )
  return [...sameChapter, ...sameGrade].slice(0, limit)
}

export function isGrade(value: string | number): value is Grade {
  const n = typeof value === 'string' ? Number(value) : value
  return GRADES.includes(n as Grade)
}
