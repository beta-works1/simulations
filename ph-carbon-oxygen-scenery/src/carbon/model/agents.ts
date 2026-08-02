/**
 * Placeable landscape agents — each plant / animal / factory is a toy students
 * drag onto the meadow. Counts and gas rates are derived from these agents.
 */

export type AgentKind = 'plant' | 'animal' | 'factory'

export interface LandscapeAgent {
  id: string
  kind: AgentKind
  /** Normalized X in the land band (0 = left of land, 1 = right). */
  nx: number
  /** Normalized Y in the land band (0 = hill top, 1 = ground). */
  ny: number
}

export const AGENT_LIMITS = {
  plant: 8,
  animal: 6,
  factory: 4,
} as const

let agentSeq = 0

export function nextAgentId(kind: AgentKind): string {
  agentSeq += 1
  return `${kind}-${agentSeq}`
}

export function countAgents(agents: readonly LandscapeAgent[], kind: AgentKind): number {
  return agents.filter((a) => a.kind === kind).length
}

/** Spread agents of one kind across the land band. */
export function layoutSlot(kind: AgentKind, index: number, total: number): { nx: number; ny: number } {
  const t = Math.max(1, total)
  if (kind === 'plant') {
    return {
      nx: 0.08 + (index / t) * 0.55 + ((index * 17) % 7) * 0.01,
      ny: 0.15 + ((index * 13) % 5) * 0.08,
    }
  }
  if (kind === 'animal') {
    return {
      nx: 0.12 + (index / t) * 0.5,
      ny: 0.72 + ((index % 2) * 0.08),
    }
  }
  return {
    nx: 0.62 + (index / Math.max(1, Math.min(t, 4))) * 0.32,
    ny: 0.55 + ((index % 2) * 0.1),
  }
}

export function buildAgentsForCounts(plants: number, animals: number, factories: number): LandscapeAgent[] {
  const out: LandscapeAgent[] = []
  const p = Math.min(AGENT_LIMITS.plant, Math.round(plants))
  const a = Math.min(AGENT_LIMITS.animal, Math.round(animals))
  const f = Math.min(AGENT_LIMITS.factory, Math.round(factories))
  for (let i = 0; i < p; i++) {
    const slot = layoutSlot('plant', i, p)
    out.push({ id: nextAgentId('plant'), kind: 'plant', ...slot })
  }
  for (let i = 0; i < a; i++) {
    const slot = layoutSlot('animal', i, a)
    out.push({ id: nextAgentId('animal'), kind: 'animal', ...slot })
  }
  for (let i = 0; i < f; i++) {
    const slot = layoutSlot('factory', i, f)
    out.push({ id: nextAgentId('factory'), kind: 'factory', ...slot })
  }
  return out
}

export function clampNorm(n: number): number {
  return Math.max(0.02, Math.min(0.98, n))
}
