/** Simple food-web links: grass → rabbit → fox (book p.4). */

export type LinkId = 'grass-rabbit' | 'rabbit-fox' | 'grass-insect' | 'insect-fox'

export type FoodLink = { id: LinkId; from: string; to: string; label: string }

export const FOOD_LINKS: FoodLink[] = [
  { id: 'grass-rabbit', from: 'Grass', to: 'Rabbit', label: 'Grass → Rabbit' },
  { id: 'rabbit-fox', from: 'Rabbit', to: 'Fox', label: 'Rabbit → Fox' },
  { id: 'grass-insect', from: 'Grass', to: 'Insect', label: 'Grass → Insect' },
  { id: 'insect-fox', from: 'Insect', to: 'Fox', label: 'Insect → Fox' },
]

/** Toggle a link in / out of the active set. */
export function toggleLink(active: readonly LinkId[], id: LinkId): LinkId[] {
  return active.includes(id) ? active.filter((x) => x !== id) : [...active, id]
}

/** Classic producer → primary → secondary chain present. */
export function hasGrassRabbitFox(active: readonly LinkId[]): boolean {
  return active.includes('grass-rabbit') && active.includes('rabbit-fox')
}

export function activeLinkCount(active: readonly LinkId[]): number {
  return active.length
}
