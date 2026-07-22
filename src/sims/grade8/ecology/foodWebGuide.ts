/** Grade 8 ecology — food chains, food webs, and trophic roles. */

export const INTRO =
  'Food chains and food webs show how energy and nutrients flow through an ecosystem — from plants to animals and finally to decomposers.'

export const FOOD_CHAIN = {
  title: 'Food chain',
  body:
    'A food chain is a simple line that shows who eats whom and how energy moves from one organism to the next. ' +
    'Example: Sun → grass → grasshopper → frog → snake → eagle. ' +
    'A chain shows one possible path of energy.',
}

export const FOOD_WEB = {
  title: 'Food web',
  body:
    'A food web is a network of many connected food chains. ' +
    'In a grassland, grass is eaten by grasshoppers, rabbits, and mice; grasshoppers may be eaten by frogs or birds; ' +
    'frogs and mice can be eaten by snakes; snakes and birds can be eaten by eagles. ' +
    'A web is more realistic because animals usually eat more than one kind of food.',
}

export const PRODUCER = {
  title: 'Producer',
  body:
    'Green plants and algae make their own food using sunlight (photosynthesis). ' +
    'They are always the first step in a food chain and the base of every food web.',
}

export const PRIMARY_CONSUMER = {
  title: 'Primary consumer',
  body:
    'Herbivores that eat producers — for example grasshopper, rabbit, or goat. ' +
    'They occupy the second trophic level.',
}

export const SECONDARY_CONSUMER = {
  title: 'Secondary consumer',
  body:
    'Carnivores or omnivores that eat primary consumers — for example frog or lizard.',
}

export const TERTIARY_CONSUMER = {
  title: 'Tertiary consumer / apex predator',
  body:
    'Top predators that eat secondary consumers and are rarely eaten by others — for example eagle or lion.',
}

export const DECOMPOSER = {
  title: 'Decomposer',
  body:
    'Bacteria and fungi break down dead plants and animals and return nutrients to the soil, ' +
    'allowing plants to grow again. Without decomposers, dead matter would pile up.',
}

export const TROPHIC_LEVELS = {
  title: 'Trophic levels & energy flow',
  body:
    'Energy flows sun → producers → consumers → decomposers. ' +
    'Each step in a chain (producer, primary consumer, secondary consumer, etc.) is a trophic level. ' +
    'At each level some energy is used or lost as heat, so there is less energy and usually fewer organisms at higher levels — ' +
    'many plants, fewer herbivores, and very few top predators.',
}

export const WEB_STABILITY = {
  title: 'Why food webs matter',
  body:
    'Food webs make ecosystems more stable: if one species decreases, consumers can often switch to another food source. ' +
    'Removing a species (hunting, pollution, habitat loss) can affect others and change their numbers. ' +
    'Protecting every part of a food web helps keep the ecosystem healthy.',
}

export const LEVEL_LABELS: Record<'producer' | 'herbivore' | 'carnivore' | 'decomposer', string> = {
  producer: 'Producer',
  herbivore: 'Primary consumer',
  carnivore: 'Secondary / tertiary consumer',
  decomposer: 'Decomposer',
}

export const LEVEL_HINTS: Record<'producer' | 'herbivore' | 'carnivore' | 'decomposer', string> = {
  producer: 'Makes food from sunlight',
  herbivore: 'Eats producers (herbivore)',
  carnivore: 'Eats other animals',
  decomposer: 'Recycles dead matter',
}
