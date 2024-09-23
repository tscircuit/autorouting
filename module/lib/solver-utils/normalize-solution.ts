import type { AnyCircuitElement } from "circuit-json"
import type { ProblemSolver, SolutionWithDebugInfo } from "./ProblemSolver"

export const normalizeSolution = async (
  $solverResult: ReturnType<ProblemSolver>,
): Promise<SolutionWithDebugInfo<AnyCircuitElement>> => {
  const solverResult = await $solverResult
  if ("solution" in solverResult) {
    return solverResult as any
  }
  return {
    solution: solverResult as AnyCircuitElement[],
  }
}
