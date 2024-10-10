import type { AnyCircuitElement } from "circuit-json"

export type ProblemType =
  | "single-trace"
  | "traces"
  | "distant-single-trace"
  | "single-trace-multilayer"
  | "keyboards"

export type ProblemGenerator = {
  getExample: (params: { seed: number }) => Promise<AnyCircuitElement[]>
}
