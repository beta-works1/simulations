/** Genetic engineering pipeline steps (book p.39). */

export type PipelineStepId = 'donor' | 'plasmid' | 'recombinant' | 'bacterium' | 'protein'

export type PipelineStep = { id: PipelineStepId; label: string; detail: string }

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'donor',
    label: 'Donor gene',
    detail: 'Cut the useful gene from the donor organism’s DNA.',
  },
  {
    id: 'plasmid',
    label: 'Open plasmid',
    detail: 'Open a bacterial plasmid ring with the same restriction enzyme.',
  },
  {
    id: 'recombinant',
    label: 'Recombinant DNA',
    detail: 'Join the donor gene into the plasmid — recombinant DNA.',
  },
  {
    id: 'bacterium',
    label: 'Host bacterium',
    detail: 'Insert the recombinant plasmid into a bacterium.',
  },
  {
    id: 'protein',
    label: 'Useful protein',
    detail: 'The bacterium copies the gene and makes the desired protein.',
  },
]

export function clampPipeline(index: number): number {
  return Math.max(0, Math.min(PIPELINE_STEPS.length - 1, index))
}

export function pipelineAt(index: number): PipelineStep {
  return PIPELINE_STEPS[clampPipeline(index)]
}
