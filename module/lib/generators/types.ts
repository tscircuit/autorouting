import type { AnySoupElement } from "@tscircuit/soup"

export type ProblemType = "single-trace" | "traces" | "distant-single-trace"

export type ProblemGenerator = {
  getExample: (params: { seed: number }) => Promise<AnySoupElement[]>
}
