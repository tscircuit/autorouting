import type { AnySoupElement } from "@tscircuit/soup"

export type ProblemType = "single-trace" | "traces"

export type ProblemGenerator = {
  getExample: (params: { seed: number }) => Promise<AnySoupElement[]>
  getExampleWithTscircuitSolution: (params: {
    seed: number
  }) => Promise<AnySoupElement[]>
}
